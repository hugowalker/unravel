export type Detection = {
  box: [number, number, number, number];
  confidence: number;
};
export type Mode =
  "IDLE" | "SEARCHING" | "ACQUIRING" | "TRACKING" | "LOST" | "MANUAL";
export const clamp = (x: number, a: number, b: number) =>
  Math.max(a, Math.min(b, x));
export function trackingInputs(errorX: number, errorY: number, fov = 55) {
  const horizontalFov =
    (2 * Math.atan((Math.tan((fov * Math.PI) / 360) * 16) / 9) * 180) / Math.PI;
  const azimuthWeight = horizontalFov * 2.4;
  const pitchWeight = -fov * 2.4;
  return {
    azimuthWeight,
    pitchWeight,
    azimuthRate: clamp(
      Math.abs(errorX) > 0.025 ? errorX * azimuthWeight : 0,
      -42,
      42,
    ),
    pitchRate: clamp(
      Math.abs(errorY) > 0.025 ? errorY * pitchWeight : 0,
      -30,
      30,
    ),
  };
}
export class Controller {
  pan = 0;
  tilt = 8;
  mode: Mode = "IDLE";
  hits = 0;
  missing = 0;
  direction = 1;
  searchRow = 0;
  lastKnown: { pan: number; tilt: number } | null = null;
  reacquiring = false;
  fastRecovery = false;
  centreTarget = true;
  fastSearching = false;
  limits = { pan: [-160, 160], tilt: [-15, 55] };
  reset() {
    this.pan = 0;
    this.tilt = 8;
    this.mode = "IDLE";
    this.hits = 0;
    this.missing = 0;
    this.searchRow = 0;
    this.direction = 1;
    this.lastKnown = null;
    this.reacquiring = false;
    this.fastSearching = false;
  }
  update(
    d: Detection | null,
    dt: number,
    enabled: boolean,
    manual: boolean,
    fov = 55,
  ) {
    dt = clamp(dt, 0, 0.15);
    if (!enabled) {
      this.mode = "IDLE";
      return;
    }
    if (manual) {
      this.mode = "MANUAL";
      this.hits = 0;
      return;
    }
    if (d) {
      this.reacquiring = false;
      this.fastSearching = false;
      this.hits++;
      this.missing = 0;
      this.mode = this.hits >= 3 ? "TRACKING" : "ACQUIRING";
      const ex = d.box[0] + d.box[2] / 2 - 0.5,
        ey = d.box[1] + d.box[3] / 2 - 0.5;
      if (this.mode === "TRACKING" && this.centreTarget) {
        const command = trackingInputs(ex, ey, fov);
        this.pan += command.azimuthRate * dt;
        this.tilt += command.pitchRate * dt;
      }
      if (this.mode === "TRACKING")
        this.lastKnown = { pan: this.pan, tilt: this.tilt };
    } else {
      this.hits = 0;
      this.missing += dt;
      if (
        this.mode === "TRACKING" ||
        this.mode === "ACQUIRING" ||
        this.mode === "LOST"
      ) {
        this.mode = "LOST";
        if (this.missing < (this.fastRecovery ? 0.15 : 0.65)) return;
      }
      this.mode = "SEARCHING";
      if (this.lastKnown && this.fastRecovery) {
        this.direction = this.lastKnown.pan >= 0 ? -1 : 1;
        this.fastSearching = true;
        this.lastKnown = null;
      }
      if (this.lastKnown && this.missing < 6) {
        this.reacquiring = true;
        const left = Math.max(this.limits.pan[0], this.lastKnown.pan - 25);
        const right = Math.min(this.limits.pan[1], this.lastKnown.pan + 25);
        this.pan = clamp(this.pan + this.direction * 25 * dt, left, right);
        if (this.pan >= right) this.direction = -1;
        else if (this.pan <= left) this.direction = 1;
        this.tilt = clamp(
          this.lastKnown.tilt,
          this.limits.tilt[0],
          this.limits.tilt[1],
        );
        return;
      }
      this.reacquiring = false;
      this.lastKnown = null;
      this.pan += this.direction * (this.fastSearching ? 180 : 35) * dt;
      if (this.pan >= 160 || this.pan <= -160) {
        this.direction *= -1;
        this.searchRow = (this.searchRow + 1) % 3;
      }
      this.tilt +=
        clamp(([8, 25, -5][this.searchRow] - this.tilt) * 2, -20, 20) * dt;
    }
    this.pan = clamp(this.pan, ...(this.limits.pan as [number, number]));
    this.tilt = clamp(this.tilt, ...(this.limits.tilt as [number, number]));
  }
}

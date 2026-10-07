import { trackingInputs } from "./control";
import type { Model } from "./vision";

export function drawNetwork(
  canvas: HTMLCanvasElement,
  model: Model | null,
  input: number[] | null,
  confidence: number | null,
) {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '12px "IBM Plex Sans", sans-serif';
  ctx.fillStyle = "#999";
  ctx.fillText("Silhouette", 20, 25);
  ctx.fillText("8 strongest weights", 158, 25);
  for (let r = 0; r < 16; r++)
    for (let c = 0; c < 16; c++) {
      ctx.fillStyle = `rgba(255,153,85,${0.06 + (input?.[r * 16 + c] ?? 0) * 0.94})`;
      ctx.fillRect(20 + c * 7, 53 + r * 7, 6, 6);
    }
  const ranked = model
    ? model.weights
        .map((weight, index) => ({ weight, index, value: input?.[index] ?? 0 }))
        .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
        .slice(0, 8)
    : [];
  ranked.forEach((item, i) => {
    const y = 52 + i * 20;
    ctx.strokeStyle =
      input && item.value > 0
        ? item.weight >= 0
          ? "#ff9955"
          : "#888"
        : "#383838";
    ctx.lineWidth = 0.7 + Math.min(2, Math.abs(item.weight * item.value));
    ctx.beginPath();
    ctx.moveTo(237, y);
    ctx.lineTo(302, 122);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(232, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,153,85,${0.15 + item.value * 0.85})`;
    ctx.fill();
    ctx.fillStyle = "#aaa";
    ctx.fillText(
      item.index === 256
        ? "aspect"
        : `r${Math.floor(item.index / 16) + 1} c${(item.index % 16) + 1}`,
      158,
      y + 4,
    );
  });
  ctx.strokeStyle = model ? "#ff9955" : "#444";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(330, 122, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#ddd";
  ctx.font = '24px "IBM Plex Sans", sans-serif';
  ctx.fillText("σ", 323, 129);
  ctx.beginPath();
  ctx.moveTo(358, 122);
  ctx.lineTo(386, 122);
  ctx.strokeStyle = "#444";
  ctx.stroke();
  ctx.font = '12px "IBM Plex Sans", sans-serif';
  ctx.fillStyle = "#aaa";
  ctx.fillText(
    model?.targetLabel ? model.targetLabel.toUpperCase() : "NO MODEL",
    391,
    92,
  );
  ctx.font = '25px "IBM Plex Sans", sans-serif';
  ctx.fillStyle = "#ff9955";
  ctx.fillText(
    confidence === null ? "—" : `${(confidence * 100).toFixed(1)}%`,
    391,
    129,
  );
  ctx.font = '11px "IBM Plex Sans", sans-serif';
  ctx.fillStyle = "#888";
  ctx.fillText("Match score", 391, 151);
  ctx.fillText(`Aspect: ${input ? (input[256] * 3).toFixed(2) : "—"}`, 20, 197);
  ctx.fillText(`Bias: ${model ? model.bias.toFixed(2) : "—"}`, 304, 197);
  if (input && model) {
    const z =
      model.bias + model.weights.reduce((sum, w, i) => sum + w * input[i], 0);
    ctx.fillText(`Weighted sum: ${z.toFixed(2)}`, 304, 218);
  }
}

export function drawControlNetwork(
  canvas: HTMLCanvasElement,
  errorX: number | null,
  errorY: number | null,
  azimuthRate: number,
  pitchRate: number,
  mode: string,
) {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#171717";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '12px "IBM Plex Sans", sans-serif';
  const weights = trackingInputs(errorX ?? 0, errorY ?? 0);
  const rows = [
    {
      y: 70,
      label: "Horizontal error",
      error: errorX,
      gain: weights.azimuthWeight,
      rate: azimuthRate,
      axis: "Azimuth",
    },
    {
      y: 174,
      label: "Vertical error",
      error: errorY,
      gain: weights.pitchWeight,
      rate: pitchRate,
      axis: "Pitch",
    },
  ];
  for (const row of rows) {
    ctx.strokeStyle = row.error === null ? "#555" : "#ff9955";
    ctx.lineWidth = 1 + Math.min(3, Math.abs(row.rate) / 15);
    ctx.beginPath();
    ctx.moveTo(76, row.y);
    ctx.lineTo(214, row.y);
    ctx.moveTo(266, row.y);
    ctx.lineTo(397, row.y);
    ctx.stroke();
    for (const [x, radius] of [
      [60, 16],
      [240, 26],
      [415, 18],
    ]) {
      ctx.beginPath();
      ctx.arc(x, row.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#24201d";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.fillStyle = "#aaa";
    ctx.textAlign = "center";
    ctx.fillText(row.label, 60, row.y - 26);
    ctx.fillText("Fixed gain", 240, row.y - 35);
    ctx.fillText(row.axis + " command", 415, row.y - 27);
    ctx.fillStyle = "#ff9955";
    ctx.fillText(
      row.error === null ? "—" : (row.error * 100).toFixed(1) + "%",
      60,
      row.y + 36,
    );
    ctx.fillText("× " + row.gain.toFixed(1), 240, row.y + 4);
    ctx.fillText(row.rate.toFixed(1) + "°/s", 415, row.y + 36);
  }
  ctx.textAlign = "left";
  ctx.fillStyle = "#aaa";
  ctx.fillText(mode, 20, 232);
}

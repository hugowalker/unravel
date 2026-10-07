import type { Model } from "./vision";

export function drawNetwork(
  canvas: HTMLCanvasElement,
  model: Model | null,
  input: number[] | null,
  confidence: number | null,
  motion: {
    pan: number;
    pitch: number;
    azimuthRate: number;
    pitchRate: number;
    errorX: number | null;
    errorY: number | null;
    mode: string;
  },
) {
  const ctx = canvas.getContext("2d")!;
  const width = canvas.width,
    height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#171717";
  ctx.fillRect(0, 0, width, height);
  ctx.font = '12px "IBM Plex Sans", sans-serif';
  ctx.fillStyle = "#aaa";
  ctx.fillText("Camera shape", 24, 24);
  const cell = 8,
    top = 42;
  for (let j = 0; j < 16; j++)
    for (let i = 0; i < 16; i++) {
      const value = input?.[j * 16 + i] ?? 0;
      ctx.fillStyle = `rgba(255,153,85,${0.07 + value * 0.93})`;
      ctx.fillRect(24 + i * cell, top + j * cell, cell - 1, cell - 1);
    }
  ctx.fillStyle = "#aaa";
  ctx.fillText(
    `Aspect ratio: ${input ? (input[256] * 3).toFixed(2) : "—"}`,
    24,
    194,
  );
  ctx.fillText("256 shape cells + aspect ratio", 24, 220);
  const ranked = model
    ? model.weights
        .map((weight, index) => ({ weight, index, value: input?.[index] ?? 0 }))
        .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
        .slice(0, 12)
    : [];
  ranked.forEach((item, i) => {
    ctx.strokeStyle =
      input && item.value > 0
        ? item.weight >= 0
          ? "#ff9955"
          : "#8c8c8c"
        : "#333";
    ctx.lineWidth = input
      ? Math.min(3, 0.5 + Math.abs(item.weight * item.value))
      : 0.6;
    ctx.beginPath();
    ctx.moveTo(172, 45 + i * 12);
    ctx.lineTo(355, 118);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(172, 45 + i * 12, 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,153,85,${0.12 + item.value * 0.88})`;
    ctx.fill();
    ctx.strokeStyle = "#777";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = '9px "IBM Plex Sans", sans-serif';
    ctx.fillStyle = "#aaa";
    ctx.fillText(
      item.index === 256
        ? "aspect"
        : `r${Math.floor(item.index / 16) + 1} c${(item.index % 16) + 1}`,
      181,
      48 + i * 12,
    );
  });
  ctx.font = '12px "IBM Plex Sans", sans-serif';
  ctx.fillStyle = "#aaa";
  ctx.fillText("Pattern importance", 196, 24);
  ctx.fillText("Strongest → weakest", 196, 220);
  ctx.strokeStyle = model ? "#ff9955" : "#555";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(392, 118, 37, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = '25px "IBM Plex Sans", sans-serif';
  ctx.fillStyle = "#ddd";
  ctx.fillText("σ", 385, 126);
  ctx.font = '12px "IBM Plex Sans", sans-serif';
  ctx.fillStyle = "#aaa";
  ctx.fillText("Recognition unit", 339, 24);
  ctx.fillText(`Bias: ${model ? model.bias.toFixed(2) : "—"}`, 355, 220);
  ctx.strokeStyle = "#555";
  ctx.beginPath();
  ctx.moveTo(429, 118);
  ctx.lineTo(490, 118);
  ctx.stroke();
  ctx.fillStyle = "#ddd";
  ctx.fillText(
    model?.targetLabel ? model.targetLabel.toUpperCase() : "NO MODEL",
    505,
    92,
  );
  ctx.font = '28px "IBM Plex Sans", sans-serif';
  ctx.fillStyle = "#ff9955";
  ctx.fillText(
    confidence === null ? "—" : `${(confidence * 100).toFixed(1)}%`,
    505,
    131,
  );
  ctx.font = '12px "IBM Plex Sans", sans-serif';
  ctx.fillStyle = "#aaa";
  ctx.fillText("Match score", 505, 157);
  ctx.strokeStyle = "#383838";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, 245);
  ctx.lineTo(656, 245);
  ctx.stroke();
  ctx.fillStyle = "#aaa";
  ctx.fillText("Where is the object?", 24, 274);
  ctx.fillText(
    `Horizontal: ${motion.errorX === null ? "—" : (motion.errorX * 100).toFixed(1) + "%"}`,
    24,
    303,
  );
  ctx.fillText(
    `Vertical: ${motion.errorY === null ? "—" : (motion.errorY * 100).toFixed(1) + "%"}`,
    24,
    326,
  );
  ctx.strokeStyle = "#555";
  ctx.strokeRect(267, 270, 161, 70);
  ctx.fillStyle = "#ddd";
  ctx.fillText("Camera controller", 282, 298);
  ctx.fillStyle = "#ff9955";
  ctx.fillText(motion.mode, 282, 321);
  ctx.strokeStyle = "#ff9955";
  ctx.beginPath();
  ctx.moveTo(199, 309);
  ctx.lineTo(267, 309);
  ctx.moveTo(428, 309);
  ctx.lineTo(461, 309);
  ctx.lineTo(461, 280);
  ctx.lineTo(487, 280);
  ctx.moveTo(461, 309);
  ctx.lineTo(461, 342);
  ctx.lineTo(487, 342);
  ctx.stroke();
  ctx.strokeStyle = "#555";
  ctx.beginPath();
  ctx.moveTo(544, 176);
  ctx.lineTo(544, 253);
  ctx.lineTo(350, 253);
  ctx.lineTo(350, 270);
  ctx.stroke();
  for (const [y, rate] of [
    [276, motion.azimuthRate],
    [339, motion.pitchRate],
  ]) {
    ctx.beginPath();
    ctx.arc(490, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,153,85,${0.15 + Math.min(1, Math.abs(rate) / 42) * 0.85})`;
    ctx.fill();
    ctx.strokeStyle = "#ff9955";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.fillStyle = "#ddd";
  ctx.fillText(`Azimuth: ${motion.pan.toFixed(1)}°`, 505, 276);
  ctx.fillText(`Pitch: ${motion.pitch.toFixed(1)}°`, 505, 339);
  ctx.fillStyle = "#ff9955";
  ctx.fillText(`${motion.azimuthRate.toFixed(1)}°/s`, 505, 297);
  ctx.fillText(`${motion.pitchRate.toFixed(1)}°/s`, 505, 360);
  ctx.fillStyle = "#aaa";
  ctx.fillText("Two motor axes · bounded speeds and travel", 24, 383);
  if (input && model) {
    const z =
      model.bias + model.weights.reduce((sum, w, i) => sum + w * input[i], 0);
    ctx.fillText(`Weighted sum z = ${z.toFixed(2)}`, 310, 194);
  }
}

import { trackingInputs } from "./control";
import type { Model } from "./vision";

export function drawNetwork(
  canvas: HTMLCanvasElement,
  model: Model | null,
  input: number[] | null,
  confidence: number | null,
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
    ctx.moveTo(262, 45 + i * 12);
    ctx.lineTo(355, 118);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(258, 45 + i * 12, 4, 0, Math.PI * 2);
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
  if (input && model) {
    const z =
      model.bias + model.weights.reduce((sum, w, i) => sum + w * input[i], 0);
    ctx.fillText(`Weighted sum z = ${z.toFixed(2)}`, 310, 194);
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
      y: 53,
      label: "Horizontal error",
      error: errorX,
      gain: weights.azimuthWeight,
      rate: azimuthRate,
      axis: "Azimuth",
    },
    {
      y: 125,
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
    ctx.moveTo(106, row.y);
    ctx.lineTo(292, row.y);
    ctx.moveTo(348, row.y);
    ctx.lineTo(533, row.y);
    ctx.stroke();
    for (const [x, radius] of [
      [90, 16],
      [320, 28],
      [550, 17],
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
    ctx.fillText(row.label, 90, row.y - 26);
    ctx.fillText("Fixed gain", 320, row.y - 35);
    ctx.fillText(row.axis + " command", 550, row.y - 27);
    ctx.fillStyle = "#ff9955";
    ctx.fillText(
      row.error === null ? "—" : (row.error * 100).toFixed(1) + "%",
      90,
      row.y + 36,
    );
    ctx.fillText("× " + row.gain.toFixed(1), 320, row.y + 4);
    ctx.fillText(row.rate.toFixed(1) + "°/s", 550, row.y + 36);
  }
  ctx.textAlign = "left";
  ctx.fillStyle = "#aaa";
  ctx.fillText(mode + " · 2.5% deadband · speed and travel limits", 24, 188);
}

import type { Detection } from "./control";
export const FEATURE_SIZE = 16;
export type Model = {
  version: 1;
  weights: number[];
  bias: number;
  accuracy: number;
  samples: number;
  trainedAt: string;
};
const sigmoid = (x: number) =>
  1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x))));
export function features(
  mask: Uint8Array,
  w: number,
  h: number,
  box: [number, number, number, number],
): number[] {
  const [x, y, bw, bh] = box;
  const out: number[] = [];
  for (let j = 0; j < FEATURE_SIZE; j++)
    for (let i = 0; i < FEATURE_SIZE; i++) {
      let n = 0,
        s = 0;
      const x0 = Math.floor(x + (i * bw) / FEATURE_SIZE),
        x1 = Math.max(x0 + 1, Math.ceil(x + ((i + 1) * bw) / FEATURE_SIZE));
      const y0 = Math.floor(y + (j * bh) / FEATURE_SIZE),
        y1 = Math.max(y0 + 1, Math.ceil(y + ((j + 1) * bh) / FEATURE_SIZE));
      for (let yy = y0; yy < Math.min(h, y1); yy++)
        for (let xx = x0; xx < Math.min(w, x1); xx++) {
          s += mask[yy * w + xx] || 0;
          n++;
        }
      out.push(n ? s / n : 0);
    }
  out.push(Math.min(3, bw / bh) / 3);
  return out;
}
export function score(model: Model, x: number[]) {
  let z = model.bias;
  for (let i = 0; i < x.length; i++) z += x[i] * model.weights[i];
  return sigmoid(z);
}
export function train(
  samples: { x: number[]; y: number }[],
  validation: { x: number[]; y: number }[],
): Model {
  if (!samples.length || !validation.length)
    throw new Error("Training and validation sets must both contain samples.");
  const weights = new Array(FEATURE_SIZE ** 2 + 1).fill(0);
  let bias = 0;
  // Balanced, deterministic full-batch logistic regression. No geometry is used at inference.
  for (let epoch = 0; epoch < 180; epoch++) {
    const grad = new Float64Array(weights.length);
    let gb = 0;
    for (const { x, y } of samples) {
      let z = bias;
      for (let j = 0; j < x.length; j++) z += weights[j] * x[j];
      const err = sigmoid(z) - y;
      gb += err;
      for (let j = 0; j < x.length; j++) grad[j] += err * x[j];
    }
    const lr = 0.32 / (1 + epoch * 0.008);
    bias -= (lr * gb) / samples.length;
    for (let j = 0; j < weights.length; j++)
      weights[j] -= lr * (grad[j] / samples.length + 0.002 * weights[j]);
  }
  const model: Model = {
    version: 1,
    weights,
    bias,
    accuracy: 0,
    samples: samples.length,
    trainedAt: new Date().toISOString(),
  };
  model.accuracy =
    validation.filter((s) => (score(model, s.x) >= 0.5 ? 1 : 0) === s.y)
      .length / validation.length;
  return model;
}
export function maskImage(image: ImageData, threshold = 145) {
  const mask = new Uint8Array(image.width * image.height);
  for (let i = 0; i < mask.length; i++) {
    const p = i * 4;
    mask[i] =
      0.2126 * image.data[p] +
        0.7152 * image.data[p + 1] +
        0.0722 * image.data[p + 2] >
      threshold
        ? 1
        : 0;
  }
  return mask;
}
export function bounds(
  mask: Uint8Array,
  w: number,
  h: number,
): [number, number, number, number] | null {
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (mask[y * w + x]) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
  return x1 >= x0 ? [x0, y0, x1 - x0 + 1, y1 - y0 + 1] : null;
}
export function detect(
  image: ImageData,
  model: Model,
  threshold = 0.65,
): Detection | null {
  const { width: w, height: h } = image;
  const mask = maskImage(image);
  const connected = new Uint8Array(mask.length);
  // Join small raster gaps between arms, motors and propellers; classification still uses the original silhouette.
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (mask[y * w + x])
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const xx = x + dx,
              yy = y + dy;
            if (xx >= 0 && xx < w && yy >= 0 && yy < h)
              connected[yy * w + xx] = 1;
          }
  const visited = new Uint8Array(w * h);
  let best: Detection | null = null;
  for (let i = 0; i < mask.length; i++) {
    if (!connected[i] || visited[i]) continue;
    const q = [i];
    visited[i] = 1;
    let x0 = w,
      y0 = h,
      x1 = 0,
      y1 = 0;
    for (let k = 0; k < q.length; k++) {
      const p = q[k],
        x = p % w,
        y = Math.floor(p / w);
      if (mask[p]) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const xx = x + dx,
          yy = y + dy,
          n = yy * w + xx;
        if (
          xx >= 0 &&
          xx < w &&
          yy >= 0 &&
          yy < h &&
          connected[n] &&
          !visited[n]
        ) {
          visited[n] = 1;
          q.push(n);
        }
      }
    }
    const bw = x1 - x0 + 1,
      bh = y1 - y0 + 1;
    if (q.length < 12 || bw < 6 || bh < 3) continue;
    const confidence = score(model, features(mask, w, h, [x0, y0, bw, bh]));
    if (confidence >= threshold && (!best || confidence > best.confidence))
      best = { box: [x0 / w, y0 / h, bw / w, bh / h], confidence };
  }
  return best;
}

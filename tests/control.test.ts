import { test } from "node:test";
import assert from "node:assert/strict";
import { Controller, trackingInputs } from "../src/control";
import { train, score, features, bounds, detect } from "../src/vision";
test("acquires only after repeated observations, corrects right/up error", () => {
  const c = new Controller();
  const d = {
    box: [0.65, 0.1, 0.1, 0.1] as [number, number, number, number],
    confidence: 0.9,
  };
  c.update(d, 0.1, true, false);
  assert.equal(c.mode, "ACQUIRING");
  c.update(d, 0.1, true, false);
  c.update(d, 0.1, true, false);
  assert.equal(c.mode, "TRACKING");
  assert.ok(c.pan > 0);
  assert.ok(c.tilt > 8);
});
test("loss holds then returns to search, respecting limits", () => {
  const c = new Controller();
  c.mode = "TRACKING";
  c.update(null, 0.1, true, false);
  assert.equal(c.mode, "LOST");
  assert.equal(c.pan, 0);
  for (let i = 0; i < 10000; i++) c.update(null, 0.1, true, false);
  assert.equal(c.mode, "SEARCHING");
  assert.ok(c.pan >= -160 && c.pan <= 160);
  assert.ok(c.tilt >= -15 && c.tilt <= 55);
});
test("paused control does not move and centered detection has no drift", () => {
  const c = new Controller();
  c.update(null, 0.1, false, false);
  assert.equal(c.pan, 0);
  for (let i = 0; i < 10; i++)
    c.update(
      { box: [0.45, 0.45, 0.1, 0.1], confidence: 0.9 },
      0.1,
      true,
      false,
    );
  assert.equal(c.pan, 0);
  assert.equal(c.tilt, 8);
});
test("large time step cannot cause runaway movement", () => {
  const c = new Controller();
  c.mode = "TRACKING";
  c.hits = 3;
  c.update({ box: [0.9, 0, 0.1, 0.1], confidence: 0.9 }, 100, true, false);
  assert.ok(c.pan <= 6.3);
  assert.ok(c.tilt <= 12.5);
});
test("silhouette extraction handles empty and nonempty masks", () => {
  const m = new Uint8Array(100);
  assert.equal(bounds(m, 10, 10), null);
  m[22] = 1;
  m[44] = 1;
  const b = bounds(m, 10, 10)!;
  assert.deepEqual(b, [2, 2, 3, 3]);
  assert.equal(features(m, 10, 10, b).length, 257);
});
test("learned classifier distinguishes separable examples", () => {
  const positive = new Array(257).fill(1),
    negative = new Array(257).fill(0);
  const rows = [
    { x: positive, y: 1 },
    { x: negative, y: 0 },
  ];
  const m = train(rows, rows);
  assert.ok(score(m, positive) > 0.7);
  assert.ok(score(m, negative) < 0.5);
  assert.equal(m.accuracy, 1);
});

test("training rejects missing samples", () => {
  const rows = [{ x: new Array(257).fill(0), y: 0 }];
  assert.throws(() => train([], rows), /must both contain samples/);
  assert.throws(() => train(rows, []), /must both contain samples/);
});
test("reset restores search direction", () => {
  const c = new Controller();
  c.direction = -1;
  c.reset();
  c.update(null, 0.1, true, false);
  assert.ok(c.pan > 0);
});

import {
  objectLabels,
  trainObjects,
  classify,
  trainTarget,
} from "../src/vision";
import { estimateCompute } from "../src/compute";
test("seven-class model learns distinct labels without target coordinates", async () => {
  const rows = objectLabels.map((_, y) => {
    const x = new Array(257).fill(0);
    x[y] = 1;
    return { x, y };
  });
  const m = await trainObjects(rows, rows, () => {});
  assert.equal(m.classes?.length, 7);
  assert.equal(m.accuracy, 1);
  rows.forEach((row) =>
    assert.equal(classify(m, row.x).label, objectLabels[row.y]),
  );
  await assert.rejects(
    () => trainObjects(rows.slice(1), rows, () => {}),
    /Every object class/,
  );
});
test("resource estimates cap throughput and power under overload", () => {
  const busy = estimateCompute(30, 100, 768, 1806, 10, true);
  assert.equal(busy.throughput, 10);
  assert.equal(busy.powerW, 10);
  assert.equal(busy.overloaded, true);
  assert.ok(busy.memoryMiB > 768);
  const idle = estimateCompute(30, 100, 768, 1806, 10, false);
  assert.equal(idle.throughput, 0);
  assert.equal(idle.powerW, 2);
});

test("loss searches the last bearing before wide patrol and reacquires", () => {
  const c = new Controller();
  c.pan = 70;
  c.tilt = 18;
  const centered = {
    box: [0.45, 0.45, 0.1, 0.1] as [number, number, number, number],
    confidence: 0.9,
  };
  for (let i = 0; i < 3; i++) c.update(centered, 0.1, true, false);
  const lastPan = c.pan;
  for (let i = 0; i < 30; i++) {
    c.update(null, 0.1, true, false);
    assert.ok(Math.abs(c.pan - lastPan) <= 25);
    assert.equal(c.tilt, 18);
  }
  assert.equal(c.reacquiring, true);
  for (let i = 0; i < 3; i++) c.update(centered, 0.1, true, false);
  assert.equal(c.mode, "TRACKING");
  assert.equal(c.reacquiring, false);
  for (let i = 0; i < 70; i++) c.update(null, 0.1, true, false);
  assert.equal(c.mode, "SEARCHING");
  assert.equal(c.reacquiring, false);
  assert.equal(c.lastKnown, null);
  c.reset();
  assert.equal(c.lastKnown, null);
});

test("detector rejects clipped silhouettes while accepting complete regions", () => {
  const rows = [
    { x: new Array(257).fill(0), y: 0 },
    { x: new Array(257).fill(1), y: 1 },
  ];
  const m = train(rows, rows);
  m.classes = [{ label: "cube", weights: new Array(257).fill(0), bias: 10 }];
  const image = (left: number) => {
    const data = new Uint8ClampedArray(40 * 40 * 4);
    for (let y = 10; y < 26; y++)
      for (let x = left; x < left + 16; x++) {
        const p = (y * 40 + x) * 4;
        data[p] = data[p + 1] = data[p + 2] = 255;
        data[p + 3] = 255;
      }
    return { width: 40, height: 40, data } as ImageData;
  };
  assert.ok(detect(image(10), m, 0.5, "cube"));
  assert.equal(detect(image(0), m, 0.5, "cube"), null);
});

test("target training retains only the chosen object and rejects other examples", () => {
  const rows = objectLabels.map((_, y) => {
    const x = new Array(257).fill(0);
    x[y] = 1;
    return { x, y };
  });
  const drone = trainTarget(rows, rows, "drone");
  assert.equal(drone.targetLabel, "drone");
  const cube = trainTarget(rows, rows, "cube");
  assert.ok(score(cube, rows[0].x) < 0.5);
  assert.equal(cube.targetLabel, "cube");
  assert.equal(cube.classes, undefined);
  assert.ok(score(cube, rows[1].x) > 0.5);
  rows
    .filter((row) => row.y !== 1)
    .forEach((row) => assert.ok(score(cube, row.x) < 0.5));
  const sphere = trainTarget(rows, rows, "sphere");
  assert.equal(sphere.targetLabel, "sphere");
  assert.equal(sphere.classes, undefined);
  assert.ok(score(sphere, rows[1].x) < 0.5);
  assert.throws(() => trainTarget(rows, rows, "unknown"), /Unknown target/);
});

test("drone loss rapidly sweeps toward the opposite side within travel limits", () => {
  const c = new Controller();
  c.fastRecovery = true;
  c.pan = 140;
  const centered = {
    box: [0.45, 0.45, 0.1, 0.1] as [number, number, number, number],
    confidence: 0.9,
  };
  for (let i = 0; i < 3; i++) c.update(centered, 0.1, true, false);
  c.update(null, 0.1, true, false);
  assert.equal(c.mode, "LOST");
  c.update(null, 0.1, true, false);
  assert.equal(c.fastSearching, true);
  assert.equal(c.pan, 122);
  for (let i = 0; i < 100; i++) {
    c.update(null, 0.1, true, false);
    assert.ok(c.pan >= -160 && c.pan <= 160);
  }
  for (let i = 0; i < 3; i++) c.update(centered, 0.1, true, false);
  assert.equal(c.mode, "TRACKING");
  assert.equal(c.fastSearching, false);
});

test("displayed camera input contributions match actual tracking commands", () => {
  const command = trackingInputs(0.1, -0.1);
  assert.ok(Math.abs(command.azimuthRate - 20.538) < 0.01);
  assert.ok(Math.abs(command.pitchRate - 13.2) < 1e-10);
  const c = new Controller();
  const d = {
    box: [0.55, 0.35, 0.1, 0.1] as [number, number, number, number],
    confidence: 0.9,
  };
  c.update(d, 0.1, true, false);
  c.update(d, 0.1, true, false);
  c.update(d, 0.1, true, false);
  assert.ok(Math.abs(c.pan - command.azimuthRate * 0.1) < 1e-10);
  assert.ok(Math.abs(c.tilt - (8 + command.pitchRate * 0.1)) < 1e-10);
  assert.equal(trackingInputs(0.02, -0.02).azimuthRate, 0);
  assert.equal(trackingInputs(0.02, -0.02).pitchRate, 0);
  assert.equal(trackingInputs(1, -1).azimuthRate, 42);
  assert.equal(trackingInputs(1, -1).pitchRate, 30);
});

test("optional centring holds a lock and resumes correction without retraining", () => {
  const c = new Controller();
  c.centreTarget = false;
  const d = {
    box: [0.55, 0.35, 0.1, 0.1] as [number, number, number, number],
    confidence: 0.9,
  };
  for (let i = 0; i < 5; i++) c.update(d, 0.1, true, false);
  assert.equal(c.mode, "TRACKING");
  assert.equal(c.pan, 0);
  assert.equal(c.tilt, 8);
  c.centreTarget = true;
  c.update(d, 0.1, true, false);
  assert.ok(c.pan > 0);
  assert.ok(c.tilt > 8);
  const pan = c.pan,
    tilt = c.tilt;
  c.centreTarget = false;
  c.update(d, 0.1, true, false);
  assert.equal(c.pan, pan);
  assert.equal(c.tilt, tilt);
  for (let i = 0; i < 70; i++) c.update(null, 0.1, true, false);
  assert.equal(c.mode, "SEARCHING");
  assert.notEqual(c.pan, pan);
});

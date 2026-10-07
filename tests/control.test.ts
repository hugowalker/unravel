import { test } from "node:test";
import assert from "node:assert/strict";
import { Controller } from "../src/control";
import { train, score, features, bounds } from "../src/vision";
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

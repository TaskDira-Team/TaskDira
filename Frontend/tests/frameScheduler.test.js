import test from "node:test";
import assert from "node:assert/strict";
import { createFrameScheduler } from "../src/utils/frameScheduler.js";
function harness() {
  const queue = new Map();
  let id = 0,
    paints = 0;
  const frames = createFrameScheduler(
    () => paints++,
    (callback) => {
      queue.set(++id, callback);
      return id;
    },
    (key) => queue.delete(key),
  );
  return {
    frames,
    queue,
    get paints() {
      return paints;
    },
    flush() {
      const callbacks = [...queue.values()];
      queue.clear();
      callbacks.forEach((callback) => callback());
    },
  };
}
test("camera, controls and lighting updates share one paint per frame", () => {
  const scene = harness();
  for (let i = 0; i < 20; i++) scene.frames.request();
  assert.equal(scene.queue.size, 1);
  assert.equal(scene.paints, 0);
  scene.flush();
  assert.equal(scene.paints, 1);
  scene.frames.request();
  scene.frames.request();
  scene.flush();
  assert.equal(scene.paints, 2);
});
test("leaving the scene cancels queued work and prevents painting a disposed renderer", () => {
  const scene = harness();
  scene.frames.request();
  const staleCallback = [...scene.queue.values()][0];
  scene.frames.dispose();
  assert.equal(scene.queue.size, 0);
  staleCallback();
  scene.frames.request();
  scene.flush();
  assert.equal(scene.paints, 0);
  assert.equal(scene.queue.size, 0);
});

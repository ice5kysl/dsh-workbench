import { initialDeferredDiffState, nextDeferredDiffState } from "../src/client/review/deferred-diff.js";
import { expect, test } from "vitest";

test("only mounts a diff editor near the viewport", () => {
  expect(nextDeferredDiffState(initialDeferredDiffState, { type: "visibility", nearViewport: false })).toEqual(initialDeferredDiffState);
  expect(nextDeferredDiffState(initialDeferredDiffState, { type: "visibility", nearViewport: true })).toEqual({ mounted: true, height: 0 });
});

test("a mounted diff stays mounted after it leaves the viewport", () => {
  const mounted = { mounted: true, height: 420 };
  expect(nextDeferredDiffState(mounted, { type: "visibility", nearViewport: false })).toBe(mounted);
});

test("ignores repeated measurements so a mounted editor is not re-rendered", () => {
  const mounted = { mounted: true, height: 420 };
  expect(nextDeferredDiffState(mounted, { type: "measured", height: 420 })).toBe(mounted);
});

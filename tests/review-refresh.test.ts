import { reviewRefreshAction } from "../src/client/workbench/review-refresh.js";
import { expect, test } from "vitest";

test("a same-session review refresh never changes the selected tab", () => {
  expect(reviewRefreshAction(false, true)).toBeNull();
  expect(reviewRefreshAction(false, false)).toBeNull();
});

test("a new session never steals focus for its captured edits", () => {
  expect(reviewRefreshAction(true, true)).toBeNull();
  expect(reviewRefreshAction(true, false)).toBeNull();
});

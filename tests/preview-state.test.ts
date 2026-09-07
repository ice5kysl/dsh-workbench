import { canSaveWorkspacePreview, shouldRefreshPreview } from "../src/client/preview/preview-state.js";
import { expect, test } from "vitest";

test("editable disk and read snapshots can save from the editor", () => {
  expect(canSaveWorkspacePreview("workspace", "code", true)).toBe(true);
  expect(canSaveWorkspacePreview("workspace", "markdown", true)).toBe(true);
  expect(canSaveWorkspacePreview("dsh-read", "code", true)).toBe(true);
  expect(canSaveWorkspacePreview("workspace", "image", true)).toBe(false);
  expect(canSaveWorkspacePreview("dsh-write", "code", true)).toBe(false);
  expect(canSaveWorkspacePreview("workspace", "code", false)).toBe(false);
});

test("refresh keeps an unsaved draft unless the user confirms", () => {
  expect(shouldRefreshPreview(false, false)).toBe(true);
  expect(shouldRefreshPreview(true, false)).toBe(false);
  expect(shouldRefreshPreview(true, true)).toBe(true);
});

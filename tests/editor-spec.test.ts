import { EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { createEditorExtensions } from "../src/client/preview/code-mirror.js";
import { editorSpec, viewKind } from "../src/client/preview/editor-spec.js";
import { languageForPath } from "../src/client/preview/lang-map.js";
import { expect, test } from "vitest";

test("write and edit open as a diff", () => {
  expect(viewKind("dsh-write")).toBe("diff");
  expect(
    editorSpec({ source: "dsh-write", before: "old", path: "a.ts" }),
  ).toEqual(
    { kind: "diff", original: "old", language: "typescript" },
  );
});

test("a new write still opens as a diff against empty original", () => {
  expect(
    editorSpec({ source: "dsh-write", before: null, path: "a.ts" }),
  ).toEqual(
    { kind: "diff", original: "", language: "typescript" },
  );
});

test("reads and workspace files open as a view", () => {
  expect(viewKind("dsh-read")).toBe("view");
  expect(viewKind("workspace")).toBe("view");
  expect(
    editorSpec({ source: "workspace", before: "ignored", path: "a.ts" }),
  ).toEqual(
    { kind: "view", original: null, language: "typescript" },
  );
});

test("languageForPath resolves common extensions", () => {
  expect(languageForPath("file.ts")).toBe("typescript");
  expect(languageForPath("file.py")).toBe("python");
  expect(languageForPath("file.json")).toBe("json");
  expect(languageForPath("Dockerfile")).toBe("dockerfile");
  expect(languageForPath("file.xyz")).toBe(null);
});

test.each([
  ["analysis.M", "matlab"], ["model.R", "r"], ["model.jl", "julia"],
  ["init.lua", "lua"], ["App.cs", "csharp"], ["App.kt", "kotlin"],
  ["build.kts", "kotlin"], ["App.scala", "scala"], ["App.swift", "swift"],
  ["main.dart", "dart"], ["App.vue", "html"], ["App.svelte", "html"],
  ["data.xml", "xml"], ["schema.xsd", "xml"], ["style.xsl", "xml"],
  ["style.xslt", "xml"], ["types.pyi", "python"],
])("selects a code preview language for %s", (path, language) => {
  expect(editorSpec({ source: "workspace", before: null, path })).toEqual({
    kind: "view", original: null, language,
  });
  expect(editorSpec({ source: "dsh-write", before: "old", path })).toEqual({
    kind: "diff", original: "old", language,
  });
});


test("MATLAB preview tokenizes comments, keywords, numbers, and strings", () => {
  const doc = "% sample\nif x > 1\n  disp('hello');\nend";
  const spec = editorSpec({ source: "workspace", before: null, path: "sample.m" });
  const state = EditorState.create({ doc, extensions: createEditorExtensions(spec) });
  const tree = syntaxTree(state);
  expect(tree.resolveInner(doc.indexOf("sample") + 1).name).toBe("comment");
  expect(tree.resolveInner(doc.indexOf("if") + 1).name).toBe("keyword");
  expect(tree.resolveInner(doc.indexOf("1"), 1).name).toBe("number");
  expect(tree.resolveInner(doc.indexOf("hello") + 1).name).toBe("string");
});

test("editable code supports undo and redo", async () => {
  const { undo, redo } = await import("@codemirror/commands");
  let state = EditorState.create({ doc: "original", extensions: createEditorExtensions({ language: "matlab", original: null, editable: true }) });
  state = state.update({ changes: { from: 0, to: state.doc.length, insert: "changed" } }).state;
  const target = { get state() { return state; }, dispatch(transaction) { state = transaction.state; } };
  expect(undo(target)).toBe(true);
  expect(state.doc.toString()).toBe("original");
  expect(redo(target)).toBe(true);
  expect(state.doc.toString()).toBe("changed");
});

import { defineConfig } from "tsdown";

const clientExternals = [
  "react",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "react-dom",
  "react-dom/client",
  "@deepseek-ai/dsh-client-ui-primitives",
];

export default defineConfig([{
  entry: { client: "src/client/entry.ts" },
  format: "cjs",
  outDir: "lib",
  platform: "browser",
  sourcemap: false,
  clean: false,
  deps: {
    neverBundle: clientExternals,
    alwaysBundle(id) {
      return !clientExternals.includes(id);
    },
  },
  outputOptions: {
    entryFileNames: "client.js",
    banner: 'window.__ModuleLoader__.load({ id: "dsh-workbench", factory: (require) => {',
    intro: "var module = { exports: {} }; var exports = module.exports;",
    footer: "return module.exports; } });",
    codeSplitting: false,
  },
}, {
  entry: { "client-editor": "src/client/preview/editor-chunk.ts" },
  format: "cjs",
  outDir: "lib",
  platform: "browser",
  clean: false,
  deps: { alwaysBundle: [/./] },
  outputOptions: {
    entryFileNames: "client-editor.js",
    banner: "globalThis.__dshWorkbenchEditor = (() => {",
    intro: "var module = { exports: {} }; var exports = module.exports;",
    footer: "return module.exports; })();",
    codeSplitting: false,
  },
}]);

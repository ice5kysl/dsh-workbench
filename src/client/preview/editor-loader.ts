import { EDITOR_BUNDLE_API_PATH } from "../../shared/types.js";

type EditorModule = typeof import("./editor-chunk.js");
type EditorGlobal = typeof globalThis & { __dshWorkbenchEditor?: EditorModule };
let pending: Promise<EditorModule> | undefined;

/** One shared request; failed requests can be retried by the preview. */
export function loadEditor(): Promise<EditorModule> {
  const runtime = globalThis as EditorGlobal;
  if (runtime.__dshWorkbenchEditor) return Promise.resolve(runtime.__dshWorkbenchEditor);
  if (pending) return pending;
  pending = new Promise<EditorModule>((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => finish(new Error("editor_load_timeout")), 30_000);
    const finish = (error?: Error) => {
      window.clearTimeout(timeout);
      script.onload = null;
      script.onerror = null;
      script.remove();
      if (error || !runtime.__dshWorkbenchEditor) reject(error ?? new Error("editor_module_missing"));
      else resolve(runtime.__dshWorkbenchEditor);
    };
    script.src = EDITOR_BUNDLE_API_PATH;
    script.onload = () => finish();
    script.onerror = () => finish(new Error("editor_load_failed"));
    document.head.appendChild(script);
  }).catch((error: unknown) => { pending = undefined; throw error; });
  return pending;
}

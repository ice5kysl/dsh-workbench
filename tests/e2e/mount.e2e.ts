import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

test("packed plugin mounts, loads the editor on demand, and preserves edits", async ({ page }) => {
  const url = process.env.DSH_E2E_URL;
  const workspace = process.env.DSH_E2E_WORKSPACE;
  if (!url || !workspace) throw new Error("Run pnpm test:mount to start the isolated DSH host");
  const errors: string[] = [];
  const editorRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("request", (request) => { if (request.url().endsWith("/api/dsh-workbench/editor.js")) editorRequests.push(request.url()); });
  await page.goto(url);
  const origin = new URL(url).origin;
  const rpc = async (method: string, request: Record<string, unknown>) => {
    const response = await page.request.post(`${origin}/api/${method}`, { data: {
      type: "client-request", rpcId: `smoke-${method}`, method, payload: { args: { request } },
    } });
    expect(response.ok(), await response.text()).toBe(true);
    const body = await response.json();
    expect(body.result.ok, JSON.stringify(body)).toBe(true);
    return body.result.value;
  };
  const created = await rpc("workspace/create", { path: workspace });
  await rpc("session/create", { workspaceId: created.workspace.workspaceId });
  await page.reload();
  for (const name of [/^(Continue|继续)$/, /^(Configure later|稍后配置)$/]) {
    const button = page.getByRole("button", { name });
    if (await button.count() && await button.first().isVisible()) await button.first().click();
  }
  const toggle = page.locator(".dsh-wb-toggle");
  await expect(toggle).toBeVisible({ timeout: 30_000 });
  await toggle.click();
  const row = (path: string) => page.locator(`.dsh-wb-tree-row[data-path="${path}"]`);
  await row("readme.md").click();
  await expect(page.locator(".dsh-wb-markdown-preview")).toContainText("Mount smoke");
  expect(editorRequests).toHaveLength(0);
  const loaded = page.waitForResponse((response) => response.url().endsWith("/api/dsh-workbench/editor.js"));
  await row("sample.m").click();
  expect((await loaded).ok()).toBe(true);
  const editor = page.locator(".dsh-wb-cm .cm-content");
  await expect(editor).toContainText("x = 1;");
  await page.getByRole("button", { name: /^(Edit file|编辑文件)$/ }).click();
  await expect(editor).toHaveAttribute("contenteditable", "true");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.insertText("y = 2;\n");
  await expect(editor).toContainText("y = 2;");
  await row("other.ts").click();
  await expect(editor).toContainText("export const other");
  await page.getByRole("tab", { name: "sample.m", exact: true }).click();
  await expect(editor).toContainText("y = 2;");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+z");
  await expect(editor).not.toContainText("y = 2;");
  await page.keyboard.press("ControlOrMeta+Shift+z");
  await expect(editor).toContainText("y = 2;");
  const close = page.getByRole("button", { name: /^(Close file|关闭文件): sample.m$/ });
  page.once("dialog", (dialog) => dialog.dismiss());
  await close.click();
  await expect(editor).toContainText("y = 2;");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+s");
  await expect.poll(() => readFile(join(workspace, "sample.m"), "utf8")).toContain("y = 2;");
  // A switch/reload must never replace the baseline used for conflict detection.
  await page.getByRole("button", { name: /^(Edit file|编辑文件)$/ }).click();
  await editor.click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.insertText("z = 3;\n");
  await row("other.ts").click();
  await writeFile(join(workspace, "sample.m"), "% external change\n");
  await page.getByRole("tab", { name: "sample.m", exact: true }).click();
  await expect(editor).toContainText("z = 3;");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+s");
  await expect(page.locator(".dsh-wb-error")).toBeVisible();
  expect(await readFile(join(workspace, "sample.m"), "utf8")).toBe("% external change\n");
  page.once("dialog", (dialog) => dialog.accept());
  await close.click();
  await expect(page.getByRole("tab", { name: "sample.m", exact: true })).toHaveCount(0);
  expect(editorRequests).toHaveLength(1);
  // The intentional save conflict is the only expected failed network request.
  expect(errors.filter((error) => !error.includes("409 (Conflict)"))).toEqual([]);
});

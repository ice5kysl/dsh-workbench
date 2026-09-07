export const DEFAULT_SIDEBAR_WIDTH = 600;
export const MIN_SIDEBAR_WIDTH = 400;
export const MAX_SIDEBAR_WIDTH = 1200;
export const MIN_CONVERSATION_WIDTH = 360;
export const SIDEBAR_DRAWER_BREAKPOINT = 768;
export const SIDEBAR_WIDTH_KEY = "dsh-workbench.sidebar-width";

export type SidebarStorage = Pick<Storage, "getItem" | "setItem">;

export function clampSidebarWidth(value: number): number {
  return Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, value));
}

export function sidebarWidthForViewport(value: number, viewportWidth: number): number {
  const maximum = Math.max(MIN_SIDEBAR_WIDTH, viewportWidth - MIN_CONVERSATION_WIDTH);
  return Math.min(clampSidebarWidth(value), maximum);
}

export function sidebarUsesDrawer(viewportWidth: number): boolean {
  return viewportWidth < SIDEBAR_DRAWER_BREAKPOINT;
}

export function sidebarWidthFromPointer(clientX: number, viewportWidth: number): number {
  return sidebarWidthForViewport(viewportWidth - clientX, viewportWidth);
}

export function sidebarWidthFromKey(current: number, key: string): number {
  if (key !== "ArrowLeft" && key !== "ArrowRight") return current;
  return clampSidebarWidth(current + (key === "ArrowLeft" ? 16 : -16));
}

export function readSidebarWidth(storage: SidebarStorage, fallback = DEFAULT_SIDEBAR_WIDTH): number {
  try {
    const value = Number(storage.getItem(SIDEBAR_WIDTH_KEY));
    return Number.isFinite(value) ? clampSidebarWidth(value) : fallback;
  } catch {
    return fallback;
  }
}

export function writeSidebarWidth(storage: SidebarStorage, value: number): void {
  try {
    storage.setItem(SIDEBAR_WIDTH_KEY, String(clampSidebarWidth(value)));
  } catch {
    // Storage can be unavailable in private or embedded contexts.
  }
}

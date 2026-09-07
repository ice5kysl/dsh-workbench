import { normalizePath, type GitFileDiff } from "./types.js";

function compareReviewPaths(left: string, right: string): number {
  const leftParts = normalizePath(left).split("/");
  const rightParts = normalizePath(right).split("/");
  const limit = Math.min(leftParts.length, rightParts.length);
  for (let index = 0; index < limit; index += 1) {
    if (leftParts[index] === rightParts[index]) continue;
    const leftDirectory = index < leftParts.length - 1;
    const rightDirectory = index < rightParts.length - 1;
    if (leftDirectory !== rightDirectory) return leftDirectory ? -1 : 1;
    return leftParts[index].localeCompare(rightParts[index]);
  }
  return leftParts.length - rightParts.length;
}

/** Sort changed files with the same directory-first order as the explorer. */
export function sortReviewFiles<T extends { path: string }>(files: readonly T[]): T[] {
  return [...files].sort((left, right) => compareReviewPaths(left.path, right.path));
}

export function completeSessionDiffs(
  worktreeDiffs: GitFileDiff[],
  sessionDiffs: GitFileDiff[],
): GitFileDiff[] {
  const paths = new Set(worktreeDiffs.map((file) => normalizePath(file.path)));
  return sortReviewFiles([...worktreeDiffs, ...sessionDiffs.filter((file) => !paths.has(normalizePath(file.path)))]);
}

export function reviewDiffCounts(files: readonly Pick<GitFileDiff, "additions" | "deletions">[]) {
  return files.reduce((counts, file) => ({
    additions: counts.additions + file.additions,
    deletions: counts.deletions + file.deletions,
  }), { additions: 0, deletions: 0 });
}

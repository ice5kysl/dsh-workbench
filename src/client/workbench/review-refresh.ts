export type ReviewRefreshAction = {
  openReview: boolean;
  showDiff: boolean;
  openTree: boolean;
};

export function reviewRefreshAction(sessionChanged: boolean, hasDiff: boolean): ReviewRefreshAction | null {
  void sessionChanged;
  void hasDiff;
  return null;
}

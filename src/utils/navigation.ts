// React Router keeps its history index in window.history.state.idx.
// idx === 0 means the current entry is the first in-app location, i.e. the
// user landed here directly (deep link) and navigate(-1) would leave the app.
export const hasInAppHistory = (): boolean =>
  ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0;

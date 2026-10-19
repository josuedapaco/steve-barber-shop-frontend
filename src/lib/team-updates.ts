// Refresh both the current page and other storefront/manager tabs on this browser.
export const TEAM_UPDATE_KEY = "atelier-barber-team-updated";
export function notifyTeamUpdated() {
  window.dispatchEvent(new Event("barber-team-updated"));
  try { localStorage.setItem(TEAM_UPDATE_KEY, crypto.randomUUID()); }
  catch { /* Focus refresh and periodic polling still work without storage. */ }
}

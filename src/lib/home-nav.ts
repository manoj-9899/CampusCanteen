export const HOME_NAV_EVENT = "campus-canteen:home";

export function getHomePath(role?: "STUDENT" | "STAFF") {
  return role === "STAFF" ? "/staff" : "/";
}

export function triggerHomeReset() {
  window.dispatchEvent(new CustomEvent(HOME_NAV_EVENT));
}

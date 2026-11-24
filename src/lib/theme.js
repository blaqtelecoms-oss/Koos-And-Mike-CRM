const THEME_KEY = "km-theme";

export function getTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* storage unavailable — theme still applies for this session */
  }
}

export function initTheme() {
  applyTheme(getTheme());
}

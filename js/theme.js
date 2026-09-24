// ============================================================
// SafePath AI — Dark & Light Mode Theme Toggle
// Automotive Slate Dark Mode (Default) & Daylight Mode
// ============================================================

const THEME_STORAGE_KEY = "safepath_theme";

class ThemeManager {
  constructor() {
    // Default to 'dark' (Automotive Slate Dark Mode)
    this.currentTheme = localStorage.getItem(THEME_STORAGE_KEY) || "dark";
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
  }

  getTheme() {
    return this.currentTheme;
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
    this.updateToggleButton();

    document.dispatchEvent(
      new CustomEvent("safepath-theme-changed", { detail: { theme } })
    );
  }

  toggleTheme() {
    const nextTheme = this.currentTheme === "dark" ? "light" : "dark";
    this.applyTheme(nextTheme);
  }

  updateToggleButton() {
    const btn = document.getElementById("themeToggleBtn");
    if (!btn) return;

    if (this.currentTheme === "dark") {
      // Current is dark mode, so button offers to switch to Daylight (Sun icon)
      btn.innerHTML = `<span class="theme-icon">☀️</span> <span class="theme-label" data-i18n="theme_daylight">Daylight</span>`;
      btn.setAttribute("title", "Switch to Daylight Mode");
      btn.setAttribute("aria-label", "Switch to Daylight Mode");
    } else {
      // Current is daylight, so button offers to switch to Automotive Dark (Moon icon)
      btn.innerHTML = `<span class="theme-icon">🌙</span> <span class="theme-label" data-i18n="theme_dark">Dark HUD</span>`;
      btn.setAttribute("title", "Switch to Automotive Slate Dark Mode");
      btn.setAttribute("aria-label", "Switch to Automotive Slate Dark Mode");
    }

    if (window.i18n && typeof window.i18n.applyTranslations === "function") {
      window.i18n.applyTranslations();
    }
  }
}

// Global instance immediately applies theme before page render to eliminate flicker
window.themeManager = new ThemeManager();

document.addEventListener("DOMContentLoaded", () => {
  window.themeManager.updateToggleButton();

  const btn = document.getElementById("themeToggleBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      window.themeManager.toggleTheme();
    });
  }
});

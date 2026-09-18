const THEME_STORAGE_KEY = 'urbanpulse-theme';

export function getInitialTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage no disponible (modo privado, etc.)
  }
  return 'dark';
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('light', theme === 'light');
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage no disponible (modo privado, etc.)
  }
}

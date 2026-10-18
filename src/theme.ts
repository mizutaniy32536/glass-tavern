export type Theme = 'light' | 'dark';
const key = 'glass-tavern-theme';
export function readTheme(): Theme {
  try { const saved = localStorage.getItem(key); if (saved === 'light' || saved === 'dark') return saved; } catch {}
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#121212' : '#efeff2');
}
export function saveTheme(theme: Theme) {
  applyTheme(theme);
  try { localStorage.setItem(key, theme); } catch {}
}
applyTheme(readTheme());

// =====================================================
//  core/theme.js — гэрэл / харанхуй горим
//
//  Анхны утгыг index.html-ийн <head> дэх богино скрипт
//  тавьдаг — эс тэгвэл ачаалахад цагаанаас харанхуй руу анивчина.
// =====================================================

const KEY = 'dadlaga.theme';

const SUN = `<svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" aria-hidden="true">
  <circle cx="12" cy="12" r="4"/>
  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
</svg>`;

const MOON = `<svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
</svg>`;

/** Аль дүрс харагдахыг CSS шийднэ — JS шинэчлэх шаардлагагүй */
export const themeButton = (extra = '') => `
  <button type="button" class="icon-btn ${extra}" data-theme-btn
          aria-label="Гэрэл, харанхуй горим солих">${MOON}${SUN}</button>`;

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(KEY, theme);
}

export function toggleTheme() {
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
}

export function initTheme() {
  // Товч хожим үүсдэг тул document түвшинд сонсоно
  document.addEventListener('click', e => {
    if (e.target.closest('[data-theme-btn]')) toggleTheme();
  });

  // Хэрэглэгч өөрөө сонгоогүй бол системийн тохиргоог дагана
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem(KEY)) {
      document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
    }
  });
}
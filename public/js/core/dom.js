// =====================================================
//  core/dom.js — DOM-той ажиллах жижиг туслахууд
// =====================================================

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** HTML тэмдэгт цэвэрлэх — хэрэглэгчийн текстийг тавихаас өмнө заавал дуудна */
export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * Template literal-д хэрэглэх шошго.
 * Оруулсан утга бүрийг автоматаар цэвэрлэнэ.
 * Массивыг нэгтгэнэ. Цэвэрлэхгүй байх бол raw() ашиглана.
 *
 *   html`<h1>${name}</h1>`            → цэвэрлэнэ
 *   html`<div>${raw(markup)}</div>`   → цэвэрлэхгүй
 */
export function html(strings, ...values) {
  return strings.reduce((out, str, i) => {
    if (i === 0) return str;
    const v = values[i - 1];
    let piece;

    if (v === null || v === undefined || v === false) piece = '';
    else if (v && v.__raw)     piece = v.value;
    else if (Array.isArray(v)) piece = v.map(x => (x && x.__raw) ? x.value : esc(x)).join('');
    else                        piece = esc(v);

    return out + piece + str;
  }, '');
}

/** Цэвэрлэхгүй HTML тэмдэглэх */
export const raw = value => ({ __raw: true, value: String(value ?? '') });

/** Товч түр түгжих — давхар илгээхээс сэргийлнэ */
export function lock(btn, label) {
  if (!btn) return;
  btn.dataset.prev = btn.textContent;
  btn.textContent  = label;
  btn.disabled     = true;
}

export function unlock(btn) {
  if (!btn) return;
  if (btn.dataset.prev) btn.textContent = btn.dataset.prev;
  btn.disabled = false;
}

/** Огноог 2026-08-16 хэлбэрт оруулах */
export const day = v => String(v ?? '').slice(0, 10);

/** Нэрний эхний үсэг */
export const initial = name => String(name || '?').trim().charAt(0).toUpperCase();
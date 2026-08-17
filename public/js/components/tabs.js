// =====================================================
//  components/tabs.js — хуудас доторх дэд таб
//
//  Урт хуудсыг хэсэгт хуваана. Хэрэглэгч доошоо
//  гүйлгэж хайхын оронд шууд сонгоно.
//
//  Сонгосон таб нь хаягт тэмдэглэгдэнэ (?tab=info) —
//  тиймээс хуудсыг дахин ачаалахад байрлал хадгалагдана.
// =====================================================

import { html, raw, esc } from '../core/dom.js';

/**
 * items  — [{ id, label, short }]
 *   label — өргөн дэлгэцэнд харагдах бүтэн нэр
 *   short — нарийн дэлгэцэнд харагдах богино нэр (заавал биш)
 *
 * Хоёуланг нь зэрэг зурж, алийг харуулахыг CSS шийднэ.
 * Ингэснээр гар утсанд таб гүйлгэх шаардлагагүй болж,
 * халих эрсдэл бүрмөсөн арилна.
 *
 * active — эхэлж нээгдэх табын id
 */
export function tabs(items, active) {
  return html`
    <div class="seg" role="tablist">
      ${raw(items.map(t => html`
        <button type="button" class="seg-btn" role="tab"
                data-tab="${t.id}"
                aria-selected="${String(t.id === active)}">
          <span class="seg-long">${t.label}</span>
          <span class="seg-short">${t.short || t.label}</span>
        </button>`).join(''))}
    </div>`;
}

/** Панелийг таб бүрт зориулж боож өгнө */
export const panel = (id, active, body) => html`
  <div data-panel="${id}" ${raw(id === active ? '' : 'hidden')}>${raw(body)}</div>`;


/**
 * Табуудыг ажиллуулна.
 * onChange(id) — таб солигдоход дуудагдана (заавал биш)
 */
export function wireTabs(onChange) {
  const buttons = [...document.querySelectorAll('.seg-btn')];
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.tab;

      buttons.forEach(b => b.setAttribute('aria-selected', String(b === btn)));
      document.querySelectorAll('[data-panel]').forEach(p => {
        p.hidden = p.dataset.panel !== id;
      });

      // Хаягийг чимээгүй шинэчилнэ. replaceState нь hashchange
      // үүсгэдэггүй тул router дахин зурахгүй — өгөгдөл дахин татагдахгүй.
      const base = location.hash.split('?')[0];
      history.replaceState(null, '', `${base}?tab=${encodeURIComponent(id)}`);

      window.scrollTo({ top: 0, behavior: 'instant' });
      onChange?.(id);
    });
  });
}

/** Хаягаас таб уншина. Байхгүй эсвэл буруу бол эхнийхийг өгнө. */
export function activeTab(query, items) {
  const want = query.get('tab');
  return items.some(t => t.id === want) ? want : items[0].id;
}
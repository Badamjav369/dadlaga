import { html, raw, esc } from '../core/dom.js';

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

export const panel = (id, active, body) => html`
  <div data-panel="${id}" ${raw(id === active ? '' : 'hidden')}>${raw(body)}</div>`;

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

      const base = location.hash.split('?')[0];
      history.replaceState(null, '', `${base}?tab=${encodeURIComponent(id)}`);

      window.scrollTo({ top: 0, behavior: 'instant' });
      onChange?.(id);
    });
  });
}

export function activeTab(query, items) {
  const want = query.get('tab');
  return items.some(t => t.id === want) ? want : items[0].id;
}
import { html, raw, esc, initial } from '../core/dom.js';

const BADGE = {
  'Илгээсэн'    : 'b-sent',
  'Хүлээн авсан': 'b-review',
  'Тэнцсэн'     : 'b-pass',
  'Тэнцээгүй'   : 'b-fail'
};

export const badge = status =>
  html`<span class="badge ${BADGE[status] || 'b-sent'}">${status}</span>`;

export const ICON = {
  search  : `<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>`,
  send    : `<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>`,
  inbox   : `<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.5L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.5z"/>`,
  building: `<path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 21V9h2a2 2 0 0 1 2 2v10M9 7h2M9 11h2M9 15h2"/>`,
  alert   : `<path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="9"/>`,
  folder  : `<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>`
};

export const svg = (name, cls = '') => `
  <svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ''}</svg>`;

export function blank({ icon = 'folder', title, text, action }) {
  return html`
    <div class="blank">
      <div class="blank-icon">${raw(svg(icon))}</div>
      <h3>${title}</h3>
      <p>${text}</p>
      ${raw(action || '')}
    </div>`;
}

export const skeletonRows = (n = 3) =>
  Array.from({ length: n }, () => '<div class="skeleton skeleton-row"></div>').join('');

export const skeletonCards = (n = 6) =>
  `<div class="grid">${Array.from({ length: n },
    () => '<div class="skeleton skeleton-card"></div>').join('')}</div>`;

export const skeletonHero = () => '<div class="skeleton skeleton-hero"></div>';

let toastTimer;

export function toast(text, bad = false) {
  document.querySelector('.toast')?.remove();
  clearTimeout(toastTimer);

  const el = document.createElement('div');
  el.className = 'toast' + (bad ? ' bad' : '');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = text;
  document.body.appendChild(el);

  toastTimer = setTimeout(() => el.remove(), 3200);
}


export function alertBox(id = 'alert') {
  return `<div class="alert" id="${id}" role="alert" hidden></div>`;
}

export function showAlert(text, good = false, id = 'alert') {
  const box = document.getElementById(id);
  if (!box) return;
  box.className = 'alert ' + (good ? 'good' : 'bad');
  box.hidden = false;
  box.textContent = text;
}

export function showAlertHTML(markup, good = false, id = 'alert') {
  const box = document.getElementById(id);
  if (!box) return;
  box.className = 'alert ' + (good ? 'good' : 'bad');
  box.hidden = false;
  box.innerHTML = markup;
}

export function hideAlert(id = 'alert') {
  const box = document.getElementById(id);
  if (box) box.hidden = true;
}

export function tone(name) {
  let sum = 0;
  const s = String(name || '');
  for (let i = 0; i < s.length; i++) sum = (sum + s.charCodeAt(i)) % 997;
  return sum % 6;
}

export function avatar(name, logo, size = '') {
  const t = tone(name);
  return logo
    ? html`<div class="avatar ${size}" data-tone="${t}"><img src="${logo}" alt=""></div>`
    : html`<div class="avatar ${size}" data-tone="${t}">${initial(name)}</div>`;
}

export function field({ id, label, short, type = 'text', placeholder = '', autocomplete, disabled, options, min, max }) {
  const input = options
    ? html`<select id="${id}">${raw(options.map(o =>
        typeof o === 'string'
          ? html`<option>${o}</option>`
          : html`<option value="${o.value}">${o.label}</option>`).join(''))}</select>`
    : html`<input type="${type}" id="${id}" placeholder="${placeholder}"
             ${raw(autocomplete ? `autocomplete="${autocomplete}"` : '')}
             ${raw(disabled ? 'disabled' : '')}
             ${raw(min !== undefined ? `min="${min}"` : '')}
             ${raw(max !== undefined ? `max="${max}"` : '')}>`;

  const labelHTML = short
    ? html`<span class="lbl-long">${label}</span><span class="lbl-short">${short}</span>`
    : html`${label}`;

  return html`
    <div class="field">
      <label for="${id}">${raw(labelHTML)}</label>
      ${raw(input)}
      <p class="err"></p>
    </div>`;
}

export function passwordField({ id, label, placeholder = '••••••••', autocomplete = 'new-password' }) {
  return html`
    <div class="field">
      <label for="${id}">${label}</label>
      <div class="pw">
        <input type="password" id="${id}" placeholder="${placeholder}" autocomplete="${autocomplete}">
        <button type="button" class="pw-eye" data-eye="${id}" aria-label="Нууц үг харуулах">Харах</button>
      </div>
      <p class="err"></p>
    </div>`;
}

export function wireEyes(root = document) {
  root.querySelectorAll('[data-eye]').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.eye);
      const show  = input.type === 'password';
      input.type      = show ? 'text' : 'password';
      btn.textContent = show ? 'Нуух' : 'Харах';
      btn.setAttribute('aria-label', show ? 'Нууц үг нуух' : 'Нууц үг харуулах');
    });
  });
}

export const tiles = items => html`
  <div class="tiles">
    ${raw(items.map(([num, label]) => html`
      <div class="tile"><b>${num}</b><span class="mono">${label}</span></div>`).join(''))}
  </div>`;

export const viewHead = ({ eyebrow, title, sub }) => html`
  <div class="view-head">
    ${raw(eyebrow ? html`<span class="mono">${eyebrow}</span>` : '')}
    <h1>${title}</h1>
    ${raw(sub ? html`<p id="sub">${sub}</p>` : '')}
  </div>`;
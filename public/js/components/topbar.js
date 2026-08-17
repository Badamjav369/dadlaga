import { esc } from '../core/dom.js';
import { Auth, homeFor } from '../core/api.js';
import { themeButton } from '../core/theme.js';

const I = {
  building: `<path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 21V9h2a2 2 0 0 1 2 2v10M9 7h2M9 11h2M9 15h2"/>`,
  send    : `<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>`,
  user    : `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
  inbox   : `<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.5L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.5z"/>`,
  gear    : `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>`,
  out     : `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>`
};

const icon = name => `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name]}</svg>`;

const LINKS = {
  student: [
    ['#/organizations', 'Байгууллагууд', 'Байгууллага', 'building'],
    ['#/profile',       'Миний дадлага', 'Дадлага',     'send']
  ],
  org: [
    ['#/org/requests', 'Ирсэн хүсэлтүүд',       'Хүсэлт',   'inbox'],
    ['#/org/profile',  'Байгууллагын мэдээлэл', 'Мэдээлэл', 'gear']
  ]
};

export function topbar(user, hash) {
  const here  = (hash || '').split('?')[0];
  const links = LINKS[user.role];
  const on    = href => href === here ? 'aria-current="page"' : '';

  return `
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" href="${homeFor(user.role)}">ДАДЛАГА<span>.</span>МН</a>

        <nav class="tabs-nav">
          ${links.map(([href, label]) => `
            <a class="tab-link" href="${href}" ${on(href)}>${label}</a>`).join('')}
        </nav>

        <div class="topbar-user">
          <span class="who">
            <b>${esc(user.name)}</b>
            <span>${user.role === 'student' ? 'Оюутан' : 'Байгууллага'}</span>
          </span>
          ${themeButton()}
          <button type="button" class="icon-btn danger" data-logout aria-label="Гарах">
            ${icon('out')}
          </button>
        </div>
      </div>
    </header>

    <nav class="tabbar" aria-label="Үндсэн цэс">
      ${links.map(([href, , short, ic]) => `
        <a class="tabbar-item" href="${href}" ${on(href)}>
          ${icon(ic)}
          <span>${short}</span>
        </a>`).join('')}
    </nav>`;
}

export function wireTopbar() {
  document.querySelector('[data-logout]')?.addEventListener('click', () => {
    Auth.clear();
    location.hash = '#/login';
  });
}
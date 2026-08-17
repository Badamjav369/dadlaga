// =====================================================
//  components/hero.js — харанхуй толгой хэсэг
//
//  Нэвтрэх хуудасны өнгө аястай уялдуулна. Дотогш
//  ормогц бүх зүйл цайвар саарал хайрцаг болж
//  хувирдаг байсныг зассан.
// =====================================================

import { html, raw } from '../core/dom.js';
import { avatar } from './ui.js';

/**
 * eyebrow — жижиг шошго (заавал биш)
 * title   — гол гарчиг
 * sub     — доод мөр
 * name    — аватар үүсгэх нэр (заавал биш)
 * logo    — лого зам (заавал биш)
 * facts   — [[шошго, утга], …] доод хэсгийн мэдээлэл
 */
export function hero({ eyebrow, title, sub, name, logo, facts = [] }) {
  const head = name
    ? html`
      <div class="hero-top">
        ${raw(avatar(name, logo, 'lg'))}
        <div>
          ${raw(eyebrow ? html`<span class="mono">${eyebrow}</span>` : '')}
          <h1>${title}</h1>
          ${raw(sub ? html`<p class="hero-sub">${sub}</p>` : '')}
        </div>
      </div>`
    : html`
      <div style="margin-bottom:22px">
        ${raw(eyebrow ? html`<span class="mono">${eyebrow}</span>` : '')}
        <h1>${title}</h1>
        ${raw(sub ? html`<p class="hero-sub">${sub}</p>` : '')}
      </div>`;

  const bottom = facts.length
    ? html`
      <div class="hero-facts">
        ${raw(facts.map(([label, value]) => html`
          <div>
            <span class="mono">${label}</span>
            ${raw(value)}
          </div>`).join(''))}
      </div>`
    : '';

  return html`<section class="hero">${raw(head)}${raw(bottom)}</section>`;
}
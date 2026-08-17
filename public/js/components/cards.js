// =====================================================
//  components/cards.js — жагсаалтын мөр, карт
// =====================================================

import { html, raw, esc, day } from '../core/dom.js';
import { avatar, badge, tone } from './ui.js';


/* -------- Орон тооны зурвас -------- */
/**
 * Тоо уншихаас илүү хэлбэр хараад ойлгоно.
 * capacity — нийт авах, accepted — тэнцсэн тоо
 */
export function capacityBar(capacity, accepted) {
  const cap  = Math.max(Number(capacity) || 0, 0);
  const took = Math.min(Math.max(Number(accepted) || 0, 0), cap);
  const left = cap - took;
  const pct  = cap ? Math.round((took / cap) * 100) : 100;
  const full = left < 1;

  return html`
    <div class="cap">
      <div class="cap-track" data-full="${String(full)}">
        <span class="cap-fill" style="width:${pct}%"></span>
      </div>
      <span class="cap-label ${full ? 'full' : ''}">
        ${raw(full
          ? `<b>Орон тоо дүүрсэн</b> · ${cap} оюутан авсан`
          : `<b>${left} сул орон</b> · ${cap} оюутнаас ${took} нь тэнцсэн`)}
      </span>
    </div>`;
}


/* -------- Байгууллагын карт (оюутны жагсаалт) -------- */
export const orgCard = o => html`
  <a class="org-card" href="#/organizations/${o.organization_id}"
     style="--a-line:var(--t${tone(o.name)})">
    ${raw(avatar(o.name, o.logo))}
    <h3>${o.name}</h3>
    <p class="meta">${o.industry}<br>${o.location}</p>
    <div class="card-foot">
      <span>${o.position_count} чиглэл</span>
      <span class="slots ${o.open_slots < 1 ? 'none' : ''}">
        ${o.open_slots > 0 ? o.open_slots + ' сул орон' : 'Орон тоо дүүрсэн'}
      </span>
    </div>
  </a>`;


/* -------- Дадлагын чиглэл (байгууллагын дэлгэрэнгүй дээр) -------- */
export function positionRow(p) {
  let action;

  if (p.my_status)                action = badge(p.my_status);
  else if (!p.is_open)            action = html`<span class="badge b-fail">Хаагдсан</span>`;
  else if (p.remaining_slots < 1) action = html`<span class="badge b-fail">Дүүрсэн</span>`;
  else action = html`<button type="button" class="btn sm" data-apply="${p.position_id}">Хүсэлт илгээх</button>`;

  return html`
    <div class="row">
      <div class="row-in">
        <div style="flex:1;min-width:220px">
          <h3>${p.title}</h3>
          ${raw(capacityBar(p.capacity, p.accepted_count))}
        </div>
        <div class="row-acts">${raw(action)}</div>
      </div>
    </div>`;
}


/* -------- Байгууллагад ирсэн хүсэлт -------- */
export function incomingRow(r) {
  const btn = (status, label, cls = '') => html`
    <button type="button" class="btn sm ${cls}" data-id="${r.request_id}" data-set="${status}">${label}</button>`;

  // Одоогийн төлөвөөс хамаарч дараагийн алхмуудыг л харуулна
  const acts = {
    'Илгээсэн'    : btn('Хүлээн авсан', 'Хүлээн авах') + btn('Тэнцээгүй', 'Татгалзах', 'ghost'),
    'Хүлээн авсан': btn('Тэнцсэн', 'Тэнцсэн', 'pass') + btn('Тэнцээгүй', 'Тэнцээгүй', 'ghost'),
    'Тэнцсэн'     : btn('Тэнцээгүй', 'Тэнцээгүй болгох', 'ghost'),
    'Тэнцээгүй'   : btn('Тэнцсэн', 'Тэнцсэн болгох', 'ghost')
  }[r.status] || '';

  const name = `${r.last_name} ${r.first_name}`;

  return html`
    <div class="row req">
      <div class="req-head">
        ${raw(avatar(name))}
        <div class="req-who">
          <h3>${name}</h3>
          <p class="meta">${r.school} · ${r.major} · ${r.course}-р курс</p>
        </div>
        ${raw(badge(r.status))}
      </div>

      <div class="req-grid">
        <div>
          <span class="mono">Дадлагын чиглэл</span>
          <b>${r.position_title}</b>
        </div>
        <div>
          <span class="mono">Хүсэлт илгээсэн</span>
          <b>${day(r.submitted_at)}</b>
        </div>
        <div>
          <span class="mono">И-мэйл</span>
          <a href="mailto:${r.email}">${r.email}</a>
        </div>
        <div>
          <span class="mono">Утас</span>
          <a href="tel:${r.phone}">${r.phone}</a>
        </div>
      </div>

      ${raw(acts ? html`<div class="req-acts">${raw(acts)}</div>` : '')}
    </div>`;
}


/* -------- Байгууллагын өөрийн чиглэл (удирдах) -------- */
export const managedPositionRow = p => html`
  <div class="row">
    <div class="row-in">
      <div style="flex:1;min-width:220px">
        <h3>${p.title}</h3>
        <p class="meta">
          Шинэ хүсэлт ${p.pending_count} · Судалж буй ${p.reviewing_count}
          ${raw(p.is_open ? '' : ' · <strong>Хаагдсан</strong>')}
        </p>
        ${raw(capacityBar(p.capacity, p.accepted_count))}
      </div>
      <div class="row-acts">
        <button type="button" class="btn sm ghost"
                data-toggle="${p.position_id}"
                data-open="${p.is_open ? 1 : 0}"
                data-title="${p.title}"
                data-capacity="${p.capacity}">${p.is_open ? 'Хаах' : 'Нээх'}</button>
        <button type="button" class="btn sm warn" data-del="${p.position_id}">Устгах</button>
      </div>
    </div>
  </div>`;
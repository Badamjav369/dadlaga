// =====================================================
//  components/placement.js — оюутны дадлагын хүсэлтүүд
//
//  Хүсэлт бүрийг тасалбар хэлбэрээр харуулна.
//  Тасалбарын өнгө нь төлөвөөс хамаарна:
//    Илгээсэн     — саарал хар, хүлээж буй
//    Хүлээн авсан — шаргал, судалгаанд орсон
//    Тэнцсэн      — ногоон, дараагийн алхам нээгдэнэ
//    Тэнцээгүй    — цайвар, бүдэгрүүлж хойш тавина
// =====================================================

import { html, raw, day, esc } from '../core/dom.js';
import { blank, tiles } from './ui.js';

const CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
  stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`;

const CLOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
  stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`;

const EYE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>`;

const CROSS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
  stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`;

/** Төлөв бүрийн харагдах байдал ба явцын алхмууд */
const LOOK = {
  'Илгээсэн': {
    state: 'wait', icon: CLOCK, label: 'Хариу хүлээж байна',
    steps: ['now', '', ''], note: 'Байгууллага таны хүсэлтийг хараахан үзээгүй байна.'
  },
  'Хүлээн авсан': {
    state: 'review', icon: EYE, label: 'Байгууллага судалж байна',
    steps: ['done', 'now', ''], note: 'Байгууллага тантай удахгүй холбогдоно.'
  },
  'Тэнцсэн': {
    state: 'pass', icon: CHECK, label: 'Тэнцсэн',
    steps: ['done', 'done', 'done'], note: 'Байгууллагатай холбогдож дадлагаа эхлүүлнэ үү.'
  },
  'Тэнцээгүй': {
    state: 'fail', icon: CROSS, label: 'Тэнцээгүй',
    steps: ['done', 'done', 'fail'], note: ''
  }
};

const STEP_NAMES = ['Хүсэлт илгээсэн', 'Байгууллага үзсэн', 'Эцсийн шийдвэр'];


/** Гурван цэгээр илэрхийлсэн явц */
function steps(marks) {
  const parts = [];

  marks.forEach((on, i) => {
    if (i > 0) {
      const barOn = marks[i - 1] === 'done' ? 'done' : '';
      parts.push(`<span class="pl-bar" data-on="${barOn}"></span>`);
    }
    parts.push(
      `<span class="pl-dot" data-on="${on}" title="${esc(STEP_NAMES[i])}"></span>`);
  });

  const now = marks.lastIndexOf('done');
  const label = marks.includes('now')
    ? STEP_NAMES[marks.indexOf('now')]
    : STEP_NAMES[Math.max(now, 0)];

  return `<div class="pl-steps">${parts.join('')}
            <span class="pl-steps-label">${esc(label)}</span>
          </div>`;
}


/** Нэг хүсэлтийн тасалбар */
export function placement(r) {
  const look = LOOK[r.status] || LOOK['Илгээсэн'];

  // Холбоо барих мэдээллийг байгууллага үзсэний дараа л нээнэ.
  // Тэнцээгүй бол хэрэггүй.
  const showContact = r.status === 'Хүлээн авсан' || r.status === 'Тэнцсэн';

  return html`
    <div class="placement" data-state="${look.state}">
      <div class="pl-main">
        <span class="pl-eyebrow">${raw(look.icon)}${look.label}</span>

        <a class="pl-org" href="#/organizations/${r.organization_id}">${r.organization_name}</a>
        <p class="pl-pos">${r.position_title}</p>

        ${raw(steps(look.steps))}

        ${raw(showContact ? html`
          <div class="pl-contact">
            ${look.note}<br>
            <a href="mailto:${r.organization_email}">${r.organization_email}</a>
            &nbsp;·&nbsp; ${r.organization_phone}
          </div>` : '')}
      </div>

      <div class="pl-stub">
        <div class="pl-cell">
          <span class="mono">Илгээсэн</span>
          <b>${day(r.submitted_at)}</b>
        </div>
        <div class="pl-cell">
          <span class="mono">Шинэчилсэн</span>
          <b>${day(r.updated_at)}</b>
        </div>
        ${raw(r.status === 'Илгээсэн' ? html`
          <button type="button" class="btn sm ghost pl-cancel"
                  data-cancel="${r.request_id}">Хүсэлт буцаах</button>` : '')}
      </div>
    </div>`;
}


/**
 * Профайл дээрх бүхэл блок.
 * Бүх хүсэлтийг харуулна — чухлаас нь эхэлж эрэмбэлнэ.
 */
export function placementBlock(requests) {
  if (!requests.length) {
    return blank({
      icon : 'send',
      title: 'Дадлагын хүсэлт илгээгээгүй байна',
      text : 'Байгууллагуудыг үзээд тохирох чиглэлд хүсэлт илгээнэ үү.',
      action: '<a class="btn sm" href="#/organizations" style="text-decoration:none">Байгууллага үзэх</a>'
    });
  }

  // Тэнцсэн нь хамгийн чухал, тэнцээгүй нь хамгийн сүүлд.
  // Ижил төлөвтэй бол шинэ нь дээр.
  const rank = { 'Тэнцсэн': 0, 'Хүлээн авсан': 1, 'Илгээсэн': 2, 'Тэнцээгүй': 3 };
  const list = [...requests].sort((a, b) =>
    (rank[a.status] - rank[b.status]) ||
    String(b.submitted_at).localeCompare(String(a.submitted_at)));

  const n = st => list.filter(r => r.status === st).length;

  return html`
    ${raw(tiles([
      [list.length,          'Нийт хүсэлт'],
      [n('Илгээсэн'),        'Хүлээгдэж буй'],
      [n('Тэнцсэн'),         'Тэнцсэн'],
      [n('Тэнцээгүй'),       'Тэнцээгүй']
    ]))}

    <div class="section-title">
      <h2>Хүсэлт бүрийн явц</h2>
      <span class="mono">Шинэ нь дээр</span>
    </div>
    ${raw(list.map(placement).join(''))}`;
}
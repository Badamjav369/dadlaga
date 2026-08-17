import { api } from '../core/api.js';
import { $, $$, html, raw, esc, lock, unlock } from '../core/dom.js';
import { blank, skeletonHero, skeletonRows, toast } from '../components/ui.js';
import { hero } from '../components/hero.js';
import { positionRow } from '../components/cards.js';

let orgId;

export default {
  access: 'student',
  layout: 'app',
  title : 'Байгууллага',

  render({ params }) {
    orgId = Number(params.id);
    return `
      <a class="crumb" href="#/organizations">← Жагсаалт руу буцах</a>
      <div id="content">${skeletonHero()}${skeletonRows(2)}</div>`;
  },

  mount() { return load(); }
};

async function load() {
  const box = $('#content');
  if (!box) return;

  try {
    const { organization: o, positions } = await api('/organizations/' + orgId);
    if (!$('#content')) return;

    const open = positions.reduce((n, p) => n + (p.is_open ? p.remaining_slots : 0), 0);

    box.innerHTML =
      hero({
        eyebrow: o.industry,
        title  : o.name,
        sub    : o.location,
        name   : o.name,
        logo   : o.logo,
        facts  : [
          ['И-мэйл', `<a href="mailto:${esc(o.email)}">${esc(o.email)}</a>`],
          ['Утас',   esc(o.phone)],
          ['Вэбсайт', o.website
            ? `<a href="${esc(o.website)}" target="_blank" rel="noopener">${esc(o.website)}</a>`
            : '—'],
          ['Нээлттэй орон', String(open)]
        ]
      })
      + positionList(positions);

    $$('[data-apply]').forEach(btn =>
      btn.addEventListener('click', () => apply(btn, Number(btn.dataset.apply))));

  } catch (err) {
    box.innerHTML = blank({ icon: 'alert', title: 'Ачаалж чадсангүй', text: err.message });
  }
}

function positionList(positions) {
  if (!positions.length) {
    return blank({
      icon : 'folder',
      title: 'Нээлттэй чиглэл алга',
      text : 'Энэ байгууллага одоогоор дадлагын зар оруулаагүй байна.'
    });
  }

  return html`
    <div class="section-title">
      <h2>Дадлагын чиглэлүүд</h2>
      <span class="mono">${positions.length} чиглэл</span>
    </div>
    ${raw(positions.map(positionRow).join(''))}`;
}

async function apply(btn, positionId) {
  lock(btn, 'Илгээж байна…');

  try {
    await api('/requests', { method: 'POST', body: { position_id: positionId } });
    toast('Хүсэлт илгээгдлээ.');
    load();
  } catch (err) {
    toast(err.message, true);
    unlock(btn);
  }
}
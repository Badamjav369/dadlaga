import { api } from '../core/api.js';
import { $, $$, lock, unlock } from '../core/dom.js';
import { blank, skeletonRows, toast, viewHead } from '../components/ui.js';
import { incomingRow } from '../components/cards.js';

const FILTERS = ['', 'Илгээсэн', 'Хүлээн авсан', 'Тэнцсэн', 'Тэнцээгүй'];
let filter = '';

export default {
  access: 'org',
  layout: 'app',
  wide  : true,
  title : 'Ирсэн хүсэлтүүд',

  render() {
    filter = '';

    return `
      ${viewHead({
        eyebrow: 'Байгууллагын булан',
        title  : 'Ирсэн хүсэлтүүд',
        sub    : 'Хүсэлтийг хүлээн авсны дараа оюутантай и-мэйл эсвэл утсаар холбогдож, эцсийн шийдвэрээ энд тэмдэглэнэ.'
      })}

      <div class="chips">
        ${FILTERS.map(s => `
          <button type="button" class="chip" data-filter="${s}"
                  aria-pressed="${s === '' ? 'true' : 'false'}">${s || 'Бүгд'}</button>`).join('')}
      </div>

      <div id="list">${skeletonRows(3)}</div>`;
  },

  mount() {
    $$('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        $$('.chip').forEach(c => c.setAttribute('aria-pressed', 'false'));
        chip.setAttribute('aria-pressed', 'true');
        filter = chip.dataset.filter;
        load();
      });
    });

    return load();
  }
};

async function load() {
  const list = $('#list');
  if (!list) return;

  try {
    const items = await api('/requests/incoming?status=' + encodeURIComponent(filter));
    if (!$('#list')) return;

    if (!items.length) {
      list.innerHTML = blank({
        icon : 'inbox',
        title: filter ? 'Энэ төлөвт хүсэлт алга' : 'Хүсэлт ирээгүй байна',
        text : filter
          ? 'Өөр төлөв сонгож үзнэ үү.'
          : 'Дадлагын чиглэлээ нэмбэл оюутнууд хүсэлт илгээж эхэлнэ.'
      });
      return;
    }

    list.innerHTML = items.map(incomingRow).join('');

    $$('[data-set]').forEach(btn =>
      btn.addEventListener('click', () =>
        setStatus(btn, Number(btn.dataset.id), btn.dataset.set)));

  } catch (err) {
    list.innerHTML = blank({ icon: 'alert', title: 'Ачаалж чадсангүй', text: err.message });
  }
}

async function setStatus(btn, requestId, status) {
  lock(btn, 'Түр хүлээнэ үү…');

  try {
    const res = await api(`/requests/${requestId}/status`, { method: 'PATCH', body: { status } });
    toast(res.message);
    load();
  } catch (err) {
    toast(err.message, true);
    unlock(btn);
  }
}
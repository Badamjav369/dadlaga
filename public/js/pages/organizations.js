// =====================================================
//  pages/organizations.js — байгууллагуудын жагсаалт
//
//  Шүүлтүүр нь жагсаалтаас сонгодог. Таб хэлбэртэй
//  байхад салбар олон бол хажуу тийш сунаж, нарийн
//  дэлгэцэнд багтахаа больсон.
// =====================================================

import { api } from '../core/api.js';
import { $, $$, esc } from '../core/dom.js';
import { field, blank, skeletonCards, viewHead } from '../components/ui.js';
import { orgCard } from '../components/cards.js';

let timer;

export default {
  access: 'student',
  layout: 'app',
  wide  : true,
  title : 'Байгууллагууд',

  render() {
    return `
      ${viewHead({
        eyebrow: 'Оюутны булан',
        title  : 'Дадлагын байгууллагууд',
        sub    : 'Ачаалж байна…'
      })}

      <div class="filter-bar">
        ${field({ id: 'q', label: 'Хайх', type: 'search',
                  placeholder: 'Байгууллагын нэрээр хайх…' })}

        ${field({ id: 'industry', label: 'Мэргэжлийн чиглэл', short: 'Чиглэл',
                  options: [{ value: '', label: 'Ачаалж байна…' }] })}
        ${field({ id: 'location', label: 'Байршил',
                  options: [{ value: '', label: 'Ачаалж байна…' }] })}

        <div class="filter-reset">
          <button type="button" class="btn sm ghost" id="reset" hidden>
            Шүүлтүүр цэвэрлэх
          </button>
        </div>
      </div>

      <div id="list">${skeletonCards(6)}</div>`;
  },

  async mount() {
    // Шүүлтүүрийн сонголт — зөвхөн бодитоор ашиглагдаж буй утгууд
    try {
      const { industries, locations } = await api('/organizations/filters');
      if (!$('#industry')) return;

      fillSelect($('#industry'), industries, 'Бүх чиглэл');
      fillSelect($('#location'), locations,  'Бүх байршил');
    } catch {
      ['industry', 'location'].forEach(id => {
        const el = $('#' + id);
        if (el) el.innerHTML = '<option value="">Ачаалж чадсангүй</option>';
      });
    }

    // Бичих бүрт хайхгүй — 350мс амарсны дараа нэг л удаа
    $('#q').addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(load, 350);
    });

    $('#industry').addEventListener('change', load);
    $('#location').addEventListener('change', load);

    $('#reset').addEventListener('click', () => {
      $('#q').value = '';
      $('#industry').value = '';
      $('#location').value = '';
      load();
    });

    load();
  },

  destroy() { clearTimeout(timer); }
};


/**
 * Жагсаалтыг select-д дүүргэнэ.
 * Хажууд нь тухайн шүүлтүүрт хэдэн байгууллага байгааг харуулна.
 */
function fillSelect(select, list, allLabel) {
  select.innerHTML =
    `<option value="">${esc(allLabel)}</option>` +
    list.map(x => `<option value="${x.id}">${esc(x.name)} (${x.n})</option>`).join('');
}


async function load() {
  const list = $('#list');
  if (!list) return;

  const q        = $('#q').value.trim();
  const industry = $('#industry').value;
  const location = $('#location').value;

  // Идэвхтэй шүүлтүүрийг өнгөөр тэмдэглэнэ
  $('#industry').dataset.on = String(Boolean(industry));
  $('#location').dataset.on = String(Boolean(location));
  $('#reset').hidden = !(q || industry || location);

  try {
    const orgs = await api('/organizations?' + new URLSearchParams({ q, industry, location }));
    if (!$('#list')) return;   // хуудас солигдсон бол зогсоно

    $('#sub').textContent = orgs.length
      ? `${orgs.length} байгууллага олдлоо`
      : 'Илэрц олдсонгүй';

    list.innerHTML = orgs.length
      ? `<div class="grid">${orgs.map(orgCard).join('')}</div>`
      : blank({
          icon : 'search',
          title: 'Илэрц олдсонгүй',
          text : 'Хайлтын үг эсвэл шүүлтүүрээ өөрчилж үзнэ үү.'
        });

  } catch (err) {
    list.innerHTML = blank({ icon: 'alert', title: 'Ачаалж чадсангүй', text: err.message });
  }
}
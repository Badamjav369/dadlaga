import { api, upload, Auth } from '../core/api.js';
import { $, $$, lock, unlock, initial, esc } from '../core/dom.js';
import { field, alertBox, showAlert, hideAlert, toast, tiles, skeletonRows, viewHead } from '../components/ui.js';
import { tabs, panel, wireTabs, activeTab } from '../components/tabs.js';
import { managedPositionRow } from '../components/cards.js';
import { passwordSection, wirePasswordForm } from '../components/passwordForm.js';
import { check, required, applyServerErrors, isEmail, isPhone, MSG } from '../core/validate.js';
import { lookups, fillSelect } from '../core/lookups.js';

const TABS = [
  { id: 'positions', label: 'Дадлагын чиглэл',       short: 'Чиглэл' },
  { id: 'info',      label: 'Байгууллагын мэдээлэл', short: 'Мэдээлэл' },
  { id: 'password',  label: 'Нууц үг',               short: 'Нууц үг' }
];

export default {
  access: 'org',
  layout: 'app',
  title : 'Байгууллагын мэдээлэл',

  render({ query }) {
    const active = activeTab(query, TABS);

    return `
      ${viewHead({
        eyebrow: 'Байгууллагын булан',
        title  : 'Байгууллагын мэдээлэл',
        sub    : 'Оюутнууд таныг эдгээр мэдээллээр хайж олно.'
      })}

      <div id="stats"></div>

      ${tabs(TABS, active)}

      ${panel('positions', active, `
        <div class="panel">
          <h2>Дадлагын чиглэлүүд</h2>
          <p class="panel-sub">Ямар чиглэлээр хэдэн оюутан авахаа зарлана.</p>

          <div id="positions">${skeletonRows(2)}</div>

          <form id="addForm" novalidate
                style="margin-top:20px;padding-top:20px;border-top:1px solid var(--line)">
            <div class="pair">
              ${field({ id: 'title',    label: 'Шинэ чиглэлийн нэр', placeholder: 'Веб хөгжүүлэгч' })}
              ${field({ id: 'capacity', label: 'Авах оюутны тоо', type: 'number', min: 1, max: 200, placeholder: '4' })}
            </div>
            <button type="submit" class="btn">Чиглэл нэмэх</button>
          </form>
        </div>`)}

      ${panel('info', active, `
        ${alertBox()}

        <div class="panel">
          <h2>Лого</h2>
          <p class="panel-sub">Жагсаалт дээр таны картан дээр харагдана.</p>

          <div class="logo-row">
            <div class="logo-frame" id="logoFrame"><b>?</b></div>
            <div class="logo-acts">
              <span class="btn sm file-btn">
                <span id="pickLabel">Зураг сонгох</span>
                <input type="file" id="logoInput" accept="image/png,image/jpeg,image/webp">
              </span>
              <button type="button" class="btn sm ghost" id="logoDrop" hidden>Устгах</button>
              <p>PNG, JPG эсвэл WEBP. Хамгийн ихдээ 2 МБ.</p>
            </div>
          </div>
        </div>

        <div class="panel">
          <h2>Үндсэн мэдээлэл</h2>
          <p class="panel-sub">Жагсаалт болон дэлгэрэнгүй хуудсанд харагдана.</p>

          <form id="orgForm" novalidate>
            ${field({ id: 'name', label: 'Байгууллагын нэр' })}
            ${field({ id: 'username', label: 'Нэвтрэх нэр', disabled: true })}
            <div class="pair">
              ${field({ id: 'email', label: 'И-мэйл хаяг', type: 'email' })}
              ${field({ id: 'phone', label: 'Утасны дугаар', type: 'tel' })}
            </div>
            <div class="pair">
              ${field({ id: 'industry_id', label: 'Үйл ажиллагааны чиглэл',
                        options: [{ value: '', label: 'Ачаалж байна…' }] })}
              ${field({ id: 'location_id', label: 'Байршил',
                        options: [{ value: '', label: 'Ачаалж байна…' }] })}
            </div>
            ${field({ id: 'website', label: 'Вэбсайт', type: 'url', placeholder: 'https://example.mn' })}
            <button type="submit" class="btn">Өөрчлөлт хадгалах</button>
          </form>
        </div>`)}

      ${panel('password', active, passwordSection())}`;
  },

  mount() {
    wireTabs();
    wirePasswordForm();
    $('#orgForm').addEventListener('submit', saveProfile);
    $('#addForm').addEventListener('submit', addPosition);
    $('#logoInput').addEventListener('change', sendLogo);
    $('#logoDrop').addEventListener('click', dropLogo);
    return load();
  }
};

async function load() {
  try {
    const { profile, positions, totals } = await api('/organizations/me');
    if (!$('#orgForm')) return;

    await fill(profile);
    renderLogo(profile);

    $('#stats').innerHTML = tiles([
      [positions.length, 'Чиглэл'],
      [totals.capacity,  'Нийт авах'],
      [totals.accepted,  'Тэнцсэн'],
      [totals.pending,   'Шинэ хүсэлт']
    ]);

    $('#positions').innerHTML = positions.length
      ? positions.map(managedPositionRow).join('')
      : '<p class="meta">Чиглэл нэмээгүй байна. Доор шинээр үүсгэнэ үү.</p>';

    $$('[data-toggle]').forEach(b => b.addEventListener('click', () => togglePosition(b)));
    $$('[data-del]').forEach(b => b.addEventListener('click', () => deletePosition(b)));

  } catch (err) {
    showAlert(err.message);
  }
}

async function fill(p) {
  ['name', 'username', 'email', 'phone']
    .forEach(k => { const el = $('#' + k); if (el) el.value = p[k]; });
  $('#website').value = p.website || '';

  try {
    const { industries, locations } = await lookups();
    fillSelect($('#industry_id'), industries, p.industry_id);
    fillSelect($('#location_id'), locations,  p.location_id);
  } catch {
    toast('Салбар, байршлын жагсаалт ачаалж чадсангүй.', true);
  }
}

function renderLogo(p) {
  $('#logoFrame').innerHTML = p.logo
    ? `<img src="${esc(p.logo)}" alt="${esc(p.name)}">`
    : `<b>${esc(initial(p.name))}</b>`;

  $('#logoDrop').hidden = !p.logo;
}

async function sendLogo(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    toast('Зургийн хэмжээ 2 МБ-аас бага байх ёстой.', true);
    e.target.value = '';
    return;
  }

  const label = $('#pickLabel');
  label.textContent = 'Байршуулж байна…';

  const body = new FormData();
  body.append('logo', file);

  try {
    const res = await upload('/organizations/me/logo', body);
    toast(res.message);
    load();
  } catch (err) {
    toast(err.message, true);
  } finally {
    label.textContent = 'Зураг сонгох';
    e.target.value = '';
  }
}

async function dropLogo() {
  if (!confirm('Логог устгах уу?')) return;

  try {
    const res = await api('/organizations/me/logo', { method: 'DELETE' });
    toast(res.message);
    load();
  } catch (err) {
    toast(err.message, true);
  }
}

async function togglePosition(btn) {
  lock(btn, '…');

  try {
    await api('/positions/' + btn.dataset.toggle, {
      method: 'PUT',
      body: {
        title   : btn.dataset.title,
        capacity: Number(btn.dataset.capacity),
        is_open : btn.dataset.open !== '1'
      }
    });
    toast(btn.dataset.open === '1' ? 'Чиглэл хаагдлаа.' : 'Чиглэл нээгдлээ.');
    load();
  } catch (err) {
    toast(err.message, true);
    unlock(btn);
  }
}

async function deletePosition(btn) {
  if (!confirm('Энэ чиглэлийг устгах уу? Ирсэн бүх хүсэлт хамт устана.')) return;

  lock(btn, '…');

  try {
    await api('/positions/' + btn.dataset.del, { method: 'DELETE' });
    toast('Чиглэл устлаа.');
    load();
  } catch (err) {
    toast(err.message, true);
    unlock(btn);
  }
}

async function addPosition(e) {
  e.preventDefault();
  const form = e.target;

  const ok = check(form, [
    ['title',    required('Чиглэлийн нэрийг оруулна уу.')],
    ['capacity', v => Number(v) >= 1 || 'Авах оюутны тоо 1-ээс их байна.']
  ]);
  if (!ok) return;

  const btn = $('.btn', form);
  lock(btn, 'Нэмж байна…');

  try {
    await api('/positions', {
      method: 'POST',
      body: { title: $('#title').value.trim(), capacity: Number($('#capacity').value) }
    });
    $('#title').value = '';
    $('#capacity').value = '';
    toast('Чиглэл нэмэгдлээ.');
    load();
  } catch (err) {
    toast(err.message, true);
  } finally {
    unlock(btn);
  }
}

async function saveProfile(e) {
  e.preventDefault();
  const form = e.target;
  hideAlert();

  const ok = check(form, [
    ['name',        required('Байгууллагын нэрээ оруулна уу.')],
    ['industry_id', v => Boolean(Number(v)) || 'Үйл ажиллагааны чиглэлээ сонгоно уу.'],
    ['location_id', v => Boolean(Number(v)) || 'Байршлаа сонгоно уу.'],
    ['email',       v => isEmail(v) || MSG.email],
    ['phone',       v => isPhone(v) || MSG.phone]
  ]);
  if (!ok) return;

  const body = {
    name       : $('#name').value.trim(),
    email      : $('#email').value.trim().toLowerCase(),
    phone      : $('#phone').value.trim(),
    industry_id: Number($('#industry_id').value),
    location_id: Number($('#location_id').value),
    website    : $('#website').value.trim() || null
  };

  const btn = $('.btn', form);
  lock(btn, 'Хадгалж байна…');

  try {
    await api('/organizations/me', { method: 'PUT', body });
    toast('Мэдээлэл шинэчлэгдлээ.');

    Auth.patch({ name: body.name });
    const who = document.querySelector('.who b');
    if (who) who.textContent = body.name;

  } catch (err) {
    showAlert(err.message);
    applyServerErrors(form, err.errors);
  } finally {
    unlock(btn);
  }
}
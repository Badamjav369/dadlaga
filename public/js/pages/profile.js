// =====================================================
//  pages/profile.js — оюутны профайл
//
//  Гурван таб: дадлагын байдал / хувийн мэдээлэл / нууц үг.
//  Хүсэлт олон болоход маягтууд доошоо алдагдахгүй.
// =====================================================

import { api, Auth } from '../core/api.js';
import { $, $$, lock, unlock } from '../core/dom.js';
import { field, alertBox, showAlert, hideAlert, toast, skeletonHero, viewHead } from '../components/ui.js';
import { tabs, panel, wireTabs, activeTab } from '../components/tabs.js';
import { placementBlock } from '../components/placement.js';
import { passwordSection, wirePasswordForm } from '../components/passwordForm.js';
import { check, required, applyServerErrors, isEmail, isPhone, MSG } from '../core/validate.js';

const TABS = [
  { id: 'status',   label: 'Миний хүсэлтүүд', short: 'Хүсэлт' },
  { id: 'info',     label: 'Хувийн мэдээлэл', short: 'Мэдээлэл' },
  { id: 'password', label: 'Нууц үг',         short: 'Нууц үг' }
];

const COURSES = [
  { value: '1', label: '1-р курс' },
  { value: '2', label: '2-р курс' },
  { value: '3', label: '3-р курс' },
  { value: '4', label: '4-р курс' },
  { value: '5', label: 'Магистр' }
];

export default {
  access: 'student',
  layout: 'app',
  title : 'Миний дадлага',

  render({ query }) {
    const active = activeTab(query, TABS);

    return `
      ${viewHead({
        eyebrow: 'Оюутны булан',
        title  : 'Миний дадлага',
        sub    : 'Илгээсэн хүсэлт бүрийн явц болон таны мэдээлэл.'
      })}

      ${tabs(TABS, active)}

      ${panel('status', active, `<div id="placement">${skeletonHero()}</div>`)}

      ${panel('info', active, `
        ${alertBox()}
        <div class="panel">
          <h2>Хувийн мэдээлэл</h2>
          <p class="panel-sub">Өөрчилсөн мэдээлэл байгууллагын талд шууд харагдана.</p>

          <form id="profileForm" novalidate>
            <div class="pair">
              ${field({ id: 'last_name',  label: 'Овог' })}
              ${field({ id: 'first_name', label: 'Нэр' })}
            </div>
            ${field({ id: 'username', label: 'Нэвтрэх нэр', disabled: true })}
            <div class="pair">
              ${field({ id: 'email', label: 'И-мэйл хаяг', type: 'email' })}
              ${field({ id: 'phone', label: 'Утасны дугаар', type: 'tel' })}
            </div>
            ${field({ id: 'school', label: 'Сургууль' })}
            <div class="pair">
              ${field({ id: 'major',  label: 'Мэргэжил' })}
              ${field({ id: 'course', label: 'Анги', options: COURSES })}
            </div>
            <button type="submit" class="btn">Өөрчлөлт хадгалах</button>
          </form>
        </div>`)}

      ${panel('password', active, passwordSection())}`;
  },

  async mount() {
    wireTabs();
    wirePasswordForm();
    $('#profileForm').addEventListener('submit', save);

    // Хоёр хүсэлтийг зэрэг явуулна
    const [profileRes, requests] = await Promise.allSettled([
      api('/students/me'),
      api('/requests/my')
    ]);

    if (profileRes.status === 'fulfilled') {
      fill(profileRes.value.profile);
    } else {
      showAlert(profileRes.reason.message);
    }

    const box = $('#placement');
    if (!box) return;

    if (requests.status !== 'fulfilled') { box.innerHTML = ''; return; }

    box.innerHTML = placementBlock(requests.value);
    wireCancel();
  }
};


/* -------- Хүсэлт буцаах -------- */
function wireCancel() {
  $$('[data-cancel]').forEach(btn =>
    btn.addEventListener('click', () => cancel(btn, Number(btn.dataset.cancel))));
}

async function cancel(btn, requestId) {
  if (!confirm('Хүсэлтээ буцаах уу?')) return;

  lock(btn, 'Түр хүлээнэ үү…');

  try {
    await api('/requests/' + requestId, { method: 'DELETE' });
    toast('Хүсэлт буцаагдлаа.');

    const list = await api('/requests/my');
    const box  = $('#placement');
    if (!box) return;
    box.innerHTML = placementBlock(list);
    wireCancel();

  } catch (err) {
    toast(err.message, true);
    unlock(btn);
  }
}


function fill(p) {
  ['last_name', 'first_name', 'username', 'email', 'phone', 'school', 'major', 'course']
    .forEach(k => { const el = $('#' + k); if (el) el.value = p[k]; });
}


async function save(e) {
  e.preventDefault();
  const form = e.target;
  hideAlert();

  const ok = check(form, [
    ['last_name',  required('Овгоо оруулна уу.')],
    ['first_name', required('Нэрээ оруулна уу.')],
    ['email',      v => isEmail(v) || MSG.email],
    ['phone',      v => isPhone(v) || MSG.phone],
    ['school',     required('Сургуулиа оруулна уу.')],
    ['major',      required('Мэргэжлээ оруулна уу.')]
  ]);
  if (!ok) return;

  const body = {
    last_name : $('#last_name').value.trim(),
    first_name: $('#first_name').value.trim(),
    email     : $('#email').value.trim().toLowerCase(),
    phone     : $('#phone').value.trim(),
    school    : $('#school').value.trim(),
    major     : $('#major').value.trim(),
    course    : Number($('#course').value)
  };

  const btn = $('.btn', form);
  lock(btn, 'Хадгалж байна…');

  try {
    await api('/students/me', { method: 'PUT', body });
    toast('Профайл шинэчлэгдлээ.');

    const name = `${body.last_name} ${body.first_name}`;
    Auth.patch({ name });
    const who = document.querySelector('.who b');
    if (who) who.textContent = name;

  } catch (err) {
    showAlert(err.message);
    applyServerErrors(form, err.errors);
  } finally {
    unlock(btn);
  }
}
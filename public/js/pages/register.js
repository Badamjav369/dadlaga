// =====================================================
//  pages/register.js
// =====================================================

import { api } from '../core/api.js';
import { $, lock, unlock } from '../core/dom.js';
import { authShell, rolePicker, wireRolePicker, setRole, currentRole } from '../components/authShell.js';
import { alertBox, showAlert, hideAlert, field, passwordField, wireEyes } from '../components/ui.js';
import { check, required, applyServerErrors, isEmail, isPhone, isUser, MSG } from '../core/validate.js';
import { lookups, fillSelect } from '../core/lookups.js';

const COURSES = [
  { value: '',  label: 'Сонгох' },
  { value: '1', label: '1-р курс' },
  { value: '2', label: '2-р курс' },
  { value: '3', label: '3-р курс' },
  { value: '4', label: '4-р курс' },
  { value: '5', label: 'Магистр' }
];

/* -------- Дүр тус бүрийн талбарууд -------- */
const studentFields = () => `
  <div class="pair">
    ${field({ id: 'last_name',  label: 'Овог', placeholder: 'Батбаяр' })}
    ${field({ id: 'first_name', label: 'Нэр',  placeholder: 'Тэмүүлэн' })}
  </div>
  ${field({ id: 'school', label: 'Сургууль', placeholder: 'МУИС, ШУТИС, СЭЗИС…' })}
  <div class="pair">
    ${field({ id: 'major',  label: 'Мэргэжил', placeholder: 'Програм хангамж' })}
    ${field({ id: 'course', label: 'Анги', options: COURSES })}
  </div>`;

// Салбар, байршил нь тогтмол жагсаалтаас сонгогдоно.
// Чөлөөт текст байсан үед "Банк, санхүү" ба "Банк санхүү"
// гэсэн хоёр өөр утга үүсэж, шүүлтүүрт давхардаж байсан.
const orgFields = () => `
  ${field({ id: 'name', label: 'Байгууллагын нэр', placeholder: 'Ай Ти Зон ХХК' })}
  ${field({ id: 'industry_id', label: 'Үйл ажиллагааны чиглэл',
            options: [{ value: '', label: 'Ачаалж байна…' }] })}
  <div class="pair">
    ${field({ id: 'location_id', label: 'Байршил',
              options: [{ value: '', label: 'Ачаалж байна…' }] })}
    ${field({ id: 'website', label: 'Вэбсайт', type: 'url', placeholder: 'https://example.mn' })}
  </div>`;


/** Хоёр select-ийг серверээс ирсэн жагсаалтаар дүүргэнэ */
async function loadLookups() {
  try {
    const { industries, locations } = await lookups();
    fillSelect(document.getElementById('industry_id'), industries);
    fillSelect(document.getElementById('location_id'), locations);
  } catch {
    ['industry_id', 'location_id'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<option value="">Ачаалж чадсангүй</option>';
    });
  }
}


export default {
  access: 'guest',
  layout: 'auth',
  title : 'Бүртгүүлэх',

  render() {
    const role = currentRole();

    const body = `
      <header class="card-head">
        <h1>Бүртгүүлэх</h1>
        <p>Эхлээд ямар талаас нэгдэхээ сонгоно уу.</p>
      </header>

      ${rolePicker(role)}
      ${alertBox()}

      <form id="form" novalidate>
        <div id="roleFields">${role === 'student' ? studentFields() : orgFields()}</div>

        ${field({ id: 'username', label: 'Нэвтрэх нэр', placeholder: 'temuulen', autocomplete: 'username' })}
        <div class="pair">
          ${field({ id: 'email', label: 'И-мэйл хаяг', type: 'email', placeholder: 'ner@example.com', autocomplete: 'email' })}
          ${field({ id: 'phone', label: 'Утасны дугаар', type: 'tel', placeholder: '99112233', autocomplete: 'tel' })}
        </div>

        ${passwordField({ id: 'password',  label: 'Нууц үг', placeholder: 'Дор хаяж 6 тэмдэгт' })}
        ${passwordField({ id: 'password2', label: 'Нууц үг давтах' })}

        <label class="check" style="margin:10px 0 4px">
          <input type="checkbox" id="terms">
          <span>Үйлчилгээний нөхцөлийг зөвшөөрч байна.</span>
        </label>
        <p class="err" id="termsErr"></p>

        <button type="submit" class="btn">Бүртгэл үүсгэх</button>
      </form>

      <p class="note">Бүртгэлтэй юу? <a href="#/login" class="link">Нэвтрэх</a></p>`;

    return authShell({ body, role });
  },

  mount() {
    wireEyes();
    setRole(currentRole());

    // Дүр солиход зөвхөн дээд талын талбарууд солигдоно
    wireRolePicker(role => {
      $('#roleFields').innerHTML = role === 'student' ? studentFields() : orgFields();
      if (role === 'org') loadLookups();
    });

    if (currentRole() === 'org') loadLookups();

    const form = $('#form');

    form.addEventListener('submit', async e => {
      e.preventDefault();
      hideAlert();
      $('#termsErr').textContent = '';

      const role = currentRole();

      const shared = [
        ['username',  v => isUser(v) || (v.trim() ? MSG.username : 'Нэвтрэх нэрээ оруулна уу.')],
        ['email',     v => isEmail(v) || MSG.email],
        ['phone',     v => isPhone(v) || MSG.phone],
        ['password',  v => v.length >= 6 || MSG.password],
        ['password2', v => v === $('#password').value || MSG.match]
      ];

      const perRole = role === 'student'
        ? [
            ['last_name',  required('Овгоо оруулна уу.')],
            ['first_name', required('Нэрээ оруулна уу.')],
            ['school',     required('Сургуулиа оруулна уу.')],
            ['major',      required('Мэргэжлээ оруулна уу.')],
            ['course',     required('Ангиа сонгоно уу.')]
          ]
        : [
            ['name',        required('Байгууллагын нэрээ оруулна уу.')],
            ['industry_id', v => Boolean(Number(v)) || 'Үйл ажиллагааны чиглэлээ сонгоно уу.'],
            ['location_id', v => Boolean(Number(v)) || 'Байршлаа сонгоно уу.']
          ];

      let ok = check(form, [...perRole, ...shared]);

      if (!$('#terms').checked) {
        $('#termsErr').textContent = 'Үйлчилгээний нөхцөлийг зөвшөөрнө үү.';
        ok = false;
      }
      if (!ok) {
        showAlert('Улаанаар тэмдэглэсэн талбаруудыг засна уу.');
        return;
      }

      const body = role === 'student'
        ? {
            last_name : $('#last_name').value.trim(),
            first_name: $('#first_name').value.trim(),
            school    : $('#school').value.trim(),
            major     : $('#major').value.trim(),
            course    : Number($('#course').value)
          }
        : {
            name       : $('#name').value.trim(),
            industry_id: Number($('#industry_id').value),
            location_id: Number($('#location_id').value),
            website    : $('#website').value.trim() || null
          };

      Object.assign(body, {
        username: $('#username').value.trim(),
        email   : $('#email').value.trim().toLowerCase(),
        phone   : $('#phone').value.trim(),
        password: $('#password').value
      });

      const btn = $('.btn', form);
      lock(btn, 'Бүртгэж байна…');

      try {
        await api(`/auth/register/${role}`, { method: 'POST', body });
        location.hash = `#/login?registered=1&role=${role}`;
      } catch (err) {
        showAlert(err.message);
        applyServerErrors(form, err.errors);
        unlock(btn);
      }
    });
  }
};
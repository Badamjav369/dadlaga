// =====================================================
//  pages/reset.js — токеноор шинэ нууц үг тавих
// =====================================================

import { api } from '../core/api.js';
import { $, lock, unlock, esc } from '../core/dom.js';
import { authShell } from '../components/authShell.js';
import { alertBox, showAlert, showAlertHTML, hideAlert, passwordField, wireEyes } from '../components/ui.js';
import { check, applyServerErrors, MSG } from '../core/validate.js';

export default {
  access: 'guest',
  layout: 'auth',
  title : 'Шинэ нууц үг',

  render() {
    const body = `
      <header class="card-head">
        <h1>Шинэ нууц үг</h1>
        <p>Дор хаяж 6 тэмдэгт байх ёстой.</p>
      </header>

      ${alertBox()}

      <form id="form" novalidate hidden>
        ${passwordField({ id: 'password',  label: 'Шинэ нууц үг' })}
        ${passwordField({ id: 'password2', label: 'Нууц үг давтах' })}
        <button type="submit" class="btn">Нууц үг хадгалах</button>
      </form>

      <p class="note"><a href="#/login" class="link">Нэвтрэх хуудас руу буцах</a></p>`;

    return authShell({ body, quiet: true });
  },

  async mount({ query }) {
    wireEyes();

    const token = query.get('token');
    const form  = $('#form');

    if (!token) {
      showAlert('Холбоос бүрэн биш байна. И-мэйл дэх холбоосыг бүтнээр нь дарна уу.');
      return;
    }

    // Токен хүчинтэй эсэхийг эхлээд шалгана
    try {
      await api('/auth/reset/' + encodeURIComponent(token));
      form.hidden = false;
    } catch (err) {
      showAlertHTML(`${esc(err.message)}<br><a class="link" href="#/forgot">Шинэ холбоос авах</a>`);
      return;
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      hideAlert();

      const ok = check(form, [
        ['password',  v => v.length >= 6 || MSG.password],
        ['password2', v => v === $('#password').value || MSG.match]
      ]);
      if (!ok) return;

      const btn = $('.btn', form);
      lock(btn, 'Хадгалж байна…');

      try {
        await api('/auth/reset', {
          method: 'POST',
          body: { token, password: $('#password').value }
        });
        location.hash = '#/login?reset=1';

      } catch (err) {
        showAlert(err.message);
        applyServerErrors(form, err.errors);
        unlock(btn);
      }
    });
  }
};
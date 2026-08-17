import { api } from '../core/api.js';
import { $, lock, unlock, esc } from '../core/dom.js';
import { authShell, rolePicker, wireRolePicker, setRole, currentRole } from '../components/authShell.js';
import { alertBox, showAlert, showAlertHTML, hideAlert, field } from '../components/ui.js';
import { check, required } from '../core/validate.js';

export default {
  access: 'guest',
  layout: 'auth',
  title : 'Нууц үг сэргээх',

  render() {
    const body = `
      <header class="card-head">
        <h1>Нууц үг сэргээх</h1>
        <p>Бүртгэлтэй нэрээ оруулна уу. Холбоос 30 минут хүчинтэй.</p>
      </header>

      ${rolePicker(currentRole())}
      ${alertBox()}

      <form id="form" novalidate>
        ${field({ id: 'username', label: 'Нэвтрэх нэр', placeholder: 'temuulen', autocomplete: 'username' })}
        <button type="submit" class="btn">Сэргээх холбоос авах</button>
      </form>

      <p class="note"><a href="#/login" class="link">Нэвтрэх хуудас руу буцах</a></p>`;

    return authShell({ body, quiet: true });
  },

  mount() {
    $('[data-stage]')?.setAttribute('data-quiet', '1');
    wireRolePicker();
    setRole(currentRole());

    const form = $('#form');

    form.addEventListener('submit', async e => {
      e.preventDefault();
      hideAlert();

      if (!check(form, [['username', required('Нэвтрэх нэрээ оруулна уу.')]])) return;

      const btn = $('.btn', form);
      lock(btn, 'Илгээж байна…');

      try {
        const res = await api('/auth/forgot', {
          method: 'POST',
          body: { username: $('#username').value.trim(), role: currentRole() }
        });

        if (res.dev_link) {
          const hash = '#/reset?token=' + encodeURIComponent(res.dev_link.split('token=')[1]);
          showAlertHTML(`
            Сэргээх холбоос бэлэн боллоо.<br>
            <a class="link" href="${esc(hash)}">Нууц үгээ шинэчлэх</a><br>
            <span style="font-size:12px;opacity:.75">
              Хөгжүүлэлтийн горим — жинхэнэ системд энэ линк и-мэйлээр очно.
            </span>`, true);
        } else {
          showAlert(res.message, true);
        }

        form.reset();

      } catch (err) {
        showAlert(err.message);
      } finally {
        unlock(btn);
      }
    });
  }
};
import { api, Auth, homeFor } from '../core/api.js';
import { $, lock, unlock, raw } from '../core/dom.js';
import { authShell, rolePicker, wireRolePicker, setRole, currentRole } from '../components/authShell.js';
import { alertBox, showAlert, hideAlert, passwordField, field, wireEyes } from '../components/ui.js';
import { check, required, applyServerErrors } from '../core/validate.js';

export default {
  access: 'guest',
  layout: 'auth',
  title : 'Нэвтрэх',

  render({ query }) {
    const role = query.get('role') || currentRole();

    const body = `
      <header class="card-head">
        <h1>Нэвтрэх</h1>
        <p>Бүртгэлтэй нэрээрээ орно уу.</p>
      </header>

      ${rolePicker(role)}
      ${alertBox()}

      <form id="form" novalidate>
        ${field({ id: 'username', label: 'Нэвтрэх нэр', placeholder: 'temuulen', autocomplete: 'username' })}
        ${passwordField({ id: 'password', label: 'Нууц үг', autocomplete: 'current-password' })}

        <div class="spread">
          <label class="check">
            <input type="checkbox" id="remember" checked>
            <span>Намайг сана</span>
          </label>
          <a href="#/forgot" class="link-soft">Нууц үг мартсан?</a>
        </div>

        <button type="submit" class="btn">Нэвтрэх</button>
      </form>

      <p class="note">Бүртгэлгүй юу? <a href="#/register" class="link">Шинээр бүртгүүлэх</a></p>`;

    return authShell({ body, role });
  },

  mount({ query }) {
    wireEyes();
    wireRolePicker();

    setRole(query.get('role') || currentRole());

    if (query.get('registered') === '1') {
      showAlert('Бүртгэл үүслээ. Одоо нэвтэрнэ үү.', true);
    }
    if (query.get('reset') === '1') {
      showAlert('Нууц үг шинэчлэгдлээ. Одоо нэвтэрнэ үү.', true);
    }

    const form = $('#form');

    form.addEventListener('submit', async e => {
      e.preventDefault();
      hideAlert();

      const ok = check(form, [
        ['username', required('Нэвтрэх нэрээ оруулна уу.')],
        ['password', required('Нууц үгээ оруулна уу.')]
      ]);
      if (!ok) return;

      const btn = $('.btn', form);
      lock(btn, 'Түр хүлээнэ үү…');

      try {
        const data = await api('/auth/login', {
          method: 'POST',
          body: {
            username: $('#username').value.trim(),
            password: $('#password').value,
            role    : currentRole()
          }
        });

        Auth.save(data.token, data.user);
        location.hash = homeFor(data.user.role);

      } catch (err) {
        showAlert(err.message);
        applyServerErrors(form, err.errors);
        unlock(btn);
      }
    });
  }
};
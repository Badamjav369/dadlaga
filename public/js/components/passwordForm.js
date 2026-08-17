import { api } from '../core/api.js';
import { $, lock, unlock } from '../core/dom.js';
import { passwordField, wireEyes, toast } from './ui.js';
import { check, applyServerErrors, MSG } from '../core/validate.js';

export const passwordSection = () => `
  <div class="panel">
    <h2>Нууц үг солих</h2>
    <p class="panel-sub">Шинэ нууц үг дор хаяж 6 тэмдэгт байх ёстой.</p>

    <form id="passwordForm" novalidate>
      ${passwordField({ id: 'current_password', label: 'Одоогийн нууц үг', autocomplete: 'current-password' })}
      <div class="pair">
        ${passwordField({ id: 'new_password',  label: 'Шинэ нууц үг' })}
        ${passwordField({ id: 'new_password2', label: 'Шинэ нууц үг давтах' })}
      </div>
      <button type="submit" class="btn">Нууц үг солих</button>
    </form>
  </div>`;


export function wirePasswordForm() {
  const form = $('#passwordForm');
  if (!form) return;

  wireEyes(form);

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const ok = check(form, [
      ['current_password', v => Boolean(v) || 'Одоогийн нууц үгээ оруулна уу.'],
      ['new_password',     v => v.length >= 6 || MSG.password],
      ['new_password2',    v => v === $('#new_password').value || MSG.match]
    ]);
    if (!ok) return;

    if ($('#current_password').value === $('#new_password').value) {
      toast('Шинэ нууц үг хуучнаасаа өөр байх ёстой.', true);
      return;
    }

    const btn = $('.btn', form);
    lock(btn, 'Солиж байна…');

    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: {
          current_password: $('#current_password').value,
          new_password    : $('#new_password').value
        }
      });
      form.reset();
      toast('Нууц үг солигдлоо.');

    } catch (err) {
      applyServerErrors(form, err.errors);
      if (!Object.keys(err.errors || {}).length) toast(err.message, true);
    } finally {
      unlock(btn);
    }
  });
}
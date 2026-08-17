export const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
export const isPhone = v => /^[689]\d{7}$/.test(String(v || '').trim());
export const isUser  = v => /^[a-zA-Z0-9_.]{3,50}$/.test(String(v || '').trim());

export const MSG = {
  required: 'Энэ талбарыг бөглөнө үү.',
  email   : 'И-мэйл хаяг буруу байна. Жишээ: ner@example.com',
  phone   : '8 оронтой дугаар оруулна уу. Жишээ: 99112233',
  username: 'Латин үсэг, тоо, доогуур зураас ашиглана. 3-50 тэмдэгт.',
  password: 'Нууц үг дор хаяж 6 тэмдэгт байна.',
  match   : 'Хоёр нууц үг ижил байх ёстой.'
};

export function check(form, rules) {
  clearErrors(form);
  let ok = true;

  for (const [id, rule] of rules) {
    const el = form.querySelector('#' + id);
    if (!el) continue;

    const result = rule(el.value, form);
    if (result !== true) {
      setError(el, result);
      ok = false;
    }
  }
  return ok;
}

export function setError(el, message) {
  const field = el.closest('.field');
  if (!field) return;
  field.classList.add('bad');
  const p = field.querySelector('.err');
  if (p) p.textContent = message;
}

export function clearErrors(form) {
  form.querySelectorAll('.field').forEach(f => {
    f.classList.remove('bad');
    const p = f.querySelector('.err');
    if (p) p.textContent = '';
  });
}

export function applyServerErrors(form, errors) {
  Object.entries(errors || {}).forEach(([id, msg]) => {
    const el = form.querySelector('#' + id);
    if (el) setError(el, msg);
  });
}

export const required = (msg = MSG.required) => v => Boolean(String(v).trim()) || msg;
// =====================================================
//  core/api.js — сервертэй харилцах давхарга
// =====================================================

const TOKEN_KEY = 'dadlaga.token';
const USER_KEY  = 'dadlaga.user';

export const Auth = {
  token: () => localStorage.getItem(TOKEN_KEY),

  user() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  },

  save(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  patch(changes) {
    const u = Auth.user();
    if (u) Auth.save(Auth.token(), { ...u, ...changes });
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

/** Дүр бүрийн эхлэх хуудас */
export const homeFor = role => role === 'student' ? '#/organizations' : '#/org/requests';

/**
 * Сервер рүү JSON хүсэлт илгээх.
 * Амжилтгүй бол { status, message, errors } объект шиднэ.
 */
export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token   = Auth.token();
  if (token) headers.Authorization = 'Bearer ' + token;

  let res;
  try {
    res = await fetch('/api' + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw { status: 0, message: 'Сервер хариу өгсөнгүй. Асаалттай эсэхийг шалгана уу.', errors: {} };
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Токен хүчингүй болсон бол сесс цэвэрлээд нэвтрэх хуудас руу
    if (res.status === 401 && token) {
      Auth.clear();
      location.hash = '#/login';
    }
    throw {
      status : res.status,
      message: data.message || 'Алдаа гарлаа.',
      errors : data.errors  || {}
    };
  }

  return data;
}

/** Файл илгээх — FormData ашиглана, JSON биш */
export async function upload(path, formData) {
  const res = await fetch('/api' + path, {
    method : 'POST',
    headers: { Authorization: 'Bearer ' + Auth.token() },
    body   : formData
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, message: data.message || 'Байршуулж чадсангүй.', errors: {} };

  return data;
}
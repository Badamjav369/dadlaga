import { Auth, homeFor } from './api.js';
import { $ } from './dom.js';
import { topbar, wireTopbar } from '../components/topbar.js';

let ROUTES = [];
let current = null;

function compile(path) {
  const keys = [];
  const rx = path.replace(/:([a-zA-Z]+)/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  });
  return { rx: new RegExp('^' + rx + '$'), keys };
}

export function defineRoutes(list) {
  ROUTES = list.map(r => ({ ...r, ...compile(r.path) }));
}

function match(hash) {
  const path = (hash.replace(/^#/, '') || '/').split('?')[0];
  for (const route of ROUTES) {
    const hit = path.match(route.rx);
    if (!hit) continue;

    const params = {};
    route.keys.forEach((k, i) => params[k] = decodeURIComponent(hit[i + 1]));
    return { route, params };
  }
  return null;
}

export function queryParams() {
  const q = location.hash.split('?')[1] || '';
  return new URLSearchParams(q);
}

export function go(hash, { replace = false } = {}) {
  if (replace) location.replace(hash);
  else location.hash = hash;
}

async function render() {
  const app  = $('#app');
  const hit  = match(location.hash);
  const user = Auth.user();

  if (!hit) {
    go(user ? homeFor(user.role) : '#/login', { replace: true });
    return;
  }

  const { route, params } = hit;
  const page = route.page;
  const loggedIn = Boolean(Auth.token() && user);

  if (page.access === 'guest' && loggedIn) {
    go(homeFor(user.role), { replace: true });
    return;
  }
  if (page.access !== 'guest' && !loggedIn) {
    go('#/login', { replace: true });
    return;
  }
  if (['student', 'org'].includes(page.access) && user.role !== page.access) {
    go(homeFor(user.role), { replace: true });
    return;
  }

  if (current?.destroy) current.destroy();
  current = page;

  document.body.dataset.role = loggedIn ? user.role : (document.body.dataset.role || 'student');

  const ctx = { params, query: queryParams(), user, go };
  const body = await page.render(ctx);

  app.innerHTML = page.layout === 'app'
    ? topbar(user, location.hash) + `<main class="view ${page.wide ? '' : 'view-narrow'}">${body}</main>`
    : body;

  if (page.layout === 'app') wireTopbar();
  if (page.mount) await page.mount(ctx);

  document.title = (page.title ? page.title + ' — ' : '') + 'Дадлага.мн';
  window.scrollTo(0, 0);
}

export function startRouter() {
  window.addEventListener('hashchange', render);
  if (!location.hash) location.replace('#/login');
  else render();
}
import { api } from './api.js';

let cache = null;
let pending = null;

export async function lookups() {
  if (cache) return cache;

  if (!pending) {
    pending = api('/lookups')
      .then(data => { cache = data; pending = null; return data; })
      .catch(err => { pending = null; throw err; });
  }

  return pending;
}

export const asOptions = (list, placeholder = 'Сонгох') => [
  { value: '', label: placeholder },
  ...list.map(x => ({ value: String(x.id), label: x.name }))
];

export function fillSelect(select, list, selected = '') {
  if (!select) return;

  select.innerHTML = '<option value="">Сонгох</option>' +
    list.map(x =>
      `<option value="${x.id}"${String(x.id) === String(selected) ? ' selected' : ''}>` +
      `${x.name.replace(/[&<>]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c]))}</option>`
    ).join('');
}
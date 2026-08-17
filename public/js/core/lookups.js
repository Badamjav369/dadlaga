// =====================================================
//  core/lookups.js — салбар, байршлын жагсаалт
//
//  Жагсаалт ховор өөрчлөгддөг тул нэг л удаа татаж,
//  дараа нь санах ойноос өгнө.
// =====================================================

import { api } from './api.js';

let cache = null;
let pending = null;

/** { industries: [{id,name}], locations: [{id,name}] } */
export async function lookups() {
  if (cache) return cache;

  // Хоёр газраас зэрэг дуудвал ганц л хүсэлт явна
  if (!pending) {
    pending = api('/lookups')
      .then(data => { cache = data; pending = null; return data; })
      .catch(err => { pending = null; throw err; });
  }

  return pending;
}

/** <select>-д тавих сонголтууд */
export const asOptions = (list, placeholder = 'Сонгох') => [
  { value: '', label: placeholder },
  ...list.map(x => ({ value: String(x.id), label: x.name }))
];

/** Ачаалагдсан жагсаалтаар select-ийг дүүргэнэ */
export function fillSelect(select, list, selected = '') {
  if (!select) return;

  select.innerHTML = '<option value="">Сонгох</option>' +
    list.map(x =>
      `<option value="${x.id}"${String(x.id) === String(selected) ? ' selected' : ''}>` +
      `${x.name.replace(/[&<>]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c]))}</option>`
    ).join('');
}
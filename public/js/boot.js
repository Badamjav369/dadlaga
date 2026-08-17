// =====================================================
//  boot.js — хамгийн эхэнд ажиллах богино код
//
//  Өнгөний горимыг хуудас зурагдахаас өмнө тавина.
//  Өмнө нь index.html дотор inline <script> байсан ч
//  CSP нь script-src 'self' болсон тул тусдаа файл боллоо.
//
//  <head> дотор defer/async БАЙХГҮЙ дуудагдана — тиймээс
//  хуудас зурагдахаас өмнө ажиллаж, анивчихаас сэргийлнэ.
// =====================================================

(function () {
  var t = localStorage.getItem('dadlaga.theme');
  if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = t;
})();
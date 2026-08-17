// =====================================================
//  components/authShell.js — нэвтрэх талын хоёр хуваалттай хүрээ
// =====================================================

import { html, raw, esc } from '../core/dom.js';
import { themeButton } from '../core/theme.js';

/** Дүрээс хамаарах зүүн талын текст */
export const STAGE = {
  student: {
    eyebrow: 'Оюутны булан',
    thesis : 'Дадлагын газраа өөрөө сонго.',
    steps: [
      ['Бүртгэл үүсгэх',    'Сургууль, мэргэжил, ангиа оруулна.'],
      ['Хүсэлт илгээх',     'Тохирох байгууллагаа сонгож хүсэлт явуулна.'],
      ['Хариу хүлээн авах', 'Зөвшөөрөл ирмэгц дадлагаа эхлүүлнэ.']
    ]
  },
  org: {
    eyebrow: 'Байгууллагын булан',
    thesis : 'Ирээдүйн ажилтнаа эрт олоорой.',
    steps: [
      ['Профайл нээх',   'Чиглэл, авах оюутны тоогоо зарлана.'],
      ['Хүсэлт хүлээх',  'Оюутнууд танд шууд хүсэлт илгээнэ.'],
      ['Оюутнаа сонгох', 'Тохирсон оюутныг зөвшөөрч бүртгэнэ.']
    ]
  }
};

/** Зүүн талын доторх хэсэг — дүр солиход энэ л шинэчлэгдэнэ */
export function stageBody(role) {
  const s = STAGE[role] || STAGE.student;

  return html`
    <p class="mono stage-eyebrow">${s.eyebrow}</p>
    <h1 class="stage-thesis">${s.thesis}</h1>
    <ol class="track">
      ${raw(s.steps.map(([title, desc], i) => html`
        <li>
          <span class="track-num">0${i + 1}</span>
          <div>
            <h3>${title}</h3>
            <p>${desc}</p>
          </div>
        </li>`).join(''))}
    </ol>`;
}

/**
 * Хоёр хуваалттай хүрээ.
 * body  — баруун талын картны доторх HTML
 * role  — зүүн талын текстийг сонгоно
 * quiet — true бол алхмуудыг харуулахгүй (нууц үг сэргээх хуудсанд)
 */
export function authShell({ body, role = 'student', quiet = false }) {
  const s = STAGE[role] || STAGE.student;

  return `
    <div class="auth">
      <aside class="auth-stage">
        <div class="brand">ДАДЛАГА<span>.</span>МН</div>

        <div data-stage>
          ${quiet
            ? `<p class="mono stage-eyebrow">Нууц үг сэргээх</p>
               <h1 class="stage-thesis">Нэвтрэх нэрээ хэлээд л болоо.</h1>`
            : stageBody(role)}
        </div>

        <p class="stage-foot">Их, дээд сургуулийн оюутан &amp; байгууллагыг холбоно</p>
      </aside>

      <main class="auth-panel">
        <div class="auth-card">${body}</div>
      </main>
    </div>
    ${themeButton('theme-fab')}`;
}

/**
 * Дүр сонгогч — оюутан / байгууллага
 *
 * active нь заавал body[data-role]-той таарч байх ёстой.
 * Өмнө нь aria-pressed-ийг оюутан дээр хатуу бичдэг байсан тул
 * байгууллагаас гармагц гүйгч баруун талд, цагаан текст зүүн
 * талд үлдэж зөрдөг байв.
 */
export function rolePicker(active = 'student') {
  const btn = (role, num, label) => `
    <button type="button" class="role" data-role-btn="${role}"
            aria-pressed="${String(role === active)}">
      <span class="mono">Role ${num}</span>${label}
    </button>`;

  return `
    <div class="roles" role="group" aria-label="Хэрэглэгчийн төрөл">
      <span class="roles-thumb" aria-hidden="true"></span>
      ${btn('student', '01', 'Оюутан')}
      ${btn('org', '02', 'Байгууллага')}
    </div>`;
}


/**
 * Дүрийг тавих цорын ганц газар.
 * body[data-role], товчны aria-pressed, зүүн талын текст
 * гурвуулаа энд хамт шинэчлэгдэнэ — тиймээс зөрөх боломжгүй.
 */
export function setRole(role) {
  document.body.dataset.role = role;

  document.querySelectorAll('[data-role-btn]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.roleBtn === role)));

  const stage = document.querySelector('[data-stage]');
  if (stage && !stage.dataset.quiet) stage.innerHTML = stageBody(role);
}

/**
 * Дүр сонгогчийг ажиллуулна.
 * onChange(role) буцаж дуудагдана — маягтын талбарууд солигдоно.
 */
export function wireRolePicker(onChange) {
  document.querySelectorAll('[data-role-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.roleBtn;
      setRole(role);
      onChange?.(role);
    });
  });
}

export const currentRole = () => document.body.dataset.role || 'student';
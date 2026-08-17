// =====================================================
//  config.js — тохиргоог уншиж, шалгана
//
//  Зарчим: анхдагч утга байхгүй.
//  Дутуу эсвэл сул тохиргоотой бол сервер огт асахгүй.
//  Ингэснээр "санамсаргүй хөгжүүлэлтийн түлхүүртэй
//  ажиллаж байсан" гэсэн байдал үүсэхгүй.
// =====================================================

require('dotenv').config({ quiet: true });

const IS_PROD = process.env.NODE_ENV === 'production';

/** Хэзээ ч ашиглаж болохгүй утгууд — жишээ файлаас хуулсан бол барина */
const FORBIDDEN = [
  'dev_secret_solino',
  'neg_urt_sanamsargui_mor_energ_solino',
  'changeme',
  'secret',
  'StronP#45'
];

const problems = [];

function need(key) {
  const value = process.env[key];
  if (!value || !value.trim()) {
    problems.push(`${key} тохируулаагүй байна.`);
    return '';
  }
  return value.trim();
}

/* -------- Өгөгдлийн сан -------- */
const DB = {
  host    : need('DB_HOST'),
  port    : Number(process.env.DB_PORT || 3306),
  user    : need('DB_USER'),
  password: need('DB_PASSWORD'),
  name    : need('DB_NAME')
};

if (IS_PROD && DB.user === 'root') {
  problems.push('DB_USER=root байна. Зөвхөн энэ санд хандах эрхтэй хэрэглэгч үүсгэнэ үү (db/06_app_user.sql).');
}
if (FORBIDDEN.includes(DB.password)) {
  problems.push('DB_PASSWORD нь жишээ файлын утга хэвээр байна. Солино уу.');
}

/* -------- JWT түлхүүр -------- */
const JWT_SECRET = need('JWT_SECRET');

if (JWT_SECRET && JWT_SECRET.length < 32) {
  problems.push('JWT_SECRET дор хаяж 32 тэмдэгт байх ёстой. `npm run gen-secret` ажиллуулна уу.');
}
if (FORBIDDEN.includes(JWT_SECRET)) {
  problems.push('JWT_SECRET нь жишээ файлын утга хэвээр байна. `npm run gen-secret` ажиллуулна уу.');
}

/* -------- Сүлжээ -------- */
const PORT = Number(process.env.PORT || 3000);

// Зөвшөөрөгдөх гадаад эх сурвалж. Хоосон бол зөвхөн ижил домэйн.
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

// Nginx зэрэг прокси ард ажиллаж байгаа эсэх
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';

// HTTP хүсэлтийг HTTPS руу албадан шилжүүлэх
const FORCE_HTTPS = process.env.FORCE_HTTPS === 'true';

if (IS_PROD && !FORCE_HTTPS) {
  problems.push('Бодит орчинд FORCE_HTTPS=true байх ёстой.');
}
if (FORCE_HTTPS && !TRUST_PROXY) {
  problems.push('FORCE_HTTPS=true бол TRUST_PROXY=true байх ёстой — прокси ард протоколыг мэдэхийн тулд.');
}

/* -------- Нууц үг сэргээх -------- */
const SHOW_RESET_LINK = process.env.SHOW_RESET_LINK === 'true';

if (IS_PROD && SHOW_RESET_LINK) {
  problems.push('Бодит орчинд SHOW_RESET_LINK=true байж болохгүй — холбоос хэн бүхэнд харагдана.');
}

// Сэргээх холбоосын үндсэн хаяг. Бодит орчинд домэйнээ зааж өгнө.
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

if (IS_PROD && !BASE_URL.startsWith('https://')) {
  problems.push('Бодит орчинд BASE_URL нь https:// -ээр эхэлнэ.');
}


/* -------- Шалгалт бүтэлгүйтвэл зогсоно -------- */
if (problems.length) {
  console.error('\n  ✕ Тохиргооны алдаа — сервер асахгүй:\n');
  problems.forEach(p => console.error('    · ' + p));
  console.error('\n  server/.env файлаа шалгана уу.');
  console.error('  Жишээг server/.env.example дотроос харна уу.\n');
  process.exit(1);
}


module.exports = {
  IS_PROD,
  PORT,
  DB,
  JWT_SECRET,
  CORS_ORIGINS,
  TRUST_PROXY,
  FORCE_HTTPS,
  SHOW_RESET_LINK,
  BASE_URL
};
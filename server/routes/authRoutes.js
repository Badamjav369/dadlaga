// =====================================================
//  routes/auth.js — бүртгүүлэх / нэвтрэх
// =====================================================

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool   = require('../db');
const { signToken, requireAuth } = require('../middleware/authGuard');
const { BASE_URL, SHOW_RESET_LINK } = require('../config');

const RESET_MINUTES = 30;   // токен хэдэн минут хүчинтэй байх

const sha256 = v => crypto.createHash('sha256').update(v).digest('hex');

const isPhone = v => /^[689]\d{7}$/.test(v);

/** Лавлах хүснэгтэд id байгаа эсэхийг шалгана */
async function lookupExists(table, idCol, id) {
  if (!Number(id)) return false;
  const [[row]] = await pool.query(
    `SELECT ${idCol} FROM ${table} WHERE ${idCol} = ?`, [Number(id)]);
  return Boolean(row);
}
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);


// -----------------------------------------------------
//  POST /api/auth/register/student
// -----------------------------------------------------
router.post('/register/student', async (req, res, next) => {
  try {
    const { last_name, first_name, username, password,
            email, phone, school, major, course } = req.body;

    const errors = {};
    if (!last_name?.trim())  errors.last_name  = 'Овгоо оруулна уу.';
    if (!first_name?.trim()) errors.first_name = 'Нэрээ оруулна уу.';
    if (!username?.trim())   errors.username   = 'Нэвтрэх нэрээ оруулна уу.';
    if (!isEmail(email || ''))  errors.email   = 'И-мэйл хаяг буруу байна.';
    if (!isPhone(phone || ''))  errors.phone   = '8 оронтой дугаар оруулна уу.';
    if (!school?.trim())     errors.school     = 'Сургуулиа оруулна уу.';
    if (!major?.trim())      errors.major      = 'Мэргэжлээ оруулна уу.';
    if (!(course >= 1 && course <= 6)) errors.course = 'Ангиа сонгоно уу.';
    if ((password || '').length < 6)   errors.password = 'Нууц үг дор хаяж 6 тэмдэгт байна.';

    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Талбаруудыг засна уу.', errors });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO students
         (last_name, first_name, username, password, email, phone, school, major, course)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [last_name.trim(), first_name.trim(), username.trim(), hash,
       email.trim().toLowerCase(), phone.trim(), school.trim(), major.trim(), course]
    );

    const user  = { id: result.insertId, role: 'student', name: `${last_name} ${first_name}` };
    const token = signToken({ id: user.id, role: 'student' });

    res.status(201).json({ token, user });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const field = err.message.includes('username') ? 'username' : 'email';
      return res.status(409).json({
        message: 'Аль хэдийн бүртгэлтэй байна.',
        errors: { [field]: field === 'username'
          ? 'Энэ нэвтрэх нэр эзэмшигдсэн байна.'
          : 'Энэ и-мэйл аль хэдийн бүртгэлтэй байна.' }
      });
    }
    next(err);
  }
});


// -----------------------------------------------------
//  POST /api/auth/register/org
// -----------------------------------------------------
router.post('/register/org', async (req, res, next) => {
  try {
    const { name, username, password, email, phone,
            industry_id, location_id, website } = req.body;

    const errors = {};
    if (!name?.trim())      errors.name      = 'Байгууллагын нэрээ оруулна уу.';
    if (!username?.trim())  errors.username  = 'Нэвтрэх нэрээ оруулна уу.';
    if (!isEmail(email || '')) errors.email  = 'И-мэйл хаяг буруу байна.';
    if (!isPhone(phone || '')) errors.phone  = '8 оронтой дугаар оруулна уу.';
    if ((password || '').length < 6) errors.password = 'Нууц үг дор хаяж 6 тэмдэгт байна.';

    // Салбар, байршил нь лавлах хүснэгтэд байх ёстой.
    // Чөлөөт текст хүлээж авахгүй — давхардал үүсэх боломжгүй.
    if (!await lookupExists('industries', 'industry_id', industry_id)) {
      errors.industry_id = 'Үйл ажиллагааны чиглэлээ сонгоно уу.';
    }
    if (!await lookupExists('locations', 'location_id', location_id)) {
      errors.location_id = 'Байршлаа сонгоно уу.';
    }

    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Талбаруудыг засна уу.', errors });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO organizations
         (name, username, password, email, phone, industry_id, location_id, website)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), username.trim(), hash, email.trim().toLowerCase(),
       phone.trim(), Number(industry_id), Number(location_id), website?.trim() || null]
    );

    const user  = { id: result.insertId, role: 'org', name: name.trim() };
    const token = signToken({ id: user.id, role: 'org' });

    res.status(201).json({ token, user });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const field = err.message.includes('username') ? 'username' : 'email';
      return res.status(409).json({
        message: 'Аль хэдийн бүртгэлтэй байна.',
        errors: { [field]: field === 'username'
          ? 'Энэ нэвтрэх нэр эзэмшигдсэн байна.'
          : 'Энэ и-мэйл аль хэдийн бүртгэлтэй байна.' }
      });
    }
    next(err);
  }
});


// -----------------------------------------------------
//  POST /api/auth/login   { username, password, role }
// -----------------------------------------------------
router.post('/login', async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    if (!username?.trim() || !password) {
      return res.status(400).json({ message: 'Нэвтрэх нэр болон нууц үгээ оруулна уу.' });
    }
    if (role !== 'student' && role !== 'org') {
      return res.status(400).json({ message: 'Хэрэглэгчийн төрлөө сонгоно уу.' });
    }

    let row, id, name;

    if (role === 'student') {
      const [rows] = await pool.query(
        `SELECT student_id, last_name, first_name, password
         FROM students WHERE username = ?`, [username.trim()]);
      row  = rows[0];
      id   = row?.student_id;
      name = row ? `${row.last_name} ${row.first_name}` : null;
    } else {
      const [rows] = await pool.query(
        `SELECT organization_id, name, password
         FROM organizations WHERE username = ?`, [username.trim()]);
      row  = rows[0];
      id   = row?.organization_id;
      name = row?.name;
    }

    // Бүртгэл байхгүй ба нууц үг буруу тохиолдолд ижил хариу өгнө —
    // ингэснээр аль нэр бүртгэлтэйг таах боломжгүй болно
    if (!row || !(await bcrypt.compare(password, row.password))) {
      return res.status(401).json({ message: 'Нэвтрэх нэр эсвэл нууц үг буруу байна.' });
    }

    res.json({ token: signToken({ id, role }), user: { id, role, name } });

  } catch (err) { next(err); }
});


// -----------------------------------------------------
//  GET /api/auth/me — токеноор одоогийн хэрэглэгчийг авах
// -----------------------------------------------------
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { id, role } = req.user;

    if (role === 'student') {
      const [rows] = await pool.query(
        `SELECT student_id AS id, last_name, first_name, username, email,
                phone, school, major, course
         FROM students WHERE student_id = ?`, [id]);
      if (!rows.length) return res.status(404).json({ message: 'Бүртгэл олдсонгүй.' });
      return res.json({ role, profile: rows[0] });
    }

    const [rows] = await pool.query(`
      SELECT o.organization_id AS id, o.name, o.username, o.email, o.phone,
             i.name AS industry, l.name AS location, o.website, o.logo
      FROM organizations o
      JOIN industries i ON i.industry_id = o.industry_id
      JOIN locations  l ON l.location_id = o.location_id
      WHERE o.organization_id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ message: 'Бүртгэл олдсонгүй.' });
    res.json({ role, profile: rows[0] });

  } catch (err) { next(err); }
});


// -----------------------------------------------------
//  POST /api/auth/change-password — нэвтэрсэн үедээ солих
//  body: { current_password, new_password }
// -----------------------------------------------------
router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const { id, role } = req.user;

    if ((new_password || '').length < 6) {
      return res.status(400).json({
        message: 'Нууц үг засагдсангүй.',
        errors: { new_password: 'Шинэ нууц үг дор хаяж 6 тэмдэгт байна.' }
      });
    }

    const table = role === 'student' ? 'students' : 'organizations';
    const idCol = role === 'student' ? 'student_id' : 'organization_id';

    const [[row]] = await pool.query(
      `SELECT password FROM ${table} WHERE ${idCol} = ?`, [id]);

    if (!row) return res.status(404).json({ message: 'Бүртгэл олдсонгүй.' });

    if (!(await bcrypt.compare(current_password || '', row.password))) {
      return res.status(400).json({
        message: 'Нууц үг засагдсангүй.',
        errors: { current_password: 'Одоогийн нууц үг буруу байна.' }
      });
    }

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query(`UPDATE ${table} SET password = ? WHERE ${idCol} = ?`, [hash, id]);

    res.json({ message: 'Нууц үг солигдлоо.' });

  } catch (err) { next(err); }
});


// -----------------------------------------------------
//  POST /api/auth/forgot — сэргээх холбоос үүсгэх
//  body: { username, role }
//
//  Жинхэнэ системд энэ холбоосыг и-мэйлээр илгээнэ.
//  Энд и-мэйл сервер байхгүй тул серверийн консол дээр хэвлэнэ.
// -----------------------------------------------------
router.post('/forgot', async (req, res, next) => {
  try {
    const { username, role } = req.body;

    if (!username?.trim() || !['student', 'org'].includes(role)) {
      return res.status(400).json({ message: 'Нэвтрэх нэр болон төрлөө сонгоно уу.' });
    }

    const table = role === 'student' ? 'students' : 'organizations';
    const idCol = role === 'student' ? 'student_id' : 'organization_id';

    const [[user]] = await pool.query(
      `SELECT ${idCol} AS id, email FROM ${table} WHERE username = ?`,
      [username.trim()]
    );

    // Бүртгэл олдсон эсэхээс үл хамааран ижил хариу буцаана —
    // ингэснээр аль нэр бүртгэлтэйг таах боломжгүй болно
    const generic = {
      message: 'Хэрэв ийм бүртгэл байгаа бол сэргээх холбоосыг и-мэйлээр илгээлээ.'
    };

    if (!user) return res.json(generic);

    // Хуучин ашиглагдаагүй токенуудыг хүчингүй болгоно
    await pool.query(
      `UPDATE password_resets SET used_at = NOW()
       WHERE role = ? AND user_id = ? AND used_at IS NULL`,
      [role, user.id]
    );

    const token = crypto.randomBytes(32).toString('hex');

    await pool.query(
      `INSERT INTO password_resets (role, user_id, token_hash, expires_at)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
      [role, user.id, sha256(token), RESET_MINUTES]
    );

    const link = `${BASE_URL}/#/reset?token=${token}`;

    console.log('\n──────────────────────────────────────────────');
    console.log('  НУУЦ ҮГ СЭРГЭЭХ ХОЛБООС');
    console.log('  Хэнд:', user.email);
    console.log('  Линк:', link);
    console.log(`  Хүчинтэй: ${RESET_MINUTES} минут`);
    console.log('──────────────────────────────────────────────\n');

    // Хөгжүүлэлтийн үед л линкийг буцаана. Бодит орчинд
    // config.js энэ тохиргоог зөвшөөрөхгүй.
    if (SHOW_RESET_LINK) {
      return res.json({ ...generic, dev_link: link });
    }

    res.json(generic);

  } catch (err) { next(err); }
});


// -----------------------------------------------------
//  GET /api/auth/reset/:token — токен хүчинтэй эсэхийг шалгах
// -----------------------------------------------------
router.get('/reset/:token', async (req, res, next) => {
  try {
    const [[row]] = await pool.query(
      `SELECT reset_id FROM password_resets
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()`,
      [sha256(req.params.token)]
    );

    if (!row) {
      return res.status(400).json({
        message: 'Холбоосын хугацаа дууссан эсвэл ашиглагдсан байна.'
      });
    }

    res.json({ valid: true });

  } catch (err) { next(err); }
});


// -----------------------------------------------------
//  POST /api/auth/reset — шинэ нууц үг тавих
//  body: { token, password }
// -----------------------------------------------------
router.post('/reset', async (req, res, next) => {
  const conn = await pool.getConnection();

  try {
    const { token, password } = req.body;

    if ((password || '').length < 6) {
      return res.status(400).json({
        message: 'Нууц үг тохирсонгүй.',
        errors: { password: 'Нууц үг дор хаяж 6 тэмдэгт байна.' }
      });
    }

    await conn.beginTransaction();

    const [[row]] = await conn.query(
      `SELECT reset_id, role, user_id FROM password_resets
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
       FOR UPDATE`,
      [sha256(token || '')]
    );

    if (!row) {
      await conn.rollback();
      return res.status(400).json({
        message: 'Холбоосын хугацаа дууссан эсвэл ашиглагдсан байна.'
      });
    }

    const table = row.role === 'student' ? 'students' : 'organizations';
    const idCol = row.role === 'student' ? 'student_id' : 'organization_id';
    const hash  = await bcrypt.hash(password, 10);

    await conn.query(`UPDATE ${table} SET password = ? WHERE ${idCol} = ?`,
      [hash, row.user_id]);

    await conn.query(`UPDATE password_resets SET used_at = NOW() WHERE reset_id = ?`,
      [row.reset_id]);

    await conn.commit();

    res.json({ message: 'Нууц үг шинэчлэгдлээ. Одоо нэвтэрнэ үү.' });

  } catch (err) {
    await conn.rollback().catch(() => {});
    next(err);
  } finally {
    conn.release();
  }
});


module.exports = router;
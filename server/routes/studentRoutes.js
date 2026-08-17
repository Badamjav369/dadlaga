const router = require('express').Router();
const pool   = require('../db');
const { requireAuth, requireStudent } = require('../middleware/authGuard');

//  GET /api/students/me — профайл + дадлагын одоогийн төлөв
router.get('/me', requireAuth, requireStudent, async (req, res, next) => {
  try {
    const [[profile]] = await pool.query(
      `SELECT student_id, last_name, first_name, username, email,
              phone, school, major, course, created_at
       FROM students WHERE student_id = ?`, [req.user.id]);

    if (!profile) return res.status(404).json({ message: 'Бүртгэл олдсонгүй.' });

    const [[current]] = await pool.query(
      `SELECT r.status, p.title AS position_title, o.name AS organization_name
       FROM internship_requests r
       JOIN internship_positions p ON p.position_id    = r.position_id
       JOIN organizations       o ON o.organization_id = p.organization_id
       WHERE r.student_id = ?
       ORDER BY FIELD(r.status,'Тэнцсэн','Хүлээн авсан','Илгээсэн','Тэнцээгүй'),
                r.submitted_at DESC
       LIMIT 1`, [req.user.id]);

    res.json({ profile, current_internship: current || null });

  } catch (err) { next(err); }
});

//  PUT /api/students/me — профайл засах
router.put('/me', requireAuth, requireStudent, async (req, res, next) => {
  try {
    const { last_name, first_name, email, phone, school, major, course } = req.body;

    const errors = {};
    if (!last_name?.trim())  errors.last_name  = 'Овгоо оруулна уу.';
    if (!first_name?.trim()) errors.first_name = 'Нэрээ оруулна уу.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email || '')) errors.email = 'И-мэйл хаяг буруу байна.';
    if (!/^[689]\d{7}$/.test(phone || '')) errors.phone = '8 оронтой дугаар оруулна уу.';
    if (!school?.trim())     errors.school     = 'Сургуулиа оруулна уу.';
    if (!major?.trim())      errors.major      = 'Мэргэжлээ оруулна уу.';
    if (!(course >= 1 && course <= 6)) errors.course = 'Ангиа сонгоно уу.';

    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Талбаруудыг засна уу.', errors });
    }

    await pool.query(
      `UPDATE students
       SET last_name = ?, first_name = ?, email = ?, phone = ?,
           school = ?, major = ?, course = ?
       WHERE student_id = ?`,
      [last_name.trim(), first_name.trim(), email.trim().toLowerCase(),
       phone.trim(), school.trim(), major.trim(), course, req.user.id]
    );

    res.json({ message: 'Профайл шинэчлэгдлээ.' });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'И-мэйл давхардаж байна.',
        errors: { email: 'Энэ и-мэйл өөр бүртгэлд ашиглагдсан байна.' }
      });
    }
    next(err);
  }
});

module.exports = router;
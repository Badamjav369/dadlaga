// =====================================================
//  routes/requests.js — дадлагын хүсэлт
// =====================================================

const router = require('express').Router();
const pool   = require('../db');
const { requireAuth, requireStudent, requireOrg } = require('../middleware/authGuard');

const STATUSES = ['Илгээсэн', 'Хүлээн авсан', 'Тэнцсэн', 'Тэнцээгүй'];


// -----------------------------------------------------
//  POST /api/requests — оюутан хүсэлт илгээх
//  body: { position_id }
// -----------------------------------------------------
router.post('/', requireAuth, requireStudent, async (req, res, next) => {
  try {
    const positionId = Number(req.body.position_id);
    if (!positionId) {
      return res.status(400).json({ message: 'Дадлагын чиглэлээ сонгоно уу.' });
    }

    const [[pos]] = await pool.query(
      'SELECT position_id, is_open, remaining_slots FROM v_position_stats WHERE position_id = ?',
      [positionId]
    );

    if (!pos) return res.status(404).json({ message: 'Дадлагын чиглэл олдсонгүй.' });
    if (!pos.is_open) {
      return res.status(409).json({ message: 'Энэ чиглэл хүсэлт хүлээн авахаа больсон байна.' });
    }
    if (pos.remaining_slots < 1) {
      return res.status(409).json({ message: 'Энэ чиглэлийн орон тоо дүүрсэн байна.' });
    }

    const [result] = await pool.query(
      'INSERT INTO internship_requests (student_id, position_id) VALUES (?, ?)',
      [req.user.id, positionId]
    );

    res.status(201).json({ request_id: result.insertId, message: 'Хүсэлт илгээгдлээ.' });

  } catch (err) {
    // UNIQUE(student_id, position_id) зөрчигдсөн
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Та энэ чиглэлд аль хэдийн хүсэлт илгээсэн байна.' });
    }
    next(err);
  }
});


// -----------------------------------------------------
//  GET /api/requests/my — оюутны илгээсэн хүсэлтүүд
// -----------------------------------------------------
router.get('/my', requireAuth, requireStudent, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.request_id, r.status, r.submitted_at, r.updated_at,
              p.position_id, p.title AS position_title,
              o.organization_id, o.name AS organization_name,
              o.email AS organization_email, o.phone AS organization_phone
       FROM internship_requests r
       JOIN internship_positions p ON p.position_id    = r.position_id
       JOIN organizations       o ON o.organization_id = p.organization_id
       WHERE r.student_id = ?
       ORDER BY r.submitted_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) { next(err); }
});


// -----------------------------------------------------
//  DELETE /api/requests/:id — оюутан хүсэлтээ буцаах
//  Зөвхөн 'Илгээсэн' төлөвтэй үед боломжтой
// -----------------------------------------------------
router.delete('/:id', requireAuth, requireStudent, async (req, res, next) => {
  try {
    const [result] = await pool.query(
      `DELETE FROM internship_requests
       WHERE request_id = ? AND student_id = ? AND status = 'Илгээсэн'`,
      [Number(req.params.id), req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(409).json({
        message: 'Байгууллага үзсэн хүсэлтийг буцаах боломжгүй.'
      });
    }

    res.json({ message: 'Хүсэлт буцаагдлаа.' });

  } catch (err) { next(err); }
});


// -----------------------------------------------------
//  GET /api/requests/incoming?status=... — байгууллагад ирсэн хүсэлт
// -----------------------------------------------------
router.get('/incoming', requireAuth, requireOrg, async (req, res, next) => {
  try {
    const status = (req.query.status || '').trim();
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Төлөв буруу байна.' });
    }

    const [rows] = await pool.query(
      `SELECT r.request_id, r.status, r.submitted_at, r.updated_at,
              s.student_id, s.last_name, s.first_name, s.email, s.phone,
              s.school, s.major, s.course,
              p.position_id, p.title AS position_title
       FROM internship_requests r
       JOIN students             s ON s.student_id  = r.student_id
       JOIN internship_positions p ON p.position_id = r.position_id
       WHERE p.organization_id = ?
         AND (? = '' OR r.status = ?)
       ORDER BY FIELD(r.status,'Илгээсэн','Хүлээн авсан','Тэнцсэн','Тэнцээгүй'),
                r.submitted_at DESC`,
      [req.user.id, status, status]
    );

    res.json(rows);
  } catch (err) { next(err); }
});


// -----------------------------------------------------
//  PATCH /api/requests/:id/status — төлөв өөрчлөх
//  body: { status }
// -----------------------------------------------------
router.patch('/:id/status', requireAuth, requireOrg, async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!STATUSES.includes(status)) {
      return res.status(400).json({
        message: 'Төлөв буруу байна. Зөвшөөрөгдөх утга: ' + STATUSES.join(', ')
      });
    }

    // Тэнцсэн болгохын өмнө орон тоо үлдсэн эсэхийг шалгана
    if (status === 'Тэнцсэн') {
      const [[check]] = await pool.query(
        `SELECT v.remaining_slots, r.status AS current_status
         FROM internship_requests r
         JOIN internship_positions p ON p.position_id = r.position_id
         JOIN v_position_stats     v ON v.position_id = r.position_id
         WHERE r.request_id = ? AND p.organization_id = ?`,
        [Number(req.params.id), req.user.id]
      );

      if (!check) return res.status(404).json({ message: 'Хүсэлт олдсонгүй.' });

      if (check.current_status !== 'Тэнцсэн' && check.remaining_slots < 1) {
        return res.status(409).json({
          message: 'Орон тоо дүүрсэн байна. Багтаамжаа нэмэх эсвэл өөр оюутны төлөвийг өөрчилнө үү.'
        });
      }
    }

    const [result] = await pool.query(
      `UPDATE internship_requests r
       JOIN internship_positions p ON p.position_id = r.position_id
       SET r.status = ?
       WHERE r.request_id = ? AND p.organization_id = ?`,
      [status, Number(req.params.id), req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Хүсэлт олдсонгүй.' });
    }

    res.json({ message: `Төлөв "${status}" боллоо.` });

  } catch (err) { next(err); }
});


module.exports = router;
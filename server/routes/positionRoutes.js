// =====================================================
//  routes/positions.js — дадлагын чиглэл удирдах
//  Зөвхөн байгууллага өөрийн чиглэлээ удирдана
// =====================================================

const router = require('express').Router();
const pool   = require('../db');
const { requireAuth, requireOrg } = require('../middleware/authGuard');


// -----------------------------------------------------
//  POST /api/positions — шинэ чиглэл нэмэх
// -----------------------------------------------------
router.post('/', requireAuth, requireOrg, async (req, res, next) => {
  try {
    const { title, capacity } = req.body;

    const errors = {};
    if (!title?.trim())     errors.title    = 'Чиглэлийн нэрийг оруулна уу.';
    if (!(capacity >= 1))   errors.capacity = 'Авах оюутны тоо 1-ээс их байна.';

    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Талбаруудыг засна уу.', errors });
    }

    const [result] = await pool.query(
      'INSERT INTO internship_positions (organization_id, title, capacity) VALUES (?, ?, ?)',
      [req.user.id, title.trim(), capacity]
    );

    res.status(201).json({ position_id: result.insertId, message: 'Чиглэл нэмэгдлээ.' });

  } catch (err) { next(err); }
});


// -----------------------------------------------------
//  PUT /api/positions/:id — чиглэл засах
// -----------------------------------------------------
router.put('/:id', requireAuth, requireOrg, async (req, res, next) => {
  try {
    const { title, capacity, is_open } = req.body;

    if (!title?.trim() || !(capacity >= 1)) {
      return res.status(400).json({ message: 'Чиглэлийн нэр болон авах тоог зөв оруулна уу.' });
    }

    // organization_id-г нөхцөлд оруулснаар өөр байгууллагын
    // чиглэлийг засах боломжгүй болно
    const [result] = await pool.query(
      `UPDATE internship_positions
       SET title = ?, capacity = ?, is_open = ?
       WHERE position_id = ? AND organization_id = ?`,
      [title.trim(), capacity, is_open === false ? 0 : 1,
       Number(req.params.id), req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Чиглэл олдсонгүй.' });
    }

    res.json({ message: 'Чиглэл шинэчлэгдлээ.' });

  } catch (err) { next(err); }
});


// -----------------------------------------------------
//  DELETE /api/positions/:id — чиглэл устгах
//  Холбогдох хүсэлтүүд CASCADE-аар хамт устана
// -----------------------------------------------------
router.delete('/:id', requireAuth, requireOrg, async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM internship_positions WHERE position_id = ? AND organization_id = ?',
      [Number(req.params.id), req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Чиглэл олдсонгүй.' });
    }

    res.json({ message: 'Чиглэл устлаа.' });

  } catch (err) { next(err); }
});


module.exports = router;
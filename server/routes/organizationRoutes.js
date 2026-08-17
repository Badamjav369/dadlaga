// =====================================================
//  routes/organizationRoutes.js
//  Байгууллагын жагсаалт, дэлгэрэнгүй, профайл, лого
//
//  Салбар болон байршил нь одоо лавлах хүснэгтээс
//  id-гаар холбогдоно. Чөлөөт текст байхаа больсон тул
//  "Банк, санхүү" / "Банк санхүү" гэсэн давхардал үүсэхгүй.
// =====================================================

const router = require('express').Router();
const pool   = require('../db');
const { requireAuth, requireOrg, optionalAuth } = require('../middleware/authGuard');
const { uploadLogo, removeFile }  = require('../middleware/upload');


/** id нь лавлах хүснэгтэд байгаа эсэхийг шалгана */
async function validLookup(table, idCol, id) {
  if (!Number(id)) return false;
  const [[row]] = await pool.query(
    `SELECT ${idCol} FROM ${table} WHERE ${idCol} = ?`, [Number(id)]);
  return Boolean(row);
}


// -----------------------------------------------------
//  GET /api/organizations/filters
//  Зөвхөн БОДИТООР ашиглагдаж буй утгуудыг буцаана.
//  Ингэснээр оюутан 30 хоосон сонголт хардаггүй.
// -----------------------------------------------------
router.get('/filters', async (req, res, next) => {
  try {
    const [industries] = await pool.query(`
      SELECT i.industry_id AS id, i.name, COUNT(*) AS n
      FROM organizations o
      JOIN industries i ON i.industry_id = o.industry_id
      GROUP BY i.industry_id
      ORDER BY i.sort_order, i.name`);

    const [locations] = await pool.query(`
      SELECT l.location_id AS id, l.name, COUNT(*) AS n
      FROM organizations o
      JOIN locations l ON l.location_id = o.location_id
      GROUP BY l.location_id
      ORDER BY l.sort_order, l.name`);

    res.json({ industries, locations });
  } catch (err) { next(err); }
});


// -----------------------------------------------------
//  GET /api/organizations/me
// -----------------------------------------------------
router.get('/me', requireAuth, requireOrg, async (req, res, next) => {
  try {
    const [[profile]] = await pool.query(`
      SELECT o.organization_id, o.name, o.username, o.email, o.phone,
             o.industry_id, i.name AS industry,
             o.location_id, l.name AS location,
             o.website, o.logo, o.created_at
      FROM organizations o
      JOIN industries i ON i.industry_id = o.industry_id
      JOIN locations  l ON l.location_id = o.location_id
      WHERE o.organization_id = ?`, [req.user.id]);

    if (!profile) return res.status(404).json({ message: 'Бүртгэл олдсонгүй.' });

    const [positions] = await pool.query(
      `SELECT position_id, title, capacity, is_open,
              total_requests, pending_count, reviewing_count,
              accepted_count, remaining_slots
       FROM v_position_stats
       WHERE organization_id = ?
       ORDER BY title`, [req.user.id]);

    const totals = positions.reduce((acc, p) => ({
      capacity: acc.capacity + p.capacity,
      accepted: acc.accepted + p.accepted_count,
      pending : acc.pending  + p.pending_count
    }), { capacity: 0, accepted: 0, pending: 0 });

    res.json({ profile, positions, totals });

  } catch (err) { next(err); }
});


// -----------------------------------------------------
//  PUT /api/organizations/me — профайл засах
// -----------------------------------------------------
router.put('/me', requireAuth, requireOrg, async (req, res, next) => {
  try {
    const { name, email, phone, industry_id, location_id, website } = req.body;

    const errors = {};
    if (!name?.trim()) errors.name = 'Байгууллагын нэрээ оруулна уу.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email || '')) errors.email = 'И-мэйл хаяг буруу байна.';
    if (!/^[689]\d{7}$/.test(phone || '')) errors.phone = '8 оронтой дугаар оруулна уу.';

    if (!await validLookup('industries', 'industry_id', industry_id)) {
      errors.industry_id = 'Үйл ажиллагааны чиглэлээ сонгоно уу.';
    }
    if (!await validLookup('locations', 'location_id', location_id)) {
      errors.location_id = 'Байршлаа сонгоно уу.';
    }

    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Талбаруудыг засна уу.', errors });
    }

    await pool.query(
      `UPDATE organizations
       SET name = ?, email = ?, phone = ?, industry_id = ?,
           location_id = ?, website = ?
       WHERE organization_id = ?`,
      [name.trim(), email.trim().toLowerCase(), phone.trim(),
       Number(industry_id), Number(location_id),
       website?.trim() || null, req.user.id]
    );

    res.json({ message: 'Мэдээлэл шинэчлэгдлээ.' });

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


// -----------------------------------------------------
//  POST /api/organizations/me/logo
// -----------------------------------------------------
router.post('/me/logo', requireAuth, requireOrg, uploadLogo, async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Зураг сонгоно уу.' });

    const webPath = '/uploads/logos/' + req.file.filename;

    const [[old]] = await pool.query(
      'SELECT logo FROM organizations WHERE organization_id = ?', [req.user.id]);
    removeFile(old?.logo);

    await pool.query(
      'UPDATE organizations SET logo = ? WHERE organization_id = ?',
      [webPath, req.user.id]);

    res.json({ logo: webPath, message: 'Лого шинэчлэгдлээ.' });

  } catch (err) { next(err); }
});


// -----------------------------------------------------
//  DELETE /api/organizations/me/logo
// -----------------------------------------------------
router.delete('/me/logo', requireAuth, requireOrg, async (req, res, next) => {
  try {
    const [[old]] = await pool.query(
      'SELECT logo FROM organizations WHERE organization_id = ?', [req.user.id]);

    if (!old?.logo) return res.status(404).json({ message: 'Лого байхгүй байна.' });

    removeFile(old.logo);
    await pool.query(
      'UPDATE organizations SET logo = NULL WHERE organization_id = ?', [req.user.id]);

    res.json({ message: 'Лого устлаа.' });

  } catch (err) { next(err); }
});


// -----------------------------------------------------
//  GET /api/organizations?q=&industry=<id>&location=<id>
// -----------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const q          = (req.query.q || '').trim();
    const industryId = Number(req.query.industry) || 0;
    const locationId = Number(req.query.location) || 0;

    const [rows] = await pool.query(`
      SELECT o.organization_id, o.name, o.logo, o.website,
             i.name AS industry, l.name AS location,
             CAST(COUNT(DISTINCT p.position_id) AS SIGNED)     AS position_count,
             CAST(IFNULL(SUM(v.remaining_slots), 0) AS SIGNED) AS open_slots
      FROM organizations o
      JOIN industries i ON i.industry_id = o.industry_id
      JOIN locations  l ON l.location_id = o.location_id
      LEFT JOIN internship_positions p ON p.organization_id = o.organization_id
      LEFT JOIN v_position_stats v     ON v.position_id     = p.position_id
      WHERE (? = '' OR o.name LIKE CONCAT('%', ?, '%'))
        AND (? = 0  OR o.industry_id = ?)
        AND (? = 0  OR o.location_id = ?)
      GROUP BY o.organization_id
      ORDER BY open_slots DESC, o.name`,
      [q, q, industryId, industryId, locationId, locationId]
    );

    res.json(rows);
  } catch (err) { next(err); }
});


// -----------------------------------------------------
//  GET /api/organizations/:id — дэлгэрэнгүй + чиглэлүүд
// -----------------------------------------------------
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const orgId = Number(req.params.id);
    if (!orgId) return res.status(400).json({ message: 'Байгууллагын дугаар буруу байна.' });

    const [[org]] = await pool.query(`
      SELECT o.organization_id, o.name, o.email, o.phone,
             i.name AS industry, l.name AS location,
             o.website, o.logo
      FROM organizations o
      JOIN industries i ON i.industry_id = o.industry_id
      JOIN locations  l ON l.location_id = o.location_id
      WHERE o.organization_id = ?`, [orgId]);

    if (!org) return res.status(404).json({ message: 'Байгууллага олдсонгүй.' });

    // Нэвтэрсэн оюутан бол өөрийнх нь хүсэлтийн төлөвийг нэмж харуулна
    const studentId = req.user?.role === 'student' ? req.user.id : 0;

    const [positions] = await pool.query(
      `SELECT v.position_id, v.title, v.capacity, v.is_open,
              v.accepted_count, v.remaining_slots,
              r.status AS my_status
       FROM v_position_stats v
       LEFT JOIN internship_requests r
              ON r.position_id = v.position_id AND r.student_id = ?
       WHERE v.organization_id = ?
       ORDER BY v.title`,
      [studentId, orgId]
    );

    res.json({ organization: org, positions });

  } catch (err) { next(err); }
});


module.exports = router;
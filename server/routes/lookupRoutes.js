const router = require('express').Router();
const pool   = require('../db');

let cache = null;
let cachedAt = 0;
const TTL = 10 * 60 * 1000;   // 10 минут

router.get('/', async (req, res, next) => {
  try {
    if (cache && Date.now() - cachedAt < TTL) {
      return res.json(cache);
    }

    const [industries] = await pool.query(
      'SELECT industry_id AS id, name FROM industries ORDER BY sort_order, name');
    const [locations] = await pool.query(
      'SELECT location_id AS id, name FROM locations ORDER BY sort_order, name');

    cache = { industries, locations };
    cachedAt = Date.now();

    res.json(cache);

  } catch (err) { next(err); }
});

router.clearCache = () => { cache = null; };

module.exports = router;
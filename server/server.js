const express = require('express');
const path    = require('path');

const config = require('./config');
const pool   = require('./db');
const { forceHttps, securityHeaders, cors, safeUploads } = require('./middleware/security');

const app = express();

if (config.TRUST_PROXY) app.set('trust proxy', 1);

app.disable('x-powered-by');
app.use(forceHttps);
app.use(securityHeaders);
app.use(cors);
app.use(express.json({ limit: '64kb' }));
app.use(safeUploads);
app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: config.IS_PROD ? '1h' : 0,
  setHeaders(res, filePath) {
    if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
  }
}));

app.use('/api/lookups',       require('./routes/lookupRoutes'));
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/students',      require('./routes/studentRoutes'));
app.use('/api/organizations', require('./routes/organizationRoutes'));
app.use('/api/positions',     require('./routes/positionRoutes'));
app.use('/api/requests',      require('./routes/requestRoutes'));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Ийм хаяг олдсонгүй.' });
});

app.use((err, req, res, next) => {
  console.error('[алдаа]', new Date().toISOString(), req.method, req.originalUrl, err.message);
  res.status(500).json({ message: 'Серверт алдаа гарлаа. Дахин оролдоно уу.' });
});


const server = app.listen(config.PORT, () => {
  console.log(`\n  Сервер аслаа  → ${config.BASE_URL}`);
  console.log(`  Горим         → ${config.IS_PROD ? 'бодит (production)' : 'хөгжүүлэлт'}`);
  console.log(`  HTTPS албадах → ${config.FORCE_HTTPS ? 'тийм' : 'үгүй'}\n`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log('\n  Унтарч байна…');
    server.close(() => pool.end().then(() => process.exit(0)));
  });
}
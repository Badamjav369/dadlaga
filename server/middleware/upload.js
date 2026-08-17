const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'logos');
fs.mkdirSync(DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `org-${req.user.id}-${Date.now()}${ext}`);
  }
});

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },   // 2 МБ
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new Error('Зөвхөн PNG, JPG, WEBP зураг оруулна уу.'));
    }
    cb(null, true);
  }
});

function uploadLogo(req, res, next) {
  upload.single('logo')(req, res, err => {
    if (!err) return next();

    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Зургийн хэмжээ 2 МБ-аас бага байх ёстой.'
      : err.message || 'Зураг байршуулж чадсангүй.';

    res.status(400).json({ message });
  });
}

function removeFile(webPath) {
  if (!webPath) return;
  const full = path.join(__dirname, '..', '..', 'public', webPath);
  fs.unlink(full, () => {});
}

module.exports = { uploadLogo, removeFile, DIR };
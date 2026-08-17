const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

const OPTIONS = {
  expiresIn: '7d',
  issuer   : 'dadlaga'
};

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, OPTIONS);
}

function readToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

function requireAuth(req, res, next) {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Нэвтэрч орно уу.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET, { issuer: OPTIONS.issuer });
    next();
  } catch {
    return res.status(401).json({ message: 'Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.' });
  }
}

function optionalAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return next();

  try {
    req.user = jwt.verify(token, JWT_SECRET, { issuer: OPTIONS.issuer });
  } catch {
  }
  next();
}

function requireStudent(req, res, next) {
  if (req.user?.role !== 'student') {
    return res.status(403).json({ message: 'Энэ үйлдлийг зөвхөн оюутан хийнэ.' });
  }
  next();
}

function requireOrg(req, res, next) {
  if (req.user?.role !== 'org') {
    return res.status(403).json({ message: 'Энэ үйлдлийг зөвхөн байгууллага хийнэ.' });
  }
  next();
}

module.exports = { signToken, requireAuth, optionalAuth, requireStudent, requireOrg };
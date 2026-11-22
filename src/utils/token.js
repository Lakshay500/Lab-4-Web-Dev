const jwt = require('jsonwebtoken');

exports.sign = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });

exports.verify = (token) => jwt.verify(token, process.env.JWT_SECRET);

exports.extract = (headers = {}) => {
  const auth = headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  const cookie = headers.cookie || '';
  const match = cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith('token='));
  return match ? decodeURIComponent(match.slice(6)) : null;
};

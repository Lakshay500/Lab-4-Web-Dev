const bcrypt = require('bcrypt');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sign } = require('../utils/token');
const appEvents = require('../events/appEvents');

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;
// Valid bcrypt hash used to keep login timing similar when the email does not exist
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', ROUNDS);

// POST /api/auth/signup
exports.signup = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body || {};
  const errors = [];
  if (typeof username !== 'string' || !username.trim()) errors.push('username is required');
  if (typeof email !== 'string' || !email.trim()) errors.push('email is required');
  if (typeof password !== 'string' || password.length < 6) errors.push('password must be at least 6 characters');
  if (errors.length) throw new AppError('Validation failed', 400, errors);

  const hash = await bcrypt.hash(password, ROUNDS);
  // Role is never taken from the request body (prevents privilege escalation)
  const user = await User.create({ username, email, password: hash, role: 'user' });

  appEvents.emit('user:registered', user);
  res.status(201).json({ message: 'User registered', id: user.id, username: user.username, email: user.email });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new AppError('email and password are required', 400);
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  const ok = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
  if (!user || !ok) throw new AppError('Invalid email or password', 401); // same message for both cases

  const token = sign(user);
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000,
  });
  appEvents.emit('user:login', user);
  res.json({ message: 'Login successful', token });
});

// POST /api/auth/logout
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};

// GET /api/auth/me
exports.me = (req, res) => {
  const { id, username, email, role } = req.user;
  res.json({ id, username, email, role });
};

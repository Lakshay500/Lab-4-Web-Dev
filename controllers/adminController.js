const mongoose = require('mongoose');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { stats } = require('../events/listeners');

exports.listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('username email role createdAt');
  res.json({ count: users.length, users });
});

exports.setRole = asyncHandler(async (req, res) => {
  const { role } = req.body || {};
  if (!['user', 'admin'].includes(role)) throw new AppError('role must be "user" or "admin"', 400);
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError('Invalid user id', 400);
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('username email role');
  if (!user) throw new AppError('User not found', 404);
  res.json({ message: 'Role updated', user });
});

// Counters maintained by EventEmitter listeners
exports.eventStats = (req, res) => res.json(stats);

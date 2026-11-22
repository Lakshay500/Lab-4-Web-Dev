const Message = require('../models/Message');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/chat/:room/history?limit=50
exports.history = asyncHandler(async (req, res) => {
  if (!/^[a-zA-Z0-9_-]{1,30}$/.test(req.params.room)) throw new AppError('Invalid room name', 400);
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const messages = await Message.find({ room: req.params.room }).sort({ createdAt: -1 }).limit(limit);
  res.json({ room: req.params.room, count: messages.length, messages: messages.reverse() });
});

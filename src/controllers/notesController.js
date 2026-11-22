const mongoose = require('mongoose');
const Note = require('../models/Note');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const appEvents = require('../events/appEvents');

const checkId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid note id', 400);
};

const scope = (req, id) => (req.user.role === 'admin' ? { _id: id } : { _id: id, owner: req.user._id });

exports.createNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body || {};
  const note = await Note.create({ title, content, owner: req.user._id });
  appEvents.emit('note:created', note);
  res.status(201).json(note);
});

exports.getNotes = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' && req.query.all === 'true' ? {} : { owner: req.user._id };
  res.json(await Note.find(filter).sort({ createdAt: 1 }));
});

exports.getNote = asyncHandler(async (req, res) => {
  checkId(req.params.id);
  const note = await Note.findOne(scope(req, req.params.id));
  if (!note) throw new AppError('Note not found', 404);
  res.json(note);
});

exports.updateNote = asyncHandler(async (req, res) => {
  checkId(req.params.id);
  const update = {};
  if (req.body && req.body.title !== undefined) update.title = req.body.title;
  if (req.body && req.body.content !== undefined) update.content = req.body.content;
  if (!Object.keys(update).length) throw new AppError('Provide title and/or content', 400);

  const note = await Note.findOneAndUpdate(scope(req, req.params.id), update, { new: true, runValidators: true });
  if (!note) throw new AppError('Note not found', 404);
  res.json(note);
});

exports.deleteNote = asyncHandler(async (req, res) => {
  checkId(req.params.id);
  const note = await Note.findOneAndDelete(scope(req, req.params.id));
  if (!note) throw new AppError('Note not found', 404);
  res.json({ message: 'Note deleted', id: note.id });
});

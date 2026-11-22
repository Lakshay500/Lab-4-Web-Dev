const express = require('express');
const auth = require('../controllers/authController');
const notes = require('../controllers/notesController');
const admin = require('../controllers/adminController');
const chat = require('../controllers/chatController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/auth/signup', auth.signup);
router.post('/auth/login', auth.login);
router.post('/auth/logout', auth.logout);

router.get('/auth/me', authenticate, auth.me);
router.route('/notes').all(authenticate).get(notes.getNotes).post(notes.createNote);
router.route('/notes/:id').all(authenticate).get(notes.getNote).put(notes.updateNote).delete(notes.deleteNote);
router.get('/chat/:room/history', authenticate, chat.history);

router.get('/admin/users', authenticate, authorize('admin'), admin.listUsers);
router.patch('/admin/users/:id/role', authenticate, authorize('admin'), admin.setRole);
router.get('/admin/event-stats', authenticate, authorize('admin'), admin.eventStats);

module.exports = router;

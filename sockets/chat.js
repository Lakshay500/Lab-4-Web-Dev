const { Server } = require('socket.io');
const User = require('../models/User');
const Message = require('../models/Message');
const { verify, extract } = require('../utils/token');
const appEvents = require('../events/appEvents');

const ROOM_RE = /^[a-zA-Z0-9_-]{1,30}$/;

module.exports = (httpServer) => {
  const io = new Server(httpServer);

  // Handshake authentication: connection is refused without a valid JWT.
  // Token may be sent as io({ auth: { token } }), a Bearer header, or the login cookie.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || extract(socket.handshake.headers);
      if (!token) return next(new Error('Authentication error: no token provided'));
      const payload = verify(token);
      const user = await User.findById(payload.id);
      if (!user) return next(new Error('Authentication error: user not found'));
      socket.user = { id: user.id, username: user.username, role: user.role };
      next();
    } catch (e) {
      next(new Error('Authentication error: invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    const join = (room) => {
      if (!ROOM_RE.test(room || '')) return socket.emit('chat:error', { message: 'Invalid room name' });
      socket.join(room);
      console.log(`${socket.id} joined room ${room}`);
      socket.emit('room:joined', { room });
      socket.to(room).emit('room:notice', { room, text: `${socket.user.username} joined` });
    };

    join('general'); // everyone starts in #general

    socket.on('room:join', ({ room } = {}) => join(room));

    socket.on('room:leave', ({ room } = {}) => {
      socket.leave(room);
      socket.to(room).emit('room:notice', { room, text: `${socket.user.username} left` });
    });

    socket.on('chat:message', async ({ room, text } = {}, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        if (!socket.rooms.has(room)) return reply({ ok: false, error: 'Join the room first' });
        if (typeof text !== 'string' || !text.trim() || text.length > 1000) {
          return reply({ ok: false, error: 'Message must be 1-1000 characters' });
        }
        const msg = await Message.create({ room, sender: socket.user.id, username: socket.user.username, text: text.trim() });
        io.to(room).emit('chat:message', {
          room, username: msg.username, text: msg.text, createdAt: msg.createdAt,
        });
        console.log(`[${room}] ${msg.username}: ${msg.text}`);
        appEvents.emit('chat:message', { room, username: msg.username });
        reply({ ok: true });
      } catch (e) {
        reply({ ok: false, error: 'Could not send message' });
      }
    });

    socket.on('chat:typing', ({ room } = {}) => {
      if (socket.rooms.has(room)) socket.to(room).emit('chat:typing', { room, username: socket.user.username });
    });

    socket.on('disconnect', () => console.log(`User disconnected: ${socket.id}`));
  });

  return io;
};

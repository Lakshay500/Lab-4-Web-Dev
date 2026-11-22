const appEvents = require('./appEvents');

const stats = { signups: 0, logins: 0, notesCreated: 0, chatMessages: 0 };

const stamp = () => new Date().toISOString();

module.exports = () => {
  appEvents.on('user:registered', (user) => {
    stats.signups += 1;
    console.log(`[event ${stamp()}] user:registered -> ${user.username} (${user.email})`);
  });

  appEvents.on('user:login', (user) => {
    stats.logins += 1;
    console.log(`[event ${stamp()}] user:login -> ${user.username}`);
  });

  appEvents.on('note:created', (note) => {
    stats.notesCreated += 1;
    console.log(`[event ${stamp()}] note:created -> "${note.title}" by ${note.owner}`);
  });

  appEvents.on('chat:message', (msg) => {
    stats.chatMessages += 1;
    console.log(`[event ${stamp()}] chat:message -> #${msg.room} (${stats.chatMessages} total)`);
  });

  appEvents.on('error', (err) => console.error('[event error]', err.message));
};

module.exports.stats = stats;

const EventEmitter = require('events');

// One shared emitter keeps controllers decoupled from side effects (logging, stats, notifications).
class AppEvents extends EventEmitter {}
module.exports = new AppEvents();

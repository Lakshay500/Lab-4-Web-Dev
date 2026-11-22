require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const registerListeners = require('./events/listeners');
const attachSockets = require('./sockets/chat');

const PORT = process.env.PORT || 5002;

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing - copy .env.example to .env first');
  process.exit(1);
}

registerListeners();
const server = http.createServer(app);
attachSockets(server);

connectDB()
  .then(() => server.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('Startup failed:', err.message);
    process.exit(1);
  });

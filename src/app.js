const path = require('path');
const express = require('express');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public'))); // simple chat test page at /chat.html
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;

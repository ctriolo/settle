/**
 * Module dependencies.
 */

var express = require('express')
  , app = module.exports = express.createServer()
  , io = require('socket.io').listen(app)
  , environment = require('./config/environment.js')
  , routes = require('./config/routes');

environment(app, express, io);
routes(app, io);
app.listen(80);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

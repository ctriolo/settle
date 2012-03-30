/**
 * Environment Configuration
 */

var parseCookie = require('connect').utils.parseCookie;

module.exports = function(app, express, io){

  // Express

  app.configure(function(){
    app.set('views', __dirname + '/../views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({secret: 'secret', key: 'express.sid'}));
    app.use(app.router);
    app.use(express.static(__dirname + '/../public'));
    DEBUG = true;
  });

  app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  app.configure('production', function(){
    app.use(express.errorHandler());
  });

  // Socket.IO

  io.set('authorization', function (data, accept) {
    if (data.headers.cookie) {
      data.cookie = parseCookie(data.headers.cookie);
      data.sessionID = data.cookie['express.sid'];
      accept(null, true);
    } else {
      accept('No cookie transmitted.', false);
    }
  });

};

/**
 * Environment Configuration
 */

var parseCookie = require('connect').utils.parseCookie
  , everyauth = require('everyauth')
  , keys = require('./keys');

module.exports = function(app, express, io){


  // EveryAuth

  var UserProvider = require('../models/UserProvider.js')
    , User = require('../models/User.js')
    , userProvider = new UserProvider('localhost', 27017);

  everyauth.facebook
    .appId(keys.facebook.id)
    .appSecret(keys.facebook.secret)
    .entryPath('/auth/facebook')
    .findOrCreateUser(
      function (session, accessToken, accessTokenExtra, fbUserMetadata) {
        userProvider.findById(parseInt(fbUserMetadata.id), function(error, user) {
          if (!user) userProvider.save(new User(fbUserMetadata), function(){});
        });
        return {id: fbUserMetadata.id};
      }
    )
    .redirectPath('/dashboard');


  // Express

  app.configure(function(){
    app.set('views', __dirname + '/../views');
    app.set('view engine', 'jade');
    app.set('view options', {layout: false});
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({secret: 'secret', key: 'express.sid'}));
    app.use(app.router);
    app.use(express.static(__dirname + '/../public'));
    app.use(everyauth.middleware());
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

/**
 * Environment Configuration
 */

var parseCookie = require('connect').utils.parseCookie
  , everyauth = require('everyauth')
  , keys = require('./keys');

module.exports = function(app, express, io){


  // EveryAuth

  var userProvider = require('../models/UserProviderInstance')
    , User = require('../models/User.js');

  app.configure('development', function(){
    everyauth.facebook.appId(keys.development.facebook.id)
    everyauth.facebook.appSecret(keys.development.facebook.secret)
  });

  app.configure('production', function(){
    everyauth.facebook.appId(keys.production.facebook.id)
    everyauth.facebook.appSecret(keys.production.facebook.secret)
  });

  everyauth.facebook
    .entryPath('/auth/facebook')
    .moduleTimeout(999999999)
    .findOrCreateUser(
      function (session, accessToken, accessTokenExtra, fbUserMetadata) {
        userProvider.findById(parseInt(fbUserMetadata.id), function(error, user) {
          fbUserMetadata.token = accessToken;

          var aUser;
          if (!user) aUser = new User(fbUserMetadata);
          else {
            aUser = new User(user);
            aUser = aUser.update(fbUserMetadata);
          };

          console.log(aUser);
          userProvider.save(aUser, function(){});
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
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });


  // Socket.IO

  io.set('authorization', function (data, accept) {
    if (data.headers.cookie) {
      data.cookie = parseCookie(data.headers.cookie);
      console.log(data.cookie);
      data.sessionID = data.cookie['express.sid'];
      accept(null, true);
    } else {
      accept('No cookie transmitted.', false);
    }
  });


};

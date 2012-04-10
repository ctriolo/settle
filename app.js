
/**
 * Module dependencies.
 */

var express = require('express')
  , app = module.exports = express.createServer()
  , io = require('socket.io').listen(app)
  , environment = require('./config/environment.js')
  , routes = require('./config/routes')
    //  , everyauth = require('everyauth')
  , connect = require('connect');

//var fb_app = connect(everyauth.middleware()).listen(80);

var fb_id = "363454883695902";
var fb_secret = "0e143ba9f04db119ce185f08b6784323";
var usersByFbId = {};
/*
everyauth
  .facebook
    .appId(fb_id)
    .appSecret(fb_secret)
    .findOrCreateUser(function (session, accessToken, accessTokenExtra, fbUserMetadata) {
      console.log(fbUserMetaData);
      return usersByFbId[fbUserMetadata.id] ||
        (usersByFbId[fbUserMetadata.id] = addUser('facebook', fbUserMetadata));
    })
    .redirectPath('/');
*/
environment(app, express, io);
routes(app, io);
app.listen(80);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

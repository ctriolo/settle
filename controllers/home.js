/**
 * Home Controllers
 */

var User = require('../models/User.js')
  , UserProvider = require('../models/UserProvider.js')
  , userProvider = new UserProvider('localhost', 27017)
  , Game = require('../models/Game')
  , GameProvider = require('../models/GameProvider')
  , gameProvider = GameProvider.getInstance();

module.exports.title = function(req, res){
  if (req.session.auth && req.session.auth.loggedIn) {
    res.redirect('/dashboard');
  } else {
    res.render('title', {title: 'Settle'});
  }
};

module.exports.dashboard = function(req, res){
  userProvider.findById(parseInt(req.session.auth.userId), function(error, user) {
    res.render('dashboard', { title: 'Settle',
                              user: user,
                              games:gameProvider.getJoinable()});
  });
};

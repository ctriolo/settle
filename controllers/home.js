/**
 * Home Controllers
 */

var User = require('../models/User.js')
  , userProvider = require('../models/UserProviderInstance')
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

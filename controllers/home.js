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
  var error_msg;
  console.log(req.query['error']);
  switch(req.query['error']) {
  case 'player_left':
    error_msg = 'Sorry! A player left the game too early. Please create or join a new game.';
    break;
  }

  userProvider.findById(parseInt(req.session.auth.userId), function(error, user) {
    res.render('dashboard', { title: 'Settle',
                              user: user,
                              error: error_msg,
                              games:gameProvider.getJoinable()});
  });
};

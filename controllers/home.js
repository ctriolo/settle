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

  switch(req.query['error']) {
  case 'player_left':
    error_msg = 'Sorry! A player left the game too early. Please create or join a new game.';
    break;
  case 'in_a_game':
    error_msg = 'Sorry! You have a game open in another window. Please finish playing that one before joining or creating a new game.';
    break;
  case 'started':
    error_msg = 'Sorry! That game has already started.';
    break;
  }

  userProvider.findById(parseInt(req.session.auth.userId), function(error, user) {
    res.render('dashboard', { title: 'Settle',
                              user: user,
                              error: error_msg,
                              games:gameProvider.getJoinable()});
  });
};

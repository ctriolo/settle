/**
 * Game.js
 *
 * Controller for board games
 */

// Dependencies
var Game = require('../models/Game')
  , GameProvider = require('../models/GameProvider')
  , UIBoard = require('../models/Board/UIBoard');

var gp = GameProvider.getInstance();
var up = require('../models/UserProviderInstance');

var next_id = 0;

/**
 * create
 *
 * creates a game, and redirects to its url
 */
module.exports.create = function(req, res) {
  var game = new Game();
  game.id = next_id++;
  gp.save(game);

  res.redirect('/game/'+game.id);
};

/**
 * view
 *
 * Renders a game, including a board and players
 */
module.exports.view = function(req, res) {
  var id = req.params.id?req.params.id:'';
  var game = gp.findById(id);
  var user_id = parseInt(req.session.auth.userId);

  if (!game || game.isStarted()) {
    return res.redirect('/dashboard');
  }

  up.findById(user_id, function(error, user){

    if (user.in_game) {
      return res.redirect('/dashboard');
    }

    if (!game.isPlayer(user_id) && !game.isStarted()) {
      game.addPlayer(user_id);
    }

    gp.save(game);

    res.render('game', {
      'layout': false,
      'title': id,
      'id': id,
      'token': req.session.auth.facebook.accessToken,
      'board': (new UIBoard(game.board)).render()
    });

  });
};

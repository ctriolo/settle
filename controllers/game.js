/**
 * Game.js
 *
 * Controller for board games
 */

// Dependencies
var Game = require('../models/Game')
  , GameProvider = require('../models/GameProvider')
  , UIBoard = require('../models/Board/UIBoard');


/**
 * view
 *
 * Renders a game, including a board and players
 */
module.exports.view = function(req, res) {
  var id = req.params.id?req.params.id:'';
  var gp = GameProvider.getInstance();
  var game = gp.findById(id);

  if (!game) {
    game = new Game();
    game.id = id;
  }

  if (!game.isPlayer(req.sessionID) && !game.isStarted()) {
    game.addPlayer(req.sessionID);
  }

  gp.save(game);

  res.render('game', {
    'layout': false,
    'title': id,
    'board': (new UIBoard(game.board)).render()
  });
};

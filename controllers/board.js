/**
 * Board.js
 *
 * Controller for board games
 */

// Dependencies
var Board = require('../models/Board/Board')
  , UIBoard = require('../models/Board/UIBoard');

// Global Memory
var boards = {}; // will be moved into BoardProvider

// Constants
var MIN = 3;
var MAX = 5;

/**
 * view
 *
 * Renders a game, including a board and players
 */
module.exports.view = function(req, res) {
  var id = req.params.id?req.params.id:'default';
  if (id in boards) {
    // Fetch an existing board
    var board = boards[id];
  } else {
    // Create a new board
    var board = new Board(MIN, MAX);
    boards[id] = board;
  }

  res.render('board', {
    'layout': false,
    'title': 'Settle',
    'board': (new UIBoard(board)).render()
  });
};

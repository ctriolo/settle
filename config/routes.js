/**
 * Route Configurations
 */

var home = require('../controllers/home.js')
  , user = require('../controllers/user.js')
  , board = require('../controllers/board.js') // can delete
  , newerBoard = require('../controllers/newerBoard.js')
  , newBoard = require('../controllers/newBoard.js');

module.exports = function(app){

  // Home
  app.get('/', home.index);

  // User
  app.get('/user/:id', user.view);
  app.get('/user', user.list);
  app.get('/userfilltest', user.filltest);

  // Board
  app.get('/board', board.view);
  app.get('/board2', newBoard.view);
  app.get('/board3', newerBoard.view);

};

/**
 * Route Configurations
 */

var home = require('../controllers/home.js')
  , user = require('../controllers/user.js')
  , board = require('../controllers/board.js')
  , boardIO = require('../controllers/board.io.js');

module.exports = function(app, io){

  // Home
  app.get('/', home.index);

  // User
  app.get('/user/:id', user.view);
  app.get('/user', user.list);
  app.get('/userfilltest', user.filltest);

  // Board
  app.get('/board/:id', board.view);
  app.get('/board', board.view);
  boardIO(io.of('/board'));

};

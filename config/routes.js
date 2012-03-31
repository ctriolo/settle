/**
 * Route Configurations
 */

var home = require('../controllers/home.js')
  , user = require('../controllers/user.js')
  , game = require('../controllers/game.js')
  , gameIO = require('../controllers/game.io.js');

module.exports = function(app, io){

  // Home
  app.get('/', home.index);

  // User
  app.get('/user/:id', user.view);
  app.get('/user', user.list);
  app.get('/userfilltest', user.filltest);

  // Game
  app.get('/game/:id', game.view);
  app.get('/game', game.view);
  gameIO(io.of('/game'));

};

/**
 * Route Configurations
 */

var home = require('../controllers/home.js')
  , user = require('../controllers/user.js')
  , game = require('../controllers/game.js')
  , gameIO = require('../controllers/game.io.js');

module.exports = function(app, io){

  // Require Authentication
  function requireAuth(req, res, next) {
    if (req.session.auth && req.session.auth.loggedIn) next();
    else res.redirect('/');
  };

  // Home
  app.get('/', home.title);
  app.get('/dashboard', requireAuth, home.dashboard);

  // User
  app.get('/user/:id', requireAuth, user.view);
  app.get('/user', requireAuth, user.list);
  app.get('/userfilltest', requireAuth, user.filltest);

  // Game
  app.get('/game/:id', requireAuth, game.view);
  app.get('/game', requireAuth, game.view);
  gameIO(io.of('/game'));

};

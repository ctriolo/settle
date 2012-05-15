/**
 * Route Configurations
 */

var home = require('../controllers/home.js')
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

  // Game
  app.get('/game/:id', requireAuth, game.view);
  app.get('/game', requireAuth, game.create);

  // Any
  app.get('*', function(req, res) {
    res.redirect('/dashboard');
  });

  // Sockets
  gameIO(io.of('/game'), io.of('/dashboard'));

};


/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , io = require('socket.io')
  , mongodb = require('mongodb')
  , UserProvider = require('./models/UserProvider.js').UserProvider
  , User = require('./models/User.js').User
  , board = require('./routes/board.js');

var app = module.exports = express.createServer()
  , io = io.listen(app);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

var UserProvider = new UserProvider('localhost', 27017);

// Routes

app.get('/', routes.index);

app.get('/user/:id', function(req, res, next){
  if (!req.params.id) next();
  UserProvider.findById(parseInt(req.params.id), function(error, user){
    if (user) res.render('user', {'title': user.name, 'user': user});
    else res.send('no user');
  });
});

app.get('/user', function(req, res){
  UserProvider.findAll(function(error, users){
    res.render('users', {'title': 'Users', 'users': users});
  });
});

app.get('/board', function(req, res){
	board.start(req, res);
});

app.get('/testfilldb', function(req, res){
  users = new Array();
  users[0] = new User({'id': 1357410501, 'name': 'Christopher'});
  users[1] = new User({'id': 655436164, 'name': 'David'});
  users[2] = new User({'id': 1101120119, 'name': 'Rafael'});
  UserProvider.save(users, function(err, users){
    res.render('users', {'title': 'Users Added', 'users': users});
  });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

/**
 * User Controllers
 */

var UserProvider = require('../models/UserProvider.js')
  , User = require('../models/User.js')
  , userProvider = new UserProvider('localhost', 27017);

module.exports.view = function(req, res, next) {
  if (!req.params.id) next();
  userProvider.findById(parseInt(req.params.id), function(error, user){
    if (user) res.render('user', {'title': user.name, 'user': user});
    else res.send('no user');
  });
};

module.exports.list = function(req, res) {
  userProvider.findAll(function(error, users){
    res.render('users', {'title': 'Users', 'users': users});
  });
};

module.exports.filltest = function(req, res){
  users = new Array();
  users[0] = new User({'id': 1357410501, 'name': 'Christopher'});
  users[1] = new User({'id': 655436164, 'name': 'David'});
  users[2] = new User({'id': 1101120119, 'name': 'Rafael'});
  userProvider.save(users, function(err, users){
    res.render('users', {'title': 'Users Added', 'users': users});
  });
};

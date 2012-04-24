/**
 * Home Controllers
 */

var UserProvider = require('../models/UserProvider.js')
  , User = require('../models/User.js')
  , userProvider = new UserProvider('localhost', 27017);

module.exports.title = function(req, res){
  res.render('title', {title: 'Settle'});
};

module.exports.dashboard = function(req, res){
  userProvider.findById(parseInt(req.session.auth.userId), function(error, user) {
    res.render('dashboard', { title: 'Settle', user: user})
  });
};

/**
 * UserProvider.js
 *
 * Object that is able to fetch and save user documents
 */

var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;
var User = require('./User.js');

function UserProvider(host, port) {
  this.db = new Db('settle', new Server(host, port, {auto_reconnect: true}, {}));
  this.db.open(function(){});
};

UserProvider.prototype.getCollection = function(callback) {
  this.db.collection('user', function(error, user_collection) {
    if (error) callback(error);
    else callback(null, user_collection);
  });
};

UserProvider.prototype.find = function(query, callback) {
  this.getCollection(function(error, user_collection) {
    if (error) callback(error);
    else {
      user_collection.find(query).toArray(function(error, results) {
        if (error) callback(error);
	      else {
	        for (var i = 0; i < results.length; i++) {
	          results[i] = new User(results[i]);
	        }
	        callback(null, results);
	      }
      });
    }
  });
};

UserProvider.prototype.findAll = function(callback) {
  this.getCollection(function(error, user_collection) {
    if (error) callback(error);
    else {
      user_collection.find().toArray(function(error, results) {
        if (error) callback(error);
	else {
	  for (var i = 0; i < results.length; i++) {
	    results[i] = new User(results[i]);
	  }
	  callback(null, results);
	}
      });
    }
  });
};

UserProvider.prototype.findById = function(id, callback) {
  this.getCollection(function(error, user_collection) {
    if (error) callback(error)
    else {
      user_collection.findOne({'id': id}, function(error, result) {
        if (error) callback(error)
        else if (result) callback(null, new User(result))
	else callback();
      });
    }
  });
};

UserProvider.prototype.findByToken = function(token, callback) {
  this.getCollection(function(error, user_collection) {
    if (error) callback(error)
    else {
      user_collection.findOne({'token': token}, function(error, result) {
        if (error) callback(error)
        else if (result) callback(null, new User(result))
	else callback();
      });
    }
  });
};

UserProvider.prototype.save = function(users, callback) {
  this.getCollection(function(error, user_collection) {
    if (error) callback(error)
    else {
      if (typeof(users.length)=="undefined")
      //  users = [users]; // single user

      user_collection.update({id:users.id}, users, {safe:true, upsert:true}, function() {
        callback(null, users);
      });
    }
  });
};

module.exports = UserProvider;

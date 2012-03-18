/**
 * User.js
 *
 * Object wrapper for User documents.
 **/

function User(obj) {
  this.name = "";
  this.id = 0;
  this.wins = 0;
  this.loses = 0;

  // If an object was passed then initialize properties from that object
  for (var prop in obj) this[prop] = obj[prop];
};

exports.User = User;
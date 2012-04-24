/**
 * User.js
 *
 * Object wrapper for User documents.
 */

function User(obj) {
  if (obj._id) this._id = obj._id;
  this.id = parseInt(obj.id) || 0;
  this.name = obj.name || "";
  this.first_name = obj.first_name || "";
  this.last_name = obj.last_name || "";
  this.wins = obj.wins || 0;
  this.loses = obj.loses || 0;

  // If an object was passed then initialize properties from that object
  //for (var prop in obj) this[prop] = obj[prop];
};

module.exports = User;

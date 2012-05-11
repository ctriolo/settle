/**
 * GameProvider.js
 *
 * Singleton object that is able to fetch and save Game objects
 *
 * Example:
 *   var gp = require('/path/to/GameProvider.js).getInstance();
 *   var game = gp.findById(id);
 *   ...
 *   gp.save(game);
 */

var GameProvider = (function(){

  function _GameProvider() {
    this.games = {};

    this.findById = function(id) {
      return this.games[id];
    };

    this.deleteById = function(id) {
      delete this.games[id];
    };

    this.getJoinable = function() {
      var joinable = [];

      for (var i in this.games) {
        if (!this.games[i].isStarted()) {
          joinable.push(this.games[i]);
        }
      }

      return joinable;
    };

    this.save = function(game){
      this.games[game.id] = game;
    };
  }

  var instance = new _GameProvider();
  return {
    getInstance: function(){ return instance; }
  };
})();


/**
 * main
 *
 * test some things
 */
function main() {
  var gp1 = GameProvider.getInstance();
  var gp2 = GameProvider.getInstance();
  gp1.save({'id': '1', 'name': 'test'});
  console.log(gp2.findById('1'));
  console.log(gp1);
}


if (require.main === module) main();
else module.exports = GameProvider;

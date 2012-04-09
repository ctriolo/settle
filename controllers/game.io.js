/**
 * Game Server Side Socket IO
 */

// Dependecies
var GameProvider = require('../models/GameProvider');

var uid_to_gid = {}; // user to game

module.exports = function(sockets) {
  var gp = GameProvider.getInstance();

  sockets.on('connection', function(socket) {


    /**
     * join
     *
     * The user joins the socket io channel of their game
     * and the channel of their sessionID
     * @param  game_id  string  the game id of the game
     */
    socket.on('join', function(game_id) {
      var user_id = socket.handshake.sessionID;
      var game = gp.findById(game_id);
      if (DEBUG) { console.log('name:join ', user_id, game); }
      if (!game) { return socket.emit('disconnect'); }
      socket.join(game_id);
      socket.join(user_id);
      uid_to_gid[user_id] = game_id;
      sockets.to(game_id).send('A client just connected.');
      if (game.isStarted()) {
        sockets.to(user_id).emit('canStart');
        sockets.to(user_id).emit('start', game.getPlayers(), user_id);
        if (!game.isPlayer(user_id)) sockets.to(user_id).send('You cannot join a game that\'s already started.');
      } else if (game.canStart()) sockets.to(game_id).emit('canStart');
    });


    /**
     * start
     *
     * Kicks the game off and stops accepting new players
     */
    socket.on('start', function() {
      var user_id = socket.handshake.sessionID;
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      if (DEBUG) { console.log('name:start ', user_id, game); }
      try {
        game.start();
        gp.save(game);
        var user_ids = game.getPlayers();
        for (var i = 0; i < user_ids.length; i++) {
          sockets.to(user_ids[i]).emit('start', user_ids, user_ids[i]);
        }
        sockets.to(game_id).send('The game has begun.');
        sockets.to(game_id).emit('newTurn', game.whoseTurn(), true);
        sockets.to(game.whoseTurn()).emit('startingSettlementSelect',
          game.getValidStartingSettlementIntersections(game.whoseTurn()));
      } catch (error) {
        socket.send(error);
      }
    });


    /**
     * startingSettlementPlacement
     *
     * Places a settlement at intersection_id for the player who sent the message
     * @param   intersection_id   num   the intersection id where he wants to
     *                                  place the settlement.
     */
    socket.on('startingSettlementPlacement', function(intersection_id) {
      var user_id = socket.handshake.sessionID;
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      if (DEBUG) { console.log('name:startingSettlementPlacement ', user_id, game); }
      console.log(intersection_id);
      var resources = {}
      resources[user_id] = game.placeStartingSettlement(user_id, intersection_id);
      gp.save(game);
      sockets.to(game_id).emit('startingSettlementPlacement', intersection_id, game._translate(user_id));
      sockets.to(game_id).emit('rollDiceResults', 0, resources); // GIANT HACK TODO: FIXME
      sockets.to(game.whoseTurn()).emit('startingRoadSelect',
        game.getValidStartingRoadEdges(game.whoseTurn()));
    });


    /**
     * startingRoadPlacement
     *
     * Places an road at edge_id for the player who sent the message
     * @param   intersection_id   num   the intersection id where he wants to
     *                                  place the settlement.
     */
    socket.on('startingRoadPlacement', function(edge_id) {
      var user_id = socket.handshake.sessionID;
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      if (DEBUG) { console.log('name:startingRoadPlacement ', user_id, game); }
      game.placeStartingRoad(user_id, edge_id);
      gp.save(game);
      sockets.to(game_id).emit('startingRoadPlacement', edge_id, game._translate(user_id));
      if (game.whichPhase() == PHASE.STARTING_SETTLEMENT) {
        sockets.to(game_id).emit('newTurn', game.whoseTurn(), true);
        sockets.to(game.whoseTurn()).emit('startingSettlementSelect',
          game.getValidStartingSettlementIntersections(game.whoseTurn()));
      } else {
        sockets.to(game_id).emit('newTurn', game.whoseTurn(), false);
      }
    });


    /**
     * rollDice
     *
     * Rolls the dice. Distributes Resources.
     */
    socket.on('rollDice', function() {
      var user_id = socket.handshake.sessionID;
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        var ret = game.rollDice(user_id);
        gp.save(game);
        sockets.to(game_id).emit('rollDiceResults', ret.number, ret.resources, ret.breakdown);
      } catch (error) {
        socket.send(error);
      }
    });

    /**
      * updateRobber
      * updates robber to the given tile
      * @param		id	number	id number of the new robber tile
      */
    socket.on('updateRobber', function(id) {
      var user_id = socket.handshake.sessionID;
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        var old = game.getRobber();
        var ret = game.updateRobber(id);
        gp.save(game);
        sockets.to(game_id).emit('moveRobber', old, id);
      } catch (error) {
        socket.send(error);
      }
    });

    /**
     * endTurn
     *
     * Ends the turn for the user calling the function.
     */
    socket.on('endTurn', function() {
      var user_id = socket.handshake.sessionID;
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        var ret = game.endTurn(user_id);
        gp.save(game);
        sockets.to(game_id).emit('newTurn', game.whoseTurn(), false);
      } catch (error) {
        socket.send(error);
      }
    });


    /**
     * Purchse Selections
     */


    /**
     * selectSettlement
     *
     * Sends the user back valid build settlement intersections.
     */
    socket.on('selectSettlement', function() {
      var user_id = socket.handshake.sessionID;
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      socket.to(user_id).emit('selectSettlement',
                              game.getValidSettlementIntersections(user_id));
    });


    /**
     * selectCity
     *
     * Sends the user back valid build city intersections.
     */
    socket.on('selectCity', function() {
      var user_id = socket.handshake.sessionID;
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      socket.to(user_id).emit('selectCity',
                              game.getValidCityIntersections(user_id));
    });


    /**
     * selectRoad
     *
     * Sends the user back valid build road edges.
     */
    socket.on('selectRoad', function() {
      var user_id = socket.handshake.sessionID;
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      socket.to(user_id).emit('selectRoad', game.getValidRoadEdges(user_id));
    });


    /**
     * Purchase Building
     */


    /**
     * buildSettlement
     *
     * Places a settlement at intersection_id for the player who sent the message
     * @param   intersection_id   num   the intersection id where he wants to
     *                                  place the settlement.
     */
    socket.on('buildSettlement', function(intersection_id) {
      var user_id = socket.handshake.sessionID;
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      game.buildSettlement(user_id, intersection_id);
      gp.save(game);
      socket.to(game_id).emit('buildSettlement', intersection_id, game._translate(user_id));
    });


    /**
     * buildCity
     *
     * Places a city at intersection_id for the player who sent the message
     * @param   intersection_id   num   the intersection id where he wants to
     *                                  place the city.
     */
    socket.on('buildCity', function(intersection_id) {
      var user_id = socket.handshake.sessionID;
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      game.buildCity(user_id, intersection_id);
      gp.save(game);
      socket.to(game_id).emit('buildCity', intersection_id, game._translate(user_id));
    });


    /**
     * buildRoad
     *
     * Places a road at edge_id for the player who sent the message
     * @param   intersection_id   num   the edge id where he wants to
     *                                  place the road.
     */
    socket.on('buildRoad', function(edge_id) {
      var user_id = socket.handshake.sessionID;
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      game.buildRoad(user_id, edge_id);
      gp.save(game);
      socket.to(game_id).emit('buildRoad', edge_id, game._translate(user_id));
    });


    /**
     * message
     *
     * Received `message`s are to be treated like chat messages from others
     * @param   message   string   the chate message.
     */
    socket.on('message', function(message) {
      var user_id = socket.handshake.sessionID;
      var game_id = uid_to_gid[user_id];
      sockets.to(game_id).emit('message', user_id + ': ' + message);
    });


    /**
     * hoverOn and hoverOff
     *
     * Look cool and fun to show off, but probably won't stick around
     * @param   id   string   the id of the element to hoverOn or hoverOff
     */
    socket.on('hoverOn', function(id) {
      var game_id = uid_to_gid[socket.handshake.sessionID];
      sockets.to(game_id).emit('hoverOn', id);
    });

    socket.on('hoverOff', function(id) {
      var game_id = uid_to_gid[socket.handshake.sessionID];
      sockets.to(game_id).emit('hoverOff', id);
    });
  });

};

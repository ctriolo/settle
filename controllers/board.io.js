/**
 * Board Server Side Socket IO
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
      if (game.canStart()) sockets.to(game_id).emit('canStart');
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
        sockets.to(game_id).emit('start');
        sockets.to(game_id).send('The game has begun.');
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
    socket.on('startingSettlementPlacement', function(intersection_id, userid) {
      var user_id = socket.handshake.sessionID;
      
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      if (DEBUG) { console.log('name:startingSettlementPlacement ', user_id, game); }
      console.log(intersection_id);
      game.placeStartingSettlement(user_id, intersection_id);
      gp.save(game);
      sockets.to(game_id).emit('startingSettlementPlacement', intersection_id, game._translate(user_id));
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
      if (game.whichPhase() != PHASE.NOT_IMPLEMENTED) {
        sockets.to(game.whoseTurn()).emit('startingSettlementSelect',
          game.getValidStartingSettlementIntersections(game.whoseTurn()));
      }
    });


    /**
     * startingSettlementPlacement
     *
     * Places a settlement at intersection_id for the player who sent the message
     * @param   intersection_id   num   the intersection id where he wants to
     *                                  place the settlement.
     */
    socket.on('settlementPlacement', function(intersection_id) {
      var user_id = socket.handshake.sessionID;
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      socket.send('Not implemented yet');
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

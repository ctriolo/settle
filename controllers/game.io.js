/**
 * Game Server Side Socket IO
 */

// Constants

var OPENTOK_API_KEY = '13250542';
var OPENTOK_API_SECRET = '0263b77a74734ba0fdf356047286ee2af88cfab1';

// Dependecies
var GameProvider = require('../models/GameProvider')
  , UserProvider = require('../models/UserProvider.js')
  , User = require('../models/User.js')
  , OpenTok = require('opentok')
  , ot = new OpenTok.OpenTokSDK(OPENTOK_API_KEY, OPENTOK_API_SECRET);

var sid_to_uid = {}; // session to user
var uid_to_gid = {}; // user to game

/**
 * updatePlayerInfo
 *
 * Places an road at edge_id for the player who sent the message
 * @param   socket   object
 * @param   game     object
 */
function updatePlayerInfo(sockets, game) {
  var user_ids = game.getPlayers();
  for (var i = 0; i < user_ids.length; i++) {
    sockets.to(user_ids[i]).emit('canBuild', game.canBuild(user_ids[i]));
    sockets.to(user_ids[i]).emit('updatePlayerInfo', game.players, game.development_cards.length);
  }
}

function updateDashboard(sockets, gp) {
  sockets.to('dashboard').emit('updateDashboard', gp.getJoinable());
}

module.exports = function(sockets) {
  var gp = GameProvider.getInstance();
  var up = new UserProvider('localhost', 27017);

  sockets.on('connection', function(socket) {

    /*
    socket.on('disconnect', function() {
      alert("Goodbye");
    }); */


    socket.on('joinDashboard', function() {
      socket.join('dashboard');
    });

    /**
     * join
     *
     * The user joins the socket io channel of their game
     * and the channel of their sessionID
     * @param  game_id  string  the game id of the game
     */
    socket.on('join', function(game_id, token) {
      up.findByToken(token, function(error, user){
        var session_id = socket.handshake.sessionID;
        var user_id = user.id;
        var game = gp.findById(game_id);
        if (DEBUG) { console.log('name:join ', user_id, game); }
        if (!game) { return socket.emit('disconnect'); }
        socket.join(game_id);
        socket.join(user_id);
        sid_to_uid[session_id] = user_id;
        uid_to_gid[user_id] = game_id;
        sockets.to(game_id).send('A client just connected.');
        if (game.isStarted()) {
          sockets.to(user_id).emit('canStart');
          sockets.to(user_id).emit('start', game.getPlayers(), user_id);
          if (!game.isPlayer(user_id)) sockets.to(user_id).send('You cannot join a game that\'s already started.');
        } else if (game.canStart()) sockets.to(game_id).emit('canStart');

        if (!('sessionId' in game) && game.isPlayer(user_id)) {
          ot.createSession('localhost', {}, function(session) {
            game.sessionId = session.sessionId;
            var token = ot.generateToken({
              sessionId: game.sessionId,
              role: OpenTok.Roles.SUBSCRIBER
            });
            game.players[game._translate(user_id)].token = token;
            sockets.to(user_id).emit('joined', OPENTOK_API_KEY, game.sessionId, token, game.players[game._translate(user_id)].index); // ot2. send index
          });
        } else if (game.isPlayer(user_id)) {
          var token = ot.generateToken({
            sessionId: game.sessionId,
            role: OpenTok.Roles.SUBSCRIBER
          });
          game.players[game._translate(user_id)].token = token;
          sockets.to(user_id).emit('joined', OPENTOK_API_KEY, game.sessionId, token, game.players[game._translate(user_id)].index); // ot2. send index
        }

        updateDashboard(sockets, gp);

      });
    });

    socket.on('associateMyConnIDwithMyIndex', function(game_id, index, connID)
    {
      var game = gp.findById(game_id);
      for (var p = 0; p < game.players.length; p++)
        if (game.players[p].index == index)
          game.players[p].connectionId = connID; // ot4. receive game[index=connID]
    });

    socket.on('sendConnIDtoGetPlayerIndex', function(game_id, token, connID) {
      up.findByToken(token, function(error, user)
      {
        var user_id = user.id;
        var game = gp.findById(game_id);
        for (var p = 0; p < game.players.length; p++)
          if (game.players[p].connectionId == connID) {
            sockets.to(user_id).emit('sendPlayerIndexFromConnID', game.players[p].index) // ot6. send index for game[connID]
          }
      });
    });

    /**
     * start
     *
     * Kicks the game off and stops accepting new players
     */
    socket.on('start', function() {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      if (DEBUG) { console.log('name:start ', user_id, game); }
      try {
        game.start();
        gp.save(game);
        var user_ids = game.getPlayers();

        // Construct query to get names
        var query = [];
        for (var i = 0; i < user_ids.length; i++) {
          query.push({id: user_ids[i]})
        }
        query = {'$or': query};

        up.find(query, function(error, users) {
          for (var i = 0; i < user_ids.length; i++) {
            sockets.to(user_ids[i]).emit('start', user_ids, user_ids[i], users);
          }
          sockets.to(game_id).send('The game has begun.');
          sockets.to(game_id).emit('newTurn', game.whoseTurn(), true);
          sockets.to(game.whoseTurn()).emit('startingSettlementSelect',
            game.getValidStartingSettlementIntersections(game.whoseTurn()));
        });

      } catch (error) {
        socket.send(error);
      }

      updateDashboard(sockets, gp);
    });

    socket.on('gameover', function(winner) {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        game.gameover(winner);
        gp.save(game);
        // handle user statistics here
        var user_ids = game.getPlayers();
        for (var i = 0; i < user_ids.length; i++) {
          var win = parseInt(winner);
          up.findById(user_ids[i], function(error, user){
            if (user.id === win) {
              console.log("WINNER: " + user.id);
              user = user.win();
            }
            else {
              console.log("LOSER: " + user.id);
              user = user.lose();
            }
            up.save(user, function(){});
          });
        }
      } catch (error) {
        console.log('ERROR: ' + error);
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
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      if (DEBUG) { console.log('name:startingSettlementPlacement ', user_id, game); }
      console.log(intersection_id);
      var resources = game.placeStartingSettlement(user_id, intersection_id);
      console.log(resources);
      gp.save(game);
      sockets.to(game_id).emit('startingSettlementPlacement', intersection_id, game._translate(user_id), resources);
      updatePlayerInfo(sockets, game);
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
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      if (DEBUG) { console.log('name:startingRoadPlacement ', user_id, game); }
      game.placeStartingRoad(user_id, edge_id);
      gp.save(game);
      sockets.to(game_id).emit('startingRoadPlacement', edge_id, game._translate(user_id));
      updatePlayerInfo(sockets, game);
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
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        var ret = game.rollDice(user_id);

        if (ret.number == 7) {
          var remove = game.removeCards();
          if (Object.keys(remove).length > 0) {
            sockets.to(game.whoseTurn()).emit('showRobber', true);
            for (var player in remove) {
              sockets.to(player).emit('removeCards', remove[player]);
            }
          }
          else
            sockets.to(game.whoseTurn()).emit('showRobber', false);
        }
        gp.save(game);
        sockets.to(game_id).emit('rollDiceResults', ret.number, ret.resources, ret.breakdown);
        socket.emit('canBuild', game.canBuild(user_id));
        setTimeout(function() {updatePlayerInfo(sockets, game)}, 4*1000);
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });

    socket.on('removed', function(removedCards, player,total) {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        var done = game.remove(removedCards, player);
        gp.save(game);
        updatePlayerInfo(sockets, game);
        socket.emit('canBuild', game.canBuild(user_id));
        if (done) {
            sockets.to(game.whoseTurn()).emit('showRobber', false);
        }
        sockets.to(game_id).emit('removeUpdate', player, total);
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });


    /**
      * updateRobber
      * updates robber to the given tile
      * @param		id	number	id number of the new robber tile
      */
    socket.on('updateRobber', function(id) {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        var old = game.getRobber();
        var players = game.updateRobber(user_id, id);
        gp.save(game);

        sockets.to(game_id).emit('moveRobber', old, id);
        if (players.length > 0)
          sockets.to(game.whoseTurn()).emit('showSteal', players);
        else {
          sockets.send("No one to steal from");
          if (game.whichPhase() == PHASE.MAIN) {
            sockets.to(game.whoseTurn()).emit('showMain');
          } else {
            sockets.to(game.whoseTurn()).emit('showDice');
          }
        }
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });

    /**
      * steal
      * steals resource from given player
      * @param	 thief	user stealing
      * @param player_id  user being stolen from
      */
    socket.on('steal', function(player_id) {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        var resource = game.steal(player_id);
        gp.save(game);
        sockets.to(game.whoseTurn()).emit('stealCard', game.whoseTurn(), player_id,  resource);
        socket.emit('canBuild', game.canBuild(user_id));
        if (game.whichPhase() == PHASE.MAIN) {
          sockets.to(game.whoseTurn()).emit('showMain');
        } else {
          sockets.to(game.whoseTurn()).emit('showDice');
        }
        updatePlayerInfo(sockets, game);
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });



    /**
     * endTurn
     *
     * Ends the turn for the user calling the function.
     */
    socket.on('endTurn', function() {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        var ret = game.endTurn(user_id);
        gp.save(game);
        sockets.to(game_id).emit('tradeCleanup');
        sockets.to(game_id).emit('newTurn', game.whoseTurn(), false);
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });

    /**
      * send offer
      **/
      socket.on('offerTrade', function(offer, offerer) {
        var session_id = socket.handshake.sessionID;
        var user_id = sid_to_uid[session_id];
        var game_id = uid_to_gid[user_id];
        var game = gp.findById(game_id);
        try {
          sockets.to(game_id).emit('showTrade', offer, offerer, "");
        } catch (error) {
          console.log('ERROR: ' + error);
        }
      });

      socket.on('rejectTrade', function(offer, rejecter, offerer) {
        var session_id = socket.handshake.sessionID;
        var user_id = sid_to_uid[session_id];
        var game_id = uid_to_gid[user_id];
        var game = gp.findById(game_id);
        try {
          sockets.to(game_id).emit('showTrade', offer, rejecter, "rejected");
        } catch (error) {
          console.log('ERROR: ' + error);
        }
      });

    /**
      * allow bank trades
      **/
      socket.on('bankTrade', function(offer, offerer) {
        console.log("BANK TRADING*************");
        var session_id = socket.handshake.sessionID;
        var user_id = sid_to_uid[session_id];
        var game_id = uid_to_gid[user_id];
        var game = gp.findById(game_id);
        try {
          var ret = game.bankTrade(offer, offerer);
          updatePlayerInfo(sockets, game);
          gp.save(game);
          sockets.to(game_id).emit('tradeCleanup');
          socket.emit('canBuild', game.canBuild(user_id));
        } catch (error) {
          console.log('ERROR: ' + error);
        }
      });
    /**
      * accept trade from accepter
      **/
      socket.on('acceptTrade', function(offer, accepter, offerer, type) {
        var session_id = socket.handshake.sessionID;
        var user_id = sid_to_uid[session_id];
        var game_id = uid_to_gid[user_id];
        var game = gp.findById(game_id);

	// trade finally accepted!
        if (type === "done") {
          try {
            console.log(accepter + " " + user_id);
            var ret = game.acceptTrade(offer, accepter, offerer);
            updatePlayerInfo(sockets, game);
            gp.save(game);
            sockets.to(game_id).emit('tradeCleanup');
            socket.emit('canBuild', game.canBuild(user_id));
          } catch (error) {
            console.log('ERROR: ' + error);
          }
        }

        // send back to original trader for acceptance
        else {
          // reverse offer
          var temp = offer['offer'];
          offer['offer'] = offer['for'];
          offer['for'] = temp;
          try {
            sockets.to(game_id).emit('showTrade', offer, accepter, "accepted");
          } catch (error) {
            console.log('ERROR: ' + error);
          }
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
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        socket.emit('selectSettlement',
                  game.getValidSettlementIntersections(user_id));
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });


    /**
     * selectCity
     *
     * Sends the user back valid build city intersections.
     */
    socket.on('selectCity', function() {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        socket.emit('selectCity',
                  game.getValidCityIntersections(user_id));
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });


    /**
     * selectRoad
     *
     * Sends the user back valid build road edges.
     */
    socket.on('selectRoad', function() {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        socket.emit('selectRoad', game.getValidRoadEdges(user_id));
      } catch (error) {
        console.log('ERROR: ' + error);
      }
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
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        game.buildSettlement(user_id, intersection_id);
        gp.save(game);
        updatePlayerInfo(sockets, game);
        socket.emit('canBuild', game.canBuild(user_id));
        sockets.to(game_id).emit('buildSettlement', intersection_id, game._translate(user_id));
        sockets.to(game.whoseTurn()).emit('showMain');
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });


    /**
     * buildCity
     *
     * Places a city at intersection_id for the player who sent the message
     * @param   intersection_id   num   the intersection id where he wants to
     *                                  place the city.
     */
    socket.on('buildCity', function(intersection_id) {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        game.buildCity(user_id, intersection_id);
        gp.save(game);
        updatePlayerInfo(sockets, game);
        socket.emit('canBuild', game.canBuild(user_id));
        sockets.to(game_id).emit('buildCity', intersection_id, game._translate(user_id), user_id);
        sockets.to(game.whoseTurn()).emit('showMain');
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });


    /**
     * buildRoad
     *
     * Places a road at edge_id for the player who sent the message
     * @param   intersection_id   num   the edge id where he wants to
     *                                  place the road.
     */
    socket.on('buildRoad', function(edge_id) {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        game.buildRoad(user_id, edge_id);
        gp.save(game);
        updatePlayerInfo(sockets, game);
        socket.emit('canBuild', game.canBuild(user_id));
        sockets.to(game_id).emit('buildRoad', edge_id, game._translate(user_id), user_id);
        sockets.to(game.whoseTurn()).emit('showMain');
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });


    /**
     * buildDevelopment
     *
     * Gives a random dev card to the user who called the socket type
     */
    socket.on('buildDevelopment', function(edge_id) {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        game.buildDevelopment(user_id);
        gp.save(game);
        updatePlayerInfo(sockets, game);
        socket.emit('canBuild', game.canBuild(user_id));
        sockets.to(game_id).emit('developmentUpdate', user_id);
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });


    socket.on('cancelBuild', function() {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        game.cancelBuild();
        gp.save(game);
        socket.emit('canBuild', game.canBuild(user_id));
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });

    /**
     * playKnight
     *
     * Initiates Knight
     */
    socket.on('playKnight', function(edge_id) {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        game.playKnight(user_id);
        gp.save(game);
        sockets.to(game.whoseTurn()).emit('showRobber', false);
        updatePlayerInfo(sockets, game);
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });


    /**
     * playYearOfPlenty
     *
     * Initiates Year Of Plenty
     */
    socket.on('playYearOfPlenty', function() {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        game.playYearOfPlenty(user_id);
        gp.save(game);
        updatePlayerInfo(sockets, game);
        socket.emit('yearOfPlentyFirst');
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });


    /**
     * playYearOfPlentyFirst
     *
     * Initiates Year Of Plenty
     */
    socket.on('playYearOfPlentyFirst', function(resource) {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        game.playYearOfPlentyFirst(user_id, resource);
        gp.save(game);
        updatePlayerInfo(sockets, game);
        socket.emit('yearOfPlentySecond');
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });


    /**
     * playYearOfPlentySecond
     *
     * Initiates Year Of Plenty
     */
    socket.on('playYearOfPlentySecond', function(resource) {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        game.playYearOfPlentySecond(user_id, resource);
        gp.save(game);
        updatePlayerInfo(sockets, game);
        socket.emit('canBuild', game.canBuild(user_id));
        socket.emit('yearOfPlentyDone');
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });


    /**
     * playMonopoly
     *
     * Initiates Monopoly
     */
    socket.on('playMonopoly', function() {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        game.playMonopoly(user_id);
        gp.save(game);
        updatePlayerInfo(sockets, game);
        socket.emit('monopoly');
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });


    /**
     * chooseMonopolyResource
     *
     * Initiates Monopoly
     */
    socket.on('chooseMonopolyResource', function(resource) {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        game.chooseMonopolyResource(user_id, resource);
        gp.save(game);
        updatePlayerInfo(sockets, game);
        socket.emit('canBuild', game.canBuild(user_id));
        socket.emit('monopolyDone');
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });


    /**
     * playRoadBuilding
     *
     * Initiates Road Building
     */
    socket.on('playRoadBuilding', function() {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        game.playRoadBuilding(user_id);
        gp.save(game);
        updatePlayerInfo(sockets, game);
        socket.emit('roadBuildingFirst', game.getValidRoadEdges(user_id));
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });


    /**
     * playRoadBuilding
     *
     * Initiates Road Building
     */
    socket.on('playRoadBuildingFirst', function(edge_id) {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        game.playRoadBuildingFirst(user_id, edge_id);
        gp.save(game);
        updatePlayerInfo(sockets, game);
        sockets.to(game_id).emit('buildRoad', edge_id, game._translate(user_id));
        socket.emit('roadBuildingSecond', game.getValidRoadEdges(user_id));
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });


    /**
     * playRoadBuilding
     *
     * Initiates Road Building
     */
    socket.on('playRoadBuildingSecond', function(edge_id) {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
      var game_id = uid_to_gid[user_id];
      var game = gp.findById(game_id);
      try {
        game.playRoadBuildingSecond(user_id, edge_id);
        gp.save(game);
        updatePlayerInfo(sockets, game);
        sockets.to(game_id).emit('buildRoad', edge_id, game._translate(user_id));
        socket.emit('canBuild', game.canBuild(user_id));
        socket.emit('roadBuildingDone');
      } catch (error) {
        console.log('ERROR: ' + error);
      }
    });


    /**
     * message
     *
     * Received `message`s are to be treated like chat messages from others
     * @param   message   string   the chate message.
     */
    socket.on('message', function(message) {
      var session_id = socket.handshake.sessionID;
      var user_id = sid_to_uid[session_id];
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

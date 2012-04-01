/**
 * Game.js
 */

// Dependencies
var Board = require('./Board/Board');

/**
 * Constants
 */

PHASE = {
  START: 'Start',
  STARTING_SETTLEMENT: 'Starting Settlement',
  STARTING_ROAD: 'Starting Road',
  // TODO: fill these in as we go along
  END: 'End',
  NOT_IMPLEMENTED: 'Not Implemented' // placeholder
};

PLAYER = {
  NONE: -1,
  ZERO:  0,
  ONE:   1,
  TWO:   2,
  THREE: 3,
  FOUR:  4,
  FIVE:  5,
};

RESOURCE = {
  BRICK: 'Brick',
  SHEEP: 'Sheep',
  STONE: 'Stone',
  WHEAT: 'Wheat',
  WOOD:  'Wood',
};

DEVELOPMENT = {
  KNIGHT:         'Knight',
  ROAD_BUILDING:  'Road Building',
  MONOPOLY:       'Monopoly',
  YEAR_OF_PLENTY: 'Year Of Plenty',
  UNIVERSITY:     'University',
  MARKET:         'Market',
  LIBRARY:        'Library',
  PALACE:         'Palace',
  CHAPEL:         'Chapel',
}

/**
 * Helper Objects
 */

function Player(index, user_id) {
  this.index = index;
  this.user_id = user_id;
  this.resource_cards = [];
  this.development_cards = [];
  this.unbuilt_roads = 15;
  this.unbuilt_settlements = 5;
  this.unbuilt_cities = 5;
}

/**
 * Constructor
 */

function Game() {
  this.board = new Board();
  this.board.json2(); //giant hack, to assign ids, TODO fix it
  this.players = [];
  this.development_cards = [];
  this.current_player = -1;
  this.current_phase = PHASE.START;
};

/**
 * Private Interface
 */

/**
 * _translate (private)
 *
 * Return the player id associated with the `user_id`
 * @param   user_id   string   the user_id to translate
 * @return            num      the player_id
 */
Game.prototype._translate = function(user_id) {
  for (var i = 0; i < this.players.length; i++) {
    if (this.players[i].user_id == user_id) return i;
  }
  return PLAYER.NONE;
}


/**
 * _validatePlayer (private)
 *
 * Call this function when you want to make sure that
 * player_id == this.current_player. It throws an exception if it isn't.
 * @param   player_id   num   the id to check
 */
Game.prototype._validatePlayer = function(player_id) {
  if (player_id != this.current_player) {
    throw 'It is not Player ' + player_id + '\'s turn, it is '
          + 'Player ' + this.current_player + '\'s turn.';
  }
};


/**
 * _validatePhase (private)
 *
 * Call this function when you want to make sure that
 * phase == this.current_phase. It throws an exception if it isn't
 * @param   phase   string   the phase to check
 */
Game.prototype._validatePhase = function(phase) {
  if (phase != this.current_phase) {
    throw 'It is not the ' + phase + ' phase. It is the '
          + this.current_phase + ' phase.';
  }
};


/**
 * _nextPlayer (private)
 *
 * Chooses the correct next player based on whats happening in the game.
 * Handles the starting positions logic.
 * Handles iterating through players everywhere else.
 * Should probably only be called by _next()
 */
Game.prototype._nextPlayer = function() {
  if (this.current_phase == PHASE.STARTING_ROAD ||
      this.current_phase == PHASE.STARTING_SETTLEMENT) {

    // Starting Placement Ugliness

    var settlements = this.board.getNumberOfSettlements(this.current_player);

    // If they have just placed their first one the next player is next
    if (settlements == 1) {
      this.current_player++;
    }

    // If they have just placed their second, the previous is next
    if (settlements == 2) {
      this.current_player--;
    }

    // Clamp
    if (this.current_player == -1) this.current_player++;
    if (this.current_player == this.players.length) this.current_player--;

  } else {
    // Normal progression
    this.current_player = (this.current_player + 1) % this.players.length;
  }
};


/**
 * _next (private)
 *
 * Figures out and sets the next phase. (this.current_phase)
 * Figures out and sets the next player. (this.current_player)
 * [Most of the time the next player is set by calling _nextPlayer()]
 */
Game.prototype._next = function() {
  switch(this.current_phase) {
  case PHASE.START:
    this.current_phase = PHASE.STARTING_SETTLEMENT;
    this.current_player = PLAYER.ZERO;
    break;
  case PHASE.STARTING_SETTLEMENT:
    this.current_phase = PHASE.STARTING_ROAD;
    break;
  case PHASE.STARTING_ROAD:
    this._nextPlayer();
    if (this.board.getNumberOfSettlements(this.current_player) == 2) {
      this.current_phase = PHASE.NOT_IMPLEMENTED; // =D TODO: implement it
    } else {
      this.current_phase = PHASE.STARTING_SETTLEMENT;
    }
    break;
  }
};

/**
 * Public Interface
 */


// Accessors

/**
 * whoseTurn
 *
 * @return   string   the user_id of the player whose turn it is
 */
Game.prototype.whoseTurn = function() {
  return this.players[this.current_player].user_id;
};

/**
 * whichPhase
 *
 * @return   string   the phase it is
 */
Game.prototype.whichPhase = function() {
  return this.current_phase;
};

/**
 * isPlayer
 *
 * @param   user_id   string    the user_id
 * @return            boolean   whether or not the user is a player
 */
Game.prototype.isPlayer = function(user_id) {
  return this._translate(user_id) != PLAYER.NONE;
}

/**
 * canStart
 *
 * @return   boolean   whether or not the game can start
 */
Game.prototype.canStart = function() {
  return this.players.length >= 2 && this.current_phase == PHASE.START;
};

/**
 * getValidStartingSettlementIntersections
 *
 * Return the valid starting settlement intersections for user_id in the
 * for of an array of intersection ids.
 * @return   array   the array of intersection ids
 */
Game.prototype.getValidStartingSettlementIntersections = function(user_id) {
  var player_id = this._translate(user_id);
  return this.board.getValidStartingSettlementIntersections(player_id);
};

/**
 * getValidStartingRoadEdges
 *
 * Return the valid starting settlement edges for user_id in the
 * for of an array of edge ids.
 * @return   array   the array of edge ids
 */
Game.prototype.getValidStartingRoadEdges = function(user_id) {
  var player_id = this._translate(user_id);
  return this.board.getValidStartingRoadEdges(player_id);
};

// Modifiers


/**
 * addPlayer
 *
 * Adds a player with the indentifier user_id.
 * Throws an exception if the action is invalid.
 * @param   user_id  string   the public identifier for the player
 */
Game.prototype.addPlayer = function(user_id) {
  this._validatePhase(PHASE.START);

  this.players.push(new Player(this.players.length, user_id));
  return this.players.length - 1;
};


/**
 * start
 *
 * Sets the starting values.
 * Throws an exception if the action is invalid.
 */
Game.prototype.start = function() {
  this._validatePhase(PHASE.START);

  if (!this.canStart) {
    throw 'The game can not be started.';
  }

  this._next();
}


/**
 * placeStartingSettlement
 *
 * Places a starting settlement at intersection_id for user_id
 * Throws an exception if the action is invalid.
 * @param   user_id           string   the user who wants to place a intersection
 * @param   intersection_id   num      the location to place the intersection
 */
Game.prototype.placeStartingSettlement = function(user_id, intersection_id) {
  var player_id = this._translate(user_id);
  this._validatePlayer(player_id);
  this._validatePhase(PHASE.STARTING_SETTLEMENT);

  this.players[player_id].unbuilt_settlements--;
  this.board.placeStartingSettlement(player_id, intersection_id);

  this._next();
};


/**
 * placeStartingRoad
 *
 * Places a starting road at edge_id for user_id
 * Throws an exception if the action is invalid.
 * @param   user_id   string   the user who wants to place a road
 * @param   edge_id   num      the location to place the road
 */
Game.prototype.placeStartingRoad = function(user_id, edge_id) {
  var player_id = this._translate(user_id);
  this._validatePlayer(player_id);
  this._validatePhase(PHASE.STARTING_ROAD);

  this.players[player_id].unbuilt_roads--;
  this.board.placeStartingRoad(player_id, edge_id);

  this._next();
};


/**
 * main
 *
 * Does some basic stuff with the Game object
 */
function main() {
  var USER_IDS = [1234, 5678, 9101112];
  var NUM_PLAYERS = 3;

  var pick_settlement_and_road = function (game, player, print) {
    var valid_intersection_ids = game.getValidStartingSettlementIntersections(player);
    if (print) console.log('The valid starting settlement locations for player ' + player + ' is:' +
                JSON.stringify(valid_intersection_ids));
    var settlement_choice = valid_intersection_ids[0];
    game.placeStartingSettlement(player, settlement_choice);
    if (print) console.log(game.board._getIntersection(settlement_choice).token);
    var valid_edge_ids = game.getValidStartingRoadEdges(player);
    if (print) console.log('The valid starting road locations for player ' + player + ' is:' +
                JSON.stringify(valid_edge_ids));
    var road_choice = valid_edge_ids[0];
    game.placeStartingRoad(player, road_choice);
    if (print) console.log(game.board._getEdge(road_choice).token);
    if (print) console.log('Player 0 Settlements: ' + game.board.getNumberOfSettlements(0));
    if (print) console.log('Player 1 Settlements: ' + game.board.getNumberOfSettlements(1));
    if (print) console.log('Player 2 Settlements: ' + game.board.getNumberOfSettlements(2));
  };

  var game = new Game();

  // Add Players
  for (var i = 0; i < USER_IDS.length; i++) {
    game.addPlayer(USER_IDS[i]);
  }

  // Start the game
  game.start();

  // Players pick first starting settlement and road
  for (var i = 0; i < USER_IDS.length; i++) {
    pick_settlement_and_road(game, USER_IDS[i], true);
  }

  // Players pick second starting settlement and road
  for (var i = USER_IDS.length-1; i >= 0; i--) {
    pick_settlement_and_road(game, USER_IDS[i], true);
  }

  console.log(game);
};

if (require.main === module) main();
else module.exports = Game;

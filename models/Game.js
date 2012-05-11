/**
 * Game.js
 */

// Dependencies
var _ = require('underscore');
var Board = require('./Board/Board');

/**
 * Constants
 */

PHASE = {
  START: 'Start',
  STARTING_SETTLEMENT: 'Starting Settlement',
  STARTING_ROAD: 'Starting Road',
  BUILD: 'Build',
  DICE: 'Dice',
  MAIN: 'Main',
  REMOVE: 'Remove',
  ROBBER: 'Robber',
  STEAL: 'Steal',
  KNIGHT: 'Knight',
  YEAR_OF_PLENTY_FIRST: 'Year Of Plenty First',
  YEAR_OF_PLENTY_SECOND: 'Year Of Plenty Second',
  MONOPOLY: 'Monopoly',
  ROAD_BUILDING_FIRST: 'Road Building First',
  ROAD_BUILDING_SECOND: 'Road Building Second',
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

RESOURCE_ARRAY = [ RESOURCE.WHEAT, RESOURCE.WOOD, RESOURCE.SHEEP, RESOURCE.BRICK, RESOURCE.STONE];
PORT_ARRAY = ["Wheat21", "Wood21", "Sheep21", "Brick21", "Stone21"];

DEVELOPMENT = {
  KNIGHT:         'Knight',
  ROAD_BUILDING:  'RoadBuilding',
  MONOPOLY:       'Monopoly',
  YEAR_OF_PLENTY: 'YearOfPlenty',
  UNIVERSITY:     'University',
  MARKET:         'Market',
  LIBRARY:        'Library',
  PALACE:         'Palace',
  CHAPEL:         'Chapel',
}

VICTORY_CARDS = [DEVELOPMENT.UNIVERSITY, DEVELOPMENT.MARKET, DEVELOPMENT.LIBRARY, DEVELOPMENT.PALACE, DEVELOPMENT.CHAPEL];

SETTLEMENT_COST = {};
SETTLEMENT_COST[RESOURCE.WOOD]  = 1;
SETTLEMENT_COST[RESOURCE.BRICK] = 1;
SETTLEMENT_COST[RESOURCE.WHEAT] = 1;
SETTLEMENT_COST[RESOURCE.SHEEP] = 1;

CITY_COST = {};
CITY_COST[RESOURCE.STONE] = 3;
CITY_COST[RESOURCE.WHEAT] = 2;

ROAD_COST = {};
ROAD_COST[RESOURCE.WOOD]  = 1;
ROAD_COST[RESOURCE.BRICK] = 1;

DEVELOPMENT_COST = {};
DEVELOPMENT_COST[RESOURCE.SHEEP] = 1;
DEVELOPMENT_COST[RESOURCE.STONE] = 1;
DEVELOPMENT_COST[RESOURCE.WHEAT] = 1;


/**
 * Helper Objects
 */

function Player(index, user_id, first_name, last_name, wins, losses) {
  this.index = index;
  this.user_id = user_id;
  this.first_name = first_name;
  this.last_name = last_name;
  this.wins = wins;
  this.losses = losses;
  // Resources
  this.resource_cards = {};
  this.resource_cards[RESOURCE.BRICK] = 0;
  this.resource_cards[RESOURCE.SHEEP] = 0;
  this.resource_cards[RESOURCE.STONE] = 0;
  this.resource_cards[RESOURCE.WHEAT] = 0;
  this.resource_cards[RESOURCE.WOOD]  = 0;

  // Developments
  this.development_cards = {};
  for (var i in DEVELOPMENT) this.development_cards[DEVELOPMENT[i]] = 0;
  this.pending_development_cards = {};
  for (var i in DEVELOPMENT) this.pending_development_cards[DEVELOPMENT[i]] = 0;
  this.played_development = false;
  this.victory_points = 0;
  this.victory_cards = 0;

  // unique list of ports
  this.ports = [];

  // Unbuilts
  this.unbuilt_roads = 15;
  this.unbuilt_settlements = 5;
  this.unbuilt_cities = 5;

  // Tophies
  this.longest_road = 0;
  this.has_longest_road = false;
  this.army_size = 0;
  this.has_largest_army = false;
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
  this.steal_players = 0; // number of players that need to lose cards
  this.can_build = true;
  // Add Knight Cards
  for (var i = 0; i < 14; i++) {
    this.development_cards.push(DEVELOPMENT.KNIGHT);
  }

  // Add Progress Cards
  for (var i = 0; i < 2; i++) {
    this.development_cards.push(DEVELOPMENT.YEAR_OF_PLENTY);
    this.development_cards.push(DEVELOPMENT.ROAD_BUILDING);
    this.development_cards.push(DEVELOPMENT.MONOPOLY);
  }

  // Add Victory Point Cards
  this.development_cards.push(DEVELOPMENT.UNIVERSITY);
  this.development_cards.push(DEVELOPMENT.MARKET);
  this.development_cards.push(DEVELOPMENT.LIBRARY);
  this.development_cards.push(DEVELOPMENT.PALACE);
  this.development_cards.push(DEVELOPMENT.CHAPEL);

  this.development_cards = _.shuffle(this.development_cards);

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
Game.prototype._validatePhase = function(phase1, phase2) {
  if (phase1 == this.current_phase || phase2 == this.current_phase) return;

  throw 'It is not the ' + phase1 + 'or the' + phase2 + ' phase. It is the '
        + this.current_phase + ' phase.';
};

Game.prototype._validateBuild = function() {
  if (!this.can_build)
    throw "Can't build right now";
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
    do {
      this.current_player = (this.current_player + 1) % this.players.length;
    } while (this.players[this.current_player].dead)

    // Reset things
    this.players[this.current_player].played_development = false;
    for (var i in DEVELOPMENT) this.players[this.current_player].pending_development_cards[DEVELOPMENT[i]] = 0;

  }
};


/**
 * _next (private)
 *
 * Figures out and sets the next phase. (this.current_phase)
 * Figures out and sets the next player. (this.current_player)
 * [Most of the time the next player is set by calling _nextPlayer()]
 */
Game.prototype._next = function(diceRoll) {
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
      this.current_phase = PHASE.DICE;
      this.has_dice_rolled = false;
    } else {
      this.current_phase = PHASE.STARTING_SETTLEMENT;
    }
    break;
  case PHASE.DICE:
    this.has_dice_rolled = true;
    if (diceRoll === 7)
      this.current_phase = PHASE.REMOVE
    else
      this.current_phase = PHASE.MAIN
    break;
  case PHASE.REMOVE:
    if (this.steal_players === 0)
      this.current_phase = PHASE.ROBBER
    break;
  case PHASE.ROBBER:
  case PHASE.KNIGHT:
    this.current_phase = PHASE.STEAL;
    break;
  case PHASE.STEAL:
    if (!this.has_dice_rolled)  this.current_phase = PHASE.DICE;
    else this.current_phase = PHASE.MAIN;
    break;
  case PHASE.MAIN:
    this.current_phase = PHASE.DICE;
    this.has_dice_rolled = false;
    this._nextPlayer();
    break;
  }
};

/**
 * _addResources (private)
 *
 * Does any resource math needed.
 * @param   player_id   num      the id of the plasyer
 * @param   resources   object   the assoc array of resource values
 */
Game.prototype._addResources = function(player_id, resources) {
  for (var resource in resources) {
    this.players[player_id].resource_cards[resource] += resources[resource];
  };
};

/**
 * _subtractResources (private)
 *
 * Does any resource math needed.
 * @param   player_id   num      the id of the player
 * @param   resources   object   the assoc array of resource values
 */
Game.prototype._subtractResources = function(player_id, resources) {
  for (var resource in resources) {
    this.players[player_id].resource_cards[resource] -= resources[resource];
  };
};

/**
 * _canAfford (private)
 *
 * Can the player afford the cost
 * @param   player_id   num      the id of the player
 * @param   cost        object   the assoc array of resource values
 */
Game.prototype._canAfford = function(player_id, cost) {
  for (var resource in cost) {
    if (this.players[player_id].resource_cards[resource] < cost[resource]) return false;
  }
  return true;
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
 * getPlayers
 *
 * @return   array   of strings of user ids
 */
Game.prototype.getPlayers = function() {
  var users = [];

  for (var i = 0; i < this.players.length; i++) {
    users.push(this.players[i].user_id);
  }

  return users;
};

/**
 * isPlayer
 *
 * @param   user_id   string    the user_id
 * @return            boolean   whether or not the user is a player
 */
Game.prototype.isPlayer = function(user_id) {
  return this._translate(user_id) != PLAYER.NONE;
};

/**
 * isStarted
 *
 * @return   boolean   whether or not the game has started
 */
Game.prototype.isStarted = function() {
  return this.current_phase != PHASE.START;
};

/**
 * updateLongestRoad
 */
Game.prototype.updateLongestRoad = function() {
  var max = 0;
  var player = -1;

  // Set the previous longest road player as the max
  for (var i = 0; i < this.players.length; i++) {
    if (this.players[i]['has_longest_road'] == true) {
      max = this.board.longestRoad(i);
      player = i;
    }
  }

  for (var i = 0; i < this.players.length; i++) {
    var roads = this.board.longestRoad(i);
    this.players[i]['longest_road'] = roads;
    this.players[i]['has_longest_road'] = false;
    if (roads > max) {
      max = roads;
      player = i;
    }
  }

  if (player !== -1 && max >= 5) {
    this.players[player]['has_longest_road'] = true;
  }
}

/**
 * updateLargestArmy
 */
Game.prototype.updateLargestArmy = function() {
  var max = 0;
  var player = -1;

  for (var i = 0; i < this.players.length; i++) {
    var army = this.players[i]['army_size'];
    this.players[i]['has_largest_army'] = false;
    if (army > max) {
      max = army;
      player = i;
    }
  }

  if (player !== -1 && max >= 3) {
    this.players[player]['has_largest_army'] = true;
  }
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


/**
 * getValidSettlementIntersections
 *
 * Return the valid settlement intersections for user_id in the
 * for of an array of intersection ids.
 * @return   array   the array of intersection ids
 */
Game.prototype.getValidSettlementIntersections = function(user_id) {
  var player_id = this._translate(user_id);
  this._validatePhase(PHASE.MAIN);
  this.current_phase = PHASE.BUILD;
  return this.board.getValidSettlementIntersections(player_id);
};


/**
 * getValidCityIntersections
 *
 * Return the valid city intersections for user_id in the
 * for of an array of intersection ids.
 * @return   array   the array of intersection ids
 */
Game.prototype.getValidCityIntersections = function(user_id) {
  var player_id = this._translate(user_id);
  this._validatePhase(PHASE.MAIN);
  this.current_phase = PHASE.BUILD;
  return this.board.getValidCityIntersections(player_id);
};


/**
 * getValidRoadEdges
 *
 * Return the valid starting settlement edges for user_id in the
 * for of an array of edge ids.
 * @return   array   the array of edge ids
 */
Game.prototype.getValidRoadEdges = function(user_id) {
  var player_id = this._translate(user_id);
  if (this.current_phase != PHASE.ROAD_BUILDING_FIRST &&
      this.current_phase != PHASE.ROAD_BUILDING_SECOND) {
    this._validatePhase(PHASE.MAIN);
    this.current_phase = PHASE.BUILD;
  }
  return this.board.getValidRoadEdges(player_id);
};


/**
 * canBuild
 *
 * @param   user_id   string   the user we are checking for
 * @return            object   associated array of booleans
 */
Game.prototype.canBuild = function(user_id) {
  var can_build = {};

  can_build['Settlement'] =  this.canBuildSettlement(user_id);
  can_build['City'] =        this.canBuildCity(user_id);
  can_build['Road'] =        this.canBuildRoad(user_id);
  can_build['Development'] = this.canBuildDevelopment(user_id);

  return can_build;
}

/**
 * canBuildSettlement
 *
 * Return whether or not the user can build a settlement. This both means that
 * there is a location for him to build and that he can afford it.
 * @param   user_id   string   the user we are checking for
 */
Game.prototype.canBuildSettlement = function(user_id) {
  var player_id = this._translate(user_id);
  var valid_locs = this.board.getValidSettlementIntersections(player_id).length > 0;
  var pieces_left = this.players[player_id].unbuilt_settlements > 0;
  var can_afford = this._canAfford(player_id, SETTLEMENT_COST);

  return valid_locs && can_afford && pieces_left;
};


/**
 * canBuildCity
 *
 * Return whether or not the user can build a road. This both means that
 * there is a location for him to build and that he can afford it.
 * @param   user_id   string   the user we are checking for
 */
Game.prototype.canBuildCity = function(user_id) {
  var player_id = this._translate(user_id);
  var valid_locs = this.board.getValidCityIntersections(player_id).length > 0;
  var pieces_left = this.players[player_id].unbuilt_cities > 0;
  var can_afford = this._canAfford(player_id, CITY_COST);

  return valid_locs && can_afford && pieces_left;
};


/**
 * canBuildRoad
 *
 * Return whether or not the user can build a road. This both means that
 * there is a location for him to build and that he can afford it.
 * @param   user_id   string   the user we are checking for
 */
Game.prototype.canBuildRoad = function(user_id) {
  var player_id = this._translate(user_id);
  var valid_locs = this.board.getValidRoadEdges(player_id).length > 0;
  var pieces_left = this.players[player_id].unbuilt_roads > 0;
  var can_afford = this._canAfford(player_id, ROAD_COST);

  return valid_locs && can_afford && pieces_left;
};


/**
 * canBuildDevelopment
 *
 * Return whether or not the user can build a development card.
 * @param   user_id   string   the user we are checking for
 */
Game.prototype.canBuildDevelopment = function(user_id) {
  var player_id = this._translate(user_id);
  var can_afford = this._canAfford(player_id, DEVELOPMENT_COST);
  var pieces_left = this.development_cards.length > 0;

  return can_afford && pieces_left;
};


// Modifiers


/**
 * addPlayer
 *
 * Adds a player with the indentifier user_id.
 * Throws an exception if the action is invalid.
 * @param   user_id  string   the public identifier for the player
 */
Game.prototype.addPlayer = function(user_id, first_name, last_name, wins, losses) {
  this._validatePhase(PHASE.START);

  this.players.push(new Player(this.players.length, user_id, first_name, last_name, wins, losses));
  return this.players.length - 1;
};

/**
 * removePlayer
 *
 * Adds a player with the indentifier user_id.
 * Throws an exception if the action is invalid.
 * @param   user_id  string   the public identifier for the player
 */
Game.prototype.removePlayer = function(user_id) {
  var player_id = this._translate(user_id);

  this.players[player_id].dead = true;
  for (var i in RESOURCE) this.players[player_id].resource_cards[RESOURCE[i]] = 0;
  for (var i in DEVELOPMENT) this.players[player_id].development_cards[DEVELOPMENT[i]] = 0;
  for (var i in DEVELOPMENT) this.players[player_id].pending_development_cards[DEVELOPMENT[i]] = 0;

  // if its his turn, change it.
  if (this.current_player == player_id) {
    this.current_phase = PHASE.DICE;
    this._nextPlayer();
  }

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
};

Game.prototype.gameover = function(winner) {
  var player_id = this._translate(winner);
  if (this.current_phase == PHASE.END)
    throw 'The game has already been ended!';

  // check if last one alive
  var undead = 0;
  for (var i = 0; i < this.players.length; i++) {
    if (!this.players[i].dead) {
      undead++;
    }
  }

  // might want to double check someone has 10 VP
  var win = this.players[player_id];
  var vp = win.victory_points;
  if (win.has_longest_road) vp += 2;
  if (win.has_largest_army) vp += 2;
  vp += win.victory_cards;

  if (vp < 10 && undead > 1)
    throw "This is not the winner!";
  this.current_phase = PHASE.END;
};

/**
  * endTurn
  *
  * Ends turn and moves to next player
  * @param   user_id    string   the user who wants to end their turn
  */
Game.prototype.endTurn = function(user_id) {
  var player_id = this._translate(user_id);
  this._validatePlayer(player_id);
  this._validatePhase(PHASE.MAIN);
  this._next();
}

/**
  * bankTrade
  *
  */
Game.prototype.tradeCards = function(offer, offerer) {
  for(var i = 0; i < offer['for'].length; i++) {
      this.players[offerer].resource_cards[RESOURCE_ARRAY[i]] += offer['for'][i];
  }
  for(var i = 0; i < offer['offer'].length; i++) {
      this.players[offerer].resource_cards[RESOURCE_ARRAY[i]] -= offer['offer'][i];
  }
};

Game.prototype.bankTrade = function(offer, offerer) {
  this._validatePhase(PHASE.MAIN);
  var offerer = this._translate(offerer);
  this._validatePlayer(offerer);
  this._validateBuild();
  this.can_build = false;
  var offer_total = 0;
  var for_total = 0;
  var offer_found = 0;
  var for_found = 0;
  var offer_type = -1;

  for(var i = 0; i < offer['for'].length; i++) {
      for_total += offer['for'][i];
      if (offer['for'][i] > 0) {
        for_found += 1;
      }
  }
  for(var i = 0; i < offer['offer'].length; i++) {
    // check this trade can be made
    if (this.players[offerer].resource_cards[RESOURCE_ARRAY[i]] < offer['offer'][i])
      throw "You cannot make this trade";
    offer_total += offer['offer'][i];
    if (offer['offer'][i] > 0) {
      offer_found += 1;
      offer_type = i;
    }
  }
  // check valid
  var ports = this.players[offerer].ports;
  if (offer_found !== 1 || for_found !== 1)
    throw 'Invalid Bank Trade';
  else if (offer_total === for_total * 4)
    this.tradeCards(offer, offerer);
  else if (ports.indexOf('Any31') !== -1 && offer_total === for_total*3)
    this.tradeCards(offer, offerer);
  else if (ports.indexOf(PORT_ARRAY[offer_type]) !== -1 && offer_total === for_total *2)
    this.tradeCards(offer, offerer);
  else
    throw 'Invalid Bank Trade';
}

/**
  * acceptTrade
  *
  */

Game.prototype.acceptTrade = function(offer, accepter, offerer) {
  var accepter = this._translate(accepter);
  offerer = this._translate(offerer);
  this._validateBuild();
  this.can_build = false
  for(var i = 0; i < offer['for'].length; i++) {
      if (this.players[accepter].resource_cards[RESOURCE_ARRAY[i]] < offer['for'][i])
        throw "You can't make this trade"
      this.players[accepter].resource_cards[RESOURCE_ARRAY[i]] -= offer['for'][i];
      this.players[offerer].resource_cards[RESOURCE_ARRAY[i]] += offer['for'][i];
  }
  for(var i = 0; i < offer['offer'].length; i++) {
      if (this.players[offerer].resource_cards[RESOURCE_ARRAY[i]] < offer['offer'][i])
        throw "You can't make this trade"
      this.players[accepter].resource_cards[RESOURCE_ARRAY[i]] += offer['offer'][i];
      this.players[offerer].resource_cards[RESOURCE_ARRAY[i]] -= offer['offer'][i];
  }
}

Game.prototype.remove = function(removedCards, player) {
  var player = this._translate(player);
  this._validatePhase(PHASE.REMOVE);
  for(var i = 0; i < removedCards.length; i++) {
      this.players[player].resource_cards[RESOURCE_ARRAY[i]] -= removedCards[i];
      console.log("Removing " + removedCards[i] + " of " + RESOURCE_ARRAY[i] + " player " + player);
  }
  this.steal_players--;
  this._next();
  if (this.steal_players === 0)
    return true;
  else
    return false;
}

/*****
  * updatePorts
  *
  * Updates the ports array for the given user_id after placing on intersection_id
  ****/
Game.prototype.updatePorts = function(user_id, intersection_id) {
  var player_id = this._translate(user_id);
  var intersection = this.board._getIntersection(intersection_id);
  var edges = intersection.eNeighbors(this.board);
  for (var edge in edges) {
    if (edges.hasOwnProperty(edge)) {
      e_port = edges[edge].port;
      console.log(e_port);
      if (e_port == null || e_port === PortTypeEnum.NONE)
        continue;
      if (this.players[player_id].ports.indexOf(e_port) === -1) {
        this.players[player_id].ports.push(e_port);
      }
    }
  }
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
  this.players[player_id].victory_points++;
  this.board.placeStartingSettlement(player_id, intersection_id);

  var is_second = 2 == this.board.getNumberOfSettlements(player_id);
  var resources = (is_second) ? this.board.getStartingResources(intersection_id) : {};
  var new_resources = {};
  var id = user_id;
  new_resources[id] = {'resources':resources, 'received':true};

  this._addResources(player_id, resources);
  this.updatePorts(user_id, intersection_id);
  this._next();

  return new_resources;
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
  this.updateLongestRoad();

  this._next();
};


/**
 * buildSettlement
 *
 * Builds a starting settlement at intersection_id for user_id
 * Throws an exception if the action is invalid.
 * @param   user_id           string   the user who wants to place a intersection
 * @param   intersection_id   num      the location to place the intersection
 */
Game.prototype.buildSettlement = function(user_id, intersection_id) {
  var player_id = this._translate(user_id);
  this._validatePlayer(player_id);
  this._validatePhase(PHASE.BUILD);
  if (!this.canBuildSettlement(user_id)) throw 'You are not able to build a settlement!';

  this.players[player_id].unbuilt_settlements--;
  this.players[player_id].victory_points++;
  this._subtractResources(player_id, SETTLEMENT_COST);
  this.board.buildSettlement(player_id, intersection_id);
  this.updateLongestRoad();
  this.updatePorts(user_id, intersection_id);
  this.current_phase = PHASE.MAIN;
};


/**
 * buildCity
 *
 * Builds a city at intersection_id for user_id
 * Throws an exception if the action is invalid.
 * @param   user_id           string   the user who wants to place a intersection
 * @param   intersection_id   num      the location to place the intersection
 */
Game.prototype.buildCity = function(user_id, intersection_id) {
  var player_id = this._translate(user_id);
  this._validatePlayer(player_id);
  this._validatePhase(PHASE.BUILD);
  if (!this.canBuildCity(user_id)) throw 'You are not able to build a city!';

  this.players[player_id].unbuilt_settlements++;
  this.players[player_id].unbuilt_cities--;
  this.players[player_id].victory_points++;
  this._subtractResources(player_id, CITY_COST);
  this.board.buildCity(player_id, intersection_id);
  this.current_phase = PHASE.MAIN;
};


/**
 * buildRoad
 *
 * Builds a road at edge_id for user_id
 * Throws an exception if the action is invalid.
 * @param   user_id   string   the user who wants to place a road
 * @param   edge_id   num      the location to place the road
 */
Game.prototype.buildRoad = function(user_id, edge_id) {
  var player_id = this._translate(user_id);
  this._validatePlayer(player_id);
  this._validatePhase(PHASE.BUILD);
  if (!this.canBuildRoad(user_id)) throw 'You are not able to build a road!';

  this.players[player_id].unbuilt_roads--;
  this._subtractResources(player_id, ROAD_COST);
  this.board.buildRoad(player_id, edge_id);
  this.updateLongestRoad();
  this.current_phase = PHASE.MAIN;
}

/**
 * buildDevelopment
 *
 * Builds a development for user_id
 * Throws an exception if the action is invalid.
 * @param   user_id   string   the user who wants to place a road
 */
Game.prototype.buildDevelopment = function(user_id) {
  var player_id = this._translate(user_id);
  this._validatePlayer(player_id);
  console.log("CAN_BUILD: " + this.can_build);
  this._validateBuild();
  this._validatePhase(PHASE.MAIN);
  if (!this.canBuildDevelopment(user_id)) throw 'You are not able to build a development!';
  this._subtractResources(player_id, DEVELOPMENT_COST);
  this.can_build = false;
  var card = this.development_cards.pop();
  if (card) {
    this.players[player_id].pending_development_cards[card]++;
    this.players[player_id].development_cards[card]++;
    if (VICTORY_CARDS.indexOf(card) != -1) this.players[player_id].victory_cards++;
  }
  return card;
}
Game.prototype.allowBuild = function() {
  console.log("ALLOWING BUILD");
  this.can_build = true;
}

Game.prototype.cancelBuild = function() {
  this._validatePhase(PHASE.BUILD);
  this.current_phase = PHASE.MAIN;
}

/**
 * playKnight
 *
 * Initiates a knight.
 * Throws an exception if the action is invalid.
 * @param   user_id           string   the user who wants to play the dev
 */
Game.prototype.playKnight = function(user_id) {
  var player_id = this._translate(user_id);
  this._validatePlayer(player_id);
  //this._validatePhase(PHASE.MAIN);
  if (!(this.players[player_id].development_cards[DEVELOPMENT.KNIGHT] -
        this.players[player_id].pending_development_cards[DEVELOPMENT.KNIGHT] > 0) ||
       this.players[player_id].played_development) {
    throw 'You are not able to play a knight!';
  }

  this.players[player_id].played_development = true;

  this.players[player_id].development_cards[DEVELOPMENT.KNIGHT]--;
  this.players[player_id].army_size++;

  this.current_phase = PHASE.KNIGHT;

  this.updateLargestArmy();
};


/**
 * playYearOfPlenty
 *
 * Initiates a year of plenty.
 * Throws an exception if the action is invalid.
 * @param   user_id           string   the user who wants to play the dev
 */
Game.prototype.playYearOfPlenty = function(user_id) {
  var player_id = this._translate(user_id);
  this._validatePlayer(player_id);
  this._validatePhase(PHASE.MAIN);
  if (!(this.players[player_id].development_cards[DEVELOPMENT.YEAR_OF_PLENTY] -
        this.players[player_id].pending_development_cards[DEVELOPMENT.YEAR_OF_PLENTY] > 0)||
       this.players[player_id].played_development) {
    throw 'You are not able to play a year of plenty!';
  }

  this.players[player_id].played_development = true;

  this.players[player_id].development_cards[DEVELOPMENT.YEAR_OF_PLENTY]--;

  this.current_phase = PHASE.YEAR_OF_PLENTY_FIRST;
};


/**
 * playYearOfPlentyFirst
 *
 * Initiates a year of plenty.
 * Throws an exception if the action is invalid.
 * @param   user_id           string   the user who wants to play the dev
 */
Game.prototype.playYearOfPlentyFirst = function(user_id, resource) {
  var player_id = this._translate(user_id);
  this._validatePlayer(player_id);
  this._validatePhase(PHASE.YEAR_OF_PLENTY_FIRST);

  this.players[player_id].resource_cards[resource]++;

  this.current_phase = PHASE.YEAR_OF_PLENTY_SECOND;
};


/**
 * playYearOfPlentySecond
 *
 * Initiates a year of plenty.
 * Throws an exception if the action is invalid.
 * @param   user_id           string   the user who wants to play the dev
 */
Game.prototype.playYearOfPlentySecond = function(user_id, resource) {
  var player_id = this._translate(user_id);
  this._validatePlayer(player_id);
  this._validatePhase(PHASE.YEAR_OF_PLENTY_SECOND);

  this.players[player_id].resource_cards[resource]++;

  this.current_phase = PHASE.MAIN;
};


/**
 * playRoadBuilding
 *
 * Initiates a road building
 * Throws an exception if the action is invalid.
 * @param   user_id           string   the user who wants to play the dev
 */
Game.prototype.playRoadBuilding = function(user_id) {
  var player_id = this._translate(user_id);
  this._validatePlayer(player_id);
  this._validatePhase(PHASE.MAIN);
  if (!(this.players[player_id].development_cards[DEVELOPMENT.ROAD_BUILDING] -
        this.players[player_id].pending_development_cards[DEVELOPMENT.ROAD_BUILDING] > 0) ||
       this.players[player_id].played_development) {
    throw 'You are not able to play a road building!';
  }

  this.players[player_id].played_development = true;

  this.players[player_id].development_cards[DEVELOPMENT.ROAD_BUILDING]--;

  this.current_phase = PHASE.ROAD_BUILDING_FIRST;
};


/**
 * playRoadBuildingFirst
 *
 * Throws an exception if the action is invalid.
 * @param   user_id           string   the user who wants to play the dev
 */
Game.prototype.playRoadBuildingFirst = function(user_id, edge_id) {
  var player_id = this._translate(user_id);
  this._validatePlayer(player_id);
  this._validatePhase(PHASE.ROAD_BUILDING_FIRST);

  this.players[player_id].unbuilt_roads--;
  this.board.buildRoad(player_id, edge_id);
  this.updateLongestRoad();

  this.current_phase = PHASE.ROAD_BUILDING_SECOND;
};


/**
 * playRoadBuildingSecond
 *
 * Throws an exception if the action is invalid.
 * @param   user_id           string   the user who wants to play the dev
 */
Game.prototype.playRoadBuildingSecond = function(user_id, edge_id) {
  var player_id = this._translate(user_id);
  this._validatePlayer(player_id);
  this._validatePhase(PHASE.ROAD_BUILDING_SECOND);

  this.players[player_id].unbuilt_roads--;
  this.board.buildRoad(player_id, edge_id);
  this.updateLongestRoad();

  this.current_phase = PHASE.MAIN;
};


/**
 * playMonopoly
 *
 * Initiates a monopoly
 * Throws an exception if the action is invalid.
 * @param   user_id           string   the user who wants to play the dev
 */
Game.prototype.playMonopoly = function(user_id) {
  var player_id = this._translate(user_id);
  this._validatePlayer(player_id);
  this._validatePhase(PHASE.MAIN);
  if (!(this.players[player_id].development_cards[DEVELOPMENT.MONOPOLY] -
        this.players[player_id].pending_development_cards[DEVELOPMENT.MONOPOLY] > 0) ||
       this.players[player_id].played_development) {
    throw 'You are not able to play a monopoly!';
  }

  this.players[player_id].played_development = true;

  this.players[player_id].development_cards[DEVELOPMENT.MONOPOLY]--;

  this.current_phase = PHASE.MONOPOLY;
};


/**
 * chooseMonopolyResource
 *
 * Gives all the resources of the type chosen to the user
 * Throws an exception if the action is invalid.
 * @param   user_id   string   the user who wants to play the dev
 * @param   resource  string   resource to hoard
 */
Game.prototype.chooseMonopolyResource = function(user_id, resource) {
  var player_id = this._translate(user_id);
  this._validatePlayer(player_id);
  this._validatePhase(PHASE.MONOPOLY);

  var sum = 0;
  for (var i = 0; i < this.players.length; i++) {
    sum += this.players[i].resource_cards[resource];
    this.players[i].resource_cards[resource] = 0;
  }
  this.players[player_id].resource_cards[resource] = sum;

  this.current_phase = PHASE.MAIN;
};


/**
 * removeCards
 *
 * Returns the player ids that need to remove cards after 7 rolls
 */
Game.prototype.removeCards = function() {
  this._validatePhase(PHASE.REMOVE);
  var remove_players = {};
  for (var i = 0; i < this.players.length; i++) {
    var cards = 0;
    for (var resource in this.players[i].resource_cards) {
      cards += this.players[i].resource_cards[resource];
    }
    console.log(cards);
    if (cards > 7) {
      remove_players[this.players[i].user_id] = Math.floor(cards/2);
      this.steal_players++;
    }
  }
  this._next();
  return remove_players;
}

/**
 * rollDice
 *
 * Rolls the dice and distrubutes resources.
 * Returns information that just occured in an object
 * @param   user_id   num   who rolls the dice
 */
Game.prototype.rollDice = function(user_id) {
  var player_id = this._translate(user_id);
  this._validatePlayer(player_id);
  this._validatePhase(PHASE.DICE);

  var dice = [Math.floor((Math.random()*6)+1), Math.floor((Math.random()*6)+1)];
  var total = dice[0] + dice[1];

  var resources = this.board.getResources(total);
  // Add resources to player hand
  for (var player in resources) {
    if (!this.players[player].dead) {
      this._addResources(player, resources[player]);
    }
  }

  // Construct return object
  var new_resources = {}
  for (var i = 0; i < this.players.length; i++) {
    if (i in resources) {
      new_resources[this.players[i].user_id] = {'resources':'', 'received':true};
      new_resources[this.players[i].user_id].resources = resources[i];
    }
  }
  this._next(total);
  return {'number': total, 'resources': new_resources, 'breakdown': dice};
};

/**
  * getRobber
  * get current location of the robber as hex id
  */
Game.prototype.getRobber = function() {
  return this.board._getRobber();
}
/**
 * updateRobber
 * moves the robber to new tile
 */
Game.prototype.updateRobber = function(user_id, move_id) {
  this._validatePhase(PHASE.ROBBER, PHASE.KNIGHT);

  var players = this.board.updateRobber(move_id);
  var me = this._translate(user_id);
  this._validatePlayer(me);

  if (players.indexOf(me) >= 0)
    players.splice(players.indexOf(me), 1) // take out me

  var player_names = this.getPlayers();
  for (var i = 0; i < players.length; i++) // translate to full player names
    players[i] = player_names[players[i]]
  var final_players = [];
  // remove players who have no cards to steal
  for (var i = 0; i < players.length; i++) {
    empty = true;
    for(var resource = 0; resource < RESOURCE_ARRAY.length; resource++) {
      if (this.players[i].resource_cards[RESOURCE_ARRAY[resource]] > 0) {
        empty = false;
        break;
      }
    }
    if (!empty) {
      final_players.push(players[i]);
    }
  }

  this._next();
  // skip steal phase if no one to steal from
  if (final_players.length === 0)
    this._next();
  return final_players
}

/**
 * steal
 * steals random resource from player to thief
 * Throws exception if invalid
 */
Game.prototype.steal = function(player_id) {
  this._validatePhase(PHASE.STEAL);
  var thief = this.whoseTurn();
  if (thief === player_id)
    throw "Can't steal from yourself";
  player_id = this._translate(player_id);
  thief = this._translate(thief);
  // substract random card from user
  var removed = false;
  while(!removed) {
    var random = Math.floor(Math.random()*RESOURCE_ARRAY.length);

    if (this.players[player_id].resource_cards[RESOURCE_ARRAY[random]] > 0) {
      this.players[player_id].resource_cards[RESOURCE_ARRAY[random]] -= 1;
      console.log("STEALING: " + RESOURCE_ARRAY[random]);
      this.players[thief].resource_cards[RESOURCE_ARRAY[random]] += 1;
      removed = true;
    }
  }

  this._next();
  return RESOURCE_ARRAY[random];
}
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
    console.log(game.placeStartingSettlement(player, settlement_choice));
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
    if (print) console.log('Player 0 Resources: ' + JSON.stringify(game.players[0].resource_cards));
    if (print) console.log('Player 1 Resources: ' + JSON.stringify(game.players[1].resource_cards));
    if (print) console.log('Player 2 Resources: ' + JSON.stringify(game.players[2].resource_cards));
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

  console.log(game.getValidSettlementIntersections(USER_IDS[2]));
  console.log(game.getValidCityIntersections(USER_IDS[2]));
  console.log(game.getValidRoadEdges(USER_IDS[2]));

  console.log(game);
};

if (require.main === module) main();
else module.exports = Game;

/**
 * Board.js
 *
 * JS Object representing a board.
 */


// IMPORT / EXPORT
var Hex = require("./Hex");
var Intersection = require("./Intersection");
var Edge = require("./Edge");
module.exports = Board;

// Constants

var TOKEN = {
  SETTLEMENT: 'Settlement',
  CITY: 'City',
  ROAD: 'Road',
};

// Helper Objects

function Token(player, type) {
  this.player = player;
  this.type = type;
};

// THE PRIMARY FUNCTION
function Board(mn, mx) {
    this.min = 3;
    this.max = 5;

    if (arguments.length > 1)
    {
        if (mx < mn)
            throw "Min must be less than max! What the hell, bro?!"

        this.min = mn;
        this.max = mx;
    }

    if (this.numTiles() < 19)
        throw "Board too small! Must be at least 19 tiles."

    // Hex.js construction work
    this.instantiateHexes();
    this.activateHexes();
    this.populateHexes();
    this.numerateHexes();

    this.instantiateInters();

    this.instantiateEdges();
    this.assignPorts();
}


/*  ================
    >> Properties <<
    ================  */

// props
Board.prototype = {
  width: function() { return 2*(this.max - this.min) + 1; },
  midCol: function() { return this.max - this.min; },
  colDelta: function(c) { return Math.abs( c - this.midCol() ); },
  colHeight: function(c) { return this.max - this.colDelta(c); },
  isUpCol: function(c) { return this.colDelta(c) % 2 == 0; },
  startsUp: function() { return this.isUpCol(0); },
  numTiles: function() { return this.max*this.max - this.min*this.min + this.min; },
  root: function() { return this.hexes[ this.midCol() ][0]; },

  json: function() { return JSON.stringify(this); },
  prettyprint: function() { return JSON.stringify(this,null,4); },
}

Board.prototype.numResourceTiles = function() {
    var num = 0;
    for (var i = 0; i < this.hexes.length; i++) // for each hex
        for (var j = 0; j < this.hexes[i].length; j++)
            if ( this.hexes[i][j].isResource() )
                num++;
    return num;
}

/**
 * _getIntersection (private)
 *
 * Return the Intersection object with the specified `id`
 * @param   id   num      the id of the intersection you want
 * @return       object   the Intersection object you want
 */
Board.prototype._getIntersection = function(id) {
  for (var i = 0; i < this.inters.length; i++) {
    for (var j = 0; j < this.inters[i].length; j++) {
      if (this.inters[i][j].id == id) return this.inters[i][j];
    }
  }
  return null; // an exception might be justified here
};


/**
 * _getEdge (private)
 *
 * Return the Edge object with the specified `id`
 * @param   id   num      the id of the edge you want
 * @return       object   the Edge object you want
 */
Board.prototype._getEdge = function(id) {
  var edges = this.allEdges();
  for (var i = 0; i < edges.length; i++) {
    if (edges[i].id == id) return edges[i];
  }
  return null; // an exception might be justified here
};


/**
 * _getHex (private)
 *
 * Return the Hex object with the specified `id`
 * @param   id   num      the id of the hex you want
 * @return       object   the Hex object you want
 */
Board.prototype._getHex = function(id) {
  for (var i = 0; i < this.hexes.length; i++) {
    for (var j = 0; j < this.hexes[i].length; j++) {
      if (this.hexes[i][j].id == id) return this.hexes[i][j].id;
    }
  }
  return null; // an exception might be justified here
};


/*  ==============
    >> Edge Basics
    ==============  */

Board.prototype.instantiateEdges = function()
{
    // (w) -x- (M + 1)
    this.horizEdges = new Array( this.width() );
    for (var i = 0; i < this.horizEdges.length; i++)
    {
        this.horizEdges[i] = new Array(this.max + 1);
        for (var j = 0; j < this.horizEdges[i].length; j++)
            this.horizEdges[i][j] = new Edge(i, j, EdgeTypeEnum.HORIZONTAL); // "horiz"
    }

    // (w + 1) -x- (2M + 1)
    this.diagEdges = new Array( this.width() + 1 );
    for (var i = 0; i < this.diagEdges.length; i++)
    {
        this.diagEdges[i] = new Array(2*this.max + 1);
        for (var j = 0; j < this.diagEdges[i].length; j++)
            this.diagEdges[i][j] = new Edge(i, j, EdgeTypeEnum.DIAGONAL); // "diag"
    }
}

Board.prototype.allEdges = function()
{
    var arr = new Array();

    for (var i = 0; i < this.horizEdges.length; i++)
        for (var j = 0; j < this.horizEdges[i].length; j++)
            arr.push( this.horizEdges[i][j] );

    for (var i = 0; i < this.diagEdges.length; i++)
        for (var j = 0; j < this.diagEdges[i].length; j++)
            arr.push( this.diagEdges[i][j] );

    return arr;
}

Board.prototype.assignPorts = function()
{
    var numCoasts = 0;

    var allEdges = this.allEdges();
    for (var i = 0; i < allEdges.length; i++)
        numCoasts += allEdges[i].isCoastal(this);

    var numPorts = Math.floor(numCoasts / 3) - 1;
    var ports = this.generatePortArray(numPorts, numCoasts);

    do {
        ports.shuffle();
        var k = 0;
        for (var i = 0; i < allEdges.length; i++)
            if (allEdges[i].isCoastal(this))
                allEdges[i].port = ports[k++];
    } while (!this.hasValidPorts());
}

Board.prototype.generatePortArray = function(numPorts, numCoasts)
{
    var ports = [PortTypeEnum.SHEEP_2_1,
                 PortTypeEnum.WOOD_2_1,
                 PortTypeEnum.WHEAT_2_1,
                 PortTypeEnum.STONE_2_1,
                 PortTypeEnum.BRICK_2_1];
    for (var i = 0; i < 5; i++)
        ports.push(PortTypeEnum.ANY_3_1);

    while (ports.length < numPorts)
        ports = ports.concat(ports);
    ports = ports.slice(0, numPorts);

    while (ports.length < numCoasts)
        ports.push(PortTypeEnum.NONE);

    return ports;
}

Board.prototype.hasValidPorts = function(minRadius)
{
    minRad = 1;
    if (arguments.length > 0) minRad = minRadius;

    var allEdges = this.allEdges();
    for (var i = 0; i < allEdges.length; i++)
    {
        var edge = allEdges[i];
        if (edge.hasNoPort()) continue;

        var eNbors = edge.eNeighborsWithinRad(minRad, this);
        eNbors = eNbors.slice(1); // remove self

        for (var e = 0; e < eNbors.length; e++)
            if ( !eNbors[e].hasNoPort() )
                return false;
    }

    return true;
}

/*  ======================
    >> Intersection Basics
    ======================  */

Board.prototype.instantiateInters = function()
{
    // (w + 1) -x- (2M + 2)
    this.inters = new Array(this.width() + 1);
    for (var i = 0; i < this.inters.length; i++)
    {
        this.inters[i] = new Array(2*this.max + 2);
        for (var j = 0; j < this.inters[i].length; j++)
            this.inters[i][j] = new Intersection(i,j);
    }
}

/*  ================
    >> Hex Basics <<
    ================  */


Board.prototype.instantiateHexes = function()
{
    // (w) -x- (M)
    this.hexes = new Array(this.width()); // array of hex columns
    for (var i = 0; i < this.hexes.length; i++) { // for each column
        this.hexes[i] = new Array(this.max) // array of hexes
        for (var j = 0; j < this.hexes[i].length; j++) // for each hex
            this.hexes[i][j] = new Hex(i,j); // new hex
    }
}

// set only the hexagon as active
Board.prototype.activateHexes = function()
{
    // set all as active
    for (var i = 0; i < this.width(); i++)
        for (var j = 0; j < this.max; j++)
            this.hexes[i][j].type = HEX_TYPE.ACTIVE;

    // deactivate from bottom/top
    for (var i = 0; i < this.width(); i++)
    {
        var numActive = this.max;
        var top = -1, bot = this.max-1;
        while ( numActive > this.colHeight(i) )
        {
            if ( this.hexes[i][bot].type == HEX_TYPE.ACTIVE ) {
                this.hexes[i][bot].type = HEX_TYPE.INACTIVE;
                top++;
            }
            else {
                this.hexes[i][top].type = HEX_TYPE.INACTIVE;
                bot--;
            }
            numActive--;
        }
    }
}

// assign resources to tiles
Board.prototype.populateHexes = function()
{
    // resource frequencies
    var resources = [HEX_TYPE.FOREST, HEX_TYPE.PASTURE, HEX_TYPE.FIELD,
                     HEX_TYPE.MOUNTAIN, HEX_TYPE.HILL];
    resources = resources.concat(resources);
    resources.push(HEX_TYPE.DESERT);

    // build array of resources
    var arr = new Array();
    while (arr.length < this.numTiles())
        arr = arr.concat(resources);
    arr = arr.slice(0, this.numTiles() ); // clamp

    // randomize
    arr.shuffle();

    // assign
    var k = 0;
    for (var i = 0; i < this.hexes.length; i++) // for each hex
        for (var j = 0; j < this.hexes[i].length; j++)
            if ( this.hexes[i][j].isActive() ) { // if active
                this.hexes[i][j].type = arr[k++]; // assign next
		if(this.hexes[i][j].type == HEX_TYPE.DESERT)
                  this.hexes[i][j].robber = true; // assign initial robber
            }
}

/*  =====================
    >> Numbering Hexes <<
    =====================  */

Board.prototype.numerateHexes = function()
{
    arr = this.generateDiceRollArray();

    do {
        this.assignDiceRolls(arr);
    } while ( !this.hasValidDiceRolls() );
}

Board.prototype.generateDiceRollArray = function()
{
    // dice roll distribution
    var startRolls = [2, 3,3, 4,4, 5,5, 6,6, 8,8, 9,9, 10,10, 11,11, 12]
    var extraRolls = [10, 4, 9, 5, 11, 3, 8, 6, 12, 2]

    // build array of dice rolls
    var arr = startRolls;
    while ( arr.length < this.numResourceTiles() )
        arr = arr.concat(extraRolls);
    arr = arr.slice(0, this.numResourceTiles() ); // clamp

    return arr;
}

Board.prototype.assignDiceRolls = function(arr)
{
    // randomize
    arr.shuffle();

    // assign
    var k = 0;
    for (var i = 0; i < this.hexes.length; i++) // for each hex
        for (var j = 0; j < this.hexes[i].length; j++)
            if ( this.hexes[i][j].isResource() ) // if active
                this.hexes[i][j].diceRoll = arr[k++]; // assign next
}

Board.prototype.hasValidDiceRolls = function()
{
    for (var i = 0; i < this.hexes.length; i++) // for each hex
        for (var j = 0; j < this.hexes[i].length; j++)
        {
            if (this.hexes[i][j].diceRoll != 6 && this.hexes[i][j].diceRoll != 8)
                continue;

            var nbors = this.hexes[i][j].hNeighbors(this);
            for (n in nbors)
                if (nbors[n].diceRoll == 6 || nbors[n].diceRoll == 8)
                    return false;
        }

    return true;
}

/*  ==================
    >> Array add-on <<
    ==================  */

// taken from: hardcode.nl/subcategory_1/article_317-array-shuffle-function
Array.prototype.shuffle = function() {
 	var len = this.length;
	var i = len;
    while (i--) {
	 	var p = parseInt(Math.random()*len);
		var t = this[i];
        this[i] = this[p];
        this[p] = t;
 	}
};

/*  =====================
    >> convert to JSON <<
    =====================  */

Board.prototype.makeHexObj = function(hex)
{
    var hexObj = new Object();
    // basics
    hexObj.index = hex.id;
    hexObj.grid = { 'x':hex.i, 'y':hex.j };
    hexObj.type = hex.type;
    hexObj.number = hex.diceRoll;

    // iNeighbors
    hexObj.intersections = new Object();
    var nbors = hex.iNeighbors(this);
    for (n in nbors)
        hexObj.intersections[n] = nbors[n].id;

    // eNeighbors
    hexObj.edges = new Object();
    nbors = hex.eNeighbors(this);
    for (n in nbors)
        hexObj.edges[n] = nbors[n].id;

    return hexObj;
}

Board.prototype.makeInterObj = function(inter)
{
    var interObj = new Object();

    // basics
    interObj.index = inter.id;
    interObj.token = inter.token;
    interObj.isActive = inter.isActive(this);

    // hNeighbors
    interObj.hexes = new Object();
    var nbors = inter.hNeighbors(this);
    for (n in nbors)
        interObj.hexes[n] = nbors[n].id;

    // eNeighbors
    interObj.edges = new Object();
    var nbors = inter.eNeighbors(this);
    for (n in nbors)
        interObj.edges[n] = nbors[n].id;

    return interObj;
}

Board.prototype.makeEdgeObj = function(edge)
{
    var edgeObj = new Object();

    // basics
    edgeObj.index = edge.id;
    edgeObj.token = edge.token;
    edgeObj.port = edge.port;
    edgeObj.isActive = edge.isActive(this);

    // hNeighbors
    edgeObj.hexes = new Object(); // repetitive; shrink down
    var nbors = edge.hNeighbors(this);
    for (n in nbors)
        edgeObj.hexes[n] = nbors[n].id;

    // iNeighbors
    edgeObj.intersections = new Object(); // repetitive; shrink down
    var nbors = edge.iNeighbors(this);
    for (n in nbors)
        edgeObj.intersections[n] = nbors[n].id;

    return edgeObj;
}

Board.prototype.json2 = function() {
    var obj = new Object();

    // board basics
    obj.gridWidth = this.width();
    obj.gridHeight = this.max;
    obj.startsUp = this.isUpCol(0);  //obj.gridWidth%4 == 1;

    // assign hex IDs
    var k = 0;
    for (var i = 0; i < this.hexes.length; i++) // for each hex
        for (var j = 0; j < this.hexes[i].length; j++)
            this.hexes[i][j].id = k++;
    var numHexes = k;

    // assign intersection IDs
    k = 0;
    for (var i = 0; i < this.inters.length; i++)
        for (var j = 0; j < this.inters[i].length; j++)
            this.inters[i][j].id = k++;
    var numInters = k;

    // assign edge IDs
    k = 0;
    var allEdges = this.allEdges();
    for (var i = 0; i < allEdges.length; i++)
        allEdges[i].id = k++;
    var numEdges = k;

    // populate hexes array
    obj.hexes = new Array(numHexes);
    for (var i = 0; i < this.hexes.length; i++) // for each hex
        for (var j = 0; j < this.hexes[i].length; j++) {
            var hex = this.hexes[i][j];
            obj.hexes[ hex.id ] = this.makeHexObj( hex );
        }

    // populate intersections array
    obj.intersections = new Array(numInters);
    for (var i = 0; i < this.inters.length; i++)
        for (var j = 0; j < this.inters[i].length; j++) {
            var inter = this.inters[i][j];
            obj.intersections[ inter.id ] = this.makeInterObj( inter );
        }

    // populate edges array
    obj.edges = new Array(numEdges);
    for (var i = 0; i < allEdges.length; i++)
        obj.edges[ allEdges[i].id ] = this.makeEdgeObj( allEdges[i] );

    return obj;
}

Board.prototype.prettyprint2 = function() {
    return JSON.stringify(this.json2(), null, 4);
}


/**
 * Public Interface
 */


/**
 * getValidStartingSettlementIntersections
 *
 * Returns the intersection ids of the all the valid places
 * a settlement can be built for the player with `player_id`
 *
 * @param  player_id  num    the id of the player
 * @return            array  the array of ids (nums)
 */
Board.prototype.getValidStartingSettlementIntersections = function(player_id) {
  var intersection_ids = [];

  // For every intersection
  for (var i = 0; i < this.inters.length; i++) {
    for (var j = 0; j < this.inters[i].length; j++) {
      var intersection = this.inters[i][j];

      // Check that it's active
      if (!intersection.isActive(this)) continue;

      // Check that there is nothing on it
      if (intersection.token) continue;

      // Check that there are no settlements 1 edge away
      var can_build = true;
      var neighbors  = intersection.iNeighbors(this);
      for (var dir in neighbors) {
        can_build = can_build && !neighbors[dir].token;
      }

      if (can_build) intersection_ids.push(intersection.id);
    }
  }

  return intersection_ids;
};


/**
 * placeStartingSettlement
 *
 * Places a starting settlement at intersection_id for player_id
 * Throws an exception if the action is invalid.
 * @param   player_id         string   the player who wants to place a intersection
 * @param   intersection_id   num      the location to place the intersection
 */
Board.prototype.placeStartingSettlement = function(player_id, intersection_id) {
  var valid_ids = this.getValidStartingSettlementIntersections(player_id);
  if (valid_ids.indexOf(intersection_id) == -1) {
    throw 'Intersection Id ' + intersection_id + ' is not a valid location to build.'
  }

  var intersection = this._getIntersection(intersection_id);
  intersection.token = new Token(player_id, TOKEN.SETTLEMENT);
}

/**
 * getRobber
 * returns hex id of the robber tile
 *
 */
Board.prototype._getRobber = function() {
 for (var i = 0; i < this.hexes.length; i++) {
    for (var j = 0; j < this.hexes[i].length; j++) {
      var hex = this.hexes[i][j];
      if (hex.robber) {
        return hex.id;
      }
    }
  }
  return null; // this should never be called
}

/**
 * updateRobber
 *
 * Moves robber from start to end
 * Throws exception is start does not have robber on it.
 * @param  end	num  the hex id of the hex robber should be moved to
 */
Board.prototype.updateRobber = function(end) {
  var start_hex = this._getRobber();
  var end_hex = this._getHex(end);
  var players = [];
  if (start_hex == end_hex) {
    throw 'Robber already placed on hex ' + end + '.';
  }
 for (var i = 0; i < this.hexes.length; i++) {
    for (var j = 0; j < this.hexes[i].length; j++) {
      var hex = this.hexes[i][j];
      if (hex.id === start_hex) {
        this.hexes[i][j].robber = false;
      }
      if(hex.id === end_hex) {
        // get players able to steal from
        this.hexes[i][j].robber = true;
        var intersections = hex.iNeighbors(this);
        for (var dir in intersections) {
          var intersection = intersections[dir];
          // Check that it has token, whether its a settlement or a city
          if (intersection.token) {
            var player = intersection.token.player;
            if(!(player in players))
              players.push(player);
          }
        }
      }
    }
  }
  return players;
}


/**
 * getValidStartingRoadEdges
 *
 * Returns the edge ids of the all the valid places
 * a road can be built for the player with `player_id`
 *
 * @param  player_id  num    the id of the player
 * @return            array  the array of ids (nums)
 */
Board.prototype.getValidStartingRoadEdges = function(player_id) {
  var edge_ids = [];

  // Get the location of the settlement without a player road
  for (var i = 0; i < this.inters.length; i++) {
    for (var j = 0; j < this.inters[i].length; j++) {
      var intersection = this.inters[i][j];

      // Find the intersection with the players settlement
      if (intersection.isActive(this) &&
          intersection.token &&
          intersection.token.player == player_id) {

        // Check to see if the settlement has player roads attached
        var can_build = true;
        var edges  = intersection.eNeighbors(this);
        for (var dir in edges) {
          if (edges[dir].token) { // guarunteed edges[dir].token.player === player_id
            can_build = false;
          }
        }

        // Add the edges where the player can build
        if (can_build) {
          for (var dir in edges) {
            if (edges[dir].isActive(this)) edge_ids.push(edges[dir].id);
          }
        }
      }

    }
  }

  return edge_ids;
};


/**
 * placeStartingRoad
 *
 * Places a starting road at edge_id for player_id
 * Throws an exception if the action is invalid.
 * @param   plauer_id   string   the player who wants to place a road
 * @param   edge_id     num      the location to place the road
 */
Board.prototype.placeStartingRoad = function(player_id, edge_id) {
  var valid_ids = this.getValidStartingRoadEdges(player_id);
  if (valid_ids.indexOf(edge_id) == -1) {
    throw 'Edge Id ' + edge_id + ' is not a valid location to build.'
  }

  var edge = this._getEdge(edge_id);
  edge.token = new Token(player_id, TOKEN.ROAD);
}


/**
 * getValidSettlementIntersections
 *
 * Returns the intersection ids of the all the valid places
 * a settlement can be built for the player with `player_id`
 *
 * @param  player_id  num    the id of the player
 * @return            array  the array of ids (nums)
 */
Board.prototype.getValidSettlementIntersections = function(player_id) {
  var intersection_ids = [];

  // For every intersection
  for (var i = 0; i < this.inters.length; i++) {
    for (var j = 0; j < this.inters[i].length; j++) {
      var intersection = this.inters[i][j];

      // Check that it's active and there is nothing on it
      if (!intersection.isActive(this) || intersection.token) continue;

      // Check that there are no settlements or cities 1 edge away
      var can_build = true;
      var neighbors  = intersection.iNeighbors(this);
      for (var dir in neighbors) {
        can_build = can_build && !neighbors[dir].token;
      }
      if (!can_build) continue;

      // At least one of player_id's roads leads to this intersection
      // TODO: Check that the road is not cut off from a settlement
      can_build = false;
      var edges  = intersection.eNeighbors(this);
      for (var dir in edges) {
        if (edges[dir].token && edges[dir].token.player == player_id) {
          can_build = true;
        }
      }

      if (can_build) intersection_ids.push(intersection.id);
    }
  }

  return intersection_ids;
};


/**
 * getValidCityIntersections
 *
 * Returns the intersection ids of the all the valid places
 * a city can be built for the player with `player_id`
 *
 * @param  player_id  num    the id of the player
 * @return            array  the array of ids (nums)
 */
Board.prototype.getValidCityIntersections = function(player_id) {
  var intersection_ids = [];

  // For every intersection
  for (var i = 0; i < this.inters.length; i++) {
    for (var j = 0; j < this.inters[i].length; j++) {
      var intersection = this.inters[i][j];
      // Check that it is:
      if (intersection.isActive(this) &&                 // active
          intersection.token &&                          // has a token
          intersection.token.type == TOKEN.SETTLEMENT && // is a settlement
          intersection.token.player == player_id ) {     // is the player's
        intersection_ids.push(intersection.id);
      }
    }
  }

  return intersection_ids;
};


/**
 * getValidRoadEdges
 *
 * Returns the edge ids of the all the valid places
 * a road can be built for the player with `player_id`
 *
 * @param  player_id  num    the id of the player
 * @return            array  the array of ids (nums)
 */
Board.prototype.getValidRoadEdges = function(player_id) {
  var edge_ids = [];

  var edges = this.allEdges();
  for (var i = 0; i < edges.length; i++) {

    // Check that it's active and there is nothing on it
    if (!edges[i].isActive(this) && edges[i].token) continue;


    // At least one of player_id's roads leads to this road
    // TODO: Check that the road is not cut off from a settlement
    var can_build = false;
    var neighbors  = edges[i].eNeighbors(this);
    for (var dir in neighbors) {
      var edge = neighbors[dir];
      can_build = can_build || (edge.token && edge.token.player == player_id);
    }

    if (can_build) edge_ids.push(edges[i].id);
  }

  return edge_ids;
};


/**
 * buildSettlement
 *
 * Builds a settlement at intersection_id for player_id
 * Throws an exception if the action is invalid.
 * @param   player_id         string   the player who wants to place a intersection
 * @param   intersection_id   num      the location to place the intersection
 */
Board.prototype.buildSettlement = function(player_id, intersection_id) {
  var valid_ids = this.getValidSettlementIntersections(player_id);
  if (valid_ids.indexOf(intersection_id) == -1) {
    throw 'Intersection Id ' + intersection_id + ' is not a valid location to build.'
  }

  var intersection = this._getIntersection(intersection_id);
  intersection.token = new Token(player_id, TOKEN.SETTLEMENT);
};


/**
 * buildCity
 *
 * Builds a city at intersection_id for player_id
 * Throws an exception if the action is invalid.
 * @param   player_id         string   the player who wants to place a intersection
 * @param   intersection_id   num      the location to place the intersection
 */
Board.prototype.buildCity = function(player_id, intersection_id) {
  var valid_ids = this.getValidCityIntersections(player_id);
  if (valid_ids.indexOf(intersection_id) == -1) {
    throw 'Intersection Id ' + intersection_id + ' is not a valid location to build.'
  }

  var intersection = this._getIntersection(intersection_id);
  intersection.token = new Token(player_id, TOKEN.CITY);
};


/**
 * buildRoad
 *
 * Builds a road at edge_id for player_id
 * Throws an exception if the action is invalid.
 * @param   plauer_id   string   the player who wants to place a road
 * @param   edge_id     num      the location to place the road
 */
Board.prototype.buildRoad = function(player_id, edge_id) {
  var valid_ids = this.getValidRoadEdges(player_id);
  if (valid_ids.indexOf(edge_id) == -1) {
    throw 'Edge Id ' + edge_id + ' is not a valid location to build.'
  }

  var edge = this._getEdge(edge_id);
  edge.token = new Token(player_id, TOKEN.ROAD);
};


/**
 * getNumberOfSettlements
 *
 * Get the number of settlements a player has on the board
 * @param   player_id   num   the player to check
 * @return              num   the number of settlements the user has
 */
Board.prototype.getNumberOfSettlements = function(player_id) {
  var num = 0;

  // For every intersection
  for (var i = 0; i < this.inters.length; i++) {
    for (var j = 0; j < this.inters[i].length; j++) {
      var intersection = this.inters[i][j];

      // Check that it's active, has token, is settlement, is player's
      if (intersection.isActive(this) &&
          intersection.token &&
          intersection.token.type == 'Settlement' &&
          intersection.token.player == player_id) {
        num++;
      }

    }
  }

  return num;
}


/**
 * getResources
 *
 * Return an object with the arrays of resourses the players would get
 * @param   number   num     the number to check
 * @return           object  keys:   player ids
 *                           values: array of resourses each player
 */
Board.prototype.getResources = function(number) {
  var resources = {};

  // For every intersection
  for (var i = 0; i < this.hexes.length; i++) {
    for (var j = 0; j < this.hexes[i].length; j++) {
      var hex = this.hexes[i][j];
      if (hex.isActive(this) && hex.diceRoll == number && !hex.robber) {
        var intersections = hex.iNeighbors(this);
        for (var dir in intersections) {
          var intersection = intersections[dir];
          var resource = HEX_TYPE_TO_RESOURCE[hex.type];

          // Check that it has token, whether its a settlement or a city
          if (intersection.token) {
            var player = intersection.token.player;

            // Initialize Player
            if (!(player in resources)) {
              resources[player] = {};
            }

            // Initialize Resource
            if (!(resource in resources[player])) {
              resources[player][resource] = 0;
            }

            // Add one resource
            if (intersection.token.type == TOKEN.SETTLEMENT) {
              resources[player][resource] += 1;
            }

            // Add two resources
            if (intersection.token.type == TOKEN.CITY) {
              resources[player][resource] += 2;
            }

          }
        }
      }
    }
  }

  return resources;
};


/**
 * getStartingResources
 *
 * Return an object with the arrays of resourses the players would get
 * @param   intersection_id   num      the intersection with the settlement
 * @return                    object   resourses amounts
 */
Board.prototype.getStartingResources = function(intersection_id) {
  var resources = {};

  var intersection = this._getIntersection(intersection_id);
  var hexes = intersection.hNeighbors(this);
  for (var direction in hexes) {
    if (hexes[direction].isResource()) {
      var resource = HEX_TYPE_TO_RESOURCE[hexes[direction].type];

      // Initialize Resource
      if (!(resource in resources)) {
        resources[resource] = 0;
      }

      // Add one resource
      resources[resource] += 1;
    }
  }

  return resources;
};

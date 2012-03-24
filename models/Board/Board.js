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
            this.hexes[i][j].type = HexTypeEnum.ACTIVE;

    // deactivate from bottom/top
    for (var i = 0; i < this.width(); i++)
    {
        var numActive = this.max;
        var top = -1, bot = this.max-1;
        while ( numActive > this.colHeight(i) )
        {
            if ( this.hexes[i][bot].type == HexTypeEnum.ACTIVE ) {
                this.hexes[i][bot].type = HexTypeEnum.INACTIVE;
                top++;
            }
            else {
                this.hexes[i][top].type = HexTypeEnum.INACTIVE;
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
    var resources = [HexTypeEnum.WOOD, HexTypeEnum.SHEEP, HexTypeEnum.WHEAT,
                     HexTypeEnum.STONE, HexTypeEnum.BRICK];
    resources = resources.concat(resources);
    resources.push(HexTypeEnum.DESERT);

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
            if ( this.hexes[i][j].isActive() ) // if active
                this.hexes[i][j].type = arr[k++]; // assign next
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
    
    // neighbors
    hexObj.intersections = new Object();
    var nbors = hex.iNeighbors(this);
    for (n in nbors) {
        var a = nbors[n];
        var u = a[0], v = a[1];
        hexObj.intersections[n] = this.inters[u][v].id;
    }
    
    hexObj.edges = new Array();
    
    return hexObj;
}

Board.prototype.makeInterObj = function(inter)
{
    var interObj = new Object();
    
    interObj.index = inter.id;
    interObj.token = inter.token;
    
    interObj.hexes = new Object();
    var nbors = inter.hNeighbors(this);
    for (n in nbors) {
        var a = nbors[n];
        var u = a.i, v = a.j;
        interObj.hexes[n] = this.hexes[u][v].id;
    }
    
    interObj.edges = new Array();
    return interObj;
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
    
    obj.edges = new Array();
    
    return obj;
}

Board.prototype.prettyprint2 = function() {
    var obj = JSON.parse(this.json2());
    return JSON.stringify(obj, null, 4);
}


/**
 * Board.js
 *
 * JS Object representing a board.
 */


// IMPORT / EXPORT
var Hex = require("./Hex");
module.exports = Board;

// THE PRIMARY FUNCTION
function Board(mn, mx) {
    this.min = 3;
    this.max = 5;

    if (arguments.length > 1)
    {
        this.min = mn;
        this.max = mx;
    }
    
    if (this.numTiles() < 19)
        throw "Board too small! Must be at least 19 tiles."
        
    // construction work
    this.instantiateHexes();
    this.activateHexes();
    this.populateHexes();
    this.numerateHexes();
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
  isOddCol: function(c) { return this.colDelta(c) % 2 == 0; },
  numTiles: function() { return this.max*this.max - this.min*this.min + this.min; },
  
  json: function() { return JSON.stringify(this); },
  root: function() { return this.hexes[ this.midCol() ][0]; },
}

Board.prototype.numResourceTiles = function() {
    var num = 0;
    for (var i = 0; i < this.hexes.length; i++) // for each hex
        for (var j = 0; j < this.hexes[i].length; j++)
            if ( this.hexes[i][j].isResource() )
                num++;
    return num;
}

/*  ================= 
    >> Tile Basics <<
    =================  */


Board.prototype.instantiateHexes = function()
{
    this.hexes = new Array(this.width()); // array of hex columns
    for (var i = 0; i < this.width(); i++) { // for each column
        this.hexes[i] = new Array(this.max) // array of hexes
        for (var j = 0; j < this.max; j++) // for each hex
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

/*  ================== 
    >> Number Tiles <<
    ==================  */

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
        for (var j = 0; j < this.hexes[i].length; j++) {
            if (this.hexes[i][j].diceRoll != 6 && this.hexes[i][j].diceRoll != 8)
                continue;
            var arr = this.hexes[i][j].hexNbors(this);
            for (var a = 0; a < arr.length; a++) {
                var u = arr[a][0], v = arr[a][1];
                if (this.hexes[u][v].diceRoll == 6 || this.hexes[u][v].diceRoll == 8)
                    return false;
            }
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


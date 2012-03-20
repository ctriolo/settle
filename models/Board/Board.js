
var hex_h = require("./Hex");

exports.Board = function (mn, mx) {
    this.min = 3;
    this.max = 5;
    
    if (arguments.length > 1)
    {
        this.min = mn;
        this.max = mx;
    }
        
    // construction work
    this.instantiateHexes();
    this.activateHexes();
    this.populateHexes();
}

// properties
exports.Board.prototype.width = function() { return 2*(this.max - this.min) + 1; }
exports.Board.prototype.midCol = function() { return this.max - this.min; }
exports.Board.prototype.colDelta = function(c) { return Math.abs( c - this.midCol() ); }
exports.Board.prototype.colHeight = function(c) { return this.max - this.colDelta(c); }
exports.Board.prototype.numTiles = function() 
    { return this.max*this.max - this.min*this.min + this.min; }
exports.Board.prototype.json = function() { return JSON.stringify(this); }
exports.Board.prototype.root = function() { return this.hexes[ this.midCol() ][0]; }
// ^^ ANY IDEA HOW TO MAKE THIS LESS VERBOSE ?!?!?!?!?!?!?!?!

exports.Board.prototype.instantiateHexes = function() 
{
    this.hexes = new Array(this.width()); // array of hex columns
    for (var i = 0; i < this.width(); i++) { // for each column
        this.hexes[i] = new Array(this.max) // array of hexes
        for (var j = 0; j < this.max; j++) // for each hex
            this.hexes[i][j] = new hex_h.Hex(i,j); // new hex
    }
}

// set only the hexagon as active
exports.Board.prototype.activateHexes = function() 
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
exports.Board.prototype.populateHexes = function()
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

// taken from: <hardcode.nl/subcategory_1/article_317-array-shuffle-function>
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

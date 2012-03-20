
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
}

// properties
exports.Board.prototype.width = function() { return 2*(this.max - this.min) + 1; }
exports.Board.prototype.midCol = function() { return this.max - this.min; }
exports.Board.prototype.colDelta = function(c) { return Math.abs( c - this.midCol() ); }
exports.Board.prototype.colHeight = function(c) { return this.max - this.colDelta(c); }
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


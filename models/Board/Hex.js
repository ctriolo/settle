/**
 * Hex.js
 *
 * JS Object that represents a tile in the game.
 */

// IMPORT / EXPORT
require("./Globals")
module.exports = Hex;

// THE PRIMARY FUNCTION
function Hex(i, j)
{
    this.j = this.i = -1; // board coordinates
    if (arguments.length > 1) {
        this.i = i;
        this.j = j;
    }

    this.diceRoll = 0; // dice roll number
    this.type = HexTypeEnum.INACTIVE; // type (i.e. resource)
};

// PROPERTIES 'N' STUFF

// active hex?
Hex.prototype.isActive = function() {
    return this.type != HexTypeEnum.INACTIVE;
}

Hex.prototype.isResource = function() {
    var ret = false;
    ret |= this.type == HexTypeEnum.WOOD;
    ret |= this.type == HexTypeEnum.SHEEP;
    ret |= this.type == HexTypeEnum.WHEAT;
    ret |= this.type == HexTypeEnum.STONE;
    ret |= this.type == HexTypeEnum.BRICK;
    return ret;
}

Hex.prototype.hexNbors = function(b) {
    var i = this.i;
    var j = this.j;
    var w = b.width();
    var M = b.max;

    // above and below
    var nbors = new Array();
    if (j > 0)   nbors.push( [i,j-1] ); // top
    if (j < M-1) nbors.push( [i,j+1] ); // bottom

    // side neighbors' rows
    var j1 = j-1; // correct if isUpCol(i)
    var j2 = j+1; // correct if !isUpCol(i)
    if ( b.isUpCol(i) ) j2--;
    else                 j1++;

    // side neighbors' columns
    var i1 = i-1;
    var i2 = i+1;

    if (i1 >= 0 && j1 >= 0)   nbors.push( [i1,j1] );
    if (i1 >= 0 && j2 <= M-1) nbors.push( [i1,j2] );
    if (i2 <  w && j1 >= 0)   nbors.push( [i2,j1] );
    if (i2 <  w && j2 <= M-1) nbors.push( [i2,j2] );

    return nbors;
};


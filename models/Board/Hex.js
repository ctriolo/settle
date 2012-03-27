/**
 * Hex.js
 *
 * JS Object that represents a tile in the game.
 */

// IMPORT / EXPORT
require("./Globals")
require("./Edge")
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

Hex.prototype.isWater = function() {
    return this.type == HexTypeEnum.WATER || this.type == HexTypeEnum.INACTIVE;
}

Hex.prototype.isLand = function() {
    return !this.isWater();
}

Hex.prototype.isCoastal = function(b)
{
    var ret = false;

    var edges = this.eNeighbors(b);
    for (e in edges)
        ret = ret || edges[e].isCoastal(b);

    return ret;
}

Hex.prototype.hNeighbors = function(b)
{
    var i = this.i;
    var j = this.j;
    var w = b.width();
    var M = b.max;

    // above and below
    var nbors = new Object();
    if (j > 0)   nbors.N = b.hexes[i][j-1]; // top
    if (j < M-1) nbors.S = b.hexes[i][j+1]; // bottom

    // side neighbors' rows
    var j1 = j-1; // correct if isUpCol(i)
    var j2 = j+1; // correct if !isUpCol(i)
    if ( b.isUpCol(i) ) j2--; // only use of b
    else                j1++;

    // side neighbors' columns
    var i1 = i-1;
    var i2 = i+1;

    if (i1 >= 0 && j1 >= 0)   nbors.NW = b.hexes[i1][j1];
    if (i1 >= 0 && j2 <= M-1) nbors.SW = b.hexes[i1][j2];
    if (i2 <  w && j1 >= 0)   nbors.NE = b.hexes[i2][j1];
    if (i2 <  w && j2 <= M-1) nbors.SE = b.hexes[i2][j2];

    return nbors;
};

Hex.prototype.iNeighbors = function(b)
{
    var c1 = this.i;
    var c2 = c1 + 1;

    var r1 = 2*this.j;
    if ( !b.isUpCol(this.i) ) // only use of b
        r1++;
    var r2 = r1+1;
    var r3 = r2+1;

    var nbors = new Object;
    // clockwise now, ya'll

    // down the right
    nbors.NE = b.inters[c2][r1];
    nbors.E  = b.inters[c2][r2];
    nbors.SE = b.inters[c2][r3];

    // up the left
    nbors.SW = b.inters[c1][r3];
    nbors.W  = b.inters[c1][r2];
    nbors.NW = b.inters[c1][r1];

    return nbors;
}

Hex.prototype.eNeighbors = function(b)
{
    var i = this.i;
    var j = this.j;

    var nbors = new Object;

    nbors.N = b.horizEdges[i][j];
    nbors.S = b.horizEdges[i][j+1];

    var i1 = i;
    var i2 = i+1;

    var j1 = 2*j;
    if ( !b.isUpCol(this.i) )
        j1++;
    var j2 = j1 + 1;

    nbors.NE = b.diagEdges[i2][j1];
    nbors.SE = b.diagEdges[i2][j2];
    nbors.SW = b.diagEdges[i1][j2];
    nbors.NW = b.diagEdges[i1][j1];

    return nbors;
}


/**
 * Hex.js
 *
 * JS Object that represents a tile in the game.
 */

HexTypeEnum = {
    INACTIVE : "Inactive",
    ACTIVE : "Active",

    WOOD: "Wood",
    SHEEP: "Sheep",
    WHEAT: "Wheat",
    STONE: "Stone",
    BRICK: "Brick",

    DESERT: "Desert",
    WATER: "Water",
};

function Hex(i, j) {
    this.j = this.i = -1;

    if (arguments.length > 1) {
        this.i = i;
        this.j = j;
    }

    this.type = HexTypeEnum.INACTIVE;
};

Hex.prototype.isActive = function() { return this.type != HexTypeEnum.INACTIVE; };

Hex.prototype.hexNbors = function(board) {
    var i = this.i, j = this.j;

    var nbors = new Array();
    if (j > 0) nbors.push( [i,j-1] ); // top
    if (j < board.max-1) nbors.push( [i,j+1] ); // bottom

    return nbors;
};

module.exports = Hex;

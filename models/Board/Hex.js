
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
}


exports.Hex = function(i, j) {
    this.j = this.i = -1;
    
    if (arguments.length > 1) {
        this.i = i;
        this.j = j;
    }
    
    this.type = HexTypeEnum.INACTIVE;
}

exports.Hex.prototype.isActive = function() { return this.type != HexTypeEnum.INACTIVE; }

exports.Hex.prototype.hexNbors = function(board) {
    var i = this.i, j = this.j;

    var nbors = new Array();
    if (j > 0) nbors.push( [i,j-1] ); // top
    if (j < board.max-1) nbors.push( [i,j+1] ); // bottom
    
    return nbors;
}


/**
 * Edge.js
 *
 * JS Object that represents an edge in the game.
 */

// IMPORT / EXPORT
require("./Globals")
module.exports = Edge;

// THE PRIMARY FUNCTION
function Edge(i, j, type)
{
    this.j = this.i = -1; // board coordinates
    if (arguments.length > 1) {
        this.i = i;
        this.j = j;
    }

    this.type = type;
    this.token = null; // for now
    this.port = null;
};

Edge.prototype.isActive = function(b)
{
    var hNbors = this.hNeighbors(b);
    for (n in hNbors)
        if ( hNbors[n].isActive() )
            return true;

    return false;
}

Edge.prototype.hasNoPort = function()
{
    return this.port == null || this.port == PortTypeEnum.NONE;
}

Edge.prototype.isCoastal = function(b)
{
    var numLand = 0;

    var hNbors = this.hNeighbors(b);
    for (n in hNbors)
        numLand += hNbors[n].isLand();

    return numLand == 1;
}

Edge.prototype.hNeighbors = function(b)
{
    var my_nbors = new Object();
    var me = this;

    for (var u = 0; u < b.hexes.length; u++) {
        for (var v = 0; v < b.hexes[u].length; v++)
        {
            var them = b.hexes[u][v];
            var their_eNbors = them.eNeighbors(b);

            for (dir in their_eNbors) // quid pro quo
                if ( their_eNbors[dir] == me )
                    my_nbors[ oppositeDir(dir) ] = them;
        }
    }

    return my_nbors;
}

Edge.prototype.iNeighbors = function(b)
{
    if (this.type == EdgeTypeEnum.HORIZONTAL)
    {
        var r = 2*this.j;
        if ( !b.isUpCol(this.i) )
            r++;

        var c1 = this.i;
        var c2 = c1 + 1;

        return { "W":b.inters[c1][r], "E":b.inters[c2][r] }
    }

    // checkerboard; same as top-left or not same as top-left
    var forwardSlash = (this.i + this.j)%2 == 0 ? b.startsUp() : !b.startsUp();

    var c = this.i;
    var r1 = this.j;
    var r2 = r1 + 1;

    var above = b.inters[c][r1];
    var below = b.inters[c][r2];

    if (forwardSlash)
        return { "NE":above, "SW":below };
    else
        return { "NW":above, "SE":below };
}

Edge.prototype.eNeighbors = function(b)
{
    var iNbors = this.iNeighbors(b);
    var my_nbors = new Array();

    for (n in iNbors) {
        their_eNbors = iNbors[n].eNeighbors(b);
        for (e in their_eNbors)
            if (their_eNbors[e] != this)
                my_nbors.push( their_eNbors[e] ); // 5 levels of indentation; ahhhhh
    }

    return my_nbors;
}

Edge.prototype.eNeighborsWithinRad = function(radius, b)
{
    var eNbors = [this]; // from starting edge ...

    for (var r = 0; r < minRad; r++) // ... to within radius r ...
    {
        var len = eNbors.length;
        for (var e = 0; e < len; e++) // ... get all edges
        {
            var moreNbors = eNbors[e].eNeighbors(b);
            for (var i = 0; i < moreNbors.length; i++)
            {
                if ( eNbors.indexOf( moreNbors[i] ) != -1 ) continue;
                eNbors.push( moreNbors[i] ); // 7 levels; AHHHHHHH
            }
        }
    }

    return eNbors;
}





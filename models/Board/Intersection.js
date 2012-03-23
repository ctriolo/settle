/**
 * Intersection.js
 *
 * JS Object that represents a tile in the game.
 */

// IMPORT / EXPORT
//require("./Globals")
module.exports = Intersection;

// THE PRIMARY FUNCTION
function Intersection(i, j)
{
    this.j = this.i = -1; // board coordinates
    if (arguments.length > 1) {
        this.i = i;
        this.j = j;
    }
    
    this.token = null; // for now
};

Intersection.prototype.hNeighbors = function(b)
{
    // this method uses brute force
    // get each hex's iNeighbors; 
    // if this intersection is included, then the hex is an hNeighbor
    
    var nbors = new Object;
    
    var arr = [this.i, this.j];
    for (var u = 0; u < b.hexes.length; u++)
        for (var v = 0; v < b.hexes[u].length; v++) 
        {
            var iNbors = b.hexes[u][v].iNeighbors(b);
            
            // ANY IDEAS ON HOW TO CLEAN THIS UP ?!?!?!?!
            if ( iNbors.NE.equals(arr) ) nbors.SW = [u,v];
            if ( iNbors.E.equals(arr) ) nbors.W = [u,v];
            if ( iNbors.SE.equals(arr) ) nbors.NW = [u,v];
            if ( iNbors.SW.equals(arr) ) nbors.NE = [u,v];
            if ( iNbors.W.equals(arr) ) nbors.E = [u,v];
            if ( iNbors.NW.equals(arr) ) nbors.SE = [u,v];
        }
    
    return nbors;
}

// ARRAY EQUALITY FUNCTION

Array.prototype.equals = function(that)
{
    if (this.length != that.length)
        return false;
    
    for (var i = 0; i < this.length; i++)
        if (this[i] != that[i])
            return false;
    
    return true;
}

// from: stackoverflow.com/questions/3115982/how-to-check-javascript-array-equals
function arrays_equal(a,b) { return !(a<b || b<a); }
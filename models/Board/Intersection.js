/**
 * Intersection.js
 *
 * JS Object that represents an intersection in the game.
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

Intersection.prototype.iNeighbors = function(b)
{
    var eNbors = this.eNeighbors(b);
    var iNbors = new Object();
    
    for (dir in eNbors)
        iNbors[dir] = eNbors[dir].iNeighbors(b)[dir];
    
    return iNbors;
}

Intersection.prototype.hNeighbors = function(b)
{
    return this.neighborsNeighbor( [b.hexes], b );
}

Intersection.prototype.eNeighbors = function(b)
{
    var arrs = [b.horizEdges, b.diagEdges];
    return this.neighborsNeighbor( arrs, b );
}
    
Intersection.prototype.neighborsNeighbor = function(arrs, b)
{
    // this method uses brute force
    // get each obj's iNeighbors; 
    // if this intersection is included, then the obj is an xNeighbor
        
    var my_nbors = new Object();
    var me = this;
        
    for (var a = 0; a < arrs.length; a++) {
        var arr = arrs[a];
        
        for (var u = 0; u < arr.length; u++) {            
            for (var v = 0; v < arr[u].length; v++)
            {
                var them = arr[u][v];
                var their_iNbors = them.iNeighbors(b);
                
                for (dir in their_iNbors) // quid pro quo
                    if ( their_iNbors[dir] == me )
                        my_nbors[ oppositeDir(dir) ] = them;
            }
        }
        
    }
    
    return my_nbors;
}

/*  ================== 
    >> Array add-on <<
    ==================  */

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
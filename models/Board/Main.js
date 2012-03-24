// ToDos:
// exhaustive neighbor test; esp. board boundary
// remove board param from function calls; make variable
// change !isUpCol --> isDownCol
// put all function declars in class; define outside
// allHexes, allInters
// better ports algorithm (pre-distributed)
// StandardBoard class that inherits Board class
// separate uiBoard class

var Board = require('./Board');


/*  ================= 
    >> Print Board <<
    =================  */

printBoard = function(b)
{
    var rows = b.max*2;
    var cols = b.width();
    
    // output array
    var output = new Array(rows);
    for (var r = 0; r < rows; r++) {
        output[r] = new Array(cols);
        for (var c = 0; c < cols; c++)
            output[r][c] = "  ";
    }
    
    // for each output cell
    for (var r = 0; r < rows; r++)
        for (var c = b.colDelta(r) % 2; c < cols; c += 2) {
            if ( !b.hexes[c][ Math.floor(r/2) ].isActive() )
                continue;
            
            // if tile is active; add dice roll (other options included)
            output[r][c] = '' + b.hexes[c][ Math.floor(r/2) ].diceRoll;
            //.hexNbors(b).length;
            //.type.substr(0,2);
            
            // if field is too short, add space before
            while (output[r][c].length < 2)
                output[r][c] = ' ' + output[r][c];
        }
    
    // print!
    console.log();
    console.log(output);
    console.log();
}

/*  ========== 
    >> Main <<
    ==========  */

// grab command line args
var min = 3; var max = 5; // defaults
if (process.argv.length > 3) {
    min = parseInt( process.argv[2] ); // not argv[0] == "node"
    max = parseInt( process.argv[3] ); // not argv[1] == "Main.js"
}

// make a board and print its JSON string
var b = new Board(min, max);
console.log(b.prettyprint2());
printBoard(b);
//console.log( b.json() + "\n" );
//console.log( b.root().hexNbors(b) );
//console.log("\n" + b.json2() + "\n")
//console.log(b.prettyprint2());

/*
for (var i = 0; i < b.hexes.length; i++) {
    for (var j = 0; j < b.hexes[i].length; j++) 
    {
        var hex = b.hexes[i][j];
        if ( !hex.isCoastal(b) ) continue;
        
        console.log(hex);
        console.log(hex.eNeighbors(b));
            
    }
}
*/


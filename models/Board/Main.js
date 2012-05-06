// ToDos:
// exhaustive neighbor test; esp. board boundary
// remove board param from function calls; make variable
// change !isUpCol --> isDownCol
// put all function declars in class; define outside
// allHexes, allInters
// better ports algorithm (pre-distributed)
// StandardBoard class that inherits Board class
// separate uiBoard class
// move id assignment from json2 conversion method to initial constructor

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
//console.log(b.prettyprint2());
//printBoard(b);

testLongestRoad = function(b) 
{
    b.placeStartingSettlement(0,2);
    b.placeStartingRoad(0,1);

    console.log(b.longestRoad(0)); // should be 1

    b.buildRoad(0,43);
    b.buildRoad(0,44);
    b.buildRoad(0,2);
    b.buildRoad(0,32);
    b.buildRoad(0,33);

    console.log(b.longestRoad(0)); // should be 6

    b.buildRoad(0,45);
    b.buildRoad(0,46);
    b.buildRoad(0,3);
    b.buildRoad(0,34);
    b.buildRoad(0,35);

    console.log(b.longestRoad(0)); // should be 11

    b.buildRoad(0,7);
    b.buildRoad(0,8);
    b.buildRoad(0,55);
    b.buildRoad(0,56);

    console.log(b.longestRoad(0)); // should be 14

    b.placeStartingSettlement(1,4);
    b.placeStartingSettlement(1,15);

    console.log(b.longestRoad(0)); // should be 8
}

//testLongestRoad(b);

b.coastsInOrder( b.allEdges() );
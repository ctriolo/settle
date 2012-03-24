// ToDos:
// exhaustive neighbor test; esp. board boundary
// remove board param from function calls; make variable
// change !isUpCol --> isDownCol
// put all function declars in class; define outside


var Board = require('./Board');

// grab command line args
var min = 3; var max = 5; // defaults
if (process.argv.length > 3) {
    min = parseInt( process.argv[2] ); // not argv[0] == "node"
    max = parseInt( process.argv[3] ); // not argv[1] == "Main.js"
}

// make a board and print its JSON string
var b = new Board(min, max);
//console.log( b.json() + "\n" );
//console.log( b.root().hexNbors(b) );

/*  ================= 
    >> Print Board <<
    =================  */

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
//console.log("\n" + b.json2() + "\n")
//console.log(b.prettyprint());
//console.log(b.prettyprint2());

//console.log( b.inters[1][2].hNeighbors(b) );
//console.log( b.root().eNeighbors(b) );

console.log( b.root().hNeighbors(b) );
console.log( b.root().iNeighbors(b) );
console.log( b.root().eNeighbors(b) );
console.log();

console.log( b.inters[2][1].hNeighbors(b) );
console.log( b.inters[2][1].iNeighbors(b) );
console.log( b.inters[2][1].eNeighbors(b) );
console.log();

var e = b.root().eNeighbors(b).S;
console.log( e.hNeighbors(b) );
console.log( e.iNeighbors(b) );
console.log( e.eNeighbors(b) );




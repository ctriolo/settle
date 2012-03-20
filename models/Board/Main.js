var board_h = require('./Board');

var min = 3; var max = 5;
if (process.argv.length > 3) {
    min = parseInt( process.argv[2] ); // argv[0] == "node"
    max = parseInt( process.argv[3] ); // argv[1] == "Main.js"
}

var b = new board_h.Board(min, max);
console.log( b.json() );
console.log( b.root().hexNbors(b) );

// print out board

var rows = b.max*2;
var cols = b.width();

var output = new Array(rows);
for (var r = 0; r < rows; r++) {
    output[r] = new Array(cols);
    for (var c = 0; c < cols; c++)
        output[r][c] = "  ";
}

for (var r = 0; r < rows; r++)
    for (var c = b.colDelta(r) % 2; c < cols; c += 2) {
        if ( !b.hexes[c][ Math.floor(r/2) ].isActive() )
            continue;
        output[r][c] = '' + b.hexes[c][ Math.floor(r/2) ].diceRoll;
                                                       //.hexNbors(b).length;
                                                       //.type.substr(0,2);
        if (output[r][c].length == 1)
            output[r][c] = ' ' + output[r][c];
    }

console.log(output);


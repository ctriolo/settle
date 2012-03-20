var board_h = require('./Board');

var b = new board_h.Board(3,5);
console.log( b.json() );å
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
        if ( b.hexes[c][ Math.floor(r/2) ].isActive() )
            output[r][c] = b.hexes[c][ Math.floor(r/2) ].type.substr(0,2);
    }

console.log(output);
/**
 * UIBoard
 *
 * Renders Board objects
 *
 * EXAMPLE:
 *   var b = new Board(3,5);
 *   var uib = new UIBoard(b);
 *   var rendered = uib.render();
 */


// Constants
var INT_DIRECTIONS = ["W", "NW", "NE", "E", "SE", "SW"];
var EDGE_DIRECTIONS = ["NW", "N", "NE", "SE", "S", "SW"];
var SVG_WIDTH = 800;
var SVG_HEIGHT = 800;


/**
 * UIBoard
 *
 * @param   object  the Board object you wish to render
 * @return  object  new UIBoard object
 */
function UIBoard(board) {
  this.board = board.json2();
  this.board.max = board.max;
  this.board.min = board.min;
  var hexEdgeLength = Math.min((SVG_HEIGHT)/(this.board.gridHeight+1)/(2*Math.sin(Math.PI/3)), SVG_WIDTH/(this.board.gridWidth+2)/1.5);
  this.originX = (SVG_WIDTH)/2 - hexEdgeLength - (this.board.max - this.board.min) * 1.5 * hexEdgeLength;
  this.originY = 60;
  this.C = hexEdgeLength
  this.A = .5 * hexEdgeLength
  this.B = .866 * hexEdgeLength;
};


/**
 * _getHexCenter (private)
 *
 * Gets the translation from (0,0) of the hex at [x,y].
 *
 * @param   x  int     the x coord of the hex
 * @param   y  int     the y coord of the hex
 * @return     object  in the form of {'x': x, 'y': y}
 */
UIBoard.prototype._getHexTranslation = function(x, y) {
  var A = this.A, B = this.B, C = this.C;

  // Find the top left corner of the containing square
  var Tx = this.originX + x * (A + C);
  var Ty = this.originY + y * 2 * B;

  if (Math.abs(x) % 2 == 1) {
    if ((this.board.max-this.board.min) % 2 == 1) Ty -= B;
    else Ty += B;
  }
  // deal with starting on the "bottom" of the rectangle
  if ((this.board.max-this.board.min)%2 == 1) Ty += B;

  return {'x': Tx, 'y': Ty}
};


/**
 * _getHexCoordinates (private)
 *
 * Get all the points/corners of the hex at [x,y].
 *
 * @param   x  int    the x coord of the hex
 * @param   y  int    the y coord of the hex
 * @return     array  in the form of [{'x': x, 'y': y}, ...]
 */
UIBoard.prototype._getHexCoordinates = function(x, y) {
  var A = this.A, B = this.B, C = this.C;
  var T = this._getHexTranslation(x, y);
  return [
    {'x': T.x + 0,   'y': T.y + B},
    {'x': T.x + A,   'y': T.y + 0},
    {'x': T.x + A+C, 'y': T.y + 0},
    {'x': T.x + 2*C, 'y': T.y + B},
    {'x': T.x + A+C, 'y': T.y + 2*B},
    {'x': T.x + A,   'y': T.y + 2*B}
  ];
};


/**
 * _getHexCenter (private)
 *
 * Gets the center of the hex at [x,y].
 *
 * @param   x  int     the x coord of the hex
 * @param   y  int     the y coord of the hex
 * @return     object  in the form of {'x': x, 'y': y}
 */
UIBoard.prototype._getHexCenter = function(x, y) {
  var A=this.A, B=this.B, C = this.C;
  var T = this._getHexTranslation(x, y);
  return {
    'x': T.x + A + C/2,
    'y': T.y + B,
  };
};


/**
 * _getReflection (private)
 *
 * Gets the reflection of `point` from the line made by `line0` and `line1`.
 * (TODO: Make this do what it says it doesnt instead of being a reflection
 *        through the midpoint of the line.)
 *
 * @param  point     object  the point to be reflected, in the form of {'x': x, 'y': y}
 * @param  line0     object  the first point of the reflection line, in the form of {'x': x, 'y': y}
 * @param  line1     object  the second point of the reflection line, in the form of {'x': x, 'y': y}
 * @param  modifier  num     the scale factor, null is assumed 1;
 * @param            object  the reflected point, in the form of {'x': x, 'y': y}
 */
UIBoard.prototype._getReflection = function(point, line0, line1, modifier) {
  modifier = modifier?modifier:1;
  var mid = {'x': (line0.x + line1.x)/2 , 'y': (line0.y + line1.y)/2};
  var delta = {'x': point.x - mid.x, 'y': point.y - mid.y};
  return {'x': mid.x - modifier*delta.x, 'y': mid.y - modifier*delta.y};
}


/**
 * _addTile (private)
 *
 * Add the unique elements associated with a tile to the `hexes`, `edges`,
 * and `intersections` arrays to help build a board.
 *
 * @param  hex            object  the hex object from this.board.hexes[i]
 * @param  hexes          array   the array to place rendered hexes in
 * @param  edges          array   the array to place rendered edges in
 * @param  intersections  array   the array to place rendered intersections in
 */
UIBoard.prototype._addTile = function(hex, hexes, edges, intersections, ports) {
  if (hex.type === "Inactive") return;

  var points = this._getHexCoordinates(hex.grid.x, hex.grid.y);
  var center = this._getHexCenter(hex.grid.x, hex.grid.y);

  // Add the hex's surrounding paths and intersections
  for (var i = 0; i < 6; i++) {
    // Add the vertex
    var iIndex = hex.intersections[INT_DIRECTIONS[i]];
    intersections[iIndex] = {
      'index': iIndex,
      'x': points[i].x,
      'y': points[i].y,
    };

    // Add the edge
    var eIndex = hex.edges[EDGE_DIRECTIONS[i]];
    edges[eIndex] = {
      'index': eIndex,
      'x0': points[i].x,
      'y0': points[i].y,
      'x1': points[(i+1)%6].x,
      'y1': points[(i+1)%6].y,
    };

    // Add the port
    if (this.board.edges[eIndex].port && this.board.edges[eIndex].port !== 'None') {
      var point0 = {'x': points[i].x, 'y': points[i].y};
      var point2 = {'x': points[(i+1)%6].x, 'y': points[(i+1)%6].y};
      var point1 = this._getReflection(this._getHexCenter(hex.grid.x, hex.grid.y), point0, point2, 1.6);
      var label = this._getReflection(this._getHexCenter(hex.grid.x, hex.grid.y), point0, point2, .35);
      ports[eIndex] = {
        'index': eIndex,
        'type': this.board.edges[eIndex].port,
        'points': [ point0, point1, point2 ],
        'label': label,
      };
    }
  }

  // Add the hex
  hexes[hex.index] = {
    'points': points,
    'center': center,
    'type': hex.type ? hex.type : 'Sea',
    'number': hex.number,
    'radius': this.C,
    'index': hex.index,
  };
};


/**
 * render
 *
 * Renders and returns the board objects to be drawn by board.jade
 *
 * @return  object  in the form of {'hexes': [...], 'edges': [...], 'intersections': [...]}
 */
UIBoard.prototype.render = function() {
  var hexes = [];
  var intersections = [];
  var edges = [];
  var ports = [];

  // Go through every hex and add it and its related elements to our arrays
  for (var i = 0; i < this.board.hexes.length; i++)
    this._addTile(this.board.hexes[i], hexes, edges, intersections, ports);

  // TODO: HAVE BOARD ONLY INDEX AND GIVE US ACTIVE ELEMENTS
  var temp; // used to clean up `hexes`, `edges`, and `intersections`.
  temp = []; for (var i = 0; i < hexes.length; i++) if (hexes[i]) temp.push(hexes[i]); hexes = temp;
  temp = []; for (var i = 0; i < edges.length; i++) if (edges[i]) temp.push(edges[i]); edges = temp;
  temp = []; for (var i = 0; i < intersections.length; i++) if (intersections[i]) temp.push(intersections[i]); intersections = temp;
  temp = []; for (var i = 0; i < ports.length; i++) if (ports[i]) temp.push(ports[i]); ports = temp;

  return {
    'hexes': hexes,
    'edges': edges,
    'intersections': intersections,
    'ports': ports,
  };
};


/**
 * main
 *
 * Prints a rendered Board object
 */
function main() {
  var Board = require('./Board');
  var board = new Board();
  var uiBoard = new UIBoard(board);
  var renderedBoard = uiBoard.render();
  console.log(JSON.stringify(renderedBoard, null, 4));
};


if (require.main === module) main();
else module.exports = UIBoard;

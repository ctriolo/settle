/**
 * newBoard.js
 *
 * Controller for board games
 */

// Dependencies

var Hex = require('../models/Board/Hex')
  , Board = require('../models/Board/Board');

// Global Memory
var boards = {}; // will be moved into BoardProvider

// Constants
var INT_DIRECTIONS = ["W", "NW", "NE", "E", "SE", "SW"];
var EDGE_DIRECTIONS = ["NW", "N", "NE", "SE", "S", "SW"];
var MIN = 3;
var MAX = 5;
var SVG_WIDTH = 800;
var SVG_HEIGHT = 800;

/**
 * addTile
 *
 * Add the unique elements associated with a tile to `hexes`, `edges`,
 * and `vertices` to help build a board.
 */
function addTile(hexEdgeLength, originX, originY, x, y, hex, hexes, edges, vertices) {

  // HEX COORDINATES

  var C = hexEdgeLength
    , A = .5 * C
    , B = .866 * C;

  // Build a simple hex
  var points = [
    {'x': 0,   'y': B},
    {'x': A,   'y': 0},
    {'x': A+C, 'y': 0},
    {'x': 2*C, 'y': B},
    {'x': A+C, 'y': 2*B},
    {'x': A,   'y': 2*B}
  ];

  // Find the top left corner of the containing square
  init_x = originX + x * (A + C);
  init_y = originY + y * 2 * B;

  if (Math.abs(x) % 2 == 1) {
    if ((MAX-MIN) % 2 == 1)
        init_y -= B;
    else
        init_y += B;
  }
  // deal with starting on the "bottom" of the rectangle
  if ((MAX-MIN)%2 == 1)
    init_y += B;

  // Add starting points
  for (var i = 0; i < 6; i++) {
    points[i].x += init_x;
    points[i].y += init_y;
  }

  // Find the hex's center
  center = {
    'x': init_x + A + C/2,
    'y': init_y + B,
  };

  // ADD VERTICES, EDGES, AND HEX

  for (var i = 0; i < 6; i++) {
    // Add the vertex
    var vIndex = hex.intersections[INT_DIRECTIONS[i]];
    vertices[vIndex] = {
      'index': vIndex,
      'x': points[i].x,
      'y': points[i].y,
    };

    // Add the edge
    var eIndex = hex.edges[EDGE_DIRECTIONS[i]];
    edges[hex.edges[EDGE_DIRECTIONS[i]]] = {
      'index': eIndex,
      'x0': points[i].x,
      'y0': points[i].y,
      'x1': points[(i+1)%6].x,
      'y1': points[(i+1)%6].y,
      'port': "None",
    };
  }

  // Add the hex
  hexes[hex.index] = {
    'points': points,
    'center': center,
    'type': hex.type ? hex.type : 'Sea',
    'number': hex.number,
    'radius': hexEdgeLength,
    'index': hex.index,
  };
}

/**
 * view
 *
 * Renders a rectangular board.
 */
module.exports.view = function(req, res) {
  var id = req.params.id?req.params.id:'default';
  if (id in boards) {
    // Fetch an existing board
    var b = boards[id];
  } else {
    // Create a new board
    var b = new Board(MIN, MAX);
    boards[id] = b;
  }

  // Everything below renders a board. Should be put into a UIBoard object.

  var board = b.json2();
  var hexes = [];
  var vertices = [];
  var edges = [];
  var hexEdgeLength = Math.min((SVG_HEIGHT)/(board.gridHeight+1)/(2*Math.sin(Math.PI/3)), SVG_WIDTH/(board.gridWidth+2)/1.5);
  var originX = (SVG_WIDTH)/2 - hexEdgeLength - (MAX -MIN)*1.5*hexEdgeLength;
  var originY = 40;

  // Foreground Hexes
  for (var i = 0; i < board.hexes.length; i++) {
    fore_hex = board.hexes[i];
    if (fore_hex.type !== "Inactive") {
      addTile(hexEdgeLength, originX, originY, fore_hex.grid.x, fore_hex.grid.y, fore_hex, hexes, edges, vertices);
    }
  }

  // Add ports, TODO: get this in addTile
  for (var edge in board.edges)
    if (edge.isActive && edge.port)
      edges[edge.index].port = edge.port


  // TO CLEAN UP THE ARRAYS PASSED TO THE VIEW RENDERER. TODO: HAVE BOARD ONLY INDEX AND GIVE US ACTIVE ELEMENTS
  var temp;
  temp = []; for (var i = 0; i < hexes.length; i++) if (hexes[i]) temp.push(hexes[i]); hexes = temp;
  temp = []; for (var i = 0; i < edges.length; i++) if (edges[i]) temp.push(edges[i]); edges = temp;
  temp = []; for (var i = 0; i < vertices.length; i++) if (vertices[i]) temp.push(vertices[i]); vertices = temp;

  res.render('board', {'layout':false, 'title':'Settle','hexes':hexes,'vertices':vertices,'edges':edges});
};

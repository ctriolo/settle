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
 * getTile
 *
 * Get the elements associated with a tile to help build a board.
 * Returns an object with keys 'hex', 'edges', and 'vertices'
 * WARNING: THIS SHOULD ONLY BE USED TO BUILD THE BOARD.
 * THE FUNCTION DOES NOT RETURN EVERY EDGE AND VERTEX
 * ASSOCIATED WITH A GIVEN TILE. IT ONLY RETURNS THE VERTICES
 * THAT WOULD BE UNIQUE IF YOU CALLED THE FUNCTION FOR EACH TILE
 * IN A BOARD.
 */
function getTile(hexEdgeLength, originX, originY, x, y, hex, vertices, edges) {

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
    if (hex !== "deep_water") {
      vertices[hex.intersections[INT_DIRECTIONS[i]]].x = points[i].x;
      vertices[hex.intersections[INT_DIRECTIONS[i]]].y = points[i].y;
      edges[hex.edges[EDGE_DIRECTIONS[i]]].x0 = points[i].x;
      edges[hex.edges[EDGE_DIRECTIONS[i]]].y0 = points[i].y;
      previous = i - 1;
      if (previous < 0)
        previous = 5;
      edges[hex.edges[EDGE_DIRECTIONS[previous]]].x1 = points[i].x;
      edges[hex.edges[EDGE_DIRECTIONS[previous]]].y1 = points[i].y;
    }
  }

  // Find the hex's center
  center = {
    'x': init_x + A + C/2,
    'y': init_y + B,
  };

  return {
    'hex': {
      'points': points,
      'center': center,
      'type': hex.type ? hex.type : 'Sea',
      'number': hex.number,
      'radius': hexEdgeLength,
      'index': hex.index
    },
    'vertices': vertices,
    'edges': edges,
  };
}

/**
 * view
 *
 * Renders a rectangular board.
 */
module.exports.view = function(req, res) {
  var hexes = [];
  var vertices = [];
  var edges = [];

  var id = req.params.id?req.params.id:'default';
  if (id in boards) {
    // Fetch an existing board
    var b = boards[id];
  } else {
    // Create a new board
    var b = new Board(MIN, MAX);
    boards[id] = b;
  }

  var board = b.json2();

  // initialize intersections
  for (var i = 0; i < board.intersections.length; i++) {
    intersection = board.intersections[i];
    if (!intersection.isActive) continue;
    int_object = {
            'index': intersection.index,
            'x': 0,
            'y': 0
            };
    vertices[intersection.index] = int_object;
  }

  // initialize edges
  for (var i = 0; i < board.edges.length; i++) {
    edge = board.edges[i];
    if (edge.isActive) {
      edge_object = {
            'index': edge.index,
            'x0': 0,
            'y0': 0,
            'x1': 0,
            'y1': 0,
            'port': "None"
            };
      if (edge.port)
          edge_object.port = edge.port;
      edges[edge.index] = edge_object;
    }
  }

  var hexEdgeLength = Math.min((SVG_HEIGHT)/(board.gridHeight+1)/(2*Math.sin(Math.PI/3)), SVG_WIDTH/(board.gridWidth+2)/1.5);
  var originX = (SVG_WIDTH)/2 - hexEdgeLength - (MAX -MIN)*1.5*hexEdgeLength;
  var originY = 40;

  // Foreground Hexes
  for (var i = 0; i < board.hexes.length; i++) {
      fore_hex = board.hexes[i];
      if (fore_hex.type !== "Inactive") {
        tile = getTile(hexEdgeLength, originX, originY, fore_hex.grid.x, fore_hex.grid.y, fore_hex, vertices, edges);
        hexes.push(tile.hex);
      }
    }

  res.render('board', {'layout':false, 'title':'Settle','hexes':hexes,'vertices':vertices,'edges':edges});
};

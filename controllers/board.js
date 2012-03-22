/**
 * newBoard.js
 *
 * Controller for board games
 */

// Dependencies

var Hex = require('../models/Board/Hex')
  , Board = require('../models/Board/Board');

// Constants

var HEX_EDGE_LENGTH = 50;
var ORIGIN_X = 50; // This maybe should be fixed with padding in the view....
var ORIGIN_Y = 40; // This maybe should be fixed with padding in the view....
var GRID_HEIGHT = 0;
var GRID_WIDTH = 0;
var MIN = 3;
var MAX = 5;
var SVG_WIDTH = 800;
var SVG_HEIGHT = 600;
// DUMBY FUNCTION: get random valid resource
function getRVR() {
  // STUPID SILLY FUNCTION THAT WONT ACTUALLY EXISTS
  var resources = ['field', 'pasture', 'mountain', 'hill', 'forest', 'desert', 'water'];
  var r = resources[Math.floor(Math.random()*7)];
  return r;
}

// DUMBY FUNCTION: get random valid dice
function getRVD() {
  // STUPID SILLY FUNCTION THAT WONT ACTUALLY EXISTS
  return Math.floor(Math.random()*11) + 2;
}

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
function getTile(x, y, hex) {

  // HEX COORDINATES

  var C = HEX_EDGE_LENGTH
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
  init_x = ORIGIN_X + x * (A + C);
  init_y = ORIGIN_Y + y * 2 * B;

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

  // CALCULATE VERTICES
  // TODO MOVE THIS CRAP ONCE WE GET UNIQUE IDENTIFIERS FOR VERTICES
  vertices = [];
  /* THIS DOESN'T WORK WITHOUT RECTANGULAR BOARD.
  if (x == 0) vertices.push(points[0]);
  if (y == 0) {
    vertices.push(points[1]);
    vertices.push(points[2]);
  }
  if (x == GRID_WIDTH - 1) vertices.push(points[3]);
  vertices.push(points[4]);
  vertices.push(points[5]);
  */

  // CALCULATE EDGES
  // TODO MOVE THIS ONCE WE GET UNIQUE IDENTIFIERS FOR EDGES

  edges = [];
  /* THIS DOESN'T WORK WITHOUT RECTANGULAR BOARD.
  if (x==0 && y!=0) edges.push([points[0], points[1]]);
  if (x==GRID_WIDTH-1 && y!=0) edges.push([points[2], points[3]]);
  if (y==0) {
    edges.push([points[0], points[1]]);
    edges.push([points[1], points[2]]);
    edges.push([points[2], points[3]]);
  }
  edges.push([points[3], points[4]]);
  edges.push([points[4], points[5]]);
  edges.push([points[5], points[0]]);
  */

  return {
    'hex': {
      'points': points,
      'center': center,
      'type': hex.type ? hex.type : 'Sea',
      'number': hex.diceRoll,
      'radius': HEX_EDGE_LENGTH
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
  // TODO: CHECK IF A BOARD EXISTS AT THIS ADDRESS AND FETCH IT
  if (false) {
    // Fetch the board
  } else {
    // Create a new board
    board = new Board(MIN, MAX);
  }
  GRID_WIDTH = board.width();
  GRID_HEIGHT = board.max;
  HEX_EDGE_LENGTH = Math.min((SVG_HEIGHT)/(GRID_HEIGHT+1)/(2*Math.sin(Math.PI/3)), SVG_WIDTH/(GRID_WIDTH+2)/1.5);
  ORIGIN_X = (SVG_WIDTH)/2 - HEX_EDGE_LENGTH - (MAX -MIN)*1.5*HEX_EDGE_LENGTH;
  // Background Hexes
  for (var i = -1; i < GRID_WIDTH + 1; i++) {
    for (var j = -1; j < GRID_HEIGHT + 1; j++) {
      if (i < 0 || i >= GRID_WIDTH || j < 0 || j >= GRID_HEIGHT) {
        tile = getTile(i, j, 'deep_water');
        hexes.push(tile.hex);
      }
    }
  }

  // Foreground Hexes
  for (var i = 0; i < GRID_WIDTH; i++) {
    for (var j = 0; j < GRID_HEIGHT; j++) {
      if (board.hexes[i][j].isActive()) {

        tile = getTile(i, j, board.hexes[i][j]);
        hexes.push(tile.hex);
        vertices = vertices.concat(tile.vertices);
        edges = edges.concat(tile.edges);
      }
      else {
        board.hexes[i][j].type = HexTypeEnum.WATER // PROBABLY UNNECESSARY
        tile = getTile(i, j, 'deep_water');
        hexes.push(tile.hex);
      }
    }
  }

  res.render('board', {'layout':false, 'title':'Settle','hexes':hexes,'vertices':vertices,'edges':edges});
};

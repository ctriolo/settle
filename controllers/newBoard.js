/**
 * newBoard.js
 *
 * Controller for board games
 */

// Constants

var HEX_EDGE_LENGTH = 50;
var ORIGIN_X = 50; // This maybe should be fixed with padding in the view....
var ORIGIN_Y = 40; // This maybe should be fixed with padding in the view....
var GRID_HEIGHT = 6;
var GRID_WIDTH = 9;

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
function getTile(x, y, type, number) {

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
  if (Math.abs(x) % 2 == 1) init_y += B;

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

  // HEX COLOR

  stroke = 'Black';
  switch (type) {
  case 'pasture':color = 'LightGreen'; break;
  case 'forest': color = 'url(#forest)'; /**'ForestGreen';**/ break;
  case 'field': color = 'Gold'; break;
  case 'mountain': color = 'LightSlateGray'; break;
  case 'hill': color = 'OrangeRed'; break;
  case 'desert':
    color = 'Khaki';
    number = 0; // TODO: THIS WILL NOT BE NESSA WHEN WE HAVE ACTUAL BOARD BUILING CODE
    break;
  case 'water':
    color = 'Cyan';
    number = 0; // TODO: THIS WILL NOT BE NESSA WHEN WE HAVE ACTUAL BOARD BUILING CODE
    break;
  case 'deep_water':
    color = 'DarkCyan';
    stroke = 'DimGrey';
    break;
  default: color = 'Black'; break;
  }

  // CALCULATE VERTICES

  vertices = [];
  if (x == 0) vertices.push(points[0]);
  if (y == 0) {
    vertices.push(points[1]);
    vertices.push(points[2]);
  }
  if (x == GRID_WIDTH - 1) vertices.push(points[3]);
  vertices.push(points[4]);
  vertices.push(points[5]);

  // CALCULATE EDGES

  edges = [];
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

  return {
    'hex': {
      'points': points,
      'center': center,
      'color': color,
      'stroke': stroke,
      'number': number
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

  // Background Hexes
  for (var i = -1; i < GRID_WIDTH + 1; i++) {
    for (var j = -1; j < GRID_HEIGHT + 1; j++) {
      tile = getTile(i, j, 'deep_water');
      hexes.push(tile.hex);
    }
  }

  // Forground Hexes
  for (var i = 0; i < GRID_WIDTH; i++) {
    for (var j = 0; j < GRID_HEIGHT; j++) {
      if (j != GRID_HEIGHT - 1 || i % 2 != 1) { // No bottom row for even columns
        tile = getTile(i, j, getRVR(), getRVD());
        hexes.push(tile.hex);
        vertices = vertices.concat(tile.vertices);
        edges = edges.concat(tile.edges);
      }
    }
  }

  res.render('board', {'layout':false, 'title':'Settle','hexes':hexes,'vertices':vertices,'edges':edges});
};

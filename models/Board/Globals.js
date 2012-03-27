/**
 * Globals.js
 *
 * JS Module that contains all globals and constants shared by all modules
 */

// Hex Types

HEX_TYPE =
{
    // most basic
    INACTIVE : "Inactive",
    ACTIVE : "Active",

    // less basic
    FOREST:   "Forest",
    PASTURE:  "Pasture",
    FIELD:    "Field",
    MOUNTAIN: "Mountain",
    HILL:     "Hill",
    DESERT:   "Desert",
    WATER:    "Water",
};

HEX_TYPE_TO_RESOURCE =
{
    "Forest":   "Wood",
    "Pasture":  "Sheep",
    "Field":    "Wheat",
    "Mountain": "Stone",
    "Hill":     "Brick",
};

// Edge Types

EdgeTypeEnum =
{
    HORIZONTAL : "horiz",
    DIAGONAL : "diag",
}

//
PortTypeEnum =
{
    NONE : "None",
    ANY_3_1 : "Any31",
    WOOD_2_1: "Wood21",
    SHEEP_2_1: "Sheep21",
    WHEAT_2_1: "Wheat21",
    STONE_2_1: "Stone21",
    BRICK_2_1: "Brick21",
}

// opposite direction

oppositeDir = function(s)
{
    arr = ['N', 'E', 'S', 'W'];
    opp = ['s', 'w', 'n', 'e'];

    var t = s;
    for (var i = 0; i < arr.length; i++)
        t = t.replace( arr[i], arr[ (i+2)%4 ].toLowerCase() );

    return t.toUpperCase();
}


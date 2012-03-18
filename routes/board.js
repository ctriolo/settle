var exec = require("child_process").exec;
var queryString = require("querystring");

function createHexagon(colors, numbers, x,y, radius, id) {

	var color = ["sheep.png", "brick.png", "wheat_flash.png", "wood.png", "ore1.png", "desert1.png"];
	do {
		// choose random color
		var rand = Math.floor(Math.random()*6);
		// if regular size board choose color by colors distribution
		var empty = true;
		for (var i = 0; i < color.length; i++) {
			if (colors[color[i]] > 0) {
				empty = false;
				break;
			}
		}
		if (empty)
			break;
	} while(colors[color[rand]] == 0);
	colors[color[rand]] -= 1;
	var poly = ""
	/*
	for (var i = 0; i < 6; i++) {
		poly += '<circle cx="'
  		poly += (x + radius * Math.cos(2 * Math.PI * i /6)) + '" cy="';
		poly +=  (y + radius* Math.sin(2 * Math.PI * i /6)) + '" r=10 />';
	}
	*/
	// draw hexagon image
	poly += '<image x="' + (x - (radius) -1) + '" y="' + (y-(209/242*radius)-1) + '" width="' + (2*radius + 2) + '" height="' + (2*radius*209/242 + 2) + '" xlink:href="http://www.wprb.com/sports/wp-content/uploads/2012/03/' +  color[rand] + '" >';
	
	// don't draw circle or number for desert tiles
	if (color[rand] === "desert1.png") return poly;

	// draw circle scaled to fit the hexagon
	poly += '<circle id="circle' + id + '" cx="' + x + '" cy="' + y + '" r="' + radius/2.5 + '" stroke="black" stroke-width="2" fill="white" />'

	// move text number over
	var textx = x - 5;
	do {
		// choose random number between 0-10 inclusive.
		var num = Math.floor(Math.random()*11);
		// if normal size board, choose number by numbers distribution
		var empty = true;
		for (var i = 0; i < numbers.length; i++) {
			if (numbers[i] > 0) {
				empty = false;
				break;
			}
		}
		if (empty)
			break;
	} while(numbers[num] == 0);
	numbers[num]--;
	num += 2; // make between 2-12
	var color = "black"
	if (num > 9) 
		textx -= 10; // center text if there are multiple digits
	if (num === 8 || num === 6)
		color = "red" // draw 6 and 8 circles in red
	poly += '<text id="text' + id + '" x="' + textx + '" y="' + (y+10) + '" fill="' + color + '" font-size="30">' + num + '</text>'
	
	return poly;
}
function buildVideoBoxes(width, height) {
	// draw background box, image and stats box for player 1
	var output = '<rect class="videoBackground" x = 0 y = 510 width= 240 height=180 />\n';
	output += '<image x=0 y=513 width=236 height=177 xlink:href="http://www.cs.princeton.edu/~dcapra/player1.jpg" />\n';
	output += '<rect class="playerStats" x=0 y=690 width=240 height=60 />\n';
	
	// draw background box, image and stats box for player 2
	var output += '<g id="player2" drag:enable="true"><rect class="videoBackground" x =0 y = 0 width= 240 height=180 style="stroke:lime"/>\n';
	output += '<image x=2 y=3 width=236 height=177 xlink:href="http://www.cs.princeton.edu/~dcapra/player2.jpg"/>\n';
	output += '<rect class="playerStats" x=0 y=180 width=240 height=60 style="stroke:lime"/></g>\n';

	// draw background box, image and stats box for player 3
	output += '<rect class="videoBackground" x = 760 y = 0 width= 240 height=180 />\n';
	output += '<image x=762 y=3 width=236 height=177 xlink:href="http://www.cs.princeton.edu/~dcapra/player3.jpg" />\n';
	output += '<rect class="playerStats" x=760 y=180 width=240 height=60 />\n';

	// draw background box, image and stats box for player 4
	output += '<rect class="videoBackground" x = 760 y = 510 width= 240 height=180 />\n';
	output += '<image x=762 y=513 width=236 height=177 xlink:href="http://www.cs.princeton.edu/~dcapra/player4.jpg"/>\n';
	output += '<rect class="playerStats" x=760 y=690 width=240 height=60 />\n';

	return output;
}
function createStyle() {
	var output = "<style>\n\t";
	output += '.playerStats {fill:white;stroke:black;stroke-width:7;stroke-opacity:.5}\n';
	output += '.videoBackground {fill:grey;stroke:black;stroke-width:5; stroke-opacity:.5}\n';
	output += 'svg {display:block; border:1px solid #ccc; position:absolute;top:2%;left:1%;width:97%;height:97%}\n';
	output += '</style>';
	return output;
}
function buildBoard(minSize, maxSize, width, height) {
	var size = minSize;
	var hexCount = 0;
	// leave space at bottom for textbox
	var bottom_margin = 100;
	// find optimal radius based on width and height
	var hex_r = Math.min((height-40-bottom_margin)/maxSize/2/(Math.sin(Math.PI/3)), (width-520)/((maxSize-minSize)*2+1)/1.5);
	// where to draw first column to center the board
	var xint = (width/2)-(maxSize-minSize)*1.5*hex_r;
	// find height of each hexagon
	var ydiff = 2*hex_r*Math.sin(Math.PI/3);

	// this is how high top hexagon will be drawn, center the board
	var ytop = ((height-bottom_margin)/2)-maxSize/2*ydiff;
	var yint = ytop + (maxSize-minSize+1)*ydiff/2;

	// this is the color breakdown
	var colors = {"sheep.png": 4, "brick.png": 3, "wheat_flash.png": 4, "wood.png": 4, "ore1.png": 3, "desert1.png": 1};
	// this is the number breakdown
	var numbers = [1,2,2,2,2,0,2,2,2,2,1];

	var out = "";
	// draw left half of board
	while (size <= maxSize) {
		var count = 0;
		while (count < size) {
			hexCount++;
			out += createHexagon(colors, numbers, xint,yint + count*ydiff, hex_r, hexCount);
			count++;
		}
		/* move right and up */
		xint += 1.5*hex_r;
		yint -= .5*ydiff;
		size++; // increased number of hexagons in column
	}
	size --;
	xint -= 1.5*hex_r;
	yint += .5*ydiff;

	while (size > minSize) {
		/* move right and down */
		xint += 1.5*hex_r;
		yint += .5*ydiff;
		// decrease number of hexagons in column
		size--;
		var count = 0;
		while (count < size) {
			hexCount++;
			out += createHexagon(colors, numbers, xint,yint + count*ydiff, hex_r, hexCount);
			count++;
		}

	}

	return out;
}
function createSVGheader() {
	return '<svg version = "1.1" overflow="hidden" viewBox="0 0 1000 750" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n';
}
function start(response, postData) {
	console.log("Request handler 'start' was called.");
	var content = "empty";
	
	var body = '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [\n]>\n<html>\n<head>\n<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\n'
	body += createStyle();
	body += '</head>\n<body>';


	body += createSVGheader();
	// draw background
	body += '<image x=0 y=0 width=1000 height=750 xlink:href="http://www.cs.princeton.edu/~dcapra/ocean.jpg"></image>\n'
	body += buildBoard(3,5, 1000, 750);
	body += buildVideoBoxes(1000, 750);
	body += '</svg>'

	/* get textbox svg */
	body += '<div style="width:100%; height:98%; position:absolute; top:0;left:0"><embed src="http://www.cs.princeton.edu/~dcapra/text.svg" type="image/svg+xml" style="postion:absolute;width:100%;height:97%;top:0;left:0"/></div>';

	body +=  '</body>\n</html>';
	response.writeHead(200, {"Content-Type": "text/html"});
  	response.write(body);
  	response.end();
}

function upload(response, postData) {
	console.log("Request handler 'upload' was called.");
  	response.writeHead(200, {"Content-Type": "text/plain"});
  	response.write("Hello Upload: You've sent: " + queryString.parse(postData).text);
 	response.end();
}

exports.start = start
exports.upload = upload
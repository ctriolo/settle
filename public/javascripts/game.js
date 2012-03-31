/**
 * Board Client Side Javascript
 */
var popup = false;
var debug = false;
var player_colors = ["blue", "yellow", "red", "orange"];
function loadPopup(){
  if (!popup) {
    $("#popupBackground").css({"opacity":"0.7"});
    $("#popupBackground").fadeIn("slow");
    $("#buildPopup").fadeIn("slow");
    popup = true;
  }
}

function disablePopup() {
  if (popup){
    $("#popupBackground").fadeOut("slow");
    $("#buildPopup").fadeOut("slow");
    popup = false;
  }
}

function makeSVG(tag, attrs) {
  var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (var k in attrs)
    el.setAttribute(k, attrs[k]);
  return el;
}

window.onload = function() {

  var CONFIG = {
    room: document.location.pathname.substring('game/'.length+1), // current room
  };


  /**
   * Socket IO Connection
   */

  var socket = io.connect('/game');
  socket.on('connect', function() {
    socket.emit('join', CONFIG.room);
  });


  /**
   * Keystrokes
   */

  $(document).keypress(function(event) {
    switch (event.which) {
    case 68:  // d
    case 100: // D
      if (debug) $('.debug').hide();
      else $('.debug').show();
      debug = !debug;
      break;
    case 81: // q
    case 27: // escape
      if (popup) disablePopup();
      break;
    }
  });


  /**
   * Build Menu
   */

  // open pop-up on build click
  $(".build").click(
      function(){
      loadPopup();
      socket.send('Open popup!');
    }
  );
  $("#popupClose").click(
      function(){
      disablePopup();
      socket.send('Closing popup!');
    }
  );
  $("#settlement").click(
    function(){ disablePopup();
      socket.send('Build Settlement');
      socket.emit('settlementSelect', $(this).attr('id'));
    }
  );


  /**
   * Game Socket Senders
   */


  // Messages

  $("#messageForm").submit(
    function() {
      socket.send($("input#messageInput").val());
      $("input#messageInput").val("");
      return false;
    }
  );


  /**
   * Game Socket Listeners
   */


  // Messages

  /**
   * message
   *
   * Messages will be treated like simple chat, should be sanitized, and
   * entered into the message box.
   * @param   message   string   the message
   */
  socket.on('message', function(message) {
    $('#messages').append('<p>'+message+'<p>');
    var objDiv = $('#messages');
    objDiv.scrollTop(objDiv.prop('scrollHeight'));
  });


  // Starting

  /**
   * canStart
   *
   * Lets us know that we can start the game.
   * Attaches an emit('start') onto the the start button and enables it.
   */
  socket.on('canStart', function(can_start) {
    $('#start').removeClass('disabled');
    $('#start').text("Start");
    $('#start').css("background-color", "#05C");
    $('#start').click(function(){
      $('#start').off('click');
      $('#start').remove();
      socket.emit('start');
    });
  });


  /**
   * start
   *
   * Lets us know that we can start the game.
   */
  socket.on('start', function(can_start) {
    $('#start').off('click');
    $('#start').remove();
  });


  // Starting Placements

  /**
   * startingSettlementSelect
   *
   * For every interesection id in `ids`:
   *   - Highlight the intersection
   *   - Add an on click function the sends `settlementPlace` and
   *     returns the intersections back to normal.
   * TODO: add and remove classes to change things like fill and stroke
   * @param   ids   array   the ids of the valid edges
   */
  socket.on('startingSettlementSelect', function(ids) {
    for (var i = 0; i < ids.length; i++) {
      $("#intersection"+ids[i]).css({'fill': 'white'});
      $("#intersection"+ids[i]).click(function() {
        $('.intersection').off('click');
        $('.intersection').css({'fill':'black'});
        var id = parseInt($(this).attr('id').substring('intersection'.length));
        socket.emit('startingSettlementPlacement', id, '0');
      });
    }
  });


  /**
   * startingSettlementPlacement
   *
   * Create a new svg element to represent a new settlement at
   * the intersection id
   * TODO: change color by user
   * TODO: add and remove classes to change things like fill and stroke
   * @param   id   num   the interesection id to draw an element
   */
  socket.on('startingSettlementPlacement', function(id, playerid) {
    var x = $('#intersection' + id).attr('cx');
    var y = $('#intersection' + id).attr('cy');
    var settlement = makeSVG('circle', {
      id: 'settlement' + id,
      cx: x,
      cy : y,
      fill: player_colors[playerid],
      r: '15'
    });
    $('#board').append(settlement);
  });


  /**
   * startingRoadSelect
   *
   * For every edge id in `ids`:
   *   - Highlight the edge
   *   - Add an on click function the sends `startingRoadPlacement` and
   *     returns the edges back to normal.
   * TODO: add and remove classes to change things like fill and stroke
   * TODO: change path to edge so we don't all go insane
   * @param   ids   array   the ids of the valid edges
   */
  socket.on('startingRoadSelect', function(ids) {
      console.log(ids);
    for (var i = 0; i < ids.length; i++) {
      $("#path"+ids[i]).css({'stroke': 'white'});
      $("#path"+ids[i]).click(function() {
        $('.path').off('click');
        $('.path').css({'stroke':'black'});
        var id = parseInt($(this).attr('id').substring('path'.length));
        socket.emit('startingRoadPlacement', id);
      });
    }
  });


  /**
   * startingRoadPlacement
   *
   * Create a new svg element to represent a new road at
   * the edge id
   * TODO: change color by user
   * TODO: add and remove classes to change things like fill and stroke
   * TODO: change path to edge so we don't all go insane
   * @param   id   num   the edge id to draw an element
   */
  socket.on('startingRoadPlacement', function(id, playerid) {
    var x1 = $('#path' + id).attr('x1');
    var y1 = $('#path' + id).attr('y1');
    var x2 = $('#path' + id).attr('x2');
    var y2 = $('#path' + id).attr('y2');
    var road = makeSVG('line', {
      id: 'road' + id,
      'x1': x1,
      'y1': y1,
      'x2': x2,
      'y2': y2,
      'stroke': player_colors[playerid],
      'stroke-width': 10,
    });
    $('#board').append(road);
  });


  // Placements

  /**
   * settlementSelect
   *
   * For every interesection id in `ids`:
   *   - Highlight the intersection
   *   - Add an on click function the sends `settlementPlace` and
   *     returns the intersections back to normal.
   * @param   ids   array   the ids of the valid edges
   */
  socket.on('settlementSelect', function(ids) {
  });


  /**
   * settlementPlacement
   *
   * Create a new svg element to represent a new settlement at
   * the intersection id
   * @param   id   num   the interesection id to draw an element
   */
  socket.on('settlementPlace', function(id) {
  });

};


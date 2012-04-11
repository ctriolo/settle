/**
 * Board Client Side Javascript
 */
var debug = false;
var player_colors = ["blue", "yellow", "red", "orange"];
var users = [];
var me;
var roll_frequency = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var total_rolls = 0.0;

function makeSVG(tag, attrs) {
  var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (var k in attrs)
    el.setAttribute(k, attrs[k]);
  return el;
}

/**
 * cancelCurrentAction
 *
 * Removes click and hover actions and selectable classes from:
 * intersections, edges, hexes, roads, settlements, cities
 */
function cancelCurrentAction() {
  $('.intersection,.edge,.hex,.road,.settlement,.city').removeClass(selectable);
  $('.intersection,.edge,.hex,.road,.settlement,.city').off('hover');
  $('.intersection,.edge,.hex,.road,.settlement,.city').off('click');
};

/**
 * updateFrequencies
 *
 * Updates the bar chart with current frequencies
 */
function updateFrequencies() {
  var max = 0;
  for (var i = 2; i <= 12; i++) {
    if (roll_frequency[i-2]/total_rolls > max)
      max = roll_frequency[i-2]/total_rolls;
  }
  for (var i = 2; i <= 12; i++) {
    $('#bar' + i).height(100*roll_frequency[i-2]/total_rolls/max/1.05 + "%");
  }
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
   * Actions
   */

  $(".roll").click(function(){
    $('.roll-phase, .robber-phase, .steal-phase').hide();
    $('.main-phase').show();
    socket.emit('rollDice');
  });

  // handle stealing
  $(".player.well").click(function(){
    if ($(this).hasClass("enabled")) {
        var id = parseInt($(this).attr('id').substring('player'.length));
        socket.emit('steal', users[id]);

   }
  });

  $(".development").click(function(){
    alert('Not implemented, silly.');
  });

  $(".trade").click(function(){
    alert('Not implemented, silly.');
  });

  $(".end").click(function(){
    socket.emit('endTurn');
  });

  $("#frequencyChart").click(function() {
    if (total_rolls > 0) {
      if ($(this).hasClass("chartShow")) {
        $(".frequency-container").show();
        $(".frequency-container").animate({"right": "30%"}, "slow");
        $(this).removeClass("chartShow");

      }
      else {
        $(".frequency-container").animate({"right": "5%"}, "slow");
        $(this).addClass("chartShow");
        $(".frequency-container").hide();
      }
    }
  });


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
    $("#startBackground").fadeOut("slow");
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
  socket.on('start', function(players, you) {
    users = players.slice(0);
    me = you;

    if (users.indexOf(me) != -1) {
      users.splice(users.indexOf(me), 1); // take out me
      users.unshift(me); // put me first
    }

    for (var i = 0; i < players.length; i++) {
      $('#player' + i).css({"border-color":player_colors[players.indexOf(users[i])]});
	$('#player' + i).css({"border-width":"4px"});
    }

    for (var i = 0; i < users.length; i++) {
      $('#player'+i+' .name').text(users[i].substring(0,5));
    }
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
      $("#intersection"+ids[i]).addClass('selectable');
      $("#intersection"+ids[i]).hover(function(){$(this).addClass('hover')},
                                      function(){$(this).removeClass('hover')});
      $("#intersection"+ids[i]).click(function() {
        $('.intersection').off('click');
        $('.intersection').off('hover');
        $('.intersection').removeClass('selectable');
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
    $('#intersection' + id).hide();
    $('#settlement' + id).show();
    $('#settlement' + id).addClass('player'+playerid);
  });


  /**
   * startingRoadSelect
   *
   * For every edge id in `ids`:
   *   - Highlight the edge
   *   - Add an on click function the sends `startingRoadPlacement` and
   *     returns the edges back to normal.
   * TODO: add and remove classes to change things like fill and stroke
   * @param   ids   array   the ids of the valid edges
   */
  socket.on('startingRoadSelect', function(ids) {
      console.log(ids);
    for (var i = 0; i < ids.length; i++) {
      $("#edge"+ids[i]).addClass('selectable');
      $("#edge"+ids[i]).hover(function(){$(this).addClass('hover')},
                              function(){$(this).removeClass('hover')});
      $("#edge"+ids[i]).click(function() {
        $('.edge').off('click');
        $('.edge').off('hover');
        $('.edge').removeClass('selectable');
        var id = parseInt($(this).attr('id').substring('edge'.length));
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
   * @param   id   num   the edge id to draw an element
   */
  socket.on('startingRoadPlacement', function(id, playerid) {
    $('#edge' + id).hide();
    $('#road' + id).show();
    $('#road' + id).addClass('player'+playerid);
  });


  /**
   * canBuild
   *
   * Update the build dropdown list.
   * @param   can_build   object   associated array of booleans
   */
   socket.on('canBuild', function(can_build) {
     for (var key in can_build) {
       var building = key.toLowerCase();
       var emit = 'select'+key;
       if (can_build[key]) {
         $('#'+building).removeClass('disabled');
         $('#'+building).click(function(){
           var id = $(this).attr('id');
           id = id.charAt(0).toUpperCase() + id.slice(1);
           socket.emit('select'+id);
         });
       } else {
         $('#'+building).addClass('disabled');
         $('#'+building).off('click');
       }
     }
   });


  /**
   * updatePlayerInfo
   *
   * Update player info.
   * @param   players   array
   */
   socket.on('updatePlayerInfo', function(players) {
     console.log(players);

     for (var i = 0; i < players.length; i++) {
       var player = players[i];
       var player_id = users.indexOf(player.user_id);

       // Update Resources
       var total = 0;
       for (var resource in player.resource_cards) {
         var r = resource.toLowerCase();
         if (player.user_id === me) {
           $('#player'+player_id+' .js-'+r+'-number')
             .text(player.resource_cards[resource])
         }
         total += player.resource_cards[resource];
       }
       if (player.user_id !== me) {
         $('#player'+player_id+' .js-resource-number').text(total);
       }

       // Update Roads
       if (player.has_longest_road) {
         $('#player'+player_id+' .js-road-value').addClass('highlight');
       } else {
         $('#player'+player_id+' .js-road-value').removeClass('highlight');
       }
       $('#player'+player_id+' .js-road-value').text(player.longest_road);

       // Update Army
       if (player.has_largest_army) {
         $('#player'+player_id+' .js-army-value').addClass('highlight');
       } else {
         $('#player'+player_id+' .js-army-value').removeClass('highlight');
       }
       $('#player'+player_id+' .js-army-value').text(player.army_size);

       // Update Victory Points


     }
   });


  /**
   * selectSettlement
   *
   * For every interesection id in `ids`:
   *   - Highlight the intersection
   *   - Add an on click function the sends `buildSettlement` and
   *     returns the intersections back to normal.
   * @param   ids   array   the ids of the valid edges
   */
  socket.on('selectSettlement', function(ids) {
    for (var i = 0; i < ids.length; i++) {
      $("#intersection"+ids[i]).addClass('selectable');
      $("#intersection"+ids[i]).hover(function(){$(this).addClass('hover')},
                                      function(){$(this).removeClass('hover')});
      $("#intersection"+ids[i]).click(function() {
        $('.intersection').off('click');
        $('.intersection').off('hover');
        $('.intersection').removeClass('selectable');
        var id = parseInt($(this).attr('id').substring('intersection'.length));
        socket.emit('buildSettlement', id);
      });
    }
  });


  /**
   * selectCity
   *
   * For every intersection id in `ids`:
   *   - Highlight the settlement
   *   - Add an on click function the sends `buildCity` and
   *     returns the settlements back to normal.
   * @param   ids   array   the ids of the valid intersections
   */
  socket.on('selectCity', function(ids) {
    for (var i = 0; i < ids.length; i++) {
      $("#settlement"+ids[i]).addClass('selectable');
      $("#settlement"+ids[i]).hover(function(){$(this).addClass('hover')},
                                    function(){$(this).removeClass('hover')});
      $("#settlement"+ids[i]).click(function() {
        $('.settlement').off('click');
        $('.settlement').off('hover');
        $('.settlement').removeClass('selectable');
        var id = parseInt($(this).attr('id').substring('settlement'.length));
        socket.emit('buildCity', id);
      });
    }
  });


  /**
   * selectRoad
   *
   * For every edge id in `ids`:
   *   - Highlight the edge
   *   - Add an on click function the sends `buildRoad` and
   *     returns the edges back to normal.
   * @param   ids   array   the ids of the valid edges
   */
  socket.on('selectRoad', function(ids) {
    for (var i = 0; i < ids.length; i++) {
      $("#edge"+ids[i]).addClass('selectable');
      $("#edge"+ids[i]).hover(function(){$(this).addClass('hover')},
                              function(){$(this).removeClass('hover')});
      $("#edge"+ids[i]).click(function() {
        $('.edge').off('click');
        $('.edge').off('hover');
        $('.edge').removeClass('selectable');
        var id = parseInt($(this).attr('id').substring('edge'.length));
        socket.emit('buildRoad', id);
      });
    }
  });


  /**
   * buildSettlement
   *
   * Show the svg element that represents a settlement at the intersection id
   * @param   id   num   the intersection id to show the settlement at
   */
  socket.on('buildSettlement', function(id, playerid) {
    $('#intersection' + id).hide();
    $('#settlement' + id).show();
    $('#settlement' + id).addClass('player'+playerid);
  });


  /**
   * buildCity
   *
   * Show the svg element that represents a city at the intersection id
   * @param   id   num   the intersection id to show the city at
   */
  socket.on('buildCity', function(id, playerid) {
    $('#settlement' + id).hide();
    $('#city' + id).show();
    $('#city' + id).addClass('player'+playerid);
  });


  /**
   * buildRoad
   *
   * Show the svg element that represents a road at the edge id
   * @param   id   num   the edge id to show the road at
   */
  socket.on('buildRoad', function(id, playerid) {
    $('#edge' + id).hide();
    $('#road' + id).show();
    $('#road' + id).addClass('player'+playerid);
  });




  // Dice + Resources

  /**
   * rollDiceResults
   *
   * Received the results of the dice roll.
   * @param   number      num      the number rolled
   * @param   resources   object   keys: user ids
   *                               values: resource assoc array
   */
  handleDiceRoll = function(number, resources) {
   // handle robber
    if (number === 7) {
      // Highlight Robber Tokens
      $('.numberToken.robber').addClass('highlight');
      setTimeout(function() {
        $('.numberToken.robber').removeClass('highlight');
      }, 2000);
    }

    // Highlight Tokens
    $('.numberToken.number'+number).addClass('highlight');
    setTimeout(function() {
      $('.numberToken.number'+number).removeClass('highlight');
    }, 2000);

    // update bar chart frequency
    if (number !== 0) {
      total_rolls += 1;
      roll_frequency[number-2] += 1;
      updateFrequencies();
    }

    if (total_rolls == 1) {
      $("#frequencyChart").css({"opacity":"1.0"});
    }
  }

  socket.on('rollDiceResults', function(number, resources, breakdown) {

    if (typeof this.first == 'undefined') {
        // show dice roll
        $('.board-container').append(
        '<div id="dice-image-container">' +
            '<img id="dice-image" src="">' +
        '</div>');
    }
    this.first = 'defined';

    if (typeof breakdown != 'undefined') {
        $('#dice-image').show();
        url = 'http://www.princeton.edu/~rgromero/dice-gif/a' + breakdown[0]
            + ',' + breakdown[1] + '-g50.gif';
        $('#dice-image').attr('src', url);
        setTimeout(function() {
            $('#dice-image').attr('src','');
            $('#dice-image').hide();
            handleDiceRoll(number, resources);
        }, 8 * 1000);
    }

  });

  /**
    * Robber
    * updates robber position
    *
    */
    $(".hex").click(
      function(){
        if(!$(this).hasClass("robber")) {
          var id = parseInt($(this).attr('id').substring('hex'.length));
          socket.emit('updateRobber', id);
       }
      }
    );



    socket.on('showRobber', function() {
      $('.roll-phase, .main-phase, .steal-phase').hide();
      $('.robber-phase').show();
    });

    socket.on('showSteal', function(players) {
      $('.roll-phase, .main-phase, .robber-phase').hide();
      $('.steal-phase').show();
      $('.player.well').addClass("disabled");
      $('#player' + users.indexOf(players[i])).removeClass("disabled");
      for (var i = 0; i < players.length; i++) {
        $('#player' + users.indexOf(players[i])).removeClass("disabled");
        $('#player' + users.indexOf(players[i])).addClass("enabled"); // enable stealing from these player wells
      }
    });
    socket.on('showMain', function() {
      $('.roll-phase, .robber-phase, .steal-phase').hide();
      $('.main-phase').show();
      $('.player.well').removeClass("disabled");
      $('.player.well').removeClass("enabled");
    });

   /**
     * Move Robber
     * handles robber moving css
     * @param	start	number	id of original robber
     * @param	end		boolean	id of new robber
     */
    socket.on('moveRobber', function(start, end) {
      $("#hex" + start).children(".numberToken").removeClass("robber");
      $("#hex" + start).children(".numberToken").removeClass("highlight");
      $("#hex" + end).children(".numberToken").addClass("robber");
    });

   /**
     * stealCard
     * handles card stealing css
     */
    socket.on('stealCard', function(thief, player_id, resource) {
      $('.roll-phase, .robber-phase, .steal-phase').hide();
      $('.main-phase').show();
    });

  /**
    * newTurn
    *
    * updates opacities and highlights for whose turn it is next
    * @param	turn_user	       string    the user whose turn it is
    * @param	starting_phase   boolean   whether or not in starting phase
    */
  socket.on('newTurn', function(turn_user, starting_phase) {

    // Disable action buttons, enable roll if it's this players turn
    if (!starting_phase) {
      if (turn_user == me) {
        $('.roll-phase').show();
        $('.waiting-phase').hide();
      } else {
        $('.roll-phase').hide();
        $('.waiting-phase').show();
      }
      $('.main-phase, .robber-phase, .steal-phase').hide();
    }

    // Remove past highlights, highlight current player
    $('.name.highlight').removeClass('highlight');
    $('#player'+users.indexOf(turn_user)+' .name').addClass('highlight');

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

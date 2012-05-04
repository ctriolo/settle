/**
 * Board Client Side Javascript
 */
var debug = false;
var player_colors = ["blue", "yellow", "red", "orange"];
var users = [];
var me;
var roll_frequency = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var total_rolls = 0.0;
var recent_offer = {};
var done = false;
var ports = [];
var old_title = document.title;
var toRemove = 0;
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

function updatePopup(playerCards, secret) {
    $('.update-card').hide();
    for (var i in playerCards) {
      var index = users.indexOf(parseInt(i));
      var received = playerCards[i].resources;
      if (index !== 0) {
        var tag = '#player' + index;
      }
      else
        var tag = '#update' + index;
      if (playerCards[i].received) {
        $(tag + " .update-cards").addClass("received");
        $(tag + " .update-cards").removeClass("lost");
      }
      else {
        $(tag + " .update-cards").removeClass("received");
        $(tag + " .update-cards").addClass("lost");
      }
      var tot = 0;
      for (var resource in received) {
        var r = resource.toLowerCase();
        tot += received[resource];
        if (received[resource] !== 0 && !secret) {
          $(tag + " .update-cards .js-"+r+'-number').parent().show();
          $(tag +' .update-cards .js-'+r+'-number').text(received[resource]);
        }
      }
      if (secret && tot > 0) {
         $(tag + " .update-cards .js-resource-number").parent().show();
         $(tag + ' .update-cards .js-resource-number').text(tot);
      }
      if (tot > 0) {
        if (index !== 0) {
          $(tag + " .update-container").show();
          $(tag + " .update-container").animate({"right": "100%"}, "slow");
        }
        else {
          $(tag).show();
          $(tag).animate({"right": "40.5%"}, "slow");
        }
      }
    }
    setTimeout(function() {
       $(".update-container").animate({"right": "5%"}, "slow");
       $('.update-container').hide();
       }, 3000);
}

function createPopup(tag, title, content) {
      // set up popups
      $(tag).attr('rel', 'popover');
      $(tag).popover({"animation":false, "placement":"top", "trigger":"manual", "title": title, "selector":true, "content": content, "delay":{"show": 0, "hide":1000}});
}

function createTooltip(tag, content, delay) {
  $(tag).attr('rel', 'tooltip');
  if (!delay)
    $(tag).tooltip({"animation":true, "placement":"top", "trigger":"hover", "title": content, "selector":true, "delay":{"show": 0, "hide":1000}});
  else
     $(tag).tooltip({"animation":true, "placement":"top", "trigger":"hover", "title": content, "selector":true});
}

function updateCards(offer) {
  if (offer) {
    $('.trade-card').each(function() {
      var number = $(this).children('.card-number');
      if (number.text() === "0") {
        $(this).hide();
      }
    });
  }
  else {
    $('.card').each(function() {
      var number = $(this).children('.card-number');
      var class_name = number.attr("class").split(" ");
      if (number.text() === "0") {
        $(this).hide();
        $('.offer-cards .trade-card .' + class_name[1]).parent().hide();
        $('.remove-card .' + class_name[1]).parent().hide();
      }
      else {
        $(this).show();
        $('.offer-cards .trade-card .' + class_name[1]).parent().show();
        $('.remove-card .' + class_name[1]).parent().show();
      }
      if (number.hasClass("js-resource-number")) {
        var num = parseInt(number.text());
        if (num > 7) {
          number.css({"color": "red"});
        }
        else
          number.css({"color": "black"});
      }
    });
    $('.for-cards .trade-card').show();
  }

}
function tradeCleanup() {
    $(".trade-container").animate({"right": "5%"}, "slow");
    $(".tradebtn").addClass("popupShow");
    $(".trade-container").hide();
    $(".tradebtn").removeClass("active");
    $(".trade-card .card-number").text("0");

    $(".showtrade-container").animate({"right": "5%"}, "slow");

    $(".showtrade-container").hide();
    $(".showtrade-card .card-number").text("0");

    $(".offerbtn").removeClass("disabled");
}

/* show main buttons */
function showMainPhase() {
    $('.roll-phase, .robber-phase, .steal-phase, .waiting-phase, .place-phase').hide();
    $('.main-phase').show();
}

/* show place button with specified text */
function showPlacePhase(phrase, showCancel) {
    $(".place-phase button.disabled").text(phrase);
    $(".place-phase").show();
    if (showCancel)
      $('#cancel').show();
    else
      $('#cancel').hide();
    $('.roll-phase, .main-phase, .steal-phase, .waiting-phase, .robber-phase').hide();
}

window.onload = function() {

  /**
   * Socket IO Connection
   */

  var socket = io.connect('/game');
  socket.on('connect', function() {
    socket.emit('join', CONFIG.room, CONFIG.token);
  });


  /**
   * OpenTok
   */
  socket.on('joined', function(apiKey, sessionId, token, myIndex) 
  {
    var session = TB.initSession(sessionId);
    session.addEventListener("sessionConnected", sessionConnectedHandler);
    session.addEventListener("streamCreated", streamCreatedHandler);
    session.connect(apiKey, token);


    /* var publisher; */
    function sessionConnectedHandler(event) {
      h = $('#MY_VIDEO').height();
      w = $('#MY_VIDEO').width();
      session.publish('MY_VIDEO', {height:h, width:w, class:'MY_VIDEO'});
      
      socket.emit('associateMyConnIDwithMyIndex', CONFIG.room, myIndex, session.connection.connectionId); // ot3. send game[index=connID]
      subscribeToStreams(event.streams);
    }

    function streamCreatedHandler(event) { // when each person joins (usually one)
      subscribeToStreams(event.streams);
    }

    function subscribeToStreams(streams) 
    {
      if (typeof subscribeToStreams.nextPlayer == 'undefined')
        subscribeToStreams.nextPlayer = 1;

      for (i = 0; i < streams.length; i++) {
        var stream = streams[i];
        var connId = stream.connection.connectionId;
        
        if (connId != session.connection.connectionId) 
        {
          // EMIT CONNECTION ID TO SERVER, GET PLAYER #
          socket.emit('sendConnIDtoGetPlayerIndex', CONFIG.room, CONFIG.token, connId); // ot5. ask for index from game[connID]
          socket.on('sendPlayerIndexFromConnID', function(index) // ot7. receive index and use to replace correct img
          {
            var playerNo = index;
            if (playerNo < myIndex) playerNo++;
            
            replaceID = 'VIDEO' + playerNo;
            
            h = $('#' + replaceID).height();
            w = $('#' + replaceID).width();
            session.subscribe(stream, replaceID, {height:h, width:w});
            socket.$events['sendPlayerIndexFromConnID'] = null; // GIANT HACKKKKKK
          });
          
          
        }
      }
    }

  });

  /**
   * Dynamic Resizing
   */
  /*
  window.onbeforeunload = function(){
    if (!done)
      return "You're about to leave a game in progess!";
  };
  */
  //dynamicResize();

  window.onresize = dynamicResize;
  function dynamicResize() 
  {
    var theirWidth = -1;

    // player 123 video
    for (var i = 1; i <= 3; i++) {
      pI = document.getElementById('player' + i)
      pIwell = pI.firstChild;
      pIleft = pIwell.firstChild;
      pIvidObj = pIleft.firstChild;

      h = pIwell.clientHeight;
      w = h*4/3.0;
      pIvidObj.setAttribute('width', w);
      pIvidObj.setAttribute('height', h);
      
      theirWidth = w;
    }

    // player 0 video
    p0 = document.getElementById('player0')
    p0well = p0.firstChild;
    p0left = p0well.firstChild;
    p0vidObj = p0left.firstChild;
    
    var myWidth = theirWidth
    var wholeWidth = $('.others').width();
    $('#player0').width(myWidth);
    $('.actions').width( wholeWidth - myWidth )
    //p0.setAttribute('width',theirWidth);

    w1 = p0well.clientWidth
    w2 = p0well.clientHeight*0.6 *4/3.0
    w = Math.min(w1, w2);
    h = w*3/4.0;
    p0vidObj.setAttribute('width', w);
    p0vidObj.setAttribute('height', h);

  }

  window.onresize();

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
    showMainPhase();
    socket.emit('rollDice');
  });

  // handle stealing
  $(".player.well").click(function(){
    if ($(this).hasClass("enabled")) {
        var id = parseInt($(this).parent().attr('id').substring('player'.length));
        socket.emit('steal', users[id]);
   }
  });

  $(".tradebtn").click(function(){
    if ($(this).hasClass("popupShow")) {
      $(".trade-container").show();
      $(this).addClass("active");
      $(".trade-container").animate({"right": "40.5%"}, "slow");
      $(this).removeClass("popupShow");
    }
    else {
      $(this).removeClass("active");
      $(".trade-container").animate({"right": "5%"}, "slow");
      $(this).addClass("popupShow");
      $(".trade-container").hide();
    }
  });

  $(".offerbtn").click(function(){
    $(this).addClass("disabled");
    updateCards(true);
    var offer = {"for": [], "offer":[]};
    $('.trade-container .for-cards .cards .card-number').each(function() {
      offer["for"].push(parseInt($(this).text()));
    });
    $('.trade-container .offer-cards .cards .card-number').each(function() {
      offer["offer"].push(parseInt($(this).text()));
    });
    socket.emit('offerTrade', offer, me);
  });

  socket.on('updatePopup', function(playerCards) {
    updatePopup(playerCards);
  });

  socket.on('removeCards', function(number) {
    // set button text
    $('.removebtn').text('Remove ' + number + ' more cards');
    $('.removebtn').attr('id', number);
    toRemove = number;
    $(".remove-container").show();
    $(".remove-container").animate({"right": "40.5%"}, "slow");
  });

  socket.on('showTrade', function(offer, offerer, type) {
    if (me !== offerer) {
      var player_num = users.indexOf(offerer);
      // get id name of player well
      var player_tag = '#player' + player_num;
      var container = $(player_tag + ' .showtrade-container');
      var acceptable = true;
      container.removeClass("accept");
      container.removeClass("reject");
      // change color based on whether this trade was accepted/rejected/offered
      $(player_tag + " .showtrade-container .trade-actions").show();
      if (type === "accepted")
        container.addClass("accepted");
      else if (type === "rejected") {
        container.addClass("rejected");
        $(player_tag + " .showtrade-container .trade-actions").hide();
      }
      else {
        container.removeClass("accepted");
        container.removeClass("rejected");
      }

      // show the given cards from the offer
      $(player_tag + ' .offer-cards .showtrade-card').each(function(index) {
        if (offer['offer'][index] === 0)
          $(this).hide();
        else {
          $(this).children('.card-number').text(offer['offer'][index]);
          $(this).show();
        }
       });
      $(player_tag + ' .for-cards .showtrade-card').each(function(index) {
        if (offer['for'][index] === 0)
          $(this).hide();
        else {
          // check if player can accept this trade
          var card = $(this).children('.card-number');
          var type = card.attr("class").split(" ")[1];
          var available = parseInt($('.cards .card .' + type).text());
          if (available < offer['for'][index])
            acceptable = false;
          card.text(offer['for'][index]);
          $(this).show();
        }
      });
      if (acceptable)
        $('.acceptTrade').removeClass('disabled');
      else
        $('.acceptTrade').addClass('disabled');
      // animate container pop-up
      $(player_tag + " .showtrade-container").show();
      $(player_tag + " .showtrade-container").animate({"right": "100%"}, "slow");
      recent_offer[player_num] = offer;
    }
  });
  socket.on('tradeCleanup', function() {
     tradeCleanup();
  });
  $(".acceptTrade").click(function() {
    var num1 = parseInt($(this).parents(".player").parent().attr('id').substring('player'.length));
    if (!$(this).hasClass("disabled")) {
      var container = $(this).parents(".showtrade-container");
      container.addClass("accept");
      container.removeClass("reject");
      // check if this is the second accept or not
      if (container.hasClass("accepted"))
        socket.emit('acceptTrade', recent_offer[num1], me, users[num1], "done");
      else
        socket.emit('acceptTrade', recent_offer[num1], me, users[num1], "");
    }
  });
  $(".rejectTrade").click(function() {
    var num1 = parseInt($(this).parents(".player").parent().attr('id').substring('player'.length));
    if (!$(this).hasClass("disabled")) {
      var container = $(this).parents(".showtrade-container");
      container.removeClass("accept");
      container.addClass("reject");
      socket.emit('rejectTrade', recent_offer[num1], me, users[num1]);
    }
  });
  $(".counterTrade").click(function() {
    $('.trade-card').each(function() {
      $(this).children('.card-number').text("0");
    });
    $(".offerbtn").removeClass("disabled");
    updateCards(false);
    $(".trade-container").show();
    $(".trade-container").animate({"right": "40.5%"}, "slow");
    $(this).removeClass("popupShow");
  });

  $(".reset").click(function() {
    $('.trade-card').each(function() {
      $(this).children('.card-number').text("0");
    });
    $(".offerbtn").removeClass("disabled");
    $(".bank").addClass("disabled");
    updateCards(false);
  });

  $('.bank').click(function() {
    if ($(this).hasClass("disabled"))
      return;
    var offer = {"for": [], "offer":[]};
    $('.trade-container .for-cards .cards .card-number').each(function() {
      offer["for"].push(parseInt($(this).text()));
    });
    $('.trade-container .offer-cards .cards .card-number').each(function() {
      offer["offer"].push(parseInt($(this).text()));
    });
    console.log("BANK TRADE**********");
    console.log(offer);
    console.log(me);
    socket.emit('bankTrade', offer, me);
  });

  $(".remove-card").click(function(){
    var num = parseInt($(this).children(".card-number").text());
    var class_name = $(this).children(".card-number").attr("class").split(" ");
    var has_num = parseInt($('.cards .card .' + class_name[1]).text());
    if (has_num > num || $(this).parent().parent().hasClass('for-cards')) {
      var left = parseInt($('.removebtn').attr('id'));
      if (left === 0)
        return;
      $(this).children(".card-number").text(num+1);

      left--;
      if (left === 0) {
        $('.removebtn').text("Accept");
        $('.removebtn').removeClass('disabled');
      }
      else
        $('.removebtn').text("Remove " + left + " more cards");
      $('.removebtn').attr('id', left);
    }
  });

  $(".removebtn").click(function() {
    if ($(this).hasClass("disabled"))
      return;
    $(this).addClass("disabled");
    var removeCards = [];
    var tot = 0;
    $('.remove-card .card-number').each(function() {
      removeCards.push(parseInt($(this).text()));
      tot += parseInt($(this).text());
    });
    $(".remove-container").animate({"right": "5%"}, "slow");
    $(".remove-container").hide();
    $(".remove-card .card-number").text("0");
    socket.emit('removed', removeCards, me, tot);
  });

  socket.on('removeUpdate', function(player, total) {
    var update_object = {};
    var i = total;
    var resource_object = {'Wood':''};
    resource_object['Wood'] = i;
    update_object[player] = {'resources': resource_object, 'received':false}
    updatePopup(update_object, true);
  });

  $(".resetRemove").click(function() {
    $('.remove-card').each(function() {
      $(this).children('.card-number').text("0");
    });

    $('.removebtn').text("Remove " + toRemove + " more cards");
    $('.removebtn').attr('id', toRemove);
    $('.removebtn').addClass("disabled");
    updateCards(false);
  });
  $(".trade-card").click(function(){
    if ($('.offer').hasClass('disabled'))
      return;
    var num = parseInt($(this).children(".card-number").text());
    var class_name = $(this).children(".card-number").attr("class").split(" ");
    var has_num = parseInt($('.cards .card .' + class_name[1]).text());
    if (has_num > num || $(this).parent().parent().hasClass('for-cards')) {
      $(this).children(".card-number").text(num+1);
    }

    // check if banking is allowed
    var for_found = 0; // store number of types of cards offered/desired. (must be 1 for bank trading)
    var offer_found = 0;
    var for_total = 0;
    var offer_total = 0;
    var offer_type = "";

    $('.for-cards .trade-card').each(function() {
      var number = $(this).children('.card-number');
      if (number.text() !== "0") {
        for_found += 1;
        for_total += parseInt(number.text());
      }
    });

    $('.offer-cards .trade-card').each(function() {
      var number = $(this).children('.card-number');
      if (number.text() !== "0") {
        offer_found += 1;
        offer_type = number.attr("class").split(" ")[1];
        offer_total += parseInt(number.text());
      }
    });
    var TypeEnum = {
      "js-wood-number": "Wood21",
      "js-sheep-number": "Sheep21",
      "js-wheat-number": "Wheat21",
      "js-stone-number": "Stone21",
      "js-brick-number": "Brick21",
    }

    if (offer_found !== 1 || for_found !== 1) {
      $('.bank').addClass('disabled');
      return;
    }
    if (offer_total === for_total * 4)
      $('.bank').removeClass('disabled');
    else if (ports.indexOf('Any31') !== -1 && offer_total === for_total * 3)
      $('.bank').removeClass('disabled');
    else if (ports.indexOf(TypeEnum[offer_type]) !== -1 && offer_total === for_total*2)
      $('.bank').removeClass('disabled');
    else
      $('.bank').addClass('disabled');
  });

  $(".end").click(function(){
    socket.emit('endTurn');
    if (!$('.tradebtn').hasClass("popupShow")) {
      $(".trade-container").animate({"right": "5%"}, "slow");
      $(".tradebtn").addClass("popupShow");
      $(".tradebtn").removeClass("active");
      $(".trade-container").hide();
    }
    tradeCleanup();
  });

  $("#frequencyChart").click(function() {
    if (total_rolls > 0) {
      if ($(this).hasClass("chartShow")) {
        $(".frequency-container").show();
        $(".frequency-container").animate({"right": "40.5%"}, "slow");
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
  socket.on('start', function(players, you, user_objects) {
    users = players.slice(0);
    me = you;
    $('.numberDiv').animate({'left': '-=100px'}, 'slow');
    console.log("MOVING");
    if (users.indexOf(me) != -1) {
      var my_user_object = user_objects[users.indexOf(me)];
      user_objects.splice(users.indexOf(me), 1); // take out me
      users.splice(users.indexOf(me), 1); // take out me
      user_objects.unshift(my_user_object); // put me first
      users.unshift(me); // put me first
    }

    // reorder user objects
    var objs = [];
    for (var i = 0; i < users.length; i++) {
      for (var j = 0; j < user_objects.length; j++) {
        if (users[i] == user_objects[j].id) objs.push(user_objects[j]);
      }
    }
    for (var i = users.length; i < 4; i++) {
      console.log("not here: " + i);
      console.log('.player' + i + ' .opponentvideo');
      $('#player' + i + ' .opponentvideo').hide();
      $('#player' + i + ' .right').hide();
      $('#player' + i + ' .well').css({"background-color":"black"});
      $('#player' + i + ' .well').css({"opacity":".6"});
    }
    console.log(users, objs);

    for (var i = 0; i < players.length; i++) {
      $('#player' + i + " .player").css({"border-color":player_colors[players.indexOf(users[i])]});
	$('#player' + i).css({"border-width":"4px"});
    }

    for (var i = 0; i < users.length; i++) {
      $('#player'+i+' .name').text(objs[i].first_name);
    }
    $('#start').off('click');
    $('#start').remove();

    // add tooltips
    createTooltip('.circleAny31', '3 to 1 port');
    createTooltip('.circleWood21', 'Wood port');
    createTooltip('.circleSheep21', 'Sheep port');
    createTooltip('.circleStone21', 'Stone port');
    createTooltip('.circleBrick21', 'Brick  port');
    createTooltip('.circleWheat21', 'Wheat port');

    createTooltip('.stone-card', 'Stone', true);
    createTooltip('.sheep-card', 'Sheep', true);
    createTooltip('.wood-card', 'Wood', true);
    createTooltip('.brick-card', 'Brick', true);
    createTooltip('.wheat-card', 'Wheat', true);
    createTooltip('.developmentcard', 'Development Card', true);


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
      // set up popups
      createPopup("#intersection" + ids[i], "Settlement Placement", "Click this intersection to place a new settlement");
      $("#intersection"+ids[i]).hover(function(){$(this).addClass('hover'); $(this).popover("show"); },
                                      function(){$(this).removeClass('hover'); $(this).popover("hide")});
      $("#intersection"+ids[i]).click(function() {
        $('.intersection').off('click');
        $('.intersection').off('hover');
        $('.intersection').removeClass('selectable');
        $(this).popover('hide');
        var id = parseInt($(this).attr('id').substring('intersection'.length));
        socket.emit('startingSettlementPlacement', id, '0');
      });
    }


    showPlacePhase("Click Intersection to Place Settlement", false);
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
  socket.on('startingSettlementPlacement', function(id, playerid, resources) {
    $('#intersection' + id).hide();
    $('#settlement' + id).show();
    $('#settlement' + id).addClass('player'+playerid);
    updatePopup(resources, false);
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
      createPopup("#edge" + ids[i], "Road Placement", "Click this edge to place a new road");
      $("#edge"+ids[i]).hover(function(){$(this).addClass('hover'); $(this).popover("show")},
                              function(){$(this).removeClass('hover');$(this).popover("hide")});
      $("#edge"+ids[i]).click(function() {
        $('.edge').off('click');
        $('.edge').off('hover');
        $('.edge').removeClass('selectable');
        $(this).popover("hide")
        var id = parseInt($(this).attr('id').substring('edge'.length));
        socket.emit('startingRoadPlacement', id);
      });
    }
    showPlacePhase("Click Edge to Place Road", false);
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
    $(".waiting-phase").show();
    $('.roll-phase, .main-phase, .steal-phase, .place-phase, .robber-phase').hide();
  });

  socket.on('developmentUpdate', function(player) {
    var update_object = {};
    var resource_object = {'Stone':1, 'Wheat':1, 'Sheep':1};
    update_object[player] = {'resources': resource_object, 'received':false}
    updatePopup(update_object, false);
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
           console.log(building + " clicked!");
           var id = $(this).attr('id');

           // DISABLE IMMEDIATELY TO STOP FROM BEING CLICKED TWICE
           $('#'+id).off('click');
           $('#'+id).addClass('disabled');

           id = id.charAt(0).toUpperCase() + id.slice(1);
           if (id === "Development") {
             socket.emit('buildDevelopment');
           }
           else socket.emit('select'+id);
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
   socket.on('updatePlayerInfo', function(players, unbuilt_developments) {
     console.log(players);
     for (var i = 0; i < players.length; i++) {
       var player = players[i];
       var player_id = users.indexOf(player.user_id);
       // update Victory Points
       var victory_points = player.victory_points;
       console.log(victory_points);
       if (player.has_longest_road) victory_points += 2;
       if (player.has_largest_army) victory_points += 2;
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
         // update victory point total
         $('#player'+player_id+' .js-victory-value').text(victory_points);
         victory_points += player.victory_cards;
       }
       // update ports array
       else {
         $('#victoryCards .amount').text(player.victory_cards);
         ports = player.ports;
         // see your own victory cards
         victory_points += player.victory_cards;
         // make your own cards red if over 7
         if (total > 7) {
           $('#player'+player_id+' .card-number').css({"color": "red"});
         }
         else
           $('#player'+player_id+' .card-number').css({"color": "black"});
         // update victory point total
         $('#player'+player_id+' .js-victory-value').text(victory_points);
       }

       // Update Developments
       if (player.user_id == me) {
         for (var key in player.development_cards) {
           var victory_cards = ['Market', 'University', 'Library', 'Palace', 'Chapel'];
           var id = key.charAt(0).toLowerCase() + key.slice(1);
           if (!player.played_development &&
               player.development_cards[key] -
               player.pending_development_cards[key] > 0) {
             if (key == 'Knight') {
               $('.roll-phase .knight').removeClass('disabled');
               $('.roll-phase .knight').click(function(){
                 socket.emit('playKnight');
               });
             }
             $('#'+id).removeClass('disabled');
             $('#'+id).click(function(){
               var id = $(this).attr('id');
               id = id.charAt(0).toUpperCase() + id.slice(1);
               socket.emit('play'+id);
             });
           } else {
             if (key == 'Knight') {
               $('.roll-phase .knight').addClass('disabled');
               $('.roll-phase .knight').off('click');
             }
             $('#'+id).addClass('disabled');
             $('#'+id).off('click');
           }
           $('#'+id+' .amount').text(player.development_cards[key]);
         }
       }

       // Show dev cards in the list
       var total_dev = 0;
       for (var key in player.development_cards) {
         total_dev += player.development_cards[key];
       }
       $('#player'+player_id+' .js-development-number').text(total_dev);
       if (total_dev == 0) $('#player'+player_id+' .js-development-number').hide();
       else $('#player'+player_id+' .js-development-number').show();

       if (player.user_id == me) {
         $('#settlement .amount').text(player.unbuilt_settlements);
         $('#city .amount').text(player.unbuilt_cities);
         $('#road .amount').text(player.unbuilt_roads);
         $('#development .amount').text(unbuilt_developments);
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

     	updateCards(false);
	if (victory_points >= 10) {
          console.log("GAME OVER");
          $('#startBackground').css("background", '#000000');
          $('#startBackground').show();
          if (player.user_id === me) {
            $('#win').addClass("won");
          }
          else {
            $('#win').addClass('loss');
            var name = $('#player' + player_id + ' .name').text();
            $('#win .txt').text(name + " has won.");
          }
          $('#win').show();
          $('#lobby').show();
          socket.emit('gameover', player.user_id);
          done = true;
        }
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
      // set up popups
      createPopup("#intersection" + ids[i], "Settlement Placement", "Click this intersection to place a new settlement");

      $("#intersection"+ids[i]).hover(function(){$(this).addClass('hover'); $(this).popover('show');},
                                      function(){$(this).removeClass('hover'); $(this).popover('hide');});
      $("#intersection"+ids[i]).click(function() {
        $('.intersection').off('click');
        $('.intersection').off('hover');
        $(this).popover('hide');
        $('.intersection').removeClass('selectable');
        var id = parseInt($(this).attr('id').substring('intersection'.length));
        socket.emit('buildSettlement', id);
      });
    }
    showPlacePhase("Click Intersection to Place Settlement", true);
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
    showPlacePhase("Click a Settlement to Place City", true);
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
    showPlacePhase("Click Edge to Place Road", true);
    for (var i = 0; i < ids.length; i++) {
      $("#edge"+ids[i]).addClass('selectable');
      createPopup("#edge" + ids[i], "Road Placement", "Click this edge to place a new road");
      $("#edge"+ids[i]).hover(function(){$(this).addClass('hover'); $(this).popover('show')},
                              function(){$(this).removeClass('hover'); $(this).popover('hide')});
      $("#edge"+ids[i]).click(function() {
        $('.edge').off('click');
        $('.edge').off('hover');
        $(this).popover('hide');
        $('.edge').removeClass('selectable');
        var id = parseInt($(this).attr('id').substring('edge'.length));
        socket.emit('buildRoad', id);
      });
    }
  });

  $('#cancel').click(function() {
    $(".edge").removeClass('selectable');
    $('.settlement').removeClass('selectable');
    $('.intersection').removeClass('selectable');
    socket.emit('cancelBuild');
    showMainPhase();
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
  socket.on('buildCity', function(id, playerid, player) {
    $('#settlement' + id).hide();
    $('#city' + id).show();
    $('#city' + id).addClass('player'+playerid);
    if (player) {
      var update_object = {};
      var resource_object = {'Stone':3, 'Wheat':2};
      update_object[player] = {'resources': resource_object, 'received':false}
      updatePopup(update_object, false);
    }
  });



  /**
   * buildRoad
   *
   * Show the svg element that represents a road at the edge id
   * @param   id   num   the edge id to show the road at
   */
  socket.on('buildRoad', function(id, playerid, player) {
    $('#edge' + id).hide();
    $('#road' + id).show();
    $('#road' + id).addClass('player'+playerid);
    if (player) {
      var update_object = {};
      var resource_object = {'Wood':1, 'Brick':1};
      update_object[player] = {'resources': resource_object, 'received':false}
      updatePopup(update_object, false);
    }
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
    updatePopup(resources, false);
    updateCards(false);
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
      var parent = document.getElementById('list-container');
      var rollElement = document.createElement('div');
      rollElement.setAttribute('class', 'rollElement');
      rollElement.innerHTML = number;
      parent.insertBefore(rollElement, parent.firstChild);
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
            + ',' + breakdown[1] + '_mod6.gif';
        $('#dice-image').attr('src', url);
        setTimeout(function() {
            handleDiceRoll(number, resources);
            $('#dice-image').attr('src','');
            $('#dice-image').hide();
        }, 4 * 1000);
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

    $('.list').click(
      function() {
        if (!$(this).hasClass('active')) {
          $('#list-container').show();
          $('.bar-container').hide();
          $('.label-container').hide();
          $(this).addClass('active');
          $('.chart').removeClass('active');
        }
      });
    $('.chart').click(
      function() {
        if (!$(this).hasClass('active')) {
          $('#list-container').hide();
          $('.bar-container').show();
          $('.label-container').show();
          $(this).addClass('active');
          $('.list').removeClass('active');
        }
      });

    socket.on('showRobber', function(removeWaiting) {
      $('.roll-phase, .main-phase, .steal-phase').hide();
      $('.robber-phase').show();
      if (removeWaiting) {
        $('.robber-phase .btn').text("Waiting for Players to Remove Cards");
      }
      else
        $('.robber-phase .btn').text("Move the Robber");
      $('.numberToken.robber').addClass('highlight');
    });

    socket.on('showSteal', function(players) {
      $('.roll-phase, .main-phase, .place-phase, .robber-phase').hide();
      $('.steal-phase').show();
      $('.actions').addClass("disabled");
      $('.player.well').addClass("disabled");
      for (var i = 0; i < players.length; i++) {
        $('#player' + users.indexOf(players[i]) + " .player.well").removeClass("disabled");
        $('#player' + users.indexOf(players[i]) + " .player.well").addClass("enabled"); // enable stealing from these player wells
      }
    });
    socket.on('showMain', function() {
      showMainPhase();
      $('.actions').removeClass("disabled");
      $('.player.well').removeClass("disabled");
      $('.player.well').removeClass("enabled");
    });

    socket.on('showDice', function() {
      showMainPhase();
      $('.actions').removeClass("disabled");
      $('.player.well').removeClass("disabled");
      $('.player.well').removeClass("enabled");
      $('.main-phase').hide();
      $('.roll-phase').show();
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
      $('.roll-phase, .robber-phase, .place-phase, .steal-phase').hide();
      $('.main-phase').show();
      var update_object = {};
      var resource_object = {};
      var r = resource;
      resource_object[r] = 1;
      update_object[thief] = {'resources': resource_object, 'received':true}
      update_object[player_id] = {'resources': resource_object, 'received':false}
      updatePopup(update_object, true);
    });


  /**
   * Year of plenty
   *
   */
  socket.on('yearOfPlentyFirst', function() {
    $('.main-phase').hide();
    $('.year-of-plenty-phase').show();
    var RESOURCES = ['brick', 'stone', 'wheat', 'wood', 'sheep'];
    for (var i = 0; i < RESOURCES.length; i++) {
      $('.year-of-plenty-phase .'+RESOURCES[i]).click(function(){
        var resource = '';
        var RESOURCES = ['brick', 'stone', 'wheat', 'wood', 'sheep'];

        // need to figure out which button was clicked
        for (var i = 0; i < RESOURCES.length; i++) {
          if ($(this).hasClass(RESOURCES[i])) resource = RESOURCES[i];
        }

        // DISABLE IMMEDIATELY TO STOP FROM BEING CLICKED TWICE
        $('.year-of-plenty-phase button').off('click');

        resource = resource.charAt(0).toUpperCase() + resource.slice(1);
        socket.emit('playYearOfPlentyFirst', resource);
      });
    }
  });

  socket.on('yearOfPlentySecond', function() {
    var RESOURCES = ['brick', 'stone', 'wheat', 'wood', 'sheep'];
    for (var i = 0; i < RESOURCES.length; i++) {
      $('.year-of-plenty-phase .'+RESOURCES[i]).click(function(){
        var resource = '';
        var RESOURCES = ['brick', 'stone', 'wheat', 'wood', 'sheep'];

        // need to figure out which button was clicked
        for (var i = 0; i < RESOURCES.length; i++) {
          if ($(this).hasClass(RESOURCES[i])) resource = RESOURCES[i];
        }

        // DISABLE IMMEDIATELY TO STOP FROM BEING CLICKED TWICE
        $('.year-of-plenty-phase button').off('click');

        resource = resource.charAt(0).toUpperCase() + resource.slice(1);
        socket.emit('playYearOfPlentySecond', resource);
      });
    }
  });

  socket.on('yearOfPlentyDone', function() {
    $('.year-of-plenty-phase').hide();
    $('.main-phase').show();
  });


  /**
   * Monopoly
   **/

  socket.on('monopoly', function() {
    $('.main-phase').hide();
    $('.monopoly-phase').show();
    var RESOURCES = ['brick', 'stone', 'wheat', 'wood', 'sheep'];
    for (var i = 0; i < RESOURCES.length; i++) {
      $('.monopoly-phase .'+RESOURCES[i]).click(function(){
        var resource = '';
        var RESOURCES = ['brick', 'stone', 'wheat', 'wood', 'sheep'];

        // need to figure out which button was clicked
        for (var i = 0; i < RESOURCES.length; i++) {
          if ($(this).hasClass(RESOURCES[i])) resource = RESOURCES[i];
        }

        // DISABLE IMMEDIATELY TO STOP FROM BEING CLICKED TWICE
        $('.monopoly-phase button').off('click');

        resource = resource.charAt(0).toUpperCase() + resource.slice(1);
        socket.emit('chooseMonopolyResource', resource);
      });
    }
  });

  socket.on('monopolyDone', function() {
    $('.monopoly-phase').hide();
    $('.main-phase').show();
  });


  /**
   * Road Building
   **/

  socket.on('roadBuildingFirst', function(ids) {
    $('.main-phase').hide();
    $('.road-building-phase').show();
    for (var i = 0; i < ids.length; i++) {
      $("#edge"+ids[i]).addClass('selectable');
      createPopup("#edge" + ids[i], "Road Placement", "Click this edge to place a new road");
      $("#edge"+ids[i]).hover(function(){$(this).addClass('hover'); $(this).popover('show')},
                              function(){$(this).removeClass('hover'); $(this).popover('hide')});
      $("#edge"+ids[i]).click(function() {
        $('.edge').off('click');
        $('.edge').off('hover');
        $(this).popover('hide');
        $('.edge').removeClass('selectable');
        var id = parseInt($(this).attr('id').substring('edge'.length));
        socket.emit('playRoadBuildingFirst', id);
      });
    }
  });


  socket.on('roadBuildingSecond', function(ids) {
    for (var i = 0; i < ids.length; i++) {
      $("#edge"+ids[i]).addClass('selectable');
      createPopup("#edge" + ids[i], "Road Placement", "Click this edge to place a new road");
      $("#edge"+ids[i]).hover(
        function(){$(this).addClass('hover'); $(this).popover('show')},
        function(){$(this).removeClass('hover'); $(this).popover('hide')}
      );
      $("#edge"+ids[i]).click(function() {
        $('.edge').off('click');
        $('.edge').off('hover');
        $(this).popover('hide');
        $('.edge').removeClass('selectable');
        var id = parseInt($(this).attr('id').substring('edge'.length));
        socket.emit('playRoadBuildingSecond', id);
      });
    }
  });


  socket.on('roadBuildingDone', function() {
    $('.main-phase').show();
    $('.road-building-phase').hide();
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
        document.title = "Your turn!";
        $('#startBackground').css("background", 'lime');
        $('#startBackground').show();
        $('#startBackground').fadeOut('slow');


      } else {
        $('.roll-phase').hide();
        $('.waiting-phase').show();
        document.title = old_title;
      }
      $('.main-phase, .robber-phase, .steal-phase').hide();
    }
    else {
      $(".waiting-phase").show();
      $('.roll-phase, .main-phase, .steal-phase, .place-phase, .robber-phase').hide();
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

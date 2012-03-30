/**
 * Board Client Side Javascript
 */
var popup = false;
var debug = false;
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
    room: document.location.pathname.substring('board'.length+1), // current room
  };

  var socket = io.connect('/board');
  socket.on('connect', function() {
    socket.emit('join', CONFIG.room);
  });

  socket.on('message', function(message) {
    $('#messages').append('<p>'+message+'<p>');
    var objDiv = $('#messages');
    objDiv.scrollTop(objDiv.prop('scrollHeight'));
  });

  // Hovering
  $(".path,.intersection,.hex,.port").not(".Sea").hover(
    function(){ socket.emit('hoverOn', $(this).attr('id')); },
    function(){ socket.emit('hoverOff', $(this).attr('id')); }
  );
  socket.on('hoverOn',  function(id) { $('#'+id).addClass("hover"); });
  socket.on('hoverOff', function(id) { $('#'+id).removeClass("hover"); });
 
 // On click
  $(".path,.hex,.port").not(".Sea").click(
    function(){
      socket.send('Someone just clicked ' + $(this).attr('id') + ' ' + $(this).css("fill") + '.');
    }		
  );
  // On click
  $(".intersection").not(".Sea").click(
    function(){
      var color = $(this).css("fill");
      if (color === "#ffffff") {
        // have to remove "Intersection from id"
	var intersect = "intersection";
        socket.emit('settlementPlace', $(this).attr('id').substring(intersect.length));
      }
    }		
  );
	
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
  socket.on('settlementSelect', function(id) {
    $('.intersection').css({"fill":"white", "stroke":"white"}) });
  socket.on('settlementPlace', function(id) { 
    $('.intersection').css({"fill":"black", "stroke":"black"});
    var x = $('#intersection' + id).attr('cx');
    var y = $('#intersection' + id).attr('cy');
    socket.send(x + " " + y);
    var settlement = makeSVG('circle', {
        id: 'settlement' + id,
	cx: x,
	cy : y,
	fill: 'blue',
	r: '10'
    });
    document.getElementById('s').appendChild(settlement);
  });

  $("#messageForm").submit(
    function() {
      socket.send($("input#messageInput").val());
      $("input#messageInput").val("");
      return false;
    }
  );

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

};


/**
 * Board Client Side Javascript
 */

var debug = false;

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
  $(".path,.intersection,.hex,.port").not(".Sea").click(
    function(){
      socket.send('Someone just clicked ' + $(this).attr('id') + '.');
    }
  );

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
    }
  });

};


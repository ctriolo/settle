/**
 * Board Client Side Javascript
 */

var debug = false;

window.onload = function() {

  var socket = io.connect('/board');
  socket.on('connect', function() {
    socket.emit('message', 'A client connected.');
  });

  socket.on('message', function(message) {
    $('#messages').append('<p>'+message+'<p>');
    var objDiv = $('#messages');
    objDiv.scrollTop(objDiv.prop('scrollHeight'));
  });

  // On hover
  $(".path,.intersection,.hex,.port").not(".Sea").hover(
    function(){
      $(this).addClass("hover");
    },
    function(){
      $(this).removeClass("hover");
    }
  );

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


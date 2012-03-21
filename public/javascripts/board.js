/**
 * Board Client Side Javascript
 */

window.onload = function() {

  var socket = io.connect('/board');
  socket.on('connect', function() {
    socket.emit('message', 'A client connected.');
  });

  socket.on('message', function(message) {
    console.log(message);
  });

  // On hover
  $(".path,.intersection,.hex").not(".Sea").hover(
    function(){
      $(this).addClass("hover");
    },
    function(){
      $(this).removeClass("hover");
    }
  );

  // On click
  $(".path,.intersection,.hex").not(".Sea").click(
    function(){
      socket.send('I just clicked a ' + $(this).attr('class')); // Change this to IDs once we have them
    }
  );

};


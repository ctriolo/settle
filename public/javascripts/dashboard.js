window.onload = function() {

  /**
   * Socket IO Connection
   */

  var socket = io.connect('/dashboard');
  socket.on('connect', function() {
    socket.emit('joinDashboard');
  });

  socket.on('disconnect', function() {
    window.location = 'http://www.cs.princeton.edu/~ctriolo/333.html';
  });

  socket.on('updateDashboard', function(games) {
    $('.thumbnails').children().remove();
    for (var i = 0; i < games.length; i++) {
      var game_id = games[i].id;
      var player_pics = [];
      for (var j = 0; j < 4; j++) {
        var pic = games[i].players.length > j
          ? 'http://graph.facebook.com/' + games[i].players[j].user_id + '/picture?type=square'
          : "http://i.imgur.com/TFOqB.jpg";
        player_pics.push(pic);
      }
      node = '<li class="span2"><a href="/game/'+game_id+'" class="thumbnail"><div class="row"><div class="span2"><img src="'+player_pics[0]+'" class="small"><img src="'+player_pics[1]+'" class="small"></div></div><div class="row"><div class="span2"><img src="'+player_pics[2]+'" class="small"><img src="'+player_pics[3]+'" class="small"></div></div></a></li>';
      $('.thumbnails').append(node);
    }
    console.log(games);
  });

};

function createTooltip(tag, content, delay) {
  $(tag).attr('rel', 'tooltip');
  if (!delay)
    $(tag).tooltip({"animation":true, "placement":"top", "trigger":"hover", "title": content, "selector":true, "delay":{"show": 0, "hide":1000}});
  else
     $(tag).tooltip({"animation":true, "placement":"top", "trigger":"hover", "title": content, "selector":true});
}

window.onload = function() {

  /**
   * Socket IO Connection
   */

  var socket = io.connect('/dashboard');
  socket.on('connect', function() {
    socket.emit('joinDashboard');
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
      console.log("***************GAME ID: " + game_id);
      node = '<li class="span2"><a href="/game/'+game_id+'" class="thumbnail"><div class="row"><div class="span2"><img src="'+player_pics[0]+'" class="small" id="img0a'+game_id+'"><img src="'+player_pics[1]+'" class="small" id="img1a' + game_id + '"></div></div><div class="row"><div class="span2"><img src="'+player_pics[2]+'" class="small" id="img2a' + game_id + '"><img src="'+player_pics[3]+'" class="small" id="img3a' + game_id + '"></div></div></a></li>';
      $('.thumbnails').append(node);
      for (var j = 0; j < games[i].players.length; j++) {
        createTooltip('#img' + j + 'a' + game_id, games[i].players[j].first_name + " " + games[i].players[j].last_name + ': ( <span class="wins">' + games[i].players[j].wins + '</span> - <span class="loses">' + games[i].players[j].losses + "</span> )", true);
      }

    }
    console.log(games);
  });

};

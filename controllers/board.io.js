/**
 * Board Server Side Socket IO
 */

var rooms = {};

module.exports = function(sockets) {

  sockets.on('connection', function(socket) {

    socket.on('join', function(room) {
      socket.join(room);
      rooms[socket.id] = room;
      sockets.to(rooms[socket.id]).emit('message', 'A client just connected.');
    });

    socket.on('message', function(message) {
      sockets.to(rooms[socket.id]).emit('message', message);
    });

    socket.on('hoverOn', function(id) {
      sockets.to(rooms[socket.id]).emit('hoverOn', id);
    });

    socket.on('hoverOff', function(id) {
      sockets.to(rooms[socket.id]).emit('hoverOff', id);
    });
  });

};

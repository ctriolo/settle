/**
 * Board Server Side Socket IO
 */

module.exports = function(sockets) {

  sockets.on('connection', function(socket) {
    socket.on('message', function(message) {
      sockets.emit('message', message);
    });
  });

};

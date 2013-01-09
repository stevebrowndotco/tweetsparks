function socketClient(clientID) {
  var socket = io.connect('http://localhost:3000');

// on connection to server, ask for user's name with an anonymous callback
  socket.on('connect', function(){
    // call the server-side function 'adduser' and send one parameter (value of prompt)
    // socket.emit('adduser', prompt("What's your name?"));
      bindAll(socket);
      socket.emit('adduser', clientID);
  });

// listener, whenever the server emits 'updatechat', this updates the chat body
  socket.on('updatechat', function (username, data) {
    $('#conversation').append('<b>'+username + ':</b> ' + data + '<br>');
    // chat scrollDown
    var el = document.getElementById("conversation");
    el.scrollTop = el.scrollHeight;
  });

// listener, whenever the server emits 'updaterooms', this updates the room the client is in
  socket.on('updaterooms', function(rooms, current_room) {
    $('#rooms').empty();
    $.each(rooms, function(key, value) {
      if(value == current_room){
        //$('#rooms').append('<div>' + value + '</div>');
      }
      else {
        //$('#rooms').append('<div><a href="#" onclick="switchRoom(\''+value+'\')">' + value + '</a></div>');
      }
    });
  });

  function switchRoom(room){
    socket.emit('switchRoom', room);
  }
}
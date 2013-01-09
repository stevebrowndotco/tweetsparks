/**
 * Created with JetBrains WebStorm.
 * User: enzodonofrio
 * Date: 03/01/2013
 * Time: 15:57
 * To change this template use File | Settings | File Templates.
 */

  // Binds
function bindAll(socket) {
  // when the client clicks SEND
  $('#datasend').click( function() {
    var message = $('#data').val();
    $('#data').val('');
    // tell server to execute 'sendchat' and send along one parameter
    socket.emit('sendchat', message);
  });

  // when the client hits ENTER on their keyboard
  $('#data').keypress(function(e) {
    if(e.which == 13) {
      $(this).blur();
      $('#datasend').focus().click();
    }
  });
}




var isStreamActive = false,
    twitCount      = 1,
    layout_output  = 2; // 1)text 2)underscore_tmpl 3)steve glx


function socketClient() {
  var socket = io.connect('http://localhost:3000');

  /* LISTENERS ACTIONS */

  // on server connection
  socket.on('connect', function(){
      $("#serverStatus").html("Connected with Node Server 1.1");
      requestClient(socket);
      //socket.emit('reqnick', "barackobama");
  });


  // listener, whenever the server emits 'status', this updates the status body
  socket.on('updatestatus', function (data, others) {
    console.log('update status request ', data, others);
    twitCount = 1;
    $("#streamingList").empty();
    $('#serverStatus').html('sent request for '+ data + ' on twitter');
    $("#serverStatus").append("<div id='twitCounter'>Tweet : (<span id='count'>0</span>)</div>");
    isStreamActive = true;
  });

  socket.on('startStreaming', function(data){
    _.each(data.statuses, function(val, key){
      var profile_template = _.template($("#post-twitter-preview-template").html());
      val.divcount = twitCount;
      $("#streamingList").prepend(profile_template(twitterFriendly(val)));
      $(".twitonstream").fadeIn();
      if (twitCount > 7) {
        var counter = twitCount-6;
        $("#divcount"+counter).remove();
      }
      twitCount++
    });
  });

  socket.on('addTwet', function(data) {
    console.log('twitt received', data);
    if (data.text != null) {
      $("#count").html(twitCount++);
      if (layout_output == 1) {
        $("#streamingList").append("<div class='twitonstream'> - "+ data.text +"</div>");
      } else if (layout_output == 2) {
        var profile_template = _.template($("#post-twitter-preview-template").html());
        data.divcount = twitCount;
        $("#streamingList").prepend(profile_template(twitterFriendly(data)));
        $(".twitonstream").fadeIn();
        if (twitCount > 7) {
          var counter = twitCount-6;
          $("#divcount"+counter).remove();
        }
      }

    }
  });

}





/*EMIT REQUEST FOR SERVER NODE - IO*/
function requestClient(socket) {

  // bind request new nick
  $("#nickreq").on('click', function(e){
    e.preventDefault();
    setTimeout(function(){socket.emit('reqnick', $("#twittnick").val());}, 50);
  });

}


/* Others functions */
function twitterFriendly(data) {

  console.log(data.entities);

  _.each(data.entities.hashtags, function(val, key){
    data.text = data.text.replace("#"+val.text, "<span class='tw-hashtag'>#"+val.text+"</span> ");
  });

  _.each(data.entities.user_mentions, function(val, key){
    data.text = data.text.replace("@"+val.screen_name, "<span class='tw-tagname'>@"+val.screen_name+"</span> ");
  });

  return data;
}








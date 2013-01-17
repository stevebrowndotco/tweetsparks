/**
 * Created with JetBrains WebStorm.
 * User: enzodonofrio
 * Date: 16/01/2013
 * Time: 12:33
 * To change this template use File | Settings | File Templates.
 */

// --- EXPRESS CONFIGURATION --- //

var express = require("express");
var io = require('socket.io');
var twitter = require('twit');


var app = express()
  , server = require('http').createServer(app)
  , io = io.listen(server);


app.use('/public', express.static(__dirname + '/public'));

// simple logger
app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
  next();
});

// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

server.listen(3000);


/* node Twitter */
// initialize production
//var twit = new twitter({
//  consumer_key:'cy9k3PN1bL9zqXR9rZJ6Fw',
//  consumer_secret:'wsQhQrDAbfJousnjO0XSfBgdqiOFwhieejKBc6Qsk',
//  access_token:'719832314-c0bDUILSAh7l7oSXgSTZbqZbMVrBPfwSTbyaJUfd',
//  access_token_secret:'wQs4X0GWhPf3mQCzkDHpuD6UES5R3wvdWLLJXLBM'
//});
// initialize dev
var twit = new twitter({
  consumer_key:'6FzFeYv6LDFHXemQxj54Q',
  consumer_secret:'yn5IH7tiJiAfFVoXD6tEncx84obCRcU4MeuHKy2FdTE',
  access_token:'719832314-3ujUuM4hTKZbXZLlQoo3lrckaDmCW9exKudfZFfJ',
  access_token_secret:'LBwQrWvpGKw6d2CrUzUOZ0ygt44ZnggLDXKu6tRH36k'
})

var userLockup = new Array();
var stream = twit.stream('statuses/sample');
startStreaming(); // <--- start streaming

// twit streaming listening for new tweet
function startStreaming() {
  stream.on('tweet', function (tweet) {
//    if (tweet.user != undefined) {
//      io.sockets.broadcast.to(tweet.user).emit('tweets', formatOutput(tweet));
//    }
    //io.sockets.broadcast.to(tweet.user).emit('tweets', formatOutput(tweet));
    io.sockets.emit('tweets', formatOutput(tweet));
  })
}

// io.sockets.emit('tweets', formatOutput(tweet));

var webGl = true;
function formatOutput(tweet) {
  if (webGl) {
    console.log(tweet);

    var glTweet = {};
    glTweet._id = tweet.id;
    glTweet.original = tweet;
    if (tweet.user != undefined ) {
      glTweet.followers = tweet.user.followers_count;
      glTweet.text = tweet.text;
      glTweet.user = tweet.user.name;
      glTweet.image = normalizeImg(tweet.user.profile_image_url);
      glTweet.created_at = tweet.created_at;
    } else {
      glTweet.followers = null;
      glTweet.text = null;
      glTweet.user = null;
    }


    return glTweet;
  } else {
    return tweet;
  }
}

function normalizeImg(img) {
  var normalized = img.replace('_replace', '');
  return normalized;
};


// client connected
io.sockets.on('connection', function (socket) {
  console.log("client connected");

  socket.on('adduser', function(userid, streamRoom){
    // store the username in the socket session for this client
    socket.username = userid;
    // store the room name in the socket session for this client
    socket.room = streamRoom;
    // send client to room 1
    socket.join(streamRoom);

  });

  /* request last 10 twitter of client */
  socket.on('reqnick', function (nickname) {
    console.log('received request : reqnick -> ', nickname);

    // update room for receive broadcast
    socket.leave(socket.room);
    socket.join(nickname);
    // update socket session room title
    socket.room = nickname;

    stream.stop();
    twit.get('users/search', { q: nickname }, function(err, reply) {
      for (var i = 0; i < reply.length; i++) {
        var item = reply[i];
        if (item.screen_name.toLowerCase() == nickname) {
          userLockup[0] = item;
          socket.emit('userStartLockup', userLockup);
          socket.broadcast.emit('userStartLockup', userLockup);
        }
      }
    });

    twit.get('search/tweets', { q: nickname }, function(err, reply) {
      if (reply.statuses) {
        for (var i = 0; i < reply.statuses.length; i++) {
          element = reply.statuses[i];
          socket.emit('startStreaming', formatOutput(element));
          socket.broadcast.emit('startStreaming', formatOutput(element));
        }
      }
      stream = twit.stream('statuses/sample');
      startStreaming();
      //setTimeout(function(){ stream.stop(); }, 2000);
    });

  });


// client disconnected
  socket.on('disconnect', function() {
    console.log('client disconnected');
    socket.leave(socket.room);
  });

});


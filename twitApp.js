/**
 * Created with JetBrains WebStorm.
 * User: enzodonofrio
 * Date: 07/01/2013
 * Time: 10:58
 * To change this template use File | Settings | File Templates.
 */

/**
 * Created with JetBrains WebStorm.
 * User: enzodonofrio
 * Date: 02/01/2013
 * Time: 15:59
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


/* nTwitter */
// initialize
var twit = new twitter({
  consumer_key:'cy9k3PN1bL9zqXR9rZJ6Fw',
  consumer_secret:'wsQhQrDAbfJousnjO0XSfBgdqiOFwhieejKBc6Qsk',
  access_token:'719832314-c0bDUILSAh7l7oSXgSTZbqZbMVrBPfwSTbyaJUfd',
  access_token_secret:'wQs4X0GWhPf3mQCzkDHpuD6UES5R3wvdWLLJXLBM'
});

// launch the twitter streaming
var defaultnick = "barackobama";
var userLockup = new Array();
checkUser();
/*Open new stream*/
var stream = twit.stream('statuses/filter', { track: defaultnick });
startStreaming(); // <--- start streaming with barackObama


function checkUser() {
  twit.get('users/search', { q: defaultnick }, function(err, reply) {
    for (var i = 0; i < reply.length; i++) {
      var item = reply[i];
      if (item.screen_name.toLowerCase() == defaultnick) {
        userLockup.push(item);
      }
    }
  });
}

// twit streaming listening for new tweet
function startStreaming() {
  stream.on('tweet', function (tweet) {
    io.sockets.emit('tweets', formatOutput(tweet));
  })
}

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

  socket.emit('userStartLockup', userLockup);
  stream.stop();
  twit.get('search/tweets', { q: defaultnick }, function(err, reply) {
    if (reply.statuses) {
      for (var i = 0; i < reply.statuses.length; i++) {
        element = reply.statuses[i];
        socket.emit('startStreaming', formatOutput(element));
        socket.broadcast.emit('startStreaming', formatOutput(element));
      }
    }
    stream = twit.stream('statuses/filter', { track: defaultnick });
    startStreaming();
  })

  socket.on('reqnick', function (nickname) {
    console.log('received request : reqnick -> ', nickname);
    // we tell the client to execute 'update Server status' with 1 parameters

    defaultnick = nickname;

    stream.stop(); // stop the precedent stream

    twit.get('users/search', { q: defaultnick }, function(err, reply) {
      for (var i = 0; i < reply.length; i++) {
        var item = reply[i];
        if (item.screen_name.toLowerCase() == defaultnick) {
          userLockup[0] = item;
          socket.emit('userStartLockup', userLockup);
          socket.broadcast.emit('userStartLockup', userLockup);
        }
      }
    });

    twit.get('search/tweets', { q: defaultnick }, function(err, reply) {
      if (reply.statuses) {
        for (var i = 0; i < reply.statuses.length; i++) {
          element = reply.statuses[i];
          socket.emit('startStreaming', formatOutput(element));
          socket.broadcast.emit('startStreaming', formatOutput(element));
        }
      }
      stream = twit.stream('statuses/filter', { track: nickname }); // assign new search
      startStreaming();
    });

  });

// client disconnected
  socket.on('disconnect', function() {
    console.log('client disconnected');
  });

});

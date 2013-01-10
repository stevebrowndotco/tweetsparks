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
var defaultnick = "cheese";
/*Open new stream*/
var stream = twit.stream('statuses/filter', { track: defaultnick })
startStreaming(); // <--- start streaming with barackObama


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
    if (tweet.user != undefined ) {
      glTweet.followers = tweet.user.followers_count;
      glTweet.text = tweet.text;
      glTweet.user = tweet.user.name;
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


// client connected
io.sockets.on('connection', function (socket) {
  console.log("client connected");

  stream.stop();
  twit.get('search/tweets', { q: defaultnick }, function(err, reply) {
    socket.emit('startStreaming', formatOutput(reply));
    stream = twit.stream('statuses/filter', { track: defaultnick });
    startStreaming();
  })

  socket.on('reqnick', function (nickname) {
    console.log('received request : reqnick -> ', nickname);
    // we tell the client to execute 'update Server status' with 1 parameters
    socket.emit('updatestatus', nickname);
    socket.broadcast.emit('updatestatus', nickname);

    defaultnick = nickname;

    twit.get('search/tweets', { q: defaultnick }, function(err, reply) {
      socket.emit('startStreaming', formatOutput(reply));
      socket.broadcast.emit('startStreaming', formatOutput(reply));
    })

    stream.stop(); // stop the precedent stream
    stream = twit.stream('statuses/filter', { track: nickname }); // assign new search
    startStreaming();
  });

// client disconnected
  socket.on('disconnect', function() {
    console.log('client disconnected');
  });

});

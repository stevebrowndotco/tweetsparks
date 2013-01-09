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
var twitter = require('ntwitter');


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
  access_token_key:'719832314-c0bDUILSAh7l7oSXgSTZbqZbMVrBPfwSTbyaJUfd',
  access_token_secret:'wQs4X0GWhPf3mQCzkDHpuD6UES5R3wvdWLLJXLBM'
});

/*Socket.IO listener actions*/
twit.verifyCredentials(function(data) {
    console.log(data);
  }).updateStatus('Test tweet from node-twitter/' + twitter.VERSION,
  function(data) {
    console.log(data);
  }
);

// launch the twitter streaming
var defaultnick = "barackobama";
/*Open new stream*/
var twitStream;
startStreaming(defaultnick); // <--- start streaming with barackObama


// client connected
io.sockets.on('connection', function (socket) {
  console.log("client connected");

  socket.on('reqnick', function (nickname) {
    console.log('received request : reqnick -> ', nickname);
    // we tell the client to execute 'update Server status' with 1 parameters
    socket.emit('updatestatus', nickname);
    socket.broadcast.emit('updatestatus', nickname);
    twitStream.destroy();
    setTimeout(function() { startStreaming(nickname) }, 100);

  });

// close streaming
  socket.on('closeStream', function(){
    console.log('--------- CLOSE STREAMING ------------');
    twitStream.destroy();
  });

// client disconnected
  socket.on('disconnect', function() {
    console.log('client disconnected');
  });

});


function startStreaming (nickname) {
  twit.stream('user', {track:nickname}, function(stream) {
    twitStream = stream;
    stream.on('data', function (data) {
      //console.log(data);
      io.sockets.emit('addTwet', data);
    });
    stream.on('end', function (response) {
      // Handle a disconnection
    });
    stream.on('destroy', function (response) {
      // Handle a 'silent' disconnection from Twitter, no end/error event fired
    });

    //setTimeout(function() {stream.destroy; twStreaming(io.sockets)}, 15000);
  });
}
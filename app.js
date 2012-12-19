/* Author: Steve */

// Express vars

var express = require('express')
    , routes = require('./routes')
    , http = require('http')
    , path = require('path')
    , ntwitter = require('ntwitter')

// Mongo Vars

var mongo = require('mongodb')
    , mongoServer = new mongo.Server('localhost', 27017)
    , db = new mongo.Db('tweetData', mongoServer)

// App Vars

var app = express();

var server = http.createServer(app);

// Socket.io Vars

var io = require('socket.io').listen(server);

//

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('secretsession'));
    app.use(express.session());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

app.get('/', routes.index);

// Let's go

function init() {

    console.log(process.env.PWD);
    console.log("Getting Tweet Data");

    if ( process.env.PWD == '/github/node-twitter') {

        console.log('ENVIRONMENT: this is development');

        var twit = new ntwitter({
            consumer_key:'cy9k3PN1bL9zqXR9rZJ6Fw',
            consumer_secret:'wsQhQrDAbfJousnjO0XSfBgdqiOFwhieejKBc6Qsk',
            access_token_key:'719832314-c0bDUILSAh7l7oSXgSTZbqZbMVrBPfwSTbyaJUfd',
            access_token_secret:'wQs4X0GWhPf3mQCzkDHpuD6UES5R3wvdWLLJXLBM'
        });

    } else {

        console.log('ENVIRONMENT: this is production');

        var twit = new ntwitter({
            consumer_key:'6FzFeYv6LDFHXemQxj54Q',
            consumer_secret:'yn5IH7tiJiAfFVoXD6tEncx84obCRcU4MeuHKy2FdTE',
            access_token_key:'719832314-3ujUuM4hTKZbXZLlQoo3lrckaDmCW9exKudfZFfJ',
            access_token_secret:'LBwQrWvpGKw6d2CrUzUOZ0ygt44ZnggLDXKu6tRH36k'
        });

    }



    twit
        .verifyCredentials(function (err, data) {
            console.log("Verifying Credentials...");
            if (err)
                console.log("Verification failed : " + err)
        })

        // This connects to twitter api, and streams tweets based on a filter
        .stream('statuses/filter', {'track':'barackobama'}, function (stream) {

            stream.on('data', function (data) {

                console.log(data.text + ' followers: ' + data.user.followers_count);

                //This saves the tweets to a mongoDB

                mongo.MongoClient.connect("mongodb://localhost:27017/tweetData", function (err, db) {

                    var collection = db.collection('tweets');

                    collection.insert({'text':data.text, 'followers':data.user.followers_count}, function () {
                        if (err) {
                            console.log(err);
                        }
                    })

                    console.log('saved tweets to database');

                })

            });

        });

}

//This detects when there are new tweets added to the database, and pushes it to the client using socket.io

db.open(function (err) {

    if (err) throw err;

    db.collection('tweets', function (err, collection) {
        if (err) throw err;

        var latest = collection.find({}).sort({ $natural:-1 }).limit(1);

        latest.nextObject(function (err, doc) {
            if (err) throw err;

            var query = { _id:{ $gt:doc._id }};

            var options = { tailable:true, awaitdata:true, numberOfRetries:-1 };
            var cursor = collection.find(query, options).sort({ $natural:1 });

            (function next() {

                cursor.nextObject(function (err, message) {
                    if (err) throw err;
                    console.log('new tweet in database detecetd');
                    io.sockets.on('connection', function(socket) {
                        socket.emit('tweets', message);
                    })

                    next();

                });
            })();
        });
    });

});


//

init();

//Listening on port 3000
server.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
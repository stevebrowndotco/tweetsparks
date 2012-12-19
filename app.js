/**
 * Module dependencies.
 Added
 1. ntwitter - package for using Twitter API
 2. url - used to parse out different parts of URLs
 */

var express = require('express')
    , http = require('http')
    , path = require('path')
    , ntwitter = require('ntwitter')

//

    var mongo = require('mongodb')
    , mongoServer = new mongo.Server('localhost', 27017)
    , db = new mongo.Db('tweetData', mongoServer)

//

var app = express();

var server = http.createServer(app);

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.use(express.logger('dev'));
    app.use(express.session());
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

function init() {

    console.log("Getting Tweet Data");

    var twit = new ntwitter({
        consumer_key:'6FzFeYv6LDFHXemQxj54Q',
        consumer_secret:'yn5IH7tiJiAfFVoXD6tEncx84obCRcU4MeuHKy2FdTE',
        access_token_key:'719832314-3ujUuM4hTKZbXZLlQoo3lrckaDmCW9exKudfZFfJ',
        access_token_secret:'LBwQrWvpGKw6d2CrUzUOZ0ygt44ZnggLDXKu6tRH36k'
    });

    twit
        .verifyCredentials(function (err, data) {
            console.log("Verifying Credentials...");
            if (err)
                console.log("Verification failed : " + err)
        })
        .stream('statuses/filter', {'track' : 'barackobama'}, function(stream) {

            stream.on('data', function (data) {

                console.log(data.text + ' followers: '+ data.user.followers_count);

                db.open(function(err, client){
                    client.createCollection("tweets", function(err, col) {
                        col.insert({'text' : data.text, 'followers' : data.user.followers_count });
                        db.close();
                    });
                });

            });

        });

}

db.open(function(err) {

    if (err) throw err;

    db.collection('tweets', function(err, collection) {
        if (err) throw err;

        var latest = collection.find({}).sort({ $natural: -1 }).limit(1);

        latest.nextObject(function(err, doc) {
            if (err) throw err;

            var query = { _id: { $gt: doc._id }};

            var options = { tailable: true, awaitdata: true, numberOfRetries: -1 };
            var cursor = collection.find(query, options).sort({ $natural: 1 });

            (function next() {
                cursor.nextObject(function(err, message) {
                    if (err) throw err;
                    console.log('new entry detected');
                    next();
                });
            })();
        });
    });

});

init();


server.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});


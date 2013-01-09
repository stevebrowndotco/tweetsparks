var express = require('express'),
    cons = require('consolidate'),
    app = express();

//var engines = require('consolidate');
app.engine('html', cons.underscore);

// simple logger
//app.use(function(req, res, next){
//  console.log('%s %s', req.method, req.url);
//  next();
//});

//// configure application
//app.configure(function(){
//  app.set('title', 'My Application');
//});

// application launch
app.get('/', function(req, res) {
  res.render('index2');
});


app.listen(3000);
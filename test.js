var express = require("express");
var mustache = require("./mustache.js");

var tmpl = {
    compile: function (source, options) {
        if (typeof source == 'string') {
            return function(options) {
                options.locals = options.locals || {};
                options.partials = options.partials || {};
                if (options.body) // for express.js > v1.0
                    locals.body = options.body;
                return mustache.to_html(
                    source, options.locals, options.partials);
            };
        } else {
            return source;
        }
    },
    render: function (template, options) {
        template = this.compile(template, options);
        return template(options);
    }
};

var app = express.createServer();

app.configure(function() {
    app.use(express.methodOverride());
    app.use(express.bodyDecoder());
    app.use(app.router);
    app.set("views", __dirname);
    app.set("view options", {layout: false});
    app.register(".html", tmpl);
    app.use(express.errorHandler({
        dumpExceptions:true,
        showStack:true
    }));
});

app.get("/", function(req, res) {
    res.render("index.html", {
        locals: {
            message: "Hello World!",
            items: ["one", "two", "three"]
        },
        partials: {
            foo: "<h1>{{message}}</h1>",
            bar: "<ul>{{#items}}<li>{{.}}</li>{{/items}}</ul>"
        }
    });
});

app.listen(3001);
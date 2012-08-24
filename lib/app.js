'use strict';

var express = require('express');
var http = require('http');
var sf = require('sf');
var path = require('path');
var browserify = require('browserify');

module.exports = function (opts) {
  var app = express();

  app.configure(function () {
    app.set('port', opts['port'] || 9000);
    app.set('views', path.join(__dirname, '../web/views'));
    app.set('view engine', 'ejs');
    app.use(browserify({ require: path.join(__dirname, 'browserify.js') }));
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, '../web/public')));
  });

  require('./routes')(app);

  var server = http.createServer(app).listen(app.get('port'), function () {
    console.info(sf("Express server listening http://localhost:{0}/", app.get('port')));
  });
};

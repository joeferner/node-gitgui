#!/usr/bin/env node
'use strict';

var openport = require('openport');
var appjs = require('appjs');
var path = require('path');

var optimist = require('optimist');

var args = optimist
  .alias('h', 'help')
  .alias('h', '?')
  .argv;

if (args.help) {
  optimist.showHelp();
  return process.exit(-1);
}

var repo = args._[0];

openport.find(function (err, port) {
  require('../lib/app')({
    port: port
  });

  appjs.serveFilesFrom(path.join(__dirname, '../web/public'));

  var window = appjs.createWindow({
    width: 1400,
    height: 800,
    icons: path.join(__dirname, 'icons'),
    url: 'http://localhost:' + port + '/?repo=' + encodeURIComponent(repo)
  });

  window.on('create', function () {
    console.log("Window Created");
    window.frame.show();
    window.frame.center();
  });

  window.on('ready', function () {
    console.log("Window Ready");
    window.require = require;
    window.process = process;
    window.module = module;
    window.addEventListener('keydown', function (e) {
      if (e.keyIdentifier === 'F12') {
        window.frame.openDevTools();
      }
    });
  });

  window.on('close', function () {
    console.log("Window Closed");
    process.exit(0);
  });
});


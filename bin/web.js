#!/usr/bin/env node

'use strict';

var optimist = require('optimist');

var args = optimist
  .alias('h', 'help')
  .alias('h', '?')
  .options('port', {
    alias: 'p',
    string: true,
    describe: 'The port to run the server on.',
    default: 9000
  })
  .options('repo', {
    string: true,
    describe: 'The path to the root of the repo.'
  })
  .argv;

if (args.help) {
  optimist.showHelp();
  return process.exit(-1);
}

if (!args.repo) {
  console.error("repo argument is required");
  return process.exit(-2);
}

require('../lib/app')(args);

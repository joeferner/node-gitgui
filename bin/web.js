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
  .argv;

if (args.help) {
  optimist.showHelp();
  return process.exit(-1);
}

require('../lib/app')(args);

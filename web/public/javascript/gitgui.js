'use strict';

$(function () {
  var gitRepo = require('../web/public/javascript/gitRepo')();
  var gitLog = require('../web/public/javascript/gitLog')(gitRepo);
  var mainTree = require('../web/public/javascript/mainTree')(gitRepo);
  require('../web/public/javascript/layout')(gitRepo, gitLog, mainTree);
});

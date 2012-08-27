'use strict';

function showError(err) {
  if (err) {
    alert(err);
  }
}

function showMessage(message) {
  alert(message);
}

function escapeHtml(str) {
  if (!str) {
    return str;
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

$(function () {
  var gitRepo = require('../web/public/javascript/gitRepo')();
  var gitLog = require('../web/public/javascript/gitLog')(gitRepo);
  var mainTree = require('../web/public/javascript/mainTree')(gitRepo);
  var fileView = require('../web/public/javascript/fileView')(gitRepo, gitLog);
  var diffView = require('../web/public/javascript/diffView')(gitRepo, fileView);
  require('../web/public/javascript/layout')(gitRepo, gitLog, mainTree);
});

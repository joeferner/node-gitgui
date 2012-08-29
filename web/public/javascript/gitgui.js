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
  var repoPath = getRepoPath();
  var gitRepo = require('../web/public/javascript/gitRepo')(repoPath);
  var gitLog = require('../web/public/javascript/gitLog')(gitRepo);
  var mainTree = require('../web/public/javascript/mainTree')(gitRepo);
  var fileView = require('../web/public/javascript/fileView')(gitRepo, gitLog);
  var diffView = require('../web/public/javascript/diffView')(gitRepo, fileView);
  require('../web/public/javascript/layout')(gitRepo, gitLog, mainTree);
});

function getRepoPath() {
  return getParameterByName('repo') || '.';
}

function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.search);
  if (results == null) {
    return "";
  }
  else {
    return decodeURIComponent(results[1].replace(/\+/g, " "));
  }
}

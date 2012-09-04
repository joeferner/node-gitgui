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
  document.title = 'NodeGitGui - ' + repoPath;

  var main = {
    showError: showError,
    showMessage: showMessage,
    escapeHtml: escapeHtml
  };

  main.refresh = function () {
    main.layout.refresh();
  };

  main.confirm = function (message) {
    return window.confirm(message);
  }

  main.gitRepo = require('../web/public/javascript/gitRepo')(repoPath);
  main.gitLog = require('../web/public/javascript/gitLog')(main.gitRepo);
  main.mainTree = require('../web/public/javascript/mainTree')(main, main.gitRepo);
  main.fileView = require('../web/public/javascript/fileView')(main, main.gitRepo, main.gitLog);
  main.diffView = require('../web/public/javascript/diffView')(main.gitRepo, main.fileView);
  main.layout = require('../web/public/javascript/layout')(main.gitRepo, main.gitLog, main.mainTree);
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

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

$(function() {
  var repoPath = getRepoPath();
  document.title = 'NodeGitGui - ' + repoPath;

  var main = window.gitgutMain = {
    showError: showError,
    showMessage: showMessage,
    escapeHtml: escapeHtml
  };

  main.hideLoadingAndShowError = function(err) {
    main.hideLoading();
    if (err) {
      return main.showError(err);
    }
  };

  main.showLoading = function(message) {
    message = message || 'Loading...';
    $('#loadingMessage').html(message);
    $('#loadingDialog').dialog('open');
    $('#loadingDialog').dialog('widget').find(".ui-dialog-titlebar").hide();
  };

  main.hideLoading = function() {
    $('#loadingDialog').dialog('close');
  };

  $('#loadingDialog').dialog({
    autoOpen: false,
    modal: true,
    height: 'auto',
    width: 'auto',
    resizable: false
  });

  main.refresh = function(callback) {
    main.layout.refresh(callback);
  };

  main.confirm = function(message) {
    return window.confirm(message);
  };

  main.gitRepo = require('../web/public/javascript/gitRepo')(main, repoPath);
  main.gitLog = require('../web/public/javascript/gitLog')(main, main.gitRepo);
  main.mainTree = require('../web/public/javascript/mainTree')(main, main.gitRepo);
  main.fileView = require('../web/public/javascript/fileView')(main, main.gitRepo, main.gitLog);
  main.diffView = require('../web/public/javascript/diffView')(main, main.gitRepo, main.fileView);
  main.layout = require('../web/public/javascript/layout')(main, main.gitRepo, main.gitLog, main.mainTree);

  // the mainTree will already be loading so no need to call refresh on that
  main.showLoading();
  main.gitLog.refresh(function() {
    main.hideLoading();
  });
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

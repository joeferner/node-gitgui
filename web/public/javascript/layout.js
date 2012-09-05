'use strict';

var async = require('async');
var activityTimer = require('../web/public/javascript/activityTimer');

module.exports = function (main, gitRepo, gitLog, mainTree) {
  return new Layout(main, gitRepo, gitLog, mainTree);
};

function Layout(main, gitRepo, gitLog, mainTree) {
  var self = this;
  this.main = main;
  this.gitRepo = gitRepo;
  this.gitLog = gitLog;
  this.mainTree = mainTree;

  var defaults = {
    paneClass: "pane",
    resizerClass: "resizer",
    togglerClass: "toggler",
    buttonClass: "button",
    hideTogglerOnSlide: true,
    enableCursorHotkey: false
  };

  $('body').layout({
    applyDefaultStyles: false,
    fxName: "slide",
    fxSettings_open: { easing: "easeInQuint" },
    fxSettings_close: { easing: "easeOutQuint" },
    north__fxName: "none",
    center__paneSelector: ".outer-center",
    defaults: defaults,
    north: {
      minSize: 93,
      maxSize: 93,
      spacing_open: 1,
      togglerLength_open: 0,
      togglerLength_closed: -1,
      resizable: false,
      slidable: false
    },
    west: {
      togglerAlign_closed: "top",
      togglerLength_open: 0
    },
    center__childOptions: {
      defaults: defaults,
      south: {
        togglerAlign_closed: "left",
        togglerLength_open: 0,
        size: 400
      },
      center__paneSelector: ".middle-center",
      south__paneSelector: ".middle-south",
      south__childOptions: {
        defaults: defaults,
        west: {
          size: 400
        },
        west__paneSelector: ".middle-south-west",
        center__paneSelector: ".middle-south-center"
      }
    }
  });

  $().Ribbon();

  $('#toolbarRefresh').click(this.actionRefresh.bind(this));
  $('#toolbarCommit').click(this.localCommit.bind(this));
  $('#toolbarStash').click(this.localStash.bind(this));
  $('#toolbarTag').click(this.localTag.bind(this));
  $('#toolbarFetch').click(this.remoteFetch.bind(this));
  $('#toolbarPull').click(this.remotePull.bind(this));
  $('#toolbarPush').click(this.remotePush.bind(this));

  $('#commitDialog').dialog({
    autoOpen: false,
    modal: true,
    height: 'auto',
    width: 'auto',
    open: function () {
      $('#commitDialogMessage').focus().select();
    },
    buttons: {
      "Cancel": function () {
        $('#commitDialog').dialog('close');
      },
      "Commit": this.localCommitDo.bind(this),
      "Commit And Push": this.localCommitAndPushDo.bind(this)
    }
  });

  $('#stashDialog').dialog({
    autoOpen: false,
    modal: true,
    height: 'auto',
    width: 'auto',
    open: function () {
      $('#stashDialogMessage').focus().select();
    },
    buttons: {
      "Cancel": function () {
        $('#stashDialog').dialog('close');
      },
      "Stash": this.localStashDo.bind(this)
    }
  });

  $('#tagDialog').dialog({
    autoOpen: false,
    modal: true,
    height: 'auto',
    width: 'auto',
    open: function () {
      $('#tagDialogName').focus().select();
    },
    buttons: {
      "Cancel": function () {
        $('#tagDialog').dialog('close');
      },
      "Tag": this.localTagDo.bind(this)
    }
  });

  activityTimer.add(this.refreshStatus.bind(this), {
    activityInterval: 10 * 1000, // 10seconds
    noActivityInterval: 1 * 60 * 60 * 1000 // 1hour
  });
  this.refreshStatus();
}

Layout.prototype.actionRefresh = function () {
  var self = this;
  self.main.showLoading("Refreshing...");
  self.refresh(function () {
    self.main.hideLoading();
  });
};

Layout.prototype.localStash = function () {
  $('#stashDialog').dialog('open');
};

Layout.prototype.localStashDo = function () {
  var self = this;
  var stashName = $('#stashDialogMessage').val();
  if (!stashName) {
    return showMessage('You must specify a name.');
  }
  self.gitRepo.stash(stashName, function (err) {
    if (err) {
      return showError(err);
    }
    self.refresh(showError);
    $('#stashDialog').dialog('close');
  });
};

Layout.prototype.localTag = function () {
  var selectRow = this.gitLog.getSelectedRow();
  if (!selectRow || !selectRow.id) {
    return showMessage("Invalid commit selected to tag.");
  }
  $('#tagDialogCommitId').val(selectRow.id);
  $('#tagDialogCommit').html(selectRow.id + ' - ' + selectRow.message);
  $('#tagDialog').dialog('open');
};

Layout.prototype.localTagDo = function () {
  var self = this;
  var commitId = $('#tagDialogCommitId').val();
  var tagName = $('#tagDialogName').val();
  var tagDescription = $('#tagDialogDescription').val();
  if (!tagName) {
    return showMessage('You must specify a name.');
  }
  self.gitRepo.tag(commitId, tagName, tagDescription, function (err) {
    if (err) {
      return showError(err);
    }
    self.refresh(showError);
    $('#tagDialog').dialog('close');
  });
};

Layout.prototype.localCommit = function () {
  $('#commitDialog').dialog('open');
};

Layout.prototype.localCommitDo = function () {
  var self = this;
  var commitMessage = $('#commitDialogMessage').val();
  if (!commitMessage) {
    return showMessage('You must specify a message.');
  }
  self.main.showLoading('Committing...');
  self.gitRepo.commit(commitMessage, function (err) {
    if (err) {
      self.main.hideLoading();
      return showError(err);
    }
    self.refresh(function (err) {
      self.main.hideLoading();
      if (err) {
        return showError(err);
      }
      $('#commitDialog').dialog('close');
    });
  });
};

Layout.prototype.localCommitAndPushDo = function () {
  var self = this;
  var commitMessage = $('#commitDialogMessage').val();
  if (!commitMessage) {
    return showMessage('You must specify a message.');
  }
  self.gitRepo.commit(commitMessage, function (err) {
    if (err) {
      return showError(err);
    }
    self.gitRepo.push(function (err) {
      if (err) {
        return showError(err);
      }
      self.refresh(showError);
      $('#commitDialog').dialog('close');
    });
  });
};

Layout.prototype.remoteFetch = function () {
  var self = this;
  self.gitRepo.fetch(function (err) {
    if (err) {
      return showError(err);
    }
    self.refresh(showError);
  });
};

Layout.prototype.remotePull = function () {
  var self = this;
  self.gitRepo.pull(function (err) {
    if (err) {
      return showError(err);
    }
    self.refresh(showError);
  });
};

Layout.prototype.remotePush = function () {
  var self = this;
  self.gitRepo.push(function (err) {
    if (err) {
      return showError(err);
    }
    self.refresh(showError);
  });
};

Layout.prototype.refreshStatus = function (callback) {
  callback = callback || function () {};
  this.gitRepo.getStatus(function (err, status) {
    positionCount('#toolbarPull', '#toolbarPullCount');
    positionCount('#toolbarPush', '#toolbarPushCount');
    if (err) {
      $('#toolbarPullCount').html('?');
      $('#toolbarPullCount').show();
      $('#toolbarPushCount').html('?');
      $('#toolbarPushCount').show();
      return callback(err);
    }

    if (status.behindBy === 0) {
      $('#toolbarPullCount').hide();
    } else {
      $('#toolbarPullCount').html(status.behindBy);
      $('#toolbarPullCount').show();
    }

    if (status.aheadBy === 0) {
      $('#toolbarPushCount').hide();
    } else {
      $('#toolbarPushCount').html(status.aheadBy);
      $('#toolbarPushCount').show();
    }

    return callback();
  });
};

function positionCount(forSelector, countSelector) {
  var loc = $(forSelector).offset();
  var width = $(forSelector).width();
  var countWidth = $(countSelector).width();
  loc.left += width - countWidth;
  $(countSelector).offset(loc);
}

Layout.prototype.refresh = function (callback) {
  callback = callback || showError;
  async.parallel([
    this.mainTree.refresh.bind(this.mainTree),
    this.gitLog.refresh.bind(this.gitLog),
    this.refreshStatus.bind(this)
  ], callback);
};
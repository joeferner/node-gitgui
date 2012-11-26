'use strict';

var sf = require('sf');
var util = require("util");
var events = require("events");

module.exports = function(main, gitRepo, gitLog) {
  return new FileView(main, gitRepo, gitLog);
};

function FileView(main, gitRepo, gitLog) {
  var self = this;
  this.main = main;
  events.EventEmitter.call(this);
  this.gitRepo = gitRepo;
  this.gitLog = gitLog;
  this.commitId = null;

  gitLog.on('logRowSelected', function(data) {
    self.refresh();
  });
  $('#fileView').dataTable({
    bJQueryUI: true,
    sPaginationType: "full_numbers",
    bFilter: false,
    bInfo: false,
    bLengthChange: false,
    bPaginate: false,
    bProcessing: true
  });
  this.filesTable = $('#fileView').dataTable();
  $('#fileView_wrapper .fg-toolbar').hide();
  $('#fileView').bind('contextmenu', this.showContextMenu.bind(this));
}
util.inherits(FileView, events.EventEmitter);

FileView.prototype.showContextMenu = function(e) {
  var self = this;
  e.preventDefault();
  $(e.target).click();

  var menu = {
  };
  var selectedLogRow = self.gitLog.getSelectedRow();
  if (selectedLogRow && !selectedLogRow.id) {
    var selectedFileName = self.getSelectedFilename();

    if (selectedFileName.action == 'M') {
      menu.checkout = {
        label: 'Check Out',
        icon: '/image/context-checkout.png',
        action: function() {
          if (self.main.confirm('Are you sure you want to checkout "' + selectedFileName.filename + '", your local changes will be lost?')) {
            return self.checkoutLocalFile(selectedFileName.filename);
          }
        }
      };
    }

    menu.delete = {
      label: 'Delete',
      icon: '/image/context-delete.png',
      action: function() {
        if (self.main.confirm('Are you sure you want to delete "' + selectedFileName.filename + '"?')) {
          return self.deleteLocalFile(selectedFileName.filename);
        }
      }
    };
  }

  if (Object.keys(menu).length > 0) {
    $.vakata.context.show(menu, $('#fileView'), e.pageX, e.pageY, this, $('#fileView'));
  }
  return false;
};

FileView.prototype.deleteLocalFile = function(filename, callback) {
  var self = this;
  callback = callback || this.main.hideLoadingAndShowError;
  this.gitRepo.deleteLocalFile(filename, function(err) {
    if (err) {
      return callback(err);
    }
    self.refresh();
    // todo: if this is the last file we need to refresh the log as well
    return callback();
  });
};

FileView.prototype.checkoutLocalFile = function(filename, callback) {
  var self = this;
  callback = callback || this.main.hideLoadingAndShowError;
  this.gitRepo.checkoutLocalFile(filename, function(err) {
    console.log('checkoutLocalFile complete: ', filename);
    if (err) {
      return callback(err);
    }
    self.refresh();
    // todo: if this is the last file we need to refresh the log as well
    return callback();
  });
};

FileView.prototype.getSelectedFilename = function() {
  var row = this.filesTable.$('tr.row_selected').get(0);
  var data = this.filesTable.fnGetData(row);
  if (!data) {
    return null;
  }
  return {
    action: data[0],
    staged: data[1],
    filename: data[2]
  };
};

FileView.prototype.refresh = function(callback) {
  var self = this;
  callback = callback || this.main.hideLoadingAndShowError;
  var row = this.gitLog.getSelectedRow();
  this.filesTable.fnClearTable();

  this.commitId = row.id;
  this.gitRepo.getCommitInfo(row.id || 'workingCopy', function(err, commitInfo) {
    if (err) {
      return callback(err);
    }
    var commitInfoHtml = '';
    commitInfoHtml += '<div class="commitInfo-field"><span class="commitInfo-fieldTitle">ID:</span> ' + (commitInfo.id || 'Working Copy') + '</div>';
    if (commitInfo.id) {
      var dateStr = '';
      if (commitInfo.committerDate) {
        dateStr = new Date(commitInfo.committerDate);
      }
      commitInfoHtml += '<div class="commitInfo-field"><span class="commitInfo-fieldTitle">Committer:</span> ' + escapeHtml(commitInfo.committer || '') + '</div>';
      commitInfoHtml += '<div class="commitInfo-field"><span class="commitInfo-fieldTitle">Date:</span> ' + dateStr + '</div>';
    }

    (commitInfo.parents || []).forEach(function(parentId) {
      commitInfoHtml += '<div class="commitInfo-field"><span class="commitInfo-fieldTitle">Parent:</span> ' + parentId + '</div>';
    });
    (commitInfo.children || []).forEach(function(childId) {
      commitInfoHtml += '<div class="commitInfo-field"><span class="commitInfo-fieldTitle">Child:</span> ' + childId + '</div>';
    });

    commitInfoHtml += '<div class="commitInfo-field"><span class="commitInfo-fieldTitle">Message:</span><div class="commitInfo-message">' + commitInfo.message + '</div></div>';
    $('#commitInfo').html(commitInfoHtml);

    var fileRows = (commitInfo.files || []).map(toTableRow);
    if (row.id) {
      self.filesTable.fnSetColumnVis(1, false);
    } else {
      self.filesTable.fnSetColumnVis(1, true);
    }
    self.filesTable.fnAddData(fileRows);

    $("#fileView tbody tr").click(function(e) {
      self.filesTable.$('tr.row_selected').removeClass('row_selected');
      $(this).addClass('row_selected');
      self.emit('fileSelected', {
        row: $(this)
      });
    });
    if (!row.id) {
      $("#fileView tbody tr").dblclick(toggleStaged);
    }

    $("#fileView tbody tr").first().click();
    return callback();
  });

  function toggleStaged(e) {
    var row = this;
    var data = self.filesTable.fnGetData(row);
    var filename = data[2];
    var isStaged = data[1] === 'Y';
    var newValue = isStaged ? 'N' : 'Y';
    var fnName = isStaged ? 'reset' : 'stage';
    self.gitRepo[fnName](filename, function(err) {
      if (err) {
        return self.main.hideLoadingAndShowError(err);
      }
      self.filesTable.fnUpdate(newValue, row, 1)
    });
  }

  function toTableRow(fileInfo) {
    return [fileInfo.action, fileInfo.staged ? 'Y' : 'N', fileInfo.filename];
  }
};

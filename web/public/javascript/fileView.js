'use strict';

var sf = require('sf');
var util = require("util");
var events = require("events");

module.exports = function (gitRepo, gitLog) {
  return new FileView(gitRepo, gitLog);
};

function FileView(gitRepo, gitLog) {
  var self = this;
  events.EventEmitter.call(this);
  this.gitRepo = gitRepo;
  this.gitLog = gitLog;
  this.commitId = null;

  gitLog.on('logRowSelected', function (data) {
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
}
util.inherits(FileView, events.EventEmitter);

FileView.prototype.getSelectedFilename = function () {
  var row = this.filesTable.$('tr.row_selected').get(0);
  var data = this.filesTable.fnGetData(row);
  if (!data) {
    return null;
  }
  return {
    action: data[0],
    filename: data[1]
  };
};

FileView.prototype.refresh = function (callback) {
  var self = this;
  callback = callback || showError;
  var row = this.gitLog.getSelectedRow();
  this.filesTable.fnClearTable();

  this.commitId = row.id;

  this.gitRepo.getCommitInfo(row.id || 'workingCopy', function (err, commitInfo) {
    if (err) {
      return callback(err);
    }
    var commitInfoHtml = '';
    commitInfoHtml += '<div class="commitInfo-field"><span class="commitInfo-fieldTitle">ID:</span> ' + (commitInfo.id || 'Working Copy') + '</div>';
    if (commitInfo.id) {
      commitInfoHtml += '<div class="commitInfo-field"><span class="commitInfo-fieldTitle">Committer:</span> ' + escapeHtml(commitInfo.committer || '') + '</div>';
      commitInfoHtml += '<div class="commitInfo-field"><span class="commitInfo-fieldTitle">Date:</span> ' + (commitInfo.commiterDate || '') + '</div>';
    }
    commitInfoHtml += '<div class="commitInfo-field"><span class="commitInfo-fieldTitle">Message:</span><div class="commitInfo-message">' + commitInfo.message + '</div></div>';
    $('#commitInfo').html(commitInfoHtml);

    var fileRows = commitInfo.files.map(toTableRow);
    self.filesTable.fnAddData(fileRows);

    $("#fileView tbody tr").click(function (e) {
      self.filesTable.$('tr.row_selected').removeClass('row_selected');
      $(this).addClass('row_selected');
      self.emit('fileSelected', {
        row: $(this)
      });
    });
  });

  function toTableRow(fileInfo) {
    return [fileInfo.action, fileInfo.filename];
  }
};

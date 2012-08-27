'use strict';

var sf = require('sf');
var util = require("util");
var events = require("events");

module.exports = function (gitRepo) {
  return new GitLog(gitRepo);
};

function GitLog(gitRepo) {
  events.EventEmitter.call(this);
  this.gitRepo = gitRepo;
  $('#gitLog').dataTable({
    bJQueryUI: true,
    sPaginationType: "full_numbers",
    bFilter: false,
    bInfo: false,
    bLengthChange: false,
    bPaginate: false,
    bProcessing: true
  });
  this.dataTable = $('#gitLog').dataTable();
  $('#gitLog_wrapper .fg-toolbar').hide();

  this.refresh();
}
util.inherits(GitLog, events.EventEmitter);

GitLog.prototype.getSelectedRow = function () {
  var row = this.dataTable.$('tr.row_selected').get(0);
  var data = this.dataTable.fnGetData(row);
  if (!data) {
    return null;
  }
  return {
    message: data[1],
    committerDate: new Date(data[2]),
    committer: data[3],
    id: data[4]
  };
};

GitLog.prototype.refresh = function (callback) {
  var self = this;
  callback = callback || showError;
  this.dataTable.fnClearTable();

  this.gitRepo.getLog(function (err, log) {
    if (err) {
      return callback(err);
    }
    var logRows = log.map(toTableRow);
    self.dataTable.fnAddData(logRows);

    $("#gitLog tbody tr").click(function (e) {
      self.dataTable.$('tr.row_selected').removeClass('row_selected');
      $(this).addClass('row_selected');
      self.emit('logRowSelected', {
        row: $(this)
      });
    });

    $("#gitLog tbody tr").first().click();
    return callback();
  });

  function toTableRow(log) {
    log.message = log.message.replace(/\n/g, ' ');
    var dateStr;
    if (log.committerDate) {
      dateStr = sf('{0:G}', new Date(log.committerDate));
    }
    return ['', escapeHtml(log.message), dateStr || '', escapeHtml(log.committer) || '', log.id || ''];
  }
};

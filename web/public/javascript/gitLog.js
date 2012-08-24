'use strict';

var sf = require('sf');

module.exports = function (gitRepo) {
  return new GitLog(gitRepo);
};

function GitLog(gitRepo) {
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

GitLog.prototype.refresh = function () {
  var self = this;
  this.dataTable.fnClearTable();

  $.getJSON(this.gitRepo.createUrl('/log.json'), function (log, textStatus) {
    var logRows = log.map(toTableRow);
    self.dataTable.fnAddData(logRows);
  });

  function toTableRow(log) {
    log.message = log.message.replace(/\n/g, ' ');
    var dateStr = sf('{0:G}', new Date(log.commitDate));
    return ['', escapeHtml(log.message), dateStr, escapeHtml(log.commit), log.id];
  }
};

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
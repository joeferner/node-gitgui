'use strict';

var sf = require('sf');
var util = require("util");
var events = require("events");

module.exports = function (gitRepo, fileView) {
  return new FileView(gitRepo, fileView);
};

function FileView(gitRepo, fileView) {
  var self = this;
  events.EventEmitter.call(this);
  this.gitRepo = gitRepo;
  this.fileView = fileView;

  fileView.on('fileSelected', function (data) {
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

FileView.prototype.refresh = function (callback) {
  var self = this;
  callback = callback || showError;
  var commitId = this.fileView.commitId;
  var row = this.fileView.getSelectedFilename();

};

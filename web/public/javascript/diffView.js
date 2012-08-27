'use strict';

var sf = require('sf');

module.exports = function (gitRepo, fileView) {
  return new DiffView(gitRepo, fileView);
};

function DiffView(gitRepo, fileView) {
  var self = this;
  this.gitRepo = gitRepo;
  this.fileView = fileView;

  fileView.on('fileSelected', function (data) {
    self.refresh();
  });
}

DiffView.prototype.refresh = function (callback) {
  var self = this;
  callback = callback || showError;
  var commitId = this.fileView.commitId;
  var row = this.fileView.getSelectedFilename();
  console.log(commitId, row);
};

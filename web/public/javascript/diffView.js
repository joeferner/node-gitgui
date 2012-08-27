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
  this.gitRepo.getDiff(commitId, row.filename, function (err, diff) {
    if (err) {
      return callback(err);
    }
    $('#diff').html('<pre>' + escapeHtml(diff) + '</pre>');
    return callback();
  });
};

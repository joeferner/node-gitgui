'use strict';

var sf = require('sf');
var diffParse = require("../lib/diffParse");

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
    var parsedDiff = diffParse(diff);
    if (parsedDiff && parsedDiff.length === 1) {
      var lines = parsedDiff[0].lines;
      var html = '<table class="diff" cellpadding="0" cellspacing="0" width="100%">';
      lines.forEach(function (l) {
        var addSubtractCss;
        if (l.action === '+') {
          addSubtractCss = 'diff-add';
        } else if (l.action === '-') {
          addSubtractCss = 'diff-subtract';
        } else {
          addSubtractCss = 'diff-noChange';
        }
        var lineStr = formatLine(l.line);
        html += sf('<tr class="{0}"><td class="diff-fromLineNumber">{1}</td><td class="diff-toLineNumber">{2}</td><td class="diff-line">{3}</td></tr>', addSubtractCss, l.fromLineNumber, l.toLineNumber, lineStr);
      });
      html += '</table>';
      $('#diff').html(html);
    } else {
      $('#diff').html('');
    }
    return callback();
  });

  function formatLine(line) {
    var lineMatch = line.match(/^(\s*)(.*)$/);
    if (!lineMatch) {
      return escapeHtml(line);
    } else {
      return lineMatch[1].replace(/ /g, '&nbsp;').replace(/\t/g, '&nbsp;&nbsp;') + escapeHtml(lineMatch[2]);
    }
  }
};

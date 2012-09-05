'use strict';

var sf = require('sf');
var diffParse = require("../lib/diffParse");

module.exports = function (main, gitRepo, fileView) {
  return new DiffView(main, gitRepo, fileView);
};

function DiffView(main, gitRepo, fileView) {
  var self = this;
  this.main = main;
  this.gitRepo = gitRepo;
  this.fileView = fileView;

  fileView.on('fileSelected', function (data) {
    self.refresh();
  });
}

DiffView.prototype.refresh = function (callback) {
  var self = this;
  $('#diff').parent().scrollTop(0);
  callback = callback || self.main.hideLoadingAndShowError;
  var commitId = this.fileView.commitId;
  var row = this.fileView.getSelectedFilename();
  if (!row || !row.filename) {
    $('#diff').html('');
    return callback();
  }

  if (isImageFilename(row.filename)) {
    var fname = encodeURIComponent(row.filename);
    $('#diff').html(sf('<img src="/raw/{0}/{1}?repo={2}" />', commitId || 'workingCopy', fname, encodeURIComponent(this.gitRepo.repoPath)));
    return callback();
  } else if (row.filename.match(/\/$/)) {
    $('#diff').html('Directory');
    return callback();
  } else {
    this.gitRepo.getDiff(commitId, row.filename, function (err, diff) {
      if (err) {
        return callback(err);
      }
      var parsedDiff = diffParse(diff);
      if (parsedDiff && parsedDiff.length === 1) {
        var html = diffToHtml(parsedDiff);
        $('#diff').html(html);
      } else {
        $('#diff').html('');
      }
      return callback();
    });
  }

  function isImageFilename(filename) {
    if (!filename) {
      return false;
    }
    return filename.match(/\.jpg$/) || filename.match(/\.png$/) || filename.match(/\.jpeg$/) || filename.match(/\.gif$/);
  }

  function diffToHtml(parsedDiff) {
    var lines = parsedDiff[0].lines;
    var html = '<table class="diff" cellpadding="0" cellspacing="0" width="100%">';

    collapseUnchangedLines(lines);

    var lastCollapsed = false;
    var collapsedSectionIdIdx = 0;
    lines.forEach(function (l, lineIdx) {
      var addSubtractCss;
      if (l.action === '+') {
        addSubtractCss = 'diff-add';
      } else if (l.action === '-') {
        addSubtractCss = 'diff-subtract';
      } else {
        addSubtractCss = 'diff-noChange';
      }
      var lineStr = formatLine(l.line);
      var isLineCollapsed = l.collapsed ? true : false
      if (isLineCollapsed !== lastCollapsed) {
        if (l.collapsed) {
          var startLine = lines[l.collapsed.start] || {};
          var endLine = lines[l.collapsed.end] || {};
          html += sf("<tr><td colspan='3' onclick=\"window.showCollapsedSection('{id}')\" class='collapsedSection {additionalClasses}'>Hiding {newStart}-{newEnd} (previously {oldStart}-{oldEnd})<table id='{id}' style='display: none;'>", {
            id: 'collapsedSection_' + collapsedSectionIdIdx,
            newStart: startLine.toLineNumber,
            newEnd: endLine.toLineNumber,
            oldStart: startLine.fromLineNumber,
            oldEnd: endLine.fromLineNumber,
            additionalClasses: lineIdx === 0 ? 'collapsedSection-start' : (lineIdx === lines.length - 1 ? 'collapsedSection-end' : 'collapsedSection-middle')
          });
          collapsedSectionIdIdx++;
        } else {
          html += "</table></td></tr>";
        }
      }
      html += sf('<tr class="{0}"><td class="diff-fromLineNumber">{1}</td><td class="diff-toLineNumber">{2}</td><td class="diff-line">{3}</td></tr>', addSubtractCss, l.fromLineNumber, l.toLineNumber, lineStr);

      lastCollapsed = isLineCollapsed;
    });
    html += '</table>';
    return html;
  }

  function collapseUnchangedLines(lines) {
    var context = 5;
    var minCollapseSize = 5;
    var startCollapseIdx = -context;
    var lineIdx;
    for (lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      var line = lines[lineIdx];
      if (startCollapseIdx && (line.action === '+' || line.action === '-')) {
        var start = startCollapseIdx + context;
        var end = lineIdx - context;
        if ((end - start) > minCollapseSize) {
          collapseLines(lines, start, end);
        }
        startCollapseIdx = null;
      } else if (!startCollapseIdx) {
        startCollapseIdx = lineIdx;
      }
    }
    if (startCollapseIdx) {
      collapseLines(lines, startCollapseIdx + context, lines.length);
    }
  }

  function collapseLines(lines, start, end) {
    for (var lineIdx = start; lineIdx < end; lineIdx++) {
      lines[lineIdx].collapsed = { start: start, end: end };
    }
  }

  function formatLine(line) {
    var lineMatch = line.match(/^(\s*)(.*)$/);
    if (!lineMatch) {
      return escapeHtml(line);
    } else {
      return lineMatch[1].replace(/ /g, '&nbsp;').replace(/\t/g, '&nbsp;&nbsp;') + escapeHtml(lineMatch[2]);
    }
  }
};

window.showCollapsedSection = function (id) {
  $('#' + id + ' tr').insertAfter($('#' + id).parent().parent());
  $('#' + id).parent().parent().slideUp();
};

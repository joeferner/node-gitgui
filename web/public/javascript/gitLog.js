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
    bProcessing: true,
    aoColumns: [
      { sClass: 'fileView-column-graph', sWidth: '100px' },
      { sClass: 'fileView-column-message' },
      { sClass: 'fileView-column-date', sWidth: '200px' },
      { sClass: 'fileView-column-committer', sWidth: '200px' },
      { sClass: 'fileView-column-commitId', sWidth: '100px' }
    ]
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

  this.gitRepo.getLog(function (err, logs) {
    if (err) {
      return callback(err);
    }
    //createGraphHtml(logs);
    var logRows = logs.map(toTableRow);
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
    var message = '';
    (log.refs || []).forEach(function (ref) {
      var type, name;
      if (ref.name.indexOf('refs/tags/') === 0) {
        type = 'ref-tag';
        name = ref.name.substr('refs/tags/'.length);
      } else if (ref.name.indexOf('refs/heads/') === 0) {
        type = 'ref-head';
        name = ref.name.substr('refs/heads/'.length);
      } else if (ref.name.indexOf('refs/remotes/') === 0) {
        type = 'ref-remote';
        name = ref.name.substr('refs/remotes/'.length);
      } else {
        type = '';
        name = ref.name;
      }
      message += sf("<div class='ref {0}'>{1}</div>", type, name);
    });
    message += "<div class='message'>" + escapeHtml(log.message) + "</div>";

    var commitId = (log.id || '');

    return [log.graphHtml || '', message, dateStr || '', escapeHtml(log.committer) || '', commitId];
  }
};

// todo figure out this logic
function createGraphHtml(logs) {
  var columnHeads = logs
    .filter(function (l) {
      return !l.children || l.children.length === 0;
    })
    .map(function (l) { return l.id; });

  var commitMap = {};
  logs.forEach(function (l) {
    l.graphColumns = l.graphColumns || [];
    l.foundCommitColumn = false;
    commitMap[l.id] = l;
  });

  for (var columnHeadIdx = 0; columnHeadIdx < columnHeads.length; columnHeadIdx++) {
    for (var logIdx = 0; logIdx < logs.length; logIdx++) {
      var log = logs[logIdx];
      if (log.id === columnHeads[columnHeadIdx] && !log.foundCommitColumn) {
        log.foundCommitColumn = true;
        log.graphColumns[columnHeadIdx] = true;
        if (log.parents) {
          columnHeads[columnHeadIdx] = log.parents[0];
          for (var parentIdx = 1; parentIdx < log.parents.length; parentIdx++) {
            columnHeads.push(log.parents[parentIdx]);
          }
        }
      }
    }
  }

  var z = 0;
  var dest;
  var lastLogParents = [];
  logs.forEach(function (log) {
    log.graphColumns = log.graphColumns || [];
    var opts = {
      width: columnHeads.length * 25,
      circleCenter: getCenter(log.graphColumns.indexOf(true)),
      parentLinesHtml: '',
      childLinesHtml: ''
    };

    var lastLogParentIdx = lastLogParents.indexOf(log.id);
    if (lastLogParentIdx >= 0) {
      lastLogParents = lastLogParents.slice(0, lastLogParentIdx).concat(lastLogParents.slice(lastLogParentIdx + 1));
    }

    (log.parents || []).forEach(function (parentId) {
      var parent = commitMap[parentId];
      if (parent) {
        dest = getCenter(parent.graphColumns.indexOf(true));
        opts.parentLinesHtml += sf('<line x1="{src}" y1="12" x2="{dest}" y2="23" style="stroke: rgb(255,0,0); stroke-width: 2;"/>', {
          src: opts.circleCenter,
          dest: dest
        });
      }
    });

    (log.children || []).forEach(function (childId) {
      var child = commitMap[childId];
      if (child) {
        dest = getCenter(child.graphColumns.indexOf(true));
        opts.parentLinesHtml += sf('<line x1="{src}" y1="12" x2="{dest}" y2="2" style="stroke: rgb(255,0,0); stroke-width: 2;"/>', {
          src: opts.circleCenter,
          dest: dest
        });
      }
    });

    lastLogParents.forEach(function (parentId) {
      var parent = commitMap[parentId];
      if (parent) {
        dest = getCenter(parent.graphColumns.indexOf(true));
        opts.parentLinesHtml += sf('<line x1="{dest}" y1="25" x2="{dest}" y2="0" style="stroke: rgb(255,0,0); stroke-width: 2;"/>', {
          dest: dest
        });
      }
    });

    log.graphHtml = sf(
      '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="{width}" height="25">'
        + '{parentLinesHtml}'
        + '{childLinesHtml}'
        + '<circle cx="{circleCenter}" cy="12" r="4" stroke="black" stroke-width="1" fill="red"/>'
        + '</svg>',
      opts);

    if (z < 20) {
      console.log(log);
      z++;
    }

    lastLogParents = lastLogParents.concat(log.parents || []);
  });

  function getCenter(colIdx) {
    return (colIdx * 25) + 12;
  }
}
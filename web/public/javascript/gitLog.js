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
      { sClass: 'fileView-column-graph', sWidth: '300px' },
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
    createGraphHtml(logs);
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

function createGraphHtml(logs) {
  var nextColumnColorIdx = 0;
  var columnColors = [
    'rgb(180, 0, 0)',
    'rgb(0, 180, 0)',
    'rgb(0, 0, 180)',
    'rgb(180, 180, 0)',
    'rgb(180, 0, 180)',
    'rgb(0, 180, 180)'
  ];

  var columnWidth = 25;
  var maxColumns = 0;
  var columns = [];
  var currentColumnColors = [];

  logs.forEach(function (log) {
    log.columnIdx = findColumnIdx(log);
    maxColumns = Math.max(maxColumns, log.columnIdx);
    log.childColumnIdxs = getChildColumnIdxs(log);
    log.currentColumns = columns.slice();
    log.parentColumnIdxs = getParentColumnIdxs(log);
  });

  logs.forEach(function (log) {
    var svgOpts = {
      width: (maxColumns + 1) * columnWidth,
      circleCenter: getCenter(log.columnIdx),
      parentLinesHtml: '',
      childLinesHtml: '',
      passThroughLinesHtml: ''
    };

    if (log.childColumnIdxs) {
      log.childColumnIdxs.forEach(function (childColumnIdx, i) {
        currentColumnColors[childColumnIdx] = currentColumnColors[childColumnIdx] || getNextColumnColor(currentColumnColors);

        svgOpts.parentLinesHtml += sf('<line x1="{src}" y1="12" x2="{dest}" y2="0" style="stroke: {color}; stroke-width: 2;"/>', {
          src: svgOpts.circleCenter,
          dest: getCenter(childColumnIdx),
          color: currentColumnColors[childColumnIdx]
        });

        if (i !== 0) {
          currentColumnColors[childColumnIdx] = null;
        }
      });
    }

    if (log.parentColumnIdxs) {
      log.parentColumnIdxs.forEach(function (parentColumnIdx) {
        currentColumnColors[parentColumnIdx] = currentColumnColors[parentColumnIdx] || getNextColumnColor(currentColumnColors);

        svgOpts.parentLinesHtml += sf('<line x1="{src}" y1="12" x2="{dest}" y2="23" style="stroke: {color}; stroke-width: 2;"/>', {
          src: svgOpts.circleCenter,
          dest: getCenter(parentColumnIdx),
          color: currentColumnColors[parentColumnIdx]
        });
      });
    }

    if (log.currentColumns) {
      for (var currentColumnIdx = 0; currentColumnIdx < log.currentColumns.length; currentColumnIdx++) {
        if (log.currentColumns[currentColumnIdx]) {
          currentColumnColors[currentColumnIdx] = currentColumnColors[currentColumnIdx] || getNextColumnColor(currentColumnColors);

          svgOpts.passThroughLinesHtml += sf('<line x1="{x}" y1="0" x2="{x}" y2="25" style="stroke: {color}; stroke-width: 2;"/>', {
            x: getCenter(currentColumnIdx),
            color: currentColumnColors[currentColumnIdx]
          });
        }
      }
    }

    log.graphHtml = sf(
      '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="{width}" height="25">'
        + '{passThroughLinesHtml}'
        + '{parentLinesHtml}'
        + '{childLinesHtml}'
        + '<circle cx="{circleCenter}" cy="12" r="4" stroke="black" stroke-width="1" fill="red"/>'
        + '</svg>',
      svgOpts);
  });

  function getChildColumnIdxs(log) {
    if (!log.children) {
      return null;
    }
    var childrenColumnIdxs = [];
    for (var childColumnIdx = 0; childColumnIdx < columns.length; childColumnIdx++) {
      var col = columns[childColumnIdx];
      if (!col) {
        continue;
      }
      if (col.nextId === log.id) {
        childrenColumnIdxs.push(childColumnIdx);
        columns[childColumnIdx] = null;
      }
    }
    return childrenColumnIdxs;
  }

  function getParentColumnIdxs(log) {
    if (!log.parents) {
      return null;
    }
    var parentColumnIdxs = [];
    for (var parentIdx = 0; parentIdx < log.parents.length; parentIdx++) {
      var columnIdx;
      if (parentIdx === 0) {
        columnIdx = log.columnIdx;
      } else {
        columnIdx = findFirstOpenColumnIdx();
      }
      parentColumnIdxs[parentIdx] = columnIdx;
      columns[columnIdx] = columns[columnIdx] || { };
      columns[columnIdx].nextId = log.parents[parentIdx];
    }
    return parentColumnIdxs;
  }

  function getNextColumnColor(usedColors) {
    var color;
    var startingNextColorIdx = nextColumnColorIdx;
    while (true) {
      color = columnColors[nextColumnColorIdx];
      nextColumnColorIdx++;
      if (nextColumnColorIdx >= columnColors.length) {
        nextColumnColorIdx = 0;
      }
      if (startingNextColorIdx === nextColumnColorIdx) {
        break;
      }
      if (usedColors.indexOf(color) < 0) {
        break;
      }
    }
    return color;
  }

  function findColumnIdx(log) {
    for (var columnIdx = 0; columnIdx < columns.length; columnIdx++) {
      if (!columns[columnIdx]) {
        continue;
      }
      if (columns[columnIdx].nextId === log.id) {
        return columnIdx;
      }
    }
    return findFirstOpenColumnIdx();
  }

  function findFirstOpenColumnIdx() {
    for (var columnIdx = 0; columnIdx < columns.length; columnIdx++) {
      if (columns[columnIdx] === null) {
        return columnIdx;
      }
    }
    return columns.length;
  }

  function getCenter(colIdx) {
    return (colIdx * columnWidth) + (columnWidth / 2);
  }
}
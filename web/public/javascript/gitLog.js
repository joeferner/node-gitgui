'use strict';

var sf = require('sf');
var util = require("util");
var events = require("events");

module.exports = function (main, gitRepo) {
  return new GitLog(main, gitRepo);
};

function GitLog(main, gitRepo) {
  events.EventEmitter.call(this);
  this.main = main;
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
  $('#gitLog').bind('contextmenu', this.showContextMenu.bind(this));
}
util.inherits(GitLog, events.EventEmitter);

GitLog.prototype.showContextMenu = function (e) {
  var self = this;
  e.preventDefault();
  $(e.target).click();

  var selectedLogRow = self.getSelectedRow();
  if (!selectedLogRow || !selectedLogRow.id) {
    return false;
  }

  var menu = {
    'checkout': {
      label: 'Checkout',
      icon: '/image/context-checkout.png',
      action: function () {
        self.checkoutCommit(selectedLogRow.id, function (err) {
          if (err) {
            return callback(err);
          }
          self.main.refresh();
        });
      }
    }
  };
  $.vakata.context.show(menu, $('#gitLog'), e.pageX, e.pageY, this, $('#gitLog'));
  return false;
};

GitLog.prototype.checkoutCommit = function (commitId, callback) {
  var self = this;
  self.gitRepo.getCommitInfo(commitId, function (err, commitInfo) {
    if (err) {
      return callback(err);
    }
    if (commitInfo && commitInfo.symbolicName && commitInfo.symbolicName.indexOf('~') < 0) {
      commitId = commitInfo.symbolicName;
    }
    self.gitRepo.checkout(commitId, callback);
  });
};

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
    var addedRowIdxs = self.dataTable.fnAddData(logRows);
    var currentCommitIdx = getCurrentCommitIdx(logs);
    if (currentCommitIdx !== null) {
      var tr = self.dataTable.fnGetNodes(addedRowIdxs[currentCommitIdx]);
      $(tr).addClass('gitLog-currentCommit');
    }

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

  function getCurrentCommitIdx(logs) {
    var currentCommitIdx = null;
    logs.forEach(function (l, idx) {
      if (l.currentCommit) {
        currentCommitIdx = idx;
      }
    });
    return currentCommitIdx;
  }

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
  var columnHeight = 25;
  var maxColumns = 0;
  var columns = [];
  var currentColumnColors = [];
  var graphColumnWidth;

  logs.forEach(function (log) {
    log.columnIdx = findColumnIdx(log);
    maxColumns = Math.max(maxColumns, log.columnIdx);
    log.childColumnIdxs = getChildColumnIdxs(log);
    log.currentColumns = columns.slice();
    log.parentColumnIdxs = getParentColumnIdxs(log);
  });

  graphColumnWidth = (maxColumns + 1) * columnWidth;
  $('#gitLog thead th.fileView-column-graph').width(Math.max(65, graphColumnWidth));

  logs.forEach(function (log) {
    var svgOpts = {
      width: graphColumnWidth,
      circleCenter: getCenter(log.columnIdx),
      parentLinesHtml: '',
      childLinesHtml: '',
      passThroughLinesHtml: '',
      height: columnHeight
    };

    if (log.childColumnIdxs) {
      log.childColumnIdxs.forEach(function (childColumnIdx, i) {
        currentColumnColors[childColumnIdx] = currentColumnColors[childColumnIdx] || getNextColumnColor(currentColumnColors);

        svgOpts.parentLinesHtml += sf('<polyline points="{src} {midY} {dest} 2 {dest} 0" stroke="{color}" stroke-width="2" stroke-linejoin="round" fill="none" />', {
          src: svgOpts.circleCenter,
          dest: getCenter(childColumnIdx),
          color: currentColumnColors[childColumnIdx],
          midY: columnHeight / 2
        });

        if (i !== 0) {
          currentColumnColors[childColumnIdx] = null;
        }
      });
    }

    if (log.parentColumnIdxs) {
      log.parentColumnIdxs.forEach(function (parentColumnIdx) {
        currentColumnColors[parentColumnIdx] = currentColumnColors[parentColumnIdx] || getNextColumnColor(currentColumnColors);

        svgOpts.parentLinesHtml += sf('<polyline points="{src} {midY} {dest} {joinHeight} {dest} {height}" stroke="{color}" stroke-width="2" stroke-linejoin="round" fill="none" />', {
          src: svgOpts.circleCenter,
          dest: getCenter(parentColumnIdx),
          color: currentColumnColors[parentColumnIdx],
          midY: columnHeight / 2,
          joinHeight: columnHeight - 4,
          height: columnHeight
        });
      });
    }

    if (log.currentColumns) {
      for (var currentColumnIdx = 0; currentColumnIdx < log.currentColumns.length; currentColumnIdx++) {
        if (log.currentColumns[currentColumnIdx]) {
          currentColumnColors[currentColumnIdx] = currentColumnColors[currentColumnIdx] || getNextColumnColor(currentColumnColors);

          svgOpts.passThroughLinesHtml += sf('<line x1="{x}" y1="0" x2="{x}" y2="{height}" style="stroke: {color}; stroke-width: 2;"/>', {
            x: getCenter(currentColumnIdx),
            color: currentColumnColors[currentColumnIdx],
            height: columnHeight
          });
        }
      }
    }

    log.graphHtml = sf(
      '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="{width}" height="{height}">'
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
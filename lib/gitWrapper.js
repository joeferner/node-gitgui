'use strict';

var git = require('nodegit');
var spawn = require('child_process').spawn;
var path = require('path');
var async = require('async');

exports.branches = function (gitPath, callback) {
  runGit(gitPath, ['branch', '-a'], function (err, results) {
    if (err) {
      return callback(err);
    }
    var branches = results
      .split('\n')
      .filter(function (line) { return line; })
      .map(function (line) {
        var local = false;
        if (line.indexOf('* ') === 0) {
          local = true;
          line = line.substr('* '.length);
        }
        line = line.trim();
        return {
          name: line,
          local: local
        }
      });
    return callback(null, branches);
  });
};

exports.tags = function (gitPath, callback) {
  runGit(gitPath, ['tag', '-l'], function (err, results) {
    if (err) {
      return callback(err);
    }
    var tags = results
      .split('\n')
      .filter(function (line) { return line; })
      .map(function (line) {
        var local = false;
        if (line.indexOf('* ') === 0) {
          local = true;
          line = line.substr('* '.length);
        }
        line = line.trim();
        return {
          name: line,
          local: local
        }
      });
    return callback(null, tags);
  });
};

exports.log = function (gitPath, callback) {

  async.auto({
    hasWorkingCopy: hasWorkingCopy,
    log: runLog
  }, function (err, results) {
    if (err) {
      return callback(err);
    }
    var logs = [];
    if (results.hasWorkingCopy) {
      logs.push({
        message: 'Working Copy'
      });
    }
    logs = logs.concat(results.log);
    return callback(null, logs);
  });

  function hasWorkingCopy(callback) {
    runGit(gitPath, ['status', '-z'], function (err, results) {
      if (err) {
        return callback(err);
      }
      var files = results
        .split('\0')
        .filter(function (f) { return f; });
      return callback(null, files.length > 0);
    });
  }

  function runLog(callback) {
    runGit(gitPath, ['log', '--format=raw'], function (err, results) {
      if (err) {
        return callback(err);
      }
      var logs = parseLog(results);
      return callback(null, logs);
    });
  }
};

exports.getDiff = function (gitPath, id, filename, callback) {
  getCommitInfo(gitPath, id, function (err, commitInfo) {
    if (err) {
      return callback(err);
    }
    runGit(gitPath, ['diff', '-z', commitInfo.parent, id, filename], function (err, results) {
      if (err) {
        return callback(err);
      }
      return callback(null, results);
    });
  });
};

var getCommitInfo = exports.getCommitInfo = function (gitPath, id, callback) {
  if (id) {
    return getCommitInfoById(gitPath, id, callback);
  }
  return getWorkingCopyInfo(gitPath, callback);
};

function getCommitInfoById(gitPath, id, callback) {
  runGit(gitPath, ['log', '--format=raw', '--max-count=1', '--name-status', id], function (err, results) {
    if (err) {
      return callback(err);
    }
    var logs = parseLog(results);
    if (logs && logs.length === 1) {
      return callback(null, logs[0]);
    }
    return callback(new Error("Unexpected output from parseLog:\n" + logs));
  });
}

function getWorkingCopyInfo(gitPath, callback) {
  runGit(gitPath, ['status', '-z'], function (err, results) {
    if (err) {
      return callback(err);
    }
    var files = results
      .split('\0')
      .filter(function (f) { return f; })
      .map(function (f) {
        var parts = f.match(/^(..) (.*)$/);
        return {
          action: parts[1],
          filename: parts[2]
        };
      });
    var log = {
      message: 'Working Copy',
      files: files
    };
    return callback(null, log);
  });
}

exports.fetch = function (gitPath, callback) {
  runGit(gitPath, ['fetch'], function (err, results) {
    if (err) {
      return callback(err);
    }
    return callback(null, results);
  });
};

exports.pull = function (gitPath, callback) {
  runGit(gitPath, ['pull'], function (err, results) {
    if (err) {
      return callback(err);
    }
    return callback(null, results);
  });
};

exports.push = function (gitPath, callback) {
  runGit(gitPath, ['push'], function (err, results) {
    if (err) {
      return callback(err);
    }
    return callback(null, results);
  });
};

function parseLog(rawData) {
  var lines = rawData
    .split('\n')
    .filter(function (line) { return line; });

  var logs = [];
  var log = null;
  lines.forEach(function (line) {
    var m = line.match(/^commit ([a-f0-9]*)$/);
    if (m) {
      if (log) {
        log.message = log.message.trim();
        logs.push(log);
      }
      log = {
        id: m[1],
        message: ''
      };
      return;
    }

    m = line.match(/^tree ([a-f0-9]*)$/);
    if (m && log) {
      log.tree = m[1].trim();
      return;
    }

    m = line.match(/^parent ([a-f0-9]*)$/);
    if (m && log) {
      log.parent = m[1].trim();
      return;
    }

    m = line.match(/^author (.*) ([0-9]*) (-?[0-9]*)$/);
    if (m && log) {
      log.author = m[1].trim();
      log.authorDate = new Date(m[2] * 1000); // todo add timezone info
      return;
    }

    m = line.match(/^committer (.*) ([0-9]*) (-?[0-9]*)$/);
    if (m && log) {
      log.committer = m[1].trim();
      log.committerDate = new Date(m[2] * 1000); // todo add timezone info
      return;
    }

    m = line.match(/^([A-Z])\t(.*)$/);
    if (m && log) {
      log.files = log.files || [];
      log.files.push({
        action: m[1],
        filename: m[2]
      });
      return;
    }

    if (log) {
      log.message += '\n' + line;
    }
  });
  if (log) {
    log.message = log.message.trim();
    logs.push(log);
  }
  return logs;
}

function runGit(gitPath, args, callback) {
  var opts = {
    cwd: path.resolve(gitPath)
  };
  console.log('running git', args, opts);
  var child = spawn('git', args, opts);
  var out = '';
  child.stdout.on('data', function (data) {
    out += data;
  });

  child.stderr.on('data', function (data) {
    out += data;
  });

  child.on('exit', function (code) {
    setTimeout(function () {
      //console.log('git returned (code: ' + code + ')', args, '\n' + out);
      if (code === 0) {
        return callback(null, out);
      } else {
        var err = new Error("Failed running git (error code: " + code + ")\n" + out);
        err.code = code;
        return callback(err);
      }
    }, 100); // currently a bug in node I guess which calls exit before the last data is sent.
  });
}

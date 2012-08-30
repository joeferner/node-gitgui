'use strict';

var fs = require('fs');
var git = require('nodegit');
var spawn = require('child_process').spawn;
var path = require('path');
var async = require('async');
var streamBuffers = require("stream-buffers");

exports.branches = function (gitPath, callback) {
  runGit(gitPath, ['branch', '-a'], function (err, results) {
    if (err) {
      return callback(err);
    }
    var branches = results
      .split('\n')
      .filter(function (line) { return line; })
      .map(function (line) {
        var current = false;
        if (line.indexOf('* ') === 0) {
          current = true;
          line = line.substr('* '.length);
        }
        line = line.trim();
        return {
          name: line,
          current: current
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
    refs: getRefs,
    log: ['refs', runLog]
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

  function getRefs(callback) {
    runGit(gitPath, ['show-ref', '-d'], function (err, results) {
      if (err) {
        return callback(err);
      }
      var refs = results
        .split('\n')
        .map(function (l) { return l.trim(); })
        .filter(function (l) {
          if (!l) {
            return false;
          }
          if (l.indexOf('refs/tags/') === 0) {
            return l.indexOf('^{}') >= 0;
          }
          return true;
        })
        .map(function (l) {
          var m = l.match(/^(.*) (.*)$/);
          var result = {
            id: m[1],
            name: m[2]
          };
          result.name = result.name.replace(/\^\{\}$/, '');
          return result;
        });
      return callback(null, refs);
    });
  }

  function runLog(callback, data) {
    runGit(gitPath, ['log', '--all', '--format=raw'], function (err, results) {
      if (err) {
        return callback(err);
      }
      var logs = parseLog(results, data.refs);
      return callback(null, logs);
    });
  }
};

exports.getStatus = function (gitPath, callback) {
  runGit(gitPath, ['remote', 'update'], function (err) {
    if (err) {
      return callback(err);
    }

    runGit(gitPath, ['status'], function (err, results) {
      if (err) {
        return callback(err);
      }

      var status = {
        aheadBy: 0,
        behindBy: 0
      };

      var m = results.match(/Your branch is ahead of '.*' by ([0-9]*) commit./);
      if (m) {
        status.aheadBy = parseInt(m[1]);
      }

      m = results.match(/Your branch is behind '.*' by ([0-9]*) commits,/);
      if (m) {
        status.behindBy = parseInt(m[1]);
      }

      return callback(null, status);
    });
  });
};

exports.getDiff = function (gitPath, id, filename, callback) {
  getCommitInfo(gitPath, id, function (err, commitInfo) {
    if (err) {
      return callback(err);
    }
    var fileCommitInfo = findFileCommitInfo(commitInfo, filename);
    if (fileCommitInfo && (fileCommitInfo.action === '??' || fileCommitInfo.action === 'A')) {
      return generateDiffOfNewFile(filename, callback);
    }
    return runDiff(commitInfo.parent, id, callback);
  });

  function generateDiffOfNewFile(filename, callback) {
    var fullFilename = path.resolve(path.join(gitPath, filename));
    fs.readFile(fullFilename, 'utf8', function (err, fileData) {
      if (err) {
        return callback(err);
      }
      var diff = '--- a/' + filename + '\n';
      diff += '+++ b/' + filename + '\n';
      diff += fileData
        .split('\n')
        .map(function (l) { return '+' + l; })
        .join('\n');
      return callback(null, diff);
    });
  }

  function runDiff(parentId, id, callback) {
    var args = ['diff', '--unified=999999'];
    if (parentId) {
      args.push(parentId);
    }
    if (id) {
      args.push(id);
    }
    args.push('--');
    args.push(filename);
    runGit(gitPath, args, function (err, results) {
      if (err) {
        return callback(err);
      }
      return callback(null, results);
    });
  }
};

function findFileCommitInfo(commitInfo, filename) {
  if (!commitInfo || !commitInfo.files) {
    return null;
  }
  var matches = commitInfo.files.filter(function (f) {
    return f.filename === filename;
  });
  if (matches.length === 1) {
    return matches[0];
  }
  console.error("multiple matches for file: " + filename);
  return null;
}

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
  runGit(gitPath, ['log', '--format=raw', '--max-count=1', '--name-status'], function (err, results) {
    if (err) {
      return callback(err);
    }
    var logs = parseLog(results);
    var parentId = null;
    if (logs && logs.length === 1) {
      parentId = logs[0].id;
    }

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
            action: parts[1].trim(),
            staged: parts[1][0] !== ' ' && parts[1][0] !== '?' && parts[1][1] === ' ', // 'M ' is staged. 'MM' is not staged. '??' is not staged.
            filename: parts[2]
          };
        });
      var log = {
        message: 'Working Copy',
        parent: parentId,
        files: files
      };
      return callback(null, log);
    });
  });
}

exports.getRawFileData = function (gitPath, commitId, filename, callback) {
  runGit(gitPath, ['show', commitId + ':' + filename], { raw: true }, function (err, data) {
    if (err) {
      return callback(err);
    }
    return callback(null, data);
  });
};

exports.commit = function (gitPath, message, callback) {
  runGit(gitPath, ['commit', '-m', message], function (err, results) {
    if (err) {
      return callback(err);
    }
    return callback(null, results);
  });
};

exports.stage = function (gitPath, filename, callback) {
  runGit(gitPath, ['add', filename], function (err, results) {
    if (err) {
      return callback(err);
    }
    return callback(null, results);
  });
};

exports.reset = function (gitPath, filename, callback) {
  runGit(gitPath, ['reset', 'HEAD', filename], function (err, results) {
    if (err && err.code !== 1) { // todo for some reason git returns an error code 1 when you do this even though it works.
      return callback(err);
    }
    return callback(null, results);
  });
};

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

function parseLog(rawData, refs) {
  refs = refs || [];
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
      refs.forEach(function (ref) {
        if (ref.id === log.id) {
          log.refs = log.refs || [];
          log.refs.push(ref);
        }
      });
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
        action: m[1].trim(),
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

function runGit(gitPath, args, options, callback) {
  if (arguments.length === 3) {
    callback = arguments[2];
    options = {};
  }
  var opts = {
    cwd: path.resolve(gitPath)
  };
  console.log('running git', args, opts);
  var child = spawn('git', args, opts);
  var out = options.raw ? new streamBuffers.WritableStreamBuffer() : '';
  child.stdout.on('data', appendOut);
  child.stderr.on('data', appendOut);

  function appendOut(data) {
    if (options.raw) {
      out.write(data);
    } else {
      out += data;
    }
  }

  child.on('exit', function (code) {
    setTimeout(function () {
      //console.log('git returned (code: ' + code + ')', args, '\n' + out);
      if (code === 0) {
        if (options.raw) {
          out = out.getContents();
        }
        return callback(null, out);
      } else {
        var err = new Error("Failed running git (error code: " + code + ")\n" + out);
        err.code = code;
        return callback(err);
      }
    }, 100); // currently a bug in node I guess which calls exit before the last data is sent.
  });
}

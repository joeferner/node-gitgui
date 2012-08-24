'use strict';

var git = require('nodegit');
var spawn = require('child_process').spawn;
var path = require('path');

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
  runGit(gitPath, ['log', '--pretty=fuller'], function (err, results) {
    if (err) {
      return callback(err);
    }
    var lines = results
      .split('\n')
      .filter(function (line) { return line; });
    var logs = [];
    var log;
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

      m = line.match(/^Author: (.*)$/);
      if (m && log) {
        log.author = m[1].trim();
        return;
      }

      m = line.match(/^AuthorDate: (.*)$/);
      if (m && log) {
        log.authorDate = parseGitDate(m[1].trim());
        return;
      }

      m = line.match(/^Commit: (.*)$/);
      if (m && log) {
        log.commit = m[1].trim();
        return;
      }

      m = line.match(/^CommitDate: (.*)$/);
      if (m && log) {
        log.commitDate = parseGitDate(m[1].trim());
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
    return callback(null, logs);
  });
};

function parseGitDate(dateStr) {
  return Date.parse(dateStr);
}

function runGit(gitPath, args, callback) {
  var child = spawn('git', args, {
    cwd: path.resolve(gitPath)
  });
  var out = '';
  child.stdout.on('data', function (data) {
    out += data;
  });

  child.stderr.on('data', function (data) {
    out += data;
  });

  child.on('exit', function (code) {
    if (code === 0) {
      return callback(null, out);
    } else {
      var err = new Error("Failed running git (error code: " + code + ")\n" + out);
      err.code = code;
      return callback(err);
    }
  });
}

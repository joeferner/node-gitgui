'use strict';

module.exports = function (repoPath) {
  return new GitRepo(repoPath);
};

function GitRepo(repoPath) {
  this.repoPath = repoPath;
}

GitRepo.prototype.createUrl = function (url) {
  if (url.indexOf('?') >= 0) {
    url += '&';
  } else {
    url += '?';
  }
  return url + 'repo=' + encodeURIComponent(this.repoPath);
};

GitRepo.prototype.getStatus = function (callback) {
  $.getJSON(this.createUrl('/git/status.json'),function (status, textStatus) {
    return callback(null, status);
  }).error(ajaxError.bind(null, 'status'));
};

GitRepo.prototype.getLog = function (callback) {
  $.getJSON(this.createUrl('/log.json'),function (log, textStatus) {
    return callback(null, log);
  }).error(ajaxError.bind(null, 'log'));
};

GitRepo.prototype.getTags = function (callback) {
  $.getJSON(this.createUrl('/tags.json'),function (tags, textStatus) {
    return callback(null, tags);
  }).error(ajaxError.bind(null, 'tags'));
};

GitRepo.prototype.getStashes = function (callback) {
  $.getJSON(this.createUrl('/stashes.json'),function (stashes, textStatus) {
    return callback(null, stashes);
  }).error(ajaxError.bind(null, 'stashes'));
};

GitRepo.prototype.getBranches = function (callback) {
  $.getJSON(this.createUrl('/branches.json'),function (branches, textStatus) {
    return callback(null, branches);
  }).error(ajaxError.bind(null, 'branches'));
};

GitRepo.prototype.fetch = function (callback) {
  $.post(this.createUrl('/git/fetch'),function (data, textStatus) {
    return callback(null, data);
  }).error(ajaxError.bind(null, 'fetch'));
};

GitRepo.prototype.pull = function (callback) {
  $.post(this.createUrl('/git/pull'),function (data, textStatus) {
    return callback(null, data);
  }).error(ajaxError.bind(null, 'pull'));
};

GitRepo.prototype.push = function (callback) {
  $.post(this.createUrl('/git/push'),function (data, textStatus) {
    return callback(null, data);
  }).error(ajaxError.bind(null, 'push'));
};

GitRepo.prototype.getCommitInfo = function (id, callback) {
  $.getJSON(this.createUrl('/commit/' + id + '.json'),function (commitInfo, textStatus) {
    return callback(null, commitInfo);
  }).error(ajaxError.bind(null, 'getCommitInfo'));
};

GitRepo.prototype.getDiff = function (id, filename, callback) {
  id = id || 'workingCopy';
  filename = encodeURIComponent(filename);
  $.get(this.createUrl('/commit/' + id + '/' + filename),function (diff, textStatus) {
    return callback(null, diff);
  }).error(ajaxError.bind(null, 'getDiff'));
};

GitRepo.prototype.stage = function (filename, callback) {
  filename = encodeURIComponent(filename);
  $.post(this.createUrl('/git/stage/' + filename),function (data, textStatus) {
    return callback(null, data);
  }).error(ajaxError.bind(null, 'stage'));
};

GitRepo.prototype.reset = function (filename, callback) {
  filename = encodeURIComponent(filename);
  $.post(this.createUrl('/git/reset/' + filename),function (data, textStatus) {
    return callback(null, data);
  }).error(ajaxError.bind(null, 'reset'));
};

GitRepo.prototype.stashPop = function (stashId, callback) {
  stashId = encodeURIComponent(stashId);
  $.post(this.createUrl('/stash/' + stashId + '?action=pop'),function (data, textStatus) {
    return callback(null, data);
  }).error(ajaxError.bind(null, 'stashPop'));
};

GitRepo.prototype.commit = function (message, callback) {
  var data = {
    message: message
  };
  $.post(this.createUrl('/commit'), data,function (data, textStatus) {
    return callback(null, data);
  }).error(ajaxError.bind(null, 'commit'));
};

function ajaxError(cmd, response) {
  showError(response.responseText);
}
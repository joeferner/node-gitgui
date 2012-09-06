'use strict';

module.exports = function (main, repoPath) {
  return new GitRepo(main, repoPath);
};

function GitRepo(main, repoPath) {
  this.main = main;
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
  }).error(this.ajaxError.bind(this, 'status'));
};

GitRepo.prototype.getLog = function (callback) {
  $.getJSON(this.createUrl('/log.json'),function (log, textStatus) {
    return callback(null, log);
  }).error(this.ajaxError.bind(this, 'log'));
};

GitRepo.prototype.getTags = function (callback) {
  $.getJSON(this.createUrl('/tags.json'),function (tags, textStatus) {
    return callback(null, tags);
  }).error(this.ajaxError.bind(this, 'tags'));
};

GitRepo.prototype.getStashes = function (callback) {
  $.getJSON(this.createUrl('/stashes.json'),function (stashes, textStatus) {
    return callback(null, stashes);
  }).error(this.ajaxError.bind(this, 'stashes'));
};

GitRepo.prototype.getBranches = function (callback) {
  $.getJSON(this.createUrl('/branches.json'),function (branches, textStatus) {
    return callback(null, branches);
  }).error(this.ajaxError.bind(this, 'branches'));
};

GitRepo.prototype.fetch = function (callback) {
  $.post(this.createUrl('/git/fetch'),function (data, textStatus) {
    return callback(null, data);
  }).error(this.ajaxError.bind(this, 'fetch'));
};

GitRepo.prototype.pull = function (callback) {
  $.post(this.createUrl('/git/pull'),function (data, textStatus) {
    return callback(null, data);
  }).error(this.ajaxError.bind(this, 'pull'));
};

GitRepo.prototype.push = function (callback) {
  $.post(this.createUrl('/git/push'),function (data, textStatus) {
    return callback(null, data);
  }).error(this.ajaxError.bind(this, 'push'));
};

GitRepo.prototype.getCommitInfo = function (id, callback) {
  $.getJSON(this.createUrl('/commit/' + id + '.json'),function (commitInfo, textStatus) {
    return callback(null, commitInfo);
  }).error(this.ajaxError.bind(this, 'getCommitInfo'));
};

GitRepo.prototype.getDiff = function (id, filename, callback) {
  id = id || 'workingCopy';
  filename = encodeURIComponent(filename);
  $.get(this.createUrl('/commit/' + id + '/' + filename),function (diff, textStatus) {
    return callback(null, diff);
  }).error(this.ajaxError.bind(this, 'getDiff'));
};

GitRepo.prototype.stage = function (filename, callback) {
  filename = encodeURIComponent(filename);
  $.post(this.createUrl('/git/stage/' + filename),function (data, textStatus) {
    return callback(null, data);
  }).error(this.ajaxError.bind(this, 'stage'));
};

GitRepo.prototype.reset = function (filename, callback) {
  filename = encodeURIComponent(filename);
  $.post(this.createUrl('/git/reset/' + filename),function (data, textStatus) {
    return callback(null, data);
  }).error(this.ajaxError.bind(this, 'reset'));
};

GitRepo.prototype.stashPop = function (stashId, callback) {
  stashId = encodeURIComponent(stashId);
  $.post(this.createUrl('/stash/' + stashId + '?action=pop'),function (data, textStatus) {
    return callback(null, data);
  }).error(this.ajaxError.bind(this, 'stashPop'));
};

GitRepo.prototype.stashDrop = function (stashId, callback) {
  stashId = encodeURIComponent(stashId);
  $.post(this.createUrl('/stash/' + stashId + '?action=drop'),function (data, textStatus) {
    return callback(null, data);
  }).error(this.ajaxError.bind(this, 'stashDrop'));
};

GitRepo.prototype.stash = function (stashName, callback) {
  var data = {
    name: stashName
  };
  $.post(this.createUrl('/stash/new?action=save'), data,function (data, textStatus) {
    return callback(null, data);
  }).error(this.ajaxError.bind(this, 'stash'));
};

GitRepo.prototype.tag = function (commit, tagName, tagDescription, callback) {
  var data = {
    commit: commit,
    name: tagName,
    description: tagDescription
  };
  $.post(this.createUrl('/tag/new?action=add'), data,function (data, textStatus) {
    return callback(null, data);
  }).error(this.ajaxError.bind(this, 'tag'));
};

GitRepo.prototype.deleteLocalFile = function (filename, callback) {
  filename = encodeURIComponent(filename);
  $.post(this.createUrl('/local/' + filename + '?action=delete'),function (data, textStatus) {
    return callback(null, data);
  }).error(this.ajaxError.bind(this, 'deleteLocalFile'));
};

GitRepo.prototype.checkout = function (commit, newBranchName, callback) {
  commit = encodeURIComponent(commit);
  var data = {
    newBranchName: newBranchName
  };
  $.post(this.createUrl('/git/checkout/' + commit), data,function (data, textStatus) {
    return callback(null, data);
  }).error(this.ajaxError.bind(this, 'checkout'));
};

GitRepo.prototype.commit = function (message, callback) {
  var data = {
    message: message
  };
  $.post(this.createUrl('/commit'), data,function (data, textStatus) {
    return callback(null, data);
  }).error(this.ajaxError.bind(this, 'commit'));
};

GitRepo.prototype.ajaxError = function (cmd, response) {
  this.main.hideLoadingAndShowError(response.responseText);
};

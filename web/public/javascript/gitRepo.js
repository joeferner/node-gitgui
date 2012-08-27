'use strict';

module.exports = function () {
  return new GitRepo();
};

function GitRepo() {

}

GitRepo.prototype.createUrl = function (url) {
  return url + '?repo=.'; // TODO don't hard code this
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

function ajaxError(cmd, response) {
  showError(response.responseText);
}
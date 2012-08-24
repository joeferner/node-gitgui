'use strict';

module.exports = function () {
  return new GitRepo();
};

function GitRepo() {

}

GitRepo.prototype.createUrl = function (url) {
  return url + '?repo=.'; // TODO don't hard code this
};


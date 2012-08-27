'use strict';

var git = require('../gitWrapper');

module.exports = function (app) {
  app.get('/commit/:id/:filename', getDiff);
  app.get('/commit/:id.json', getCommitInfo);
};

function getDiff(req, res, next) {
  var repoName = req.query.repo;
  var id = req.params.id;
  var filename = req.params.filename;
  if (id === 'workingCopy') {
    id = null;
  }
  git.getDiff(repoName, id, filename, function (err, diff) {
    if (err) {
      console.error('could not get diff info: ' + repoName + ' id: ' + id, err);
      return next(err);
    }
    res.end(diff);
  });
}

function getCommitInfo(req, res, next) {
  var repoName = req.query.repo;
  var id = req.params.id;
  if (id === 'workingCopy') {
    id = null;
  }
  git.getCommitInfo(repoName, id, function (err, commitInfo) {
    if (err) {
      console.error('could not get commit info: ' + repoName + ' id: ' + id, err);
      return next(err);
    }
    res.end(JSON.stringify(commitInfo));
  });
}

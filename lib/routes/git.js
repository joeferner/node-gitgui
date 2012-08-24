'use strict';

var git = require('../gitWrapper');

module.exports = function (app) {
  app.post('/git/fetch', postFetch);
  app.post('/git/pull', postPull);
  app.post('/git/push', postPush);
};

function postFetch(req, res, next) {
  var repoName = req.query.repo;
  git.fetch(repoName, function (err, results) {
    if (err) {
      console.error('could not fetch: ' + repoName, err);
      return next(err);
    }
    res.end("OK: " + results);
  });
}

function postPull(req, res, next) {
  var repoName = req.query.repo;
  git.pull(repoName, function (err, results) {
    if (err) {
      console.error('could not pull: ' + repoName, err);
      return next(err);
    }
    res.end("OK: " + results);
  });
}

function postPush(req, res, next) {
  var repoName = req.query.repo;
  git.push(repoName, function (err, results) {
    if (err) {
      console.error('could not push: ' + repoName, err);
      return next(err);
    }
    res.end("OK: " + results);
  });
}
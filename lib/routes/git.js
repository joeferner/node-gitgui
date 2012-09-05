'use strict';

var git = require('../gitWrapper');

module.exports = function (app) {
  app.get('/git/status.json', getStatus);
  app.post('/git/fetch', postFetch);
  app.post('/git/pull', postPull);
  app.post('/git/push', postPush);
  app.post('/git/stage/:filename', postStage);
  app.post('/git/reset/:filename', postReset);
  app.post('/git/checkout/:branch', postCheckout);
};

function postCheckout(req, res, next) {
  var repoName = req.query.repo;
  var branch = req.params.branch;
  var newBranchName = req.body.newBranchName;
  git.checkout(repoName, branch, newBranchName, function (err, results) {
    if (err) {
      console.error('could not checkout: ' + repoName + ' branch: ' + branch, err);
      return next(err);
    }
    res.end("OK: " + results);
  });
}

function getStatus(req, res, next) {
  var repoName = req.query.repo;
  git.getStatus(repoName, function (err, results) {
    if (err) {
      console.error('could not get status: ' + repoName, err);
      return next(err);
    }
    res.end(JSON.stringify(results));
  });
}

function postStage(req, res, next) {
  var repoName = req.query.repo;
  var filename = req.params.filename;
  git.stage(repoName, filename, function (err, results) {
    if (err) {
      console.error('could not stage: ' + repoName + ' filename: ' + filename, err);
      return next(err);
    }
    res.end("OK: " + results);
  });
}

function postReset(req, res, next) {
  var repoName = req.query.repo;
  var filename = req.params.filename;
  git.reset(repoName, filename, function (err, results) {
    if (err) {
      console.error('could not reset: ' + repoName + ' filename: ' + filename, err);
      return next(err);
    }
    res.end("OK: " + results);
  });
}

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
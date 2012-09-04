'use strict';

var git = require('../gitWrapper');

module.exports = function (app) {
  app.get('/tags.json', getTags);
  app.post('/tag/:tagName', postTag);
};

function postTag(req, res, next) {
  var action = req.query.action;
  switch (action) {
  case 'add':
    return tagAdd(req, res, next);
  default:
    return next(new Error("Invalid tag action"));
  }
}

function tagAdd(req, res, next) {
  var repoName = req.query.repo;
  var commit = req.body.commit;
  var tagName = req.body.name;
  var tagDescription = req.body.description;
  git.tagAdd(repoName, commit, tagName, tagDescription, function (err) {
    if (err) {
      console.error('could not tag: ' + repoName + ' commit: ' + commit + ' tagName: ' + tagName, err);
      return next(err);
    }
    res.end("OK");
  });
}

function getTags(req, res, next) {
  var repoName = req.query.repo;
  git.tags(repoName, function (err, tags) {
    if (err) {
      console.error('could not get repo tags: ' + repoName, err);
      return next(err);
    }
    res.end(JSON.stringify(tags));
  });
}

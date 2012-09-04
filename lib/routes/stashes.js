'use strict';

var git = require('../gitWrapper');

module.exports = function (app) {
  app.get('/stashes.json', getStashes);
  app.post('/stash/:stashId', postStash);
};

function postStash(req, res, next) {
  var action = req.query.action;
  switch (action) {
  case 'pop':
    return stashPop(req, res, next);
  default:
    return next(new Error("Invalid stash action"));
  }
}

function stashPop(req, res, next) {
  var repoName = req.query.repo;
  var stashId = req.params.stashId;
  git.stashPop(repoName, stashId, function (err) {
    if (err) {
      console.error('could not pop stash: ' + repoName + ' stashId: ' + stashId, err);
      return next(err);
    }
    res.end("OK");
  });
}

function getStashes(req, res, next) {
  var repoName = req.query.repo;
  git.stashes(repoName, function (err, stashes) {
    if (err) {
      console.error('could not get repo stashes: ' + repoName, err);
      return next(err);
    }
    res.end(JSON.stringify(stashes));
  });
}

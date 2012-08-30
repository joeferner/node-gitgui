'use strict';

var git = require('../gitWrapper');

module.exports = function (app) {
  app.get('/stashes.json', getStashes);
};

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

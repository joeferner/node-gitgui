'use strict';

var git = require('../gitWrapper');

module.exports = function (app) {
  app.get('/branches.json', getBranches);
};

function getBranches(req, res, next) {
  var repoName = req.query.repo;
  git.branches(repoName, function (err, branches) {
    if (err) {
      console.error('could not get repo branches: ' + repoName, err);
      return next(err);
    }
    res.end(JSON.stringify(branches));
  });
}

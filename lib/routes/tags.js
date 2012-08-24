'use strict';

var git = require('../gitWrapper');

module.exports = function (app) {
  app.get('/tags.json', getBranches);
};

function getBranches(req, res, next) {
  var repoName = req.query.repo;
  git.tags(repoName, function (err, tags) {
    if (err) {
      console.error('could not get repo tags: ' + repoName, err);
      return next(err);
    }
    res.end(JSON.stringify(tags));
  });
}

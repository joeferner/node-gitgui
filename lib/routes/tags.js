'use strict';

var git = require('../gitWrapper');

module.exports = function (app) {
  app.get('/tags.json', getTags);
};

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

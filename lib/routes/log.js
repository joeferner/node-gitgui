'use strict';

var git = require('../gitWrapper');

module.exports = function (app) {
  app.get('/log.json', getLog);
};

function getLog(req, res, next) {
  var repoName = req.query.repo;
  git.log(repoName, function (err, log) {
    if (err) {
      console.error('could not get repo log: ' + repoName, err);
      return next(err);
    }
    res.end(JSON.stringify(log));
  });
}

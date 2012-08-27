'use strict';

var git = require('../gitWrapper');

module.exports = function (app) {
  app.get('/raw/:commitId/:filename', getRawFile);
};

function getRawFile(req, res, next) {
  var repoName = req.query.repo;
  var commitId = req.params.commitId;
  var filename = req.params.filename;
  git.getRawFileData(repoName, commitId, filename, function (err, rawData) {
    if (err) {
      console.error('could not get raw data: ' + repoName + ' commitId: ' + commitId + ' filename:' + filename, err);
      return next(err);
    }
    res.end(rawData);
  });
}

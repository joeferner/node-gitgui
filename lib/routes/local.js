'use strict';

var git = require('../gitWrapper');
var fs = require('fs');
var path = require('path');

module.exports = function (app) {
  app.post('/local/:filename', postLocalFilename);
};

function postLocalFilename(req, res, next) {
  var repoName = req.query.repo;
  var action = req.query.action;
  var filename = req.params.filename;
  switch (action) {
  case 'delete':
    return deleteLocalFile(repoName, filename, function (err) {
      if (err) {
        return next(err);
      }
      return res.end('ok');
    });
  default:
    return next(new Error("Invalid local action: " + action));
  }
}

function deleteLocalFile(repoName, filename, callback) {
  filename = path.join(repoName, filename);
  return fs.unlink(filename, callback);
}
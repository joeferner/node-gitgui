'use strict';

module.exports = function (app) {
  app.get('/', index);
};

function index(req, res, next) {
  res.render('index', {

  });
}

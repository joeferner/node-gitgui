'use strict';

module.exports = function (app) {
  app.get('/', index);
  require('./branches')(app);
  require('./tags')(app);
};

function index(req, res, next) {
  res.render('index', {
  });
}

'use strict';

module.exports = function (app) {
  app.get('/', index);
  require('./branches')(app);
  require('./tags')(app);
  require('./stashes')(app);
  require('./log')(app);
  require('./git')(app);
  require('./commit')(app);
  require('./raw')(app);
  require('./local')(app);
};

function index(req, res, next) {
  res.render('index', {
  });
}

'use strict';

exports.add = function (fn, opts) {
  opts.activityInterval = opts.activityInterval || 10 * 1000;
  opts.activityTimeoutCount = opts.activityTimeoutCount || 2;
  opts.noActivityInterval = opts.noActivityInterval || 30 * 60 * 1000;

  var activityInterval = null;
  var noActivityCount = 0;
  $('body').mousemove(function () {
    noActivityCount = 0;
    if (!activityInterval) {
      activityInterval = setInterval(function () {
        console.log(new Date(), 'activity');
        noActivityCount++;
        if (noActivityCount > opts.activityTimeoutCount) {
          console.log(new Date(), 'activity clear');
          clearInterval(activityInterval);
          activityInterval = null;
        }
      }, opts.activityInterval);
      fn();
    }
  });

  setInterval(function () {
    console.log(new Date(), 'no activity timer');
    fn();
  }, opts.noActivityInterval);
};

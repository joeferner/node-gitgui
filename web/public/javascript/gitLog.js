'use strict';

module.exports = function () {
  $('#gitLog').dataTable({
    bJQueryUI: true,
    sPaginationType: "full_numbers",
    bFilter: false,
    bInfo: false,
    bLengthChange: false,
    bPaginate: false
  });
  $('#gitLog_wrapper .fg-toolbar').hide();
};

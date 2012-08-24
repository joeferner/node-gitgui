'use strict';

module.exports = function (gitRepo, gitLog, mainTree) {
  $('body').layout({
    applyDefaultStyles: false,
    fxName: "slide",
    fxSettings_open: { easing: "easeInQuint" },
    fxSettings_close: { easing: "easeOutQuint" },
    north__fxName: "none",
    defaults: {
      paneClass: "pane",
      resizerClass: "resizer",
      togglerClass: "toggler",
      buttonClass: "button",
      hideTogglerOnSlide: true
    },
    north: {
      spacing_open: 1,
      togglerLength_open: 0,
      togglerLength_closed: -1,
      resizable: false,
      slidable: false
    },
    west: {
      togglerAlign_closed: "top",
      togglerLength_open: 0
    }
  });

  $('#toolbarRefresh').click(function () {
    mainTree.refresh();
  });
};

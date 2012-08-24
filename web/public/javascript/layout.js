'use strict';

module.exports = function (gitRepo, gitLog, mainTree) {
  $('body').layout({
    applyDefaultStyles: false,
    fxName: "slide",
    fxSettings_open: { easing: "easeInQuint" },
    fxSettings_close: { easing: "easeOutQuint" },
    north__fxName: "none",
    center__paneSelector: ".outer-center",
    defaults: {
      paneClass: "pane",
      resizerClass: "resizer",
      togglerClass: "toggler",
      buttonClass: "button",
      hideTogglerOnSlide: true
    },
    north: {
      minSize: 93,
      maxSize: 93,
      spacing_open: 1,
      togglerLength_open: 0,
      togglerLength_closed: -1,
      resizable: false,
      slidable: false
    },
    west: {
      togglerAlign_closed: "top",
      togglerLength_open: 0
    },
    center__childOptions: {
      defaults: {
        paneClass: "pane",
        resizerClass: "resizer",
        togglerClass: "toggler",
        buttonClass: "button",
        hideTogglerOnSlide: true
      },
      south: {
        togglerAlign_closed: "left",
        togglerLength_open: 0
      },
      center__paneSelector: ".middle-center",
      south__paneSelector: ".middle-south"
    }
  });

  $().Ribbon();

  $('#toolbarRefresh').click(function () {
    mainTree.refresh();
    gitLog.refresh();
  });
};

/* jshint node: true, esnext: true */

var newStore = require('./store');

module.exports = (dispatcher) => {

  var displayed = {};

  function getDisplayedChildren(path) {
    return displayed[path] || [];
  }

  var { onChange, offChange } = newStore(dispatcher, {
    REFERENCE_CHANGED : () => {
      displayed = {};
    },
    PATH_DISPLAYED : (action) => {
      var d = displayed[action.path];
      if (!d) {
        d = [];
        displayed[action.path] = d;
      }
      d.push(action.child);
    },
    PATH_HIDDEN : (action) => {
      var d = displayed[action.path];
      if (d) {
        displayed[action.path] = d.filter(child => action.child !== child);
      }
    }
  });

  return { onChange, offChange, getDisplayedChildren };
};
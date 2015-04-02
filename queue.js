/* jshint node: true, esnext: true */
'use strict';

function queue(fn, scope, max) {
  var q = [], ongoing = 0;

  function mayProcess() {
    if (ongoing < max && q.length > 0) {
      var next = q.pop();
      ongoing++;
      next();
      mayProcess();
    }
  }

  function release() {
    ongoing--;
    mayProcess();
  }

  return function () {
    var args = Array.prototype.slice.call(arguments);
    return new Promise(resolve => { q.push(resolve); mayProcess(); })
      .then(() => {
        var p = fn.apply(scope, args);
        p.then(release, release);
        return p;
      });
  };
}

module.exports = queue;

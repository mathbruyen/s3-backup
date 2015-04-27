/* jshint node: true, esnext: true */
'use strict';

function callback(fn, scope) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      args.push((err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
      fn.apply(scope, args);
    });
  };
}

module.exports = callback;

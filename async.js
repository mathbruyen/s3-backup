/* jshint node: true, esnext: true */
'use strict';

function async(cont) {
  return new Promise((resolve, reject) => {
    cont((err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

module.exports = async;

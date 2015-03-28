/* jshint node: true, esnext: true */
'use strict';

var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');

module.exports = (root) => {

  function getFile(hash) {
    return path.join(root, hash.substring(0, 2), hash.substring(2));
  }

  function saveRaw(hash, raw, callback) {
    if (!callback) {
      return saveRaw.bind(null, hash, raw);
    }

    var file = getFile(hash);
    fs.stat(file, (err, data) => {
      if (err && err.code === 'ENOENT') {
        mkdirp(path.dirname(file), err => {
          if (err) {
            callback(err);
          } else {
            fs.writeFile(file, raw, callback);
          }
        });
      } else {
        callback(err);
      }
    });
  }

  function loadRaw(hash, callback) {
    if (!callback) {
      return loadRaw.bind(null, hash);
    }

    fs.readFile(getFile(hash), (err, buffer) => {
      if (err && err.code === 'ENOENT') {
        callback();
      } else {
        callback(err, buffer);
      }
    });
  }

  return { saveRaw, loadRaw };
};

/* jshint node: true, esnext: true */
'use strict';

var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var callback = require('./callback');

var mkdirs = callback(mkdirp);
var writeFile = callback(fs.writeFile, fs);
var readFile = callback(fs.readFile, fs);

function existsFile(file) {
  return new Promise((resolve, reject) => {
    fs.stat(file, err => {
      if (err && err.code === 'ENOENT') {
        resolve(false);
      } else if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

module.exports = (root) => {

  function getFile(hash) {
    return path.join(root, hash.substring(0, 2), hash.substring(2));
  }

  function saveRaw(hash, raw) {
    var file = getFile(hash);
    return existsFile(file)
      .then(exists => {
        if (!exists) {
          return mkdirs(path.dirname(file)).then(() => writeFile(file, raw));
        }
      });
  }

  function loadRaw(hash) {
    return readFile(getFile(hash))
      .then(null, err => {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      });
  }

  function exists(hash) {
    return existsFile(getFile(hash));
  }

  return { saveRaw, loadRaw, exists };
};

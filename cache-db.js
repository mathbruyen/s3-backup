/* jshint node: true, esnext: true */
'use strict';

var async = require('./async');
var sha1 = require('git-sha1');
var codec = require('js-git/lib/object-codec');
var inflate = require('js-git/lib/inflate');
var deflate = require('js-git/lib/deflate');

module.exports = (cache, central, types) => {

  function isCached(type) {
    return types.indexOf(type) >= 0;
  }

  function saveAs(type, body, callback) {
    if (!callback) {
      return saveAs.bind(null, type, body);
    }

    try {
      var raw = deflate(codec.frame({
        type : type,
        body : codec.encoders[type](body)
      }));
      var hash = sha1(raw);

      var promises = [async(central.saveRaw(hash, raw))];
      if (isCached(type)) {
        promises.push(async(cache.saveRaw(hash, raw)));
      }
      Promise.all(promises).then(() => callback(null, hash), err => callback(err));
    } catch (err) {
      callback(err);
    }
  }

  function loadAs(type, hash, callback) {
    if (!callback) {
      return loadAs.bind(null, type, hash);
    }

    if (isCached(type)) {
      cache.loadRaw(hash, (err, raw) => {
        if (err) {
          callback(err);
        } else if (raw) {
          callback(null, inflate(raw));
        } else {
          central.loadRaw(hash, (err, raw) => {
            cache.saveRaw(hash, raw, (err) => {
              callback(err, inflate(raw));
            });
          });
        }
      });
    } else {
      central.loadRaw(hash, callback);
    }
  }

  return {
    saveAs,
    loadAs,
    readRef : central.readRef.bind(central),
    updateRef : central.updateRef.bind(central)
  };
};

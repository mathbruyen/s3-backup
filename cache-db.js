/* jshint node: true, esnext: true */
'use strict';

var sha1 = require('git-sha1');
var codec = require('js-git/lib/object-codec');
var inflate = require('js-git/lib/inflate');
var deflate = require('js-git/lib/deflate');

module.exports = (cache, central, types) => {

  function isCached(type) {
    return types.indexOf(type) >= 0;
  }

  function encode(type, body) {
    try {
      var binary = codec.encoders[type](body);
      var frame = codec.frame({ type : type, body : binary });
      var raw = deflate(frame);
      var hash = sha1(raw);
      return Promise.resolve({ raw, hash });
    } catch (err) {
      return Promise.reject(err);
    }
  }

  function saveAs(type, body) {
    return encode(type, body)
      .then(({ raw, hash }) => {
        var p;
        if (isCached(type)) {
          p = central.saveRaw(hash, raw);
        } else {
          p = Promise.all([central.saveRaw(hash, raw), cache.saveRaw(hash, raw)]);
        }
        return p.then(() => hash);
      });
  }

  function loadAs(type, hash) {
    var promise;
    if (isCached(type)) {
      promise = cache.loadRaw(hash)
        .then(buffer => {
          if (!buffer) {
            return central.loadRaw(hash)
              .then(raw => {
                cache.saveRaw(hash, raw).then(() => raw);
              });
          }
        });
    } else {
      promise = central.loadRaw(hash);
    }
    return promise.then(inflate);
  }

  return {
    saveAs,
    loadAs,
    readRef : central.readRef.bind(central),
    updateRef : central.updateRef.bind(central)
  };
};

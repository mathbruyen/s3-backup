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
      var raw = codec.frame({ type : type, body : binary });
      return Promise.resolve(raw);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  function saveAs(type, body) {
    return encode(type, body)
      .then(raw => {
        var p, hash = sha1(raw), buffer = deflate(raw);
        if (isCached(type)) {
          p = Promise.all([central.saveRaw(hash, buffer), cache.saveRaw(hash, buffer)]);
        } else {
          p = central.saveRaw(hash, buffer);
        }
        return p.then(() => hash);
      });
  }

  function hash(type, body) {
    return encode(type, body).then(sha1);
  }

  function inStore(hash) {
    return cache.exists(hash)
      .then(ex => {
        if (ex) {
          return true;
        } else {
          return central.exists(hash);
        }
      });
  }

  function loadAs(type, hash) {
    var promise;
    if (isCached(type)) {
      promise = cache.loadRaw(hash)
        .then(buffer => {
          if (buffer) {
            return buffer;
          } else {
            return central.loadRaw(hash)
              .then(raw => {
                cache.saveRaw(hash, raw).then(() => raw);
              });
          }
        });
    } else {
      promise = central.loadRaw(hash);
    }
    return promise.then(inflate)
      .then(buffer => {
        if (buffer) {
          var raw = codec.deframe(buffer);
          if (raw.type !== type) {
            throw new TypeError('Expected a git ' + type + ', found a ' + raw.type);
          }
          return codec.decoders[raw.type](raw.body);
        }
      });
  }

  return {
    saveAs,
    loadAs,
    hash,
    inStore,
    readRef : central.readRef.bind(central),
    updateRef : central.updateRef.bind(central)
  };
};

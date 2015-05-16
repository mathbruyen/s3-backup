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
    return Promise.resolve(body)
      .then(b => codec.encoders[type](b))
      .then(binary => codec.frame({ type : type, body : binary }));
  }

  function decode(type, buffer) {
    return Promise.resolve(buffer)
      .then(raw => codec.deframe(raw))
      .then(deframed => {
        if (deframed.type === type) {
          return deframed.body;
        } else {
          throw new TypeError('Expected a git ' + type + ', found a ' + deframed.type);
        }
      })
      .then(body => codec.decoders[type](body));
  }

  function saveAs(type, body) {
    return encode(type, body)
      .then(raw => {
        var hash = sha1(raw);
        var buffer = deflate(raw);
        var p = central.saveRaw(hash, buffer);
        if (isCached(type)) {
          p = p.then(() => cache.saveRaw(hash, buffer));
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
            return central.loadRaw(hash).then(raw => cache.saveRaw(hash, raw).then(() => raw));
          }
        });
    } else {
      promise = central.loadRaw(hash);
    }
    return promise.then(inflate)
        .then(buffer => {
          var h = sha1(buffer);
          if (hash === h) {
            return buffer;
          } else {
            throw new Error('Invalid content, expected to have hash ' + hash + ' but got ' + h);
          }
        })
        .then(buffer => decode(type, buffer));
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

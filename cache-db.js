/* jshint node: true, esnext: true */
'use strict';

var async = require('./async');
var sha1 = require('git-sha1');
var codec = require('js-git/lib/object-codec');

module.exports = (routing, references) => {

  function saveAs(type, body, callback) {
    if (!callback) {
      return saveAs.bind(null, type, body);
    }

    try {
      var raw = codec.frame({ type : type, body : codec.encoders[type](body) });
      var hash = sha1(raw);
      saveRaw(type, hash, raw, callback);
    } catch (err) {
      callback(err);
    }
  }

  function saveRaw(type, hash, raw, callback) {
    var routed = routing[type];
    if (!routed) {
      return callback(new Error('No store for ' + type + ' type'));
    }

    var promises = routed.map(r => async(r.saveRaw(hash, raw)));
    Promise.all(promises).then(() => callback(null, hash), err => callback(err));
  }

  function loadAs(type, hash, callback) {
    if (!callback) {
      return loadAs.bind(null, type, hash);
    }
    
    var routed = routing[type];
    if (!routed) {
      return callback(new Error('No store for ' + type + ' type'));
    }

    loadRaw(routed, 0, hash, (err, raw) => {
      if (raw === undefined) {
        callback(err);
      } else {
        try {
          var deframed = codec.deframe(raw);
          if (deframed.type !== type) {
            throw new TypeError('Type mismatch, expected ' + type + ' but found ' + type);
          }
          var body = codec.decoders[deframed.type](deframed.body);
          callback(null, body);
        } catch (err) {
          callback(err);
        }
      }
    });
  }

  function loadRaw(dbs, idx, type, hash, callback) {
    dbs[idx].loadRaw(type, hash, (err, raw) => {
      if (err) {
        callback(err);
      } else if (raw) {
        // TODO save in cache
        callback(null, raw);
      } else if (idx < dbs.length) {
        loadRaw(dbs, idx++, type, hash, callback);
      } else {
        callback();
      }
    });
  }

  return {
    saveAs,
    loadAs,
    readRef : references.readRef.bind(references),
    updateRef : references.updateRef.bind(references)
  };
};

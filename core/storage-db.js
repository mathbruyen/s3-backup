/* jshint node: true, esnext: true */
'use strict';

var Buffer = require('buffer').Buffer;

module.exports = (storage) => {

  function saveRaw(hash, raw) {
    return new Promise(resolve => {
      storage.setItem(hash, raw.toString('base64'));
      // TODO handle quota errors by pruning random keys (but not config)
      resolve();
    });
  }

  function loadRaw(hash) {
    return new Promise(resolve => {
      var str = storage.getItem(hash);
      if (str === null) {
        resolve();
      } else {
        resolve(new Buffer(str, 'base64'));
      }
    });
  }

  function exists(hash) {
    return new Promise(resolve => {
      resolve(storage.getItem(hash) !== null);
    });
  }

  return { saveRaw, loadRaw, exists };
};

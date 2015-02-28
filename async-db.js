/* jshint node: true, esnext: true */
'use strict';

module.exports = (db) => {

  function saveAs(type, body, callback) {
    if (!callback) {
      return saveAs.bind(null, type, body);
    } else {
      return db.saveAs(type, body, callback);
    }
  }

  function loadAs(type, hash, callback) {
    if (!callback) {
      return loadAs.bind(null, type, hash);
    } else {
      return db.loadAs(type, hash, callback);
    }
  }

  function saveRaw(hash, raw, callback) {
    if (!callback) {
      return saveRaw.bind(null, hash, raw);
    } else {
      return db.saveRaw(hash, raw, callback);
    }
  }

  function loadRaw(hash, callback) {
    if (!callback) {
      return loadRaw.bind(null, hash);
    } else {
      return db.loadRaw(hash, callback);
    }
  }

  function readRef(ref, callback) {
    if (!callback) {
      return readRef.bind(null, ref);
    } else {
      return db.readRef(ref, callback);
    }
  }

  function updateRef(ref, hash, callback) {
    if (!callback) {
      return updateRef.bind(null, ref, hash);
    } else {
      return db.updateRef(ref, hash, callback);
    }
  }
  
  return { saveAs, loadAs, saveRaw, loadRaw, readRef, updateRef };
};

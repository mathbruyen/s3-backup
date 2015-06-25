/* jshint node: true, esnext: true */
'use strict';

var newStore = require('./store');

module.exports = (dispatcherSubscribe) => {

  var refs = {};
  var objects = {};

  function getObject(hash) {
    return objects[hash];
  }

  function getRef(ref) {
    return refs[ref];
  }

  var { onChange, offChange } = newStore(dispatcherSubscribe, {
    BUCKET_CHANGED : (action) => {
      refs = {};
    },
    OBJECT_LOAD_REQUESTED : (action) => {
      objects[action.hash] = { loading : true };
    },
    OBJECT_LOADED : (action) => {
      objects[action.hash] = { type : action.type, body : action.body , loading : false };
    },
    REFERENCE_LOAD_REQUESTED : (action) => {
      refs[action.ref] = { loading : true };
    },
    REFERENCE_LOADED : (action) => {
      refs[action.ref] = { loading : false, hash : action.commitHash };
    }
    // TODO handle errors
  });

  return { onChange, offChange, getObject, getRef };
};

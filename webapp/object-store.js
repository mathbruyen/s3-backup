/* jshint node: true, esnext: true */

var AWS = require('aws-sdk');
AWS.config.update({ region : 'eu-west-1' });

var Buffer = require('buffer').Buffer;
var s3db = require('../core/s3-db');
var storagedb = require('../core/storage-db');
var cachedb = require('../core/cache-db');
var newStore = require('./store');

module.exports = (dispatcherSubscribe, storage) => {

  function readConfig() {
    var str = storage.getItem('config');
    if (str === null) {
      return {};
    } else {
      return JSON.parse(str);
    }
  }

  // TODO use immutable data structure
  var config = readConfig();
  function getConfig() {
    return config;
  }

  function updateAws() {
    AWS.config.update({ accessKeyId: config.id, secretAccessKey : config.secret });
  }
  updateAws();

  var store, commit;
  function updateStore() {
    commit = undefined;
    if (config.bucket && config.key) {
      store = cachedb(storagedb(storage), s3db(AWS, config.bucket, config.key), ['tree', 'commit']);
    } else {
      store = undefined;
    }
  }
  function getStore() {
    return store;
  }
  function getCommit() {
    return commit;
  }
  updateStore();

  function writeConfig() {
    storage.setItem('config', JSON.stringify(config));
  }

  var objects = {};
  function getObject(hash) {
    return objects[hash];
  }

  var { onChange, offChange } = newStore(dispatcherSubscribe, {
    KEY_ID_CHANGED : (action) => {
      config.id = action.id;
      updateAws();
      writeConfig();
    },
    KEY_SECRET_CHANGED : (action) => {
      config.secret = action.secret;
      updateAws();
      writeConfig();
    },
    BUCKET_CHANGED : (action) => {
      config.bucket = action.bucket;
      updateStore();
      writeConfig();
    },
    ENCRYPTION_KEY_CHANGED : (action) => {
      config.key = action.key;
      updateStore();
      writeConfig();
    },
    REFERENCE_CHANGED : (action) => {
      config.ref = action.ref;
      writeConfig();
    },
    OBJECT_LOAD_REQUESTED : (action) => {
      objects[action.hash] = { loading : true };
    },
    OBJECT_LOADED : (action) => {
      objects[action.hash] = { type : action.type, body : action.body , loading : false };
    },
    REFERENCE_LOAD_REQUESTED : (action) => {
      if (config.ref === action.ref) {
        commit = { loading : true };
      }
    },
    REFERENCE_LOADED : (action) => {
      if (config.ref === action.ref) {
        commit = { loading : false, hash : action.commitHash };
      }
    }
  });

  return { onChange, offChange, getConfig, getCommit, getObject, getStore };
};

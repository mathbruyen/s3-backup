/* jshint node: true, esnext: true */

var AWS = require('aws-sdk');
AWS.config.update({ region : 'eu-west-1' });

var Buffer = require('buffer').Buffer;
var s3db = require('../core/s3-db');
var storagedb = require('../core/storage-db');
var cachedb = require('../core/cache-db');
var newStore = require('./store');

module.exports = (dispatcher, storage) => {

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
  updateStore();

  function writeConfig() {
    storage.setItem('config', JSON.stringify(config));
  }

  function getCommit() {
    if (!store) {
      return { loading : true };
    }
    if (!commit) {
      store.readRef(config.ref)
        .then(
          hash => dispatcher.dispatch({ action : 'CURRENT_COMMIT_CHANGED', hash }),
          error => console.error(error)
        );
      commit = { loading : true };
    }
    return commit;
  }

  var objects = {};
  function getObject(type, hash) {
    if (!store) {
      return { loading : true };
    }
    if (!objects[hash]) {
      store.loadAs(type, hash)
        .then(
          body => dispatcher.dispatch({ action : 'OBJECT_READ', type, hash, body }),
          error => console.error(error)
        );
      objects[hash] = { loading : true };
    }
    return objects[hash];
  }

  var onChange = newStore(dispatcher, {
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
    CURRENT_COMMIT_CHANGED : (action) => {
      commit = { hash : action.hash, loading : false };
    },
    OBJECT_READ : (action) => {
      objects[action.hash] = { type : action.type, body : action.body , loading : false };
    }
  });

  function getConfig() {
    return config;
  }

  return { onChange, getConfig, getCommit, getObject };
};

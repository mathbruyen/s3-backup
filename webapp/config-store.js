/* jshint node: true, esnext: true */
'use strict';

var AWS = require('aws-sdk');
AWS.config.update({ region : 'eu-west-1' });

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

  function updateAws() {
    AWS.config.update({ accessKeyId: config.id, secretAccessKey : config.secret });
  }
  updateAws();

  var store;
  function updateStore() {
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

  function getConfig() {
    return config;
  }

  function getStore() {
    return store;
  }

  function getReference() {
    return config.ref;
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
    }
  });

  return { onChange, offChange, getConfig, getStore, getReference };
};

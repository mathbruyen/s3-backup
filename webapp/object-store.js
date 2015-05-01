/* jshint node: true, esnext: true */

//var AWS = require('aws-sdk');
//var s3db = require('../core/s3-db');
//var storagedb = require('../core/storage-db');
//var cachedb = require('../core/cache-db');
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

  function writeConfig(config) {
    storage.setItem('config', JSON.stringify(config));
  }

  // TODO use immutable data structure
  return newStore(dispatcher, { config : readConfig() }, {
    KEY_ID_CHANGED : (value, action) => {
      value.config.id = action.id;
      writeConfig(value.config);
      return value;
    },
    KEY_SECRET_CHANGED : (value, action) => {
      value.config.secret = action.secret;
      writeConfig(value.config);
      return value;
    },
    BUCKET_CHANGED : (value, action) => {
      value.config.bucket = action.bucket;
      writeConfig(value.config);
      return value;
    },
    ENCRYPTION_KEY_CHANGED : (value, action) => {
      value.config.key = action.key;
      writeConfig(value.config);
      return value;
    },
    REFERENCE_CHANGED : (value, action) => {
      value.config.ref = action.ref;
      writeConfig(value.config);
      return value;
    }
  });
};

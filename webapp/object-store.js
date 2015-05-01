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

  // TODO use immutable data structure
  var config = readConfig();

  function writeConfig() {
    storage.setItem('config', JSON.stringify(config));
  }

  function getConfig() {
    return config;
  }

  var onChange = newStore(dispatcher, {
    KEY_ID_CHANGED : (action) => {
      config.id = action.id;
      writeConfig();
    },
    KEY_SECRET_CHANGED : (action) => {
      config.secret = action.secret;
      writeConfig();
    },
    BUCKET_CHANGED : (action) => {
      config.bucket = action.bucket;
      writeConfig();
    },
    ENCRYPTION_KEY_CHANGED : (action) => {
      config.key = action.key;
      writeConfig();
    },
    REFERENCE_CHANGED : (action) => {
      config.ref = action.ref;
      writeConfig();
    }
  });

  return { onChange, getConfig };
};

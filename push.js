/* jshint node: true, esnext: true */
'use strict';

var AWS = require('aws-sdk');
var modes = require('js-git/lib/modes');

var fs = require('fs');
var path = require('path');

var async = require('./async');
var s3db = require('./s3-db');
var fsdb = require('./fs-db');
var cachedb = require('./cache-db');

var conf = require('./conf.json');

AWS.config.update({ region : 'eu-west-1' });
if (process.env.DEBUG) {
  AWS.config.update({ logger : process.stdout });
}

function listFiles(folder) {
  return new Promise((resolve, reject) => {
    fs.readdir(folder, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer);
      }
    });
  });
}

function stat(file) {
  return new Promise((resolve, reject) => {
    fs.stat(file, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
}

function uploadFile(repo, file) {
  return readFile(file).then(buffer => async(repo.saveAs('blob', buffer)));
}

function uploadFolder(repo, folder) {
  // TODO process only one folder at a time
  // TODO compute tree id and check whether it already exists
  return listFiles(folder)
    .then(files => {
      return Promise.all(files.map(uploadFileOrFolder.bind(null, repo, folder)));
    })
    .then(items => {
      return items.reduce((tree, item) => {
        tree[item.name] = { mode : item.mode, hash : item.hash };
        return tree;
      }, {});
    })
    .then(tree => async(repo.saveAs('tree', tree)));
}

function uploadFileOrFolder(repo, folder, file) {
  var item = path.join(folder, file);
  return stat(item)
    .then(stats => {
      if (stats.isFile()) {
        return uploadFile(repo, item).then(hash => {
          return { name : file, mode : modes.file, hash : hash };
        });
      } else if (stats.isDirectory()) {
        return uploadFolder(repo, item).then(hash => {
          return { name : file, mode : modes.tree, hash : hash };
        });
      } else {
        return Promise.reject(new Error('Unrecognized stats: ' + JSON.stringify(stats)));
      }
    });
}

s3db(AWS, conf.bucket, conf.key)
  .then(s3repo => {
    var fsrepo = fsdb(conf.cache);
    return cachedb(fsrepo, s3repo, ['tree', 'commit']);
  })
  .then(repo => {
    return Promise.all(Object.keys(conf.folders).map(ref => {
      return uploadFolder(repo, conf.folders[ref])
        .then(treeHash => {
          // TODO keep parent
          return async(repo.saveAs('commit', {
            parents : [],
            author : { name : 'Mathieu', email : 'code@mais-h.eu', date : new Date() },
            committer : { name : 'Mathieu', email : 'code@mais-h.eu', date : new Date() },
            tree : treeHash,
            message : 'Push'
          }));
        })
        .then(commitHash => {
          // TODO make reference update safe for concurrent access
          return repo.updateRef(ref, commitHash);
        });
    }));
  }).then(console.log.bind(console, 'Finished'), err => console.error('Failed', err.stack));

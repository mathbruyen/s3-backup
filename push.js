/* jshint node: true, esnext: true */
'use strict';

var AWS = require('aws-sdk');
var modes = require('js-git/lib/modes');

var fs = require('fs');
var path = require('path');

var s3db = require('./s3-db');
var fsdb = require('./fs-db');
var cachedb = require('./cache-db');
var callback = require('./callback');

var conf = require('./conf.json');

AWS.config.update({ region : 'eu-west-1' });
if (process.env.DEBUG) {
  AWS.config.update({ logger : process.stdout });
}

var listFiles = callback(fs.readdir, fs);
var readFile = callback(fs.readFile, fs);
var stat = callback(fs.stat, fs);

function statFile(repo, file, name) {
  return readFile(file)
    .then(buffer => repo.hash('blob', buffer))
    .then(hash => ({ mode : modes.file, hash, name, path : file }));
}

function uploadFile(repo, file) {
  console.log('Uploading file: ' + file);
  return readFile(file)
    .then(buffer => repo.saveAs('blob', buffer));
}

function statFolder(repo, folder, name) {
  return listFiles(folder)
    .then(files => {
      return Promise.all(files.map(statFileOrFolder.bind(null, repo, folder)));
    })
    .then(items => {
      var tree = items.reduce((t, item) => {
        t[item.name] = { mode : item.mode, hash : item.hash };
        return t;
      }, {});
      return repo.hash('tree', tree)
        .then(hash => ({ mode : modes.tree, hash, name, items, path : folder }));
    });
}

function uploadFolder(repo, hash, items, folder) {
  return repo.inStore(hash)
    .then(exists => {
      if (exists) {
        console.log('Already up to date folder: ' + folder);
        return hash;
      } else {
        return Promise.all(items.map(uploadDesc.bind(null, repo)))
          .then(actualHashes => {
            var tree = items.reduce((t, item, idx) => {
              t[item.name] = { mode : item.mode, hash : actualHashes[idx] };
              return t;
            }, {});
            console.log('Uploading folder: ' + folder);
            return repo.saveAs('tree', tree);
          });
      }
    });
}

function statFileOrFolder(repo, folder, file) {
  var item = path.join(folder, file);
  return stat(item)
    .then(stats => {
      if (stats.isFile()) {
        return statFile(repo, item, file);
      } else if (stats.isDirectory()) {
        return statFolder(repo, item, file);
      } else {
        return Promise.reject(new Error('Unrecognized stats: ' + JSON.stringify(stats)));
      }
    });
}

function uploadDesc(repo, desc) {
  if (desc.mode === modes.file) {
    return uploadFile(repo, desc.path);
  } else {
    return uploadFolder(repo, desc.hash, desc.items, desc.path);
  }
}

function upload(repo, folder) {
  return statFolder(repo, folder, 'IGNORED')
    .then(desc => uploadDesc(repo, desc));
}

s3db(AWS, conf.bucket, conf.key)
  .then(s3repo => {
    var fsrepo = fsdb(conf.cache);
    return cachedb(fsrepo, s3repo, ['tree', 'commit']);
  })
  .then(repo => {
    return Promise.all(Object.keys(conf.folders).map(ref => {
      return upload(repo, conf.folders[ref])
        .then(treeHash => {
          // TODO keep parent
          return repo.saveAs('commit', {
            parents : [],
            author : { name : 'Mathieu', email : 'code@mais-h.eu', date : new Date() },
            committer : { name : 'Mathieu', email : 'code@mais-h.eu', date : new Date() },
            tree : treeHash,
            message : 'Push'
          });
        })
        .then(commitHash => {
          // TODO make reference update safe for concurrent access
          return repo.updateRef(ref, commitHash);
        });
    }));
  }).then(console.log.bind(console, 'Finished'), err => console.error('Failed', err.stack));

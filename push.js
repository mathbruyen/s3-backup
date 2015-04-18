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
var queue = require('./queue');

AWS.config.update({ region : 'eu-west-1' });
if (process.env.DEBUG) {
  AWS.config.update({ logger : process.stdout });
}

var listFiles = callback(fs.readdir, fs);
var readFile = callback(fs.readFile, fs);
var stat = callback(fs.stat, fs);

var statFile = queue(async (repo, file, name) => {
  console.log('Reading file: ' + file);
  var buffer = await readFile(file);
  var hash = await repo.hash('blob', buffer);
  return { mode : modes.file, hash, name, path : file };
}, null, 5);

var uploadFile = queue(async (repo, file) => {
  console.log('Uploading file: ' + file);
  var buffer = await readFile(file);
  return await repo.saveAs('blob', buffer);
}, null, 5);

async function statFolder(repo, folder, name) {
  var files = await listFiles(folder);
  var items = await* files.map(file => statFileOrFolder(repo, folder, file));
  var tree = items.reduce((t, item) => {
    t[item.name] = { mode : item.mode, hash : item.hash };
    return t;
  }, {});
  var hash = await repo.hash('tree', tree);
  return { mode : modes.tree, hash, name, items, path : folder };
}

async function uploadFolder(repo, hash, items, folder) {
  var exists = await repo.inStore(hash);
  if (exists) {
    console.log('Already up to date folder: ' + folder);
    return hash;
  } else {
    var actualHashes = await* items.map(item => uploadDesc(repo, item));
    var tree = items.reduce((t, item, idx) => {
      t[item.name] = { mode : item.mode, hash : actualHashes[idx] };
      return t;
    }, {});
    console.log('Uploading folder: ' + folder);
    return await repo.saveAs('tree', tree);
  }
}

async function statFileOrFolder(repo, folder, file) {
  var item = path.join(folder, file);
  var stats = await stat(item);
  if (stats.isFile()) {
    return await statFile(repo, item, file);
  } else if (stats.isDirectory()) {
    return await statFolder(repo, item, file);
  } else {
    throw new Error('Unrecognized stats: ' + JSON.stringify(stats));
  }
}

async function uploadDesc(repo, desc) {
  if (desc.mode === modes.file) {
    return await uploadFile(repo, desc.path);
  } else {
    return await uploadFolder(repo, desc.hash, desc.items, desc.path);
  }
}

async function upload(repo, folder) {
  var desc = await statFolder(repo, folder, 'IGNORED');
  return await uploadDesc(repo, desc);
}

async function pushOne(repo, ref, folder) {
  var ut = upload(repo, folder);
  var currentCommitHash = await repo.readRef(ref);
  var currentCommit = currentCommitHash ? await repo.loadAs('commit', currentCommitHash) : null;
  var uploadedTreeHash = await ut;
  if (currentCommit && uploadedTreeHash == currentCommit.tree) {
    console.log('Nothing changed in ' + ref);
  } else {
    console.log('Creating commit to ' + uploadedTreeHash);
    var newCommit = {
      parents : [currentCommitHash],
      author : { name : 'Mathieu', email : 'code@mais-h.eu', date : new Date() },
      committer : { name : 'Mathieu', email : 'code@mais-h.eu', date : new Date() },
      tree : uploadedTreeHash,
      message : 'Push'
    };
    var newHash = await repo.saveAs('commit', newCommit);
    console.log('Updating reference ' + ref + ' to ' + newHash);
    await repo.updateRef(ref, currentCommitHash, newHash);
  }
}

async function push(conf) {
  var fsrepo = fsdb(conf.cache);
  var s3repo = await s3db(AWS, conf.bucket, conf.key);
  var repo = cachedb(fsrepo, s3repo, ['tree', 'commit']);
  await* Object.keys(conf.folders).map(ref => pushOne(repo, ref, conf.folders[ref]));
}

push(require('./conf.json'))
  .then(() => console.log('Finished'), err => console.error('Failed', err.stack));

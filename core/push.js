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

var listFiles = callback(fs.readdir, fs);
var readFile = callback(fs.readFile, fs);
var stat = callback(fs.stat, fs);

function itemsToTree(items) {
  var tree = {};
  items.forEach(({ name, mode, hash }) => tree[name] = { mode, hash });
  return tree;
}

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

async function push(conf) {

  AWS.config.update({ region : 'eu-west-1' });
  if (process.env.DEBUG) {
    AWS.config.update({ logger : process.stdout });
  }
  AWS.config.update({ accessKeyId: conf.access_key_id, secretAccessKey : conf.secret_access_key });

  var fsrepo = fsdb(conf.cache);
  var s3repo = s3db(AWS, conf.bucket, conf.key);
  await s3repo.configureBucket();
  var repo = cachedb(fsrepo, s3repo, ['tree', 'commit']);

  var statFile = queue(async (file, name) => {
    console.log('Reading file: ' + file);
    var buffer = await readFile(file);
    var hash = await repo.hash('blob', buffer);
    return { mode : modes.file, hash, name, path : file };
  }, null, 5);

  var uploadFile = queue(async (file) => {
    console.log('Uploading file: ' + file);
    var buffer = await readFile(file);
    return await repo.saveAs('blob', buffer);
  }, null, 5);

  async function statFolder(folder, name) {
    var files = await listFiles(folder);
    var items = await* files.map(file => statFileOrFolder(folder, file));
    var tree = itemsToTree(items);
    var hash = await repo.hash('tree', tree);
    return { mode : modes.tree, hash, name, items, path : folder };
  }

  async function uploadItem(item) {
    var hash = await uploadDesc(item);
    return { name : item.name, mode : item.mode, hash };
  }

  async function uploadFolder(hash, items, folder) {
    var exists = await repo.inStore(hash);
    if (exists) {
      console.log('Already up to date folder: ' + folder);
      return hash;
    } else {
      console.log('Uploading folder: ' + folder);
      var actualItems = await* items.map(uploadItem);
      var tree = itemsToTree(actualItems);
      return await repo.saveAs('tree', tree);
    }
  }

  async function statFileOrFolder(folder, file) {
    var item = path.join(folder, file);
    var stats = await stat(item);
    if (stats.isFile()) {
      return await statFile(item, file);
    } else if (stats.isDirectory()) {
      return await statFolder(item, file);
    } else {
      throw new Error('Unrecognized stats: ' + JSON.stringify(stats));
    }
  }

  async function uploadDesc(desc) {
    if (desc.mode === modes.file) {
      return await uploadFile(desc.path);
    } else {
      return await uploadFolder(desc.hash, desc.items, desc.path);
    }
  }

  async function upload(folder) {
    var desc = await statFolder(folder, 'IGNORED');
    return await uploadDesc(desc);
  }

  async function pushOne(ref, folder) {
    var ut = upload(folder);
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

  await* Object.keys(conf.folders).map(ref => pushOne(ref, conf.folders[ref]));
}

push(require(getUserHome() + '/.backup.json'))
  .then(() => console.log('Finished'), err => console.error('Failed', err.stack));

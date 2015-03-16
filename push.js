/* jshint node: true, esnext: true */
'use strict';

var AWS = require('aws-sdk');
var modes = require('js-git/lib/modes');

var async = require('./async');
var s3db = require('./s3-db');
var fsdb = require('./fs-db');
var cachedb = require('./cache-db');

var conf = require('./conf.json');

AWS.config.update({ region : 'eu-west-1' });
if (process.env.DEBUG) {
  AWS.config.update({ logger : process.stdout });
}

s3db(AWS, conf.bucket, conf.key)
  .then(s3repo => {
    var fsrepo = fsdb(conf.cache);
    var routing = {
      blob : [s3repo],
      tree : [fsrepo, s3repo],
      commit : [fsrepo, s3repo]
    };
    return cachedb(routing, s3repo);
  })
  .then(repo => {
    return async(repo.saveAs('blob', new Buffer('Hello, world!', 'utf-8')))
      .then(blobHash => {
        return async(repo.saveAs('tree', {
          'greetings.txt' : { mode : modes.file, hash : blobHash }
        }));
      })
      .then(treeHash => {
        return async(repo.saveAs('commit', {
          parents : [],
          author : { name : 'Mathieu', email : 'code@mais-h.eu', date : new Date() },
          committer : { name : 'Mathieu', email : 'code@mais-h.eu', date : new Date() },
          tree : treeHash,
          message : 'Test commit'
        }));
      })
      .then(commitHash => {
        return async(repo.updateRef('test', commitHash));
      });
  }).then(console.log.bind(console, 'Finished'), err => console.error('Failed', err.stack));

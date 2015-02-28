/* jshint node: true, esnext: true */
'use strict';

var AWS = require('aws-sdk');
var modes = require('js-git/lib/modes');

var conf = require('./conf.json');

AWS.config.update({ region : 'eu-west-1' });
if (process.env.DEBUG) {
  AWS.config.update({ logger : process.stdout });
}

function async(cont) {
  return new Promise((resolve, reject) => {
    cont((err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

require('./s3-db')({}, AWS, conf.bucket, conf.key)
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
  }).then(console.log.bind(console, 'Finished'), err => console.error(console, 'Failed', err.stack));

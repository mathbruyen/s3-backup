/* jshint node: true, esnext: true */
'use strict';

var crypto = require('crypto');
var Buffer = require('buffer').Buffer;
var callback = require('./callback');

module.exports = (AWS, bucket, key) => {

  var s3 = new AWS.S3({ apiVersion : '2006-03-01' });

  var upload = callback(s3.upload, s3);
  var getObject = callback(s3.getObject, s3);
  var putObject = callback(s3.putObject, s3);
  var headBucket = callback(s3.headBucket, s3);
  var createBucket = callback(s3.createBucket, s3);
  var putBucketAcl = callback(s3.putBucketAcl, s3);
  var putBucketCors = callback(s3.putBucketCors, s3);

  function existsObject(key) {
    return new Promise((resolve, reject) => {
      s3.headObject({ Bucket : bucket, Key : key }, (err, data) => {
        if (err && err.code === 'NotFound') {
          resolve(false);
        } else if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  function encryptString(content) {
    var c = crypto.createCipher('AES-256-CTR', key);
    var head = c.update(content, 'utf-8', 'base64');
    var tail = c.final('base64');
    return (head + tail).replace(/\+/g, '-').replace(/\//g, '_');
  }

  function decryptString(content) {
    var c = crypto.createDecipher('AES-256-CTR', key);
    var head = c.update(content.replace(/-/g, '+').replace(/_/g, '/'), 'base64', 'utf-8');
    var tail = c.final('utf-8');
    return head + tail;
  }

  function encryptBuffer(buffer) {
    var c = crypto.createCipher('AES-256-CTR', key);
    var head = c.update(buffer);
    var tail = c.final();
    return Buffer.concat([head, tail]);
  }

  function decryptBuffer(buffer) {
    var c = crypto.createDecipher('AES-256-CTR', key);
    var head = c.update(buffer);
    var tail = c.final();
    return Buffer.concat([head, tail]);
  }

  function saveRaw(hash, raw) {
    var key = encryptString(hash);
    return existsObject(key)
      .then(exists => {
        if (!exists) {
          return upload({ Bucket : bucket, Key : encryptString(hash), Body : encryptBuffer(raw) });
        }
      });
  }

  function loadRaw(hash) {
    return getObject({ Bucket : bucket, Key : encryptString(hash) })
      .then(data => decryptBuffer(data.Body), err => {
        if (err.code !== 'NoSuchKey') {
          throw err;
        }
      });
  }

  function exists(hash) {
    var key = encryptString(hash);
    return existsObject(key);
  }

  function readRef(ref) {
    return getObject({ Bucket : bucket, Key : encryptString('refs/' + ref) })
      .then(data => decryptString(data.Body.toString('utf-8')))
      .then(null, err => {
        if (err.code !== 'NoSuchKey') {
          throw err;
        }
      });
  }

  function updateRef(ref, from, to) {
    // TODO make reference update safe for concurrent access
    return putObject({ Bucket: bucket, Key: encryptString('refs/' + ref), Body: encryptString(to) });
  }

  function configureBucket() {
    return headBucket({ Bucket : bucket })
      .then(
        () => putBucketAcl({ Bucket: bucket, ACL: 'private' }),
        () => createBucket({ Bucket: bucket, ACL: 'private' })
      )
      .then(() => putBucketCors({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [{
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: ['*'],
            AllowedHeaders: ['*']
          }]
        }
      }));
  }

  return { saveRaw, loadRaw, exists, readRef, updateRef, configureBucket };
};

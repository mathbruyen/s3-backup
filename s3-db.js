/* jshint node: true, esnext: true */
'use strict';

var crypto = require('crypto');
var codec = require('js-git/lib/object-codec');
var inflate = require('js-git/lib/inflate');
var deflate = require('js-git/lib/deflate');
var sha1 = require('git-sha1');
var Buffer = require('buffer').Buffer;

function ensureBucket(s3, bucket) {
  return new Promise(function (resolve, reject) {
    s3.headBucket({ Bucket : bucket }, function(err, data) {
      if (err) {
        s3.createBucket({ Bucket: bucket, ACL: 'private' }, function(err, data) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  });
}

module.exports = (platform, AWS, bucket, key) => {

  var s3 = new AWS.S3({ apiVersion : '2006-03-01' });

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

  return ensureBucket(s3, bucket).then(() => {

    function saveAs(type, body, callback) {
      if (!callback) {
        return saveAs.bind(null, type, body);
      }
      try {
        var raw = codec.frame({ type : type, body : codec.encoders[type](body) });
        var hash = sha1(raw);
        saveRaw(hash, raw, (err) => {
          if (err) {
            callback(err);
          } else {
            callback(null, hash);
          }
        });
      } catch (err) {
        callback(err);
      }
    }

    function loadAs(type, hash, callback) {
      if (!callback) {
        return loadAs.bind(null, type, hash);
      }
      loadRaw(hash, function (err, raw) {
        if (raw === undefined) {
          callback(err);
        } else {
          try {
            var deframed = codec.deframe(raw);
            if (deframed.type !== type) {
              throw new TypeError('Type mismatch, expected ' + type + ' but found ' + type);
            }
            var body = codec.decoders[deframed.type](deframed.body);
            callback(null, body);
          } catch (err) {
            callback(err);
          }
        }
      });
    }

    function saveRaw(hash, raw, callback) {
      if (!callback) {
        return saveRaw.bind(null, hash, raw);
      }
      s3.headObject({ Bucket : bucket, Key : encryptString(hash) }, (err, data) => {
        if (err && err.code === 'NotFound') {
          s3.upload({ Bucket : bucket, Key : encryptString(hash), Body : encryptBuffer(raw) }, (err, data) => {
            if (err) {
              callback(err);
            } else {
              callback();
            }
          });
        } else if (err) {
          callback(err);
        } else {
          callback();
        }
      });
    }

    function loadRaw(hash, callback) {
      if (!callback) {
        return loadRaw.bind(null, hash);
      }
      s3.getObject({ Bucket : bucket, Key : encryptString(hash) }, (err, data) => {
        if (err && err.code === 'NoSuchKey') {
          callback();
        } else if (err) {
          callback(err);
        } else {
          callback(decryptBuffer(data.Body));
        }
      });
    }

    function readRef(ref, callback) {
      if (!callback) {
        return readRef.bind(null, ref);
      }
      s3.getObject({ Bucket : bucket, Key : encryptString('refs/' + ref) }, (err, data) => {
        if (err && err.code === 'NoSuchKey') {
          callback();
        } else if (err) {
          callback(err);
        } else {
          callback(decryptString(data.Body.toString('utf-8')));
        }
      });
    }

    function updateRef(ref, hash, callback) {
      if (!callback) {
        return updateRef.bind(null, ref, hash);
      }
      s3.putObject({ Bucket: bucket, Key: encryptString('refs/' + ref), Body: encryptString(hash) }, function(err, data) {
        if (err) {
          callback(err);
        } else {
          callback();
        }
      });
    }

    platform.saveAs = saveAs;
    platform.loadAs = loadAs;
    platform.saveRaw = saveRaw;
    platform.loadRaw = loadRaw;
    platform.readRef = readRef;
    platform.updateRef = updateRef;

    // TODO hasHash? listRefs?

    return platform;
  });
};

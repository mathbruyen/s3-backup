# Minimal backup using Amazon S3

Map local folders to a remote S3 bucket as git objects stored. Objects are stored encrypted, but I'm not a cryptographer and this may not be secure for storing your files: I want to play with code more than making a commercial product.

## Running

Requires [node.js](http://nodejs.org/).

Copy `.backup.json` to your home directory (the home directory is pointed at by the `HOME` environment variable on Linux and the `USERPROFILE` one on Windows, even in Cygwin) and fill values:

* `bucket`: bucket name on S3, a private bucket is created if it does not exists
* `key`: encryption key, can be generated using `openssl rand -hex 32`
* `access_key_id` and `secret_access_key`: credentials for AWS SDK
* `cache`: local folder in which to cache structure (commits and trees)
* `folders`: folders to map on S3 as an object, keys are identifiers to be shared among synchronized computers and values are local folders to synchronize

Run `npm install` and `npm run push`.

## Docs

* [S3 API](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html)
* [Exploring S3](https://console.aws.amazon.com/s3/home)
* [Node's crypto API](http://nodejs.org/api/crypto.html)
* [js-git repository](https://github.com/creationix/js-git)

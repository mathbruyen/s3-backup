# Minimal backup using Amazon S3

Map local folders to a remote S3 bucket as git objects stored. Objects are stored encrypted, but I'm not a cryptographer and this may not be secure for storing your files: I want to play with code more than making a commercial product.

## Running

Requires [node.js](http://nodejs.org/).

Copy `conf.json.example` to `conf.json` and fill values:

* `bucket`: bucket name on S3
* `key`: encryption key, can be generated using `openssl rand -hex 32`
* `cache`: local folder in which to cache structure (commits and trees)
* `folders`: folders to map on S3 as an object, keys are identifiers to be shared among synchronized computers and values are local folders to synchronize

Run `npm install` and `npm run push`.

## Docs

* [S3 API](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html)
* [Exploring S3](https://console.aws.amazon.com/s3/home)
* [Node's crypto API](http://nodejs.org/api/crypto.html)
* [js-git repository](https://github.com/creationix/js-git)

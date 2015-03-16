# Using Amazon S3 as a git object store

Prototype to use S3 as the object store for a git repository, encrypting objects before sending them to the store. I plan to use it as a minimal backup tool rather than a general purpose store, thus client side encryption and test script currently in the repository.

## Running

Requires [node.js](http://nodejs.org/).

Copy `conf.json.example` to `conf.json` and fill values:

* `bucket`: bucket name on S3
* `key`: encryption key, can be generated using `openssl rand -hex 32`
* `cache`: folder in which to store structure (commits and trees)

Run `npm install` and `npm run-script push`.

## Docs

* [S3 API](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html)
* [Exploring S3](https://console.aws.amazon.com/s3/home)
* [Node's crypto API](http://nodejs.org/api/crypto.html)
* [js-git repository](https://github.com/creationix/js-git)

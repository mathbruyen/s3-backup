/* jshint node: true, esnext: true */

var Rx = require('rx');

module.exports = () => {
  var subject = new Rx.Subject();
  var dispatch = subject.onNext.bind(subject);
  var feed = subject.asObservable();
  return { dispatch, feed };
};

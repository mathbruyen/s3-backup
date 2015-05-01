/* jshint node: true, esnext: true */

var Rx = require('rx');

module.exports = (dispatcher, actions) => {
  var changes = new Rx.Subject();

  var obs = dispatcher.feed
      .filter(x => actions[x.action])
      .subscribeOnNext(x => {
        actions[x.action](x, dispatcher.dispatch);
        changes.onNext();
      });

  return changes.subscribeOnNext.bind(changes);
};

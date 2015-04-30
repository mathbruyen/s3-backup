/* jshint node: true, esnext: true */

var Rx = require('rx');

module.exports = (dispatcher, initialValue, actions) => {
  var store = { value : initialValue };
  var changes = new Rx.Subject();
  
  var obs = dispatcher.feed
      .filter(x => actions[x.action])
      .subscribeOnNext(x => {
        store.value = actions[x.action](store.value, x, dispatcher.dispatch);
        changes.onNext();
      });

  store.onChange = changes.subscribeOnNext.bind(changes);

  return store;
};

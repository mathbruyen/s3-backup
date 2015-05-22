/* jshint node: true, esnext: true */

module.exports = (dispatcher, actions) => {

  var subscribers = [];

  dispatcher.subscribe(x => {
    var handler = actions[x.action];
    if (handler) {
      handler(x);
      for (var subscriber of subscribers) {
        subscriber();
      }
    }
  });

  function onChange(subscriber, scope) {
    var s = subscriber.bind(scope);
    s.subscriber = subscriber;
    s.scope = scope;
    subscribers.push(s);
  }

  function offChange(subscriber, scope) {
    subscribers = subscribers.filter(s => {
      return s.subscriber !== subscriber || s.scope !== scope;
    });
  }

  return onChange;
};

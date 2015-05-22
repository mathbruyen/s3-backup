/* jshint node: true, esnext: true */

module.exports = () => {

  var subscribers = [];

  function dispatch(action) {
    for (var subscriber of subscribers) {
      subscriber(action);
    }
  }

  function subscribe(subscriber, scope) {
    subscribers.push(subscriber.bind(scope));
  }

  return { dispatch, subscribe };
};

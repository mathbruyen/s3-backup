/* jshint node: true, esnext: true */

module.exports = (dispatcherSubscribe, actions) => {

  var subscribers = [];

  dispatcherSubscribe(x => {
    var handler = actions[x.action];
    if (handler) {
      handler(x);
      for (var subscriber of subscribers) {
        process.nextTick(subscriber);
      }
    }
  });

  function onChange(subscriber) {
    subscribers.push(subscriber);
  }

  function offChange(subscriber) {
    subscribers = subscribers.filter(s => s !== subscriber);
  }

  return { onChange, offChange };
};

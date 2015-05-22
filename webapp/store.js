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

  function onChange(subscriber) {
    subscribers.push(subscriber);
  }

  function offChange(subscriber) {
    subscribers = subscribers.filter(s => s !== subscriber);
  }

  return { onChange, offChange };
};

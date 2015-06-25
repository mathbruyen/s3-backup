/* jshint node: true, esnext: true */

module.exports = () => {

  var subscribers = [];
  var running = false;

  function dispatch(action) {
    if (running) {
      throw new Error('Cannot dispatch ' + JSON.stringify(action) + ' because an other action is already in progress');
    }
    running = true;
    try {
      console.log('Action:', action);
      for (var subscriber of subscribers) {
        subscriber(action);
      }
    } finally {
      running = false;
    }
  }

  function subscribe(subscriber) {
    subscribers.push(subscriber);
  }

  return { dispatch, subscribe };
};

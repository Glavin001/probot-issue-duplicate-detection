const Event = require('./Event');
const debug = require('debug')('Event');

module.exports = class Event {

  constructor(robot, event, context) {
    this.robot = robot;
    this.event = event;
    this.context = context;
    this.run();
  }

  run() {
    if (this.context.isBot) {
      debug("is bot");
      return;
    }
    return Promise.resolve(this.handler())
      .then(() => debug('done!'))
      .catch(error => debug('error', error))
      ;
  }

  handler() {
    throw new Error("Must implement Event subclass.");
  }

}

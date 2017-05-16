const IssueEvent = require('./IssueEvent');
const IssueCommentEvent = require('./IssueCommentEvent');
const debug = require('debug')('Robot');

module.exports = class Robot {

  constructor(robot) {
    this.robot = robot;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.robot.on('issues.opened', this.createEvent(IssueEvent));
    this.robot.on('issue_comment.created', this.createEvent(IssueCommentEvent));
  }

  createEvent(EventClass) {
    return (event, context) => {
      return new EventClass(this.robot, event, context);
    }
  }

};

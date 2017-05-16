const IssueEvent = require('./IssueEvent');
const debug = require('debug')('IssueCommentEvent');

module.exports = class IssueCommentEvent extends IssueEvent {

  async handler() {
    const { event } = this;
    debug('issue comment created');
    if (this.shouldProcess) {
      return await super.handler();
    } else {
      debug('Comment is not for me.');
    }
  };

  get shouldProcess() {
    return this.doesMentionBot;// && this.isCommentAskingForDuplicates;
  }

  get doesMentionBot() {
    const username = "issue-manager";
    const body = this.event.payload.comment.body;
    return body.includes('@' + username);
  }

  get isCommentAskingForDuplicates() {
    const body = this.event.payload.comment.body;
    return body.toLowerCase().includes('duplicate');
  }

}

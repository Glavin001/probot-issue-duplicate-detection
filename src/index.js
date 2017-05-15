const fs = require('fs');
const path = require('path');
const debug = require('debug')('index');
const mustache = require('mustache');
const search = require('./search');
const defaultTemplate = fs.readFileSync(path.resolve(__dirname, 'template.md'), { encoding: 'utf-8' });

module.exports = robot => new Robot(robot);

class Robot {

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

}

class Event {

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

class IssueEvent extends Event {

  constructor(robot, event, context) {
    super(robot, event, context);
  }

  async github() {
    if (this._github) {
      return this._github;
    }
    return await this.robot.auth(this.event.payload.installation.id)
      .then(github => {
        this._github = github;
        return github;
      });
  }

  async handler() {
    debug('issue opened');
    const { robot, event, context } = this;
    const results = await this.search();
    debug(`found ${results.length} potential duplicates`);
    const github = await this.github();
    debug('github', github);
    if (results.length > 0) {
      const commentBody = await this.createCommentBody(results);
      debug("Comment", commentBody);
      return await github.issues.createComment(context.issue({ body: commentBody }));
    }
  };

  async search() {
    const { context } = this;
    const allIssues = await this.allIssues();
    const results = await search(allIssues, context.issue().number);
    return results;
  }

  async allIssues() {
    const { context } = this;
    const github = await this.github();
    debug('github', github);
    const issues = await github.paginate(github.issues.getForRepo(context.repo({ state: "all", per_page: 100 })), issues => issues);
    debug('issues', issues);
    return issues;
  }

  async createCommentBody(results) {
    const { event } = this;
    const template = await this.template();
    const commentBody = mustache.render(template, {
      payload: event.payload,
      issues: results.map(issue => Object.assign({}, issue, {
        score: (issue.score * 100).toFixed(2)
      }))
    });
    return commentBody;
  }

  async template() {
    const { context } = this;
    const github = await this.github();
    debug('github', github);
    let template;
    try {
      // Try to get issue template from the repository
      const params = context.repo({ path: '.github/DUPLICATE_ISSUE_TEMPLATE.md' });
      const data = await github.repos.getContent(params);
      template = Buffer.from(data.content, 'base64').toString();
    } catch (err) {
      // It doesn't have one, so let's use the default
      template = defaultTemplate;
    }
    return template;
  }

}

class IssueCommentEvent extends IssueEvent {

  async handler() {
    const { event } = this;
    debug('issue comment created');
    if (IssueCommentEvent.doesMentionBot(event) && IssueCommentEvent.isCommentAskingForDuplicates(event)) {
      return await super.handler();
    } else {
      debug('Comment is not for me.');
    }
  };

  static doesMentionBot(event) {
    const username = "issue-manager";
    const body = event.payload.comment.body;
    return body.includes('@' + username);
  }

  static isCommentAskingForDuplicates(event) {
    const body = event.payload.comment.body;
    return body.toLowerCase().includes('duplicate');
  }

}
const fs = require('fs');
const path = require('path');
const debug = require('debug')('index');
const mustache = require('mustache');

const search = require('./search');

const defaultTemplate = fs.readFileSync(path.resolve(__dirname, 'template.md'), { encoding: 'utf-8' });

module.exports = robot => {
  robot.on('issues.opened', skipBots(processIssue));
  robot.on('issue_comment.created', skipBots(processComment));

  function skipBots(handler) {
    return (event, context) => {
      if (context.isBot) {
        debug("is bot");
        return;
      }
      return handler(event, context)
        .then(() => debug('done!'))
        .catch(error => debug('error', error));
    };
  }

  async function processIssue(event, context) {
    debug('issue opened');
    const github = await robot.auth(event.payload.installation.id);

    // Get all issues that aren't the new issue
    const allIssues = await github.paginate(github.issues.getForRepo(context.repo({ state: "all", per_page: 100 })), issues => issues);

    const results = await search(allIssues, context.issue().number);

    debug(`found ${results.length} potential duplicates`);

    if (results.length > 0) {
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
      const commentBody = mustache.render(template, {
        payload: event.payload,
        issues: results.map(issue => Object.assign({}, issue, {
          score: (issue.score*100).toFixed(2)
        }))
      });

      await github.issues.createComment(context.issue({ body: commentBody }));
    }
  };

  async function processComment(event, context) {
    debug('issue comment created');
    if (doesMentionBot(event) && isCommentAskingForDuplicates(event)) {
      return await processIssue(event, context);
    } else {
      debug('Comment is not for me.');
    }
  };

  function doesMentionBot(event) {
    const username = "issue-manager";
    const body = event.payload.comment.body;
    return body.includes('@'+username);
  }

  function isCommentAskingForDuplicates(event) {
    const body = event.payload.comment.body;
    return body.toLowerCase().includes('duplicate');
  }


};
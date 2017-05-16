const _ = require('lodash');
const debug = require('debug')('labels');
const { train, predictIssueLabels } = require('./classifier');

async function trainLabels() {
  return await train('labels', [owner, name, issues, ignoreLabels]);
};

async function predictLabels() {
  return await predictIssueLabels(this.owner, this.name, issue);
};

module.exports = {
  trainLabels,
  predictLabels,
};

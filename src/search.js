const _ = require('lodash');
const debug = require('debug')('search');
const { issueSimilarities } = require('./classifier');
const Issue = require('./models/Issue');

module.exports = async (allIssues, issueNumber, extraIgnoredTerms = []) => {
  debug(`search through ${allIssues.length} issues`);
  const otherIssues = allIssues.filter(issue => issue.number !== issueNumber);
  const theIssue = allIssues.find(issue => issue.number === issueNumber);
  debug("theIssue", issueNumber, theIssue);
  const issueMap = _.keyBy(allIssues, 'number');

  const allSimilaritiesMap = await issueSimilarities(Issue.convert(allIssues));
  debug("similarities", allSimilaritiesMap);
  const similarMap = allSimilaritiesMap[issueNumber] || {};
  const similarIssues = _.chain(similarMap)
    .toPairs()
    .map(([num, similarity]) =>
      Object.assign({}, issueMap[num], {
        score: similarity,
      })
    )
    .sortBy('score')
    .reverse()
    .value()
    ;
  return similarIssues;
};

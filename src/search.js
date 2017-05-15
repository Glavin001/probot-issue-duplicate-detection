const Fuze = require('fuse.js');
const nlp = require('compromise');
const debug = require('debug')('search');
const { issueSimilarities } = require('./classifier');
const _ = require('lodash');

module.exports = async (allIssues, issueNumber, extraIgnoredTerms = []) => {
  debug(`search through ${allIssues.length} issues`);
  const otherIssues = allIssues.filter(issue => issue.number !== issueNumber);
  const theIssue = allIssues.find(issue => issue.number === issueNumber);
  debug("theIssue", issueNumber, theIssue);
  const issueMap = _.keyBy(allIssues, 'number');

  const allSimilaritiesMap = await issueSimilarities(allIssues.map(issue => ({
    id: issue.id,
    number: issue.number,
    state: issue.state,
    title: expandContractions(issue.title),
    body: expandContractions(issue.body),
    labels: issue.labels.map(label => label.name),
    milestone: issue.milestone && issue.milestone.title,
  })));
  // return similarities;
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

function expandContractions(text) {
  const cleanText = nlp(text);
  cleanText.contractions().expand();
  return cleanText.out('text');
}

const nlp = require('compromise');
const debug = require('debug')('Issue');

class Issue {
  constructor(issue) {
    Object.assign(this, {
      id: issue.id,
      number: issue.number,
      state: issue.state,
      title: expandContractions(issue.title),
      body: expandContractions(issue.body),
      labels: issue.labels.map(label => label.name),
      milestone: issue.milestone && issue.milestone.title,
    });
  }

  static convert(issues) {
    return issues.map(issue => new Issue(issue));
  }

}

function expandContractions(text) {
  const cleanText = nlp(text);
  cleanText.contractions().expand();
  return cleanText.out('text');
}

module.exports = Issue;
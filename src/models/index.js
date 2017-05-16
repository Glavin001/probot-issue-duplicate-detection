module.exports = require("fs")
  .readdirSync(__dirname)
  .filter(file => file.endsWith('.js') && file !== 'index.js')
  .map(file => file.replace('.js', ''))
  .reduce((result, file) => {
    result[file] = require("./" + file);
    return result;
  }, {});

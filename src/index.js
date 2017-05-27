const debug = require('debug')('index');
const { Robot } = require('./models');

console.log(process.env);

module.exports = robot => new Robot(robot);

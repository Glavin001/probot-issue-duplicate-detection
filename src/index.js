const debug = require('debug')('index');
const { Robot } = require('./models');

module.exports = robot => new Robot(robot);

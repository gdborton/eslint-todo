var chalk = require('chalk');
var errorColor = chalk.red;
var infoColor = chalk.yellow;

module.exports = {
  error: function error(label, message) {
    console.log(errorColor(label), message);
  },
  info: function info(label, message) {
    console.log(infoColor(label), message);
  }
};

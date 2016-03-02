var meow = require('meow');

var cli = meow(`
    Usage
      $ eslint-todo <command> -- --flagsToPassToCommand

    Examples
      $ eslint-todo eslint --  . --format="json"
`);

module.exports = cli;

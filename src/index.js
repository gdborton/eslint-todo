var fs = require ('fs');
var utils = require('./utils');
var JSON5 = require('json5');
var path = require('path');
var childProcess = require('child_process');
var cli = require('./cli');
var logger = require('./logger');

var eslintTodo = {
  removeRulesFromFile: removeRulesFromFile,
  destroyNestedConfigs: destroyNestedConfigs,
  getBrokenRuleIdsFor: getBrokenRuleIdsFor,
  createExceptions: createExceptions,
  processOutput: processOutput,
  execute: function(command) {
    if (!cli.input.length) {
      console.log(cli.help);
      process.exit();
    }
    eslintTodo.destroyNestedConfigs();
    var command = cli.input.join(' ');
    logger.info('Running command:\n', cli.input.join(' '));
    childProcess.exec(command, { maxBuffer: 1024 * 1024 * 10 }, function(err, out, stdErr) {
      try {
        var output = JSON.parse(out);
      } catch (e) {
        logger.error('Unable to parse output, please verify that your output is json:', out.substring(0, 1000) + '...');
        process.exit(1);
      }

      eslintTodo.processOutput(output);
    });
  }
};

function removeRulesFromFile(fullPath) {
  var contents = fs.readFileSync(fullPath, 'utf-8');
  var output = JSON5.parse(contents);
  delete output.rules;
  if (Object.keys(output).length) {
    fs.writeFileSync(fullPath, JSON.stringify(output, null, 2));
  } else {
    fs.unlinkSync(fullPath);
  }
}

function destroyNestedConfigs() {
  var opts = {
    ignore: ['**/node_modules/**', '.eslintrc'],
    sync: true
  };

  var files = utils.glob('**/.eslintrc', opts);
  files.forEach(function(file) {
    eslintTodo.removeRulesFromFile(process.cwd() + '/' + file);
  });
}

function getBrokenRuleIdsFor(entry) {
  return entry.messages.filter(function(message) {
    return message.severity === 2;
  }).map(function(message) {
    return message.ruleId;
  }).sort();
}

function getPathFor(entry) {
  return path.dirname(entry.filePath);
}

function createExceptions(filePath, rules) {
  var obj = {};
  try {
    var content = fs.readFileSync(filePath, 'utf-8');
    var obj = JSON.parse(content);
  } catch (e) {}

  Object.assign(obj, {
    rules: rules
  });
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
}

function processOutput(outputArray) {
  const ruleObj = {};
  outputArray.filter(function(entry) {
    return entry.errorCount;
  }).forEach(function(entry) {
    var entryPath = getPathFor(entry);
    ruleObj[entryPath] = ruleObj[entryPath] || {};
    eslintTodo.getBrokenRuleIdsFor(entry).forEach(function(ruleId) {
      ruleObj[entryPath][ruleId] = 0;
    });
  });

  Object.keys(ruleObj).forEach(function(path) {
    eslintTodo.createExceptions(path + '/.eslintrc', ruleObj[path]);
  });
};

module.exports = eslintTodo;

import test from 'ava';
import fs from 'fs';
import sinon from 'sinon';
import eslintTodo from '../src/index';
import utils from '../src/utils';

const nestedEslints = {
  'onlyrules/.eslintrc': {
    rules: {
      fakeRule: 0
    }
  },
  'morethanrules/.eslintrc': {
    globals: [],
    rules: {
      fakeRule: 0
    }
  }
};

const eslintEntries = [
  {
    filePath: 'makefakefilepath/filename.js',
    messages: [{
      ruleId: 'fakeRuleId',
      severity: 2
    }, {
      ruleId: 'astartswithasothaticantestalphabeticalsort',
      severity: 2
    }],
    errorCount: 1
  },
  {
    filePath: 'onlywarning/filename.js',
    messages: [{
      ruleId: 'warningRuleId',
      severity: 1
    }],
    errorCount: 0,
    warningCount: 1
  },
  {
    filePath: 'samepath/different/rule1.js',
    messages: [{
      ruleId: 'rule1',
      severity: 2
    }],
    errorCount: 1
  },
  {
    filePath: 'samepath/different/rule2.js',
    messages: [{
      ruleId: 'rule2',
      severity: 2
    }],
    errorCount: 1
  }
];

const origRead = fs.readFileSync;
const origWrite = fs.writeFileSync;
const origGlob = utils.glob;

let readSyncStub;
let writeFileStub;
let unlinkStub;
let globStub;
test.beforeEach(t => {
  readSyncStub = sinon.stub(fs, 'readFileSync', (path, encoding) => {
    if (Object.keys(nestedEslints).indexOf(path) !== -1) {
      return JSON.stringify(nestedEslints[path]);
    }
    return origRead(path, encoding);
  });

  writeFileStub = sinon.stub(fs, 'writeFileSync', (path, content) => {
    if (Object.keys(nestedEslints).indexOf(path) === -1) {
      return origWrite(path, content);
    }
  });

  unlinkStub = sinon.stub(fs, 'unlinkSync');
  globStub = sinon.stub(utils, 'glob', () => {
    return Object.keys(nestedEslints);
  });
});

test.afterEach(t => {
  readSyncStub.restore();
  writeFileStub.restore();
  unlinkStub.restore();
  globStub.restore();
});

test('.removeRulesFromFile should delete rules from a given file.', t => {
  const path = 'morethanrules/.eslintrc';
  eslintTodo.removeRulesFromFile(path);
  sinon.assert.calledWith(readSyncStub, path);
  sinon.assert.calledWith(writeFileStub, path);
});

test('.removeRulesFromFile deletes nested eslint files if only contain rules.', t => {
  const path = 'onlyrules/.eslintrc';
  eslintTodo.removeRulesFromFile(path);
  sinon.assert.calledWith(unlinkStub, path);
});

test('.destroyNestedConfigs should call removeRulesFromFile for each found eslintrc', t => {
  const paths = Object.keys(nestedEslints);
  let stubbedRemove = sinon.stub(eslintTodo, 'removeRulesFromFile');
  eslintTodo.destroyNestedConfigs();
  paths.forEach(path => {
    sinon.assert.calledWith(stubbedRemove, `${process.cwd()}/${path}`);
  });
  stubbedRemove.restore();
});

test('.getBrokenRuleIdsFor should return ruleIds for any messages with severity 2.', t => {
  const result = eslintTodo.getBrokenRuleIdsFor(eslintEntries[0]);
  t.same(result, ['astartswithasothaticantestalphabeticalsort', 'fakeRuleId']);
});

test('.createExceptions should attempt to write rules to a given file, extending if needed.', t => {
  const path = 'morethanrules/.eslintrc';
  const rules = { 'newFakeRuleId': 2};
  const output = Object.assign(
    nestedEslints[path],
    { rules }
  );
  eslintTodo.createExceptions(path, rules);
  sinon.assert.calledWith(readSyncStub, path);
  sinon.assert.calledWith(writeFileStub, path, JSON.stringify(output, null, 2));
});

test('.processOutput should get the broken rules for each entry then create their exception files.', t => {
  const getBrokenRuleIdsForSpy = sinon.spy(eslintTodo, 'getBrokenRuleIdsFor');
  const createExceptionsStub = sinon.stub(eslintTodo, 'createExceptions');
  eslintTodo.processOutput(eslintEntries);
  eslintEntries.forEach(entry => {
    if (entry.errorCount) {
      sinon.assert.calledWith(getBrokenRuleIdsForSpy, entry);
    } else {
      sinon.assert.neverCalledWith(getBrokenRuleIdsForSpy, entry);
    }
  });

  sinon.assert.calledWith(createExceptionsStub, 'makefakefilepath/.eslintrc', {
    astartswithasothaticantestalphabeticalsort: 0,
    fakeRuleId: 0
  });
  sinon.assert.neverCalledWith(createExceptionsStub, 'onlywarning/.eslintrc');
  sinon.assert.calledWith(createExceptionsStub, 'samepath/different/.eslintrc', {
    rule1: 0,
    rule2: 0
  });

  getBrokenRuleIdsForSpy.restore();
  createExceptionsStub.restore();
});

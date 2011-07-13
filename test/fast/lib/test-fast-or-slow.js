var common = require('../common');
var sinon = require('sinon');
var assert = require('assert');

var EventEmitter = require('events').EventEmitter;

var sandboxProcess = new EventEmitter();
var SandboxTestCase = {};
var SandboxReporter = {};
var Sandbox = common.sandbox('fast_or_slow', {
  requires: {
    './test_case': SandboxTestCase,
    './reporter': SandboxReporter,
  },
  globals: {
    process: sandboxProcess,
  }
});
var FastOrSlow = Sandbox.exports;

function test(fn) {
  fn();
}

test(function fastTestCase() {
  sandboxProcess.nextTick = sinon.spy();

  var sandboxTestCase = {my: 'TestCase'};
  SandboxTestCase.create = sinon.stub().returns(sandboxTestCase);

  var sandboxSugarAddTest = {my: 'sugarAddTest'};
  sandboxTestCase.sugarAddTest = sinon.stub().returns(sandboxSugarAddTest);
  sandboxTestCase.run = sinon.spy();

  var sandboxReporter = {my: 'Reporter'};
  SandboxReporter.create = sinon.stub().returns(sandboxReporter);
  sandboxReporter.watch = sinon.spy();

  var sugarAddTest = FastOrSlow.fastTestCase();
  assert.strictEqual(sugarAddTest, sandboxSugarAddTest);
  assert.ok(sandboxReporter.watch.calledWith(sandboxTestCase));

  var nextTick = sandboxProcess.nextTick.args[0][0];
  nextTick();

  assert.ok(sandboxTestCase.run.called);
});

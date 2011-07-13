var common = require('../../common');
var sinon = require('sinon');
var assert = require('assert');

var SandboxBashReporter = {};
var sandboxProcess = {};
sandboxProcess.stdout = {};
sandboxProcess.stderr = {};
var Sandbox = common.sandbox('reporter', {
  requires: {
    './reporter/bash_reporter': SandboxBashReporter,
  },
  globals: {
    process: sandboxProcess,
  }
});
var Reporter = Sandbox.exports;

var reporter;
function test(fn) {
  reporter = new Reporter();
  fn();
}

test(function envReporter() {
  sandboxProcess.env = {};
  assert.strictEqual(Reporter.envReporter(), Reporter.DEFAULT_REPORTER);

  sandboxProcess.env = {REPORTER: 'html'};
  assert.strictEqual(Reporter.envReporter(), sandboxProcess.env.REPORTER);

  assert.strictEqual(Reporter.envReporter('super'), 'super');
});

test(function createWithoutOptions() {
  var returnReporter = {};
  SandboxBashReporter.create = sinon.stub().returns(returnReporter);
  var reporter = Reporter.create('bash');

  assert.strictEqual(reporter, returnReporter);
});

test(function createErr() {
  assert.throws(function() {
    var reporter = Reporter.create('non-existing-reporter');
  }, /reporter not found: non-existing-reporter/i);
});

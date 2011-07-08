var common = require('../common');
var sinon = require('sinon');
var assert = require('assert');

var Sandbox = common.sandbox('test_case');
var TestCase = Sandbox.exports;

var testCase;
function test(fn) {
  testCase = new TestCase();
  fn();
}

test(function add() {
  var testA = {test: 'A'};
  testCase.add(testA);
  assert.equal(testCase._tests.length, 1);
  assert.strictEqual(testCase._tests[0], testA);

  var testB = {test: 'B'};
  testCase.add(testB);
  assert.equal(testCase._tests.length, 2);
  assert.strictEqual(testCase._tests[1], testB);
});

test(function runNoTestCases() {
  var runCb = sinon.spy();
  testCase.run(runCb);

  assert.ok(runCb.called);
  var runErr = runCb.args[0][0];
  assert.equal(runErr, null);
});

test(function runOneSuccessCase() {
  //var runCb = sinon.spy();
  //testCase.run(runCb);

  //assert.ok(runCb.called);
  //var runErr = runCb.args[0][0];
  //assert.equal(runErr, null);
});

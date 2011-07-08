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
  assert.equal(testCase.tests.length, 1);
  assert.strictEqual(testCase.tests[0], testA);

  var testB = {test: 'B'};
  testCase.add(testB);
  assert.equal(testCase.tests.length, 2);
  assert.strictEqual(testCase.tests[1], testB);
});

test(function runNoTestCases() {
  var runCb = sinon.spy();
  testCase.run(runCb);

  assert.ok(runCb.called);
  assert.ok(runCb.calledWith(null));
});

test(function runOneSuccessTest() {
  var testInstance = {};
  testInstance.run = sinon.stub().yields(null);

  testCase.add(testInstance);

  var runCb = sinon.spy();
  testCase.run(runCb);

  assert.ok(runCb.calledWith(null));
});

test(function ronOneErrorTest() {
  var err = new Error('something went wrong');
  var testInstance = {};
  testInstance.run = sinon.stub().yields(err);

  testCase.add(testInstance);

  var runCb = sinon.spy();
  testCase.run(runCb);

  assert.ok(runCb.calledWith([err]));
});

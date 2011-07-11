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
  assert.ok(testCase._started);
  assert.ok(testCase._ended);
});

test(function runOneSuccessTest() {
  var testInstance = {};
  testInstance.run = sinon.stub().yields(null);
  testCase.add(testInstance);

  testCase.duration = sinon.stub().returns(25);

  var runCb = sinon.spy();
  testCase.run(runCb);

  assert.ok(runCb.calledWith(null, {pass: 1, fail: 0, total: 1, duration: 25}));
});

test(function runOneErrorTest() {
  var err = new Error('something went wrong');
  var testInstance = {};
  testInstance.run = sinon.stub().yields(err);
  testCase.add(testInstance);

  testCase.duration = sinon.stub().returns(10);

  var runCb = sinon.spy();
  testCase.run(runCb);

  assert.ok(runCb.calledWith([err], {pass: 0, fail: 1, total: 1, duration: 10}));
});

test(function runOneSuccessAndOneErrorTest() {
  var err = new Error('something went wrong');

  var errorTest = {};
  errorTest.run = sinon.stub().yields(err);
  testCase.add(errorTest);

  var successTest = {};
  successTest.run = sinon.stub().yields(null);
  testCase.add(successTest);

  testCase.duration = sinon.stub().returns(5);

  var runCb = sinon.spy();
  testCase.run(runCb);

  assert.ok(runCb.calledWith([err], {pass: 1, fail: 1, total: 2, duration: 5}));
});

test(function statsWhileStillRunning() {
  testCase.tests = [1, 2, 3];
  testCase.index = 1;
  testCase.errors = ['a'];

  testCase.duration = sinon.stub().returns(3);

  var stats = testCase.stats();
  assert.deepEqual(stats, {fail: 1, pass: 0, total: 3, duration: 3});
});

test(function duration() {
  testCase._started = 20;
  testCase._ended = 30;

  assert.equal(testCase.duration(), 10);
});

test(function durationBeforeEnded() {
  testCase._started = +new Date;
  assert.ok(testCase.duration() >= 0);
  assert.ok(testCase.duration() < 10);
});

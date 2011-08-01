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

test(function createFactory() {
  var testCase = TestCase.create(10);
  assert.strictEqual(testCase.testTimeout, 10);
});

test(function sugarAddTestFunction() {
  var sugarAddTest = testCase.sugarAddTest();

  Object
    .keys(TestCase.prototype)
    .concat(Object.keys(testCase))
    .forEach(function(property) {
      if (typeof testCase[property] !== 'function') {
        assert.strictEqual(sugarAddTest[property], testCase[property]);
        return;
      }

      var returns = 'the answer';
      var args = [1, 2, 3];
      testCase[property] = sinon.stub().returns(returns);
      var r = sugarAddTest[property].apply(null, args);

      assert.strictEqual(returns, r);
      assert.ok(testCase[property].calledOn(testCase));
      assert.ok(testCase[property].calledWith(1, 2, 3));
      assert.ok(testCase[property].callCount, 1);
    });

  var returns = 'another answer';
  var args = [1, 2];
  testCase.addTest = sinon.stub().returns(returns);
  var r = sugarAddTest.apply(null, args);

  assert.strictEqual(r, returns);
  assert.ok(testCase.addTest.calledOn(testCase));
  assert.ok(testCase.addTest.calledWith(1, 2));
  assert.ok(testCase.addTest.callCount, 1);
});

test(function addTestWithNameAndFn() {
  var testName = 'my test';
  var testFn = function() {};
  testCase.addTest(testName, testFn);

  assert.equal(testCase.tests.length, 1);
  assert.equal(testCase.tests[0].name, testName);
  assert.equal(testCase.tests[0].testFn, testFn);
  assert.equal(testCase.tests[0].timeout, null);
});

test(function addTestWithOptions() {
  var testName = 'my test';
  var testFn = function() {};
  var options = {foo: 'bar'};
  testCase.addTest(testName, options, testFn);

  assert.equal(testCase.tests[0].name, testName);
  assert.equal(testCase.tests[0].testFn, testFn);
  assert.equal(testCase.tests[0].foo, options.foo);
});

test(function addTestWithTestTimeout() {
  testCase.testTimeout = 20;

  var testName = 'my test';
  var testFn = function() {};
  testCase.addTest(testName, testFn);

  assert.equal(testCase.tests[0].timeout, 20);
});

test(function addTestWithTestTimeoutAndOptions() {
  testCase.testTimeout = 20;

  var testName = 'my test';
  var testFn = function() {};
  var testOptions = {};
  testCase.addTest(testName, testOptions, testFn);

  assert.equal(testCase.tests[0].timeout, 20);
});

test(function addTestWithTestTimeoutAndTimeoutOption() {
  testCase.testTimeout = 20;

  var testName = 'my test';
  var testFn = function() {};
  var testOptions = {timeout: 50};
  testCase.addTest(testName, testOptions, testFn);

  assert.equal(testCase.tests[0].timeout, 50);
});

test(function addTestCaseWithBeforeAndAfterFn() {
  var before = function() {};
  var after = function() {};

  testCase.before(before);
  testCase.after(after);

  var testName = 'my test';
  var testFn = function() {};
  testCase.addTest(testName, testFn);

  assert.strictEqual(testCase.tests[0].beforeFn, before);
  assert.strictEqual(testCase.tests[0].afterFn, after);
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
  testCase.tests.push(testInstance);

  var runCb = sinon.spy();
  testCase.run(runCb);

  assert.ok(runCb.calledWith(null));
});

test(function runOneErrorTest() {
  var err = new Error('something went wrong');
  var testInstance = {};
  testInstance.run = sinon.stub().yields(err);
  testCase.tests.push(testInstance);

  var runCb = sinon.spy();
  testCase.run(runCb);

  assert.ok(runCb.calledWith([err]));
});

test(function runOneSuccessAndOneErrorTest() {
  var err = new Error('something went wrong');

  var errorTest = {my: 'error test'};
  errorTest.run = sinon.stub().yields(err);
  testCase.tests.push(errorTest);

  var successTest = {my: 'success test'};
  successTest.run = sinon.stub().yields(null);
  testCase.tests.push(successTest);

  var emitTestEnd = sinon.spy();
  testCase.on('test.end', emitTestEnd);

  var runCb = sinon.spy();
  testCase.run(runCb);

  assert.ok(runCb.calledWith([err]));
  assert.ok(emitTestEnd.calledWith(errorTest));
  assert.ok(emitTestEnd.calledWith(successTest));
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

test(function statsNumbers() {
  testCase.tests = {length: 5};
  testCase.errors = {length: 3};
  testCase.index = 4;

  var stats = testCase.stats();
  assert.strictEqual(stats.pass, 1);
  assert.strictEqual(stats.fail, 3);
  assert.strictEqual(stats.executed, testCase.index);
  assert.strictEqual(stats.total, 5);
});

test(function endWithoutCb() {
  testCase.end();
});

test(function endEmitsEvent() {
  var endCb = sinon.spy();
  testCase.on('end', endCb);
  testCase.end();

  assert.ok(endCb.called);
});

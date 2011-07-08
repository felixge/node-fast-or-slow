var common = require('../common');
var sinon = require('sinon');
var assert = require('assert');

var TestCase = common.lib('test_case');

var testCase;
function test(fn) {
  var testCase = new TestCase();
  fn();
}

test(function addOneTest() {
  var testCase = new TestCase();
  var testName = 'my test';
  var testFn = function() {};

  testCase.add(testName, testFn);

  var registeredTests = testCase._tests;
  assert.strictEqual(registeredTests.length, 1);
  assert.strictEqual(registeredTests[0].name, testName);
  assert.strictEqual(registeredTests[0].fn, testFn);
});

test(function addMultipleTests() {
  var testCase = new TestCase();

  testCase.add('a', function(){});
  testCase.add('b', function(){});
  testCase.add('c', function(){});

  assert.strictEqual(testCase._tests.length, 3);
});

test(function addTestWithOptions() {
  var testCase = new TestCase();
  var testName = 'my test';
  var testOptions = {foo: 'bar'};
  var testFn = function() {};

  testCase.add(testName, testOptions, testFn);

  var registeredTests = testCase._tests;
  assert.strictEqual(registeredTests[0].foo, testOptions.foo);
});

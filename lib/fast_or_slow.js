var TestCase = require('./test_case');
var Reporter = require('./reporter');

exports.fast = function(timeout) {
  return this.testCase(timeout || 100);
};

exports.slow = function(timeout) {
  return this.testCase(timeout || 1000);
};

exports.testCase = function(timeout) {
  var testCase = TestCase.create(timeout);
  var reporter = Reporter.create();

  reporter.watch(testCase);

  process.nextTick(testCase.run.bind(testCase));

  return testCase.sugarAddTest();
};

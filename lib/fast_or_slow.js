var TestCase = require('./test_case');
var Reporter = require('./reporter');

exports.fastTestCase = function(timeout) {
  return this.testCase(timeout || 10);
};

exports.slowTestCase = function(timeout) {
  return this.testCase(timeout || 30 * 1000);
};

exports.testCase = function(timeout) {
  var testCase = TestCase.create(timeout);
  var reporter = Reporter.create();

  reporter.watch(testCase);

  process.nextTick(testCase.run.bind(testCase));

  return testCase.sugarAddTest();
};

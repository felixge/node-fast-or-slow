var TestCase = require('./test_case');
var Reporter = require('./reporter');

exports.fastTestCase = function() {
  var testCase = TestCase.create(10);
  var reporter = Reporter.create();

  reporter.watch(testCase);

  process.nextTick(testCase.run.bind(testCase));

  return testCase.sugarAddTest();
};

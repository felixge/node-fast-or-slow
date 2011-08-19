var Reporter = require('../reporter');
var util = require('util');
var TapProducer = require('tap-producer');

module.exports = TapReporter;
util.inherits(TapReporter, Reporter);
function TapReporter() {
  Reporter.call(this);

  this.tapProducer = undefined;
}

TapReporter.create = function() {
  var instance = new this();
  instance.tapProducer = new TapProducer();
  instance.tapProducer.pipe(process.stdout);
  return instance;
};

TapReporter.prototype.onTestEnd = function(testCase, test) {
  var result = {ok: true, name: test.name};

  if (test.error) {
    result.ok = false;
    result.stack = test.error.stack;
  }

  this.tapProducer.write(result);
};

TapReporter.prototype.onTestCaseEnd = function(testCase) {
  var stats = testCase.stats();

  var exitCode = (stats.fail)
    ? 1
    : 0;

  process.exit(exitCode);
};

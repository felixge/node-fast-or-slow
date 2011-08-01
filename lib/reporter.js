var Hashish = require('hashish');
var inflect = require('inflect');

module.exports = Reporter;
function Reporter() {
  this.testCases = [];
  this.stdout = process.stdout;
  this.stderr = process.stderr;
}
Reporter.DEFAULT_REPORTER = 'bash';

Reporter.envReporter = function(type) {
  return type || process.env.REPORTER || Reporter.DEFAULT_REPORTER;
};

Reporter.create = function(type) {
  type = this.envReporter(type);
  var path = this._path(type);

  try {
    var TypeReporter = require(path);
    var reporter = (TypeReporter.create)
      ? TypeReporter.create()
      : new TypeReporter();
  } catch (e) {
    throw new Error('Reporter not found: ' + type);
  }

  return reporter;
};

// @TODO support loading from installed npm / node_modules
Reporter._path = function(type) {
  return './reporter/' + type + '_reporter';
};

Reporter.prototype.watch = function(testCase) {
  testCase
    .on('test.end', this.onTestEnd.bind(this, testCase))
    .on('end', this.onTestCaseEnd.bind(this, testCase));
};

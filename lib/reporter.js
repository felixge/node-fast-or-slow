var Hashish = require('hashish');
var inflect = require('inflect');

module.exports = Reporter;
Reporter.DEFAULT_REPORTER = 'bash';

Reporter.envReporter = function(type) {
  var tap = (parseInt(process.env.TAP, 10))
    ? 'tap'
    : null;

  return type || process.env.REPORTER || tap || Reporter.DEFAULT_REPORTER;
};

Reporter.create = function(type) {
  type = this.envReporter(type);
  var path = this._path(type);

  try {
    var TypeReporter = require(path);
  } catch (e) {
    throw new Error('Reporter not found: ' + type);
  }

  var reporter = (TypeReporter.create)
    ? TypeReporter.create()
    : new TypeReporter();

  return reporter;
};

// @TODO support loading from installed npm / node_modules
Reporter._path = function(type) {
  return './reporter/' + type + '_reporter';
};

function Reporter() {
  this.stdout = process.stdout;
  this.stderr = process.stderr;
}

Reporter.prototype.watch = function(testCase) {
  var map = {
    'test.end': 'onTestEnd',
    'end': 'onTestCaseEnd',
  };

  for (var event in map) {
    var handler = map[event];
    if (!this[handler]) {
      continue;
    }

    testCase.on(event, this[handler].bind(this, testCase));
  }
};

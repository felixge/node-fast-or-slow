var Test = require('./test');

module.exports = TestCase;
function TestCase() {
  this.index = 0;
  this.tests = [];
  this.errors = [];
  this.testTimeout = null;

  this._started = null;
  this._ended = null;
}

TestCase.create = function(testTimeout) {
  var testCase = new this();
  testCase.testTimeout = testTimeout;
  return testCase;
};

TestCase.prototype.sugarAddTest = function() {
  var self = this;
  function sugarAddTest() {
    return self.addTest.apply(self, arguments);
  };

  Object
    .keys(TestCase.prototype)
    .concat(Object.keys(this))
    .forEach(function(property) {
      if (typeof self[property] !== 'function') {
        sugarAddTest[property] = self[property];
        return;
      }

      sugarAddTest[property] = function () {
        return self[property].apply(self, arguments);
      };
    });

  return sugarAddTest;
};

TestCase.prototype.addTest = function(name, options, fn) {
  // add(name, fn)
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  options.timeout = options.timeout || this.testTimeout;

  var test = Test.create(name, options, fn);
  this.tests.push(test);
};

TestCase.prototype.run = function(cb) {
  this._started = +new Date;
  this.runNext(cb);
};

TestCase.prototype.runNext = function(cb) {
  var test = this.tests[this.index];

  if (!test) {
    this.end(cb);
    return;
  }

  var self = this;
  test.run(function(err) {
    if (err) {
      self.errors.push(err);
    }

    self.index++;
    self.runNext(cb);
  });
};

TestCase.prototype.end = function(cb) {
  var errors = (this.errors.length)
    ? this.errors
    : null;

  this._ended = +new Date;
  cb(errors, this.stats());
};

TestCase.prototype.stats = function() {
  var fail = this.errors.length;
  var total = this.tests.length;
  var pass = this.index - fail;

  return {
    pass: pass,
    fail: fail,
    total: total,
    duration: this.duration(),
  };
};

TestCase.prototype.duration = function() {
  return (this._ended || +new Date) - this._started;
};

var hashish = require('hashish');
var Test = require('./test');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

module.exports = TestCase;
util.inherits(TestCase, EventEmitter);
function TestCase() {
  this.index = 0;
  this.tests = [];
  this.errors = [];
  this.testTimeout = null;

  this.beforeFn
    = this.afterFn
    = function() {};

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

  hashish.update(options, {
    timeout: options.timeout || this.testTimeout,
    beforeFn: this.beforeFn,
    afterFn: this.afterFn,
  });

  var test = Test.create(name, options, fn);
  this.tests.push(test);
};

TestCase.prototype.before = function(fn) {
  this.beforeFn = fn;
};

TestCase.prototype.after = function(fn) {
  this.afterFn = fn;
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

    self.emit('test.end', test);
    self.index++;
    self.runNext(cb);
  });
};

TestCase.prototype.end = function(cb) {
  var errors = (this.errors.length)
    ? this.errors
    : null;

  this._ended = +new Date;

  if (cb) {
    cb(errors, this.stats());
  }

  this.emit('end');
};

TestCase.prototype.stats = function() {
  var fail = this.errors.length;
  var total = this.tests.length;
  var pass = this.index - fail;

  return {
    pass: pass,
    fail: fail,
    executed: this.index,
    total: total,
    duration: this.duration(),
  };
};

TestCase.prototype.duration = function() {
  return (this._ended || +new Date) - this._started;
};

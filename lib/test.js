var Hashish = require('hashish');
var stackTrace = require('stack-trace');

module.exports = Test;
function Test() {
  this.name = null;
  this.timeout = null;
  this.error = null;

  this.steps = ['before', 'test', 'after'];
  this.beforeFn
    = this.testFn
    = this.afterFn
    = function() {};

  this._createTrace = null;
  this._cb = null;
  this._timeout = null;
  this._ended = null;
  this._started = null;
}

Test.create = function(name, options, testFn) {
  // create(name, testFn)
  if (typeof options === 'function') {
    testFn = options;
    options = {};
  }

  var test = new this();
  Hashish.update(test, options);
  Hashish.update(test, {
    name: name,
    testFn: testFn,
    _createTrace: stackTrace.get(),
  });

  return test;
};

Test.isAsync = function(fn) {
  return fn.length > 0;
};

Test.prototype.run = function(cb) {
  this._started = +new Date;
  this._cb = cb;

  this.setTimeout(this.timeout);
  this.nextStep();
};

Test.prototype.nextStep = function() {
  var step = this.steps.shift();
  if (!step) {
    this.end();
    return;
  }

  var fn = this[step + 'Fn'];
  var self = this;

  function callback(err) {
    if (callback.called) {
      return;
    }

    process.removeListener('uncaughtException', callback);
    self.error = self.error || err;
    callback.called = true;

    // Needed, otherwise node will detect an uncaughtException recursion
    process.nextTick(function() {
      self.nextStep();
    });
  }

  process.on('uncaughtException', callback);
  fn.call(this, callback);

  if (!Test.isAsync(fn)) {
    callback(null);
  }
};

Test.prototype.end = function() {
  if (this._ended) {
    return;
  }

  clearTimeout(this._timeout);
  this._ended = +new Date;
  this.error = this._addErrorLocation(this.error || this.timeoutError());

  this._cb(this.error);
};

Test.prototype.isAsync = function() {
  return this.testFn.length > 0;
};

Test.prototype._addErrorLocation = function(err) {
  if (!err) {
    return null;
  }

  var callSite = (err.timeout && this._createTrace)
    ? this._findTimeoutCallSite()
    : this._findErrorCallSite(err);

  err.file = '?';
  err.line = '?';

  if (callSite) {
    err.file = callSite.getFileName();
    err.line = callSite.getLineNumber();
  }

  return err;
};

Test.prototype._findTimeoutCallSite = function() {
  for (var i = 0; i < this._createTrace.length; i++) {
    var callSite = this._createTrace[i];
    var filename = callSite.getFileName();

    // Ignore node and v8 internals
    if (!filename || filename.substr(0, 1) !== '/') {
      continue;
    }

    // Match first call site outside of fast-or-slow
    if (filename.indexOf(__dirname) !== 0) {
      break;
    }
  }

  return callSite;
};

Test.prototype._findErrorCallSite = function(err) {
  // Find the first call site with a file name
  return stackTrace
    .parse(err)
    .reduce(function(previous, current) {
      if (previous) {
        return previous;
      }

      if (current.getFileName()) {
        return current;
      }
    }, undefined);
};

Test.prototype.setTimeout = function(timeout) {
  this.timeout = timeout;
  if (!this.isAsync()) {
    return;
  }

  clearTimeout(this._timeout);

  if (!timeout) {
    return;
  }

  this._timeout = setTimeout(this.end.bind(this), timeout);
};

Test.prototype.timeoutError = function() {
  var duration = this.duration();
  if (!this.timeout || duration < this.timeout) {
    return;
  }

  var err = new Error(
    'Timeout: test exceeded ' + this.timeout + 'ms ' +
    '(took ' + duration + 'ms)'
  );

  err.timeout = true;

  return err;
};

Test.prototype.duration = function() {
  return (this._ended || +new Date) - this._started;
};

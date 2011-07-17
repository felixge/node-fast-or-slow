var Hashish = require('hashish');
var stackTrace = require('stack-trace');

module.exports = Test;
function Test() {
  this.name = null;
  this.fn = null;
  this.timeout = null;
  this.error = null;

  this._createTrace = null;
  this._doneCb = null;
  this._timeout = null;
  this._ended = null;
  this._started = null;
}

Test.create = function(name, options, fn) {
  // create(name, fn)
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  var test = new this();
  Hashish.update(test, options);
  Hashish.update(test, {
    name: name,
    fn: fn,
    _createTrace: stackTrace.get(),
  });

  return test;
};

Test.prototype.run = function(cb) {
  var err = null;
  var doneCb = this.doneCb(cb);

  this._started = +new Date;
  this.setTimeout(this.timeout);

  try {
    this.fn(doneCb);
  } catch (exception) {
    err = exception;
  }

  if (err || !this.isAsync()) {
    doneCb(err);
  }
};

Test.prototype.isAsync = function() {
  return this.fn.length > 0;
};

Test.prototype.doneCb = function(runCb) {
  if (this._doneCb) {
    return this._doneCb;
  }

  var self = this;
  function doneCb(err) {
    if (self._ended) {
      return;
    }

    process.removeListener('uncaughtException', doneCb);

    clearTimeout(self._timeout);
    self._ended = +new Date;

    self.error =  self._addTraceInfo(err || self.timeoutError());
    runCb(self.error);
  }

  process.on('uncaughtException', doneCb);
  return this._doneCb = doneCb;
};

Test.prototype._addTraceInfo = function(err) {
  if (!err) {
    return null;
  }

  var callSite = (err.timeout && this._createTrace)
    ? this._findTimeoutCallSite()
    : callSite = stackTrace.parse(err)[0];

  err.file = callSite.getFileName();
  err.line = callSite.getLineNumber();

  return err;
};

Test.prototype._findTimeoutCallSite = function() {
  for (var i = 0; i < this._createTrace.length; i++) {
    var callSite = this._createTrace[i];
    var filename = callSite.getFileName();

    if (!filename || filename.substr(0, 1) !== '/') {
      continue;
    }

    if (filename.indexOf(__dirname) !== 0) {
      break;
    }
  }

  return callSite;
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

  var remainingTimeout = timeout - (+new Date - this._started);
  this._timeout = setTimeout(this.doneCb(), remainingTimeout);
};

Test.prototype.timeoutError = function() {
  var duration = this.duration();
  if (!this.timeout || duration < this.timeout) {
    return;
  }

  var err = new Error(
    'Timeout: test ran longer than ' + this.timeout + 'ms ' +
    '(took ' + duration + 'ms)'
  );

  err.timeout = true;

  return err;
};

Test.prototype.duration = function() {
  return (this._ended || +new Date) - this._started;
};

Test.prototype.getCallSite = function() {
  var libDir = __dirname;

  for (var i = 0; i < this._trace.length; i++) {
    var callSite = this._trace[i];
    if (callSite.getFileName().indexOf(libDir) === -1) {
      return callSite;
    }
  }
};

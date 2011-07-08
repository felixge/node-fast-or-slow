var hash = require('hashish');

module.exports = Test;
function Test() {
  this.name = null;
  this.fn = null;
  this.timeout = null;

  this._done = false;
  this._doneCb = null;
  this._timeout = null;
  this._ended = null;
  this._started = null;
}

Test.prototype.run = function(cb) {
  var err = null;
  var doneCb = this.doneCb(cb);

  this.setTimeout(this.timeout);

  this._started = +new Date;
  try {
    this.fn(doneCb);
  } catch (exception) {
    err = exception;
  }

  if (!doneCb) {
    this._done = true;
    cb(err);
  }
};

Test.prototype.isAsync = function() {
  return this.fn.length > 0;
};

Test.prototype.doneCb = function(runCb) {
  if (!this.isAsync()) {
    return null;
  }

  if (this._doneCb) {
    return this._doneCb;
  }

  var self = this;
  function doneCb(err) {
    if (self._done) {
      return;
    }

    err = err || self.timeoutError();
    process.removeListener('uncaughtException', doneCb);
    self._done = true;
    runCb(err);
  }

  process.on('uncaughtException', doneCb);
  return this._doneCb = doneCb;
};

Test.prototype.setTimeout = function() {
  var timeout = this.timeout;

  if (!timeout) {
    return;
  }

  var self = this;
  this._timeout = setTimeout(function() {
    self._ended = +new Date;
    self.doneCb()();
  }, timeout);
};

Test.prototype.timeoutError = function() {
  var duration = this.duration();
  if (this.timeout && duration >= this.timeout) {
    return new Error('timeout: test ran longer than ' + this.timeout + 'ms (took ' + duration + 'ms)');
  }
};

Test.prototype.duration = function() {
  return (this._ended || +new Date) - this._started;
};


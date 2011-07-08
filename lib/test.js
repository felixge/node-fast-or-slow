var hash = require('hashish');

module.exports = Test;
function Test() {
  this.name = null;
  this.fn = null;
  this.timeout = null;

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

  if (!this.isAsync()) {
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

    clearTimeout(self._timeout);
    self._ended = +new Date;
    err = err || self.timeoutError();
    process.removeListener('uncaughtException', doneCb);
    runCb(err);
  }

  process.on('uncaughtException', doneCb);
  return this._doneCb = doneCb;
};

Test.prototype.setTimeout = function(timeout) {
  this.timeout = timeout;
  if (!this.isAsync()) {
    return;
  }

  if (!timeout) {
    return;
  }

  clearTimeout(this._timeout);

  var remainingTimeout = timeout - (+new Date - this._started);
  this._timeout = setTimeout(this.doneCb(), remainingTimeout);
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


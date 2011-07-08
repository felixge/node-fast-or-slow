var hash = require('hashish');

module.exports = Test;
function Test() {
  this.name = null;
  this.fn = null;
  this.timeout = null;
  this.done = false;

  this._doneCb = null;
}

Test.prototype.run = function(cb) {
  var err = null;

  var doneCb = (this.isAsync())
    ? this.doneCb(cb)
    : null;

  try {
    this.fn(doneCb);
  } catch (exception) {
    err = exception;
  }

  if (!doneCb) {
    this.done = true;
    cb(err);
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
    if (self.done) {
      return;
    }

    process.removeListener('uncaughtException', doneCb);
    self.done = true;
    runCb(err);
  }

  process.on('uncaughtException', doneCb);
  return this._doneCb = doneCb;
};

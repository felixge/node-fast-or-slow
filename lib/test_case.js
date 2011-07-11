module.exports = TestCase;
function TestCase() {
  this.index = 0;
  this.tests = [];
  this.errors = [];

  this._started = null;
  this._ended = null;
}

TestCase.prototype.add = function(test) {
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

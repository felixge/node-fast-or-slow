module.exports = TestCase;
function TestCase() {
  this.tests = [];
}

TestCase.prototype.add = function(test) {
  this.tests.push(test);
};

TestCase.prototype.run = function(cb) {
  if (!this.tests.length) {
    cb(null);
    return;
  }

  this.tests[0].run(function(err) {
    if (err) {
      cb([err]);
    } else {
      cb(null);
    }
  });
};

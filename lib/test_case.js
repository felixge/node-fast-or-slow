module.exports = TestCase;
function TestCase() {
  this._tests = [];
}

TestCase.prototype.add = function(test) {
  this._tests.push(test);
};

TestCase.prototype.run = function(cb) {
  cb(null);
};

var Test = require('./test');
var Hashish = require('hashish');

module.exports = TestCase;
function TestCase() {
  this._tests = [];
}

TestCase.prototype.add = function(name, options, fn) {
  // add(name, fn)
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  var test = new Test();
  Hashish.update(test, options);
  Hashish.update(test, {
    name: name,
    fn: fn,
  });

  this._tests.push(test);
};

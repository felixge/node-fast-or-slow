var common = require('../common');
var test = require(common.dir.lib + '/fast_or_slow').fastTestCase();
var assert = require('assert');

test('The laws of JavaScript apply', function() {
  assert.ok(true);
});

test('Slow tests are bad', function(done) {
  setTimeout(function() {
    done();
  }, 110);
});

test('V8 is fast', function() {
  var countTo = 1000000;
  for (var i = 0; i < countTo; i++) {
  }

  assert.equal(i, countTo);
});

process.on('exit', function(exitCode) {
  var stats = test.stats();
  assert.equal(stats.fail, 1);
  assert.equal(stats.pass, 2);
  assert.equal(exitCode, 1);

  process.reallyExit(0);
});

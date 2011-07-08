var common = require('./common');
var test = common.lib('fast_or-_low').fastTestCase();

test('The laws of JavaScript apply', function() {
  test.ok(true);
});

test('Slow tests are bad', function(done) {
  setTimeout(function() {
    done();
  }, 20);
});

test('V8 is fast', function() {
  var countTo = 1000000;
  for (var i = 0; i <= countTo; i++) {
  }

  test.equal(i, countTo);
});

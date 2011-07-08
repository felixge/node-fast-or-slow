var common = require('../common');
var assert = require('assert');
var sinon = require('sinon');

var Test = common.lib('test');

var instance;
function test(fn) {
  instance = new Test();
  fn();
}

test(function constructor() {
});

test(function runEmptyTest() {
  instance.fn = sinon.spy();

  var runCb = sinon.spy();
  instance.run(runCb);

  assert.ok(instance.fn.called);
  assert.strictEqual(runCb.args[0][0], null);

  assert.ok(instance.done);
});

test(function runSyncException() {
  instance.fn = sinon.stub();
  var err = new Error('something went wrong');
  instance.fn.throws(err);

  var runCb = sinon.spy();
  instance.run(runCb);

  assert.ok(instance.fn.called);
  assert.strictEqual(runCb.args[0][0], err);
});

test(function runAsyncTest() {
  var clock = sinon.useFakeTimers();;

  instance.fn = function(done) {
    setTimeout(function() {
      done();
    }, 100);
  };

  var runCb = sinon.spy();
  instance.run(runCb);

  clock.tick(99);
  assert.ok(!runCb.called);
  clock.tick(1);
  assert.ok(runCb.called);
  assert.ok(instance.done);

  clock.restore();
});

test(function runAsyncTestDoneTwice() {
  instance.fn = function(done) {
    done();
    done();
  };

  var runCb = sinon.spy();
  instance.run(runCb);

  assert.strictEqual(runCb.callCount, 1);
});

test(function runAsyncTestError() {
  var clock = sinon.useFakeTimers();;

  var err = new Error('ouch');
  instance.fn = function(done) {
    setTimeout(function() {
      done(err);
    }, 100);
  };

  var runCb = sinon.spy();
  instance.run(runCb);

  clock.tick(100);
  assert.strictEqual(runCb.args[0][0], err);

  clock.restore();
});

test(function runAsyncTestException() {
  var err = new Error('ouch');
  instance.fn = function(done) {
    process.nextTick(function() {
      throw err;
    });
  };

  var runCb = sinon.spy();
  instance.run(runCb);

  process.nextTick(function() {
    assert.strictEqual(runCb.args[0][0], err);
    var listeners = process.listeners('uncaughtException');
    process.removeAllListeners('uncaughtException');
    assert.strictEqual(listeners.length, 0);
  });
});

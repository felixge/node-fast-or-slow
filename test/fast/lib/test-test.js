var common = require('../common');
var assert = require('assert');
var sinon = require('sinon');
var EventEmitter = require('events').EventEmitter;

var sandboxProcess = new EventEmitter();
var Sandbox = common.sandbox('test', {
  globals: {
    process: sandboxProcess,
  }
});
var Test = Sandbox.exports;

var testInstance;
function test(fn) {
  testInstance = new Test();
  fn();
}

test(function constructor() {
});

test(function runEmptyTest() {
  testInstance.fn = sinon.spy();

  var runCb = sinon.spy();
  testInstance.run(runCb);

  assert.ok(testInstance.fn.called);
  assert.strictEqual(runCb.args[0][0], null);

  assert.ok(testInstance._done);
});

test(function runSyncException() {
  testInstance.fn = sinon.stub();
  var err = new Error('something went wrong');
  testInstance.fn.throws(err);

  var runCb = sinon.spy();
  testInstance.run(runCb);

  assert.ok(testInstance.fn.called);
  assert.strictEqual(runCb.args[0][0], err);
});

test(function runAsyncTest() {
  var clock = sinon.useFakeTimers();;

  testInstance.fn = function(done) {
    setTimeout(function() {
      done();
    }, 100);
  };

  var runCb = sinon.spy();
  testInstance.run(runCb);

  clock.tick(99);
  assert.ok(!runCb.called);
  clock.tick(1);
  assert.ok(runCb.called);
  assert.ok(testInstance._done);

  clock.restore();
});

test(function runAsyncTestDoneTwice() {
  testInstance.fn = function(done) {
    done();
    done();
  };

  var runCb = sinon.spy();
  testInstance.run(runCb);

  assert.strictEqual(runCb.callCount, 1);
});

test(function runAsyncTestError() {
  var clock = sinon.useFakeTimers();;

  var err = new Error('ouch');
  testInstance.fn = function(done) {
    setTimeout(function() {
      done(err);
    }, 100);
  };

  var runCb = sinon.spy();
  testInstance.run(runCb);

  clock.tick(100);
  assert.strictEqual(runCb.args[0][0], err);

  clock.restore();
});

test(function runAsyncTestException() {
  testInstance.fn = function(done) {
  };

  var runCb = sinon.spy();
  testInstance.run(runCb);

  var err = new Error('oh no');
  sandboxProcess.emit('uncaughtException', err);

  assert.strictEqual(runCb.args[0][0], err);
  var listeners = [].concat(sandboxProcess.listeners('uncaughtException'));
  sandboxProcess.removeAllListeners('uncaughtException');
  assert.strictEqual(listeners.length, 0);
});

test(function asyncTimeout() {
  var clock = sinon.useFakeTimers();;

  Sandbox.globals.setTimeout = setTimeout;
  Sandbox.globals.Date = Date;

  testInstance.fn = function(done) {
  };
  testInstance.timeout = 100;

  var runCb = sinon.spy();
  testInstance.run(runCb);

  clock.tick(99);
  assert.strictEqual(runCb.called, false);
  clock.tick(1);
  var doneErr = runCb.args[0][0];
  assert.ok(doneErr.message.match(/timeout/));
  assert.ok(doneErr.message.indexOf('than ' + testInstance.timeout + 'ms') > -1);
  assert.ok(doneErr.message.indexOf('took 100ms') > -1);

  clock.restore()
  Sandbox.globals.setTimeout = setTimeout;
  Sandbox.globals.Date = Date;
});

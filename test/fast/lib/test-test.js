var common = require('../common');
var assert = require('assert');
var sinon = require('sinon');
var EventEmitter = require('events').EventEmitter;
var stackTrace = require('stack-trace');

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

test(function addOneTest() {
  var testName = 'my test';
  var testFn = function() {};

  var testInstance = Test.create(testName, testFn);

  assert.strictEqual(testInstance.name, testName);
  assert.strictEqual(testInstance.fn, testFn);
  assert.ok(testInstance._createTrace);
});

test(function addTestWithOptions() {
  var testName = 'my test';
  var testOptions = {foo: 'bar'};
  var testFn = function() {};

  var testInstance = Test.create(testName, testOptions, testFn);

  assert.strictEqual(testInstance.foo, testOptions.foo);
});

test(function runEmptyTest() {
  testInstance.fn = sinon.spy();

  var runCb = sinon.spy();
  testInstance.run(runCb);

  assert.ok(testInstance.fn.called);
  var doneErr = runCb.args[0][0];
  assert.ok(!doneErr);

  assert.ok(testInstance._ended);
});

test(function runSyncException() {
  testInstance.fn = sinon.stub();
  var err = new Error('something went wrong');
  testInstance.fn.throws(err);

  var runCb = sinon.spy();
  testInstance.run(runCb);

  assert.ok(testInstance.fn.called);
  assert.strictEqual(testInstance.error, err);
  assert.strictEqual(runCb.args[0][0], err);
});

test(function runSyncExceptionInAsyncTest() {
  var err = new Error('something went wrong');
  testInstance.fn = function(done) {
    throw err;
  };

  var runCb = sinon.spy();
  testInstance.run(runCb);

  assert.strictEqual(testInstance.error, err);
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
  assert.ok(testInstance._ended);

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
  testInstance.fn = function(done) {};
  var timeout = testInstance.timeout = 100;

  var runCb = sinon.spy();
  testInstance.run(runCb);

  clock.tick(99);
  assert.strictEqual(runCb.called, false);
  clock.tick(1);
  var doneErr = runCb.args[0][0];
  assert.ok(doneErr.timeout);
  assert.ok(doneErr.message.match(/timeout/i));
  assert.ok(doneErr.message.indexOf('than ' + timeout + 'ms') > -1);
  assert.ok(doneErr.message.indexOf('took 100ms') > -1);

  clock.restore()
  Sandbox.globals.setTimeout = setTimeout;
  Sandbox.globals.Date = Date;
});

test(function syncTimeout() {
  testInstance.fn = function() {
  };
  var timeout = testInstance.timeout = -1;

  var runCb = sinon.spy();
  testInstance.run(runCb);

  assert.strictEqual(runCb.called, true);
  var doneErr = runCb.args[0][0];
  assert.ok(doneErr.message.match(/timeout/i));
  assert.ok(doneErr.message.indexOf('than ' + timeout + 'ms') > -1);
});

test(function alterTimeout() {
  var clock = sinon.useFakeTimers();;
  Sandbox.globals.setTimeout = setTimeout;
  Sandbox.globals.clearTimeout = clearTimeout;
  Sandbox.globals.Date = Date;

  testInstance.fn = function(done) {};
  testInstance.timeout = 100;

  var runCb = sinon.spy();
  testInstance.run(runCb);

  clock.tick(99);
  assert.strictEqual(runCb.called, false);
  testInstance.setTimeout(101);
  clock.tick(1);
  assert.strictEqual(runCb.called, false);
  clock.tick(1);
  assert.strictEqual(runCb.called, true);

  clock.restore()
  Sandbox.globals.setTimeout = setTimeout;
  Sandbox.globals.clearTimeout = clearTimeout;
  Sandbox.globals.Date = Date;
});

test(function clearsAysyncTimeoutOnSuccess() {
  var realClearTimeout = clearTimeout;
  var timeoutId = 23;

  Sandbox.globals.setTimeout = sinon.stub().returns(timeoutId);
  Sandbox.globals.clearTimeout = sinon.stub();

  testInstance.fn = function(done) {
    done();
  };
  testInstance.timeout = 100;

  var runCb = sinon.spy();
  testInstance.run(runCb);

  assert.ok(runCb.called);
  assert.ok(Sandbox.globals.clearTimeout.calledWith(timeoutId));

  Sandbox.globals.clearTimeout = realClearTimeout;
});

test(function cancelTimeout() {
  var clock = sinon.useFakeTimers();;

  Sandbox.globals.setTimeout = setTimeout;
  Sandbox.globals.clearTimeout = clearTimeout;
  Sandbox.globals.Date = Date;
  testInstance.fn = function(done) {};
  testInstance.timeout = 100;

  var runCb = sinon.spy();
  testInstance.run(runCb);

  testInstance.setTimeout(0);

  clock.tick(100);
  assert.ok(!testInstance._ended);

  testInstance.doneCb()();
  assert.ok(testInstance._ended);
  var doneErr = runCb.args[0][0];
  assert.ok(!doneErr);

  clock.restore()
  Sandbox.globals.setTimeout = setTimeout;
  Sandbox.globals.clearTimeout = clearTimeout;
  Sandbox.globals.Date = Date;
});

//test(function getLine() {

//});

test(function getFile() {
  var expectedCallSite = {getFileName: sinon.stub().returns(common.dir.root + '/test/super.js')};
  testInstance._trace = [
    {getFileName: sinon.stub().returns(common.dir.lib + '/foo.js')},
    {getFileName: sinon.stub().returns(common.dir.lib + '/me.js')},
    expectedCallSite,
    {getFileName: sinon.stub().returns('you went too far!')},
  ];

  var callSite = testInstance.getCallSite();
  assert.strictEqual(callSite, expectedCallSite);
});

test(function addTraceInfoForTimeout() {
  var file = __dirname + '/imaginary.js';
  var line = 42;

  testInstance._createTrace = [
    {
      getFileName: function() { return common.dir.lib + '/foo.js' },
      getLineNumber: function() { return 23; },
    },
    {
      getFileName: function() { return file },
      getLineNumber: function() { return line; },
    }
  ];

  var err = new Error('oh noes');
  err.timeout = true;

  testInstance._addTraceInfo(err);

  assert.equal(err.file, file);
  assert.equal(err.line, line);
});

test(function addTraceInfoForRegularError() {
  var err = new Error('oh noes');
  var errorLine = stackTrace.get()[0].getLineNumber() - 1;

  testInstance._addTraceInfo(err);

  assert.equal(err.file, __filename);
  assert.equal(err.line, errorLine);
});

# fast-or-slow

Are your tests fast or slow? An opinionated testing framework.

## Introduction

After lots of trial and error, I have come to realize that there is only one
thing I care about when writing tests - are they fast, or are they slow?

Seriously, who gives a fuck if you are unit testing with crazy mocks & stubs
or doing end to end tests involving all parts of your application?

The important thing is that you write tons of tests, and that you can execute
them very quickly to have short feedback loops.

## Rules

**Fast tests:**

* Finish in < 10ms / test
* Pass without a network, database, or any software not installed on every
  machine used by your team.

**Slow tests:**

* Finish in < 30 seconds per test
* Can require as much additional software / setup as you want

## Example

``` javascript
var test = require('fast-or-slow').fastTestCase();

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
```

### Running a test file

Running this test is as simple as:

```
$ node test-example.js
! Slow tests are bad (line 9 in test/fast/example/test-example.js)

Error: Timeout: test ran longer than 10ms (took 11ms)
    at Test.timeoutError (/Users/felix/code/node-fast-or-slow/lib/test.js:136:13)
    at Object.doneCb (/Users/felix/code/node-fast-or-slow/lib/test.js:74:50)
    at Timer.callback (timers.js:83:39)
$ echo $?
1
```
Also, did you notice the awesome line number indications? Try this:

```
$ node test-example.js | grep !
! Slow tests are bad (line 9 in test/fast/example/test-example.js)
```

Seriously, why doesn't every testing framework work this way?

### Before / After

The before / after functions are executed for every test:

``` javascript
var test = require('fast-or-slow').fastTestCase();
var mysql = require('mysql');

test.before(function() {
  this.client = mysql.createClient();
});

test.after(function() {
  this.client.destroy();
});

test('Some query', function(done) {
  this.client.query('SELECT ...');
});
```

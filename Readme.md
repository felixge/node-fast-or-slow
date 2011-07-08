# fast-or-slow

Are your tests fast or slow? An opinionated testing framework.

## Introduction

After lots of trial and error, I have come to realize that there is only one
thing I care about when writing tests - are they fast, or are they slow?

Seriously, who gives a fuck if you are unit testing with crazy mocks & stubs
or doing end to end tests involving all parts of your application?

The important thing is that you write tons of tests, and that you can execute
them very quickly to have short feedback loops.

## Rules of the game

**Fast tests:**

* Finish in < 10ms / test, and < 1 second per test file
* Pass without a network, database, or any other software not installed on a
  plain \*nix machine.

**Slow tests:**

* Finish in < 30 seconds per test and < 5 minutes per test file
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

Running this test is as simple as:

``` bash
$ node test-example.js
0 20
Error: 'Slow tests are bad': Exceeded timeout of 10ms (took 20ms)
 at ...
 at ...

-> line 45 in test-example.js
5
$ echo $?
1
```

As you can see, this ridicously awesome. Instead of printing useless dots
or color highlighted BS about which test is running, you see a list of execution
times flying by, only interrupted by test failures as they occur.

Oh, and the test is a standalone program that behaves like a good unix citizen
and exits with 0 on success or 1 on error.

Also, did you notice the awesome line number indications? Try this:

``` bash
$ node test-example.js | grep ->
-> line 45 in test-example.js
```

Seriously, why doesn't every testing framework work this work?

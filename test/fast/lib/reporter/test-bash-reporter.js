var common = require('../../common');
var sinon = require('sinon');
var assert = require('assert');

var Sandbox = common.sandbox('reporter/bash_reporter');
var BashReporter = Sandbox.exports;

var bashReporter;
function test(fn) {
  bashReporter = new BashReporter();
  fn();
}

//test(function addTestCase() {
  //bashReporter.add
//});

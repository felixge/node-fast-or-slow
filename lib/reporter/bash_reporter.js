var Reporter = require('../reporter');
var util = require('util');

module.exports = BashReporter;
util.inherits(BashReporter, Reporter);
function BashReporter() {
  Reporter.call(this);
}

BashReporter.prototype.watch = function(testCase) {
  var self = this;
  testCase
    .on('test.end', function(test) {
      var error = test.error;
      if (!error) {
        return;
      }

      var file = error.file;
      if (file.indexOf(process.cwd()) === 0) {
        file = file.substr(process.cwd().length + 1);
      }

      console.log('! ' + test.name + ' (line ' + error.line + ' in ' + file + ')\n');

      var stack = test.error.stack;
      stack = stack.replace(/(.+)/gm, '  $1');
      self.stdout.write(stack + '\n\n');
    })
    .on('end', function() {
      var stats = testCase.stats();
      console.log('%d fail | %d pass (%d ms)', stats.fail, stats.pass, stats.duration);

      var exitCode = (stats.fail)
        ? 1
        : 0;

      process.exit(exitCode);
    });
};

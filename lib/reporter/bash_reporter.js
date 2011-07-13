var Reporter = require('../reporter');
var util = require('util');

module.exports = BashReporter;
util.inherits(BashReporter, Reporter);
function BashReporter() {
}

BashReporter.prototype.watch = function(testCase) {
  testCase
    .on('end', function() {
      var stats = testCase.stats();
      if (stats.fail) {
        process.exit(1);
      }
    });
};

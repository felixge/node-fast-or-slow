var SandboxeModule = require('sandboxed-module');
var path = require('path');

var root = path.join(__dirname, '..');
exports.dir = {
  root: root,
  lib: root + '/lib',
};

var sandboxedModules = [];
exports.sandbox = function(moduleId, options) {
  moduleId = path.join(exports.dir.lib, moduleId);
  var sandboxedModule = SandboxeModule.load(moduleId, options);
  sandboxedModules.push(sandboxedModule);
  return sandboxedModule;
};

process.on('exit', function() {
  sandboxedModules.forEach(function(sandboxedModule) {
    var leaks = sandboxedModule.getGlobalLeaks();
    if (leaks.length) {
      throw new Error('Test leaked global variables: ' + leaks);
    }
  });
});

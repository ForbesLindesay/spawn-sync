'use strict';

var fs = require('fs');
var cp = require('child_process');
var assert = require('assert');

var partialDependencies = {
  "concat-stream": "^1.4.7"
};
var fullDependencies = {
  "concat-stream": "^1.4.7",
  "try-thread-sleep": "^1.0.0"
};

var REQUIRES_UPDATE = false;
var pkg = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8'));
if (cp.spawnSync || __dirname.indexOf('node_modules') === -1) {
  try {
    assert.deepEqual(pkg.dependencies, partialDependencies);
  } catch (ex) {
    pkg.dependencies = partialDependencies;
    REQUIRES_UPDATE = true;
  }
} else {
  try {
    assert.deepEqual(pkg.dependencies, fullDependencies);
  } catch (ex) {
    pkg.dependencies = fullDependencies;
    REQUIRES_UPDATE = true;
  }
}
if (REQUIRES_UPDATE && __dirname.indexOf('node_modules') !== -1) {
  fs.writeFileSync(__dirname + '/package.json', JSON.stringify(pkg, null, '  '));
  cp.exec('npm install --production', {
    cwd: __dirname
  }, function (err) {
    if (err) {
      throw err;
    }
  });
}

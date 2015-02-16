'use strict';

var fs = require('fs');
var cp = require('child_process');
var assert = require('assert');

var REQUIRES_UPDATE = false;
var pkg = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8'));
if (cp.spawnSync || __dirname.indexOf('node_modules') === -1) {
  try {
    assert.deepEqual(pkg.dependencies, {});
  } catch (ex) {
    pkg.dependencies = {};
    REQUIRES_UPDATE = true;
  }
} else {
  try {
    assert.deepEqual(pkg.dependencies, pkg.devDependencies);
  } catch (ex) {
    pkg.dependencies = pkg.devDependencies;
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

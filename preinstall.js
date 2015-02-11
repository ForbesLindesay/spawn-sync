'use strict';

var fs = require('fs');
var cp = require('child_process');
var pkg = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8'));
if (cp.spawnSync && __dirname.indexOf('node_modules') !== -1) {
  pkg.dependencies = {};
} else {
  pkg.dependencies = {
    "concat-stream": "^1.4.7",
    "try-thread-sleep": "^1.0.0"
  };
}
fs.writeFileSync(__dirname + '/package.json', JSON.stringify(pkg, null, '  '));

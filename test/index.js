'use strict';

var assert = require('assert');
var vm = require('vm');
var fs = require('fs');
var path = require('path');

var spawnFile = require.resolve('../');
var spawnSource = fs.readFileSync(spawnFile, 'utf8');

function testSpawn(spawn) {
  var result = spawn("node", [__dirname + '/test-spawn.js'], {input: 'my-output'});
  assert(result.status === 0);
  assert(Buffer.isBuffer(result.stdout));
  assert(Buffer.isBuffer(result.stderr));
  assert(result.stdout.toString() === 'output written');
  assert(result.stderr.toString() === 'error log exists');
  assert(fs.readFileSync(__dirname + '/output.txt', 'utf8') === 'my-output');
  fs.unlinkSync(__dirname + '/output.txt');

  var result = spawn("node", [__dirname + '/test-spawn-fail.js'], {input: 'my-output'});
  assert(result.status === 13);
  assert(Buffer.isBuffer(result.stdout));
  assert(Buffer.isBuffer(result.stderr));
  assert(result.stdout.toString() === 'output written');
  assert(result.stderr.toString() === 'error log exists');
  assert(fs.readFileSync(__dirname + '/output.txt', 'utf8') === 'my-output');
  fs.unlinkSync(__dirname + '/output.txt');

  var start = Date.now();
  var result = spawn("node", [__dirname + '/test-spawn-timeout.js'], {timeout: 100});
  console.dir(result);
  var end = Date.now();
  assert((end - start) < 200);
  
  console.log('test pass');
}

var resolve = require.resolve;
function getSpawn(require) {
  require.resolve = resolve;
  var exports = {};
  var context = {
    module: exports,
    exports: exports,
    require: require,
    __dirname: path.dirname(spawnFile),
    console: {warn: function () {}},
    process: process
  };
  vm.runInNewContext(spawnSource, context, spawnFile);
  return context.module.exports
}

if (require('child_process').spawnSync) {
  console.log('# Test built in node API');
  testSpawn(require('child_process').spawnSync);
} else {
  console.log('# SKIP Test built in node API');
}

var execSyncAvailable = require('../lib/has-native.js');
if (execSyncAvailable) {
  console.log('# Test native operation');
  testSpawn(getSpawn(function (path) {
    if (path === './lib/has-native.js') return true;
  if (path === './lib/json-buffer') return require('../lib/json-buffer');
    if (path === 'child_process') {
      throw new Error('child_process shouldn\'t be needed when execSync is available');
    }
    return require(path);
  }));
} else {
  console.log('# SKIP Test native operation');
}

console.log('# Test fallback operation');
testSpawn(getSpawn(function (path) {
  if (path === './lib/has-native.js') return false;
  if (path === './lib/json-buffer') return require('../lib/json-buffer');
  if (path === 'execSync') {
    throw new Error('execSync isn\'t always available');
  }
  return require(path);
}));

console.log('All tests passed');

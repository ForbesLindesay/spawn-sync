'use strict';

var assert = require('assert');
var vm = require('vm');
var fs = require('fs');
var path = require('path');

var spawnFile = require.resolve('../');
var spawnSource = fs.readFileSync(spawnFile, 'utf8');

function testSpawn(spawn) {
  var result = spawn("node", [__dirname + '/test-spawn.js'], {input: 'my-output'});
  if (result.exitCode !== 0) {
    console.error(result.stderr.toString());
    process.exit(result.exitCode);
  }
  assert(result.exitCode === 0);
  assert(Buffer.isBuffer(result.stdout));
  assert(Buffer.isBuffer(result.stderr));
  assert(result.stdout.toString() === 'output written');
  assert(result.stderr.toString() === 'error log exists');
  assert(fs.readFileSync(__dirname + '/output.txt', 'utf8') === 'my-output');
  fs.unlinkSync(__dirname + '/output.txt');
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
    console: console
  };
  vm.runInNewContext(spawnSource, context, spawnFile);
  return context.module.exports
}

console.log('# Test native operation');
testSpawn(getSpawn(function (path) {
  if (path === 'child_process') {
    require('execSync');
    throw new Error('child_process shouldn\'t be needed when ffi is available');
  }
  return require(path);
}));

console.log('# Test fallback operation');
testSpawn(getSpawn(function (path) {
  if (path === 'execSync') {
    throw new Error('execSync isn\'t always available');
  }
  return require(path);
}));

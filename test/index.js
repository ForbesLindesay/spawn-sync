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

  // This suprisingly fails for the official API
  /*
  var start = Date.now();
  var result = spawn("node", [__dirname + '/test-spawn-timeout.js'], {timeout: 100});
  console.dir(result);
  var end = Date.now();
  assert((end - start) < 200);
  */

  console.log('test pass');
}

if (require('child_process').spawnSync) {
  console.log('# Test built in node API');
  testSpawn(require('child_process').spawnSync);
} else {
  console.log('# SKIP Test built in node API');
}
console.log('# Test fallback operation');
testSpawn(require('../'));

console.log('All tests passed');

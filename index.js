'use strict';

var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf').sync;
// Try to load FFI which lets us synchronously invoke a command
// Fallback to invoking the command using child_process and busy
// waiting for an output file
try {
  var FFI = require('ffi');
  var libc = new FFI.Library(null, {'system': ['int32', ['string']]});
} catch (ex) {
  var cp = require('child_process');
  console.warn('native module could not be found so busy waiting will be used for spawn-sync');
}

// node.js script to read input into the command pipeline
var read = path.normalize(__dirname + '/read.js');
// location to store input for stdin
var input = path.normalize(__dirname + '/temp/input');
// locaiton to store output for stdout
var stdout = path.normalize(__dirname + '/temp/stdout');
// location to store output for stderr
var stderr = path.normalize(__dirname + '/temp/stderr');
// location to keep flag for busy waiting fallback
var finished = path.normalize(__dirname + '/temp/finished');

rimraf(__dirname + '/temp');
fs.mkdirSync(__dirname + '/temp');

function invoke(cmd) {
  if (FFI) {
    // I don't know why 256 is the magic number
    return libc.system(cmd) / 256;
  } else {
    if (fs.existsSync(finished)) {
      fs.unlinkSync(finished);
    }
    cmd = cmd + '&& echo done! > ' + finished;
    cp.exec(cmd);
    while (!fs.existsSync(finished)) {
      // busy wait
    }
    fs.unlinkSync(finished);

    // there is no way to extract the actual exit code so assume success
    return 0;
  }
}

module.exports = spawn;
function spawn(cmd, args, options) {
  options = options || {};
  var stdout = path.normalize(__dirname + '/temp/stdout');
  var stderr = path.normalize(__dirname + '/temp/stderr');
  if (args && args.length) {
    cmd += ' ' + args.join(' ')
  }
  cmd = cmd + ' > ' + stdout + ' 2> ' + stderr;
  if (options.input) {
    fs.writeFileSync(input, options.input, {encoding: options.encoding});
    cmd = 'node ' + read + ' | ' + cmd
  }
  var exitCode = invoke(cmd);
  var res = {
    exitCode: exitCode,
    stdout: fs.readFileSync(stdout),
    stderr: fs.readFileSync(stderr)
  };
  if (options.input) {
    fs.unlinkSync(input);
  }
  fs.unlinkSync(stdout);
  fs.unlinkSync(stderr);
  return res;
}
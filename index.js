'use strict';

var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf').sync;
var util = require('util');
var os = require('os');
// Try to load FFI which lets us synchronously invoke a command
// Fallback to invoking the command using child_process and busy
// waiting for an output file
var nativeExec, cp;
try {
  require.resolve('execSync/build/Release/shell.node');
  nativeExec = require('execSync').run;
} catch (ex) {
  cp = require('child_process');
  console.warn('native module could not be found so busy waiting will be used for spawn-sync');
}

function invoke(cmd) {
  var logFileDir = path.normalize(path.join(os.tmpdir(), String(process.pid)));
  // location to keep flag for busy waiting fallback
  var finished = path.join(logFileDir, "finished");
  if (nativeExec) {
    // I don't know why 256 is the magic number
    return nativeExec(cmd);
  }

  if (fs.existsSync(finished)) {
    fs.unlinkSync(finished);
  }
  cmd = cmd + '&& echo done! > ' + finished;
  cp.exec(cmd);
  while (!fs.existsSync(finished)) {
    // busy wait
  }
  try {
    fs.unlinkSync(finished);
  } catch (ex) { }

  // there is no way to extract the actual exit code so assume success
  return 0;
}

module.exports = spawn;
function spawn(cmd, args, options) {
  options = options || {};
  var logFileDir = path.normalize(path.join(os.tmpdir(), String(process.pid)));
  rimraf(logFileDir);
  fs.mkdirSync(logFileDir);
  var stdout = path.join(logFileDir, "stdout");
  var stderr = path.join(logFileDir, "stderr");
  if (fs.existsSync(stdout)) {
    fs.unlinkSync(stdout);
  }
  if (fs.existsSync(stderr)) {
    fs.unlinkSync(stderr);
  }

  // node.js script to read input into the command pipeline
  var read = path.normalize(__dirname + '/read.js');
  // location to store input for stdin
  var input = path.join(logFileDir, 'input');

  if (args && args.length) {
    cmd += ' ' + args.join(' ')
  }
  cmd = cmd + ' > ' + stdout + ' 2> ' + stderr;
  if (options.input) {
    fs.writeFileSync(input, options.input, {encoding: options.encoding});
    cmd = util.format('node %s %s | %s', read, input, cmd);
  }
  var exitCode = invoke(cmd);
  var res = {
    status: exitCode,
    stdout: fs.readFileSync(stdout),
    stderr: fs.readFileSync(stderr)
  };
  if (options.input) {
    fs.unlinkSync(input);
  }
  fs.unlinkSync(stdout);
  fs.unlinkSync(stderr);
  rimraf(logFileDir);
  return res;
}

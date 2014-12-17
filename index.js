'use strict';

var path = require('path');
var fs = require('fs');
var util = require('util');
var os = require('os');
var rimraf = require('rimraf').sync;
var JSON = require('./lib/json-buffer');
var hasNative = require('./lib/has-native.js');

// Try to load execSync which lets us synchronously invoke a command
// Fallback to invoking the command using child_process and busy
// waiting for an output file
var nativeExec, cp;
if (hasNative) {
  nativeExec = require('execSync').run;
} else {
  cp = require('child_process');
  console.warn('native module could not be found so busy waiting will be used for spawn-sync');
}


var logFileDir = path.normalize(path.join(os.tmpdir(), String(process.pid) + '-spawn-sync'));

function invoke(cmd) {
  // location to keep flag for busy waiting fallback
  var finished = path.join(logFileDir, "finished");

  if (nativeExec) {
    return nativeExec(cmd);
  }

  if (fs.existsSync(finished)) {
    fs.unlinkSync(finished);
  }
  if (process.platform === 'win32') {
    cmd = cmd + '& echo "finished" > ' + finished;
  } else {
    cmd = cmd + '; echo "finished" > ' + finished;
  }
  cp.exec(cmd);

  while (!fs.existsSync(finished)) {
    // busy wait
  }

  return 0;
}

function rimrafWithRetry(filename) {
  var removed = false, removeError, removeStart = Date.now();
  while (!removed && (Date.now() - removeStart) < 200) {
    try {
      rimraf(filename);
      removed = true;
    } catch (ex) {
      removeError = ex;
    }
  }
  if (!removed) throw removeError;
}

module.exports = spawn;
function spawn(cmd, commandArgs, options) {
  var args = [];
  for (var i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  rimrafWithRetry(logFileDir);
  fs.mkdirSync(logFileDir);

  // node.js script to run the command
  var read = path.normalize(__dirname + '/lib/worker.js');
  // location to store arguments
  var input = path.join(logFileDir, 'input.json');
  var output = path.join(logFileDir, 'output.json');
  
  fs.writeFileSync(input, JSON.stringify(args));
  invoke('node "' + read + '" "' + logFileDir + '"');
  var res = JSON.parse(fs.readFileSync(output, 'utf8'));
  try {
    rimrafWithRetry(logFileDir);
  } catch (ex) {
    // don't fail completely if a file just seems to be locked
    console.warn(ex.stack || ex.message || ex);
  }
  return res;
}

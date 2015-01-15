'use strict';

var path = require('path');
var fs = require('fs');
var util = require('util');
var os = require('os');
var cp = require('child_process');
var rimraf = require('rimraf').sync;
var sleep = require('try-thread-sleep');
var JSON = require('./lib/json-buffer');

var logFileDir = path.normalize(path.join(os.tmpdir(), String(process.pid) + '-spawn-sync'));

function invoke(cmd) {
  // location to keep flag for busy waiting fallback
  var finished = path.join(logFileDir, "finished");

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
    sleep(200);
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

'use strict';

// This program reads the input so you can pipe some input text to a command

var fs = require('fs');
var os = require('os');
var path = require('path');
var assert = require('assert').ok;

var inputFilePath = process.argv[2];
assert(inputFilePath && inputFilePath.length > 0);

fs.createReadStream(inputFilePath).pipe(process.stdout);

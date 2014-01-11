'use strict';

// This program reads the input to you can pipe some input text to a command

var fs = require('fs');

fs.createReadStream(__dirname + '/temp/input').pipe(process.stdout);
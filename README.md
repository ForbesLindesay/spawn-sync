# spawn-sync

Prollyfill for child_process.spawnSync

[![Build Status](https://travis-ci.org/ForbesLindesay/spawn-sync.png?branch=master)](https://travis-ci.org/ForbesLindesay/spawn-sync)
[![Dependency Status](https://gemnasium.com/ForbesLindesay/spawn-sync.png)](https://gemnasium.com/ForbesLindesay/spawn-sync)
[![NPM version](https://badge.fury.io/js/spawn-sync.png)](http://badge.fury.io/js/spawn-sync)

## Installation

    npm install spawn-sync


## Usage

```js
var spawnSync = require('child_process').spawnSync || require('spawn-sync');

var result = spawnSync('node',
                       ['filename.js'],
                       {input: 'write this to stdin'});

// Note, status code will always equal 0 if using busy waiting fallback
if (result.statusCode !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.statusCode);
} else {
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
}
```

## License

  MIT
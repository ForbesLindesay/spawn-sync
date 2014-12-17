'use strict';

try {
  require.resolve('execSync/build/Release/shell.node');
  module.exports = typeof require('execSync').run === 'function';
} catch (ex) {
  module.exports = false;
}
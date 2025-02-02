require('../src/force-color');
const { green } = require('chalk');
const { copyFileSync, existsSync, mkdirSync } = require('fs');

mkdirSync('config', { recursive: true });

if (!existsSync('config/config.json'))
  copyFileSync('resources/config.example.json', 'config/config.json');

console.log(green('Setup complete'));

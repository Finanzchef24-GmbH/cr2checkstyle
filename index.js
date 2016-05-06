#!/usr/bin/env node

'use strict';

const yargs = require('./src/yargs');

const argv = yargs.parse(process.argv);

require('./src/index.js')(process.stdin, process.stdout, {
    maintainability: argv.maintainability,
    cyclomatic: argv.cyclomatic,
    halsteadDifficulty: argv.halsteadDifficulty
});
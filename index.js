#!/usr/bin/env node

'use strict';

const yargs = require('./src/yargs');

const argv = yargs.parse(process.argv);

require('./src/cr2checkstyle')(process.stdin, process.stdout, {
    module: {
        maintainability: argv['module-maintainability'],
        cyclomatic: argv['module-cyclomatic-complexity'],
        halsteadDifficulty: argv['module-halstead-difficulty']
    },
    function: {
        cyclomatic: argv['function-cyclomatic-complexity'],
        halsteadDifficulty: argv['function-halstead-difficulty']
    }
});

'use strict';

const fs = require('fs');
const yargs = require('yargs');

const OPTIONS = {
    'exit-code': {
        type: 'boolean',
        describe: 'Terminate with non-zero exit code if an error was generated',
        default: false
    },
    'module-maintainability': {
        type: 'string',
        requiresArg: true,
        describe: 'Thresholds for the per-module maintainability index',
        default: null,
        defaultDescription: 'disabled'
    },
    'function-cyclomatic-complexity': {
        type: 'string',
        requiresArg: true,
        describe: 'Thresholds for the per-function cyclomatic complexity',
        default: null,
        defaultDescription: 'disabled'
    },
    'module-cyclomatic-complexity': {
        type: 'string',
        requiresArg: true,
        describe: 'Thresholds for the per-module cyclomatic complexity',
        default: null,
        defaultDescription: 'disabled'
    },
    'function-halstead-difficulty': {
        type: 'string',
        requiresArg: true,
        describe: 'Thresholds for the per-function Halstead difficulty',
        default: null,
        defaultDescription: 'disabled'
    },
    'module-halstead-difficulty': {
        type: 'string',
        requiresArg: true,
        describe: 'Thresholds for the per-module Halstead difficulty',
        default: null,
        defaultDescription: 'disabled'
    }
};

/**
 * @param {Object} argv
 * @param {string} name
 */
function parse(argv, name) {
    const value = argv[name];

    if (typeof value === 'string') {
        if (!/^(\d+),(\d+)$/.test(value)) {
            throw new Error(`Invalid value for option "${name}"`);
        }
        argv[name] = JSON.parse(`[${value}]`);
    } else if (value !== null) {
        throw new Error(`Invalid value for option "${name}"`);
    }
}

/* eslint-disable max-len */
module.exports = yargs
    .help('help').describe('help', 'Display basic usage information')
    .env('CR2CS')
    .wrap(yargs.terminalWidth())
    .detectLocale(false)
    .version()
    .options(OPTIONS)
    .pkgConf('cr2checkstyle', process.cwd())
    .config('config', path => JSON.parse(fs.readFileSync(path)))
    .group(['exit-code'], 'miscellaneous')
    .group(['module-maintainability', 'module-halstead-difficulty', 'module-cyclomatic-complexity'], 'Per-module metrics')
    .group(['function-halstead-difficulty', 'function-cyclomatic-complexity'], 'Per-function metrics')
    .check(function (argv, options) {
        parse(argv, 'module-maintainability');
        parse(argv, 'module-cyclomatic-complexity');
        parse(argv, 'function-cyclomatic-complexity');
        parse(argv, 'module-halstead-difficulty');
        parse(argv, 'function-halstead-difficulty');
        return true;
    })
    .strict();

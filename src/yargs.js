'use strict';

const yargs = require('yargs');

const OPTIONS = {
    'maintainability': {
        type: 'string',
        requiresArg: true,
        describe: 'Thresholds for the per-module maintainability index',
        default: null,
        defaultDescription: 'disabled'
    },
    'cyclomatic': {
        type: 'string',
        requiresArg: true,
        describe: 'Thresholds for the per-function cyclomatic complexity',
        default: null,
        defaultDescription: 'disabled'
    },
    'halsteadDifficulty': {
        type: 'string',
        requiresArg: true,
        describe: 'Thresholds for the per-function Halstead difficulty',
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

    if (typeof value === 'string' && !/^(\d+),(\d+)$/.test(value)) {
        throw new Error(`Invalid value for options "${name}"`);
    }

    argv[name] = value === null ? null : JSON.parse(`[${value}]`);
}

/* eslint-disable max-len */
module.exports = yargs
    .help('help').describe('help', 'Display basic usage information')
    .env('CR2CS')
    .detectLocale(false)
    .version()
    .options(OPTIONS)
    .pkgConf('cr2checkstyle', process.cwd())
    .config('config', path => JSON.parse(fs.readFileSync(path)))
    .check(function (argv, options) {
        parse(argv, 'cyclomatic');
        parse(argv, 'halsteadDifficulty');
        parse(argv, 'maintainability');
        return true;
    })
    .strict();
'use strict';

const os = require('os');

const JSONStream = require('JSONStream');
const es = require('event-stream');
const escape = require('xml-escape');

const EOL = os.EOL;

const LEVEL = {
    OK: 'ok',
    WARN: 'warning',
    ERROR: 'error'
};

/**
 * @param {number} value
 * @param {?Array.<number>} thresholds
 * @param {boolean} reversed
 * @return {string}
 */
function getLevelFor(value, thresholds, reversed) {
    if (!thresholds) {
        return LEVEL.OK;
    }

    if (reversed ? value <= thresholds[0] : value >= thresholds[1]) {
        return LEVEL.ERROR;
    } else if (reversed ? value <= thresholds[1] : value >= thresholds[0]) {
        return LEVEL.WARN;
    } else {
        return LEVEL.OK;
    }
}

/**
 * @param {Object} report
 * @param {Array.<number>} thresholds
 * @return {Array.<cr2cs.Message>}
 */
function getMessages(report, thresholds) {
    const messages = [];

    const level = getLevelFor(report.maintainability, thresholds.maintainability, true);
    if (level !== LEVEL.OK) {
        messages.push({
            line: 0,
            severity: level,
            message: `Maintainability of ${report.maintainability.toFixed(1)} is too low`
        });
    }

    report.functions.forEach(function (fnReport) {
        const levels = {
            cyclomatic: getLevelFor(fnReport.cyclomatic, thresholds.cyclomatic),
            halsteadDifficulty: getLevelFor(fnReport.halstead.difficulty, thresholds.halsteadDifficulty)
        };

        if (levels.cyclomatic !== LEVEL.OK) {
            messages.push({
                source: fnReport.name,
                line: fnReport.line,
                severity: levels.cyclomatic,
                message: `Cyclomatic complexity of ${fnReport.cyclomatic.toFixed(1)} is too high`
            });
        }
        if (levels.halsteadDifficulty !== LEVEL.OK) {
            messages.push({
                source: fnReport.name,
                line: fnReport.line,
                severity: levels.halsteadDifficulty,
                message: `Halstead difficulty of ${fnReport.halstead.difficulty.toFixed(1)} is too high`
            });
        }
    });

    return messages.length ? { file: report.path, messages } : undefined;
}

/**
 * @param {cr2cs.Message} message
 * @return {string}
 */
function makeErrorElement(message) {
    const attributes = Object.keys(message).reduce(function (items, name) {
        return items.concat(`${name}="${escape(message[name] + '')}"`);
    }, []);

    return `      <error ${attributes.join(' ')}/>`;
}

/**
 *
 * @param {stream.Readable} stdin
 * @param {stream.Writable} stdout
 * @param {Object.<string, Array.<number>>} thresholds
 */
module.exports = function (stdin, stdout, thresholds) {
    stdout.write(`<?xml version="1.0" encoding="UTF-8" ?>${EOL}`);
    stdout.write(`  <checkstyle>${EOL}`);
    stdin.on('end', () => stdout.write(`${EOL}  </checkstyle>${EOL}</xml>`));

    stdin
        .pipe(JSONStream.parse(['reports', true]))
        .pipe(es.mapSync(report => getMessages(report, thresholds)))
        .pipe(es.mapSync(function (result) {
            return [
                `    <file name="${escape(result.file)}">`,
                result.messages.map(makeErrorElement).join(EOL),
                `    </file>`
            ].join(EOL);
        }))
        .pipe(es.join(EOL))
        .pipe(stdout);    
};

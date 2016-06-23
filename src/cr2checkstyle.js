'use strict';

const os = require('os');

const JSONStream = require('JSONStream');
const es = require('event-stream');
const escape = require('xml-escape');

const EOL = os.EOL;

/** @enum {string} */
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
 * @param {Object.<string, Array.<number>>} moduleThresholds
 * @return {Array.<cr2cs.Message>}
 */
function getMessagesForModule(report, moduleThresholds) {
    const messages = [];

    const levels = {
        maintainability: getLevelFor(report.maintainability, moduleThresholds.maintainability, true),
        cyclomatic: getLevelFor(report.aggregate.cyclomatic, moduleThresholds.cyclomatic),
        halsteadDifficulty: getLevelFor(report.aggregate.halstead.difficulty, moduleThresholds.halsteadDifficulty)
    };

    if (levels.maintainability !== LEVEL.OK) {
        const value = report.maintainability.toFixed(1);
        const qualifier = levels.maintainability === LEVEL.ERROR ? 'too low' : 'low';

        messages.push({
            line: 0,
            severity: levels.maintainability,
            message: `Maintainability of ${value} is ${qualifier} for a module`
        });
    }
    if (levels.cyclomatic !== LEVEL.OK) {
        const value = report.aggregate.cyclomatic.toFixed(1);
        const qualifier = levels.cyclomatic === LEVEL.ERROR ? 'too high' : 'high';

        messages.push({
            line: 0,
            severity: levels.cyclomatic,
            message: `Cyclomatic complexity of ${value} is ${qualifier} for a module`
        });
    }
    if (levels.halsteadDifficulty !== LEVEL.OK) {
        const value = report.aggregate.halstead.difficulty.toFixed(1);
        const qualifier = levels.halsteadDifficulty === LEVEL.ERROR ? 'too high' : 'high';

        messages.push({
            line: 0,
            severity: levels.halsteadDifficulty,
            message: `Halstead difficulty of ${value} is ${qualifier} for a module`
        });
    }

    return messages;
}

/**
 * @param {Object} fnReport
 * @param {Object.<string, Array.<number>>} functionThresholds
 * @return {Array.<cr2cs.Message>}
 */
function getMessagesForFunction(fnReport, functionThresholds) {
    const messages = [];

    const levels = {
        cyclomatic: getLevelFor(fnReport.cyclomatic, functionThresholds.cyclomatic),
        halsteadDifficulty: getLevelFor(fnReport.halstead.difficulty, functionThresholds.halsteadDifficulty)
    };

    if (levels.cyclomatic !== LEVEL.OK) {
        const value = fnReport.cyclomatic.toFixed(1);
        const qualifier = levels.cyclomatic === LEVEL.ERROR ? 'too high' : 'high';

        messages.push({
            line: fnReport.line,
            severity: levels.cyclomatic,
            message: `Cyclomatic complexity of ${value} is ${qualifier} for a function`
        });
    }
    if (levels.halsteadDifficulty !== LEVEL.OK) {
        const value = fnReport.halstead.difficulty.toFixed(1);
        const qualifier = levels.halsteadDifficulty === LEVEL.ERROR ? 'too high' : 'high';

        messages.push({
            line: fnReport.line,
            severity: levels.halsteadDifficulty,
            message: `Halstead difficulty of ${value} is ${qualifier} for a function`
        });
    }

    return messages;
}

/**
 * @param {Object} report
 * @param {cr2cs.Thresholds} thresholds
 * @return {Array.<cr2cs.Message>}
 */
function getMessages(report, thresholds) {
    const messages = getMessagesForModule(report, thresholds.module || {});

    report.functions.forEach(function (fnReport) {
        const fnMessages = getMessagesForFunction(fnReport, thresholds.function || {});

        Array.prototype.push.apply(messages, fnMessages);
    });

    // Returning undefined makes es.map() drop the object, which is exactly what we want if there are no messages.
    return messages.length ? {
        file: report.path,
        messages
    } : undefined;
}

/**
 * @param {cr2cs.Message} message
 * @return {string}
 */
function makeErrorElement(message) {
    const attributes = Object.keys(message).reduce(function (items, name) {
        return items.concat(`${name}="${escape(String(message[name]))}"`);
    }, []);

    return `    <error ${attributes.join(' ')}/>`;
}

/**
 * @param {stream.Readable} stdin
 * @param {stream.Writable} stdout
 * @param {cr2cs.Thresholds} thresholds
 */
module.exports = function (stdin, stdout, thresholds) {
    stdout.write(`<?xml version="1.0" encoding="UTF-8" ?>${EOL}`);
    stdout.write(`<checkstyle>${EOL}`);
    stdin.on('end', () => stdout.write(`${EOL}</checkstyle>`));

    stdin
        .pipe(JSONStream.parse(['reports', true]))
        .pipe(es.mapSync(report => getMessages(report, thresholds)))
        .pipe(es.mapSync(function (result) {
            return [
                `  <file name="${escape(result.file)}">`,
                result.messages.map(makeErrorElement).join(EOL),
                '  </file>'
            ].join(EOL);
        }))
        .pipe(es.join(EOL))
        .pipe(stdout);
};

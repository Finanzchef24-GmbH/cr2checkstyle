'use strict';

const fs = require('fs');
const path = require('path');

const expect = require('chai').expect;
const streamBuffers = require('stream-buffers');
const Promise = require('bluebird');

const cr2cs = require('../../src/cr2checkstyle');

describe('integration', function () {
    it('cr2checkstyle', function () {
        const output = fs.readFileSync(path.join(__dirname, 'output.xml'));
        const stdin = fs.createReadStream(path.join(__dirname, 'report.json'));
        const stdout = new streamBuffers.WritableStreamBuffer();

        cr2cs(stdin, stdout, {
            module: {
                maintainability: [80, 100],
                halsteadDifficulty: [2, 4],
                cyclomatic: [2, 4]
            },
            function: {
                halsteadDifficulty: [5, 10],
                cyclomatic: [4, 8]
            }
        });

        const promise = new Promise(function (resolve, reject) {
            stdout.on('error', reject);
            stdout.on('finish', () => resolve(stdout.getContentsAsString()));
        });

        return promise.then(contents => expect(contents).to.equal(output.toString()));
    });
});


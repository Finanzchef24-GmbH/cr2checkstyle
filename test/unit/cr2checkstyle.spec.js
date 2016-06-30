'use strict';

const expect = require('chai').expect;
const libxmljs = require('libxmljs');
const streamBuffers = require('stream-buffers');
const Promise = require('bluebird');

const cr2cs = require('../../src/cr2checkstyle');

const output = {
    reports: [
        {
            maintainability: 115.65861559222697,
            path: '/home/user/project/some-file.js',
            aggregate: {
                cyclomatic: 10,
                halstead: { difficulty: 22.057142857142857 },
                line: 1
            },
            functions: [
                {
                    name: 'foo',
                    cyclomatic: 6,
                    halstead: { difficulty: 14.555555555555555 },
                    line: 24
                },
                {
                    name: 'doStuff',
                    cyclomatic: 3,
                    halstead: { difficulty: 10 },
                    line: 43
                },
                {
                    name: '<anonymous>',
                    cyclomatic: 3,
                    halstead: { difficulty: 11.11111111111111 },
                    line: 55
                }
            ]
        }
    ]
};

describe('unit', function () {
    describe('cr2checkstyle', function () {
        function run(moduleThresholds, fnThresholds, options) {
            const stdin = new streamBuffers.ReadableStreamBuffer();
            const stdout = new streamBuffers.WritableStreamBuffer();
            let errorCount;

            cr2cs(
                stdin,
                stdout,
                {
                    module: moduleThresholds || {},
                    function: fnThresholds || {}
                },
                count => (errorCount = count)
            );

            stdin.put(JSON.stringify(output));
            stdin.stop();

            return new Promise(function (resolve, reject) {
                stdout.on('error', reject);
                stdout.on('finish', () => resolve(stdout.getContentsAsString()));
            }).then(contents => [libxmljs.parseXmlString(contents), errorCount]);
        }

        it('without thresholds', function () {
            return run({})
                .spread(function (xml, errorCount) {
                    expect(errorCount).to.equal(0);
                    expect(xml.find('/checkstyle/file')).to.have.length(0);
                });
        });

        describe('with maintainability threshold', function () {
            it('which is met', function () {
                return run({ maintainability: [80, 110] })
                    .spread(function (xml, errorCount) {
                        expect(errorCount).to.equal(0);
                        expect(xml.find('/checkstyle/file')).to.have.length(0);
                        expect(xml.find('/checkstyle/file/error')).to.have.length(0);
                    });
            });

            it('which is not met and produces a warning', function () {
                return run({ maintainability: [80, 120] })
                    .spread(function (xml, errorCount) {
                        const files = xml.find('/checkstyle/file');
                        const errorsAndWarnings = xml.find('/checkstyle/file/error');

                        expect(errorCount).to.equal(0);
                        expect(errorsAndWarnings).to.have.length(1);
                        expect(files).to.have.length(1);

                        expect(files[0].attr('name').value()).to.equal('/home/user/project/some-file.js');
                        expect(errorsAndWarnings[0].attr('severity').value()).to.equal('warning');
                        expect(errorsAndWarnings[0].attr('line').value()).to.equal('0');
                        expect(errorsAndWarnings[0].attr('message').value())
                            .to.equal('Maintainability of 115.7 is low for a module');
                    });
            });

            it('which is not met and produces an error', function () {
                return run({ maintainability: [120, 150] })
                    .spread(function (xml, errorCount) {
                        const errorsAndWarnings = xml.find('/checkstyle/file/error');

                        expect(errorCount).to.equal(1);
                        expect(errorsAndWarnings).to.have.length(1);

                        expect(errorsAndWarnings[0].attr('severity').value()).to.equal('error');
                        expect(errorsAndWarnings[0].attr('line').value()).to.equal('0');
                        expect(errorsAndWarnings[0].attr('message').value())
                            .to.equal('Maintainability of 115.7 is too low for a module');
                    });
            });
        });

        describe('with halstead difficulty threshold', function () {
            it('which is met', function () {
                return run(null, { halsteadDifficulty: [15, 20] })
                    .spread(function (xml) {
                        expect(xml.find('/checkstyle/file')).to.have.length(0);
                        expect(xml.find('/checkstyle/file/error')).to.have.length(0);
                    });
            });

            it('which is partially not met', function () {
                return run(null, { halsteadDifficulty: [11, 14] })
                    .spread(function (xml, errorCount) {
                        const errorsAndWarnings = xml.find('/checkstyle/file/error');
                        const expected = [
                            {
                                severity: 'error',
                                line: '24',
                                message: 'Halstead difficulty of 14.6 is too high for a function'
                            },
                            {
                                severity: 'warning',
                                line: '55',
                                message: 'Halstead difficulty of 11.1 is high for a function'
                            }
                        ];

                        expect(errorCount).to.equal(1);
                        expect(errorsAndWarnings).to.have.length(2);

                        errorsAndWarnings.forEach(function (error, index) {
                            expect(error.attr('line').value()).to.equal(expected[index].line);
                            expect(error.attr('severity').value()).to.equal(expected[index].severity);
                            expect(error.attr('message').value()).to.equal(expected[index].message);
                        });
                    });
            });
        });
    });
});

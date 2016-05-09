# cr2checkstyle
[![npm](https://img.shields.io/npm/v/cr2checkstyle.svg?style=flat-square)](https://www.npmjs.com/package/cr2checkstyle)
![Codeship](https://img.shields.io/codeship/227f5300-f7f2-0133-0bf6-2eb9f408a9c3.svg?style=flat-square)
[![Dependency Status](https://img.shields.io/david/Finanzchef24-GmbH/cr2checkstyle.svg?style=flat-square)](https://david-dm.org/Finanzchef24-GmbH/cr2checkstyle)
[![devDependency Status](https://img.shields.io/david/dev/Finanzchef24-GmbH/cr2checkstyle.svg?style=flat-square)](https://david-dm.org/Finanzchef24-GmbH/cr2checkstyle)
![node](https://img.shields.io/node/v/cr2checkstyle.svg?style=flat-square)
[![License](https://img.shields.io/npm/l/cr2checkstyle.svg?style=flat-square)](https://github.com/Finanzchef24-GmbH/cr2checkstyle/blob/master/LICENSE)

> Convert complexity-report data to Checkstyle XML

This purpose of this command line tool is to convert the JSON output of [complexity-report](https://github.com/jared-stilwell/complexity-report) to Checkstyle-compatible XML.

## Usage
cr2checkstyle reads from `stdin` and writes to `stdout`:

```bash
$ cr --format json --output report.json .
$ cr2checkstyle < report.json > report.xml
```

Or simply use piping:
```bash
$ cr --format json . | cr2checkstyle > report.xml
```

## Configuration
By default, cr2checkstyle has no thresholds set so it will not generate any warnings or errors. Currently supported metrics are [cyclomatic complexity](https://en.wikipedia.org/wiki/Cyclomatic_complexity), [halstead difficulty](https://en.wikipedia.org/wiki/Halstead_complexity_measures) (both per-function) and the maintainability index (per module).

Thresholds are given as a low and high watermark. Values above the high watermark will cause errors, values between the low and high watermark will cause warnings (likewise for higher-is-better metrics such as the maintainability index):

```bash
# Check module-level maintainability index:
# 0-80 is an error, 80 to 90 is a warning, above 90 is ok
$ cr2checkstyle --module-maintainability 80,90

# Check function-level cyclomatic complexity:
# 0-2 is ok, 2-4 is a warning, above 4 is an error
$ cr2checkstyle --function-cyclomatic-complexity 2,4
```

Internally, parameters are parsed with [yargs](http://yargs.js.org/docs/#methods-envprefix) so you can also use environment variables (e.g., `CR2CS_HALSTEAD_DIFFICULTY=3,5`) and the `cr2checkstyle`-property in your `package.json`.
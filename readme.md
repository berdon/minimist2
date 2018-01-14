# Minimist2
[![Build Status](https://travis-ci.org/berdon/minimist2.svg?branch=master)](https://travis-ci.org/berdon/minimist2) [![NPM Status](https://img.shields.io/npm/v/minimist2.svg)](https://www.npmjs.com/package/minimist2)

Minimist2 is a rewrite of the popular [Minimist](https://github.com/substack/minimist) Javascript library for argument parsing. The library aims to be a drop-in replacement with matching API footprint. It passes all original Minimist unit tests.

Minimist2 is written in TypeScript targetting ES6.

# Installing
```bash
npm install minimist2
```

# Development
1. Checkout the code
    ```bash
    git clone git@github.com:berdon/minimist2.git
    npm install
    ```
2. Develop
3. Run tests
    ```bash
    npm test
    ```
4. Submit a pull request

# Using
```javascript
var argv = require('minimist')(process.argv.slice(2));
console.dir(argv);
```

```bash
$ node example/parse.js -a beep -b boop
{ _: [], a: 'beep', b: 'boop' }
```

```bash
$ node example/parse.js -x 3 -y 4 -n5 -abc --beep=boop foo bar baz
{ _: [ 'foo', 'bar', 'baz' ],
  x: 3,
  y: 4,
  n: 5,
  a: true,
  b: true,
  c: true,
  beep: 'boop' }
```
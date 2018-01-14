import { ParseOptions } from './index';
const index = require('./index');
import { expect } from 'chai';
import 'mocha';

describe('Positional Arguments', () => {
    let options = [{
        description: "default options",
        options: new ParseOptions()
    }, {
        description: "-- option set",
        options: { '--': true } as ParseOptions
    }];

    for (let o of options) {
        it(`no arguments come in empty (${o.description})`, () => {
            const args = index([], o.options);
            expect(args._).to.be.empty;
        });

        it(`single argument is only argument (${o.description})`, () => {
            const args = index(['abc'], o.options);
            expect(args._).has.contains('abc').and.lengthOf(1);
        });

        it(`multiple arguments match expected order (${o.description})`, () => {
            const args = index(['abc', 'efg', 'hij'], o.options);
            expect(args._).contains.ordered.members(['abc', 'efg', 'hij'])
        });

        it(`post -- arguments match expected order (${o.description})`, () => {
            const args = index(['abc', 'efg', 'hij', '--', 'klm', 'nop', 'qrs'], o.options);

            if (!o.options['--']) {
                expect(args._).contains.ordered.members(['abc', 'efg', 'hij', 'klm', 'nop', 'qrs'])
            } else {
                expect(args._).contains.ordered.members(['abc', 'efg', 'hij'])
                expect(args['--']).contains.ordered.members(['klm', 'nop', 'qrs'])
            }
        });

        it(`arguments after flags match expected order (${o.description})`, () => {
            const args = index(['abc', '-d', '-e', 'true', 'efg', 'hij', '--', 'klm', 'nop', 'qrs'], o.options);
            if (!o.options['--']) {
                expect(args._).contains.ordered.members(['abc', 'efg', 'hij', 'klm', 'nop', 'qrs'])
            } else {
                expect(args._).contains.ordered.members(['abc', 'efg', 'hij'])
                expect(args['--']).contains.ordered.members(['klm', 'nop', 'qrs'])
            }
        });
    }
});

describe('Flags', () => {
    it(`expect empty with no flags`, () => {
        const args = index([], { version: 1 } as ParseOptions);
        expect(args).lengthOf(0);
    });

    it(`single flag with no value parses as true`, () => {
        const args = index(['--one'], { version: 1 } as ParseOptions);
        expect(args).has.lengthOf(1);
        expect(args).has.property('one').which.equals(true);
    });

    it(`single flag with values match values`, () => {
        var options = new ParseOptions();
        options.version = 1;
        const args = index(['--one=one', '--two=two', '--three=true', '--four=four'], options);
        expect(args).has.lengthOf(4);
        expect(args).has.property('one').which.equals("one").and.is.a("string");
        expect(args).has.property('two').which.equals("two").and.is.a("string");
        expect(args).has.property('three').which.equals("true").and.is.a("string");
        expect(args).has.property('four').which.equals("four").and.is.a("string");
    });

    it(`many flags with no value parses as true`, () => {
        var options = new ParseOptions();
        options.version = 1;
        const args = index(['--one', '--two', '--three', '--four'], options);
        expect(args).has.lengthOf(4);
        expect(args).has.property('one').which.is.true.and.is.a("boolean");
        expect(args).has.property('two').which.is.true.and.is.a("boolean");
        expect(args).has.property('three').which.is.true.and.is.a("boolean");
        expect(args).has.property('four').which.is.true.and.is.a("boolean");
    });

    it(`default option with no argument present as expected`, () => {
        let options = new ParseOptions();
        options.version = 1;
        options.default = { one: 'one', two: 'two', three: 3, false: false };
        const args = index([], options);
        expect(args).has.lengthOf(4);
        expect(args).has.property('one').which.equals('one').and.is.a("string");
        expect(args).has.property('two').which.equals('two').and.is.a("string");
        expect(args).has.property('three').which.equals(3).and.is.a("number");
        expect(args).has.property('false').which.is.false.and.is.a("boolean");
    });

    it(`default option with some argument present as expected`, () => {
        let options = new ParseOptions();
        options.version = 1;
        options.default = { one: 'one', two: 'two', three: 3, false: false };
        const args = index(['--one=1', '--two=2', '--three=three'], options);
        expect(args).has.lengthOf(4);
        expect(args).has.property('one').which.equals(1).and.is.a("number");
        expect(args).has.property('two').which.equals(2).and.is.a("number");
        expect(args).has.property('three').which.equals('three').and.is.a("string");
        expect(args).has.property('false').which.is.false.and.is.a("boolean");
    });
});

describe('ParseOption.boolean', () => {
    it(`true causes double-hyphen with = arguments to match as boolean`, () => {
        var options = new ParseOptions();
        options.version = 1;
        options.boolean = true;
        const args = index([
            '--one=true',
            '--two=false',
            '--three=asdf'],
            options);
        expect(args['one']).to.be.true.and.to.be.a("boolean");
        expect(args['two']).to.be.false.and.to.be.a("boolean");
        expect(args['three']).to.equal('asdf').and.to.be.a("string");
    });

    it(`true causes double-hyphen without = arguments to match as strings`, () => {
        var options = new ParseOptions();
        options.version = 1;
        options.boolean = true;
        const args = index([
            '--four', 'true',
            '--five', 'false',
            '--six', 'asdf'],
            options);
        expect(args['four']).is.true.and.to.be.a("boolean");
        expect(args['five']).is.false.and.to.be.a("boolean");
        expect(args['six']).is.true.and.to.be.a("boolean");
    });

    it(`string value presents as expected with true`, () => {
        let options = new ParseOptions();
        options.boolean = 'one';
        const args = index(['--one', 'true'], options);
        expect(args['one']).to.be.true.and.to.be.a("boolean");
    });

    it(`string value presents as expected with false`, () => {
        let options = new ParseOptions();
        options.version = 1;
        options.boolean = 'one';
        const args = index(['--one', 'false'], options);
        expect(args['one']).to.be.false.and.to.be.a("boolean");
    });

    it(`string value presents as expected with non-boolean string`, () => {
        let options = new ParseOptions();
        options.version = 1;
        options.boolean = 'one';
        const args = index(['--one', 'something'], options);
        expect(args['one']).to.be.true.and.to.be.a("boolean");
    });

    it(`array of values presents as expected`, () => {
        let options = new ParseOptions();
        options.version = 1;
        options.boolean = ['one', 'two', 'three'];
        const args = index(
            ['--one', 'true', '--two=false', '--three', 'asdasdf'],
            options);
        expect(args['one']).to.be.true.and.to.be.a("boolean");
        expect(args['two']).to.be.false.and.to.be.a("boolean");
        expect(args['three']).to.be.true.and.to.be.a("boolean");
    });

    it(`string value without argument with default presents as expected with true value`, () => {
        let options = new ParseOptions();
        options.version = 1;
        options.boolean = 'one';
        options.default = {
            one: true
        };
        const args = index([], options);
        expect(args['one']).to.be.true.and.to.be.a("boolean");
    });

    it(`string value without argument with default presents as expected with false value`, () => {
        let options = new ParseOptions();
        options.version = 1;
        options.boolean = 'one';
        options.default = {
            one: false
        };
        const args = index([], options);
        expect(args['one']).to.be.false.and.to.be.a("boolean");
    });
});

describe('ParseOption.string', () => {
    it(`string value presents as expected with no-value`, () => {
        let options = new ParseOptions();
        options.version = 1;
        options.string = 'one';
        const args = index(['--one'], options);
        expect(args['one']).to.equal('').and.to.be.a("string");
    });

    it(`string value presents as expected with no-value with default of true`, () => {
        let options = new ParseOptions();
        options.version = 1;
        options.string = 'one';
        options.default = {
            one: true
        };
        const args = index([], options);
        expect(args['one']).to.equal('true').and.to.be.a("string");
    });

    it(`string value presents as expected with no-value with default of false`, () => {
        let options = new ParseOptions();
        options.version = 1;
        options.string = 'one';
        options.default = {
            one: false
        };
        const args = index([], options);
        expect(args['one']).to.equal('false').and.to.be.a("string");
    });

    it(`array of values presents as expected`, () => {
        let options = new ParseOptions();
        options.version = 1;
        options.string = ['one', 'two', 'three'];
        const args = index(['--one', '1', '--two=false', '--three', 'three'], options);
        expect(args['one']).to.equal('1').and.to.be.a("string");
        expect(args['two']).to.equal('false').and.to.be.a("string");
        expect(args['three']).to.equal('three').and.to.be.a("string");
    });

    it(`array of values with defaults and no arguments presents as expected`, () => {
        let options = new ParseOptions();
        options.version = 1;
        options.string = ['one', 'two', 'three'];
        options.default = {
            one: 1,
            two: 'two',
            three: false
        };
        const args = index([], options);
        expect(args['one']).to.equal('1').and.to.be.a("string");
        expect(args['two']).to.equal('two').and.to.be.a("string");
        expect(args['three']).to.equal('false').and.to.be.a("string");
    });
});

describe('ParseOption.alias', () => {
    it(`alias with string sets values correctly with single-hyphen flags`, () => {
        let options = new ParseOptions();
        options.version = 1;
        options.alias = {
            a: 'apple',
            b: 'bottom',
            j: 'jeans',
            d: 'dog',
            e: 'elephant',
            f: 'fox'
        };
        const args = index(['-a', '-bj', '-d=food', '-ef=say'], options);
        expect(args).has.property('a').and.is.true.and.is.a("boolean");
        expect(args).has.property('apple').and.is.true.and.is.a("boolean");
        expect(args).has.property('b').and.is.true.and.is.a("boolean");
        expect(args).has.property('bottom').and.is.true.and.is.a("boolean");
        expect(args).has.property('j').and.is.true.and.is.a("boolean");
        expect(args).has.property('jeans').and.is.true.and.is.a("boolean");
        expect(args).has.property('d').and.equals('food').and.is.a("string");
        expect(args).has.property('dog').and.equals('food').and.is.a("string");
        expect(args).has.property('e').and.is.true.and.is.a("boolean");
        expect(args).has.property('elephant').and.is.true.and.is.a("boolean");
        expect(args).has.property('f').and.equals('say').and.is.a("string");
        expect(args).has.property('fox').and.equals('say').and.is.a("string");
    });

    it(`alias with string array sets values correctly with single-hyphen flags`, () => {
        let options = new ParseOptions();
        options.version = 1;
        options.alias = {
            'what-does-the-fox-say': ['w']
        };
        const args = index(['--what-does-the-fox-say', 'ninini'], options);
        expect(args).has.property('what-does-the-fox-say').and.equals('ninini').and.is.a("string");
        expect(args).has.property('w').and.equals('ninini').and.is.a("string");
    });

    it(`alias with string array with default but no arguments sets values correctly`, () => {
        let options = new ParseOptions();
        options.version = 1;
        options.alias = {
            'what-does-the-fox-say': ['w']
        };
        options.default = {
            'what-does-the-fox-say': 'ninini'
        };
        const args = index([], options);
        expect(args).has.property('what-does-the-fox-say').and.equals('ninini').and.is.a("string");
        expect(args).has.property('w').and.equals('ninini').and.is.a("string");
    });
});

describe('ParseOption.stopEarly', () => {
    it(`true cause post positional arguments parsed as positional`, () => {
        let options = new ParseOptions();
        options.version = 1;
        options.stopEarly = true;
        const args = index(['-abc', 'two', '-def', '--four'], options);
        expect(args).to.have.lengthOf(7);
        expect(args._).to.have.lengthOf(0);
    });
});

describe('ParseOption.unknown', () => {
    it(`return false unknown hides unknown values`, () => {
        let options = new ParseOptions();
        options.version = 1;
        options.unknown = (k) => false;
        options.string = ['one', 'three'];
        options.boolean = ['four'];
        const args = index(['--one', 'one', '--two=two', '--three', '--four=false'], options);
        expect(args).has.property('one').and.equals('one').and.is.a('string');
        expect(args).does.not.has.property('two');
        expect(args).has.property('three').and.equals('').and.is.a('string');
        expect(args).has.property('four').and.is.false.and.is.a('boolean');
    });
});
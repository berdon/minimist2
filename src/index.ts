import { isString } from "util";

type ValueType = string | boolean | number | null;

class Arguments {
    public _: ValueType[] = []
    public __: ValueType[] = []
    public argv: Map<string, ValueType[]> = new Map()
    private _options: ParseOptions;

    public constructor(options: ParseOptions) {
        this._options = options;
        var aliasOptions = options.alias;
        for (let key in aliasOptions) {
            for (let alias of aliasOptions[key]) {
                this._options.alias[alias] = Array.from(new Set<string>([].concat([key] as never[], aliasOptions[key] as never[])).values());
            }
        }
    }

    public setFlag(key: string, value: ValueType, original: string|null = null, doubleFlag: boolean = false) {
        if (this._options.unknown && !this._options.defined(key, value, doubleFlag) && !this._options.unknown(original)) return;
        value = this._options.parse(key, value, doubleFlag);
        if (!this.argv.has(key)) this.argv.set(key, []);
        (this.argv.get(key) as ValueType[]).push(value);
        if (key in this._options.alias) {
            for (let a of this._options.alias[key] as string[]) {
                if (this.argv.has(key)) this.argv.set(a, []);
                (this.argv.get(a) as ValueType[]).push(value);
            }
        }
    }

    public addPositional(value: ValueType, secondary : boolean) {
        if (!secondary && this._options.unknown && !this._options.unknown(value)) return;
        (!secondary ? this._ : this.__).push(value);
    }

    public export(): { [s: string]: ValueType | ValueType[] } {
        var args: { [s: string]: ValueType | ValueType[] } = {
            "_": this._
        };

        if (this.__ && this.__.length > 0) {
            args['--'] = this.__;
        }

        for (let key in this._options.default || []) {
            if (!this.argv.has(key)) {
                this.setFlag(key, this._options.default[key]);
            }
        }
        for (let key of this._options.boolean as string[] || []) {
            if (!this.argv.has(key)) {
                this.setFlag(key, this._options.default && key in this._options.default ? this._options.default[key] : false);
            }
        }

        if (this._options.version > 0) {
            args.length = this.argv.size;
        }

        this.argv.forEach((v, k) => setDepth(args, k, v.length == 1 ? v[0] : v));

        return args;
    }
}

function setDepth(obj : any, path : string, value : any) {
    var tags = path.split("."), len = tags.length - 1;
    for (var i = 0; i < len; i++) {
        if (!(tags[i] in obj)) obj[tags[i]] = {};
        obj = obj[tags[i]];
    }
    obj[tags[len]] = value;
}

export class ParseOptions {
    public '--': boolean = false;
    public default: { [s: string]: ValueType; } = {}
    public string: string | string[] = []
    public boolean: boolean | string | string[] = []
    public alias: { [s: string]: string | string[] } = {}
    public stopEarly: boolean = false;
    public secondPosition: boolean = false;
    public unknown: ((arg: ValueType) => boolean) | null = null;
    public version: (0 | 1) = 0;
    private doubleFlagToBoolean = false;
    private defaultTypes : Map<string, ValueType> = new Map();
    private matchesType : Map<string, ((k: string, v: ValueType) => boolean)> = new Map();
    private types: Map<string, (o: ValueType) => ValueType> = new Map()

    public constructor(options: ParseOptions | null = null) {
        if (options == null) return;
        this.default = options.default || [];
        this.string = [].concat(options.string as any || []);
        [].concat(options.string as any || []).forEach(s => {
            this.types.set(s, o => String(o));
            this.matchesType.set(s, (k, v) => true);
            this.defaultTypes.set(s, '');
        });
        if (typeof (options.boolean) === 'boolean' && options.boolean == true) {
            this.doubleFlagToBoolean = true;
        } else {
            this.boolean = [].concat(options.boolean as any || []);
            [].concat(options.boolean as any || []).forEach(s => {
                this.types.set(String(s), o => o == true || o == 'true');
                this.matchesType.set(s, (k, v) => v == 'true' || v == 'false');
                this.defaultTypes.set(s, true);
            });
        }
        this.alias = options.alias || this.alias;
        for (var a in this.alias) {
            this.alias[a] = [].concat(this.alias[a] as any)
        }
        this.stopEarly = options.stopEarly;
        this.secondPosition = options['--'] || this['--'];
        this.unknown = options.unknown || this.unknown;
        this.version = options.version || this.version;
    }

    public parse(key: string|null, value: ValueType, doubleFlag: boolean = false): ValueType {
        if (value == null) return null;
        if (key != null && this.types.has(key)) return (this.types.get(key) as (o: ValueType) => ValueType)(value);
        if (key != null && key in this.alias) {
            var alias = (this.alias[key] as string[]).find(v => this.types.has(v));
            if (alias) {
                return (this.types.get(alias) as (o: ValueType) => ValueType)(value as string);
            }
        }
        if (doubleFlag && this.doubleFlagToBoolean) return (value == 'true' || value == 'false') ? value == 'true' : value;
        if (isNumber(value)) return Number(value as string);
        return value;
    }

    public defined(key: string, value: ValueType, doubleFlag: boolean = false): boolean {
        return (this.doubleFlagToBoolean && doubleFlag && value == true) ||
               this.types.has(key) ||
               (key != null && key in this.alias && (this.alias[key] as string[]).length > 0);
    }

    public matches_type(key: string, value: ValueType, doubleFlag: boolean = false): boolean {
        if (!this.doubleFlagToBoolean && this.matchesType.size == 0 && !key.startsWith('no-')) return true;
        if (this.doubleFlagToBoolean && doubleFlag && !(value == 'true' || value == 'false')) return false;
        if (this.matchesType.has(key)) return (this.matchesType.get(key) as any)(key, value);
        if (key in this.alias && (this.alias[key] as string[]).filter(v => this.matchesType.has(v)).length > 0) {
            return (key in this.alias && (this.alias[key] as string[]).filter(v => this.matchesType.has(v)).filter(v => (this.matchesType.get(v) as any)(v, value) as boolean).length > 0);
        }
        return true;
    }

    public defaultValue(key: string|null): ValueType {
        if (key != null && this.matchesType.has(key)) return this.defaultTypes.get(key) as ValueType;
        if (key != null && key in this.alias) {
            var alias = (this.alias[key] as string[]).find(v => this.types.has(v));
            if (alias) {
                return this.defaultTypes.get(alias) as ValueType;
            }
        }

        return true;
    }
}

function isInt(value: any) {
    var x;
    return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
}

function isNumber(value: any) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

export default function parse(actual_args: string[]|string, options: ParseOptions = new ParseOptions()): { [s: string]: ValueType | ValueType[] } {
    options = new ParseOptions(options);
    let args = new Arguments(options);
    let parsing = true;
    actual_args = [].concat(actual_args as any).map(a => String(a))
    for (let i = 0; i < actual_args.length; i++) {
        let arg = actual_args[i];
        if (parsing && arg.length > 1) {
            if (arg.startsWith("--")) {
                if (arg == '--') {
                    parsing = false;
                    continue;
                }
                if (arg.indexOf("=") > -1) {
                    let tokens = arg.split("=");
                    args.setFlag(tokens[0].substr(2), tokens[1], arg, true);
                } else if (i + 1 < actual_args.length && (actual_args[i + 1] == '-' || !actual_args[i + 1].startsWith("-")) && options.matches_type(arg.substr(2), actual_args[i + 1], true)) {
                    args.setFlag(arg.substr(2), actual_args[i + 1], arg, true);
                    i++;
                } else if (arg.startsWith('--no-')) {
                    args.setFlag(arg.substr(5), false, arg);
                } else {
                    args.setFlag(arg.substr(2), options.defaultValue(arg.substr(2)), arg, true);
                }
                continue;
            } else if (arg.startsWith("-")) {
                if (arg.length == 2 && i + 1 < actual_args.length && (actual_args[i + 1] == '-' || !actual_args[i + 1].startsWith("-")) && options.matches_type(arg.substr(1), actual_args[i + 1])) {
                    args.setFlag(arg.substr(1), actual_args[i + 1], arg);
                    i++;
                } else {
                    for (let j = 1; j < arg.length; j++) {
                        if (!isNumber(arg[1]) && j + 1 < arg.length && new RegExp('[^a-zA-Z=]+').test(arg[j + 1])) {
                            args.setFlag(arg.substr(j, 1), arg.substr(j + 1), '-' + arg.substr(j, 1));
                            break;
                        } else if (j + 1 < arg.length && arg[j + 1].indexOf("=") > -1) {
                            args.setFlag(arg.substr(j, 1), arg.substr(j + 2), '-' + arg.substr(j, 1));
                            break;
                        } else if (j + 1 == arg.length && i + 1 < actual_args.length && (actual_args[i + 1] == '-' || !actual_args[i + 1].startsWith("-")) && options.matches_type(arg.substr(1), actual_args[i + 1])) {
                            args.setFlag(arg[j], actual_args[i + 1], '-' + arg[j]);
                            i++;
                            break;
                        } else {
                            args.setFlag(arg[j], options.defaultValue(arg[j]), '-' + arg[j]);
                        }
                    }
                }
                continue;
            }
        }

        if (options.stopEarly) parsing = false;
        args.addPositional(options.parse(null, arg), !parsing && options.secondPosition);
    }
    return args.export();
}

module.exports = parse;
module.exports.ParseOptions = ParseOptions;
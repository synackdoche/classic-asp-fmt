import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigError, DEFAULT_OPTIONS, readOptions } from '../options';

const config = (name: string) => path.join(__dirname, '..', '..', 'test', 'fixtures', 'config', name);

describe('readOptions — a partial config', () => {
    it('sets the options it names and leaves the rest at their defaults', () => {
        const options = readOptions(config('partial.json'));

        assert.strictEqual(options.formatter.keywordCase, 'lowercase');
        assert.deepStrictEqual(options.prettier, DEFAULT_OPTIONS.prettier);
        assert.deepStrictEqual(
            { ...options.formatter, keywordCase: DEFAULT_OPTIONS.formatter.keywordCase },
            DEFAULT_OPTIONS.formatter,
        );
    });
});

describe('readOptions — a full config', () => {
    it('reads every option', () => {
        assert.deepStrictEqual(readOptions(config('full.json')), {
            formatter: { keywordCase: 'lowercase', aspTagsOnSameLine: true, htmlIndentMode: 'flat' },
            prettier: {
                printWidth: 120,
                tabWidth: 4,
                useTabs: false,
                semi: false,
                singleQuote: true,
                bracketSameLine: true,
                arrowParens: 'avoid',
                trailingComma: 'all',
                endOfLine: 'lf',
                htmlWhitespaceSensitivity: 'ignore',
            },
        });
    });
});

describe('the README', () => {
    it('shows the defaults the formatter uses', () => {
        const readme = fs.readFileSync(path.join(__dirname, '..', '..', 'README.md'), 'utf8');
        const example = /```json\n([\s\S]*?)```/.exec(readme);

        assert.ok(example, 'the README has a JSON example');
        assert.deepStrictEqual(JSON.parse(example[1]), DEFAULT_OPTIONS);
    });
});

describe('readOptions — a config it cannot use', () => {
    const rejected = [
        ['unknown-key.json', /unknown option nope/],
        ['unknown-nested.json', /formatter: unknown option nope/],
        ['bad-enum.json', /formatter.htmlIndentMode must be one of flat, continuation/],
        ['bad-type.json', /prettier.printWidth must be a positive whole number/],
        ['not-an-object.json', /must be an object/],
    ] as const;

    for (const [name, message] of rejected) {
        it(`rejects ${name}`, () => {
            assert.throws(() => readOptions(config(name)), (error: unknown) => {
                assert.ok(error instanceof ConfigError, String(error));
                assert.match(error.message, message);
                return true;
            });
        });
    }

    it('rejects a file that is not there', () => {
        assert.throws(() => readOptions(config('absent.json')), /cannot read .*absent\.json/);
    });
});

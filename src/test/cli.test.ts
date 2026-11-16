import * as assert from 'assert';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.join(__dirname, '..', 'cli.js');
const FIXTURES = path.join(__dirname, '..', '..', 'test', 'fixtures');

function run(...args: string[]): { code: number | null; stdout: string; stderr: string } {
    const result = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
    return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

let dir: string;

beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'classic-asp-fmt-')); });
afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

function page(name: string, text?: string): string {
    const target = path.join(dir, name);
    if (text === undefined) { fs.copyFileSync(path.join(FIXTURES, 'pages', name), target); }
    else { fs.writeFileSync(target, text); }
    return target;
}

const read = (file: string) => fs.readFileSync(file, 'utf8');
const fixture = (...parts: string[]) => path.join(FIXTURES, ...parts);

describe('classic-asp-fmt — formatting a page in place', () => {
    it('writes the formatted page and exits 0', () => {
        const file = page('unformatted.asp');
        const result = run(file);

        assert.strictEqual(result.code, 0, result.stderr);
        assert.strictEqual(read(file), read(fixture('pages', 'formatted.asp')));
    });

    it('leaves an already formatted page byte for byte', () => {
        const file = page('formatted.asp');
        const before = read(file);
        const result = run(file);

        assert.strictEqual(result.code, 0, result.stderr);
        assert.strictEqual(read(file), before);
    });

    it('formats the pages it can and exits 1 for one it refuses', () => {
        const formatted = page('unformatted.asp');
        const refused = page('refused.asp');
        const result = run(formatted, refused);

        assert.strictEqual(result.code, 1);
        assert.strictEqual(read(formatted), read(fixture('pages', 'formatted.asp')));
        assert.strictEqual(read(refused), read(fixture('pages', 'refused.asp')));
    });

    it('keeps a byte order mark and CRLF line endings', () => {
        const file = page('bom.asp', '\uFEFF<%if x then%>\r\n<p>a</p>\r\n<%end if%>\r\n');
        const result = run(file);

        const text = read(file);
        assert.strictEqual(result.code, 0, result.stderr);
        assert.ok(text.startsWith('\uFEFF<%'), JSON.stringify(text));
        assert.strictEqual(text.replace(/\r\n/g, '').includes('\n'), false, JSON.stringify(text));
    });

    it('writes the line endings the config names', () => {
        const file = page('crlf.asp', '<%if x then%>\r\n<p>a</p>\r\n<%end if%>\r\n');
        const result = run('--config', fixture('config', 'full.json'), file);

        const text = read(file);
        assert.strictEqual(result.code, 0, result.stderr);
        assert.strictEqual(text.includes('\r'), false, JSON.stringify(text));
        assert.ok(text.includes('if x then'), JSON.stringify(text));
    });
});

describe('classic-asp-fmt — a refusal', () => {
    it('names the page and leaves it as it was', () => {
        const file = page('refused.asp');
        const before = read(file);
        const result = run(file);

        assert.strictEqual(result.code, 1);
        assert.match(result.stderr, /unclosed <% or stray %>/);
        assert.ok(result.stderr.startsWith(file), result.stderr);
        assert.strictEqual(read(file), before);
    });

    it('does not fail a page that is JScript and says it skipped it', () => {
        const file = page('jscript.asp');
        const before = read(file);
        const result = run(file);

        assert.strictEqual(result.code, 0, result.stderr);
        assert.match(result.stderr, /JScript/);
        assert.strictEqual(read(file), before);
    });
});

describe('classic-asp-fmt --check', () => {
    it('names the page that would change, writes nothing and exits 1', () => {
        const file = page('unformatted.asp');
        const before = read(file);
        const result = run('--check', file);

        assert.strictEqual(result.code, 1);
        assert.strictEqual(result.stdout.trim(), file);
        assert.strictEqual(read(file), before);
    });

    it('says nothing and exits 0 for a page that is already formatted', () => {
        const file = page('formatted.asp');
        const result = run('--check', file);

        assert.strictEqual(result.code, 0, result.stderr);
        assert.strictEqual(result.stdout, '');
    });
});

describe('classic-asp-fmt --config', () => {
    it('formats by the options in the file', () => {
        const file = page('keyword-case.asp');
        const result = run('--config', fixture('config', 'partial.json'), file);

        assert.strictEqual(result.code, 0, result.stderr);
        assert.ok(read(file).includes('\nif x then\n'), read(file));
    });

    it('accepts --config=<file>', () => {
        const file = page('keyword-case.asp');
        const result = run(`--config=${fixture('config', 'partial.json')}`, file);

        assert.strictEqual(result.code, 0, result.stderr);
        assert.ok(read(file).includes('\nif x then\n'), read(file));
    });

    const rejected = [
        ['unknown-key.json', /unknown option nope/],
        ['unknown-nested.json', /formatter: unknown option nope/],
        ['bad-enum.json', /formatter.htmlIndentMode must be one of flat, continuation/],
        ['bad-type.json', /prettier.printWidth must be a positive whole number/],
        ['not-an-object.json', /must be an object/],
    ] as const;

    for (const [name, message] of rejected) {
        it(`exits 2 for ${name}`, () => {
            const file = page('formatted.asp');
            const before = read(file);
            const result = run('--config', fixture('config', name), file);

            assert.strictEqual(result.code, 2, result.stderr);
            assert.match(result.stderr, message);
            assert.strictEqual(read(file), before);
        });
    }

    it('exits 2 when the config file does not exist', () => {
        const result = run('--config', path.join(dir, 'absent.json'), page('formatted.asp'));
        assert.strictEqual(result.code, 2);
        assert.match(result.stderr, /cannot read .*absent\.json/);
    });
});

describe('classic-asp-fmt — the arguments', () => {
    it('prints the usage and exits 0 for --help', () => {
        const result = run('--help');
        assert.strictEqual(result.code, 0);
        assert.match(result.stdout, /^Usage: classic-asp-fmt/);
    });

    it('exits 2 and prints the usage when no page is given', () => {
        const result = run();
        assert.strictEqual(result.code, 2);
        assert.match(result.stderr, /no pages given/);
        assert.match(result.stderr, /^Usage: classic-asp-fmt/m);
    });

    it('exits 2 for an unknown option', () => {
        const result = run('--fix', page('formatted.asp'));
        assert.strictEqual(result.code, 2);
        assert.match(result.stderr, /unknown option --fix/);
    });

    it('exits 2 when a page cannot be read', () => {
        const result = run(path.join(dir, 'absent.asp'));
        assert.strictEqual(result.code, 2);
        assert.match(result.stderr, /absent\.asp/);
    });
});

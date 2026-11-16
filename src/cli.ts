#!/usr/bin/env node
import * as fs from 'fs';
import { formatPage, type FormatResult } from './formatter/htmlFormatter';
import { ConfigError, DEFAULT_OPTIONS, readOptions, type FormatOptions } from './options';

const USAGE = `Usage: classic-asp-fmt [--check] [--config <file>] <file>...

Formats Classic ASP pages (.asp, .asa, .inc) in place, one at a time.

Options:
  --check           Report the files that would change and exit 1; write nothing.
  --config <file>   Read formatter options from a JSON file.
  -h, --help        Show this message.

Exit codes:
  0  every page is formatted, or already was
  1  a page needs formatting (--check), or the formatter refused one
  2  the arguments, the config file or a page could not be read
`;

interface Invocation {
    check: boolean;
    config?: string;
    files: string[];
}

class UsageError extends Error {}

function parseArguments(argv: string[]): Invocation | 'help' {
    const invocation: Invocation = { check: false, files: [] };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '-h' || arg === '--help') { return 'help'; }
        if (arg === '--check') { invocation.check = true; continue; }
        if (arg === '--config') {
            const path = argv[++i];
            if (path === undefined) { throw new UsageError('--config needs a file'); }
            invocation.config = path;
            continue;
        }
        if (arg.startsWith('--config=')) { invocation.config = arg.slice('--config='.length); continue; }
        if (arg.startsWith('-') && arg !== '-') { throw new UsageError(`unknown option ${arg}`); }
        invocation.files.push(arg);
    }
    if (invocation.files.length === 0) { throw new UsageError('no pages given'); }
    return invocation;
}

function describeRefusal(file: string, result: Exclude<FormatResult, { ok: true }>): string {
    const line = result.line === undefined ? '' : `:${result.line + 1}`;
    return `${file}${line}: ${result.message}`;
}

function lineEnding(options: FormatOptions, original: string): string {
    switch (options.prettier.endOfLine) {
        case 'crlf': return '\r\n';
        case 'cr':   return '\r';
        case 'lf':   return '\n';
        default:     return original.includes('\r\n') ? '\r\n' : '\n';
    }
}

/** True when this page leaves the run failed: the formatter refused it, or --check found it unformatted. */
async function formatFile(file: string, options: FormatOptions, check: boolean): Promise<boolean> {
    const original = fs.readFileSync(file, 'utf8');
    const byteOrderMark = original.startsWith('\uFEFF') ? '\uFEFF' : '';
    const result = await formatPage(original.slice(byteOrderMark.length), options);

    if (!result.ok) {
        console.error(describeRefusal(file, result));
        return result.severity !== 'info';
    }

    const text = byteOrderMark + result.text.replace(/\r\n|\r|\n/g, lineEnding(options, original));
    if (text === original) { return false; }
    if (check) { console.log(file); return true; }
    fs.writeFileSync(file, text);
    return false;
}

async function main(argv: string[]): Promise<number> {
    let invocation: Invocation | 'help';
    try {
        invocation = parseArguments(argv);
    } catch (error) {
        if (!(error instanceof UsageError)) { throw error; }
        console.error(`classic-asp-fmt: ${error.message}\n\n${USAGE}`);
        return 2;
    }
    if (invocation === 'help') { process.stdout.write(USAGE); return 0; }

    let options = DEFAULT_OPTIONS;
    if (invocation.config !== undefined) {
        try {
            options = readOptions(invocation.config);
        } catch (error) {
            if (!(error instanceof ConfigError)) { throw error; }
            console.error(`classic-asp-fmt: ${error.message}`);
            return 2;
        }
    }

    let failed = 0;
    for (const file of invocation.files) {
        let pageFailed;
        try {
            pageFailed = await formatFile(file, options, invocation.check);
        } catch (error) {
            console.error(`classic-asp-fmt: ${file}: ${error instanceof Error ? error.message : String(error)}`);
            return 2;
        }
        if (pageFailed) { failed++; }
    }
    return failed > 0 ? 1 : 0;
}

main(process.argv.slice(2)).then(code => { process.exitCode = code; });

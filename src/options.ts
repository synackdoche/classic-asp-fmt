import * as fs from 'fs';

export interface FormatterSettings {
    keywordCase: 'lowercase' | 'UPPERCASE' | 'PascalCase';
    aspTagsOnSameLine: boolean;
    htmlIndentMode: 'flat' | 'continuation';
}

export interface PrettierSettings {
    printWidth: number;
    tabWidth: number;
    useTabs: boolean;
    semi: boolean;
    singleQuote: boolean;
    bracketSameLine: boolean;
    arrowParens: 'always' | 'avoid';
    trailingComma: 'none' | 'es5' | 'all';
    endOfLine: 'auto' | 'lf' | 'crlf' | 'cr';
    htmlWhitespaceSensitivity: 'css' | 'strict' | 'ignore';
}

export interface FormatOptions {
    formatter: FormatterSettings;
    prettier: PrettierSettings;
}

export const DEFAULT_OPTIONS: FormatOptions = {
    formatter: {
        keywordCase: 'PascalCase',
        aspTagsOnSameLine: false,
        htmlIndentMode: 'continuation',
    },
    prettier: {
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
        semi: true,
        singleQuote: false,
        bracketSameLine: false,
        arrowParens: 'always',
        trailingComma: 'es5',
        endOfLine: 'auto',
        htmlWhitespaceSensitivity: 'css',
    },
};

export class ConfigError extends Error {}

function objectAt(value: unknown, where: string): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new ConfigError(`${where} must be an object`);
    }
    return value as Record<string, unknown>;
}

function onlyKnownKeys(value: Record<string, unknown>, where: string, known: readonly string[]): void {
    const unknown = Object.keys(value).filter(key => !known.includes(key));
    if (unknown.length > 0) { throw new ConfigError(`${where}: unknown option ${unknown.join(', ')}`); }
}

function oneOf<T extends string>(value: unknown, where: string, allowed: readonly T[]): T {
    if (!allowed.includes(value as T)) {
        throw new ConfigError(`${where} must be one of ${allowed.join(', ')}`);
    }
    return value as T;
}

function boolean(value: unknown, where: string): boolean {
    if (typeof value !== 'boolean') { throw new ConfigError(`${where} must be true or false`); }
    return value;
}

function count(value: unknown, where: string): number {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
        throw new ConfigError(`${where} must be a positive whole number`);
    }
    return value;
}

function formatterSettings(raw: unknown, fallback: FormatterSettings): FormatterSettings {
    const where = 'formatter';
    const value = { ...fallback, ...objectAt(raw, where) };
    onlyKnownKeys(value, where, ['keywordCase', 'aspTagsOnSameLine', 'htmlIndentMode']);
    return {
        keywordCase: oneOf(value.keywordCase, `${where}.keywordCase`, ['lowercase', 'UPPERCASE', 'PascalCase'] as const),
        aspTagsOnSameLine: boolean(value.aspTagsOnSameLine, `${where}.aspTagsOnSameLine`),
        htmlIndentMode: oneOf(value.htmlIndentMode, `${where}.htmlIndentMode`, ['flat', 'continuation'] as const),
    };
}

function prettierSettings(raw: unknown, fallback: PrettierSettings): PrettierSettings {
    const where = 'prettier';
    const value = { ...fallback, ...objectAt(raw, where) };
    onlyKnownKeys(value, where, [
        'printWidth', 'tabWidth', 'useTabs', 'semi', 'singleQuote', 'bracketSameLine',
        'arrowParens', 'trailingComma', 'endOfLine', 'htmlWhitespaceSensitivity',
    ]);
    return {
        printWidth: count(value.printWidth, `${where}.printWidth`),
        tabWidth: count(value.tabWidth, `${where}.tabWidth`),
        useTabs: boolean(value.useTabs, `${where}.useTabs`),
        semi: boolean(value.semi, `${where}.semi`),
        singleQuote: boolean(value.singleQuote, `${where}.singleQuote`),
        bracketSameLine: boolean(value.bracketSameLine, `${where}.bracketSameLine`),
        arrowParens: oneOf(value.arrowParens, `${where}.arrowParens`, ['always', 'avoid'] as const),
        trailingComma: oneOf(value.trailingComma, `${where}.trailingComma`, ['none', 'es5', 'all'] as const),
        endOfLine: oneOf(value.endOfLine, `${where}.endOfLine`, ['auto', 'lf', 'crlf', 'cr'] as const),
        htmlWhitespaceSensitivity: oneOf(
            value.htmlWhitespaceSensitivity, `${where}.htmlWhitespaceSensitivity`, ['css', 'strict', 'ignore'] as const,
        ),
    };
}

/** The defaults, with the keys present in the JSON file at `path` applied over them. */
export function readOptions(path: string): FormatOptions {
    let parsed: unknown;
    try {
        parsed = JSON.parse(fs.readFileSync(path, 'utf8'));
    } catch (error) {
        throw new ConfigError(`cannot read ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
    const config = objectAt(parsed, path);
    onlyKnownKeys(config, path, ['formatter', 'prettier']);
    return {
        formatter: formatterSettings(config.formatter ?? {}, DEFAULT_OPTIONS.formatter),
        prettier: prettierSettings(config.prettier ?? {}, DEFAULT_OPTIONS.prettier),
    };
}

import { formatPage } from '../formatter/htmlFormatter';
import type { ParsedPage } from '../vbscript/symbols';
import { DEFAULT_OPTIONS, type FormatOptions, type FormatterSettings, type PrettierSettings } from '../options';

export const withOptions = (
    changes: { formatter?: Partial<FormatterSettings>; prettier?: Partial<PrettierSettings> } = {},
): FormatOptions => ({
    formatter: { ...DEFAULT_OPTIONS.formatter, ...changes.formatter },
    prettier: { ...DEFAULT_OPTIONS.prettier, ...changes.prettier },
});

/** The page formatted, or as it was when the formatter refused it. */
export async function formatted(input: string, options: FormatOptions = DEFAULT_OPTIONS): Promise<string> {
    const result = await formatPage(input, options);
    return result.ok ? result.text : input;
}

export function lineAt(page: ParsedPage, offset: number): number {
    const starts = page.lineStarts;
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (starts[mid] <= offset) { lo = mid; } else { hi = mid - 1; }
    }
    return lo;
}

/**
 * scriptScope.ts
 *
 * One page's script scope: the page and every file it includes, as IIS sees
 * them. IIS pastes each `#include` into the page before compiling it, so a
 * page and its includes are one program with one set of page-wide names.
 *
 * Each file is parsed on its own and keeps its own offsets. `chunks` records
 * the order IIS reads the text in: the page up to its first include, that
 * include (with its own includes inside it), the page up to the next include,
 * and so on. Pasting the text together instead would need a map from every
 * offset back to its file, and a fresh parse of every include each time the
 * page changes.
 */

import type { ParsedPage } from './symbols';

interface IncludeDirective {
    type: 'file' | 'virtual';
    raw: string;
    index: number;
}

export interface ScopeFile {
    path: string;
    text: string;
    page: ParsedPage;
    includes: ScopeInclude[];
}

interface ScopeInclude {
    directive: IncludeDirective;
    /** Where the directive ends, after its `-->`. */
    end: number;
    /** The resolved path. */
    path: string;
    /** The file it names, or null when that could not be read. */
    file: ScopeFile | null;
}

/** A stretch of one file's text, in the order IIS reads the program. */
interface Chunk {
    file: ScopeFile;
    start: number;
    end: number;
}

/** Something about the includes IIS would complain of. */
interface ScopeProblem {
    kind: 'missing' | 'loop' | 'twice';
    file: ScopeFile;
    start: number;
    end: number;
    message: string;
}

export interface ScriptScope {
    root: ScopeFile;
    /** Every file once, the page first, then in the order they are first included. */
    files: ScopeFile[];
    chunks: Chunk[];
    problems: ScopeProblem[];
}

/**
 * Where an offset of one file falls in the order IIS reads the program: a
 * number that sorts statements of different files the way IIS meets them.
 */
export function orderKey(scope: ScriptScope, file: ScopeFile, offset: number): number {
    for (let i = 0; i < scope.chunks.length; i++) {
        const c = scope.chunks[i];
        if (c.file === file && offset >= c.start && offset < c.end) { return i * 2 ** 32 + offset; }
    }
    return Number.MAX_SAFE_INTEGER;
}

/**
 * symbols.ts
 *
 * Reads the declared symbols of a page from its syntax trees, in the
 * FileSymbols shape that completion, the Outline, Ctrl+T and
 * the colouring read. It took over from a line scanner, and keeps that
 * scanner's deliberate choices:
 *   - A plain `x = …` records an implicit variable only when the page has no
 *     Option Explicit, and only for a name not seen before.
 *   - A For Each variable is implicit; a For counter is not recorded.
 *   - Every symbol reports the line its statement starts on.
 * What it does not copy is the line scanner's blind spots: a declaration after
 * `Then` on a one-line If, `<%= x = 1 %>` (a comparison, not an assignment),
 * HTML text that happens to look like code, and `F = …` inside Function F,
 * which sets the function's return value and declares nothing.
 */

import type * as A from './ast';
import { parseProgram } from './parser';
import { pagePrograms } from './pageSegments';

export interface ParsedPage {
    text: string;
    programs: A.Program[];
    lineStarts: number[];
}

export function parsePage(text: string): ParsedPage {
    const programs = pagePrograms(text).map(p => parseProgram(p.text ?? text, p.segments, p.server));
    return { text, programs, lineStarts: lineStartsOf(text) };
}

/**
 * The offset each of the page's lines starts at, split where a TextDocument
 * splits them — at \r\n, \n or a lone \r — so every offset matches the
 * editor's own.
 */
function lineStartsOf(text: string): number[] {
    const starts: number[] = [];
    let start = 0;
    for (let i = 0; i < text.length; i++) {
        const ch = text.charCodeAt(i);
        if (ch !== 10 && ch !== 13) { continue; }
        starts.push(start);
        if (ch === 13 && text.charCodeAt(i + 1) === 10) { i++; }
        start = i + 1;
    }
    starts.push(start);
    return starts;
}

/**
 * Calls `visit` on every statement, depth first, in source order, with the
 * procedure it sits in (null outside any Sub, Function or Property).
 */
export function walkStatements(
    stmts: A.Stmt[],
    visit: (s: A.Stmt, procedure: A.ProcedureStmt | null) => void,
    procedure: A.ProcedureStmt | null = null,
): void {
    for (const s of stmts) {
        visit(s, procedure);
        switch (s.kind) {
            case 'If':        for (const b of s.branches) { walkStatements(b.body, visit, procedure); } break;
            case 'Select':    for (const c of s.cases) { walkStatements(c.body, visit, procedure); } break;
            case 'For':
            case 'ForEach':
            case 'Do':
            case 'While':
            case 'With':      walkStatements(s.body, visit, procedure); break;
            case 'Procedure': walkStatements(s.body, visit, s); break;
            case 'Class':     walkStatements(s.members, visit, procedure); break;
        }
    }
}

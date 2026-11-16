/**
 * symbols.ts
 *
 * A page as the formatter reads it: its text, one syntax tree per program it
 * holds, and the offset each of its lines starts at.
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
 * The offset each of the page's lines starts at, split at \r\n, \n or a lone
 * \r: a line ends at any of the three, and a \r\n pair is one break.
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

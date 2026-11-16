import type * as A from './ast';
import { walkStatements, type ParsedPage } from './symbols';

/** Where a block opens, starts another branch (ElseIf, Else, Case) or closes. */
export interface BlockEvent { at: number; type: 'open' | 'branch' | 'close'; block: 'if' | 'select' | 'other'; }

type Block = A.IfStmt | A.SelectStmt | A.ForStmt | A.ForEachStmt | A.DoStmt | A.WhileStmt
    | A.WithStmt | A.ProcedureStmt | A.ClassStmt;

function isBlock(s: A.Stmt): s is Block {
    return 'opener' in s && !(s.kind === 'If' && s.singleLine);
}

/** The page's block openings, branches and closers, in page order. */
export function pageBlocks(page: ParsedPage): BlockEvent[] {
    const text = page.text;
    const events: BlockEvent[] = [];

    for (const program of page.programs) {
        walkStatements(program.body, stmt => {
            if (!isBlock(stmt)) { return; }
            const block = stmt.kind === 'If' ? 'if' : stmt.kind === 'Select' ? 'select' : 'other';
            events.push({ at: stmt.opener.start, type: 'open', block });
            if (stmt.kind === 'If') { for (const b of stmt.branches.slice(1)) { events.push({ at: b.start, type: 'branch', block }); } }
            if (stmt.kind === 'Select') { for (const c of stmt.cases) { events.push({ at: c.start, type: 'branch', block }); } }
            if (stmt.closer) { events.push({ at: stmt.closer.start, type: 'close', block }); }
        });

        for (const d of program.diagnostics) {
            if (d.code === 'stray-branch') {
                events.push({ at: d.start, type: 'branch', block: text.slice(d.start, d.end).toLowerCase() === 'case' ? 'select' : 'if' });
            }
            if (d.code !== 'stray-closer') { continue; }
            const closer = text.slice(d.start, d.end).toLowerCase().replace(/\s+/g, ' ');
            events.push({ at: d.start, type: 'close', block: closer === 'end if' ? 'if' : closer === 'end select' ? 'select' : 'other' });
        }
    }

    return events.sort((a, b) => a.at - b.at);
}

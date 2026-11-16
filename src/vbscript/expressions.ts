/**
 * expressions.ts
 *
 * Small helpers for reading the expressions of the syntax tree: the ones a
 * statement holds, everything inside an expression, and the pieces of a
 * string built with `&`, which is how an ASP page builds its SQL.
 */

import type * as A from './ast';

/** The expressions directly inside one. */
export function childExpressions(e: A.Expr): A.Expr[] {
    switch (e.kind) {
        case 'Member': return e.object ? [e.object] : [];
        case 'Call':   return [e.callee, ...e.args.filter((a): a is A.Expr => a !== null)];
        case 'Unary':  return [e.operand];
        case 'Binary': return [e.left, e.right];
        case 'Paren':  return [e.expr];
        default:       return [];
    }
}

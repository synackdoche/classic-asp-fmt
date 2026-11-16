import * as assert from 'assert';
import { ASP_OBJECTS, ASP_MEMBER_DOCS, VBSCRIPT_FUNCTIONS } from '../constants/aspKeywords';

// The intrinsic objects used to be listed with four or five members each, so
// ordinary code — Response.CharSet, Response.ContentType, Server.Transfer,
// Request.BinaryRead — had no completion and no hover, and nothing told the
// extension it was part of the language rather than a variable someone made up.
//
// These tests are mostly about the data staying coherent: a member missing a
// doc, a duplicate, or an object added to the list but not to the derived
// lookups would all be silent failures.

/** Members every Classic ASP page uses, which the original list did not have. */
const MUST_EXIST: Array<[string, string]> = [
    ['Response', 'Charset'],
    ['Response', 'ContentType'],
    ['Response', 'Buffer'],
    ['Response', 'Status'],
    ['Response', 'Expires'],
    ['Response', 'CacheControl'],
    ['Response', 'AddHeader'],
    ['Response', 'BinaryWrite'],
    ['Response', 'IsClientConnected'],
    ['Request', 'ServerVariables'],
    ['Request', 'TotalBytes'],
    ['Request', 'BinaryRead'],
    ['Request', 'ClientCertificate'],
    ['Server', 'Transfer'],
    ['Server', 'Execute'],
    ['Server', 'GetLastError'],
    ['Server', 'ScriptTimeout'],
    ['Session', 'SessionID'],
    ['Session', 'Timeout'],
    ['Session', 'LCID'],
    ['Session', 'CodePage'],
    ['Application', 'StaticObjects'],
    ['ASPError', 'Number'],
    ['ASPError', 'Description'],
    ['ObjectContext', 'SetAbort'],
    // Err is VBScript's rather than ASP's, but it reaches the editor the same
    // way, and `On Error Resume Next` was in the keyword list with nothing to
    // pair it with — the page could be told how to start ignoring errors and
    // then had no idea what `Err.Number` was.
    ['Err', 'Number'],
    ['Err', 'Description'],
    ['Err', 'Source'],
    ['Err', 'Clear'],
    ['Err', 'Raise'],
];

describe('ASP intrinsic objects — coverage', () => {

    it('has every object that is in scope without being created', () => {
        assert.deepStrictEqual(
            ASP_OBJECTS.map(o => o.name).sort(),
            ['ASPError', 'Application', 'Err', 'ObjectContext', 'Request', 'Response', 'Server', 'Session'],
        );
    });

    for (const [object, member] of MUST_EXIST) {
        it(`knows ${object}.${member}`, () => {
            const def = ASP_OBJECTS.find(o => o.name === object);
            assert.ok(def, `${object} is missing`);
            assert.ok(
                def.members.some(m => m.name === member),
                `${object}.${member} is missing`,
            );
        });
    }
});

describe('ASP intrinsic objects — the data holds together', () => {

    it('gives every member a kind and a non-empty doc', () => {
        for (const object of ASP_OBJECTS) {
            for (const member of object.members) {
                assert.ok(
                    ['method', 'property', 'collection'].includes(member.kind),
                    `${object.name}.${member.name} has kind ${member.kind}`,
                );
                assert.ok(
                    member.doc.trim().length > 0,
                    `${object.name}.${member.name} has no doc`,
                );
            }
        }
    });

    it('lists no member twice within an object', () => {
        for (const object of ASP_OBJECTS) {
            const seen = new Set<string>();
            for (const member of object.members) {
                const key = member.name.toLowerCase();
                assert.ok(!seen.has(key), `${object.name}.${member.name} is listed twice`);
                seen.add(key);
            }
        }
    });

    it('derives one ASP_MEMBER_DOCS entry per member, keyed case-insensitively', () => {
        const total = ASP_OBJECTS.reduce((n, o) => n + o.members.length, 0);
        assert.strictEqual(Object.keys(ASP_MEMBER_DOCS).length, total);

        const charset = ASP_MEMBER_DOCS['response.charset'];
        assert.ok(charset, 'response.charset should be in the lookup');
        assert.strictEqual(charset.label, 'Response.Charset');
        assert.strictEqual(charset.kind, 'property');
    });

    it('marks the indexed members as collections, not properties', () => {
        for (const key of ['request.form', 'request.querystring', 'request.servervariables',
                           'response.cookies', 'session.contents', 'application.contents']) {
            assert.strictEqual(ASP_MEMBER_DOCS[key].kind, 'collection', key);
        }
    });

    it('does not offer Remove or RemoveAll directly on Session', () => {
        // They live on the Contents collection — `Session.Contents.Remove("k")`.
        // The old list had them on Session itself, which is not valid VBScript.
        const session = ASP_OBJECTS.find(o => o.name === 'Session');
        assert.ok(session);
        for (const wrong of ['Remove', 'RemoveAll']) {
            assert.ok(
                !session.members.some(m => m.name === wrong),
                `Session.${wrong} is not a real member`,
            );
        }
    });
});

describe('VBScript functions and constants', () => {

    it('knows the functions the list was missing', () => {
        for (const fn of ['Eval', 'Execute', 'ExecuteGlobal', 'GetRef', 'GetLocale',
                          'SetLocale', 'Escape', 'Unescape', 'AscW', 'ChrW',
                          'ScriptEngine', 'ScriptEngineMajorVersion']) {
            assert.ok(VBSCRIPT_FUNCTIONS.includes(fn), `${fn} is missing`);
        }
    });

    it('lists no function twice, ignoring case', () => {
        const seen = new Set<string>();
        for (const fn of VBSCRIPT_FUNCTIONS) {
            const key = fn.toLowerCase();
            assert.ok(!seen.has(key), `${fn} is listed twice`);
            seen.add(key);
        }
    });

});

import * as assert from 'assert';
import { ASP_MEMBERS, ASP_OBJECTS, VBSCRIPT_FUNCTIONS } from '../constants/aspKeywords';

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
    // Err is VBScript's rather than ASP's, but a page reads it the same way, and
    // it is what `On Error Resume Next` leaves for the code after it to inspect.
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
                def.members.includes(member),
                `${object}.${member} is missing`,
            );
        });
    }
});

describe('ASP intrinsic objects — the data holds together', () => {

    it('lists no member twice within an object', () => {
        for (const object of ASP_OBJECTS) {
            const seen = new Set<string>();
            for (const member of object.members) {
                const key = member.toLowerCase();
                assert.ok(!seen.has(key), `${object.name}.${member} is listed twice`);
                seen.add(key);
            }
        }
    });

    it('lists every member as Object.Member, once per member', () => {
        const total = ASP_OBJECTS.reduce((n, o) => n + o.members.length, 0);
        assert.strictEqual(ASP_MEMBERS.length, total);
        assert.ok(ASP_MEMBERS.includes('Response.Charset'), 'Response.Charset should be listed');
        for (const label of ASP_MEMBERS) {
            assert.ok(label.includes('.'), `${label} is not Object.Member`);
        }
    });

    it('does not offer Remove or RemoveAll directly on Session', () => {
        // They live on the Contents collection — `Session.Contents.Remove("k")`.
        // The old list had them on Session itself, which is not valid VBScript.
        const session = ASP_OBJECTS.find(o => o.name === 'Session');
        assert.ok(session);
        for (const wrong of ['Remove', 'RemoveAll']) {
            assert.ok(
                !session.members.includes(wrong),
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

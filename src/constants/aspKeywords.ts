// ─────────────────────────────────────────────────────────────────────────────
// ASP intrinsic objects
//
// The objects that are in scope on every page without anyone creating them:
// the seven from the ASP runtime, plus VBScript's `Err`, which a page reads the
// same way — a name nobody declared, carrying members.
//
// The member names are what the formatter needs: a member written in the wrong
// case is re-spelled from here, so `response.write` becomes `Response.Write`.
// The list is the documented ASP 3.0 set (IIS 5.0 onwards).
// ─────────────────────────────────────────────────────────────────────────────

interface AspObjectDef {
    name: string;
    members: string[];
}

export const ASP_OBJECTS: AspObjectDef[] = [
    {
        name: 'Response',
        members: [
            'Write', 'BinaryWrite', 'Redirect', 'End', 'Clear', 'Flush', 'AddHeader',
            'AppendToLog', 'Buffer', 'CacheControl', 'Charset', 'ContentType', 'Expires',
            'ExpiresAbsolute', 'IsClientConnected', 'PICS', 'Status', 'Cookies',
        ],
    },
    {
        name: 'Request',
        members: [
            'Form', 'QueryString', 'Cookies', 'ServerVariables', 'ClientCertificate', 'TotalBytes',
            'BinaryRead',
        ],
    },
    {
        name: 'Server',
        members: [
            'CreateObject', 'MapPath', 'HTMLEncode', 'URLEncode', 'Execute', 'Transfer',
            'GetLastError', 'ScriptTimeout',
        ],
    },
    {
        name: 'Session',
        members: [
            'Contents', 'StaticObjects', 'Abandon', 'SessionID', 'Timeout', 'CodePage', 'LCID',
        ],
    },
    {
        name: 'Application',
        members: [
            'Contents', 'StaticObjects', 'Lock', 'Unlock',
        ],
    },
    {
        name: 'ASPError',
        members: [
            'ASPCode', 'ASPDescription', 'Category', 'Column', 'Description', 'File', 'Line',
            'Number', 'Source',
        ],
    },
    {
        name: 'ObjectContext',
        members: [
            'SetComplete', 'SetAbort',
        ],
    },
    {
        name: 'Err',
        members: [
            'Number', 'Description', 'Source', 'HelpFile', 'HelpContext', 'Clear', 'Raise',
        ],
    },
];

/** Every intrinsic member as `Object.Member`, spelled as the table above spells it. */
export const ASP_MEMBERS: string[] = ASP_OBJECTS.flatMap(object =>
    object.members.map(member => `${object.name}.${member}`),
);

// ─────────────────────────────────────────────────────────────────────────────
// VBScript's built-in functions — the whole documented set for VBScript 5.x,
// which is what every supported IIS ships. A few are useless on a server
// (MsgBox, InputBox, LoadPicture) but are part of the language all the same.
// ─────────────────────────────────────────────────────────────────────────────
export const VBSCRIPT_FUNCTIONS = [
    'Abs', 'Array', 'Asc', 'AscB', 'AscW', 'Atn', 'CBool', 'CByte', 'CCur', 'CDate', 'CDbl', 'Chr',
    'ChrB', 'ChrW', 'CInt', 'CLng', 'Cos', 'CreateObject', 'CSng', 'CStr', 'Date', 'DateAdd',
    'DateDiff', 'DatePart', 'DateSerial', 'DateValue', 'Day', 'Escape', 'Eval', 'Execute',
    'ExecuteGlobal', 'Exp', 'Filter', 'Fix', 'FormatCurrency', 'FormatDateTime', 'FormatNumber',
    'FormatPercent', 'GetLocale', 'GetObject', 'GetRef', 'Hex', 'Hour', 'InputBox', 'InStr',
    'InStrB', 'InStrRev', 'Int', 'IsArray', 'IsDate', 'IsEmpty', 'IsNull', 'IsNumeric', 'IsObject',
    'Join', 'LBound', 'LCase', 'Left', 'LeftB', 'Len', 'LenB', 'LoadPicture', 'Log', 'LTrim',
    'Mid', 'MidB', 'Minute', 'Month', 'MonthName', 'MsgBox', 'Now', 'Oct', 'Replace', 'RGB',
    'Right', 'RightB', 'Rnd', 'Round', 'RTrim', 'ScriptEngine', 'ScriptEngineBuildVersion',
    'ScriptEngineMajorVersion', 'ScriptEngineMinorVersion', 'Second', 'SetLocale', 'Sgn', 'Sin',
    'Space', 'Split', 'Sqr', 'StrComp', 'String', 'StrReverse', 'Tan', 'Time', 'Timer',
    'TimeSerial', 'TimeValue', 'Trim', 'TypeName', 'UBound', 'UCase', 'Unescape', 'VarType',
    'Weekday', 'WeekdayName', 'Year',
];

/**
 * The functions that may be read without brackets, as a value: `If Date > due`,
 * `x = Now`. Every other function is a function only where it is called, since
 * any of them may also name a variable (cscript compiles `Dim hex`, `Dim day`).
 */
export const VBSCRIPT_BARE_FUNCTIONS = [
    'Date', 'GetLocale', 'Now', 'Rnd', 'ScriptEngine', 'ScriptEngineBuildVersion',
    'ScriptEngineMajorVersion', 'ScriptEngineMinorVersion', 'Time', 'Timer',
];

// ─────────────────────────────────────────────────────────────────────────────
// VBScript's built-in constants — the whole set the VBScript 5.x engine
// defines, checked against cscript.exe.
// ─────────────────────────────────────────────────────────────────────────────
const VBSCRIPT_CONSTANTS: string[] = [
    'vbCrLf', 'vbCr', 'vbLf', 'vbNewLine', 'vbTab', 'vbNullChar', 'vbNullString', 'vbFormFeed',
    'vbVerticalTab', 'vbObjectError', 'vbBinaryCompare', 'vbTextCompare', 'vbTrue', 'vbFalse',
    'vbUseDefault', 'vbSunday', 'vbMonday', 'vbTuesday', 'vbWednesday', 'vbThursday', 'vbFriday',
    'vbSaturday', 'vbUseSystemDayOfWeek', 'vbFirstJan1', 'vbFirstFourDays', 'vbFirstFullWeek',
    'vbUseSystem', 'vbGeneralDate', 'vbLongDate', 'vbShortDate', 'vbLongTime', 'vbShortTime',
    'vbEmpty', 'vbNull', 'vbInteger', 'vbLong', 'vbSingle', 'vbDouble', 'vbCurrency', 'vbDate',
    'vbString', 'vbObject', 'vbError', 'vbBoolean', 'vbVariant', 'vbDataObject', 'vbDecimal',
    'vbByte', 'vbArray', 'vbBlack', 'vbRed', 'vbGreen', 'vbYellow', 'vbBlue', 'vbMagenta',
    'vbCyan', 'vbWhite', 'vbOKOnly', 'vbOKCancel', 'vbAbortRetryIgnore', 'vbYesNoCancel',
    'vbYesNo', 'vbRetryCancel', 'vbCritical', 'vbQuestion', 'vbExclamation', 'vbInformation',
    'vbDefaultButton1', 'vbDefaultButton2', 'vbDefaultButton3', 'vbDefaultButton4',
    'vbApplicationModal', 'vbSystemModal', 'vbMsgBoxHelpButton', 'vbMsgBoxSetForeground',
    'vbMsgBoxRight', 'vbMsgBoxRtlReading', 'vbOK', 'vbCancel', 'vbAbort', 'vbRetry', 'vbIgnore',
    'vbYes', 'vbNo',
];

/**
 * The built-in functions and constants, lower-cased. Assigning to one without
 * declaring it first does not make a variable: cscript stops at `hex = 5` or
 * `vbCr = 5` with "Illegal assignment". A `Dim hex` does make one.
 */
export const VBSCRIPT_BUILTIN_VALUES: ReadonlySet<string> = new Set([
    ...VBSCRIPT_FUNCTIONS.map(name => name.toLowerCase()),
    ...VBSCRIPT_CONSTANTS.map(name => name.toLowerCase()),
]);

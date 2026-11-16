// Tag facts the typing and structure rules need. Completion takes its tags and
// attributes from the HTML language service, as a .html file does.

/** The void elements — `<br>`, `<img>`, `<input>`… — which never have a closing tag. */
export const VOID_ELEMENTS: ReadonlySet<string> = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

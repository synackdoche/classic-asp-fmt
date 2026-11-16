import * as assert from 'assert';
import { parsePage } from '../vbscript/symbols';

describe('parsePage — line table', () => {
    it('splits at \\r\\n, \\n and a lone \\r, as a TextDocument does', () => {
        assert.deepStrictEqual(parsePage('<%\rDim a\r\nDim b\nx\r%>').lineStarts, [0, 3, 10, 16, 18]);
    });
});

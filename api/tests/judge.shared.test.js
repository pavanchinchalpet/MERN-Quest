const {
  compareValues,
  normalizeTestCase,
  parseJsonWithLegacyFallback,
} = require('../services/judge/shared');

describe('judge shared utilities', () => {
  test('parses JSON input into positional arguments', () => {
    const testCase = normalizeTestCase({
      input: '[[2,7,11,15], 9]',
      expected: [0, 1],
    }, 0);

    expect(testCase.args).toEqual([[2, 7, 11, 15], 9]);
    expect(testCase.expected).toEqual([0, 1]);
  });

  test('supports legacy single-quoted strings without JSON.parse crashes', () => {
    expect(parseJsonWithLegacyFallback("'olleh'", 'output')).toBe('olleh');
    expect(parseJsonWithLegacyFallback("['hello']", 'input')).toEqual(['hello']);
  });

  test('compares strings directly', () => {
    expect(compareValues('olleh', 'olleh')).toBe(true);
    expect(compareValues('olleh', 'hello')).toBe(false);
  });

  test('treats primitive arrays as equal when order is different', () => {
    expect(compareValues([1, 0], [0, 1], { ignoreOrder: true })).toBe(true);
  });

  test('compares nested objects exactly by structure', () => {
    expect(compareValues({ a: 1, b: [2, 3] }, { b: [2, 3], a: 1 })).toBe(true);
    expect(compareValues({ a: 1, b: [3, 2] }, { a: 1, b: [2, 3] }, { ignoreOrder: false })).toBe(false);
  });
});

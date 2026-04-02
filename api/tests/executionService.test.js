const { executeCode } = require('../services/executionService');

describe('execution service', () => {
  test('accepts a correct JavaScript solution', async () => {
    const result = await executeCode(
      'javascript',
      `
      function twoSum(nums, target) {
        const seen = new Map();
        for (let index = 0; index < nums.length; index += 1) {
          const complement = target - nums[index];
          if (seen.has(complement)) {
            return [seen.get(complement), index];
          }
          seen.set(nums[index], index);
        }
        return [];
      }
      `,
      [
        { input: '[[2,7,11,15], 9]', expected: [0, 1] },
        { input: '[[3,2,4], 6]', expected: [1, 2] },
      ],
      2000
    );

    expect(result.status).toBe('Accepted');
    expect(result.passedCount).toBe(2);
    expect(result.results.every((item) => item.passed)).toBe(true);
  });

  test('handles quoted string outputs without parsing failures', async () => {
    const result = await executeCode(
      'javascript',
      `
      function reverseWord(word) {
        return word.split('').reverse().join('');
      }
      `,
      [
        { input: "['hello']", output: "'olleh'" },
      ],
      2000
    );

    expect(result.status).toBe('Accepted');
    expect(result.results[0].actual).toBe('olleh');
    expect(result.results[0].expected).toBe('olleh');
  });

  test('reports wrong answers cleanly', async () => {
    const result = await executeCode(
      'javascript',
      'function add(a, b) { return a - b; }',
      [
        { input: '[2, 3]', expected: 5 },
      ],
      2000
    );

    expect(result.status).toBe('Wrong Answer');
    expect(result.results[0].passed).toBe(false);
  });
});

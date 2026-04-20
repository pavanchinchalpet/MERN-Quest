const { buildJavaRunnerSource, __internal } = require('../services/judge/javaRunnerSource');

describe('java runner source builder', () => {
  test('wraps raw methods inside a generated solution class', () => {
    const source = buildJavaRunnerSource(`
      public int[] twoSum(int[] nums, int target) {
        return new int[] {0, 1};
      }
    `);

    expect(source).toContain('class UserSolution {');
    expect(source).toContain('public class Main {');
    expect(source).toContain('TARGET_CLASS_NAME = "UserSolution"');
  });

  test('renames submitted Main class so the harness can own Main.java', () => {
    const built = __internal.buildUserJavaSource(`
      public class Main {
        public int add(int a, int b) {
          return a + b;
        }
      }
    `);

    expect(built.targetClassName).toBe('UserMain');
    expect(built.userSource).toContain('class UserMain');
    expect(built.userSource).not.toContain('public class Main');
  });

  test('strips public modifiers from top-level user classes', () => {
    const built = __internal.buildUserJavaSource(`
      public class Solution {
        public int add(int a, int b) {
          return a + b;
        }
      }
    `);

    expect(built.targetClassName).toBe('Solution');
    expect(built.userSource).toContain('class Solution');
    expect(built.userSource).not.toContain('public class Solution');
  });
});

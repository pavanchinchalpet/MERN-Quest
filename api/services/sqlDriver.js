const pool = require('../config/dbPool');
const {
  buildDebugLog,
  compareValues,
  normalizeTestCases,
  toSerializableValue,
} = require('./judge/shared');

/**
 * Execute user SQL and compare against test cases.
 * Uses transactions to roll back changes.
 * 
 * @param {string} sql - The user's SQL code.
 * @param {Array} testCases - [{ input: "table_setup_sql", output: "json_expected_rows" }]
 */
const executeSQL = async (sql, testCases) => {
  const client = await pool.connect();
  const results = [];
  let totalRuntime = 0;
  const normalizedTestCases = normalizeTestCases(testCases);

  try {
    for (const testCase of normalizedTestCases) {
      const startTime = Date.now();
      await client.query('BEGIN');
      
      try {
        if (typeof testCase.rawInput === 'string' && testCase.rawInput.trim()) {
          await client.query(testCase.rawInput);
        }

        const userRes = await client.query(sql);
        const actualRows = toSerializableValue(userRes.rows);
        const expectedRows = toSerializableValue(testCase.expected);
        const passed = compareValues(actualRows, expectedRows, {
          ...testCase.comparison,
          ignoreOrder: true,
        });

        results.push({
          index: testCase.index,
          input: testCase.rawInput,
          expected: expectedRows,
          actual: actualRows,
          passed,
          runtime: Date.now() - startTime,
          debug: buildDebugLog(testCase, actualRows),
          logs: [],
        });
      } catch (err) {
        results.push({
          index: testCase.index,
          input: testCase.rawInput,
          expected: toSerializableValue(testCase.expected),
          actual: null,
          error: err.message,
          passed: false,
          runtime: Date.now() - startTime,
          debug: buildDebugLog(testCase, null),
          logs: [],
        });
      } finally {
        await client.query('ROLLBACK');
        totalRuntime += (Date.now() - startTime);
      }
    }

    const passedCount = results.filter(r => r.passed).length;

    return {
      success: true,
      status: passedCount === normalizedTestCases.length ? 'Accepted' : 'Wrong Answer',
      results,
      runtime: totalRuntime,
      passedCount,
      totalCount: normalizedTestCases.length,
      userLogs: [],
    };
  } catch (err) {
    return {
      success: false,
      status: 'Runtime Error',
      error: err.message,
      passedCount: 0,
      totalCount: normalizedTestCases.length,
      results: [],
      runtime: totalRuntime,
      userLogs: [],
    };
  } finally {
    client.release();
  }
};

module.exports = { executeSQL };

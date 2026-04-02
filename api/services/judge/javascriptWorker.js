const vm = require('vm');
const { parentPort, workerData } = require('worker_threads');
const { buildDebugLog, compareValues, toSerializableValue } = require('./shared');

const FUNCTION_PATTERNS = [
  /function\s+([A-Za-z_$][\w$]*)\s*\(/,
  /const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/,
  /let\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/,
  /var\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/,
];

const findFunctionName = (code) => {
  for (const pattern of FUNCTION_PATTERNS) {
    const match = code.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
};

const resolveUserFunction = (code, sandbox) => {
  if (typeof sandbox.solution === 'function') {
    return sandbox.solution;
  }

  if (typeof sandbox.module.exports === 'function') {
    return sandbox.module.exports;
  }

  if (
    sandbox.module.exports &&
    typeof sandbox.module.exports === 'object' &&
    typeof sandbox.module.exports.solution === 'function'
  ) {
    return sandbox.module.exports.solution;
  }

  const discoveredName = findFunctionName(code);
  if (discoveredName && typeof sandbox[discoveredName] === 'function') {
    return sandbox[discoveredName];
  }

  throw new Error("No callable solution function found. Define a function or export one with 'module.exports'.");
};

const run = async () => {
  const { code, testCases } = workerData;
  const userLogs = [];

  try {
    const sandbox = {
      module: { exports: {} },
      exports: {},
      console: {
        log: (...args) => {
          userLogs.push(args.map((value) => JSON.stringify(toSerializableValue(value))).join(' '));
        },
        error: (...args) => {
          userLogs.push(`ERROR ${args.map((value) => JSON.stringify(toSerializableValue(value))).join(' ')}`);
        },
      },
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
    };

    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { timeout: 1000 });
    const userFunction = resolveUserFunction(code, sandbox);

    const results = [];
    const startedAt = Date.now();

    for (const testCase of testCases) {
      const logOffset = userLogs.length;
      const caseStartedAt = Date.now();

      try {
        const rawActual = await Promise.resolve(userFunction(...testCase.args));
        const actual = toSerializableValue(rawActual);
        const expected = toSerializableValue(testCase.expected);
        const passed = compareValues(actual, expected, testCase.comparison);

        results.push({
          index: testCase.index,
          input: testCase.rawInput,
          expected,
          actual,
          passed,
          runtime: Date.now() - caseStartedAt,
          debug: buildDebugLog(testCase, actual),
          logs: userLogs.slice(logOffset),
        });
      } catch (error) {
        results.push({
          index: testCase.index,
          input: testCase.rawInput,
          expected: toSerializableValue(testCase.expected),
          actual: null,
          passed: false,
          runtime: Date.now() - caseStartedAt,
          error: error.message,
          debug: buildDebugLog(testCase, null),
          logs: userLogs.slice(logOffset),
        });
      }
    }

    const passedCount = results.filter((result) => result.passed).length;

    parentPort.postMessage({
      success: true,
      status: passedCount === results.length ? 'Accepted' : 'Wrong Answer',
      runtime: Date.now() - startedAt,
      passedCount,
      totalCount: results.length,
      results,
      userLogs,
    });
  } catch (error) {
    parentPort.postMessage({
      success: false,
      status: 'Runtime Error',
      runtime: 0,
      passedCount: 0,
      totalCount: testCases.length,
      results: [],
      userLogs,
      error: error.message,
    });
  }
};

run();

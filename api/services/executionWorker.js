const { parentPort, workerData } = require('worker_threads');
const vm = require('vm');

/**
 * Worker thread for executing user code in a sandbox.
 * Data passed: { code, testCases }
 */

// Helper to parse input string like "[1,2,3], 9" into [ [1,2,3], 9 ]
const parseInput = (inputStr) => {
  try {
    // If it's already an array-like string, parse it
    return JSON.parse(`[${inputStr}]`);
  } catch (err) {
    // Fallback for simple inputs
    return [inputStr];
  }
};

// Helper for deep, order-insensitive comparison for arrays
const compareResults = (actual, expected) => {
  const stringifiedActual = JSON.stringify(actual);
  const stringifiedExpected = JSON.stringify(expected);

  // 1. Precise match (Strict)
  if (stringifiedActual === stringifiedExpected) return true;

  // 2. Order-agnostic match for arrays (Flexible)
  if (Array.isArray(actual) && Array.isArray(expected) && actual.length === expected.length) {
    const sortedActual = [...actual].sort((a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b))));
    const sortedExpected = [...expected].sort((a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b))));
    return JSON.stringify(sortedActual) === JSON.stringify(sortedExpected);
  }

  return false;
};

const runCode = async () => {
  const { code, testCases } = workerData;
  const results = [];
  const userLogs = [];
  
  try {
    // 1. Create a sandbox context with console interception
    const sandbox = {
      console: {
        log: (...args) => {
          userLogs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
        },
        error: (...args) => {
          userLogs.push(`ERROR: ${args.map(a => String(a)).join(' ')}`);
        },
      },
      process: {},
      setTimeout,
      clearTimeout,
      Buffer,
    };
    
    vm.createContext(sandbox);

    // 2. Evaluate the user code to define the function
    vm.runInContext(code, sandbox, { timeout: 2000 });

    // 3. Find the function name
    const functionMatch = code.match(/function\s+([a-zA-Z0-9_]+)\s*\(/);
    if (!functionMatch) {
      throw new Error("Could not find a valid function definition. Use 'function functionName(...) { ... }'");
    }
    const functionName = functionMatch[1];
    const userFunction = sandbox[functionName];

    if (typeof userFunction !== 'function') {
      throw new Error(`Function '${functionName}' is not defined.`);
    }

    // 4. Run against test cases
    const startTime = Date.now();
    
    for (const testCase of testCases) {
      try {
        // Parse input safely - Input like "['hello']"
        let args;
        // Normalize single quotes to double quotes for JSON parsing
        const normalizedInput = testCase.input.trim().replace(/'/g, '"');
        try {
          args = JSON.parse(normalizedInput);
          if (!Array.isArray(args)) args = [args];
        } catch (e) {
          // Fallback if not valid array/JSON
          args = [testCase.input];
        }

        // Handle Expected Output Parsing - Output like "'olleh'"
        let expected;
        const normalizedOutput = testCase.output.trim().replace(/'/g, '"');
        try {
          expected = JSON.parse(normalizedOutput);
        } catch (err) {
          // If parsing fails, use the raw trimmed output
          expected = testCase.output.trim();
          // Remove potential enclosing single quotes
          if (expected.startsWith("'") && expected.endsWith("'")) {
            expected = expected.slice(1, -1);
          }
        }
        
        // Execute in sandbox
        const actual = userFunction(...args);
        
        // Debug Logging (captured in userLogs)
        sandbox.console.log(`--- Test Case Debug ---`);
        sandbox.console.log(`Raw Input: ${testCase.input}`);
        sandbox.console.log(`Parsed Input: ${JSON.stringify(args)}`);
        sandbox.console.log(`User Output: ${JSON.stringify(actual)}`);
        sandbox.console.log(`Expected Output: ${JSON.stringify(expected)}`);

        // Type-Safe Comparison
        let passed;
        if (typeof expected === "string" && typeof actual === "string") {
            passed = actual === expected;
        } else {
            passed = compareResults(actual, expected);
        }
        
        results.push({
          input: testCase.input,
          expected,
          actual,
          passed,
        });
      } catch (err) {
        results.push({
          input: testCase.input,
          error: err.message,
          passed: false,
        });
      }
    }

    const runtime = Date.now() - startTime;

    parentPort.postMessage({
      success: true,
      results,
      runtime,
      userLogs,
      passedCount: results.filter(r => r.passed).length,
      totalCount: results.length
    });

  } catch (err) {
    parentPort.postMessage({
      success: false,
      error: err.message,
      userLogs
    });
  }
};

runCode();

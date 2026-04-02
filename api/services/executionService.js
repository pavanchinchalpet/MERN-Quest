const env = require('../config/env');
const { executeSQL } = require('./sqlDriver');
const { executeJavaScript } = require('./judge/javascriptExecutor');
const { executeJava, executePython } = require('./judge/externalExecutor');

const DEFAULT_TIMEOUT = Number(env.EXECUTION_TIMEOUT_MS || 3000);

const executeCode = async (language, code, testCases, timeout = DEFAULT_TIMEOUT) => {
  const normalizedLanguage = String(language || 'javascript').toLowerCase();
  const request = { code, testCases, timeout };

  switch (normalizedLanguage) {
    case 'javascript':
    case 'js':
      return executeJavaScript(request);
    case 'python':
    case 'py':
      return executePython(request);
    case 'java':
      return executeJava(request);
    case 'sql':
      return executeSQL(code, testCases);
    default:
      return {
        success: false,
        status: 'Environment Error',
        runtime: 0,
        passedCount: 0,
        totalCount: Array.isArray(testCases) ? testCases.length : 0,
        results: [],
        userLogs: [],
        error: `Language '${language}' is not supported.`,
      };
  }
};

module.exports = { executeCode };

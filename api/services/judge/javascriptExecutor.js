const path = require('path');
const { Worker } = require('worker_threads');
const { normalizeTestCases } = require('./shared');

const executeJavaScript = async ({ code, testCases, timeout }) => {
  const normalizedTestCases = normalizeTestCases(testCases);

  return new Promise((resolve) => {
    const worker = new Worker(path.join(__dirname, 'javascriptWorker.js'), {
      workerData: {
        code,
        testCases: normalizedTestCases,
      },
    });

    let settled = false;
    const finish = (payload) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutHandle);
      worker.terminate().catch(() => {});
      resolve(payload);
    };

    const timeoutHandle = setTimeout(() => {
      finish({
        success: false,
        status: 'Time Limit Exceeded',
        runtime: timeout,
        passedCount: 0,
        totalCount: normalizedTestCases.length,
        results: [],
        userLogs: [],
        error: `Execution timed out after ${timeout}ms`,
      });
    }, timeout);

    worker.on('message', (message) => {
      finish(message);
    });

    worker.on('error', (error) => {
      finish({
        success: false,
        status: 'Runtime Error',
        runtime: 0,
        passedCount: 0,
        totalCount: normalizedTestCases.length,
        results: [],
        userLogs: [],
        error: error.message,
      });
    });

    worker.on('exit', (codeValue) => {
      if (!settled && codeValue !== 0) {
        finish({
          success: false,
          status: 'Runtime Error',
          runtime: 0,
          passedCount: 0,
          totalCount: normalizedTestCases.length,
          results: [],
          userLogs: [],
          error: `JavaScript worker exited with code ${codeValue}`,
        });
      }
    });
  });
};

module.exports = { executeJavaScript };

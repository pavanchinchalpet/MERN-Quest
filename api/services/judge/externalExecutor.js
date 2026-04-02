const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');
const { normalizeTestCases } = require('./shared');
const { buildJavaRunnerSource } = require('./javaRunnerSource');

const JUDGE_ROOT = path.join(__dirname, '..', '..', '.judge');

const PYTHON_CANDIDATES = [
  { command: process.env.PYTHON_BIN, args: [] },
  { command: 'python3', args: [] },
  { command: 'python', args: [] },
  { command: 'py', args: ['-3'] },
].filter((item) => item.command);

const JAVAC_CANDIDATES = [
  { command: process.env.JAVAC_BIN || 'javac', args: [] },
];

const JAVA_CANDIDATES = [
  { command: process.env.JAVA_BIN || 'java', args: [] },
];

const ensureDirectory = async (directoryPath) => {
  await fs.mkdir(directoryPath, { recursive: true });
};

const makeJobDirectory = async () => {
  const jobDirectory = path.join(JUDGE_ROOT, crypto.randomUUID());
  await ensureDirectory(jobDirectory);
  return jobDirectory;
};

const cleanupDirectory = async (directoryPath) => {
  await fs.rm(directoryPath, { recursive: true, force: true });
};

const runProcess = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env || process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  let timedOut = false;

  const timeoutHandle = setTimeout(() => {
    timedOut = true;
    child.kill('SIGKILL');
  }, options.timeout || 3000);

  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });

  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  child.on('error', (error) => {
    clearTimeout(timeoutHandle);
    reject(error);
  });

  child.on('close', (exitCode) => {
    clearTimeout(timeoutHandle);
    resolve({ exitCode, stdout, stderr, timedOut });
  });
});

const runFirstAvailable = async (candidates, buildArgs, options) => {
  let lastError = null;

  for (const candidate of candidates) {
    try {
      return await runProcess(candidate.command, [...candidate.args, ...buildArgs(candidate.command)], options);
    } catch (error) {
      if (error.code === 'ENOENT') {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw new Error(lastError ? `Runtime not available: ${lastError.message}` : 'Runtime not available');
};

const parseRunnerOutput = (stdout, stderr) => {
  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Judge runner returned invalid JSON. stderr: ${stderr || 'none'}`);
  }
};

const finalizeExternalResult = (payload) => {
  const passedCount = payload.results.filter((result) => result.passed).length;
  return {
    success: true,
    status: passedCount === payload.results.length ? 'Accepted' : 'Wrong Answer',
    runtime: payload.runtime,
    passedCount,
    totalCount: payload.results.length,
    results: payload.results,
    userLogs: payload.userLogs || [],
  };
};

const executePython = async ({ code, testCases, timeout }) => {
  const normalizedTestCases = normalizeTestCases(testCases);
  const jobDirectory = await makeJobDirectory();
  const payloadPath = path.join(jobDirectory, 'payload.json');

  try {
    await fs.writeFile(payloadPath, JSON.stringify({ code, testCases: normalizedTestCases }, null, 2), 'utf8');
    const runnerPath = path.join(__dirname, 'pythonRunner.py');

    const execution = await runFirstAvailable(
      PYTHON_CANDIDATES,
      () => [runnerPath, payloadPath],
      { cwd: jobDirectory, timeout }
    );

    if (execution.timedOut) {
      return {
        success: false,
        status: 'Time Limit Exceeded',
        runtime: timeout,
        passedCount: 0,
        totalCount: normalizedTestCases.length,
        results: [],
        userLogs: [],
        error: `Execution timed out after ${timeout}ms`,
      };
    }

    if (execution.exitCode !== 0) {
      return {
        success: false,
        status: 'Runtime Error',
        runtime: 0,
        passedCount: 0,
        totalCount: normalizedTestCases.length,
        results: [],
        userLogs: [],
        error: execution.stderr.trim() || 'Python runner failed',
      };
    }

    return finalizeExternalResult(parseRunnerOutput(execution.stdout, execution.stderr));
  } catch (error) {
    return {
      success: false,
      status: 'Environment Error',
      runtime: 0,
      passedCount: 0,
      totalCount: normalizedTestCases.length,
      results: [],
      userLogs: [],
      error: error.message,
    };
  } finally {
    await cleanupDirectory(jobDirectory);
  }
};

const executeJava = async ({ code, testCases, timeout }) => {
  const normalizedTestCases = normalizeTestCases(testCases);
  const jobDirectory = await makeJobDirectory();
  const payloadPath = path.join(jobDirectory, 'payload.json');
  const sourcePath = path.join(jobDirectory, 'Solution.java');

  try {
    await fs.writeFile(payloadPath, JSON.stringify({ testCases: normalizedTestCases }, null, 2), 'utf8');
    await fs.writeFile(sourcePath, buildJavaRunnerSource(code), 'utf8');

    const compilation = await runFirstAvailable(
      JAVAC_CANDIDATES,
      () => [sourcePath],
      { cwd: jobDirectory, timeout }
    );

    if (compilation.timedOut) {
      return {
        success: false,
        status: 'Time Limit Exceeded',
        runtime: timeout,
        passedCount: 0,
        totalCount: normalizedTestCases.length,
        results: [],
        userLogs: [],
        error: `Compilation timed out after ${timeout}ms`,
      };
    }

    if (compilation.exitCode !== 0) {
      return {
        success: false,
        status: 'Compilation Error',
        runtime: 0,
        passedCount: 0,
        totalCount: normalizedTestCases.length,
        results: [],
        userLogs: [],
        error: compilation.stderr.trim() || 'Java compilation failed',
      };
    }

    const execution = await runFirstAvailable(
      JAVA_CANDIDATES,
      () => ['-cp', jobDirectory, 'Solution', payloadPath],
      { cwd: jobDirectory, timeout }
    );

    if (execution.timedOut) {
      return {
        success: false,
        status: 'Time Limit Exceeded',
        runtime: timeout,
        passedCount: 0,
        totalCount: normalizedTestCases.length,
        results: [],
        userLogs: [],
        error: `Execution timed out after ${timeout}ms`,
      };
    }

    if (execution.exitCode !== 0) {
      return {
        success: false,
        status: 'Runtime Error',
        runtime: 0,
        passedCount: 0,
        totalCount: normalizedTestCases.length,
        results: [],
        userLogs: [],
        error: execution.stderr.trim() || 'Java runner failed',
      };
    }

    return finalizeExternalResult(parseRunnerOutput(execution.stdout, execution.stderr));
  } catch (error) {
    return {
      success: false,
      status: 'Environment Error',
      runtime: 0,
      passedCount: 0,
      totalCount: normalizedTestCases.length,
      results: [],
      userLogs: [],
      error: error.message,
    };
  } finally {
    await cleanupDirectory(jobDirectory);
  }
};

module.exports = {
  executeJava,
  executePython,
};

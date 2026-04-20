const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');
const fsSync = require('fs');
const { normalizeTestCases } = require('./shared');
const { buildJavaRunnerSource } = require('./javaRunnerSource');

const JUDGE_ROOT = path.join(__dirname, '..', '..', '.judge');

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

const isWindows = (platform = process.platform) => platform === 'win32';

const commandExists = (commandPath) => {
  if (!commandPath) {
    return false;
  }

  try {
    return fsSync.existsSync(commandPath);
  } catch (error) {
    return false;
  }
};

const uniqueCandidates = (candidates) => {
  const seen = new Set();

  return candidates.filter((candidate) => {
    const key = `${candidate.command}::${candidate.args.join(' ')}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const uniqueStrings = (values) => {
  const seen = new Set();

  return values.filter((value) => {
    if (seen.has(value)) {
      return false;
    }

    seen.add(value);
    return true;
  });
};

const getJavaHomeCandidates = () => {
  const javaHomes = [
    process.env.JAVA_HOME,
    'C:\\Program Files\\Java\\latest',
    'C:\\Program Files\\Java\\jdk-21.0.10',
    'C:\\Program Files\\Java\\jdk-21',
    'C:\\Program Files\\Java\\jdk-17',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-21',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-17',
  ].filter(Boolean);

  return uniqueStrings(javaHomes.map((javaHome) => javaHome.trim())).filter(commandExists);
};

const buildJavaBinaryCandidates = ({ override, binaryName }) => {
  const candidates = [];

  if (override) {
    candidates.push({ command: override, args: [] });
  }

  candidates.push({ command: binaryName, args: [] });

  if (isWindows()) {
    for (const javaHome of getJavaHomeCandidates()) {
      const executableName = `${binaryName}.exe`;
      const executablePath = path.join(javaHome, 'bin', executableName);
      if (commandExists(executablePath)) {
        candidates.push({ command: executablePath, args: [] });
      }
    }
  }

  return uniqueCandidates(candidates);
};

const getPythonCommand = ({
  platform = process.platform,
  override = process.env.PYTHON_BIN,
} = {}) => {
  if (override) {
    return { command: override, args: [] };
  }

  if (isWindows(platform)) {
    return { command: 'py', args: ['-3'] };
  }

  return { command: 'python3', args: [] };
};

const getJavacCandidates = () => buildJavaBinaryCandidates({
  override: process.env.JAVAC_BIN,
  binaryName: 'javac',
});

const getJavaCandidates = () => buildJavaBinaryCandidates({
  override: process.env.JAVA_BIN,
  binaryName: 'java',
});

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
    throw new Error(
      `Judge runner returned invalid JSON. stdout: ${(stdout || 'none').trim()} stderr: ${(stderr || 'none').trim()}`
    );
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
  const pythonRuntime = getPythonCommand();

  try {
    await fs.writeFile(payloadPath, JSON.stringify({ code, testCases: normalizedTestCases }, null, 2), 'utf8');
    const runnerPath = path.join(__dirname, 'pythonRunner.py');

    const execution = await runFirstAvailable(
      [pythonRuntime],
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
        error: execution.stderr.trim()
          || execution.stdout.trim()
          || `Python runner failed via '${pythonRuntime.command}'`,
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
  const sourcePath = path.join(jobDirectory, 'Main.java');
  const javacCandidates = getJavacCandidates();
  const javaCandidates = getJavaCandidates();

  try {
    await fs.writeFile(payloadPath, JSON.stringify({ code, testCases: normalizedTestCases }, null, 2), 'utf8');
    await fs.writeFile(sourcePath, buildJavaRunnerSource(code), 'utf8');

    const compilation = await runFirstAvailable(
      javacCandidates,
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
      javaCandidates,
      () => ['-cp', jobDirectory, 'Main', payloadPath],
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
  __internal: {
    getJavaCandidates,
    getJavacCandidates,
    getPythonCommand,
    isWindows,
  },
};

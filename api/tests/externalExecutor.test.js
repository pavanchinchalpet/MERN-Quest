const { __internal } = require('../services/judge/externalExecutor');

describe('external executor python runtime selection', () => {
  test('uses py -3 on Windows', () => {
    expect(__internal.getPythonCommand({ platform: 'win32' })).toEqual({
      command: 'py',
      args: ['-3'],
    });
  });

  test('uses python3 on Linux', () => {
    expect(__internal.getPythonCommand({ platform: 'linux' })).toEqual({
      command: 'python3',
      args: [],
    });
  });

  test('prefers PYTHON_BIN override when provided', () => {
    expect(__internal.getPythonCommand({
      platform: 'win32',
      override: 'C:\\Python312\\python.exe',
    })).toEqual({
      command: 'C:\\Python312\\python.exe',
      args: [],
    });
  });
});

describe('external executor java runtime selection', () => {
  test('prefers explicit java override when provided', () => {
    expect(__internal.getJavaCandidates()[0]).toEqual({
      command: process.env.JAVA_BIN || 'java',
      args: [],
    });
  });

  test('prefers explicit javac override when provided', () => {
    expect(__internal.getJavacCandidates()[0]).toEqual({
      command: process.env.JAVAC_BIN || 'javac',
      args: [],
    });
  });
});

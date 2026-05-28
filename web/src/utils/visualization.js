const JAVA_SCRIPT_KEYWORDS = [
  { token: 'for', label: 'Loop iteration detected', detail: 'The trace can step through repeated updates and show how indexes move.' },
  { token: 'while', label: 'While loop detected', detail: 'The bot can replay each condition check and highlight when the loop exits.' },
  { token: 'if', label: 'Conditional branch detected', detail: 'The visual flow can explain why a branch was taken for the current input.' },
  { token: 'class', label: 'Class structure detected', detail: 'Object-oriented code can be represented with instance fields and method calls.' },
  { token: 'new Array', label: 'Array allocation detected', detail: 'The panel can render capacity, indexes, and element changes visually.' },
  { token: '.push', label: 'Append operation detected', detail: 'New values can animate into the next available index.' },
  { token: 'map', label: 'Map usage detected', detail: 'Hash-based lookups can be explained as key-value state changes.' },
];

const parseArrayLiteral = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const match = value.match(/\[([^\]]*)\]/);
  if (!match) {
    return null;
  }

  const items = match[1]
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const normalized = item.replace(/^["']|["']$/g, '');
      const numeric = Number(normalized);
      return Number.isNaN(numeric) ? normalized : numeric;
    });

  return items.length ? items : null;
};

const buildSummary = (code = '', result) => {
  const normalized = code.toLowerCase();
  const matches = JAVA_SCRIPT_KEYWORDS.filter((entry) => normalized.includes(entry.token.toLowerCase()));

  if (!matches.length) {
    return [
      {
        title: 'Code ready for guided replay',
        detail: 'Run the solution to let the bot summarize the result and propose visual learning steps.',
      },
    ];
  }

  return matches.slice(0, 4).map((entry) => ({
    title: entry.label,
    detail: entry.detail,
  }));
};

const buildTraceSteps = (code = '', result, problem) => {
  const steps = [];
  const lower = code.toLowerCase();
  const title = problem?.title || 'this problem';

  steps.push({
    label: 'Load problem',
    detail: `Prepare inputs and understand the objective for ${title}.`,
  });

  if (lower.includes('class')) {
    steps.push({
      label: 'Create object state',
      detail: 'Initialize instance fields and prepare the internal structure for updates.',
    });
  }

  if (lower.includes('for') || lower.includes('while')) {
    steps.push({
      label: 'Iterate through data',
      detail: 'Follow each loop cycle and show how variables and indexes change.',
    });
  }

  if (lower.includes('if')) {
    steps.push({
      label: 'Evaluate conditions',
      detail: 'Explain which branch executed and why the current values matched the condition.',
    });
  }

  steps.push({
    label: result?.status === 'Accepted' ? 'Validate output' : 'Inspect current result',
    detail:
      result?.status === 'Accepted'
        ? 'Compare the computed output against the expected answers and confirm each passing case.'
        : 'Use the current output and logs to explain where the solution diverged from the expected behavior.',
  });

  return steps.slice(0, 5);
};

const buildVisualState = (code = '', problem, result) => {
  const parsedInput = parseArrayLiteral(problem?.test_cases?.[0]?.input);
  const fallback = parsedInput || [0, 1, 2, 3];
  const sizeGuess = Math.max(1, Math.min(fallback.length, result?.passed || 1));

  return {
    structure: lowerLevelStructureLabel(code, problem),
    cells: fallback.slice(0, 6).map((value, index) => ({
      index,
      value,
      active: index === Math.min(sizeGuess - 1, fallback.length - 1),
    })),
    metrics: [
      { label: 'Current size', value: String(sizeGuess) },
      { label: 'Capacity', value: String(Math.max(fallback.length, sizeGuess + 1)) },
      { label: 'Passed cases', value: `${result?.passed ?? 0}/${result?.total ?? problem?.test_cases?.length ?? 0}` },
    ],
  };
};

function lowerLevelStructureLabel(code = '', problem) {
  const lower = code.toLowerCase();

  if (lower.includes('linkedlist')) return 'Linked List';
  if (lower.includes('queue')) return 'Queue';
  if (lower.includes('stack')) return 'Stack';
  if (lower.includes('tree')) return 'Tree';
  if (lower.includes('graph')) return 'Graph';
  if (lower.includes('string')) return 'String';
  if (lower.includes('array') || problem?.subcategory?.toLowerCase()?.includes('array')) return 'Array';
  return 'Execution State';
}

export const generateVisualization = ({ code = '', problem, result, language = 'javascript' }) => {
  const status = result?.status || 'Ready';
  const accepted = status === 'Accepted';

  return {
    title: `${problem?.title || 'Practice'} Visual Trace`,
    status,
    language,
    headline: accepted
      ? 'The solution passed. Use the replay to understand why each step worked.'
      : 'Run the code to generate a stronger replay and clearer step-by-step feedback.',
    botMessage: accepted
      ? `Your ${language} solution completed successfully. The panel is highlighting the execution flow so the learner can connect the code to the data changes.`
      : 'The bot is ready to explain loops, conditions, and structure updates as soon as the code is run.',
    summaries: buildSummary(code, result),
    steps: buildTraceSteps(code, result, problem),
    visualState: buildVisualState(code, problem, result),
    consoleNotes: Array.isArray(result?.userLogs) ? result.userLogs.slice(0, 4) : [],
  };
};

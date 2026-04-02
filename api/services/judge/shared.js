const vm = require('vm');

const DEFAULT_FLOAT_EPSILON = 1e-9;

const isPlainObject = (value) => {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  return Object.getPrototypeOf(value) === Object.prototype;
};

const parseJsonWithLegacyFallback = (rawValue, label) => {
  if (rawValue === undefined || rawValue === null) {
    return rawValue;
  }

  if (typeof rawValue !== 'string') {
    return rawValue;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return '';
  }

  try {
    return JSON.parse(trimmed);
  } catch (jsonError) {
    try {
      return vm.runInNewContext(`(${trimmed})`, Object.create(null), { timeout: 50 });
    } catch (legacyError) {
      throw new Error(`${label} is not valid JSON: ${jsonError.message}`);
    }
  }
};

const normalizeInput = (rawInput) => {
  const parsed = parseJsonWithLegacyFallback(rawInput, 'Test case input');
  return Array.isArray(parsed) ? parsed : [parsed];
};

const normalizeExpected = (testCase) => {
  if (Object.prototype.hasOwnProperty.call(testCase, 'expected')) {
    return parseJsonWithLegacyFallback(testCase.expected, 'Test case expected output');
  }

  return parseJsonWithLegacyFallback(testCase.output, 'Test case output');
};

const isPrimitive = (value) => value === null || ['string', 'number', 'boolean'].includes(typeof value);

const isPrimitiveArray = (value) => Array.isArray(value) && value.every(isPrimitive);

const normalizeComparison = (testCase = {}, expected) => {
  const comparison = testCase.comparison || {};
  return {
    ignoreOrder: testCase.ignoreOrder === true
      || comparison.ignoreOrder === true
      || (
        testCase.ignoreOrder !== false &&
        comparison.ignoreOrder !== false &&
        isPrimitiveArray(expected)
      ),
    numericTolerance: typeof comparison.numericTolerance === 'number'
      ? comparison.numericTolerance
      : DEFAULT_FLOAT_EPSILON,
    trimStrings: comparison.trimStrings === true,
  };
};

const normalizeTestCase = (testCase, index) => {
  const args = normalizeInput(testCase.input);
  const expected = normalizeExpected(testCase);

  return {
    index,
    rawInput: testCase.input,
    rawExpected: Object.prototype.hasOwnProperty.call(testCase, 'expected')
      ? testCase.expected
      : testCase.output,
    args,
    expected,
    comparison: normalizeComparison(testCase, expected),
  };
};

const normalizeTestCases = (testCases = []) => testCases.map(normalizeTestCase);

const toSerializableValue = (value) => {
  if (value === undefined) {
    return null;
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(toSerializableValue);
  }

  if (value instanceof Set) {
    return Array.from(value).map(toSerializableValue);
  }

  if (value instanceof Map) {
    return Array.from(value.entries()).map(([key, mapValue]) => [
      toSerializableValue(key),
      toSerializableValue(mapValue),
    ]);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (isPlainObject(value)) {
    return Object.keys(value).sort().reduce((accumulator, key) => {
      accumulator[key] = toSerializableValue(value[key]);
      return accumulator;
    }, {});
  }

  return String(value);
};

const normalizeNumeric = (value) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }

  return null;
};

const primitiveType = (value) => (
  value === null ? 'null' : typeof value
);

function compareValues(actual, expected, comparison = {}) {
  const options = {
    ignoreOrder: false,
    numericTolerance: DEFAULT_FLOAT_EPSILON,
    trimStrings: false,
    ...comparison,
  };

  if (typeof actual === 'string' && typeof expected === 'string') {
    return options.trimStrings ? actual.trim() === expected.trim() : actual === expected;
  }

  const actualNumber = normalizeNumeric(actual);
  const expectedNumber = normalizeNumeric(expected);
  if (actualNumber !== null && expectedNumber !== null) {
    return Math.abs(actualNumber - expectedNumber) <= options.numericTolerance;
  }

  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) {
      return false;
    }

    const exactMatch = actual.every((item, index) => compareValues(item, expected[index], options));
    if (exactMatch) {
      return true;
    }

    if (options.ignoreOrder) {
      const sortValue = (value) => `${primitiveType(value)}:${String(value)}`;
      const sortedActual = [...actual].sort((left, right) => sortValue(left).localeCompare(sortValue(right)));
      const sortedExpected = [...expected].sort((left, right) => sortValue(left).localeCompare(sortValue(right)));
      return sortedActual.every((item, index) => compareValues(item, sortedExpected[index], options));
    }

    return false;
  }

  if (isPlainObject(actual) && isPlainObject(expected)) {
    const actualKeys = Object.keys(actual).sort();
    const expectedKeys = Object.keys(expected).sort();

    if (!compareValues(actualKeys, expectedKeys, { ...options, ignoreOrder: false })) {
      return false;
    }

    return actualKeys.every((key) => compareValues(actual[key], expected[key], options));
  }

  return Object.is(actual, expected);
}

const buildDebugLog = (testCase, actual) => ([
  `Input: ${JSON.stringify(testCase.args)}`,
  `Output: ${JSON.stringify(toSerializableValue(actual))}`,
  `Expected: ${JSON.stringify(toSerializableValue(testCase.expected))}`,
]);

module.exports = {
  buildDebugLog,
  compareValues,
  normalizeTestCase,
  normalizeTestCases,
  parseJsonWithLegacyFallback,
  toSerializableValue,
};

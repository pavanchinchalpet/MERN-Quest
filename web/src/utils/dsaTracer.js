const safeJsonParse = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const cloneArray = (value) => (Array.isArray(value) ? [...value] : []);

const getPrimaryInput = (problem) => {
  const parsed = safeJsonParse(problem?.test_cases?.[0]?.input);
  return Array.isArray(parsed) ? parsed : [];
};

const createStep = ({ line, label, detail, state }) => ({
  line,
  label,
  detail,
  state,
});

const buildFallbackTrace = (problem, code) => {
  const inputs = getPrimaryInput(problem);
  return {
    algorithm: 'Guided Replay',
    structure: Array.isArray(inputs[0]) ? 'Array' : 'Execution State',
    code: code || problem?.starter_code || '',
    steps: [
      createStep({
        line: 1,
        label: 'Load sample input',
        detail: 'Start from the first example test case so the learner can connect code and data.',
        state: { kind: 'summary', inputs, metrics: [] },
      }),
      createStep({
        line: 2,
        label: 'Walk through the logic',
        detail: 'This problem does not have a specialized tracer yet, so the panel stays focused on the sample data and expected outcome.',
        state: { kind: 'summary', inputs, metrics: [] },
      }),
    ],
  };
};

const traceTwoSum = (problem) => {
  const [nums = [], target] = getPrimaryInput(problem);
  const seen = {};
  const steps = [
    createStep({
      line: 1,
      label: 'Initialize lookup',
      detail: `Target is ${target}. We will store each number's index in a hash map while scanning the array once.`,
      state: {
        kind: 'array-map',
        array: cloneArray(nums),
        activeIndex: null,
        comparisonIndexes: [],
        foundIndexes: [],
        mapEntries: [],
        metrics: [
          { label: 'target', value: String(target) },
          { label: 'seen size', value: '0' },
        ],
      },
    }),
  ];

  for (let i = 0; i < nums.length; i += 1) {
    const value = nums[i];
    const complement = target - value;
    const matchIndex = seen[complement];

    steps.push(
      createStep({
        line: 3,
        label: `Inspect index ${i}`,
        detail: `Value ${value} needs complement ${complement}. Check whether ${complement} is already in the map.`,
        state: {
          kind: 'array-map',
          array: cloneArray(nums),
          activeIndex: i,
          comparisonIndexes: [],
          foundIndexes: matchIndex !== undefined ? [matchIndex, i] : [],
          mapEntries: Object.entries(seen).map(([key, index]) => ({ key, value: index })),
          metrics: [
            { label: 'current', value: String(value) },
            { label: 'complement', value: String(complement) },
          ],
        },
      })
    );

    if (matchIndex !== undefined) {
      steps.push(
        createStep({
          line: 5,
          label: 'Match found',
          detail: `The map already contains ${complement} at index ${matchIndex}, so the answer is [${matchIndex}, ${i}].`,
          state: {
            kind: 'array-map',
            array: cloneArray(nums),
            activeIndex: i,
            comparisonIndexes: [matchIndex, i],
            foundIndexes: [matchIndex, i],
            mapEntries: Object.entries(seen).map(([key, index]) => ({ key, value: index })),
            metrics: [
              { label: 'answer', value: `[${matchIndex}, ${i}]` },
              { label: 'target', value: String(target) },
            ],
          },
        })
      );

      return {
        algorithm: 'Two Sum',
        structure: 'Array + Hash Map',
        code: problem?.solution_code || problem?.starter_code || '',
        steps,
      };
    }

    seen[value] = i;
    steps.push(
      createStep({
        line: 7,
        label: 'Store current value',
        detail: `No match yet, so save ${value} -> ${i} in the map for later comparisons.`,
        state: {
          kind: 'array-map',
          array: cloneArray(nums),
          activeIndex: i,
          comparisonIndexes: [],
          foundIndexes: [],
          mapEntries: Object.entries(seen).map(([key, index]) => ({ key, value: index })),
          metrics: [
            { label: 'stored key', value: String(value) },
            { label: 'seen size', value: String(Object.keys(seen).length) },
          ],
        },
      })
    );
  }

  return {
    algorithm: 'Two Sum',
    structure: 'Array + Hash Map',
    code: problem?.solution_code || problem?.starter_code || '',
    steps,
  };
};

const traceBinarySearch = (problem, insertMode = false) => {
  const [nums = [], target] = getPrimaryInput(problem);
  let left = 0;
  let right = insertMode ? nums.length : nums.length - 1;
  const steps = [
    createStep({
      line: 1,
      label: 'Initialize bounds',
      detail: `Search in sorted array for ${target} using left and right pointers.`,
      state: {
        kind: 'binary-search',
        array: cloneArray(nums),
        left,
        right,
        mid: null,
        foundIndex: null,
        metrics: [
          { label: 'target', value: String(target) },
          { label: 'window', value: `${left}..${right}` },
        ],
      },
    }),
  ];

  while (insertMode ? left < right : left <= right) {
    const mid = Math.floor((left + right) / 2);

    steps.push(
      createStep({
        line: 4,
        label: `Check middle index ${mid}`,
        detail: `nums[${mid}] = ${nums[mid]}. Compare it with target ${target}.`,
        state: {
          kind: 'binary-search',
          array: cloneArray(nums),
          left,
          right,
          mid,
          foundIndex: null,
          metrics: [
            { label: 'mid value', value: String(nums[mid]) },
            { label: 'window', value: `${left}..${right}` },
          ],
        },
      })
    );

    if (nums[mid] === target) {
      steps.push(
        createStep({
          line: 5,
          label: 'Target found',
          detail: `The middle value matches the target, so return index ${mid}.`,
          state: {
            kind: 'binary-search',
            array: cloneArray(nums),
            left,
            right,
            mid,
            foundIndex: mid,
            metrics: [
              { label: 'result', value: String(mid) },
              { label: 'target', value: String(target) },
            ],
          },
        })
      );

      return {
        algorithm: insertMode ? 'Search Insert Position' : 'Binary Search',
        structure: 'Sorted Array',
        code: problem?.solution_code || problem?.starter_code || '',
        steps,
      };
    }

    if (nums[mid] < target) {
      left = mid + 1;
      steps.push(
        createStep({
          line: 7,
          label: 'Move left bound',
          detail: `Since ${nums[mid]} is smaller than ${target}, discard the left half and move left to ${left}.`,
          state: {
            kind: 'binary-search',
            array: cloneArray(nums),
            left,
            right,
            mid,
            foundIndex: null,
            metrics: [
              { label: 'next window', value: `${left}..${right}` },
              { label: 'reason', value: 'mid < target' },
            ],
          },
        })
      );
    } else {
      right = insertMode ? mid : mid - 1;
      steps.push(
        createStep({
          line: 9,
          label: 'Move right bound',
          detail: `Since ${nums[mid]} is not smaller than ${target}, shrink the window from the right side.`,
          state: {
            kind: 'binary-search',
            array: cloneArray(nums),
            left,
            right,
            mid,
            foundIndex: null,
            metrics: [
              { label: 'next window', value: `${left}..${right}` },
              { label: 'reason', value: insertMode ? 'mid >= target' : 'mid > target' },
            ],
          },
        })
      );
    }
  }

  const finalValue = insertMode ? left : -1;
  steps.push(
    createStep({
      line: 11,
      label: insertMode ? 'Return insert index' : 'Target missing',
      detail: insertMode
        ? `The search window collapsed, so ${left} is the insertion position.`
        : 'The search window is empty, so the target is not present.',
      state: {
        kind: 'binary-search',
        array: cloneArray(nums),
        left,
        right,
        mid: null,
        foundIndex: insertMode ? left : null,
        metrics: [
          { label: 'result', value: String(finalValue) },
          { label: 'target', value: String(target) },
        ],
      },
    })
  );

  return {
    algorithm: insertMode ? 'Search Insert Position' : 'Binary Search',
    structure: 'Sorted Array',
    code: problem?.solution_code || problem?.starter_code || '',
    steps,
  };
};

const traceMaxProfit = (problem) => {
  const [prices = []] = getPrimaryInput(problem);
  let minPrice = Infinity;
  let bestProfit = 0;
  const steps = [
    createStep({
      line: 1,
      label: 'Initialize best trade',
      detail: 'Track the cheapest buy price so far and the best profit we can make.',
      state: {
        kind: 'profit',
        array: cloneArray(prices),
        activeIndex: null,
        buyIndex: null,
        sellIndex: null,
        metrics: [
          { label: 'min price', value: 'inf' },
          { label: 'best profit', value: '0' },
        ],
      },
    }),
  ];

  let buyIndex = null;
  let sellIndex = null;

  prices.forEach((price, index) => {
    if (price < minPrice) {
      minPrice = price;
      buyIndex = index;
    }

    const candidate = price - minPrice;
    if (candidate > bestProfit) {
      bestProfit = candidate;
      sellIndex = index;
    }

    steps.push(
      createStep({
        line: 4,
        label: `Review day ${index}`,
        detail: `Price ${price}. Cheapest buy so far is ${minPrice}, so selling today gives profit ${candidate}.`,
        state: {
          kind: 'profit',
          array: cloneArray(prices),
          activeIndex: index,
          buyIndex,
          sellIndex,
          metrics: [
            { label: 'today', value: String(price) },
            { label: 'best profit', value: String(bestProfit) },
          ],
        },
      })
    );
  });

  return {
    algorithm: 'Best Time to Buy and Sell Stock',
    structure: 'Array',
    code: problem?.solution_code || problem?.starter_code || '',
    steps,
  };
};

export const generateDsaTrace = (problem, code = '') => {
  if (!problem) {
    return null;
  }

  const title = (problem.title || '').toLowerCase();
  const tracer =
    title.includes('two sum') ? traceTwoSum :
    title === 'binary search' ? ((item) => traceBinarySearch(item, false)) :
    title.includes('search insert') ? ((item) => traceBinarySearch(item, true)) :
    title.includes('buy and sell stock') ? traceMaxProfit :
    null;

  if (!tracer) {
    return buildFallbackTrace(problem, code);
  }

  return tracer(problem, code);
};

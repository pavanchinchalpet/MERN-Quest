# Judge Architecture

## Request Flow

Frontend -> `POST /api/practices/submit` -> `codingPracticeController` -> `executionService` -> language executor -> per-test results -> submission persistence -> frontend

## Core Judge Contract

Every executor returns:

```json
{
  "success": true,
  "status": "Accepted",
  "runtime": 12,
  "passedCount": 2,
  "totalCount": 2,
  "results": [
    {
      "index": 0,
      "input": "[[2,7,11,15], 9]",
      "expected": [0, 1],
      "actual": [1, 0],
      "passed": true,
      "runtime": 1,
      "debug": [
        "Input: [[2,7,11,15],9]",
        "Output: [1,0]",
        "Expected: [0,1]"
      ],
      "logs": []
    }
  ],
  "userLogs": []
}
```

## Input and Output Rules

- Inputs are parsed with `JSON.parse` first.
- Legacy single-quoted data is supported as a fallback for older seeded problems.
- Expected values may come from `expected` or `output`.
- Strings are compared directly.
- Numbers use a small tolerance for floating point answers.
- Primitive arrays can pass even when order differs, matching problems like Two Sum.
- Objects are compared recursively by keys and values.

## Language Execution

- JavaScript: isolated worker thread plus `vm` sandbox, hard timeout at the worker level.
- Python: separate child process that loads a payload file, captures stdout/stderr, and returns structured JSON.
- Java: generated `Solution.java` wrapper compiles the submitted method, converts JSON arguments to Java types, and returns structured JSON.
- SQL: transaction per test case with rollback after each run.

## Production Deployment Pattern

For local development, the current implementation runs executors in-process or as local child processes.

For production, use the same API contract with a dedicated execution tier:

1. API receives `Run` or `Submit`.
2. API stores a job and publishes it to a queue.
3. Worker pulls the job and starts a Docker sandbox with:
   - `--network none`
   - CPU and memory limits
   - read-only filesystem except a temporary workspace
   - strict wall-clock timeout
4. Worker posts structured results back to the API.
5. API persists the submission and sends the final verdict to the frontend.

## Security Checklist

- Timeout every execution.
- Run untrusted code in isolated processes or containers.
- Disable outbound networking in the sandbox.
- Limit memory and CPU.
- Keep the filesystem ephemeral for each job.
- Store hidden test cases separately from sample test cases.

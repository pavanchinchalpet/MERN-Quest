import io
import json
import sys
import time
import ast
import contextlib


def normalize_value(value):
    if value is None or isinstance(value, (str, int, float, bool)):
        return value

    if isinstance(value, dict):
        return {str(key): normalize_value(item) for key, item in value.items()}

    if isinstance(value, (list, tuple, set)):
        return [normalize_value(item) for item in value]

    return str(value)


def compare_values(actual, expected, comparison):
    ignore_order = comparison.get("ignoreOrder", False)
    tolerance = comparison.get("numericTolerance", 1e-9)
    trim_strings = comparison.get("trimStrings", False)

    if isinstance(actual, str) and isinstance(expected, str):
        return actual.strip() == expected.strip() if trim_strings else actual == expected

    if isinstance(actual, (int, float)) and isinstance(expected, (int, float)):
        return abs(float(actual) - float(expected)) <= tolerance

    if isinstance(actual, list) and isinstance(expected, list):
        if len(actual) != len(expected):
            return False

        exact = all(compare_values(left, right, comparison) for left, right in zip(actual, expected))
        if exact:
            return True

        if ignore_order or all(isinstance(item, (str, int, float, bool, type(None))) for item in actual + expected):
            left = sorted(f"{type(item).__name__}:{item}" for item in actual)
            right = sorted(f"{type(item).__name__}:{item}" for item in expected)
            return left == right

        return False

    if isinstance(actual, dict) and isinstance(expected, dict):
        return actual == expected

    return actual == expected


def find_function_name(source):
    module = ast.parse(source)
    for node in module.body:
        if isinstance(node, ast.FunctionDef):
            return node.name
    raise RuntimeError("No Python function found. Define a function such as 'def solution(...):'.")


def main():
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: pythonRunner.py <payload.json>\n")
        sys.exit(1)

    payload_path = sys.argv[1]
    with open(payload_path, "r", encoding="utf-8") as handle:
        payload = json.load(handle)

    namespace = {}
    exec(payload["code"], namespace)
    function_name = find_function_name(payload["code"])
    user_function = namespace.get(function_name)

    if not callable(user_function):
        raise RuntimeError(f"Function '{function_name}' is not callable")

    user_logs = []
    results = []
    started_at = time.time()

    for test_case in payload["testCases"]:
        stdout_buffer = io.StringIO()
        stderr_buffer = io.StringIO()
        case_started_at = time.time()

        try:
            with contextlib.redirect_stdout(stdout_buffer), contextlib.redirect_stderr(stderr_buffer):
                actual = user_function(*test_case["args"])

            normalized_actual = normalize_value(actual)
            normalized_expected = normalize_value(test_case["expected"])
            passed = compare_values(normalized_actual, normalized_expected, test_case["comparison"])

            case_logs = [line for line in stdout_buffer.getvalue().splitlines() if line]
            case_errors = [line for line in stderr_buffer.getvalue().splitlines() if line]
            all_logs = case_logs + case_errors
            user_logs.extend(all_logs)

            results.append({
                "index": test_case["index"],
                "input": test_case["rawInput"],
                "expected": normalized_expected,
                "actual": normalized_actual,
                "passed": passed,
                "runtime": int((time.time() - case_started_at) * 1000),
                "debug": [
                    f"Input: {json.dumps(test_case['args'])}",
                    f"Output: {json.dumps(normalized_actual)}",
                    f"Expected: {json.dumps(normalized_expected)}",
                ],
                "logs": all_logs,
            })
        except Exception as error:
            results.append({
                "index": test_case["index"],
                "input": test_case["rawInput"],
                "expected": normalize_value(test_case["expected"]),
                "actual": None,
                "passed": False,
                "runtime": int((time.time() - case_started_at) * 1000),
                "error": str(error),
                "debug": [
                    f"Input: {json.dumps(test_case['args'])}",
                    "Output: null",
                    f"Expected: {json.dumps(normalize_value(test_case['expected']))}",
                ],
                "logs": [],
            })

    output = {
        "runtime": int((time.time() - started_at) * 1000),
        "results": results,
        "userLogs": user_logs,
    }

    sys.stdout.write(json.dumps(output))


if __name__ == "__main__":
    main()

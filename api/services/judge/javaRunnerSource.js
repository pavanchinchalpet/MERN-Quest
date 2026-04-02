const buildJavaRunnerSource = (userCode) => `
import java.lang.reflect.Array;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Solution {
${userCode}

  public static void main(String[] args) throws Exception {
    String payload = Files.readString(Paths.get(args[0]), StandardCharsets.UTF_8);
    Object root = new MiniJsonParser(payload).parse();
    Map<?, ?> rootMap = (Map<?, ?>) root;
    List<?> testCases = (List<?>) rootMap.get("testCases");

    Method entryPoint = null;
    for (Method method : Solution.class.getDeclaredMethods()) {
      if (!method.getName().equals("main")) {
        entryPoint = method;
        break;
      }
    }

    if (entryPoint == null) {
      throw new IllegalStateException("No solution method found");
    }

    Object instance = Modifier.isStatic(entryPoint.getModifiers()) ? null : new Solution();
    entryPoint.setAccessible(true);

    List<Object> results = new ArrayList<>();
    long startedAt = System.currentTimeMillis();

    for (Object caseObject : testCases) {
      Map<?, ?> testCase = (Map<?, ?>) caseObject;
      List<?> rawArgs = (List<?>) testCase.get("args");
      Class<?>[] parameterTypes = entryPoint.getParameterTypes();
      Object[] invocationArgs = new Object[parameterTypes.length];

      for (int i = 0; i < parameterTypes.length; i++) {
        invocationArgs[i] = convertValue(rawArgs.get(i), parameterTypes[i]);
      }

      Map<String, Object> caseResult = new LinkedHashMap<>();
      caseResult.put("index", ((Number) testCase.get("index")).intValue());
      caseResult.put("input", testCase.get("rawInput"));
      caseResult.put("expected", normalizeForJson(testCase.get("expected")));

      long caseStartedAt = System.currentTimeMillis();

      try {
        Object actual = entryPoint.invoke(instance, invocationArgs);
        Object normalizedActual = normalizeForJson(actual);
        Object normalizedExpected = normalizeForJson(testCase.get("expected"));
        boolean passed = compareValues(
          normalizedActual,
          normalizedExpected,
          (Map<?, ?>) testCase.get("comparison")
        );

        caseResult.put("actual", normalizedActual);
        caseResult.put("passed", passed);
      } catch (Exception error) {
        Throwable cause = error.getCause() != null ? error.getCause() : error;
        caseResult.put("actual", null);
        caseResult.put("passed", false);
        caseResult.put("error", cause.getMessage());
      }

      caseResult.put("runtime", System.currentTimeMillis() - caseStartedAt);
      List<String> debug = new ArrayList<>();
      debug.add("Input: " + MiniJsonWriter.write(testCase.get("args")));
      debug.add("Output: " + MiniJsonWriter.write(caseResult.get("actual")));
      debug.add("Expected: " + MiniJsonWriter.write(caseResult.get("expected")));
      caseResult.put("debug", debug);
      caseResult.put("logs", Collections.emptyList());
      results.add(caseResult);
    }

    Map<String, Object> output = new LinkedHashMap<>();
    output.put("runtime", System.currentTimeMillis() - startedAt);
    output.put("results", results);
    output.put("userLogs", Collections.emptyList());
    System.out.print(MiniJsonWriter.write(output));
  }

  private static Object normalizeForJson(Object value) {
    if (value == null || value instanceof String || value instanceof Number || value instanceof Boolean) {
      return value;
    }

    if (value.getClass().isArray()) {
      int length = Array.getLength(value);
      List<Object> values = new ArrayList<>();
      for (int i = 0; i < length; i++) {
        values.add(normalizeForJson(Array.get(value, i)));
      }
      return values;
    }

    if (value instanceof Iterable) {
      List<Object> values = new ArrayList<>();
      for (Object item : (Iterable<?>) value) {
        values.add(normalizeForJson(item));
      }
      return values;
    }

    if (value instanceof Map) {
      Map<String, Object> normalized = new LinkedHashMap<>();
      for (Map.Entry<?, ?> entry : ((Map<?, ?>) value).entrySet()) {
        normalized.put(String.valueOf(entry.getKey()), normalizeForJson(entry.getValue()));
      }
      return normalized;
    }

    return String.valueOf(value);
  }

  private static boolean compareValues(Object actual, Object expected, Map<?, ?> comparison) {
    boolean ignoreOrder = comparison != null && Boolean.TRUE.equals(comparison.get("ignoreOrder"));
    double tolerance = 1e-9;
    if (comparison != null && comparison.get("numericTolerance") instanceof Number) {
      tolerance = ((Number) comparison.get("numericTolerance")).doubleValue();
    }

    if (actual instanceof String && expected instanceof String) {
      return actual.equals(expected);
    }

    if (actual instanceof Number && expected instanceof Number) {
      return Math.abs(((Number) actual).doubleValue() - ((Number) expected).doubleValue()) <= tolerance;
    }

    if (actual instanceof List && expected instanceof List) {
      List<?> left = (List<?>) actual;
      List<?> right = (List<?>) expected;
      if (left.size() != right.size()) {
        return false;
      }

      boolean exact = true;
      for (int i = 0; i < left.size(); i++) {
        if (!compareValues(left.get(i), right.get(i), comparison)) {
          exact = false;
          break;
        }
      }
      if (exact) {
        return true;
      }

      if (ignoreOrder || (isPrimitiveList(left) && isPrimitiveList(right))) {
        List<String> leftValues = new ArrayList<>();
        List<String> rightValues = new ArrayList<>();
        for (Object value : left) {
          leftValues.add(typeTaggedValue(value));
        }
        for (Object value : right) {
          rightValues.add(typeTaggedValue(value));
        }
        Collections.sort(leftValues);
        Collections.sort(rightValues);
        return leftValues.equals(rightValues);
      }

      return false;
    }

    if (actual instanceof Map && expected instanceof Map) {
      return actual.equals(expected);
    }

    return actual == null ? expected == null : actual.equals(expected);
  }

  private static boolean isPrimitiveList(List<?> values) {
    for (Object value : values) {
      if (!(value == null || value instanceof String || value instanceof Number || value instanceof Boolean)) {
        return false;
      }
    }
    return true;
  }

  private static String typeTaggedValue(Object value) {
    if (value == null) {
      return "null:null";
    }
    return value.getClass().getSimpleName() + ":" + String.valueOf(value);
  }

  private static Object convertValue(Object value, Class<?> targetType) {
    if (value == null) {
      return null;
    }

    if (targetType == String.class) {
      return String.valueOf(value);
    }

    if (targetType == int.class || targetType == Integer.class) {
      return ((Number) value).intValue();
    }

    if (targetType == long.class || targetType == Long.class) {
      return ((Number) value).longValue();
    }

    if (targetType == double.class || targetType == Double.class) {
      return ((Number) value).doubleValue();
    }

    if (targetType == float.class || targetType == Float.class) {
      return ((Number) value).floatValue();
    }

    if (targetType == boolean.class || targetType == Boolean.class) {
      return (Boolean) value;
    }

    if (targetType.isArray()) {
      List<?> source = (List<?>) value;
      Class<?> componentType = targetType.getComponentType();
      Object array = Array.newInstance(componentType, source.size());
      for (int i = 0; i < source.size(); i++) {
        Array.set(array, i, convertValue(source.get(i), componentType));
      }
      return array;
    }

    if (List.class.isAssignableFrom(targetType)) {
      return value;
    }

    return value;
  }
}

class MiniJsonWriter {
  public static String write(Object value) {
    if (value == null) {
      return "null";
    }

    if (value instanceof String) {
      return "\\"" + escape((String) value) + "\\"";
    }

    if (value instanceof Number || value instanceof Boolean) {
      return String.valueOf(value);
    }

    if (value instanceof Map) {
      StringBuilder builder = new StringBuilder("{");
      boolean first = true;
      for (Map.Entry<?, ?> entry : ((Map<?, ?>) value).entrySet()) {
        if (!first) {
          builder.append(",");
        }
        builder.append(write(String.valueOf(entry.getKey())));
        builder.append(":");
        builder.append(write(entry.getValue()));
        first = false;
      }
      builder.append("}");
      return builder.toString();
    }

    if (value instanceof Iterable) {
      StringBuilder builder = new StringBuilder("[");
      boolean first = true;
      for (Object item : (Iterable<?>) value) {
        if (!first) {
          builder.append(",");
        }
        builder.append(write(item));
        first = false;
      }
      builder.append("]");
      return builder.toString();
    }

    return write(String.valueOf(value));
  }

  private static String escape(String value) {
    return value
      .replace("\\\\", "\\\\\\\\")
      .replace("\\"", "\\\\\\"")
      .replace("\\n", "\\\\n")
      .replace("\\r", "\\\\r")
      .replace("\\t", "\\\\t");
  }
}

class MiniJsonParser {
  private final String text;
  private int index = 0;

  MiniJsonParser(String text) {
    this.text = text;
  }

  Object parse() {
    skipWhitespace();
    Object value = parseValue();
    skipWhitespace();
    return value;
  }

  private Object parseValue() {
    skipWhitespace();
    char current = text.charAt(index);
    if (current == '{') {
      return parseObject();
    }
    if (current == '[') {
      return parseArray();
    }
    if (current == '"') {
      return parseString();
    }
    if (current == 't' || current == 'f') {
      return parseBoolean();
    }
    if (current == 'n') {
      index += 4;
      return null;
    }
    return parseNumber();
  }

  private Map<String, Object> parseObject() {
    Map<String, Object> values = new LinkedHashMap<>();
    index++;
    skipWhitespace();
    if (text.charAt(index) == '}') {
      index++;
      return values;
    }
    while (true) {
      String key = parseString();
      skipWhitespace();
      index++;
      Object value = parseValue();
      values.put(key, value);
      skipWhitespace();
      char current = text.charAt(index++);
      if (current == '}') {
        break;
      }
    }
    return values;
  }

  private List<Object> parseArray() {
    List<Object> values = new ArrayList<>();
    index++;
    skipWhitespace();
    if (text.charAt(index) == ']') {
      index++;
      return values;
    }
    while (true) {
      values.add(parseValue());
      skipWhitespace();
      char current = text.charAt(index++);
      if (current == ']') {
        break;
      }
    }
    return values;
  }

  private String parseString() {
    StringBuilder builder = new StringBuilder();
    index++;
    while (index < text.length()) {
      char current = text.charAt(index++);
      if (current == '"') {
        break;
      }
      if (current == '\\\\') {
        char escaped = text.charAt(index++);
        switch (escaped) {
          case '"':
            builder.append('"');
            break;
          case '\\\\':
            builder.append('\\\\');
            break;
          case '/':
            builder.append('/');
            break;
          case 'b':
            builder.append('\\b');
            break;
          case 'f':
            builder.append('\\f');
            break;
          case 'n':
            builder.append('\\n');
            break;
          case 'r':
            builder.append('\\r');
            break;
          case 't':
            builder.append('\\t');
            break;
          case 'u':
            String hex = text.substring(index, index + 4);
            builder.append((char) Integer.parseInt(hex, 16));
            index += 4;
            break;
          default:
            builder.append(escaped);
        }
      } else {
        builder.append(current);
      }
    }
    return builder.toString();
  }

  private Boolean parseBoolean() {
    if (text.startsWith("true", index)) {
      index += 4;
      return Boolean.TRUE;
    }
    index += 5;
    return Boolean.FALSE;
  }

  private Number parseNumber() {
    int start = index;
    while (index < text.length()) {
      char current = text.charAt(index);
      if ((current >= '0' && current <= '9') || current == '-' || current == '+' || current == '.' || current == 'e' || current == 'E') {
        index++;
      } else {
        break;
      }
    }
    String raw = text.substring(start, index);
    if (raw.contains(".") || raw.contains("e") || raw.contains("E")) {
      return Double.parseDouble(raw);
    }
    return Long.parseLong(raw);
  }

  private void skipWhitespace() {
    while (index < text.length() && Character.isWhitespace(text.charAt(index))) {
      index++;
    }
  }
}
`;

module.exports = { buildJavaRunnerSource };

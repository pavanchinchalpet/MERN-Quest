const normalizeLineEndings = (value) => String(value || '').replace(/\r\n/g, '\n');

const stripPublicClassModifiers = (source) => source
  .replace(/\bpublic\s+((?:final|abstract)\s+)?class\s+/g, (_, modifier = '') => `${modifier}class `)
  .replace(/\bpublic\s+((?:final|abstract)\s+)?interface\s+/g, (_, modifier = '') => `${modifier}interface `)
  .replace(/\bpublic\s+((?:final|abstract)\s+)?enum\s+/g, (_, modifier = '') => `${modifier}enum `);

const buildUserJavaSource = (rawUserCode) => {
  const normalized = normalizeLineEndings(rawUserCode).trim();

  if (!normalized) {
    throw new Error('Java submission is empty.');
  }

  const classMatch = normalized.match(/\bclass\s+([A-Za-z_]\w*)\b/);

  if (!classMatch) {
    return {
      targetClassName: 'UserSolution',
      userSource: `class UserSolution {\n${normalized}\n}`,
    };
  }

  let rewritten = stripPublicClassModifiers(normalized);
  let targetClassName = classMatch[1];

  if (targetClassName === 'Main') {
    rewritten = rewritten.replace(/\bMain\b/g, 'UserMain');
    targetClassName = 'UserMain';
  }

  return {
    targetClassName,
    userSource: rewritten,
  };
};

const buildJavaRunnerSource = (userCode) => {
  const { targetClassName, userSource } = buildUserJavaSource(userCode);

  return `
import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.lang.reflect.Array;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

${userSource}

public class Main {
  private static final String TARGET_CLASS_NAME = "${targetClassName}";

  public static void main(String[] args) throws Exception {
    if (args.length == 0) {
      throw new IllegalArgumentException("Payload path argument is required");
    }

    String payload = Files.readString(Paths.get(args[0]), StandardCharsets.UTF_8);
    Object root = new MiniJsonParser(payload).parse();
    if (!(root instanceof Map)) {
      throw new IllegalStateException("Payload root must be a JSON object");
    }

    Map<?, ?> rootMap = (Map<?, ?>) root;
    List<?> testCases = rootMap.get("testCases") instanceof List
      ? (List<?>) rootMap.get("testCases")
      : Collections.emptyList();

    Class<?> targetClass = Class.forName(TARGET_CLASS_NAME);
    Method entryPoint = __judgeFindEntryPoint(targetClass);
    boolean useMainMethod = entryPoint.getName().equals("main") && Arrays.equals(
      entryPoint.getParameterTypes(),
      new Class<?>[] { String[].class }
    );

    Object instance = null;
    if (!Modifier.isStatic(entryPoint.getModifiers())) {
      instance = targetClass.getDeclaredConstructor().newInstance();
    }
    entryPoint.setAccessible(true);

    List<Object> results = new ArrayList<>();
    List<String> userLogs = new ArrayList<>();
    long startedAt = System.currentTimeMillis();

    for (Object caseObject : testCases) {
      Map<?, ?> testCase = (Map<?, ?>) caseObject;
      Map<String, Object> caseResult = new LinkedHashMap<>();
      caseResult.put("index", ((Number) testCase.get("index")).intValue());
      caseResult.put("input", testCase.get("rawInput"));

      Object normalizedExpected = __judgeNormalizeValue(testCase.get("expected"));
      caseResult.put("expected", normalizedExpected);

      long caseStartedAt = System.currentTimeMillis();
      List<String> logs = new ArrayList<>();
      Object actualForJson = null;
      boolean passed = false;
      String errorMessage = null;

      PrintStream originalOut = System.out;
      PrintStream originalErr = System.err;
      ByteArrayOutputStream stdoutBuffer = new ByteArrayOutputStream();
      ByteArrayOutputStream stderrBuffer = new ByteArrayOutputStream();
      PrintStream capturedOut = new PrintStream(stdoutBuffer, true, StandardCharsets.UTF_8);
      PrintStream capturedErr = new PrintStream(stderrBuffer, true, StandardCharsets.UTF_8);

      try {
        System.setOut(capturedOut);
        System.setErr(capturedErr);

        Object invocationResult;
        if (useMainMethod) {
          List<?> rawArgs = testCase.get("args") instanceof List ? (List<?>) testCase.get("args") : Collections.emptyList();
          String[] mainArgs = new String[rawArgs.size()];
          for (int index = 0; index < rawArgs.size(); index += 1) {
            Object rawArg = rawArgs.get(index);
            mainArgs[index] = rawArg == null ? "null" : MiniJsonWriter.write(rawArg);
          }
          invocationResult = entryPoint.invoke(instance, new Object[] { mainArgs });
        } else {
          invocationResult = __judgeInvokeSolution(entryPoint, instance, testCase);
        }

        capturedOut.flush();
        capturedErr.flush();

        logs.addAll(__judgeCollectLogs(stdoutBuffer.toString(StandardCharsets.UTF_8)));
        logs.addAll(__judgeCollectLogs(stderrBuffer.toString(StandardCharsets.UTF_8)));
        userLogs.addAll(logs);

        Object rawActual = invocationResult;
        if (entryPoint.getReturnType() == Void.TYPE) {
          rawActual = __judgeNormalizeConsoleOutput(stdoutBuffer.toString(StandardCharsets.UTF_8));
        }

        actualForJson = __judgeNormalizeValue(rawActual);
        passed = __judgeCompareValues(actualForJson, normalizedExpected, (Map<?, ?>) testCase.get("comparison"));
      } catch (Exception error) {
        capturedOut.flush();
        capturedErr.flush();

        logs.addAll(__judgeCollectLogs(stdoutBuffer.toString(StandardCharsets.UTF_8)));
        logs.addAll(__judgeCollectLogs(stderrBuffer.toString(StandardCharsets.UTF_8)));
        userLogs.addAll(logs);

        Throwable cause = error.getCause() != null ? error.getCause() : error;
        errorMessage = cause.getMessage() != null && !cause.getMessage().isEmpty()
          ? cause.getMessage()
          : cause.toString();
      } finally {
        System.setOut(originalOut);
        System.setErr(originalErr);
        capturedOut.close();
        capturedErr.close();
      }

      caseResult.put("actual", actualForJson);
      caseResult.put("passed", passed);
      caseResult.put("runtime", System.currentTimeMillis() - caseStartedAt);
      if (errorMessage != null) {
        caseResult.put("error", errorMessage);
      }

      List<String> debug = new ArrayList<>();
      debug.add("Input: " + MiniJsonWriter.write(testCase.get("args")));
      debug.add("Output: " + MiniJsonWriter.write(actualForJson));
      debug.add("Expected: " + MiniJsonWriter.write(normalizedExpected));
      caseResult.put("debug", debug);
      caseResult.put("logs", logs);
      results.add(caseResult);
    }

    Map<String, Object> output = new LinkedHashMap<>();
    output.put("runtime", System.currentTimeMillis() - startedAt);
    output.put("results", results);
    output.put("userLogs", userLogs);
    System.out.print(MiniJsonWriter.write(output));
  }

  private static Method __judgeFindEntryPoint(Class<?> targetClass) {
    Method fallbackMain = null;

    for (Method method : targetClass.getDeclaredMethods()) {
      if (method.isSynthetic() || method.isBridge()) {
        continue;
      }

      if (method.getName().startsWith("__judge")) {
        continue;
      }

      if (
        method.getName().equals("main")
        && Modifier.isStatic(method.getModifiers())
        && Arrays.equals(method.getParameterTypes(), new Class<?>[] { String[].class })
      ) {
        fallbackMain = method;
        continue;
      }

      return method;
    }

    if (fallbackMain != null) {
      return fallbackMain;
    }

    throw new IllegalStateException("No callable Java method found. Define a method or a main(String[] args) entry point.");
  }

  private static Object __judgeInvokeSolution(Method entryPoint, Object instance, Map<?, ?> testCase) throws Exception {
    List<?> rawArgs = testCase.get("args") instanceof List ? (List<?>) testCase.get("args") : Collections.emptyList();
    Type[] genericParameterTypes = entryPoint.getGenericParameterTypes();
    Class<?>[] parameterTypes = entryPoint.getParameterTypes();

    if (rawArgs.size() != parameterTypes.length) {
      throw new IllegalArgumentException(
        "Expected " + parameterTypes.length + " arguments but received " + rawArgs.size()
      );
    }

    Object[] invocationArgs = new Object[parameterTypes.length];
    for (int index = 0; index < parameterTypes.length; index += 1) {
      invocationArgs[index] = __judgeConvertValue(
        rawArgs.get(index),
        parameterTypes[index],
        genericParameterTypes[index]
      );
    }

    return entryPoint.invoke(instance, invocationArgs);
  }

  private static Object __judgeConvertValue(Object value, Class<?> targetType, Type genericType) {
    if (value == null) {
      if (targetType.isPrimitive()) {
        throw new IllegalArgumentException("Cannot assign null to primitive type " + targetType.getSimpleName());
      }
      return null;
    }

    if (targetType == Object.class) {
      return value;
    }

    if (targetType == String.class) {
      return String.valueOf(value);
    }

    if (targetType == char.class || targetType == Character.class) {
      String raw = String.valueOf(value);
      if (raw.isEmpty()) {
        throw new IllegalArgumentException("Cannot convert empty value to char");
      }
      return raw.charAt(0);
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

    if (targetType == short.class || targetType == Short.class) {
      return ((Number) value).shortValue();
    }

    if (targetType == byte.class || targetType == Byte.class) {
      return ((Number) value).byteValue();
    }

    if (targetType == boolean.class || targetType == Boolean.class) {
      return (Boolean) value;
    }

    if (targetType.isEnum()) {
      @SuppressWarnings("unchecked")
      Class<? extends Enum> enumType = (Class<? extends Enum>) targetType;
      return Enum.valueOf(enumType, String.valueOf(value));
    }

    if (targetType.isArray()) {
      if (!(value instanceof List)) {
        throw new IllegalArgumentException("Expected JSON array for " + targetType.getSimpleName());
      }

      List<?> source = (List<?>) value;
      Class<?> componentType = targetType.getComponentType();
      Object array = Array.newInstance(componentType, source.size());
      for (int index = 0; index < source.size(); index += 1) {
        Array.set(array, index, __judgeConvertValue(source.get(index), componentType, componentType));
      }
      return array;
    }

    if (List.class.isAssignableFrom(targetType) || Set.class.isAssignableFrom(targetType)) {
      if (!(value instanceof List)) {
        throw new IllegalArgumentException("Expected JSON array for collection parameter");
      }

      Type elementType = Object.class;
      if (genericType instanceof ParameterizedType) {
        elementType = ((ParameterizedType) genericType).getActualTypeArguments()[0];
      }

      List<Object> converted = new ArrayList<>();
      for (Object item : (List<?>) value) {
        converted.add(__judgeConvertValue(item, __judgeRawClass(elementType), elementType));
      }

      if (Set.class.isAssignableFrom(targetType)) {
        return new LinkedHashSet<>(converted);
      }
      return converted;
    }

    if (Map.class.isAssignableFrom(targetType)) {
      if (!(value instanceof Map)) {
        throw new IllegalArgumentException("Expected JSON object for map parameter");
      }

      Type keyType = Object.class;
      Type valueType = Object.class;
      if (genericType instanceof ParameterizedType) {
        Type[] genericTypes = ((ParameterizedType) genericType).getActualTypeArguments();
        keyType = genericTypes[0];
        valueType = genericTypes[1];
      }

      Map<Object, Object> converted = new LinkedHashMap<>();
      for (Map.Entry<?, ?> entry : ((Map<?, ?>) value).entrySet()) {
        Object convertedKey = __judgeConvertValue(entry.getKey(), __judgeRawClass(keyType), keyType);
        Object convertedValue = __judgeConvertValue(entry.getValue(), __judgeRawClass(valueType), valueType);
        converted.put(convertedKey, convertedValue);
      }
      return converted;
    }

    return value;
  }

  private static Class<?> __judgeRawClass(Type type) {
    if (type instanceof Class<?>) {
      return (Class<?>) type;
    }

    if (type instanceof ParameterizedType) {
      return (Class<?>) ((ParameterizedType) type).getRawType();
    }

    return Object.class;
  }

  private static Object __judgeNormalizeConsoleOutput(String stdout) {
    List<String> lines = __judgeCollectLogs(stdout);
    if (lines.isEmpty()) {
      return null;
    }

    if (lines.size() == 1) {
      return __judgeMaybeParseLiteral(lines.get(0));
    }

    List<Object> values = new ArrayList<>();
    for (String line : lines) {
      values.add(__judgeMaybeParseLiteral(line));
    }
    return values;
  }

  private static Object __judgeMaybeParseLiteral(String raw) {
    String trimmed = raw == null ? "" : raw.trim();
    if (trimmed.isEmpty()) {
      return "";
    }

    try {
      return new MiniJsonParser(trimmed).parse();
    } catch (Exception error) {
      return raw;
    }
  }

  private static List<String> __judgeCollectLogs(String buffer) {
    List<String> logs = new ArrayList<>();
    if (buffer == null || buffer.isEmpty()) {
      return logs;
    }

    for (String line : buffer.split("\\\\R")) {
      if (line != null && !line.isEmpty()) {
        logs.add(line);
      }
    }

    return logs;
  }

  private static Object __judgeNormalizeValue(Object value) {
    if (value == null || value instanceof String || value instanceof Number || value instanceof Boolean) {
      return value;
    }

    if (value instanceof Character) {
      return String.valueOf(value);
    }

    if (value.getClass().isArray()) {
      int length = Array.getLength(value);
      List<Object> normalized = new ArrayList<>();
      for (int index = 0; index < length; index += 1) {
        normalized.add(__judgeNormalizeValue(Array.get(value, index)));
      }
      return normalized;
    }

    if (value instanceof Iterable) {
      List<Object> normalized = new ArrayList<>();
      for (Object item : (Iterable<?>) value) {
        normalized.add(__judgeNormalizeValue(item));
      }
      return normalized;
    }

    if (value instanceof Map) {
      List<String> keys = new ArrayList<>();
      for (Object key : ((Map<?, ?>) value).keySet()) {
        keys.add(String.valueOf(key));
      }
      Collections.sort(keys);

      Map<String, Object> normalized = new LinkedHashMap<>();
      for (String key : keys) {
        normalized.put(key, __judgeNormalizeValue(((Map<?, ?>) value).get(key)));
      }
      return normalized;
    }

    return String.valueOf(value);
  }

  private static boolean __judgeCompareValues(Object actual, Object expected, Map<?, ?> comparison) {
    boolean ignoreOrder = comparison != null && Boolean.TRUE.equals(comparison.get("ignoreOrder"));
    boolean trimStrings = comparison != null && Boolean.TRUE.equals(comparison.get("trimStrings"));
    double tolerance = 1e-9;

    if (comparison != null && comparison.get("numericTolerance") instanceof Number) {
      tolerance = ((Number) comparison.get("numericTolerance")).doubleValue();
    }

    if (actual instanceof String && expected instanceof String) {
      String left = (String) actual;
      String right = (String) expected;
      return trimStrings ? left.trim().equals(right.trim()) : left.equals(right);
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
      for (int index = 0; index < left.size(); index += 1) {
        if (!__judgeCompareValues(left.get(index), right.get(index), comparison)) {
          exact = false;
          break;
        }
      }

      if (exact) {
        return true;
      }

      if (ignoreOrder || (__judgeIsPrimitiveList(left) && __judgeIsPrimitiveList(right))) {
        List<String> leftValues = new ArrayList<>();
        List<String> rightValues = new ArrayList<>();

        for (Object item : left) {
          leftValues.add(__judgeTypeTaggedValue(item));
        }
        for (Object item : right) {
          rightValues.add(__judgeTypeTaggedValue(item));
        }

        Collections.sort(leftValues);
        Collections.sort(rightValues);
        return leftValues.equals(rightValues);
      }

      return false;
    }

    if (actual instanceof Map && expected instanceof Map) {
      Map<?, ?> left = (Map<?, ?>) actual;
      Map<?, ?> right = (Map<?, ?>) expected;

      if (left.size() != right.size()) {
        return false;
      }

      for (Map.Entry<?, ?> entry : left.entrySet()) {
        if (!right.containsKey(entry.getKey())) {
          return false;
        }

        if (!__judgeCompareValues(entry.getValue(), right.get(entry.getKey()), comparison)) {
          return false;
        }
      }

      return true;
    }

    return actual == null ? expected == null : actual.equals(expected);
  }

  private static boolean __judgeIsPrimitiveList(List<?> values) {
    for (Object value : values) {
      if (!__judgeIsPrimitiveValue(value)) {
        return false;
      }
    }
    return true;
  }

  private static boolean __judgeIsPrimitiveValue(Object value) {
    return value == null || value instanceof String || value instanceof Number || value instanceof Boolean;
  }

  private static String __judgeTypeTaggedValue(Object value) {
    if (value == null) {
      return "null:null";
    }

    return value.getClass().getSimpleName() + ":" + String.valueOf(value);
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

    if (value instanceof Character) {
      return write(String.valueOf(value));
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

    if (value.getClass().isArray()) {
      StringBuilder builder = new StringBuilder("[");
      int length = Array.getLength(value);
      for (int index = 0; index < length; index += 1) {
        if (index > 0) {
          builder.append(",");
        }
        builder.append(write(Array.get(value, index)));
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
    if (index != text.length()) {
      throw new IllegalStateException("Unexpected trailing JSON content at position " + index);
    }
    return value;
  }

  private Object parseValue() {
    skipWhitespace();
    if (index >= text.length()) {
      throw new IllegalStateException("Unexpected end of JSON input");
    }

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
      return parseNull();
    }
    return parseNumber();
  }

  private Map<String, Object> parseObject() {
    Map<String, Object> values = new LinkedHashMap<>();
    expect('{');
    skipWhitespace();

    if (peek('}')) {
      index += 1;
      return values;
    }

    while (true) {
      String key = parseString();
      skipWhitespace();
      expect(':');
      Object value = parseValue();
      values.put(key, value);
      skipWhitespace();

      if (peek('}')) {
        index += 1;
        break;
      }

      expect(',');
    }

    return values;
  }

  private List<Object> parseArray() {
    List<Object> values = new ArrayList<>();
    expect('[');
    skipWhitespace();

    if (peek(']')) {
      index += 1;
      return values;
    }

    while (true) {
      values.add(parseValue());
      skipWhitespace();

      if (peek(']')) {
        index += 1;
        break;
      }

      expect(',');
    }

    return values;
  }

  private String parseString() {
    expect('"');
    StringBuilder builder = new StringBuilder();

    while (index < text.length()) {
      char current = text.charAt(index++);
      if (current == '"') {
        return builder.toString();
      }

      if (current == '\\\\') {
        if (index >= text.length()) {
          throw new IllegalStateException("Invalid escape sequence at end of JSON string");
        }

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
            if (index + 4 > text.length()) {
              throw new IllegalStateException("Invalid unicode escape at position " + index);
            }
            String hex = text.substring(index, index + 4);
            builder.append((char) Integer.parseInt(hex, 16));
            index += 4;
            break;
          default:
            throw new IllegalStateException("Invalid escape character '\\\\" + escaped + "'");
        }
      } else {
        builder.append(current);
      }
    }

    throw new IllegalStateException("Unterminated JSON string");
  }

  private Boolean parseBoolean() {
    if (text.startsWith("true", index)) {
      index += 4;
      return Boolean.TRUE;
    }

    if (text.startsWith("false", index)) {
      index += 5;
      return Boolean.FALSE;
    }

    throw new IllegalStateException("Invalid boolean value at position " + index);
  }

  private Object parseNull() {
    if (!text.startsWith("null", index)) {
      throw new IllegalStateException("Invalid null token at position " + index);
    }

    index += 4;
    return null;
  }

  private Number parseNumber() {
    int start = index;
    while (index < text.length()) {
      char current = text.charAt(index);
      if (
        (current >= '0' && current <= '9')
        || current == '-'
        || current == '+'
        || current == '.'
        || current == 'e'
        || current == 'E'
      ) {
        index += 1;
      } else {
        break;
      }
    }

    String raw = text.substring(start, index);
    if (raw.contains(".") || raw.contains("e") || raw.contains("E")) {
      return Double.parseDouble(raw);
    }

    long parsed = Long.parseLong(raw);
    if (parsed >= Integer.MIN_VALUE && parsed <= Integer.MAX_VALUE) {
      return (int) parsed;
    }

    return parsed;
  }

  private void expect(char expected) {
    skipWhitespace();
    if (index >= text.length() || text.charAt(index) != expected) {
      throw new IllegalStateException("Expected '" + expected + "' at position " + index);
    }
    index += 1;
  }

  private boolean peek(char value) {
    return index < text.length() && text.charAt(index) == value;
  }

  private void skipWhitespace() {
    while (index < text.length() && Character.isWhitespace(text.charAt(index))) {
      index += 1;
    }
  }
}
`;
};

module.exports = {
  buildJavaRunnerSource,
  __internal: {
    buildUserJavaSource,
    stripPublicClassModifiers,
  },
};

/**
 * Stringifies a value to JSON, converting any BigInt values to strings to avoid
 * serialization errors.
 */
export function stringifyWithBigInt(value: unknown) {
  return JSON.stringify(value, (_key, jsonValue) =>
    typeof jsonValue === "bigint" ? jsonValue.toString() : jsonValue,
  );
}

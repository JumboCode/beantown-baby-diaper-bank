/**
 * Stringifies a value to JSON, converting any BigInt values to strings to avoid serialization errors.  Use this function whenever you need to serialize data that may contain BigInt fields, such as Prisma query results.
 * @param value - The value to stringify, which can be of any type. This can be an object, array, primitive, etc. Most commonly used for objects containing BigInt fields, like the Prisma query results.
 * @returns The JSON string representation of the value, with BigInts converted to strings.
 */
export function stringifyWithBigInt(value: unknown) {
  return JSON.stringify(value, (_key, jsonValue) =>
    typeof jsonValue === "bigint" ? jsonValue.toString() : jsonValue,
  );
}

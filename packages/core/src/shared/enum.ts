type StringEnum = Record<string, string>;

/** True when `value` is one of the enum's values (not its keys). */
export function isEnumValue<E extends StringEnum>(enumObject: E, value: string): value is E[keyof E] {
  return (Object.values(enumObject) as string[]).includes(value);
}

/** Returns `value` typed as the enum, or throws a RangeError naming the field. */
export function parseEnumValue<E extends StringEnum>(enumObject: E, value: string, field: string): E[keyof E] {
  if (!isEnumValue(enumObject, value)) {
    throw new RangeError(`${field}: expected one of ${Object.values(enumObject).join(', ')}, got ${value}`);
  }

  return value;
}

export function isStrictlyIncreasing(values: readonly number[]): boolean {
  return values.every((value, i) => i === 0 || value > values[i - 1]!);
}

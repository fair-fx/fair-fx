import { ConfigError } from './config-error.ts';
import { isEnumValue, parseEnumValue } from './enum.ts';
import { Network } from './network.ts';

type JsonObject = Readonly<Record<string, unknown>>;

// Shape only. The StrKey checksum needs the Stellar SDK, so the test of the real config files checks it.
const ACCOUNT_ID = /^G[A-Z2-7]{55}$/;
const CONTRACT_ID = /^C[A-Z2-7]{55}$/;

export function readRecord(value: unknown, field: string): JsonObject {
  if (value === undefined) {
    throw new ConfigError(`${field}: missing`);
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ConfigError(`${field}: expected an object`);
  }
  return value as JsonObject;
}

/** Returns the entry for `network` from an object keyed by network name. A misspelt network fails. */
export function readNetworkEntry(value: unknown, field: string, network: Network): unknown {
  const byNetwork = readRecord(value, field);
  const unknownNetwork = Object.keys(byNetwork).find((key) => !isEnumValue(Network, key));
  if (unknownNetwork !== undefined) {
    throw new ConfigError(`${field}.${unknownNetwork}: expected one of ${Object.values(Network).join(', ')}`);
  }
  return byNetwork[network];
}

/** Reads an object with exactly `keys`, so a misspelt key fails instead of being ignored. */
export function readObject(value: unknown, field: string, keys: readonly string[]): JsonObject {
  const object = readRecord(value, field);
  const unknownKey = Object.keys(object).find((key) => !keys.includes(key));
  if (unknownKey !== undefined) {
    throw new ConfigError(`${field}.${unknownKey}: unknown key`);
  }
  const missingKey = keys.find((key) => !(key in object));
  if (missingKey !== undefined) {
    throw new ConfigError(`${field}.${missingKey}: missing`);
  }
  return object;
}

export function readString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value === '') {
    throw new ConfigError(`${field}: expected a non-empty string`);
  }
  return value;
}

export function readHttpsUrl(value: unknown, field: string): string {
  const url = readString(value, field);
  if (!url.startsWith('https://')) {
    throw new ConfigError(`${field}: expected an https URL, got ${url}`);
  }
  return url;
}

export function readAccountId(value: unknown, field: string): string {
  return readMatching(value, field, ACCOUNT_ID, 'an account ID (G...)');
}

export function readContractId(value: unknown, field: string): string {
  return readMatching(value, field, CONTRACT_ID, 'a contract ID (C...)');
}

export function readInteger(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) {
    throw new ConfigError(`${field}: expected an integer from ${min} to ${max}, got ${String(value)}`);
  }
  return value;
}

export function readArray(value: unknown, field: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new ConfigError(`${field}: expected an array`);
  }
  return value;
}

export function readEnum<E extends Record<string, string>>(enumObject: E, value: unknown, field: string): E[keyof E] {
  const text = readString(value, field);
  try {
    return parseEnumValue(enumObject, text, field);
  } catch (error) {
    if (error instanceof RangeError) {
      throw new ConfigError(error.message, { cause: error });
    }
    throw error;
  }
}

function readMatching(value: unknown, field: string, pattern: RegExp, expected: string): string {
  const text = readString(value, field);
  if (!pattern.test(text)) {
    throw new ConfigError(`${field}: expected ${expected}, got ${text}`);
  }
  return text;
}

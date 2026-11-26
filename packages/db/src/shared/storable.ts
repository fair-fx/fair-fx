import { REPLACEMENT_CHARACTER } from './storable.constants.ts';

/** `text` as Postgres can store it: a NUL character or half of a surrogate pair becomes U+FFFD. */
export function storableText(text: string): string {
  return text.toWellFormed().replaceAll('\u0000', REPLACEMENT_CHARACTER);
}

/**
 * `value` as JSON text that Postgres accepts as `jsonb`. Every string in it goes through
 * `storableText`, and a bigint is written as a decimal string so that no digit is lost.
 */
export function storableJson(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) => {
    if (typeof item === 'string') {
      return storableText(item);
    }

    return typeof item === 'bigint' ? item.toString() : item;
  });
}

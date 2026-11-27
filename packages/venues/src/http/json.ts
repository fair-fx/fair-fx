/** `JSON.parse`, with `null` for text that is not JSON (an HTML error page from a proxy, for example). */
export function parseJsonOrNull(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * `path` under `baseUrl`, keeping the path the base already has: `https://host/horizon` and
 * `paths/strict-send` give `https://host/horizon/paths/strict-send`.
 */
export function urlUnder(baseUrl: string, path: string): URL {
  return new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
}

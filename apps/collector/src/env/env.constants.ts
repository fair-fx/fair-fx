import { fileURLToPath } from 'node:url';

/** The repo's `config/` folder, found from this file in `src/env/` or `dist/env/` of the collector. */
export const DEFAULT_CONFIG_DIR = fileURLToPath(new URL('../../../../config', import.meta.url));

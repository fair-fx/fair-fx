import { createProjectGraphAsync } from '@nx/devkit';
import { beforeAll } from 'vitest';

// The lint rule reads Nx's cached project graph. Rebuild it so tag edits in package.json are seen.
beforeAll(async () => {
  await createProjectGraphAsync({ exitOnError: true });
});

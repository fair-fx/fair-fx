import type {} from 'vitest';

// What the global setup hands to the tests. Its own file, so that a package whose tests only open a
// test database, and never load the global setup's types, still sees it.
declare module 'vitest' {
  export interface ProvidedContext {
    /** URL of the database on the test server that has every migration applied. */
    migratedDatabaseUrl: string;
  }
}

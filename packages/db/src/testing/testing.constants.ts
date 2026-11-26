/** The server the tests run against. The same major version as the one FairFX is deployed on. */
export const POSTGRES_IMAGE = 'postgres:18.6-alpine';

/** The database the global setup applies every migration to. A test copies it and never writes to it. */
export const MIGRATED_DATABASE = 'fairfx_migrated';

/** The template Postgres ships for a database with nothing in it. */
export const EMPTY_DATABASE = 'template0';

/** The database every server has. A test database is created from a session on it. */
export const MAINTENANCE_DATABASE = 'postgres';

/** How long a test waits for one session to block on another before it fails. */
export const LOCK_WAIT_CEILING_MS = 5000;

/** How often that wait looks again. */
export const LOCK_WAIT_INTERVAL_MS = 10;

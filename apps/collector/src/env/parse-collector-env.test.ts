import { fileURLToPath } from 'node:url';
import { parseCollectorEnv } from '@fair-fx/collector';

const DATABASE_URL = 'postgres://fairfx:s3cret-password@localhost:5433/fairfx';
// The repo's config/ folder, found from this test the same way the collector finds it from src/env/.
const REPO_CONFIG_DIR = fileURLToPath(new URL('../../../../config', import.meta.url));

describe('parseCollectorEnv', () => {
  it('reads the database, the network and the config folder', () => {
    const env = parseCollectorEnv({ DATABASE_URL, FAIRFX_NETWORK: 'testnet', FAIRFX_CONFIG_DIR: '/srv/fairfx/config' });

    expect(env).toEqual({ databaseUrl: DATABASE_URL, network: 'testnet', configDir: '/srv/fairfx/config' });
  });

  it("runs on mainnet with the repo's config folder when only the database is set", () => {
    const env = parseCollectorEnv({ DATABASE_URL });

    expect(env).toEqual({
      databaseUrl: DATABASE_URL,
      network: 'mainnet',
      configDir: REPO_CONFIG_DIR,
    });
  });

  it('takes the default of an optional variable that is set but blank', () => {
    const env = parseCollectorEnv({ DATABASE_URL, FAIRFX_NETWORK: '', FAIRFX_CONFIG_DIR: ' ' });

    expect(env).toEqual({
      databaseUrl: DATABASE_URL,
      network: 'mainnet',
      configDir: REPO_CONFIG_DIR,
    });
  });

  it.each([
    { what: 'the database is not set', env: {}, named: 'DATABASE_URL' },
    { what: 'the database is empty', env: { DATABASE_URL: '' }, named: 'DATABASE_URL' },
    { what: 'the database is only spaces', env: { DATABASE_URL: '  ' }, named: 'DATABASE_URL' },
    { what: 'the network is not one FairFX knows', env: { DATABASE_URL, FAIRFX_NETWORK: 'futurenet' }, named: 'FAIRFX_NETWORK' },
  ])('refuses, naming the variable and not the password, when $what', ({ env, named }) => {
    const parse = () => parseCollectorEnv(env);

    expect(parse).toThrow(expect.objectContaining({ name: 'ConfigError', message: expect.stringContaining(named) }));
    expect(parse).not.toThrow(/s3cret/);
  });
});

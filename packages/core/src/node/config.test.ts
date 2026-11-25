import { fileURLToPath } from 'node:url';
import { Asset, Networks, StrKey } from '@stellar/stellar-sdk';
import { ConfigError, Network } from '@fair-fx/core';
import { loadConfig } from '@fair-fx/core/node';

const CONFIG_DIR = fileURLToPath(new URL('../../../../config', import.meta.url));
const config = await loadConfig(CONFIG_DIR, Network.Mainnet);
const assets = config.pairs.flatMap((pair) => [pair.base, pair.quote]);

describe('config files in the repo', () => {
  it('use the public network passphrase on mainnet', () => {
    expect(config.endpoints.passphrase).toBe(Networks.PUBLIC);
  });

  it.each(assets)('pin $code to the SAC of its code and issuer', (asset) => {
    const sac = new Asset(asset.code, asset.issuer).contractId(Networks.PUBLIC);

    expect(sac).toBe(asset.contract);
  });

  it('hold addresses with a valid checksum', () => {
    const { simulationSource, soroswapRouter, reflectorFiatFeed } = config.endpoints;
    const accounts = [simulationSource, ...assets.map((asset) => asset.issuer)];
    const contracts = [soroswapRouter, reflectorFiatFeed, ...assets.map((asset) => asset.contract)];

    expect(accounts.filter((id) => !StrKey.isValidEd25519PublicKey(id))).toEqual([]);
    expect(contracts.filter((id) => !StrKey.isValidContract(id))).toEqual([]);
  });
});

describe('loadConfig', () => {
  it('refuses a folder without config files and names the file', async () => {
    const load = loadConfig('/no-such-dir', Network.Mainnet);

    await expect(load).rejects.toThrow(ConfigError);
    await expect(load).rejects.toThrow(/^\/no-such-dir\/(networks|pairs)\.json: ENOENT/);
  });
});

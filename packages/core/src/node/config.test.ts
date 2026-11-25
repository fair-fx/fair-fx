import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Asset, Networks, StrKey } from '@stellar/stellar-sdk';
import { ConfigError, Network } from '@fair-fx/core';
import { loadNetworkConfig, loadPairsConfig } from '@fair-fx/core/node';

const CONFIG_DIR = new URL('../../../../config/', import.meta.url);
const network = await loadNetworkConfig(new URL('networks.json', CONFIG_DIR), Network.Mainnet);
const pairs = await loadPairsConfig(new URL('pairs.json', CONFIG_DIR), Network.Mainnet);
const assets = pairs.pairs.flatMap((pair) => [pair.base, pair.quote]);

describe('config files in the repo', () => {
  it('use the public network passphrase on mainnet', () => {
    expect(network.passphrase).toBe(Networks.PUBLIC);
  });

  it.each(assets)('pin $code to the SAC of its code and issuer', (asset) => {
    const sac = new Asset(asset.code, asset.issuer).contractId(Networks.PUBLIC);

    expect(sac).toBe(asset.contract);
  });

  it('hold addresses with a valid checksum', () => {
    const accounts = [network.simulationSource, ...assets.map((asset) => asset.issuer)];
    const contracts = [network.soroswapRouter, network.reflectorFiatFeed, ...assets.map((asset) => asset.contract)];

    expect(accounts.filter((id) => !StrKey.isValidEd25519PublicKey(id))).toEqual([]);
    expect(contracts.filter((id) => !StrKey.isValidContract(id))).toEqual([]);
  });
});

describe('loadPairsConfig', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'fairfx-config-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('refuses a file that is not JSON', async () => {
    const path = join(dir, 'pairs.json');
    await writeFile(path, '{ "ladder": [100,');

    const load = loadPairsConfig(path, Network.Mainnet);

    await expect(load).rejects.toThrow(ConfigError);
  });
});

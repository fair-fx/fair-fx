import { fileURLToPath } from 'node:url';
import { Asset, Networks, StrKey } from '@stellar/stellar-sdk';
import { ConfigError, Network } from '@fair-fx/core';
import { loadConfig } from '@fair-fx/core/node';
import { buildNetworksFile, buildPairsFile, EURCV_IMPERSONATOR, writeConfigDir } from '@fair-fx/core/testing';

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

  it.each([
    {
      what: 'a contract that is the SAC of another asset',
      networks: buildNetworksFile(),
      pairs: buildPairsFile({ base: { contract: EURCV_IMPERSONATOR.contract } }),
      message:
        '✖ expected CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75, the SAC of USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN on "Public Global Stellar Network ; September 2015"\n' +
        '  → at pairs.mainnet[0].base.contract',
    },
    {
      what: 'mainnet contracts next to the testnet passphrase, one problem per asset',
      networks: buildNetworksFile({ passphrase: 'Test SDF Network ; September 2015' }),
      pairs: buildPairsFile(),
      message:
        '✖ expected CA2E53VHFZ6YSWQIEIPBXJQGT6VW3VKWWZO555XKRQXYJ63GEBJJGHY7, the SAC of USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN on "Test SDF Network ; September 2015"\n' +
        '  → at pairs.mainnet[0].base.contract\n' +
        '✖ expected CC3VUZCA5P7SY4I3NUJTYZAQ54DFZBGA5NRFG76WHAKNGJ6VGWI6FKYE, the SAC of EURC:GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2 on "Test SDF Network ; September 2015"\n' +
        '  → at pairs.mainnet[0].quote.contract',
    },
    {
      what: 'an issuer whose last character was mistyped',
      networks: buildNetworksFile(),
      pairs: buildPairsFile({ base: { issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVA' } }),
      message: '✖ expected an account ID with a valid checksum\n  → at pairs.mainnet[0].base.issuer',
    },
  ])('refuses $what', async ({ networks, pairs, message }) => {
    const dir = await writeConfigDir(networks, pairs);

    const load = loadConfig(dir, Network.Mainnet);

    await expect(load).rejects.toThrow(new ConfigError(message));
  });
});

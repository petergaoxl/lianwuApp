// src/lib/config/web3auth.ts
export const getWeb3AuthConfig = () => ({
  clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
  web3AuthNetwork: 'sapphire_devnet',
  chainConfig: {
    chainNamespace: 'eip155',
    chainId: '0x28c65',  // Taiko Hooligan (167013)
    rpcTarget: 'https://rpc.hooligan.taiko.xyz',
    displayName: 'Taiko Hooligan',
    blockExplorerUrl: 'https://hooligan.taikoscan.io',
    ticker: 'ETH',
    tickerName: 'Ethereum',
    decimals: 18
  }
});

export const TAIKO_HOOLIGAN_CONFIG = {
  chainId: 167013,
  chainIdHex: '0x28c65',
  name: 'Taiko Hooligan',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://rpc.hooligan.taiko.xyz'],
  blockExplorerUrls: ['https://hooligan.taikoscan.io'],
  faucetUrl: 'https://bridge.hooligan.taiko.xyz'
};
// src/lib/config/web3auth.ts
export const getWeb3AuthConfig = () => ({
  clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
  web3AuthNetwork: 'sapphire_devnet',
  chainConfig: {
    chainNamespace: 'eip155',          // 直接写字符串
    chainId: '0xaa36a7',               // Sepolia
    rpcTarget: 'https://rpc.sepolia.org',
    displayName: 'Ethereum Sepolia',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    ticker: 'ETH',
    tickerName: 'Ethereum'
  }
});

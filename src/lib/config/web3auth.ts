// src/lib/config/web3auth.ts
export const getWeb3AuthConfig = () => {
  const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID;

  if (!clientId) {
    console.error("❌ Web3Auth Client ID 未配置！");
    throw new Error("Web3Auth Client ID 未配置，请检查 .env 文件");
  }

  const chainConfig = {
    chainNamespace: "eip155",
    chainId: "0x28c65",  // Taiko Hoodi (167013)
    rpcTarget: "https://rpc.hoodi.taiko.xyz",
    displayName: "Taiko Hoodi",
    blockExplorerUrl: "https://hoodi.taikoscan.io",
    ticker: "ETH",
    tickerName: "Ethereum",
    decimals: 18,
  };

  return {
    clientId,
    web3AuthNetwork: "sapphire_devnet",
    chainConfig,
  };
};

export const TAIKO_HOODI_CONFIG = {
  chainId: 167013,
  chainIdHex: "0x28c65",
  name: "Taiko Hoodi",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.hoodi.taiko.xyz"],
  blockExplorerUrls: ["https://hoodi.taikoscan.io"],
  faucetUrl: "https://bridge.hoodi.taiko.xyz",
};

// 兼容老代码
export const HOODI = TAIKO_HOODI_CONFIG;

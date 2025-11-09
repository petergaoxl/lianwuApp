import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";

// Web3Auth 配置
export const web3AuthConfig = {
  clientId: "YOUR_WEB3AUTH_CLIENT_ID", // 需要从 https://dashboard.web3auth.io 获取
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET, // 开发环境使用 DEVNET，生产使用 MAINNET
  chainConfig: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0x13882", // Polygon Amoy Testnet (80002)
    rpcTarget: "https://rpc-amoy.polygon.technology/",
    displayName: "Polygon Amoy Testnet",
    blockExplorerUrl: "https://amoy.polygonscan.com/",
    ticker: "MATIC",
    tickerName: "Polygon",
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  },
};

// 环境变量配置（推荐）
export const getWeb3AuthConfig = () => {
  // 使用 import.meta.env 替代 process.env
  const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID;
  
  if (!clientId) {
    console.warn("⚠️ Web3Auth Client ID 未配置，请在 .env 文件中设置 VITE_WEB3AUTH_CLIENT_ID");
  }
  
  return {
    ...web3AuthConfig,
    clientId: clientId || web3AuthConfig.clientId,
  };
};
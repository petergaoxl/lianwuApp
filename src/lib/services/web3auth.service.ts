// src/lib/services/web3auth.service.ts
import { Web3Auth } from "@web3auth/modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { BrowserProvider } from "ethers";
import { getWeb3AuthConfig } from "$lib/config/web3auth";

let web3auth: Web3Auth | null = null;
let initializing: Promise<Web3Auth> | null = null;

export type Web3AuthLoginResult = {
  provider: any;
  ethersProvider: BrowserProvider;
  signer: any;
  address: string;
  userInfo: Record<string, any> | null;
};

/** 初始化 Web3Auth（单例） */
async function initWeb3Auth(): Promise<Web3Auth> {
  if (web3auth) return web3auth;
  if (initializing) return initializing;

  const { clientId, web3AuthNetwork, chainConfig } = getWeb3AuthConfig();

  const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: { chainConfig },
  });

  const instance = new Web3Auth({
    clientId,
    web3AuthNetwork,
    privateKeyProvider,
  });

  initializing = instance
    .initModal()
    .then(() => {
      web3auth = instance;
      console.log("✅ Web3Auth 初始化完成");
      return instance;
    })
    .finally(() => {
      initializing = null;
    });

  return initializing;
}

/** 共用的结果封装（给 Web3Auth 用） */
async function buildResult(provider: any): Promise<Web3AuthLoginResult> {
  if (!provider) {
    throw new Error("Web3Auth 未返回 provider");
  }

  const ethersProvider = new BrowserProvider(provider as any);
  const signer = await ethersProvider.getSigner();
  const address = await signer.getAddress();
  const userInfo = web3auth ? await web3auth.getUserInfo() : null;

  return { provider, ethersProvider, signer, address, userInfo };
}

/** ✅ Google：通过 Web3Auth 登录（会弹 Web3Auth 自带的 modal） */
export async function loginWithGoogleWeb3Auth(): Promise<Web3AuthLoginResult> {
  const instance = await initWeb3Auth();

  console.log("开始 Google/Web3Auth 登录...");
  const provider = await instance.connect(); // 在 Web3Auth 的弹窗里选 Google

  console.log("Web3Auth 登录成功，获取账户信息...");
  return buildResult(provider);
}

/** ✅ MetaMask：直接连接浏览器插件，不经过 Web3Auth */
export async function loginWithMetaMaskDirect(): Promise<{
  ethersProvider: BrowserProvider;
  signer: any;
  address: string;
}> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("未检测到 MetaMask，请先安装浏览器扩展");
  }

  const ethereum = (window as any).ethereum;

  // 请求授权
  await ethereum.request({ method: "eth_requestAccounts" });

  const ethersProvider = new BrowserProvider(ethereum);
  const signer = await ethersProvider.getSigner();
  const address = await signer.getAddress();

  console.log("MetaMask 连接成功：", address);

  return { ethersProvider, signer, address };
}

/** ✅ Web3Auth 登出（清理 Web3Auth 会话） */
export async function logoutWeb3Auth() {
  if (!web3auth) {
    console.log("Web3Auth 实例不存在，跳过 logout");
    return;
  }
  try {
    await web3auth.logout();
    console.log("✅ Web3Auth 已登出");
  } catch (e) {
    console.error("Web3Auth logout 失败", e);
  }
}

/** 兼容以前的对象导出（如果还有地方在用） */
export const web3AuthService = {
  initWeb3Auth,
  loginWithGoogleWeb3Auth,
  loginWithMetaMaskDirect,
  logoutWeb3Auth,
};

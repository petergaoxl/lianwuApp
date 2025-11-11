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

/** ✅ 社交登录：通过 Web3Auth 登录（每次都强制重新选择社交账号） */
export async function loginWithGoogleWeb3Auth(): Promise<Web3AuthLoginResult> {
  console.log("🟢 进入 loginWithGoogleWeb3Auth");

  const instance = await initWeb3Auth();

  // 关键：每次社交登录前都清掉上一次的会话，否则 Web3Auth 会直接复用上次的登录
  try {
    console.log("🔁 尝试清理上一次 Web3Auth 会话...");
    await instance.logout();
    console.log("✅ 上一次 Web3Auth 会话已清理");
  } catch (e) {
    console.log("ℹ️ Web3Auth logout 失败或本来就未登录，可忽略：", e);
  }

  console.log("开始 Web3Auth 社交登录（将弹出 Google / Discord / Twitter 等选项）...");
  // 不传 loginProvider，让 Web3Auth 自己弹出完整的社交登录列表
  const provider = await instance.connect();

  console.log("Web3Auth 登录成功，准备获取账户信息...");
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

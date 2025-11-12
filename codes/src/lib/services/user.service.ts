// src/lib/services/user.service.ts
import { supabase } from '$lib/supabaseClient';
import type { Web3AuthLoginResult } from '$lib/services/web3auth.service';

// 和我们 auth.store.ts 里一致
export type LoginMethod = 'google' | 'discord' | 'metamask';

// ✅ 修复：id 改成非可选字段
export type AppUser = {
  id: string;           // ← 改成必需（删除 ?）
  address: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  loginMethod: LoginMethod;
  oauthProvider?: string | null;
  balance?: number;
  totalEarned?: number;
};

/** 根据 Web3Auth 的 userInfo 推断社交登录具体是 Google 还是 Discord */
function detectLoginMethodFromUserInfo(userInfo: any): LoginMethod {
  const v = `${userInfo?.verifier || userInfo?.type || ''}`.toLowerCase();

  if (v.includes('discord')) return 'discord';
  if (v.includes('google')) return 'google';

  // 默认当成 google（反正都是走 Web3Auth 社交登录）
  return 'google';
}

/** 把 Web3Auth 的登录结果写入 users 表，并返回 AppUser */
export async function upsertUserFromWeb3Auth(
  loginResult: Web3AuthLoginResult
): Promise<AppUser> {
  const info = loginResult.userInfo as any;

  console.log('🔍 Web3Auth userInfo = ', info);

  const detectedMethod = detectLoginMethodFromUserInfo(info);

  const email = info?.email ?? null;
  const name = info?.name ?? info?.userName ?? null;
  const avatarUrl = info?.profileImage ?? info?.picture ?? null;
  const oauthProvider = (info?.verifier || info?.type || null) as string | null;

  const payload = {
    wallet_address: loginResult.address,
    login_method: detectedMethod,
    oauth_provider: oauthProvider,
    email,
    name,
    avatar_url: avatarUrl,
    balance: 0,
    total_earned: 0,
  };

  console.log('📝 准备写入 users 表: ', payload);

  const { data, error } = await supabase
    .from('users')
    .upsert(payload, { onConflict: 'wallet_address' })
    .select()
    .single();

  if (error) {
    console.error('❌ 保存用户到数据库失败: ', error);
    throw error;
  }

  // ✅ 修复：添加验证确保 id 存在
  if (!data?.id) {
    throw new Error('❌ 用户 ID 创建失败，无法继续登录');
  }

  return {
    id: data.id,  // ✅ 确保返回有效的 id
    address: loginResult.address,
    email,
    name,
    avatarUrl,
    loginMethod: detectedMethod,
    oauthProvider,
    balance: data?.balance ?? 0,
    totalEarned: data?.total_earned ?? 0,
  };
}

/** 把 MetaMask 的登录结果写入 users 表，并返回 AppUser */
export async function upsertUserFromMetaMask(address: string): Promise<AppUser> {
  const payload = {
    wallet_address: address,
    login_method: 'metamask',
  };

  console.log('📝 准备写入 users 表: ', payload);

  const { data, error } = await supabase
    .from('users')
    .upsert(payload, { onConflict: 'wallet_address' })
    .select()
    .single();

  if (error) {
    console.error('❌ 保存用户到数据库失败: ', error);
    throw error;
  }

  // ✅ 修复：添加验证确保 id 存在
  if (!data?.id) {
    throw new Error('❌ 用户 ID 创建失败，无法继续登录');
  }

  return {
    id: data.id,  // ✅ 确保返回有效的 id
    address,
    loginMethod: 'metamask',
  };
}
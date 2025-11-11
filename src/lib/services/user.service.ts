// src/lib/services/user.service.ts
import { supabase } from './supabase.service';
import type { User } from '$lib/stores/auth.store';
import type { constants } from 'http2';

export interface UserRecord {
	id?: string;
	wallet_address: string;
	email?: string;
	name?: string;
	profile_image?: string;
	balance: string;
	login_method: string;
	last_login: string;
	created_at?: string;
	updated_at?: string;
}

class UserService {
	/**
	 * 保存或更新用户信息到数据库
	 */
	async saveUser(user: User): Promise<{ success: boolean; error?: string }> {
		try {
			const userRecord: UserRecord = {
				wallet_address: user.address.toLowerCase(),
				email: user.email || null,
				name: user.name || null,
				profile_image: user.profileImage || null,
				balance: user.balance || '0',
				login_method: user.loginMethod || 'unknown',
				last_login: new Date().toISOString()
			};

			// 先检查用户是否已存在
			const { data: existingUser, error: fetchError } = await supabase
				.from('users')
				.select('*')
				.eq('wallet_address', userRecord.wallet_address)
				.single();

			if (fetchError && fetchError.code !== 'PGRST116') {
				// PGRST116 表示没有找到记录，这是正常的
				console.error('查询用户失败:', fetchError);
				throw fetchError;
			}

			if (existingUser) {
				// 更新现有用户
				const { error: updateError } = await supabase
					.from('users')
					.update({
						email: userRecord.email,
						name: userRecord.name,
						profile_image: userRecord.profile_image,
						balance: userRecord.balance,
						login_method: userRecord.login_method,
						last_login: userRecord.last_login,
						updated_at: new Date().toISOString()
					})
					.eq('wallet_address', userRecord.wallet_address);

				if (updateError) {
					console.error('更新用户失败:', updateError);
					throw updateError;
				}

				console.log('✅ 用户信息已更新:', userRecord.wallet_address);
			} else {
				// 创建新用户
				const { error: insertError } = await supabase.from('users').insert([userRecord]);

				if (insertError) {
					console.error('创建用户失败:', insertError);
					throw insertError;
				}

				console.log('✅ 新用户已创建:', userRecord.wallet_address);
			}

			return { success: true };
		} catch (error) {
			console.error('保存用户到数据库失败:', error);
			// 使用类型保护来安全地访问 message 属性
			const errorMessage = '保存用户信息失败'; // 默认错误消息
			return {
				success: false,
				error: errorMessage || '保存用户信息失败'
			};
		}
	}

	/**
	 * 根据钱包地址获取用户信息
	 */
	async getUserByAddress(address: string): Promise<UserRecord | null> {
		try {
			const { data, error } = await supabase
				.from('users')
				.select('*')
				.eq('wallet_address', address.toLowerCase())
				.single();

			if (error) {
				if (error.code === 'PGRST116') {
					// 用户不存在
					return null;
				}
				throw error;
			}

			return data;
		} catch (error) {
			console.error('获取用户信息失败:', error);
			return null;
		}
	}

	/**
	 * 更新用户余额
	 */
	async updateBalance(address: string, balance: string): Promise<boolean> {
		try {
			const { error } = await supabase
				.from('users')
				.update({
					balance,
					updated_at: new Date().toISOString()
				})
				.eq('wallet_address', address.toLowerCase());

			if (error) throw error;

			console.log('✅ 余额已更新:', balance, 'ETH');
			return true;
		} catch (error) {
			console.error('更新余额失败:', error);
			return false;
		}
	}
}

export const userService = new UserService();

// src/hooks.server.ts
// CORS 和安全头配置 - 解决 window.closed 和 Web3Auth 问题

import type { Handle } from '@sveltejs/kit';

// 允许的来源（开发环境允许所有本地源）
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  // 生产环境添加你的域名
  // 'https://yourdomain.com',
  // 'https://app.yourdomain.com'
];

/**
 * 主要的服务器钩子，处理所有请求
 * 添加必要的 CORS 和安全头
 */
export const handle: Handle = async ({ event, resolve }) => {
  const origin = event.request.headers.get('origin');
  
  // 检查来源是否被允许
  const isAllowedOrigin = !origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development';

  // 处理 OPTIONS 预检请求
  if (event.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        // CORS 头
        'Access-Control-Allow-Origin': isAllowedOrigin ? (origin || '*') : '',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Accept-Language, Content-Language',
        'Access-Control-Max-Age': '86400', // 24 小时
        'Access-Control-Allow-Credentials': 'true',
        
        // COOP/COEP 头 - 允许弹窗（Web3Auth）
        // 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        // 'Cross-Origin-Embedder-Policy': 'require-corp',
      }
    });
  }

  // 解析所有其他请求
  const response = await resolve(event);

  // 添加 CORS 头到所有响应
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Accept-Language, Content-Language');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // 添加安全头 - 允许弹窗（Web3Auth、MetaMask）
//   response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
//   response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  // 添加其他安全头
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // 如果是开发环境，不添加 Strict-Transport-Security
  // 如果是生产环境，添加 HSTS
  if (process.env.NODE_ENV !== 'development') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
};
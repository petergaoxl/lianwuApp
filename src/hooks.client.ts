// src/hooks.client.ts
import { Buffer } from 'buffer';
import process from 'process';

// 只在浏览器端挂 polyfill
if (typeof window !== 'undefined') {
  // polyfill Buffer
  // @ts-expect-error or longer
  if (!window.Buffer) {
    // @ts-expect-error or longer
    window.Buffer = Buffer;
  }

  // polyfill process
  // @ts-expect-error or longer
  if (!window.process) {
    // @ts-expect-error or longer
    window.process = process;
  }

  // polyfill global
  // 有些 Node 包会用 global，这里把它指向 window
  // @ts-expect-error or longer
  if (!window.global) {
    // @ts-expect-error or longer
    window.global = window;
  }
}

// 再给 globalThis 也挂一份，防止有库用 globalThis.Buffer / globalThis.process / globalThis.global
// 声明 globalThis 对象拥有可选的 Node.js 属性
declare global {
  interface Window { // 或 globalThis 的接口
    Buffer?: typeof Buffer;
    process?: typeof process;
    global?: typeof globalThis;
  }
}

// 现在您的原始代码可以写成这样，而不需要 any：
if (typeof globalThis !== 'undefined') {
  // TypeScript 现在知道 globalThis 可能有 Buffer/process 属性
  const g = globalThis; 
  
  if (!g.Buffer) {
    g.Buffer = Buffer;
  }
  
  if (!g.process) {
    g.process = process;
  }
  
  if (!g.global) {
    g.global = g;
  }
}

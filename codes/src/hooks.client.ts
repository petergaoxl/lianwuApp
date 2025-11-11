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
if (typeof globalThis !== 'undefined') {
  const g: any = globalThis as any;

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

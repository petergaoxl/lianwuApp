<script lang="ts">
  import type { ComponentType } from 'svelte';
  
  export let title: string;
  export let value: string | number;
  export let subtitle: string;
  export let icon: ComponentType;
  export let color: string = 'purple';
  
  const colorMap: Record<string, string> = {
    purple: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    pink: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
    green: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  };
  
  $: theme = colorMap[color] || colorMap.purple;
</script>

<div class="group relative overflow-hidden rounded-xl border border-white/5 bg-surface-200/50 p-6 backdrop-blur-sm transition-all hover:bg-surface-300/50 hover:border-white/10 hover:shadow-lg hover:shadow-black/20">
  <div class="flex items-center justify-between mb-4">
    <span class="text-sm font-medium text-slate-400">{title}</span>
    <div class={`p-2 rounded-lg ${theme}`}>
      <svelte:component this={icon} class="w-4 h-4" />
    </div>
  </div>
  
  <div class="flex items-baseline gap-2">
    <span class="text-2xl font-bold text-slate-100 tracking-tight">{value}</span>
  </div>
  
  <div class="mt-1 text-xs text-slate-500">
    {subtitle}
  </div>
</div>
<script lang="ts">
  import type { ComponentType } from 'svelte';
  
  export let title: string;
  export let value: string | number;
  export let subtitle: string;
  export let icon: ComponentType;
  export let color: string = 'purple';
  
  const colorMap: Record<string, string> = {
    purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/20',
    cyan: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20',
    pink: 'from-pink-500/10 to-pink-500/5 border-pink-500/20',
    green: 'from-green-500/10 to-green-500/5 border-green-500/20',
  };
  
  const iconColorMap: Record<string, string> = {
    purple: 'text-purple-400',
    cyan: 'text-cyan-400',
    pink: 'text-pink-400',
    green: 'text-green-400',
  };
  
  $: cardColor = colorMap[color] || colorMap.purple;
  $: iconColor = iconColorMap[color] || iconColorMap.purple;
</script>

<div class={`p-6 rounded-2xl bg-gradient-to-br ${cardColor} border backdrop-blur-sm hover:scale-105 transition-transform`}>
  <div class="flex items-center justify-between mb-2">
    <span class="text-gray-400">{title}</span>
    <svelte:component this={icon} class={`w-5 h-5 ${iconColor}`} />
  </div>
  <div class="text-3xl font-bold mb-1">{value}</div>
  <div class="text-sm text-gray-500">{subtitle}</div>
</div>
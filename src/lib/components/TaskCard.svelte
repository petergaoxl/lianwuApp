<script lang="ts">
  import { goto } from '$app/navigation';
  import { Trophy, ChevronRight, Clock, CheckCircle2 } from 'lucide-svelte';
  import type { Task } from '$lib/types/task.types';
  
  export let task: Task;
  export let onClaim: (taskId: string) => void;
  
  function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      onboarding: 'bg-emerald-500',
      social: 'bg-violet-500',
      daily: 'bg-blue-500',
      content: 'bg-orange-500',
      special: 'bg-amber-500'
    };
    return colors[category] || 'bg-slate-500';
  }
  
  function getStatusConfig(status: string) {
    const config: Record<string, { text: string, style: string, icon: any }> = {
      completed: { text: '已完成', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
      active: { text: '进行中', style: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
      claimed: { text: '已领取', style: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: CheckCircle2 },
      pending: { text: '待审核', style: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: Clock },
      expired: { text: '已过期', style: 'bg-red-500/10 text-red-400 border-red-500/20', icon: Clock }
    };
    return config[status] || { text: status, style: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Clock };
  }
  
  function handleTaskClick() {
    goto(`/tasks/${task.id}`);
  }
  
  $: categoryColor = getCategoryColor(task.category);
  $: statusConfig = getStatusConfig(task.status);
  $: progressPercentage = task.total ? (task.progress || 0) / task.total * 100 : 0;
</script>

<div 
  class="group relative overflow-hidden rounded-xl border border-white/5 bg-surface-200/50 p-5 backdrop-blur-sm transition-all hover:bg-surface-300/50 hover:border-white/10 hover:shadow-lg hover:shadow-black/20 cursor-pointer"
  on:click={handleTaskClick}
  on:keydown={(e) => e.key === 'Enter' && handleTaskClick()}
  role="button"
  tabindex="0"
>
  <div class="flex items-start justify-between gap-4">
    <div class="flex-1 min-w-0">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-2">
        <div class={`w-1.5 h-1.5 rounded-full ${categoryColor} shadow-[0_0_8px_currentColor]`}></div>
        <h3 class="text-base font-semibold text-slate-100 group-hover:text-primary-400 transition-colors truncate">
          {task.title}
        </h3>
      </div>
      
      <!-- Description -->
      {#if task.description}
        <p class="text-sm text-slate-400 mb-4 line-clamp-2">{task.description}</p>
      {/if}
      
      <!-- Progress Bar -->
      {#if task.progress !== undefined && task.total}
        <div class="mb-4">
          <div class="flex justify-between text-xs font-medium text-slate-400 mb-1.5">
            <span>进度</span>
            <span>{task.progress}/{task.total}</span>
          </div>
          <div class="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
            <div
              class={`h-full rounded-full ${categoryColor} transition-all duration-500`}
              style={`width: ${progressPercentage}%`}
            ></div>
          </div>
        </div>
      {/if}
      
      <!-- Footer Info -->
      <div class="flex items-center gap-3 flex-wrap">
        <!-- Reward -->
        <div class="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 border border-amber-500/20">
          <Trophy class="w-3.5 h-3.5 text-amber-400" />
          <span class="text-xs font-bold text-amber-400">+{task.reward}</span>
        </div>
        
        <!-- Status Badge -->
        <div class={`flex items-center gap-1.5 rounded-md px-2 py-1 border ${statusConfig.style}`}>
          <svelte:component this={statusConfig.icon} class="w-3.5 h-3.5" />
          <span class="text-xs font-medium">{statusConfig.text}</span>
        </div>
        
        <!-- Requirements -->
        {#if task.requirements && task.requirements.length > 0}
          <span class="text-xs text-slate-500">
            {task.requirements.length} 个要求
          </span>
        {/if}
      </div>
    </div>
    
    <!-- Action Area -->
    <div class="flex items-center self-center pl-2">
      {#if task.status === 'completed'}
        <button
          on:click|stopPropagation={() => onClaim(task.id)}
          class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
        >
          领取
        </button>
      {:else}
        <div class="p-2 rounded-full bg-white/5 text-slate-400 group-hover:bg-primary-500/20 group-hover:text-primary-400 transition-all">
          <ChevronRight class="w-5 h-5" />
        </div>
      {/if}
    </div>
  </div>
</div>
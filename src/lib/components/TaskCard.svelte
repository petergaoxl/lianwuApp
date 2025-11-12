<script lang="ts">
  import { goto } from '$app/navigation';
  import { Trophy, ChevronRight } from 'lucide-svelte';
  import type { Task } from '$lib/types/task.types';
  
  export let task: Task;
  export let onClaim: (taskId: string) => void;
  
  function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      onboarding: 'from-green-400 to-emerald-500',
      social: 'from-purple-400 to-pink-500',
      daily: 'from-blue-400 to-cyan-500',
      content: 'from-orange-400 to-red-500',
      special: 'from-yellow-400 to-amber-500'
    };
    return colors[category] || 'from-gray-400 to-gray-600';
  }
  
  function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      completed: '已完成',
      active: '进行中',
      claimed: '已领取',
      pending: '待审核',
      expired: '已过期'
    };
    return statusMap[status] || status;
  }
  
  function getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      completed: 'bg-green-500/20 text-green-400',
      active: 'bg-blue-500/20 text-blue-400',
      claimed: 'bg-gray-500/20 text-gray-400',
      pending: 'bg-orange-500/20 text-orange-400',
      expired: 'bg-red-500/20 text-red-400'
    };
    return colorMap[status] || 'bg-gray-500/20 text-gray-400';
  }
  
  function handleTaskClick() {
    goto(`/tasks/${task.id}`);
  }
  
  $: categoryColor = getCategoryColor(task.category);
  $: progressPercentage = task.total ? (task.progress || 0) / task.total * 100 : 0;
</script>

<div 
  class="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all group cursor-pointer"
  on:click={handleTaskClick}
  on:keydown={(e) => e.key === 'Enter' && handleTaskClick()}
  role="button"
  tabindex="0"
>
  <div class="flex items-start justify-between">
    <div class="flex-1">
      <!-- 标题和分类标记 -->
      <div class="flex items-center gap-3 mb-2">
        <div class={`w-2 h-2 rounded-full bg-gradient-to-r ${categoryColor}`}></div>
        <h3 class="text-lg font-semibold group-hover:text-purple-400 transition-colors">
          {task.title}
        </h3>
      </div>
      
      <!-- 描述 -->
      {#if task.description}
        <p class="text-sm text-gray-400 mb-3">{task.description}</p>
      {/if}
      
      <!-- 进度条 -->
      {#if task.progress !== undefined && task.total}
        <div class="mb-3">
          <div class="flex justify-between text-sm text-gray-400 mb-1">
            <span>进度</span>
            <span>{task.progress}/{task.total}</span>
          </div>
          <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              class={`h-2 rounded-full bg-gradient-to-r ${categoryColor} transition-all duration-500`}
              style={`width: ${progressPercentage}%`}
            ></div>
          </div>
        </div>
      {/if}
      
      <!-- 底部信息 -->
      <div class="flex items-center gap-4 flex-wrap">
        <!-- 奖励 -->
        <div class="flex items-center gap-2">
          <Trophy class="w-4 h-4 text-yellow-400" />
          <span class="font-bold text-yellow-400">+{task.reward}</span>
        </div>
        
        <!-- 状态标签 -->
        <span class={`text-sm px-3 py-1 rounded-full ${getStatusColor(task.status)}`}>
          {getStatusText(task.status)}
        </span>
        
        <!-- 要求 -->
        {#if task.requirements && task.requirements.length > 0}
          <span class="text-xs text-gray-500">
            {task.requirements.length} 个要求
          </span>
        {/if}
      </div>
    </div>
    
    <!-- 右侧操作区域 -->
    <div class="ml-4 flex items-center gap-3 flex-shrink-0">
      {#if task.status === 'completed'}
        <button
          on:click|stopPropagation={() => onClaim(task.id)}
          class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition-all font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
        >
          领取奖励
        </button>
      {:else}
        <ChevronRight class="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
      {/if}
    </div>
  </div>
</div>
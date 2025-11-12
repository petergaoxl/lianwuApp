<script>
  import InteractiveTask from '$lib/components/InteractiveTask.svelte';
  import TaskAnalytics from '$lib/components/TaskAnalytics.svelte';
  import { supabase } from '$lib/supabaseClient';
  import { authStore } from '$lib/stores/auth.store';
  
  export let data;
  
  let task = data.task;
  let userId = $authStore.user?.id || '';
  let showAnalytics = false;
</script>

<div class="task-detail">
  {#if task.task_type === 'interactive'}
    <InteractiveTask {task} {userId} />
    
    {#if task.created_by === userId}
      <button on:click={() => showAnalytics = !showAnalytics}>
        {showAnalytics ? '隐藏' : '显示'}分析数据
      </button>
      
      {#if showAnalytics}
        <TaskAnalytics 
          taskId={task.id} 
          createdBy={task.created_by}
          currentUserId={userId}
        />
      {/if}
    {/if}
  {:else}
    <div>普通任务显示</div>
  {/if}
</div>

<style>
  .task-detail {
    padding: 20px;
  }
</style>
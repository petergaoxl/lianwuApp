<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth.store';

  let isInitialized = false;

  onMount(async () => {
    // 页面加载时初始化
    isInitialized = true;
  });
</script>

<div>
  <slot />
</div>

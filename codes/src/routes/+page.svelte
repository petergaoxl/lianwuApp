<script lang="ts">
  // ...
import { onMount } from 'svelte';
  import { Trophy, CheckCircle, Clock } from 'lucide-svelte';
  import Navbar from '$lib/components/Navbar.svelte';   // ← 必须有这一行
  import LoginModal from '$lib/components/LoginModal.svelte';
  import TaskCard from '$lib/components/TaskCard.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import { authStore } from '$lib/stores/auth.store';
  import { taskStore } from '$lib/stores/task.store';  let showLoginModal = false;

  $: user = $authStore.user;

  function handleLoginClick() {
    showLoginModal = true;
  }

  function handleCloseModal() {
    showLoginModal = false;
  }
</script>

<Navbar onLoginClick={handleLoginClick} />

<LoginModal isOpen={showLoginModal} onClose={handleCloseModal} />

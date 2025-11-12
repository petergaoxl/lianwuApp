<script lang="ts">
  import { PieChart, BarChart3 } from 'lucide-svelte';
  import { Chart } from 'chart.js/auto';
  import { onMount } from 'svelte';
  import { submitScores, getTaskScores, getUserSubmission } from '$lib/services/interactive.service';

  export let task: any;
  export let userId: string;

  let dimensions = [
    { name: '设计美感', key: 'design' },
    { name: '功能完整', key: 'function' },
    { name: '用户体验', key: 'ux' },
    { name: '创新度', key: 'innovation' }
  ];

  let scores = {
    design: 5,
    function: 5,
    ux: 5,
    innovation: 5
  };

  let submitted = false;
  let loading = false;
  let error = '';
  let statsData: any = null;

  onMount(async () => {
    // 检查用户是否已提交
    const submission = await getUserSubmission(task.id, userId);
    if (submission) {
      submitted = true;
      scores = submission.submission_data.scores;
    }

    // 加载统计数据
    await loadStats();
  });

  async function loadStats() {
    try {
      const stats = await getTaskScores(task.id);
      statsData = stats;
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  }

  async function handleSubmit() {
    if (submitted) {
      alert('你已经提交过评分了');
      return;
    }

    loading = true;
    error = '';

    try {
      const scoreArray = Object.entries(scores).map(([dimension, score]) => ({
        dimension,
        score: score as number
      }));

      await submitScores(task.id, userId, scoreArray);
      submitted = true;
      await loadStats();
      alert('提交成功！');
    } catch (err) {
      error = `提交失败: ${err instanceof Error ? err.message : '未知错误'}`;
    } finally {
      loading = false;
    }
  }
</script>

<div class="interactive-task">
  <!-- 任务信息 -->
  <div class="task-info">
    <h2>{task.title}</h2>
    <p>{task.description}</p>

    {#if task.task_data?.images}
      <div class="images-gallery">
        {#each task.task_data.images as image}
          <img src={image} alt="任务图片" />
        {/each}
      </div>
    {/if}
  </div>

  {#if !submitted}
    <!-- 评分表单 -->
    <div class="scoring-form">
      <h3>请从以下角度打分（1-10分）</h3>

      {#each dimensions as dim}
        <div class="score-item">
          <label>{dim.name}</label>
          <div class="score-input">
            <input
              type="range"
              min="1"
              max="10"
              bind:value={scores[dim.key]}
            />
            <span class="score-value">{scores[dim.key]}</span>
          </div>
        </div>
      {/each}

      {#if error}
        <div class="error">{error}</div>
      {/if}

      <button 
        on:click={handleSubmit} 
        disabled={loading}
        class="submit-btn"
      >
        {loading ? '提交中...' : '提交评分'}
      </button>
    </div>
  {:else}
    <div class="submitted-msg">✅ 你已提交评分，感谢参与！</div>
  {/if}

  <!-- 统计数据和饼图 -->
  {#if statsData}
    <div class="stats-section">
      <h3>评分统计</h3>

      <div class="stats-grid">
        {#each Object.entries(statsData) as [dimension, stat]}
          <div class="stat-card">
            <h4>{dimension}</h4>
            <div class="stat-value">
              <div class="average">平均分: {stat.average.toFixed(1)}</div>
              <div class="count">参与人数: {stat.count}</div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .interactive-task {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
  }

  .task-info {
    margin-bottom: 40px;
    background: #f5f5f5;
    padding: 20px;
    border-radius: 8px;
  }

  .task-info h2 {
    margin: 0 0 10px 0;
    font-size: 24px;
  }

  .images-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    margin-top: 15px;
  }

  .images-gallery img {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: 4px;
  }

  .scoring-form {
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 40px;
  }

  .scoring-form h3 {
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 18px;
    color: #333;
  }

  .score-item {
    margin-bottom: 20px;
  }

  .score-item label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #555;
  }

  .score-input {
    display: flex;
    gap: 15px;
    align-items: center;
  }

  .score-input input[type="range"] {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: #ddd;
    outline: none;
    -webkit-appearance: none;
  }

  .score-input input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #4CAF50;
    cursor: pointer;
  }

  .score-input input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #4CAF50;
    cursor: pointer;
    border: none;
  }

  .score-value {
    font-weight: bold;
    color: #4CAF50;
    min-width: 30px;
    text-align: center;
    font-size: 18px;
  }

  .submit-btn {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 12px 30px;
    font-size: 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 20px;
    width: 100%;
    font-weight: bold;
  }

  .submit-btn:hover:not(:disabled) {
    background: #45a049;
  }

  .submit-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .submitted-msg {
    background: #e8f5e9;
    color: #2e7d32;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 30px;
    font-size: 16px;
  }

  .error {
    background: #ffebee;
    color: #c62828;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 15px;
  }

  .stats-section {
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .stats-section h3 {
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 18px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }

  .stat-card {
    background: #f9f9f9;
    padding: 15px;
    border-radius: 6px;
    border-left: 4px solid #4CAF50;
  }

  .stat-card h4 {
    margin: 0 0 10px 0;
    color: #333;
  }

  .stat-value {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .average {
    font-weight: bold;
    color: #4CAF50;
    font-size: 16px;
  }

  .count {
    color: #666;
    font-size: 14px;
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';
  import { PieChart as PieChartIcon, BarChart3, TrendingUp } from 'lucide-svelte';
  import { Chart as ChartJS, PieController, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarController, BarElement } from 'chart.js';
  import { supabase } from '$lib/supabaseClient';

  export let taskId: string;
  export let createdBy: string;
  export let currentUserId: string;

  let submissions: any[] = [];
  let scoreStats: any = null;
  let chartElements: { [key: string]: HTMLCanvasElement } = {};
  let chartInstances: { [key: string]: ChartJS } = {};

  ChartJS.register(PieController, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarController, BarElement);

  onMount(async () => {
    // 只有任务创建者可以查看
    if (currentUserId !== createdBy) {
      alert('只有任务发布者可以查看分析数据');
      return;
    }

    await loadAnalytics();
  });

  async function loadAnalytics() {
    try {
      // 获取所有提交
      const { data: subs, error: subError } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('task_id', taskId);

      if (subError) throw subError;
      submissions = subs || [];

      // 获取评分统计
      const { data: scores, error: scoreError } = await supabase
        .from('task_scores')
        .select(`
          *,
          task_submissions!inner(task_id)
        `)
        .eq('task_submissions.task_id', taskId);

      if (scoreError) throw scoreError;

      // 处理数据
      scoreStats = {};
      scores?.forEach((score: any) => {
        const dimension = score.dimension;
        if (!scoreStats[dimension]) {
          scoreStats[dimension] = {
            scores: [],
            distribution: {},
            average: 0,
            max: 0,
            min: 10
          };
        }
        scoreStats[dimension].scores.push(score.score);
        scoreStats[dimension].distribution[score.score] = (scoreStats[dimension].distribution[score.score] || 0) + 1;
        scoreStats[dimension].average = scoreStats[dimension].scores.reduce((a: number, b: number) => a + b, 0) / scoreStats[dimension].scores.length;
        scoreStats[dimension].max = Math.max(scoreStats[dimension].max, score.score);
        scoreStats[dimension].min = Math.min(scoreStats[dimension].min, score.score);
      });

      // 绘制图表
      setTimeout(() => {
        Object.keys(chartElements).forEach(dimension => {
          renderChart(dimension);
        });
      }, 100);
    } catch (error) {
      console.error('加载分析失败:', error);
    }
  }

  function renderChart(dimension: string) {
    if (!chartElements[dimension]) return;

    const ctx = chartElements[dimension].getContext('2d');
    if (!ctx) return;

    // 销毁旧图表
    if (chartInstances[dimension]) {
      chartInstances[dimension].destroy();
    }

    const stats = scoreStats[dimension];
    const labels = Object.keys(stats.distribution).map(Number).sort((a, b) => a - b);
    const data = labels.map(score => stats.distribution[score] || 0);

    chartInstances[dimension] = new ChartJS(ctx, {
      type: 'pie',
      data: {
        labels: labels.map(score => `${score}分`),
        datasets: [
          {
            data: data,
            backgroundColor: [
              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
              '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
            ],
            borderColor: '#fff',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: { size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${value}人 (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
</script>

<div class="analytics">
  <h2>任务分析数据</h2>

  <div class="summary">
    <div class="summary-card">
      <div class="icon">👥</div>
      <div class="info">
        <div class="label">参与人数</div>
        <div class="value">{submissions.length}</div>
      </div>
    </div>
  </div>

  {#if scoreStats && Object.keys(scoreStats).length > 0}
    <div class="charts-grid">
      {#each Object.entries(scoreStats) as [dimension, stats]}
        <div class="chart-container">
          <div class="chart-header">
            <h3>{dimension}</h3>
            <div class="stats-info">
              <span>平均: {stats.average.toFixed(1)}</span>
              <span>最高: {stats.max}</span>
              <span>最低: {stats.min}</span>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas bind:this={chartElements[dimension]}></canvas>
          </div>
        </div>
      {/each}
    </div>

    <div class="detail-table">
      <h3>详细数据表</h3>
      <table>
        <thead>
          <tr>
            <th>评分维度</th>
            <th>平均分</th>
            <th>最高分</th>
            <th>最低分</th>
            <th>参与人数</th>
          </tr>
        </thead>
        <tbody>
          {#each Object.entries(scoreStats) as [dimension, stats]}
            <tr>
              <td>{dimension}</td>
              <td>{stats.average.toFixed(1)}</td>
              <td>{stats.max}</td>
              <td>{stats.min}</td>
              <td>{stats.scores.length}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="no-data">暂无评分数据</div>
  {/if}
</div>

<style>
  .analytics {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .analytics h2 {
    margin: 0 0 20px 0;
    font-size: 24px;
    color: #333;
  }

  .summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 40px;
  }

  .summary-card {
    display: flex;
    align-items: center;
    gap: 15px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }

  .icon {
    font-size: 32px;
  }

  .info {
    flex: 1;
  }

  .label {
    font-size: 14px;
    opacity: 0.9;
  }

  .value {
    font-size: 28px;
    font-weight: bold;
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }

  .chart-container {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .chart-header {
    margin-bottom: 20px;
  }

  .chart-header h3 {
    margin: 0 0 10px 0;
    font-size: 18px;
    color: #333;
  }

  .stats-info {
    display: flex;
    gap: 15px;
    font-size: 14px;
    color: #666;
  }

  .stats-info span {
    background: #f5f5f5;
    padding: 4px 8px;
    border-radius: 4px;
  }

  .chart-wrapper {
    position: relative;
    height: 300px;
  }

  .detail-table {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .detail-table h3 {
    margin: 0 0 15px 0;
    font-size: 18px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead {
    background: #f5f5f5;
  }

  th {
    padding: 12px;
    text-align: left;
    font-weight: 600;
    color: #333;
    border-bottom: 2px solid #ddd;
  }

  td {
    padding: 12px;
    border-bottom: 1px solid #eee;
  }

  tr:hover {
    background: #f9f9f9;
  }

  .no-data {
    background: #f0f0f0;
    padding: 40px;
    border-radius: 8px;
    text-align: center;
    color: #999;
  }
</style>

import Chart from 'chart.js/auto'

const palette = ['#00C4CC', '#2F80ED', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444']

// Always use bar charts per requirement
export function randomChartType() { return 'bar' }

export function renderChart(canvas, labels, values, type) {
  if (!canvas) return null
  const labelPlugin = {
    id: 'insideLabels',
    afterDatasetsDraw(chart) {
      const { ctx, data } = chart
      const dataset = data.datasets[0]
      if (!dataset) return
      const total = (dataset.data || []).reduce((a, b) => a + (Number(b) || 0), 0) || 1
      ctx.save()
      ctx.font = '800 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'
      ctx.lineWidth = 3
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const meta = chart.getDatasetMeta(0)
      meta.data.forEach((bar, index) => {
        const v = Number(dataset.data[index] || 0)
        const percent = Math.round((v * 100) / total)
        const cx = bar.x
        const cy = (bar.y + bar.base) / 2
        ctx.strokeText(`${percent}%`, cx, cy)
        ctx.fillText(`${percent}%`, cx, cy)
      })
      ctx.restore()
    }
  }
  const data = {
    labels,
    datasets: [{
      label: 'Votes',
      data: values,
      backgroundColor: labels.map((_, i) => palette[i % palette.length]),
      borderWidth: 0,
      borderSkipped: false,
      borderRadius: 8,
    }]
  }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeOutCubic' },
    // Force vertical bars
    indexAxis: 'x',
    plugins: {
      legend: { display: type !== 'bar' },
      tooltip: { enabled: true },
    },
    scales: type === 'bar' ? {
      x: { ticks: { color: '#183247' }, grid: { color: 'rgba(24,50,71,0.06)' } },
      y: { beginAtZero: true, ticks: { color: '#183247', precision: 0 }, grid: { color: 'rgba(24,50,71,0.08)' } },
    } : {},
  }
  return new Chart(canvas.getContext('2d'), { type, data, options, plugins: [labelPlugin] })
}



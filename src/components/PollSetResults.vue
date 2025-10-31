<template>
  <div class="max-w-6xl mx-auto card flex flex-col overflow-hidden px-4 sm:px-6" style="max-height: calc(100vh - 100px); height: calc(100vh - 100px);">
    <!-- Sticky Header -->
    <div class="sticky top-0 bg-white z-10 pt-1 pb-3 mb-4 border-b border-gray-200 flex-shrink-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
      <h1 class="text-2xl sm:text-3xl font-bold text-primary mb-2">{{ setName || 'Poll Set Results' }}</h1>
      <p class="text-neutral">Complete results for all polls in this set</p>
    </div>
    
    <!-- Scrollable Content Area -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
      <div v-if="loading" class="text-center py-12 text-neutral">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
        <div class="text-lg">Loading results...</div>
      </div>
      
      <div v-else-if="!polls.length" class="text-center py-12 text-neutral text-lg">
        No polls found in this set.
      </div>
      
      <div v-else class="flex flex-col gap-6 pb-4">
        <div v-for="(poll, index) in polls" :key="poll.id" class="card px-4 sm:px-6">
          <div class="mb-4">
            <h2 class="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-1 break-words">
              {{ index + 1 }}. {{ poll.question }}
            </h2>
          </div>
        
        <!-- Text responses display -->
        <div v-if="poll.type === 'text'" class="flex flex-col gap-6">
          <div v-if="!poll.textResponses || poll.textResponses.length === 0" class="text-neutral text-center py-8 text-lg">
            No responses yet
          </div>
          <div v-else class="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 p-3 sm:p-6 min-h-[30vh] sm:min-h-[40vh]">
            <div
              v-for="(item, i) in getTextResponseItems(poll)"
              :key="i"
              class="inline-block transition-all duration-500"
              :style="{
                fontSize: item.fontSize + 'px',
                color: colors[i % colors.length],
                fontWeight: 'bold'
              }"
            >
              {{ item.text }} <span class="opacity-75">({{ item.percentage }}%)</span>
            </div>
          </div>
        </div>
        
        <!-- Bar chart for emoji type polls -->
        <div v-else-if="poll.type === 'emoji'">
          <div class="chart-container h-[40vh] sm:h-[50vh] mb-4">
            <canvas :ref="el => setCanvasRef(el, poll.id)"></canvas>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm sm:text-base">
            <div v-for="(item, i) in getDisplayItems(poll)" :key="i" class="flex items-center gap-2 p-2 rounded-md transition-colors" :class="{ 'bg-green-100 border-2 border-green-500': item.isCorrect, 'bg-white border border-gray-200': !item.isCorrect }">
              <span class="inline-block w-3 h-3 rounded-sm flex-shrink-0" :style="{ backgroundColor: colors[i % colors.length] }"></span>
              <span class="flex-1 break-words font-medium" :class="{ 'text-green-700 font-bold': item.isCorrect }">{{ item.label }}</span>
              <span v-if="item.isCorrect" class="text-green-600 text-xs font-semibold mr-2">✓</span>
              <span class="text-accent font-bold whitespace-nowrap">{{ item.percentage }}%</span>
              <span class="text-neutral text-xs whitespace-nowrap">({{ item.votes }})</span>
            </div>
          </div>
        </div>
        <!-- List display for other poll types -->
        <div v-else>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm sm:text-base">
            <div v-for="(item, i) in getDisplayItems(poll)" :key="i" class="flex items-center gap-2 p-2 rounded-md transition-colors" :class="{ 'bg-green-100 border-2 border-green-500': item.isCorrect, 'bg-white border border-gray-200': !item.isCorrect }">
              <span class="inline-block w-3 h-3 rounded-sm flex-shrink-0" :style="{ backgroundColor: colors[i % colors.length] }"></span>
              <span class="flex-1 break-words font-medium" :class="{ 'text-green-700 font-bold': item.isCorrect }">{{ item.label }}</span>
              <span v-if="item.isCorrect" class="text-green-600 text-xs font-semibold mr-2">✓</span>
              <span class="text-accent font-bold whitespace-nowrap">{{ item.percentage }}%</span>
              <span class="text-neutral text-xs whitespace-nowrap">({{ item.votes }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sticky Footer -->
    <div v-if="!loading && polls.length" class="flex justify-center gap-3 pt-3 pb-2 sticky bottom-0 bg-white border-t border-gray-200 flex-shrink-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
      <router-link class="btn text-sm sm:text-base justify-center" to="/sets">Back to Sets</router-link>
      <router-link class="btn text-sm sm:text-base justify-center" :to="`/sets/${setId}/polls`">View Polls</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { listPollIdsBySetSorted, getPoll, listPollSets } from '../utils/storage.js'
import { renderChart } from '../utils/charts.js'

const route = useRoute()
const setId = computed(() => route.params.setId)
const polls = ref([])
const setName = ref('')
const loading = ref(true)
const canvasRefs = ref({})
const chartInstances = ref({})

const colors = ['#00C4CC', '#2F80ED', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444']

function setCanvasRef(el, pollId) {
  if (el) {
    canvasRefs.value[pollId] = el
  }
}

function consolidateTextResponses(textResponses) {
  if (!textResponses || !textResponses.length) return []
  
  const groups = new Map()
  textResponses.forEach(response => {
    const normalized = response.trim().toLowerCase()
    const original = response.trim()
    
    if (!groups.has(normalized)) {
      groups.set(normalized, { text: original, count: 0 })
    }
    groups.get(normalized).count++
  })
  
  return Array.from(groups.values())
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.text.localeCompare(b.text)
    })
}

function getTextResponseItems(poll) {
  if (poll.type !== 'text' || !poll.textResponses) return []
  
  const consolidated = consolidateTextResponses(poll.textResponses)
  const total = consolidated.reduce((sum, item) => sum + item.count, 0) || 1
  
  const maxFont = 48
  const minFont = 14
  
  return consolidated.map(item => {
    const percentage = Math.round((item.count * 100) / total)
    const fontSize = Math.max(minFont, Math.min(maxFont, minFont + (percentage / 100) * (maxFont - minFont)))
    return {
      text: item.text,
      percentage,
      fontSize
    }
  })
}

function isCorrectAnswer(poll, index) {
  if (!poll || poll.answer === null || poll.answer === undefined) return false
  const answer = poll.answer
  const pollType = poll.type
  
  if (pollType === 'multiple' || pollType === 'emoji' || pollType === 'star') {
    return parseInt(answer) === index
  } else if (pollType === 'like') {
    return answer === poll.options[index]
  }
  return false
}

function getDisplayItems(poll) {
  if (!poll.options || !poll.votes) return []
  
  const total = poll.votes.reduce((sum, v) => sum + (v || 0), 0) || 1
  return poll.options.map((option, i) => ({
    label: option,
    percentage: Math.round(((poll.votes[i] || 0) * 100) / total),
    votes: poll.votes[i] || 0,
    isCorrect: isCorrectAnswer(poll, i)
  }))
}

async function loadResults() {
  loading.value = true
  try {
    // Load set name
    const sets = await listPollSets()
    const set = sets.find(s => s.id === setId.value)
    setName.value = set?.name || ''
    
    // Load all poll IDs for the set
    const pollIds = await listPollIdsBySetSorted(setId.value)
    
    // Load all polls with their results
    const pollsData = []
    for (const pollId of pollIds) {
      const poll = await getPoll(pollId)
      if (poll) {
        pollsData.push(poll)
      }
    }
    
    polls.value = pollsData
    
    // Render charts after polls are loaded
    await nextTick()
    renderAllCharts()
  } catch (error) {
    console.error('Error loading results:', error)
  } finally {
    loading.value = false
  }
}

function renderAllCharts() {
  polls.value.forEach(poll => {
    if (poll.type !== 'emoji') return
    
    const canvas = canvasRefs.value[poll.id]
    if (!canvas) return
    
    // Destroy existing chart if it exists
    if (chartInstances.value[poll.id]) {
      chartInstances.value[poll.id].destroy()
    }
    
    const labels = poll.options || []
    const values = poll.votes || []
    
    if (labels.length > 0 && values.length > 0) {
      // Ensure canvas matches container size
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
      chartInstances.value[poll.id] = renderChart(canvas, labels, values, 'bar')
    }
  })
}

onMounted(loadResults)
</script>

<style scoped>
.chart-container {
  @apply bg-white rounded-xl p-4 sm:p-6 shadow-md border border-gray-200;
}
</style>

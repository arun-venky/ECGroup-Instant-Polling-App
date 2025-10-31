<template>
  <div class="max-w-6xl mx-auto card relative px-4 sm:px-6">
    <h2 class="mb-3 pr-12 sm:pr-16 text-xl sm:text-2xl md:text-3xl break-words">{{ poll?.question || 'Results' }}</h2>
    <!-- QR tooltip trigger (hover/tap to show) -->
    <div v-if="poll" class="absolute top-3 right-3 group">
      <button class="px-3 py-1 rounded-md bg-secondary text-white text-xs sm:text-sm min-h-[32px]" @click="showQR = !showQR">QR</button>
      <div class="invisible opacity-0 group-hover:visible group-hover:opacity-100 sm:transition-opacity sm:duration-200 absolute right-0 mt-2 z-30 bg-white text-neutral rounded-lg border border-gray-200 shadow p-3" :class="{ '!visible !opacity-100': showQR }">
        <div class="flex items-center justify-center">
          <Qrcode :value="voteUrl" :size="120" level="H" class="sm:w-32 sm:h-32" />
        </div>
      </div>
    </div>

    <div v-if="!poll" class="text-neutral">Poll not found.</div>

    <div v-else class="flex flex-col gap-4">
      <!-- Text responses display with font size based on percentage -->
      <div v-if="poll.type === 'text'" class="flex flex-col gap-6">
        <div v-if="!consolidatedTextResponses || consolidatedTextResponses.length === 0" class="text-neutral text-center py-12 text-xl">
          No responses yet
        </div>
        <div v-else class="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 p-3 sm:p-6 min-h-[40vh] sm:min-h-[50vh] md:min-h-[60vh]">
          <div
            v-for="(item, i) in textResponseItems"
            :key="i"
            class="inline-block transition-all duration-500"
            :style="{
              fontSize: item.fontSize + 'px',
              color: colors[i % colors.length],
              fontWeight: 'bold'
            }"
          >
            {{ item.text }}<span v-if="!present" class="opacity-75"> ({{ item.percentage }}%)</span>
          </div>
        </div>
      </div>
      
      <!-- Chart display for other poll types -->
      <template v-else>
        <div class="chart-container h-[50vh] sm:h-[60vh]">
          <canvas ref="canvasEl"></canvas>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-base">
          <div v-for="(item, i) in displayItems" :key="i" class="flex items-center gap-2">
            <span class="inline-block w-3 h-3 rounded-sm" :style="{ backgroundColor: colors[i % colors.length] }"></span>
            <span class="flex-1 break-words">{{ item.label }}</span>
            <span class="text-accent font-bold whitespace-nowrap">{{ item.percentage }}%</span>
          </div>
        </div>
      </template>
      <div class="flex flex-wrap gap-2 sm:gap-3 mt-2 justify-center items-center">
        <router-link class="btn text-xs sm:text-sm md:text-base flex-1 sm:flex-none min-w-[100px] justify-center py-2" :to="`/poll/${id}`">Back to Vote</router-link>
        <router-link class="btn text-xs sm:text-sm md:text-base flex-1 sm:flex-none min-w-[120px] justify-center py-2" :to="`/results/${id}?present=true`">Presentation</router-link>
        <router-link v-if="present" class="btn text-xs sm:text-sm md:text-base flex-1 sm:flex-none min-w-[120px] justify-center py-2" :to="`/results/${id}`">Exit Present</router-link>
        <button class="btn text-xs sm:text-sm md:text-base flex-1 sm:flex-none min-w-[100px] justify-center py-2" @click="go(-1)">Previous</button>
        <button class="btn text-xs sm:text-sm md:text-base flex-1 sm:flex-none min-w-[100px] justify-center py-2" @click="go(1)">Next</button>
      </div>
      <ConfettiReveal />
    </div>
    <!-- Fixed QR panel (left-bottom) - minimal overlay to avoid disturbing presentation area -->
    <div v-if="poll" class="fixed left-2 sm:left-3 bottom-2 sm:bottom-3 z-10 hidden sm:flex items-center bg-white/90 backdrop-blur rounded-lg border border-gray-200 shadow p-2 sm:p-3">
      <Qrcode :value="voteUrl" :size="100" level="H" class="sm:w-30 sm:h-30" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPoll, getAdjacentPollIdSameSet, subscribeToPoll } from '../utils/storage.js'
import { renderChart } from '../utils/charts.js'
import { playRevealSound, setBackgroundMusic, playBackgroundMusic, stopBackgroundMusic } from '../utils/sound.js'
import ConfettiReveal from './ConfettiReveal.vue'
import QrcodeVue from 'qrcode.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id)
const present = computed(() => route.query.present === 'true')
const poll = ref(null)
const showQR = ref(false)
const canvasEl = ref(null)
let chartInstance = null

const colors = ['#00C4CC', '#2F80ED', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444']

// Register the component properly for template use
const Qrcode = QrcodeVue

function encodePoll(p) {
  if (!p) return ''
  try {
    const { id, question, type, options, setId } = p
    const json = JSON.stringify({ id, question, type, options, setId })
    return window.btoa(unescape(encodeURIComponent(json)))
  } catch { return '' }
}

const BASE = 'https://ecgroupinstantpolling.netlify.app/index.html'
const voteUrl = computed(() => {
  const data = encodePoll(poll.value)
  const pid = id.value
  const setId = poll.value?.setId
  const path = setId ? `/sets/${setId}/polls/${pid}` : `/poll/${pid}`
  return data ? `${BASE}?poll=${pid}&data=${data}#${path}` : `${BASE}?poll=${pid}#${path}`
})

async function copyLink() {
  await navigator.clipboard.writeText(voteUrl.value)
}

// Consolidate text responses into grouped counts
const consolidatedTextResponses = computed(() => {
  if (!poll.value || poll.value.type !== 'text' || !poll.value.textResponses) {
    return []
  }
  
  // Group responses by normalized text (trimmed, case-insensitive)
  const groups = new Map()
  poll.value.textResponses.forEach(response => {
    const normalized = response.trim().toLowerCase()
    const original = response.trim()
    
    if (!groups.has(normalized)) {
      groups.set(normalized, { text: original, count: 0 })
    }
    groups.get(normalized).count++
  })
  
  // Convert to array and sort by count (descending), then by text (ascending) for ties
  return Array.from(groups.values())
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.text.localeCompare(b.text)
    })
})

// For text polls: labels are consolidated response texts, values are counts
// For other polls: labels are options, values are votes
const displayLabels = computed(() => {
  if (poll.value?.type === 'text') {
    return consolidatedTextResponses.value.map(item => item.text)
  }
  return poll.value?.options || []
})

const displayValues = computed(() => {
  if (poll.value?.type === 'text') {
    return consolidatedTextResponses.value.map(item => item.count)
  }
  return poll.value?.votes || []
})

// Animated display values to show rising votes
const displayedVotes = ref([])
const total = computed(() => (displayedVotes.value.length ? displayedVotes.value.reduce((a, b) => a + b, 0) : 0))
const percentages = computed(() => {
  const t = total.value || 1
  return (displayedVotes.value || []).map(v => Math.round((v * 100) / t))
})

// Items to display with labels and percentages
const displayItems = computed(() => {
  const labels = displayLabels.value
  const percents = percentages.value
  return labels.map((label, i) => ({
    label,
    percentage: percents[i] || 0
  }))
})

// Text response items with font sizes based on percentage
const textResponseItems = computed(() => {
  if (!poll.value || poll.value.type !== 'text') {
    return []
  }
  
  const items = consolidatedTextResponses.value
  if (items.length === 0) return []
  
  // Calculate percentages
  const total = items.reduce((sum, item) => sum + item.count, 0)
  if (total === 0) return []
  
  // Calculate percentages for each item
  const percentages = items.map(item => Math.round((item.count * 100) / total))
  const maxPercent = Math.max(...percentages, 1) // At least 1 to avoid division by zero
  
  // Font size range: min 20px (for smallest), max 96px (for highest percentage)
  const minFontSize = 20
  const maxFontSize = 96
  
  // Scale font size proportionally: smallest percentage gets minFontSize, largest gets maxFontSize
  // All others scale linearly between min and max based on their percentage relative to maxPercent
  const minPercent = Math.min(...percentages)
  const percentRange = maxPercent - minPercent || 1 // Avoid division by zero
  
  return items.map((item, i) => {
    const percent = percentages[i]
    // Scale linearly from minFontSize to maxFontSize based on position in range
    const fontSize = percentRange > 0
      ? minFontSize + ((percent - minPercent) / percentRange) * (maxFontSize - minFontSize)
      : minFontSize // All same size if all percentages are equal
    
    return {
      text: item.text,
      count: item.count,
      percentage: percent,
      fontSize: Math.round(fontSize)
    }
  })
})

function draw() {
  if (!poll.value || !canvasEl.value || poll.value.type === 'text') return
  if (chartInstance) {
    chartInstance.destroy()
  }
  // Ensure canvas matches container size
  const parent = canvasEl.value.parentElement
  if (parent) {
    canvasEl.value.width = parent.clientWidth
    canvasEl.value.height = parent.clientHeight
  }
  const labels = displayLabels.value
  const values = displayedVotes.value.length ? displayedVotes.value : displayValues.value
  chartInstance = renderChart(canvasEl.value, labels, values, 'bar')
}

let unsubscribePoll = null

onMounted(async () => {
  poll.value = await getPoll(id.value)
  if (poll.value) {
    // For text polls, we don't use charts or displayedVotes
    if (poll.value.type === 'text') {
      // Text responses will be displayed via textResponseItems computed property
    } else {
      // Get initial values based on poll type
      const initialValues = displayValues.value
      // If presentation mode, animate in from zero
      if (present.value) {
        const zeros = Array.from({ length: initialValues.length }, () => 0)
        displayedVotes.value = [...zeros]
        draw()
        animateVotes(zeros, initialValues, 1000)
      } else {
        displayedVotes.value = [...initialValues]
        draw()
      }
    }
  } else {
    displayedVotes.value = []
    if (canvasEl.value && poll.value?.type !== 'text') draw()
  }
  
  // Set up real-time listener for poll updates
  unsubscribePoll = subscribeToPoll(id.value, (updatedPoll) => {
    if (updatedPoll) {
      const prev = poll.value
      poll.value = updatedPoll
      
      // For text polls, updates are handled automatically via computed properties
      if (updatedPoll.type === 'text') {
        return
      }
      
      // For other poll types, animate vote changes
      const oldVals = displayedVotes.value.length ? [...displayedVotes.value] : (prev?.votes || [])
      const newVals = updatedPoll.votes || []
      
      // Only animate if values actually changed
      if (JSON.stringify(oldVals) !== JSON.stringify(newVals)) {
        // Ensure arrays are same length for animation
        const maxLen = Math.max(oldVals.length, newVals.length)
        while (oldVals.length < maxLen) oldVals.push(0)
        while (newVals.length < maxLen) newVals.push(0)
        animateVotes(oldVals, newVals, 800)
      }
    }
  })
  
  await nextTick()
  playRevealSound()
  if (present.value) {
    setBackgroundMusic('/assets/sounds/reveal.mp3', 0.8)
    playBackgroundMusic(0.15)
  }
  window.addEventListener('resize', draw)
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', draw)
  window.removeEventListener('keydown', onKeyDown)
  if (unsubscribePoll) {
    unsubscribePoll()
    unsubscribePoll = null
  }
  if (chartInstance) chartInstance.destroy()
  if (present.value) stopBackgroundMusic()
})

watch(() => route.fullPath, async () => {
  // Unsubscribe from previous poll
  if (unsubscribePoll) {
    unsubscribePoll()
    unsubscribePoll = null
  }
  
  // Load new poll
  poll.value = await getPoll(id.value)
  if (poll.value) {
    if (poll.value.type === 'text') {
      // Text polls don't use displayedVotes
    } else {
      displayedVotes.value = [...displayValues.value]
    }
  } else {
    displayedVotes.value = []
  }
  
  // Set up listener for new poll
  unsubscribePoll = subscribeToPoll(id.value, (updatedPoll) => {
    if (updatedPoll) {
      const prev = poll.value
      poll.value = updatedPoll
      
      // For text polls, updates are handled automatically via computed properties
      if (updatedPoll.type === 'text') {
        return
      }
      
      // For other poll types, animate vote changes
      const oldVals = displayedVotes.value.length ? [...displayedVotes.value] : (prev?.votes || [])
      const newVals = updatedPoll.votes || []
      
      // Only animate if values actually changed
      if (JSON.stringify(oldVals) !== JSON.stringify(newVals)) {
        // Ensure arrays are same length for animation
        const maxLen = Math.max(oldVals.length, newVals.length)
        while (oldVals.length < maxLen) oldVals.push(0)
        while (newVals.length < maxLen) newVals.push(0)
        animateVotes(oldVals, newVals, 800)
      }
    }
  })
  
  if (poll.value?.type !== 'text') {
    draw()
  }
})

watch(present, async (isOn) => {
  if (isOn) {
    setBackgroundMusic('/assets/sounds/reveal.mp3', 0.8)
    playBackgroundMusic(0.15)
    // Re-animate bars when entering presentation (only for non-text polls)
    const latest = await getPoll(id.value)
    if (latest && latest.type !== 'text') {
      const currentValues = latest.votes || []
      const from = displayedVotes.value.length ? [...displayedVotes.value] : Array.from({ length: currentValues.length }, () => 0)
      animateVotes(from, currentValues, 1000)
    }
  } else {
    stopBackgroundMusic()
  }
})

// Real-time updates are handled by the Firestore listener in onMounted

function animateVotes(from, to, duration = 800) {
  const start = performance.now()
  const fromArr = [...from]
  const toArr = [...to]
  const len = Math.max(fromArr.length, toArr.length)
  while (fromArr.length < len) fromArr.push(0)
  while (toArr.length < len) toArr.push(0)
  function frame(now) {
    const t = Math.min(1, (now - start) / duration)
    const ease = t < 0.5 ? 2*t*t : -1 + (4 - 2*t) * t
    const cur = fromArr.map((v, i) => v + (toArr[i] - v) * ease)
    displayedVotes.value = cur
    if (chartInstance) {
      chartInstance.data.datasets[0].data = cur
      chartInstance.update('none')
    }
    if (t < 1) requestAnimationFrame(frame)
    else {
      displayedVotes.value = [...toArr]
      if (chartInstance) {
        chartInstance.data.datasets[0].data = toArr
        chartInstance.update()
      }
    }
  }
  requestAnimationFrame(frame)
}

async function go(step) {
  const currentId = id.value
  const targetId = await getAdjacentPollIdSameSet(currentId, step)
  if (!targetId) return
  const setId = poll.value?.setId
  if (present.value) {
    if (setId) router.push(`/sets/${setId}/results/${targetId}?present=true`)
    else router.push(`/results/${targetId}?present=true`)
  } else {
    if (setId) router.push(`/sets/${setId}/results/${targetId}`)
    else router.push(`/results/${targetId}`)
  }
}

function onKeyDown(e) {
  if (!present.value) return
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    go(1)
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    go(-1)
  }
}
</script>

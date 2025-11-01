<template>
        <div class="max-w-6xl mx-auto card flex flex-col overflow-hidden px-4 sm:px-6" style="max-height: calc(100vh - 100px); height: calc(100vh - 100px);">
          <!-- Sticky Header -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sticky top-0 bg-white z-10 pt-1 pb-3 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-gray-200 flex-shrink-0">
            <div class="flex-1">
              <h2 class="text-xl sm:text-2xl md:text-3xl break-words">{{ poll?.question || 'Results' }}</h2>
              <div v-if="poll?.questionImage" class="mt-3 flex justify-center">
                <img :src="poll.questionImage" alt="Question image" class="max-w-full max-h-24 object-contain rounded-md border border-gray-200" />
              </div>
            </div>
          </div>

    <!-- Scrollable Content Area -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
    <div v-if="loading" class="text-neutral text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
      <div>Loading results...</div>
    </div>
    <div v-else-if="loadError || !poll" class="text-neutral text-center py-12">
      <div class="mb-4">Poll not found.</div>
      <button class="btn" @click="loadPoll">Retry</button>
    </div>

    <div v-else class="flex flex-col gap-4 pb-4">
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
      
      <!-- Bar chart for all non-text poll types -->
      <template v-else>
        <!-- Sticky Options List -->
        <div v-if="poll.type === 'image'" class="sticky top-0 bg-white z-20 py-2 mb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-gray-200 flex-shrink-0">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="(item, i) in displayItems" :key="i" class="flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg" :class="{ 'border-green-500 border-2 bg-green-50': item.isCorrect }">
              <img :src="displayLabels[i]" alt="Option" class="w-full h-48 object-contain rounded-md" />
              <div class="flex items-center gap-2 w-full justify-center">
                <span v-if="item.isCorrect" class="text-green-600 text-sm font-semibold">✓</span>
                <span class="text-accent font-bold">{{ item.percentage }}%</span>
                <span class="text-neutral text-xs">({{ item.votes }})</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="sticky top-0 bg-white z-20 py-2 mb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-gray-200 flex-shrink-0">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm sm:text-base">
            <div v-for="(item, i) in displayItems" :key="i" class="flex items-center gap-2">
              <span v-if="item.labelType !== 'like'" class="inline-block w-3 h-3 rounded-sm flex-shrink-0" :style="{ backgroundColor: colors[i % colors.length] }"></span>
              <span v-else class="inline-block flex-shrink-0">
                <svg v-if="displayLabels[i] === 'Like'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 20h2c.55 0 1-.45 1-1v-7c0-.55-.45-1-1-1H2v9zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.5 8.5C7.07 8.93 6.83 9.53 6.83 10.17V15c0 1.1.9 2 2 2h7.33c.52 0 .99-.2 1.34-.56l3.33-3.33c.33-.33.5-.78.5-1.22s-.17-.89-.5-1.22z" />
                </svg>
                <svg v-else-if="displayLabels[i] === 'Dislike'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 3H6c-.83 0-1.54.5-1.85 1.22l-3.02 7.05c-.09.23-.13.47-.13.73v1.91l.01.01L1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
                </svg>
              </span>
              <span class="flex-1 break-words">{{ item.label }}</span>
              <span class="text-accent font-bold whitespace-nowrap">{{ item.percentage }}%</span>
              <span class="text-neutral text-xs whitespace-nowrap">({{ item.votes }})</span>
            </div>
          </div>
        </div>
        <!-- Scrollable Chart Container -->
        <div v-if="poll.type !== 'image'" class="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
          <div class="chart-container w-full bg-white rounded-xl p-4 sm:p-6 shadow-md border border-gray-200" style="position: relative; min-height: 300px; height: 400px;">
            <canvas ref="canvasEl" style="display: block;"></canvas>
          </div>
        </div>
      </template>
    </div>
    </div>

    <!-- Sticky Footer -->
    <div v-if="!loading && !loadError && poll" class="flex flex-wrap gap-2 sm:gap-3 justify-center items-center pt-3 pb-2 sticky bottom-0 bg-white border-t border-gray-200 flex-shrink-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
      <router-link class="btn text-xs sm:text-sm md:text-base flex-1 sm:flex-none min-w-[100px] justify-center py-2" :to="`/poll/${id}`">Back to Vote</router-link>
      <router-link v-if="present" class="btn text-xs sm:text-sm md:text-base flex-1 sm:flex-none min-w-[100px] justify-center py-2" to="/sets">Home</router-link>
      <button v-if="hasPrevious" class="btn text-xs sm:text-sm md:text-base flex-1 sm:flex-none min-w-[100px] justify-center py-2" @click="go(-1)">Previous</button>
      <button v-if="hasNext" class="btn text-xs sm:text-sm md:text-base flex-1 sm:flex-none min-w-[100px] justify-center py-2" @click="go(1)">Next</button>
      <router-link v-if="poll?.setId" class="btn text-xs sm:text-sm md:text-base flex-1 sm:flex-none min-w-[150px] justify-center py-2" :to="`/sets/${poll.setId}/results`">View All Results</router-link>
    </div>
    <ConfettiReveal />
    <!-- Fixed QR panel (left-bottom) - minimal overlay to avoid disturbing presentation area -->
    <div v-if="poll" class="fixed left-2 sm:left-3 bottom-2 sm:bottom-3 z-10 hidden sm:flex items-center bg-white/90 backdrop-blur rounded-lg border border-gray-200 shadow p-2 sm:p-3">
      <Qrcode :value="voteUrl" :size="225" level="H" class="sm:w-60 sm:h-60" />
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
const hasNext = ref(false)
const hasPrevious = ref(false)
const loading = ref(true)
const loadError = ref(false)
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

// Animated display values to show rising votes (for polls with charts)
const displayedVotes = ref([])

// Calculate percentages directly from display values
const total = computed(() => {
  const values = poll.value?.type !== 'text' && displayedVotes.value.length 
    ? displayedVotes.value 
    : displayValues.value
  return values.length ? values.reduce((a, b) => a + b, 0) : 0
})

const percentages = computed(() => {
  const values = poll.value?.type !== 'text' && displayedVotes.value.length 
    ? displayedVotes.value 
    : displayValues.value
  const t = total.value || 1
  return values.map(v => Math.round((v * 100) / t))
})

// Check if an option is the correct answer
const isCorrectAnswer = (index) => {
  if (!poll.value || poll.value.answer === null || poll.value.answer === undefined) return false
  const answer = poll.value.answer
  const pollType = poll.value.type
  
  if (pollType === 'multiple' || pollType === 'emoji' || pollType === 'star' || pollType === 'image') {
    return parseInt(answer) === index
  } else if (pollType === 'like') {
    return answer === poll.value.options[index]
  }
  return false
}

// Items to display with labels, percentages, vote counts, and correct answer indicator
const displayItems = computed(() => {
  const labels = displayLabels.value
  const percents = percentages.value
  const values = poll.value?.type !== 'text' && displayedVotes.value.length 
    ? displayedVotes.value 
    : displayValues.value
  
  return labels.map((label, i) => {
    // For star polls, format label to show actual number of stars
    // For like polls, add thumbs up/down icons
    let formattedLabel = label
    let labelType = 'text' // 'text', 'star', 'like'
    
    if (poll.value?.type === 'star') {
      // Extract number from label (e.g., "1 ⭐" -> 1, "5 ⭐" -> 5)
      const match = label.match(/^(\d+)/)
      if (match) {
        const starCount = parseInt(match[1])
        formattedLabel = '⭐'.repeat(starCount)
        labelType = 'star'
      }
    } else if (poll.value?.type === 'like') {
      labelType = 'like'
    } else if (poll.value?.type === 'image') {
      labelType = 'image'
    }
    
    return {
      label: formattedLabel,
      labelType,
      percentage: percents[i] || 0,
      votes: values[i] || 0,
      isCorrect: isCorrectAnswer(i)
    }
  })
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
  
  const parent = canvasEl.value.parentElement
  if (!parent) {
    // Retry if container not ready yet
    setTimeout(() => {
      if (poll.value && canvasEl.value && poll.value.type !== 'text') {
        draw()
      }
    }, 100)
    return
  }
  
  // Wait for container to have dimensions
  const containerWidth = parent.clientWidth
  const containerHeight = parent.clientHeight || 400
  
  if (containerWidth === 0 || containerHeight === 0) {
    // Retry if container dimensions not ready yet
    setTimeout(() => {
      if (poll.value && canvasEl.value && poll.value.type !== 'text') {
        draw()
      }
    }, 200)
    return
  }
  
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  
  // Don't render charts for image polls - they use image grid display
  if (poll.value?.type === 'image') return
  
  try {
    let labels = displayLabels.value
    const values = displayedVotes.value.length ? displayedVotes.value : displayValues.value
    
    // Format labels for star polls in charts
    if (poll.value?.type === 'star') {
      labels = labels.map(label => {
        const match = label.match(/^(\d+)/)
        if (match) {
          const starCount = parseInt(match[1])
          return '⭐'.repeat(starCount)
        }
        return label
      })
    } else if (poll.value?.type === 'like') {
      // Format labels for like/dislike polls in charts using emoji
      labels = labels.map(label => {
        if (label === 'Like') return '👍 Like'
        if (label === 'Dislike') return '👎 Dislike'
        return label
      })
    } else if (poll.value?.type === 'image') {
      // For image polls, use placeholder text for chart labels
      labels = labels.map((label, i) => `Image ${i + 1}`)
    }
    
    if (labels.length === 0 || values.length === 0) {
      console.warn('No data to render chart')
      return
    }
    
    // Don't manually set canvas dimensions - let Chart.js handle it with responsive: true
    // Chart.js will use the container's dimensions when maintainAspectRatio is false
    chartInstance = renderChart(canvasEl.value, labels, values, 'bar')
    
    if (!chartInstance) {
      console.error('Failed to create chart instance')
    } else {
      // Force chart to resize to match container
      chartInstance.resize()
    }
  } catch (error) {
    console.error('Error rendering chart:', error)
  }
}

let unsubscribePoll = null

async function loadPoll() {
  loading.value = true
  loadError.value = false
  try {
    const loadedPoll = await getPoll(id.value)
    if (loadedPoll) {
      poll.value = loadedPoll
      // For non-text polls, set up chart animation
      if (poll.value.type !== 'text') {
        const initialValues = displayValues.value
        if (present.value) {
          const zeros = Array.from({ length: initialValues.length }, () => 0)
          displayedVotes.value = [...zeros]
        } else {
          displayedVotes.value = [...initialValues]
        }
        
        // Wait for DOM to update and ensure canvas is ready
        await nextTick()
        // Longer delay to ensure canvas container has dimensions
        await new Promise(resolve => setTimeout(resolve, 150))
        
        // Try drawing multiple times if needed
        let attempts = 0
        const tryDraw = () => {
          if (canvasEl.value && poll.value && poll.value.type !== 'text') {
            draw()
            // If chart still not created after a moment, retry
            if (!chartInstance && attempts < 3) {
              attempts++
              setTimeout(tryDraw, 200)
            }
          }
        }
        tryDraw()
        
        if (present.value) {
          animateVotes(zeros, initialValues, 1000)
        }
      }
      // Check if there's a next poll
      await checkHasNext()
      loadError.value = false
    } else {
      loadError.value = true
      console.warn('Poll not found:', id.value)
    }
  } catch (error) {
    console.error('Error loading poll:', error)
    loadError.value = true
  } finally {
    loading.value = false
  }
}

// Watch for canvas element to become available
watch(canvasEl, async (newCanvas) => {
  if (newCanvas && poll.value && poll.value.type !== 'text' && !chartInstance) {
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))
    draw()
  }
}, { flush: 'post' })

onMounted(async () => {
  await loadPoll()
  
  // Set up real-time listener for poll updates (only if poll loaded successfully)
  if (poll.value) {
    unsubscribePoll = subscribeToPoll(id.value, (updatedPoll) => {
      if (updatedPoll) {
        const prev = poll.value
        poll.value = updatedPoll
        
        // For non-text polls, animate vote changes
        if (updatedPoll.type !== 'text') {
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
      }
    })
  }
  
  await nextTick()
  playRevealSound()
  if (present.value) {
    setBackgroundMusic('/assets/sounds/reveal.mp3', 0.8)
    playBackgroundMusic(0.15)
  }
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', onKeyDown)
})

function handleResize() {
  if (poll.value && poll.value.type !== 'text' && canvasEl.value) {
    draw()
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', onKeyDown)
  if (unsubscribePoll) {
    unsubscribePoll()
    unsubscribePoll = null
  }
  if (chartInstance) chartInstance.destroy()
  if (present.value) stopBackgroundMusic()
})

async function checkHasNext() {
  if (!poll.value) {
    hasNext.value = false
    hasPrevious.value = false
    return
  }
  const nextId = await getAdjacentPollIdSameSet(id.value, 1)
  hasNext.value = !!nextId
  // Check for previous poll to determine if set has more than one poll
  const prevId = await getAdjacentPollIdSameSet(id.value, -1)
  hasPrevious.value = !!prevId
}

watch(() => route.fullPath, async () => {
  // Unsubscribe from previous poll
  if (unsubscribePoll) {
    unsubscribePoll()
    unsubscribePoll = null
  }
  
  // Load new poll
  await loadPoll()
  
  // Set up listener for new poll (only if poll loaded successfully)
  if (poll.value) {
    unsubscribePoll = subscribeToPoll(id.value, (updatedPoll) => {
      if (updatedPoll) {
        const prev = poll.value
        poll.value = updatedPoll
        
        // For non-text polls, animate vote changes
        if (updatedPoll.type !== 'text') {
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
      }
    })
    
    if (poll.value?.type !== 'text') {
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 150))
      // Try drawing multiple times if needed
      let attempts = 0
      const tryDraw = () => {
        if (canvasEl.value && poll.value && poll.value.type !== 'text') {
          draw()
          // If chart still not created after a moment, retry
          if (!chartInstance && attempts < 3) {
            attempts++
            setTimeout(tryDraw, 200)
          }
        }
      }
      tryDraw()
    }
  }
})

watch(present, async (isOn) => {
  if (isOn) {
    setBackgroundMusic('/assets/sounds/reveal.mp3', 0.8)
    playBackgroundMusic(0.15)
    // Re-animate bars when entering presentation (for all non-text polls)
    const latest = await getPoll(id.value)
    if (latest && latest.type !== 'text') {
      const currentValues = latest.votes || []
      const from = displayedVotes.value.length ? [...displayedVotes.value] : Array.from({ length: currentValues.length }, () => 0)
      // Ensure chart is drawn first
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))
      if (!displayedVotes.value.length) {
        displayedVotes.value = [...from]
      }
      draw()
      animateVotes(from, currentValues, 1000)
    }
  } else {
    stopBackgroundMusic()
  }
})

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
  } else if (e.key === 'Home' || (e.key === 'h' && !e.ctrlKey && !e.metaKey)) {
    e.preventDefault()
    router.push('/sets')
  }
}
</script>

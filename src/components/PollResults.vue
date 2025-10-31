<template>
  <div class="max-w-6xl mx-auto card relative">
    <h2 class="mb-3 pr-16 text-2xl sm:text-3xl">{{ poll?.question || 'Results' }}</h2>
    <!-- QR tooltip trigger (hover to show, copy link allowed) -->
    <div v-if="poll" class="absolute top-3 right-3 group">
      <button class="px-3 py-1 rounded-md bg-secondary text-white text-xs sm:text-sm">QR</button>
      <div class="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-200 absolute right-0 mt-2 z-30 bg-white text-neutral rounded-lg border border-gray-200 shadow p-3 w-64">
        <div class="text-xs mb-2">Scan or copy link</div>
        <div class="flex items-center justify-center mb-2">
          <qrcode-vue :value="voteUrl" :size="128" level="H" />
        </div>
        <div class="text-[10px] break-all mb-2 select-text">{{ voteUrl }}</div>
        <button class="w-full" @click="copyLink">Copy link</button>
      </div>
    </div>

    <div v-if="!poll" class="text-neutral">Poll not found.</div>

    <div v-else class="flex flex-col gap-4">
      <div class="chart-container h-[50vh] sm:h-[60vh]">
        <canvas ref="canvasEl"></canvas>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-base">
        <div v-for="(opt, i) in poll.options" :key="i" class="flex items-center gap-2">
          <span class="inline-block w-3 h-3 rounded-sm" :style="{ backgroundColor: colors[i % colors.length] }"></span>
          <span class="flex-1">{{ opt }}</span>
          <span class="text-accent font-bold">{{ percentages[i] }}%</span>
        </div>
      </div>
      <div class="flex flex-wrap gap-3 mt-2 justify-center text-center">
        <router-link class="btn w-full sm:w-auto" :to="`/poll/${id}`">Back to Vote</router-link>
        <router-link class="btn w-full sm:w-auto" :to="`/results/${id}?present=true`">Presentation Mode</router-link>
        <router-link v-if="present" class="btn w-full sm:w-auto" :to="`/results/${id}`">Exit Presentation</router-link>
        <button class="w-full sm:w-auto" @click="go(-1)">Previous</button>
        <button class="w-full sm:w-auto" @click="go(1)">Next</button>
      </div>
      <ConfettiReveal />
    </div>
    <!-- Fixed QR panel (left-bottom) - minimal overlay to avoid disturbing presentation area -->
    <div v-if="poll" class="fixed left-3 bottom-3 z-10 hidden sm:flex items-center gap-3 bg-white/90 backdrop-blur rounded-lg border border-gray-200 shadow p-3 w-72">
      <qrcode-vue :value="voteUrl" :size="120" level="H" />
      <div class="flex-1 min-w-0">
        <div class="text-[10px] text-neutral break-all leading-tight">{{ voteUrl }}</div>
        <button class="mt-2 w-full px-2 py-1 rounded bg-primary text-dark text-xs font-bold" @click="copyLink">Copy</button>
      </div>
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
const canvasEl = ref(null)
let chartInstance = null

const colors = ['#00C4CC', '#2F80ED', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444']

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

// Animated display values to show rising votes
const displayedVotes = ref([])
const total = computed(() => (displayedVotes.value.length ? displayedVotes.value.reduce((a, b) => a + b, 0) : 0))
const percentages = computed(() => {
  const t = total.value || 1
  return (displayedVotes.value || []).map(v => Math.round((v * 100) / t))
})

function draw() {
  if (!poll.value || !canvasEl.value) return
  if (chartInstance) {
    chartInstance.destroy()
  }
  // Ensure canvas matches container size
  const parent = canvasEl.value.parentElement
  if (parent) {
    canvasEl.value.width = parent.clientWidth
    canvasEl.value.height = parent.clientHeight
  }
  const values = displayedVotes.value.length ? displayedVotes.value : (poll.value?.votes || [])
  chartInstance = renderChart(canvasEl.value, poll.value.options, values, 'bar')
}

let unsubscribePoll = null

onMounted(async () => {
  poll.value = await getPoll(id.value)
  if (poll.value) {
    // If presentation mode, animate in from zero
    if (present.value) {
      const zeros = Array.from({ length: poll.value.votes.length }, () => 0)
      displayedVotes.value = [...zeros]
      draw()
      animateVotes(zeros, poll.value.votes, 1000)
    } else {
      displayedVotes.value = [...poll.value.votes]
      draw()
    }
  } else {
    displayedVotes.value = []
    draw()
  }
  
  // Set up real-time listener for poll updates
  unsubscribePoll = subscribeToPoll(id.value, (updatedPoll) => {
    if (updatedPoll) {
      const prev = poll.value
      poll.value = updatedPoll
      const oldVals = displayedVotes.value.length ? [...displayedVotes.value] : (prev?.votes || [])
      const newVals = updatedPoll.votes || []
      if (JSON.stringify(oldVals) !== JSON.stringify(newVals)) {
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
    displayedVotes.value = [...poll.value.votes]
  } else {
    displayedVotes.value = []
  }
  
  // Set up listener for new poll
  unsubscribePoll = subscribeToPoll(id.value, (updatedPoll) => {
    if (updatedPoll) {
      const prev = poll.value
      poll.value = updatedPoll
      const oldVals = displayedVotes.value.length ? [...displayedVotes.value] : (prev?.votes || [])
      const newVals = updatedPoll.votes || []
      if (JSON.stringify(oldVals) !== JSON.stringify(newVals)) {
        animateVotes(oldVals, newVals, 800)
      }
    }
  })
  
  draw()
})

watch(present, async (isOn) => {
  if (isOn) {
    setBackgroundMusic('/assets/sounds/reveal.mp3', 0.8)
    playBackgroundMusic(0.15)
    // Re-animate bars when entering presentation
    const latest = await getPoll(id.value)
    if (latest) {
      const from = displayedVotes.value.length ? [...displayedVotes.value] : Array.from({ length: latest.votes.length }, () => 0)
      animateVotes(from, latest.votes, 1000)
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

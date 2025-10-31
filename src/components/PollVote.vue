<template>
  <div class="max-w-2xl mx-auto card relative px-4 sm:px-6">
    <h2 class="text-lg sm:text-xl mb-4 pr-12 sm:pr-16 break-words">{{ poll?.question || 'Poll' }}</h2>
    <!-- QR tooltip trigger (hover/tap to show) -->
    <div v-if="poll" class="absolute top-3 right-3 group">
      <button class="px-3 py-1 rounded-md bg-secondary text-white text-xs sm:text-sm min-h-[32px]" @click="showQR = !showQR">QR</button>
      <div class="invisible opacity-0 group-hover:visible group-hover:opacity-100 sm:transition-opacity sm:duration-200 absolute right-0 mt-2 z-30 bg-white text-neutral rounded-lg border border-gray-200 shadow p-3" :class="{ '!visible !opacity-100': showQR }">
        <div class="flex items-center justify-center">
          <Qrcode :value="shareUrl" :size="120" level="H" class="sm:w-32 sm:h-32" />
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-neutral text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
      <div>Loading poll...</div>
    </div>
    <div v-else-if="loadError || !poll" class="text-neutral text-center py-8">
      <div class="mb-4">Poll not found.</div>
      <button class="btn" @click="loadPoll">Retry</button>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div v-if="alreadyVoted" class="text-accent">You've already voted on this device.</div>

      <div v-if="poll.type==='star'">
        <StarRating :max="poll.options.length" :disabled="alreadyVoted" @select="onIndex" />
      </div>

      <div v-else-if="poll.type==='emoji'" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <EmojiReaction :options="poll.options" :disabled="alreadyVoted" @select="onIndex" />
      </div>

      <div v-else-if="poll.type==='text'" class="flex flex-col gap-3">
        <textarea 
          v-model="textResponse" 
          placeholder="Type your answer here..." 
          class="w-full p-3 border border-gray-300 rounded-md resize-y min-h-[100px]"
          :disabled="alreadyVoted"
        ></textarea>
        <button 
          class="btn w-full" 
          :disabled="alreadyVoted || !textResponse.trim()" 
          @click="onTextSubmit"
        >
          Submit
        </button>
      </div>

      <div v-else class="flex flex-col gap-2">
        <button v-for="(opt, i) in poll.options" :key="i" class="option-button" :disabled="alreadyVoted" @click="onIndex(i)">
          {{ opt }}
        </button>
      </div>

      <div class="flex flex-wrap gap-2 sm:gap-3 mt-2 justify-center items-center">
        <router-link v-if="poll.type !== 'text' || alreadyVoted" class="btn text-sm sm:text-base flex-1 sm:flex-none min-w-[100px] justify-center" :to="`/results/${id}`">View Results</router-link>
        <button v-if="hasPrevious || hasNext" class="btn text-sm sm:text-base flex-1 sm:flex-none min-w-[100px] justify-center" @click="go(-1)">Previous</button>
        <button v-if="hasPrevious || hasNext" class="btn text-sm sm:text-base flex-1 sm:flex-none min-w-[100px] justify-center" @click="go(1)">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPoll, votePoll, votePollText, hasVoted, getAdjacentPollIdSameSet } from '../utils/storage.js'
import { playVoteSound } from '../utils/sound.js'
import confetti from 'canvas-confetti'
import StarRating from './StarRating.vue'
import EmojiReaction from './EmojiReaction.vue'
import QrcodeVue from 'qrcode.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id)
const poll = ref(null)
const alreadyVoted = ref(false)
const textResponse = ref('')
const showQR = ref(false)
const hasNext = ref(false)
const hasPrevious = ref(false)
const loading = ref(true)
const loadError = ref(false)

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
const shareUrl = computed(() => {
  const data = encodePoll(poll.value)
  const pid = id.value
  const setId = poll.value?.setId
  const path = setId ? `/sets/${setId}/polls/${pid}` : `/poll/${pid}`
  return data ? `${BASE}?poll=${pid}&data=${data}#${path}` : `${BASE}?poll=${pid}#${path}`
})

async function copyLink() {
  await navigator.clipboard.writeText(shareUrl.value)
}

async function checkHasNext() {
  if (!poll.value) {
    hasNext.value = false
    hasPrevious.value = false
    return false
  }
  const nextId = await getAdjacentPollIdSameSet(id.value, 1)
  hasNext.value = !!nextId
  // Check for previous poll to determine if set has more than one poll
  const prevId = await getAdjacentPollIdSameSet(id.value, -1)
  hasPrevious.value = !!prevId
}

async function loadPoll() {
  loading.value = true
  loadError.value = false
  try {
    const loadedPoll = await getPoll(id.value)
    if (loadedPoll) {
      poll.value = loadedPoll
      alreadyVoted.value = await hasVoted(id.value)
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

onMounted(loadPoll)

watch(() => route.params.id, loadPoll)

async function onIndex(index) {
  if (alreadyVoted.value) return
  const result = await votePoll(id.value, index)
  if (result) {
    alreadyVoted.value = await hasVoted(id.value)
    playVoteSound()
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
    const setId = poll.value?.setId
    // If this is the last poll in the set, show all results
    if (setId && !hasNext.value) {
      router.push(`/sets/${setId}/results`)
    } else if (setId) {
      router.push(`/sets/${setId}/results/${id.value}`)
    } else {
      router.push(`/results/${id.value}`)
    }
  }
}

async function onTextSubmit() {
  if (alreadyVoted.value || !textResponse.value.trim()) return
  const result = await votePollText(id.value, textResponse.value)
  if (result) {
    alreadyVoted.value = await hasVoted(id.value)
  playVoteSound()
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
  const setId = poll.value?.setId
    // If this is the last poll in the set, show all results
    if (setId && !hasNext.value) {
      router.push(`/sets/${setId}/results`)
    } else if (setId) {
      router.push(`/sets/${setId}/results/${id.value}`)
    } else {
      router.push(`/results/${id.value}`)
    }
  }
}

async function go(step) {
  const currentId = id.value
  const targetId = await getAdjacentPollIdSameSet(currentId, step)
  if (!targetId) return
  const setId = poll.value?.setId
  if (setId) router.push(`/sets/${setId}/polls/${targetId}`)
  else router.push(`/poll/${targetId}`)
}
</script>



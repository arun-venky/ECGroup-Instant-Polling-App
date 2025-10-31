<template>
  <div class="max-w-2xl mx-auto card relative">
    <h2 class="text-xl mb-4 pr-16">{{ poll?.question || 'Poll' }}</h2>
    <!-- QR tooltip trigger (hover to show, copy link allowed) -->
    <div v-if="poll" class="absolute top-3 right-3 group">
      <button class="px-3 py-1 rounded-md bg-secondary text-white text-xs sm:text-sm">QR</button>
      <div class="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-200 absolute right-0 mt-2 z-30 bg-white text-neutral rounded-lg border border-gray-200 shadow p-3 w-64">
        <div class="text-xs mb-2">Scan or copy link</div>
        <div class="flex items-center justify-center mb-2">
          <qrcode-vue :value="shareUrl" :size="128" level="H" />
        </div>
        <div class="text-[10px] break-all mb-2 select-text">{{ shareUrl }}</div>
        <button class="w-full" @click="copyLink">Copy link</button>
      </div>
    </div>

    <div v-if="!poll" class="text-neutral">Poll not found.</div>

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
          class="btn" 
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

      <div class="flex flex-wrap gap-3 mt-2 justify-center text-center">
        <router-link v-if="poll.type !== 'text' || alreadyVoted" class="btn w-full sm:w-auto" :to="`/results/${id}`">View Results</router-link>
        <button class="w-full sm:w-auto" @click="go(-1)">Previous</button>
        <button class="w-full sm:w-auto" @click="go(1)">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPoll, votePoll, votePollText, hasVoted, markVoted, getAdjacentPollIdSameSet } from '../utils/storage.js'
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

onMounted(async () => {
  poll.value = await getPoll(id.value)
  alreadyVoted.value = hasVoted(id.value)
})

watch(() => route.params.id, async () => {
  poll.value = await getPoll(route.params.id)
  alreadyVoted.value = hasVoted(route.params.id)
})

async function onIndex(index) {
  if (alreadyVoted.value) return
  await votePoll(id.value, index)
  markVoted(id.value)
  alreadyVoted.value = true
  playVoteSound()
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
  const setId = poll.value?.setId
  if (setId) router.push(`/sets/${setId}/results/${id.value}`)
  else router.push(`/results/${id.value}`)
}

async function onTextSubmit() {
  if (alreadyVoted.value || !textResponse.value.trim()) return
  await votePollText(id.value, textResponse.value)
  markVoted(id.value)
  alreadyVoted.value = true
  playVoteSound()
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
  const setId = poll.value?.setId
  if (setId) router.push(`/sets/${setId}/results/${id.value}`)
  else router.push(`/results/${id.value}`)
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



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

      <div v-else class="flex flex-col gap-2">
        <button v-for="(opt, i) in poll.options" :key="i" class="option-button" :disabled="alreadyVoted" @click="onIndex(i)">
          {{ opt }}
        </button>
      </div>

      <div class="flex gap-3 mt-2">
        <router-link class="w-full sm:w-auto" :to="`/results/${id}`">View Results</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPoll, votePoll, hasVoted, markVoted } from '../utils/storage.js'
import { playVoteSound } from '../utils/sound.js'
import confetti from 'canvas-confetti'
import StarRating from './StarRating.vue'
import EmojiReaction from './EmojiReaction.vue'
import QrcodeVue from 'qrcode.vue'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const poll = ref(null)
const alreadyVoted = ref(false)

function encodePoll(p) {
  if (!p) return ''
  try {
    const json = JSON.stringify(p)
    return window.btoa(unescape(encodeURIComponent(json)))
  } catch { return '' }
}

const BASE = 'https://7jw0dzp3-5173.inc1.devtunnels.ms/index.html'
const shareUrl = computed(() => {
  const data = encodePoll(poll.value)
  return data ? `${BASE}?poll=${id}&data=${data}#${`/poll/${id}`}` : `${BASE}?poll=${id}#${`/poll/${id}`}`
})

async function copyLink() {
  await navigator.clipboard.writeText(shareUrl.value)
}

onMounted(() => {
  poll.value = getPoll(id)
  alreadyVoted.value = hasVoted(id)
})

watch(() => route.params.id, () => {
  poll.value = getPoll(route.params.id)
  alreadyVoted.value = hasVoted(route.params.id)
})

function onIndex(index) {
  if (alreadyVoted.value) return
  votePoll(id, index)
  markVoted(id)
  alreadyVoted.value = true
  playVoteSound()
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
  router.push(`/results/${id}`)
}
</script>



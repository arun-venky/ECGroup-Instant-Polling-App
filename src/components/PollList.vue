<template>
  <div class="max-w-6xl mx-auto card">
    <h2 class="text-2xl mb-4">All Polls</h2>
    <div v-if="!polls.length" class="text-neutral">No polls created yet.</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="p in polls" :key="p.id" class="card">
        <div class="flex items-start gap-3">
          <div class="shrink-0">
            <qrcode-vue :value="buildUrl(p)" :size="120" level="H" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-lg break-words">{{ p.question }}</div>
            <div class="text-xs text-neutral mt-1">{{ formatDate(p.createdAt) }}</div>
            <div class="flex flex-wrap gap-2 mt-3">
              <router-link class="btn" :to="`/poll/${p.id}`">Open</router-link>
              <router-link class="btn" :to="`/results/${p.id}`">Results</router-link>
              <button class="btn" @click="copy(buildUrl(p))">Copy Link</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getPoll, listPollIdsSorted } from '../utils/storage.js'
import QrcodeVue from 'qrcode.vue'

const BASE = 'https://ecgroupinstantpolling.netlify.app/index.html'

const polls = ref([])

function load() {
  const ids = listPollIdsSorted()
  polls.value = ids.map(id => getPoll(id)).filter(Boolean)
}

onMounted(load)

function encodePoll(p) {
  if (!p) return ''
  try {
    const { id, question, type, options } = p
    const json = JSON.stringify({ id, question, type, options })
    return window.btoa(unescape(encodeURIComponent(json)))
  } catch { return '' }
}

function buildUrl(p) {
  const data = encodePoll(p)
  return data ? `${BASE}?poll=${p.id}&data=${data}#${`/poll/${p.id}`}` : `${BASE}?poll=${p.id}#${`/poll/${p.id}`}`
}

async function copy(text) {
  await navigator.clipboard.writeText(text)
}

function formatDate(ts) {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    return d.toLocaleString()
  } catch { return '' }
}
</script>



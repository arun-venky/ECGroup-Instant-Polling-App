<template>
  <div class="max-w-6xl mx-auto card">
    <div class="flex items-center justify-between gap-3 mb-4 sticky top-0 bg-white z-10 pt-1 pb-3 -mx-6 px-6 border-b border-gray-200">
      <h2 class="text-2xl">All Polls</h2>
      <div class="flex items-center gap-2">
        <select v-model="activeSet" class="px-3 py-2 border border-gray-300 rounded-md">
          <option value="">All Sets</option>
          <option v-for="s in sets" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <button class="btn w-auto" :disabled="!activeSet" @click="startActive">Start</button>
        <button class="btn w-auto" @click="clearAll">Clear All</button>
      </div>
    </div>
    <div v-if="!polls.length" class="text-neutral">No polls created yet.</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="p in polls" :key="p.id" class="card">
        <div class="flex items-start gap-3">
          <div class="shrink-0">
            <qrcode-vue :value="buildUrl(p)" :size="96" level="H" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-lg break-words">{{ p.question }}</div>
            <div class="text-xs text-neutral mt-1">{{ formatDate(p.createdAt) }}</div>
            <div class="flex flex-wrap gap-2 mt-3">
              <router-link class="btn" :to="`/poll/${p.id}`">Open</router-link>
              <router-link class="btn" :to="`/results/${p.id}`">Results</router-link>
              <button class="btn" @click="copy(buildUrl(p))">Copy Link</button>
              <button class="btn" @click="remove(p.id)">Delete</button>
            </div>
          </div>
        </div>
    </div>
  </div>
  
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPoll, listPollIdsSorted, deletePoll, clearAllPolls, listPollSets, listPollIdsBySetSorted } from '../utils/storage.js'
import QrcodeVue from 'qrcode.vue'

const BASE = 'https://ecgroupinstantpolling.netlify.app/index.html'

const polls = ref([])
const sets = ref([])
const activeSet = ref('')
const route = useRoute()
const router = useRouter()

function load() {
  const ids = listPollIdsSorted()
  let all = ids.map(id => getPoll(id)).filter(Boolean)
  sets.value = listPollSets()
  if (activeSet.value) {
    all = all.filter(p => (p.setId || '') === activeSet.value)
  }
  polls.value = all
}

onMounted(load)
watch(activeSet, load)

onMounted(() => {
  const preset = route.query.set
  if (typeof preset === 'string' && preset) {
    activeSet.value = preset
  }
})

function startActive() {
  if (!activeSet.value) return
  const ids = listPollIdsBySetSorted(activeSet.value)
  if (ids.length) router.push(`/poll/${ids[0]}`)
}

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

function remove(id) {
  if (!confirm('Delete this poll?')) return
  deletePoll(id)
  load()
}

function clearAll() {
  if (!confirm('Delete ALL polls? This cannot be undone.')) return
  clearAllPolls()
  load()
}
</script>



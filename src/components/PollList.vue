<template>
  <div class="max-w-6xl mx-auto card">
    <div class="flex items-center justify-between gap-3 mb-4 sticky top-0 bg-white z-10 pt-1 pb-3 -mx-6 px-6 border-b border-gray-200">
      <h2 class="text-2xl">All Polls</h2>
      <div class="flex items-center gap-2">
        <select v-model="activeSet" class="px-3 py-2 border border-gray-300 rounded-md">
          <option value="">All Sets</option>
          <option v-for="s in sets" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <button v-if="activeSet" class="btn w-auto" @click="openCreate()">Add Poll</button>
        <button class="btn w-auto" :disabled="!activeSet" @click="startActive">Start</button>
        <button class="btn w-auto" @click="clearAll">Clear All</button>
      </div>
    </div>
    <div v-if="!polls.length" class="text-neutral">No polls created yet.</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="p in polls" :key="p.id" class="card">
        <div class="flex items-start gap-3">
          <div class="shrink-0">
            <Qrcode :value="buildUrl(p)" :size="96" level="H" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-lg break-words">{{ p.question }}</div>
            <div class="text-xs text-neutral mt-1">{{ formatDate(p.createdAt) }}</div>
            <div class="flex flex-wrap gap-2 mt-3">
              <router-link class="btn" :to="linkToPoll(p)">Open</router-link>
              <router-link class="btn" :to="linkToResults(p)">Results</router-link>
              <button class="btn" @click="copy(buildUrl(p))">Copy Link</button>
              <button class="btn" @click="remove(p.id)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Create Poll Modal -->
    <div v-if="showCreate" class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-gray-200">
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 class="text-xl font-bold">Create Poll</h3>
          <button class="btn p-2 min-w-[2.5rem]" @click="closeCreate">✕</button>
        </div>
        <div class="p-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block mb-1">Question</label>
              <input v-model="form.question" placeholder="What's your question?" />
            </div>
            <div>
              <label class="block mb-1">Poll Type</label>
              <select v-model="form.type">
                <option value="multiple">Multiple Choice</option>
                <option value="star">Star Rating</option>
                <option value="like">Like / Dislike</option>
                <option value="emoji">Emoji Reactions</option>
                <option value="text">Text Response</option>
              </select>
            </div>
            <div v-if="form.type==='star'">
              <label class="block mb-1">Stars</label>
              <input type="number" min="3" max="10" v-model.number="form.stars" />
            </div>
          </div>
          <div v-if="showOptions" class="mt-3">
            <label class="block mb-1">Options</label>
            <div class="flex flex-col gap-2">
              <div v-for="(opt, i) in form.options" :key="i" class="flex gap-2 items-center">
                <input v-model="form.options[i]" placeholder="Option" class="flex-1" />
                <button class="btn flex-shrink-0" @click="removeOption(i)">Remove</button>
              </div>
              <button class="btn" @click="addOption">Add Option</button>
            </div>
          </div>
        </div>
        <div class="p-4 border-t border-gray-200 flex justify-end gap-2 items-center">
          <button class="btn" @click="closeCreate">Cancel</button>
          <button class="btn" @click="createFromModal" :disabled="!canCreate">Create</button>
        </div>
      </div>
    </div>
  </div>
  
  
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPoll, listPollIdsSorted, deletePoll, clearAllPolls, listPollSets, listPollIdsBySetSorted, createPoll } from '../utils/storage.js'
import { useDialog } from '../composables/useDialog.js'
import QrcodeVue from 'qrcode.vue'

const BASE = 'https://ecgroupinstantpolling.netlify.app/index.html'

// Register the component properly for template use
const Qrcode = QrcodeVue

const { confirm, alert, danger } = useDialog()

const polls = ref([])
const sets = ref([])
const activeSet = ref('')
const route = useRoute()
const router = useRouter()

const showCreate = ref(false)
const form = ref({ question: '', type: 'multiple', options: ['Option A', 'Option B'], stars: 5 })

async function load() {
  const ids = await listPollIdsSorted()
  const pollPromises = ids.map(id => getPoll(id))
  let all = (await Promise.all(pollPromises)).filter(Boolean)
  sets.value = await listPollSets()
  if (activeSet.value) {
    all = all.filter(p => (p.setId || '') === activeSet.value)
  }
  polls.value = all
}

onMounted(load)
watch(activeSet, load)

onMounted(() => {
  const fromQuery = route.query.set
  const fromParam = route.params.setId
  const preset = (typeof fromParam === 'string' && fromParam) ? fromParam : (typeof fromQuery === 'string' && fromQuery ? fromQuery : '')
  if (preset) activeSet.value = preset
})

watch(() => route.fullPath, () => {
  const fromQuery = route.query.set
  const fromParam = route.params.setId
  const preset = (typeof fromParam === 'string' && fromParam) ? fromParam : (typeof fromQuery === 'string' && fromQuery ? fromQuery : '')
  if (preset !== activeSet.value) activeSet.value = preset
})

async function startActive() {
  if (!activeSet.value) {
    console.warn('No active set selected')
    return
  }
  try {
    const ids = await listPollIdsBySetSorted(activeSet.value)
    if (ids && ids.length > 0) {
      router.push(`/sets/${activeSet.value}/polls/${ids[0]}`)
    } else {
      await alert('No polls found in this set. Please add polls first.', 'No Polls')
    }
  } catch (error) {
    console.error('Error starting poll set:', error)
    await alert('Failed to start poll set. Please try again.', 'Error')
  }
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

async function remove(id) {
  try {
    const confirmed = await danger('Delete this poll?', 'Delete Poll')
    if (!confirmed) return
    await deletePoll(id)
    await load()
  } catch {
    // User cancelled
  }
}

async function clearAll() {
  try {
    const confirmed = await danger('Delete ALL polls? This cannot be undone.', 'Delete All Polls')
    if (!confirmed) return
    await clearAllPolls()
    await load()
  } catch {
    // User cancelled
  }
}

function linkToPoll(p) {
  const setId = p.setId || activeSet.value
  return setId ? `/sets/${setId}/polls/${p.id}` : `/poll/${p.id}`
}
function linkToResults(p) {
  const setId = p.setId || activeSet.value
  return setId ? `/sets/${setId}/results/${p.id}` : `/results/${p.id}`
}

const showOptions = computed(() => form.value.type === 'multiple' || form.value.type === 'emoji')

function addOption() {
  form.value.options.push('New option')
}
function removeOption(index) {
  form.value.options.splice(index, 1)
}

function openCreate() {
  showCreate.value = true
}
function closeCreate() {
  showCreate.value = false
}

const canCreate = computed(() => !!form.value.question.trim())

async function createFromModal() {
  if (!canCreate.value) return
  let finalOptions = form.value.options
  if (form.value.type === 'like') finalOptions = ['Like', 'Dislike']
  if (form.value.type === 'emoji') finalOptions = ['😀', '😍', '🤔', '😮']
  if (form.value.type === 'star') finalOptions = Array.from({ length: form.value.stars }, (_, i) => `${i + 1} ⭐`)
  if (form.value.type === 'text') finalOptions = [] // Text polls don't need predefined options
  const poll = await createPoll({ question: form.value.question.trim(), type: form.value.type, options: finalOptions, setId: activeSet.value || null })
  showCreate.value = false
  form.value = { question: '', type: 'multiple', options: ['Option A', 'Option B'], stars: 5 }
  await load()
  router.push(activeSet.value ? `/sets/${activeSet.value}/polls/${poll.id}` : `/poll/${poll.id}`)
}
</script>



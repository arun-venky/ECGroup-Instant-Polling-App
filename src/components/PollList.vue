<template>
  <div class="max-w-6xl mx-auto card flex flex-col overflow-hidden px-2 sm:px-6" style="max-height: calc(100vh - 100px); height: calc(100vh - 100px);">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sticky top-0 bg-white z-10 pt-1 pb-3 -mx-2 sm:-mx-6 px-2 sm:px-6 border-b border-gray-200 flex-shrink-0">
      <h2 class="text-xl sm:text-2xl">All Polls</h2>
      <div class="flex flex-col sm:flex-row items-end sm:items-center gap-2 w-full sm:w-auto">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <router-link v-if="activeSet || route.params.setId" class="btn text-sm w-full sm:w-auto sm:min-w-[120px] justify-center" to="/sets">Back to Sets</router-link>
          <select v-model="activeSet" class="px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base w-full sm:w-auto sm:min-w-[120px]">
            <option value="">All Sets</option>
            <option v-for="s in sets" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button v-if="activeSet" class="btn text-sm w-full sm:w-auto sm:min-w-[100px] justify-center" @click="openCreate()">Add Poll</button>
          <button class="btn text-sm w-full sm:w-auto sm:min-w-[100px] justify-center" :disabled="!activeSet || startingPoll" @click="startActive">
            <span v-if="startingPoll" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
            <span>{{ startingPoll ? 'Starting...' : 'Start' }}</span>
          </button>
          <button class="btn text-sm w-full sm:w-auto sm:min-w-[100px] justify-center" @click="clearAll">Clear All</button>
        </div>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
      <div v-if="loading" class="text-neutral text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
        <div>Loading polls...</div>
      </div>
      <div v-else-if="!polls.length" class="text-neutral p-4">No polls created yet.</div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 p-1">
      <div v-for="p in polls" :key="p.id" class="card p-4 sm:p-6 relative">
        <!-- Copy button in top right corner -->
        <button 
          class="absolute top-3 right-3 p-2 rounded-md !bg-transparent hover:!bg-transparent text-neutral hover:text-primary transition-colors flex items-center justify-center min-h-0 min-w-0"
          @click="copy(buildUrl(p))"
          title="Copy poll link"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <div class="flex flex-col sm:flex-row items-start gap-3 pr-10">
          <div class="shrink-0 mx-auto sm:mx-0">
              <Qrcode :value="buildUrl(p)" :size="120" level="H" class="sm:w-36 sm:h-36" />
          </div>
          <div class="flex-1 min-w-0 w-full">
            <div class="font-bold text-base sm:text-lg break-words">{{ p.question }}</div>
            <div class="text-xs text-neutral mt-1">{{ formatDate(p.createdAt) }}</div>
            <div class="flex flex-wrap items-center gap-2 mt-3">
                <router-link 
                  class="!bg-transparent p-2 text-neutral hover:text-primary transition-colors rounded-md flex-shrink-0 min-h-0 min-w-0" 
                  :to="linkToPoll(p)"
                  title="Open"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </router-link>
                <button 
                  class="!bg-transparent p-2 text-neutral hover:text-primary transition-colors rounded-md flex-shrink-0 min-h-0 min-w-0" 
                  @click="edit(p)"
                  title="Edit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button 
                  class="!bg-transparent p-2 text-neutral hover:text-red-600 transition-colors rounded-md flex-shrink-0 min-h-0 min-w-0" 
                  @click="remove(p.id)"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Create/Edit Poll Modal -->
    <div v-if="showCreate || showEdit" class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-2 sm:p-4 overflow-y-auto">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-gray-200 my-auto max-h-[95vh] flex flex-col">
        <div class="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
          <h3 class="text-lg sm:text-xl font-bold">{{ editingPoll ? 'Edit Poll' : 'Create Poll' }}</h3>
          <button class="btn p-2 min-w-[2.5rem] min-h-[2.5rem]" @click="closeCreate">✕</button>
        </div>
        <div class="p-3 sm:p-4 overflow-y-auto flex-1 min-h-0">
          <PollForm
            v-model="form"
            :show-set-assignment="false"
            ref="pollFormRef"
          />
        </div>
        <div class="p-3 sm:p-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2 items-center flex-shrink-0 bg-white">
          <button class="btn text-sm sm:text-base w-full sm:w-auto justify-center" @click="closeCreate" :disabled="savingPoll">Cancel</button>
          <button class="btn text-sm sm:text-base w-full sm:w-auto justify-center" @click="savePoll" :disabled="!canCreate || savingPoll">
            <span v-if="savingPoll" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
            <span>{{ savingPoll ? (editingPoll ? 'Saving...' : 'Creating...') : (editingPoll ? 'Save' : 'Create') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
  
  
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPoll, listPollIdsSorted, deletePoll, clearAllPolls, listPollSets, listPollIdsBySetSorted, createPoll, updatePoll } from '../utils/storage.js'
import { useDialog } from '../composables/useDialog.js'
import PollForm from './PollForm.vue'
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
const loading = ref(true)
const savingPoll = ref(false)
const startingPoll = ref(false)

const showCreate = ref(false)
const showEdit = ref(false)
const editingPoll = ref(null)
const pollFormRef = ref(null)
const form = ref({ 
  question: '', 
  questionImage: '',
  type: 'multiple', 
  options: ['Option A', 'Option B'], 
  stars: 5, 
  answer: '',
  selectedSetId: ''
})

async function load() {
  loading.value = true
  try {
    const ids = await listPollIdsSorted()
    const pollPromises = ids.map(id => getPoll(id))
    let all = (await Promise.all(pollPromises)).filter(Boolean)
    sets.value = await listPollSets()
    if (activeSet.value) {
      all = all.filter(p => (p.setId || '') === activeSet.value)
    }
    polls.value = all
  } finally {
    loading.value = false
  }
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
  if (!activeSet.value || startingPoll.value) {
    return
  }
  startingPoll.value = true
  try {
    console.log('Starting poll set:', activeSet.value)
    const ids = await listPollIdsBySetSorted(activeSet.value)
    console.log('Poll IDs for set:', ids)
    if (ids && ids.length > 0) {
      const targetPath = `/sets/${activeSet.value}/polls/${ids[0]}`
      console.log('Navigating to:', targetPath)
      await router.push(targetPath)
    } else {
      console.warn('No polls found in set:', activeSet.value)
      await alert('No polls found in this set. Please add polls first.', 'No Polls')
    }
  } catch (error) {
    console.error('Error starting poll set:', error)
    await alert('Failed to start poll set. Please try again.', 'Error')
  } finally {
    startingPoll.value = false
  }
}

function encodePoll(p) {
  if (!p) return ''
  try {
    const { id, question, type, options, setId } = p
    // For image polls, exclude the large base64 image data from QR encoding
    // Only include the count and a placeholder to keep QR code size manageable
    const encodedOptions = type === 'image' && options 
      ? options.map(() => '[image]') 
      : options
    const json = JSON.stringify({ id, question, type, options: encodedOptions, setId })
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

function openCreate() {
  editingPoll.value = null
  showCreate.value = true
  showEdit.value = false
  form.value = { 
    question: '', 
    questionImage: '',
    type: 'multiple', 
    options: ['Option A', 'Option B'], 
    stars: 5, 
    answer: '',
    selectedSetId: ''
  }
}

function edit(poll) {
  editingPoll.value = poll
  showEdit.value = true
  showCreate.value = false
  
  // Determine answer value for the form
  let answerValue = ''
  // Check if answer exists (not null, undefined, or empty string)
  if (poll.answer != null && poll.answer !== '') {
    if (poll.type === 'multiple' || poll.type === 'emoji') {
      // For index-based answers, convert to string for the select
      answerValue = String(poll.answer)
    } else if (poll.type === 'star') {
      // For star polls, convert index (0-4) to star number (1-5) for the select
      // The select uses star numbers (1, 2, 3, 4, 5) but votes use indices (0, 1, 2, 3, 4)
      const index = typeof poll.answer === 'number' ? poll.answer : parseInt(poll.answer)
      if (!isNaN(index) && index >= 0) {
        answerValue = String(index + 1) // Convert to 1-based star number
      }
    } else if (poll.type === 'like') {
      // For like/dislike, use the string value directly
      answerValue = String(poll.answer)
    } else if (poll.type === 'text') {
      // For text, use the stored value (it's stored as lowercase, which is fine to display)
      // Users can see what the expected answer is
      answerValue = String(poll.answer).trim()
    } else if (poll.type === 'image') {
      // For image polls, the answer is stored as a filtered index
      // We need to map it back to the original options array
      const filteredIndex = typeof poll.answer === 'number' ? poll.answer : parseInt(poll.answer)
      if (!isNaN(filteredIndex) && poll.options) {
        // Find the original index in the options array
        let originalIndex = 0
        let count = 0
        for (let i = 0; i < poll.options.length; i++) {
          if (poll.options[i] && poll.options[i].startsWith('data:image')) {
            if (count === filteredIndex) {
              originalIndex = i
              break
            }
            count++
          }
        }
        answerValue = String(originalIndex)
      }
    }
  }
  
  // Populate form with existing poll data
  // Set all values at once to avoid watch triggering and clearing answer
  const formData = {
    question: poll.question || '',
    questionImage: poll.questionImage || '',
    type: poll.type || 'multiple',
    options: poll.type === 'star' 
      ? poll.options || [] 
      : (poll.options && poll.options.length > 0 ? [...poll.options] : ['Option A', 'Option B']),
    stars: poll.type === 'star' ? (poll.options?.length || 5) : 5,
    answer: answerValue,
    selectedSetId: poll.setId || ''
  }
  
  // Handle like, emoji, and image types
  if (poll.type === 'like') {
    formData.options = ['Like', 'Dislike']
  }
  if (poll.type === 'emoji') {
    // Use existing options or empty array (will be populated by PollForm)
    formData.options = poll.options || []
  }
  if (poll.type === 'image') {
    formData.options = poll.options || ['']
  }
  
  // Set form value all at once to ensure answer is preserved
  form.value = formData
}

function closeCreate() {
  showCreate.value = false
  showEdit.value = false
  editingPoll.value = null
  form.value = { 
    question: '', 
    questionImage: '', 
    type: 'multiple', 
    options: ['Option A', 'Option B'], 
    stars: 5, 
    answer: '',
    selectedSetId: ''
  }
}

const canCreate = computed(() => !!form.value.question.trim())

async function savePoll() {
  if (!canCreate.value || savingPoll.value) return
  savingPoll.value = true
  try {
    const pollData = pollFormRef.value?.normalizeFormData() || {
      question: form.value.question.trim(),
      questionImage: form.value.questionImage || null,
      type: form.value.type,
      options: form.value.options,
      setId: form.value.selectedSetId || null,
      answer: form.value.answer
    }
    
    if (editingPoll.value) {
      // Update existing poll
      await updatePoll(editingPoll.value.id, {
        ...pollData,
        setId: editingPoll.value.setId // Preserve existing setId
      })
      closeCreate()
      await load()
    } else {
      // Create new poll
      const poll = await createPoll({ 
        ...pollData,
        setId: activeSet.value || pollData.setId || null
      })
      closeCreate()
      await load()
      router.push(activeSet.value ? `/sets/${activeSet.value}/polls/${poll.id}` : `/poll/${poll.id}`)
    }
  } finally {
    savingPoll.value = false
  }
}
</script>



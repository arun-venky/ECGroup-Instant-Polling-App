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
          class="absolute top-3 right-3 p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-neutral hover:text-primary transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
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
            <div class="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mt-3">
                <router-link class="btn text-xs sm:text-sm whitespace-nowrap justify-center py-2" :to="linkToPoll(p)">Open</router-link>
                <button class="btn text-xs sm:text-sm whitespace-nowrap justify-center py-2" @click="edit(p)">Edit</button>
                <button class="btn text-xs sm:text-sm whitespace-nowrap justify-center py-2" @click="remove(p.id)">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Create/Edit Poll Modal -->
    <div v-if="showCreate || showEdit" class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-2 sm:p-4 overflow-y-auto">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-gray-200 my-auto max-h-[95vh] overflow-y-auto">
        <div class="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 class="text-lg sm:text-xl font-bold">{{ editingPoll ? 'Edit Poll' : 'Create Poll' }}</h3>
          <button class="btn p-2 min-w-[2.5rem] min-h-[2.5rem]" @click="closeCreate">✕</button>
        </div>
        <div class="p-3 sm:p-4">
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
                <option value="image">Image Selection</option>
                <option value="text">Text Response</option>
              </select>
            </div>
            <div v-if="form.type==='star'">
              <label class="block mb-1">Stars</label>
              <input type="number" min="3" max="10" v-model.number="form.stars" />
            </div>
          </div>
          <div v-if="form.type === 'multiple'" class="mt-3">
            <label class="block mb-1">Options</label>
            <div class="flex flex-col gap-2">
              <div v-for="(opt, i) in form.options" :key="i" class="flex gap-2 items-center">
                <input v-model="form.options[i]" placeholder="Option" class="flex-1" />
                <button class="btn flex-shrink-0" @click="removeOption(i)">Remove</button>
              </div>
              <button class="btn" @click="addOption">Add Option</button>
            </div>
          </div>
          <div v-if="form.type === 'image'" class="mt-3">
            <label class="block mb-1">Upload Images</label>
            <div class="flex flex-col gap-3">
              <div v-for="(opt, i) in form.options" :key="i" class="border border-gray-300 rounded-md p-3">
                <div v-if="opt && opt.startsWith('data:image')" class="flex items-center gap-3">
                  <img :src="opt" alt="Option" class="w-20 h-20 object-cover rounded-md border border-gray-200" />
                  <div class="flex-1">
                    <div class="text-sm text-neutral mb-1">Image {{ i + 1 }}</div>
                    <button class="btn text-xs py-1" @click="removeOption(i)">Remove</button>
                  </div>
                </div>
                <div v-else>
                  <input 
                    type="file" 
                    accept="image/*" 
                    class="text-sm"
                    @change="(e) => handleImageUpload(e, i)"
                  />
                  <div class="text-xs text-neutral mt-1">Max file size: 1 MB</div>
                </div>
              </div>
              <button class="btn" @click="addImageOption">Add Image</button>
            </div>
          </div>
          <div v-if="form.type === 'emoji'" class="mt-3">
            <label class="block mb-1">Select Emojis</label>
            <select 
              v-model="form.options" 
              multiple 
              class="w-full border border-gray-300 rounded-md p-2 min-h-[150px]"
              size="6"
            >
              <option v-for="emoji in availableEmojis" :key="emoji" :value="emoji">
                {{ emoji }}
              </option>
            </select>
            <div class="text-xs text-neutral mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple emojis</div>
            <div v-if="form.options.length > 0" class="mt-2">
              <label class="block mb-1 text-sm">Selected Emojis ({{ form.options.length }}):</label>
              <div class="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-md">
                <span 
                  v-for="(opt, i) in form.options" 
                  :key="i" 
                  class="text-2xl relative inline-flex items-center justify-center cursor-pointer hover:bg-red-100 rounded p-1 transition-colors group"
                  @click="removeEmoji(i)"
                  title="Click to remove"
                >
                  {{ opt }}
                  <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</span>
                </span>
              </div>
            </div>
          </div>
          <div class="mt-4">
            <label class="block mb-1">
              Correct Answer 
              <span class="text-sm text-neutral font-normal">(optional, for validation)</span>
            </label>
            <div v-if="form.type === 'multiple' || form.type === 'emoji'">
              <select v-model="form.answer" class="w-full">
                <option value="">No answer specified</option>
                <option v-for="(opt, i) in form.options" :key="i" :value="i">{{ opt }}</option>
              </select>
            </div>
            <div v-else-if="form.type === 'star'">
              <select v-model="form.answer" class="w-full">
                <option value="">No answer specified</option>
                <option v-for="n in form.stars" :key="n" :value="n">{{ '⭐'.repeat(n) }}</option>
              </select>
            </div>
            <div v-else-if="form.type === 'like'">
              <select v-model="form.answer" class="w-full">
                <option value="">No answer specified</option>
                <option value="Like">👍 Like</option>
                <option value="Dislike">👎 Dislike</option>
              </select>
            </div>
            <div v-else-if="form.type === 'image'">
              <select v-model="form.answer" class="w-full">
                <option value="">No answer specified</option>
                <option v-for="(opt, i) in form.options" :key="i" :value="i" v-if="opt && opt.startsWith('data:image')">
                  Image {{ i + 1 }}
                </option>
              </select>
            </div>
            <div v-else-if="form.type === 'text'">
              <input v-model="form.answer" placeholder="Expected answer text (case-insensitive)" class="w-full" />
            </div>
          </div>
        </div>
        <div class="p-3 sm:p-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2 items-center">
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
const form = ref({ question: '', type: 'multiple', options: ['Option A', 'Option B'], stars: 5, answer: '' })

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

const showOptions = computed(() => form.value.type === 'multiple' || form.value.type === 'emoji')

// Available emojis for selection
const availableEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
  '🤧', '🥵', '🥶', '😶‍🌫️', '😵', '😵‍💫', '🤯', '🤠', '🥳', '😎',
  '🤓', '🧐', '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️',
  '🤟', '🤘', '🤙', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇',
  '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲', '🤝',
  '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
  '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
  '🔥', '✨', '⭐', '🌟', '💫', '💥', '💢', '💯', '💨', '💦',
  '💤', '🕳️', '💣', '💬', '🗨️', '🗯️', '💭', '🎉', '🎊', '🎈',
  '🎁', '🎂', '🎀', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀',
  '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🏒',
  '🏑', '🏏', '⛳', '🏹', '🎣', '🥊', '🥋', '🎽', '🏋️‍♂️', '🤼‍♂️',
  '🤸‍♂️', '🤸‍♀️', '⛹️‍♂️', '🤺', '🤾‍♂️', '🏌️‍♂️', '🏇', '🧘‍♂️', '🏄‍♂️', '🏊‍♂️',
  '🚣‍♂️', '🧗‍♂️', '🚵‍♂️', '🚴‍♂️', '🏆', '🎖️', '🏅', '🎗️', '🎫', '🎟️',
  '🎪', '🤹‍♂️', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹',
  '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳',
  '🎮', '🎰', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑',
  '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍️', '🛺',
  '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋',
  '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉',
  '✈️', '🛫', '🛬', '🛩️', '💺', '🚁', '🚟', '🚀', '🛸', '🚤',
  '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛵', '🛶', '🚤', '🛟', '🛝',
  '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️',
  '🏔️', '🗻', '🏕️', '⛺', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭',
  '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩',
  '💒', '🏛️', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '⛺',
  '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️', '🎠',
  '🎡', '🎢', '💈', '🎪', '🚂', '🌌', '🎆', '🎇', '✨', '🌟',
  '💫', '⭐', '🌠', '☄️', '💥', '🔥', '🌈', '☀️', '⛅', '☁️',
  '🌤️', '⛈️', '🌩️', '⛈️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨',
  '💧', '💦', '☔', '☂️', '🌊', '🌫️', '🌪️', '🌀', '🌙', '⭐',
  '🌟', '💫', '✨', '🔥', '💥', '⚡', '☄️', '💫', '🌠', '⭐'
]

watch(() => form.value.type, (newType, oldType) => {
  // Only clear answer and update options when type changes during creation (not editing)
  // When editing, we'll set the answer after setting the type
  if (!editingPoll.value && oldType !== undefined) {
    form.value.answer = ''
    
    // Update options based on poll type
    if (newType === 'emoji') {
      // Initialize with empty array for dropdown selection
      form.value.options = []
    } else if (newType === 'image') {
      // Initialize with empty string for image upload
      form.value.options = ['']
    } else if (newType === 'like') {
      form.value.options = ['Like', 'Dislike']
    } else if (newType === 'star') {
      form.value.options = Array.from({ length: form.value.stars }, (_, i) => `${i + 1} ⭐`)
    } else if (newType === 'multiple') {
      // Only reset to default if switching from a type that had different options
      if (oldType === 'emoji' || oldType === 'like' || oldType === 'star') {
        form.value.options = ['Option A', 'Option B']
      }
    }
  }
})

function addOption() {
  form.value.options.push('New option')
}
function removeOption(index) {
  form.value.options.splice(index, 1)
}
function removeEmoji(index) {
  if (form.value.type === 'emoji') {
    form.value.options.splice(index, 1)
  }
}
function addImageOption() {
  form.value.options.push('')
}
function handleImageUpload(event, index) {
  const file = event.target.files[0]
  if (!file) return
  
  // Check file size (1 MB = 1048576 bytes)
  if (file.size > 1048576) {
    alert('File size exceeds 1 MB limit. Please choose a smaller image.')
    event.target.value = ''
    return
  }
  
  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file.')
    event.target.value = ''
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    form.value.options[index] = e.target.result // Store as base64 data URL
  }
  reader.onerror = () => {
    alert('Error reading image file. Please try again.')
    event.target.value = ''
  }
  reader.readAsDataURL(file)
}

function openCreate() {
  editingPoll.value = null
  showCreate.value = true
  showEdit.value = false
  form.value = { question: '', type: 'multiple', options: ['Option A', 'Option B'], stars: 5, answer: '' }
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
    }
  }
  
  // Populate form with existing poll data
  // Set all values at once to avoid watch triggering and clearing answer
  const formData = {
    question: poll.question || '',
    type: poll.type || 'multiple',
    options: poll.type === 'star' 
      ? poll.options || [] 
      : (poll.options && poll.options.length > 0 ? [...poll.options] : ['Option A', 'Option B']),
    stars: poll.type === 'star' ? (poll.options?.length || 5) : 5,
    answer: answerValue
  }
  
  // Handle like, emoji, and image types
  if (poll.type === 'like') {
    formData.options = ['Like', 'Dislike']
  }
  if (poll.type === 'emoji') {
    formData.options = poll.options || ['😀', '😍', '🤔', '😮', '😂', '😊', '👍', '❤️', '🔥', '✨', '👏', '🎉']
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
  form.value = { question: '', type: 'multiple', options: ['Option A', 'Option B'], stars: 5, answer: '' }
}

const canCreate = computed(() => !!form.value.question.trim())

async function savePoll() {
  if (!canCreate.value || savingPoll.value) return
  savingPoll.value = true
  try {
    let finalOptions = form.value.options
    if (form.value.type === 'like') finalOptions = ['Like', 'Dislike']
    if (form.value.type === 'emoji') {
      // Use the selected options from the dropdown, or default if empty
      finalOptions = form.value.options && form.value.options.length > 0 
        ? form.value.options 
        : ['😀', '😍', '🤔', '😮', '😂', '😊', '👍', '❤️', '🔥', '✨', '👏', '🎉']
    }
    if (form.value.type === 'star') finalOptions = Array.from({ length: form.value.stars }, (_, i) => `${i + 1} ⭐`)
    if (form.value.type === 'text') finalOptions = [] // Text polls don't need predefined options
    
    // Normalize answer based on type
    let normalizedAnswer = null
    const answer = form.value.answer
    
    // Check if answer has a meaningful value
    if (answer !== '' && answer !== null && answer !== undefined) {
      if (form.value.type === 'multiple' || form.value.type === 'emoji' || form.value.type === 'image') {
        // For index-based answers, ensure we have a valid number
        const num = typeof answer === 'number' ? answer : parseInt(answer)
        if (!isNaN(num) && num >= 0) {
          normalizedAnswer = num
        }
      } else if (form.value.type === 'star') {
        // For star polls, convert star number (1-5) to index (0-4)
        // The select uses star numbers (1, 2, 3, 4, 5) but votes use indices (0, 1, 2, 3, 4)
        const starNum = typeof answer === 'number' ? answer : parseInt(answer)
        if (!isNaN(starNum) && starNum >= 1) {
          normalizedAnswer = starNum - 1 // Convert to 0-based index
        }
      } else if (form.value.type === 'like') {
        // For like/dislike, store as string
        const trimmed = String(answer).trim()
        if (trimmed) {
          normalizedAnswer = trimmed
        }
      } else if (form.value.type === 'text') {
        // For text, store as lowercase trimmed string
        const trimmed = String(answer).trim()
        if (trimmed) {
          normalizedAnswer = trimmed.toLowerCase()
        }
      }
    }
    
    if (editingPoll.value) {
      // Update existing poll
      await updatePoll(editingPoll.value.id, {
        question: form.value.question.trim(),
        type: form.value.type,
        options: finalOptions,
        setId: editingPoll.value.setId, // Preserve existing setId
        answer: normalizedAnswer
      })
      closeCreate()
      await load()
    } else {
      // Create new poll
      const poll = await createPoll({ 
        question: form.value.question.trim(), 
        type: form.value.type, 
        options: finalOptions, 
        setId: activeSet.value || null,
        answer: normalizedAnswer
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



<template>
  <div class="max-w-2xl mx-auto card px-4 sm:px-6">
    <h1 class="text-xl sm:text-2xl mb-4">Create a Poll</h1>
    <div class="flex flex-col gap-4">
      <div>
        <label class="block mb-1">Question</label>
        <input v-model="question" placeholder="What's your question?" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block mb-1">Poll Type</label>
          <select v-model="type">
            <option value="multiple">Multiple Choice</option>
            <option value="star">Star Rating</option>
            <option value="like">Like / Dislike</option>
            <option value="emoji">Emoji Reactions</option>
            <option value="text">Text Response</option>
          </select>
        </div>
        <div v-if="type==='star'">
          <label class="block mb-1">Stars</label>
          <input type="number" min="3" max="10" v-model.number="stars" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block mb-1">Assign to Set</label>
          <select v-model="selectedSetId" :disabled="loadingSets">
            <option value="">No Set</option>
            <option v-for="s in sets" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
          <div v-if="loadingSets" class="text-xs text-neutral mt-1">Loading sets...</div>
        </div>
        <div>
          <label class="block mb-1">Create New Set</label>
          <div class="flex gap-2 items-center">
            <input v-model="newSetName" placeholder="e.g., Friday Quiz" class="flex-1" :disabled="creatingSet" />
            <button class="btn flex-shrink-0" @click="createSet" :disabled="creatingSet || !newSetName.trim()">
              <span v-if="creatingSet" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              <span>{{ creatingSet ? 'Adding...' : 'Add' }}</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="showOptions" class="mt-2">
        <label class="block mb-1">Options</label>
        <div class="flex flex-col gap-2">
          <div v-for="(opt, i) in options" :key="i" class="flex gap-2 items-center">
            <input v-model="options[i]" placeholder="Option" class="flex-1" />
            <button class="btn flex-shrink-0" @click="removeOption(i)">Remove</button>
          </div>
          <button class="btn mt-1" @click="addOption">Add Option</button>
        </div>
      </div>

      <div class="mt-4">
        <label class="block mb-1">
          Correct Answer 
          <span class="text-sm text-neutral font-normal">(optional, for validation)</span>
        </label>
        <div v-if="type === 'multiple' || type === 'emoji'">
          <select v-model="answer" class="w-full">
            <option value="">No answer specified</option>
            <option v-for="(opt, i) in options" :key="i" :value="i">{{ opt }}</option>
          </select>
        </div>
        <div v-else-if="type === 'star'">
          <select v-model="answer" class="w-full">
            <option value="">No answer specified</option>
            <option v-for="n in stars" :key="n" :value="n">{{ '⭐'.repeat(n) }}</option>
          </select>
        </div>
        <div v-else-if="type === 'like'">
          <select v-model="answer" class="w-full">
            <option value="">No answer specified</option>
            <option value="Like">Like</option>
            <option value="Dislike">Dislike</option>
          </select>
        </div>
        <div v-else-if="type === 'text'">
          <input v-model="answer" placeholder="Expected answer text (case-insensitive)" class="w-full" />
        </div>
      </div>

      <button class="mt-4 w-full text-base sm:text-lg py-3" @click="create" :disabled="creatingPoll || !question.trim()">
        <span v-if="creatingPoll" class="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
        <span>{{ creatingPoll ? 'Creating...' : 'Create Poll' }}</span>
      </button>
      <div class="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 mt-2">
        <router-link class="btn text-sm sm:text-base justify-center" to="/polls">Manage Polls</router-link>
        <router-link class="btn text-sm sm:text-base justify-center" to="/sets">Poll Sets</router-link>
      </div>
    </div>
  </div>

  <div v-if="shareId" class="max-w-2xl mx-auto mt-6">
    <PollShare :id="shareId" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { createPoll, createPollSet, listPollSets } from '../utils/storage.js'
import PollShare from './PollShare.vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const question = ref('')
const type = ref('multiple')
const options = ref(['Option A', 'Option B'])
const stars = ref(5)
const answer = ref('')
const shareId = ref('')
const sets = ref([])
const selectedSetId = ref('')
const newSetName = ref('')
const loadingSets = ref(true)
const creatingPoll = ref(false)
const creatingSet = ref(false)

async function loadSets() {
  loadingSets.value = true
  try {
    sets.value = await listPollSets()
  } finally {
    loadingSets.value = false
  }
}
onMounted(loadSets)
onMounted(() => {
  const fromParam = route.params.setId
  if (typeof fromParam === 'string' && fromParam) {
    selectedSetId.value = fromParam
  }
})

const showOptions = computed(() => type.value === 'multiple' || type.value === 'emoji')

watch(type, () => {
  if (type.value === 'like') {
    options.value = ['Like', 'Dislike']
    answer.value = ''
  }
  if (type.value === 'emoji') {
    options.value = ['😀', '😍', '🤔', '😮']
    answer.value = ''
  }
  if (type.value === 'text') {
    answer.value = ''
  }
  if (type.value === 'star') {
    answer.value = ''
  }
})

function addOption() {
  options.value.push('New option')
}
function removeOption(index) {
  options.value.splice(index, 1)
}

async function create() {
  if (!question.value.trim() || creatingPoll.value) return
  creatingPoll.value = true
  try {
    let finalOptions = options.value
    if (type.value === 'star') {
      finalOptions = Array.from({ length: stars.value }, (_, i) => `${i + 1} ⭐`)
    }
    if (type.value === 'text') {
      finalOptions = [] // Text polls don't need predefined options
    }
    
    // Normalize answer based on type
    let normalizedAnswer = null
    const ans = answer.value
    
    // Check if answer has a meaningful value
    if (ans !== '' && ans !== null && ans !== undefined) {
      if (type.value === 'multiple' || type.value === 'emoji') {
        // For index-based answers, ensure we have a valid number
        const num = typeof ans === 'number' ? ans : parseInt(ans)
        if (!isNaN(num) && num >= 0) {
          normalizedAnswer = num
        }
      } else if (type.value === 'star') {
        // For star polls, convert star number (1-5) to index (0-4)
        // The select uses star numbers (1, 2, 3, 4, 5) but votes use indices (0, 1, 2, 3, 4)
        const starNum = typeof ans === 'number' ? ans : parseInt(ans)
        if (!isNaN(starNum) && starNum >= 1) {
          normalizedAnswer = starNum - 1 // Convert to 0-based index
        }
      } else if (type.value === 'like') {
        // For like/dislike, store as string
        const trimmed = String(ans).trim()
        if (trimmed) {
          normalizedAnswer = trimmed
        }
      } else if (type.value === 'text') {
        // For text, store as lowercase trimmed string
        const trimmed = String(ans).trim()
        if (trimmed) {
          normalizedAnswer = trimmed.toLowerCase()
        }
      }
    }
    
    const poll = await createPoll({ 
      question: question.value.trim(), 
      type: type.value, 
      options: finalOptions, 
      setId: selectedSetId.value || null,
      answer: normalizedAnswer
    })
    shareId.value = poll.id
    router.push(`/poll/${poll.id}`)
  } finally {
    creatingPoll.value = false
  }
}

async function createSet() {
  const name = newSetName.value.trim()
  if (!name || creatingSet.value) return
  creatingSet.value = true
  try {
    const set = await createPollSet(name)
    await loadSets()
    selectedSetId.value = set.id
    newSetName.value = ''
  } finally {
    creatingSet.value = false
  }
}
</script>



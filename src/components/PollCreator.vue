<template>
  <div class="max-w-2xl mx-auto card px-4 sm:px-6">
    <h1 class="text-xl sm:text-2xl mb-4">Create a Poll</h1>
    <PollForm
      v-model="form"
      :show-set-assignment="true"
      :sets="sets"
      :loading-sets="loadingSets"
      @create-set="handleCreateSet"
      ref="pollFormRef"
    />
    <button class="mt-4 w-full text-base sm:text-lg py-3" @click="create" :disabled="creatingPoll || !form.question.trim()">
      <span v-if="creatingPoll" class="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
      <span>{{ creatingPoll ? 'Creating...' : 'Create Poll' }}</span>
    </button>
    <div class="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 mt-2">
      <router-link class="btn text-sm sm:text-base justify-center" to="/polls">Manage Polls</router-link>
      <router-link class="btn text-sm sm:text-base justify-center" to="/sets">Poll Sets</router-link>
    </div>
  </div>

  <div v-if="shareId" class="max-w-2xl mx-auto mt-6">
    <PollShare :id="shareId" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { createPoll, createPollSet, listPollSets } from '../utils/storage.js'
import PollShare from './PollShare.vue'
import PollForm from './PollForm.vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const shareId = ref('')
const sets = ref([])
const loadingSets = ref(true)
const creatingPoll = ref(false)
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

async function loadSets() {
  loadingSets.value = true
  try {
    sets.value = await listPollSets()
  } finally {
    loadingSets.value = false
  }
}

onMounted(() => {
  loadSets()
  const fromParam = route.params.setId
  if (typeof fromParam === 'string' && fromParam) {
    form.value.selectedSetId = fromParam
  }
})

async function handleCreateSet(name, callback) {
  try {
    const set = await createPollSet(name)
    await loadSets()
    if (callback) {
      callback(set)
    }
  } catch (error) {
    console.error('Error creating set:', error)
    throw error
  }
}

async function create() {
  if (!form.value.question.trim() || creatingPoll.value) return
  creatingPoll.value = true
  try {
    const pollData = pollFormRef.value?.normalizeFormData() || {
      question: form.value.question.trim(),
      questionImage: form.value.questionImage || null,
      type: form.value.type,
      options: form.value.options,
      setId: form.value.selectedSetId || null,
      answer: form.value.answer
    }
    
    const poll = await createPoll(pollData)
    shareId.value = poll.id
    router.push(`/poll/${poll.id}`)
  } finally {
    creatingPoll.value = false
  }
}
</script>

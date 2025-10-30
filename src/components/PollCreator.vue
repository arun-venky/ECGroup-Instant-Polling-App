<template>
  <div class="max-w-2xl mx-auto card">
    <h1 class="text-2xl mb-4">Create a Poll</h1>
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
          </select>
        </div>
        <div v-if="type==='star'">
          <label class="block mb-1">Stars</label>
          <input type="number" min="3" max="10" v-model.number="stars" />
        </div>
      </div>

      <div v-if="showOptions" class="mt-2">
        <label class="block mb-1">Options</label>
        <div class="flex flex-col gap-2">
          <div v-for="(opt, i) in options" :key="i" class="flex gap-2">
            <input v-model="options[i]" placeholder="Option" />
            <button @click="removeOption(i)">Remove</button>
          </div>
          <button class="mt-1" @click="addOption">Add Option</button>
        </div>
      </div>

      <button class="mt-4" @click="create">Create Poll</button>
      <div class="text-center text-sm opacity-80">or</div>
      <button class="mt-0" @click="importAIQuiz">Import AI Quiz (20 questions)</button>
      <div class="text-center mt-2">
        <router-link class="btn inline-block" to="/polls">Manage Polls</router-link>
      </div>
    </div>
  </div>

  <div v-if="shareId" class="max-w-2xl mx-auto mt-6">
    <PollShare :id="shareId" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { createPoll, createPollSet } from '../utils/storage.js'
import PollShare from './PollShare.vue'
import { useRouter } from 'vue-router'
import { aiQuiz } from '../utils/ai_quiz.js'

const router = useRouter()
const question = ref('')
const type = ref('multiple')
const options = ref(['Option A', 'Option B'])
const stars = ref(5)
const shareId = ref('')

const showOptions = computed(() => type.value === 'multiple' || type.value === 'emoji')

watch(type, () => {
  if (type.value === 'like') {
    options.value = ['Like', 'Dislike']
  }
  if (type.value === 'emoji') {
    options.value = ['😀', '😍', '🤔', '😮']
  }
})

function addOption() {
  options.value.push('New option')
}
function removeOption(index) {
  options.value.splice(index, 1)
}

function create() {
  if (!question.value.trim()) return
  let finalOptions = options.value
  if (type.value === 'star') {
    finalOptions = Array.from({ length: stars.value }, (_, i) => `${i + 1} ⭐`)
  }
  const poll = createPoll({ question: question.value.trim(), type: type.value, options: finalOptions })
  shareId.value = poll.id
  router.push(`/poll/${poll.id}`)
}

function importAIQuiz() {
  // Bulk create one poll per question
  const ids = []
  const set = createPollSet('AI Quiz')
  aiQuiz.forEach(({ q, options }) => {
    const p = createPoll({ question: q, type: 'multiple', options, setId: set.id })
    ids.push(p.id)
  })
  alert(`Imported ${ids.length} questions. Opening the first poll…`)
  router.push(`/poll/${ids[0]}`)
}
</script>



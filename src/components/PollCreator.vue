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

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block mb-1">Assign to Set</label>
          <select v-model="selectedSetId">
            <option value="">No Set</option>
            <option v-for="s in sets" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div>
          <label class="block mb-1">Create New Set</label>
          <div class="flex gap-2">
            <input v-model="newSetName" placeholder="e.g., Friday Quiz" />
            <button class="w-auto" @click="createSet">Add</button>
          </div>
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
      <div class="flex justify-center gap-3 mt-2">
        <router-link class="btn inline-block" to="/polls">Manage Polls</router-link>
        <router-link class="btn inline-block" to="/sets">Poll Sets</router-link>
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
const shareId = ref('')
const sets = ref([])
const selectedSetId = ref('')
const newSetName = ref('')

async function loadSets() {
  sets.value = await listPollSets()
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

async function create() {
  if (!question.value.trim()) return
  let finalOptions = options.value
  if (type.value === 'star') {
    finalOptions = Array.from({ length: stars.value }, (_, i) => `${i + 1} ⭐`)
  }
  const poll = await createPoll({ question: question.value.trim(), type: type.value, options: finalOptions, setId: selectedSetId.value || null })
  shareId.value = poll.id
  router.push(`/poll/${poll.id}`)
}

async function createSet() {
  const name = newSetName.value.trim()
  if (!name) return
  const set = await createPollSet(name)
  await loadSets()
  selectedSetId.value = set.id
  newSetName.value = ''
}
</script>



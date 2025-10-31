<template>
  <div class="max-w-md mx-auto card px-4 sm:px-6">
    <h2 class="text-xl sm:text-2xl mb-4">Create Poll Set</h2>
    <div class="flex flex-col gap-3">
      <div>
        <label class="block mb-1">Set Name</label>
        <input v-model="name" placeholder="e.g., Friday Quiz" />
      </div>
      <button class="w-full text-base sm:text-lg py-3" @click="create" :disabled="!name.trim() || creating">
        <span v-if="creating" class="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
        <span>{{ creating ? 'Creating...' : 'Create Set' }}</span>
      </button>
      <div class="text-center mt-2">
        <router-link class="btn text-sm sm:text-base justify-center" to="/sets">Back to Sets</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { createPollSet } from '../utils/storage.js'
import { useRouter } from 'vue-router'

const name = ref('')
const router = useRouter()
const creating = ref(false)

async function create() {
  const n = name.value.trim()
  if (!n || creating.value) return
  creating.value = true
  try {
    const set = await createPollSet(n)
    router.push(`/sets/${set.id}/polls/create`)
  } finally {
    creating.value = false
  }
}
</script>



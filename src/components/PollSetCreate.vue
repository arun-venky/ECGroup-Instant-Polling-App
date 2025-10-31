<template>
  <div class="max-w-md mx-auto card">
    <h2 class="text-2xl mb-4">Create Poll Set</h2>
    <div class="flex flex-col gap-3">
      <div>
        <label class="block mb-1">Set Name</label>
        <input v-model="name" placeholder="e.g., Friday Quiz" />
      </div>
      <button class="w-full" @click="create" :disabled="!name.trim()">Create Set</button>
      <div class="text-center mt-2">
        <router-link class="btn" to="/sets">Back to Sets</router-link>
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

async function create() {
  const n = name.value.trim()
  if (!n) return
  const set = await createPollSet(n)
  router.push(`/sets/${set.id}/polls/create`)
}
</script>



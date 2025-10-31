<template>
  <div class="max-w-4xl mx-auto card">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl">Poll Sets</h2>
      <router-link class="btn w-auto" to="/sets/create">New Set</router-link>
    </div>
    <div v-if="!sets.length" class="text-neutral">No sets yet. Create polls and assign them to a set.</div>
    <div v-else class="flex flex-col gap-3">
      <div v-for="s in sets" :key="s.id" class="card">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-bold text-lg">{{ s.name }}</div>
            <div class="text-xs text-neutral">{{ formatDate(s.createdAt) }}</div>
          </div>
          <div class="flex items-center gap-2">
            <router-link class="btn w-auto" :to="`/sets/${s.id}/start`">Start</router-link>
            <router-link class="btn w-auto" :to="`/sets/${s.id}/polls`">View Polls</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listPollSets } from '../utils/storage.js'

const sets = ref([])

async function load() {
  sets.value = await listPollSets()
}
onMounted(load)

// Starts are handled by the /sets/:setId/start route

function formatDate(ts) {
  if (!ts) return ''
  try { return new Date(ts).toLocaleString() } catch { return '' }
}

function filterSet(setId) {
  // Navigate to /polls and rely on its dropdown filter (user can select the set there)
}
</script>



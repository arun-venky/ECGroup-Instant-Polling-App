<template>
  <div class="max-w-4xl mx-auto card">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl">Poll Sets</h2>
      <router-link class="btn w-auto" to="/create">Create</router-link>
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
            <button class="btn w-auto" @click="startSet(s.id)">Start</button>
            <router-link class="btn w-auto" :to="`/polls`" @click.native="filterSet(s.id)">View Polls</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listPollSets, listPollIdsBySetSorted } from '../utils/storage.js'
import { useRouter } from 'vue-router'

const sets = ref([])
const router = useRouter()

function load() {
  sets.value = listPollSets()
}
onMounted(load)

function startSet(setId) {
  const ids = listPollIdsBySetSorted(setId)
  if (ids.length) router.push(`/poll/${ids[0]}`)
}

function formatDate(ts) {
  if (!ts) return ''
  try { return new Date(ts).toLocaleString() } catch { return '' }
}

function filterSet(setId) {
  // Navigate to /polls and rely on its dropdown filter (user can select the set there)
}
</script>



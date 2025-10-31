<template>
  <div class="max-w-4xl mx-auto card flex flex-col overflow-hidden px-4 sm:px-6" style="max-height: calc(100vh - 100px); height: calc(100vh - 100px);">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sticky top-0 bg-white z-10 pt-1 pb-3 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-gray-200 flex-shrink-0">
      <h2 class="text-xl sm:text-2xl">Poll Sets</h2>
      <router-link class="btn w-full sm:w-auto" to="/sets/create">New Set</router-link>
    </div>
    <div class="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
      <div v-if="loading" class="text-neutral text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
        <div>Loading sets...</div>
      </div>
      <div v-else-if="!sets.length" class="text-neutral text-sm sm:text-base p-4">No sets yet. Create polls and assign them to a set.</div>
      <div v-else class="flex flex-col gap-3 p-1">
        <div v-for="s in sets" :key="s.id" class="card p-4 sm:p-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="font-bold text-base sm:text-lg break-words">{{ s.name }}</div>
              <div class="text-xs text-neutral mt-1">{{ formatDate(s.createdAt) }}</div>
            </div>
            <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <router-link class="btn text-sm flex-1 sm:flex-none min-w-[80px] justify-center" :to="`/sets/${s.id}/start`">Start</router-link>
              <router-link class="btn text-sm flex-1 sm:flex-none min-w-[80px] justify-center" :to="`/sets/${s.id}/polls`">View Polls</router-link>
              <button class="btn bg-red-500 hover:bg-red-600 text-white text-sm flex-1 sm:flex-none min-w-[80px] justify-center" @click="() => deleteSet(s.id, s.name)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listPollSets, deletePollSet, deletePollSetAndPolls } from '../utils/storage.js'
import { useDialog } from '../composables/useDialog.js'

const sets = ref([])
const loading = ref(true)
const { confirm, alert, danger, success } = useDialog()

async function load() {
  loading.value = true
  try {
    sets.value = await listPollSets()
  } finally {
    loading.value = false
  }
}
onMounted(load)

// Starts are handled by the /sets/:setId/start route

function formatDate(ts) {
  if (!ts) return ''
  try { return new Date(ts).toLocaleString() } catch { return '' }
}

async function deleteSet(setId, setName) {
  try {
    const confirmed = await confirm(`Delete poll set "${setName}"?`, 'Delete Poll Set')
    if (!confirmed) {
      return
    }
    
    const deletePolls = await confirm(
      `Do you want to delete all polls in "${setName}" as well?\n\nClick OK to delete set and all polls, or Cancel to keep the polls (just remove the set).`,
      'Delete Polls Too?'
    )
    
    if (deletePolls) {
      await deletePollSetAndPolls(setId)
      await success(`Poll set "${setName}" and all its polls have been deleted.`)
    } else {
      await deletePollSet(setId)
      await success(`Poll set "${setName}" has been deleted. The polls are still available.`)
    }
    await load() // Reload sets list
  } catch (error) {
    console.error('Error deleting set:', error)
    await alert('Failed to delete poll set. Please try again.', 'Error')
  }
}
</script>



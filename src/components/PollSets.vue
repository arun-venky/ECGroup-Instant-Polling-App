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
              <div v-if="editingId !== s.id" class="flex items-center gap-2">
                <div class="font-bold text-base sm:text-lg break-words">{{ s.name }}</div>
                <button 
                  class="p-1 text-neutral hover:text-primary transition-colors flex-shrink-0" 
                  @click="() => startEdit(s.id, s.name)"
                  title="Edit name"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              <div v-else class="flex items-center gap-2">
                <input 
                  v-model="editingName" 
                  @keyup.enter="saveEdit(s.id)"
                  @keyup.esc="cancelEdit"
                  class="flex-1 font-bold text-base sm:text-lg border border-gray-300 rounded px-2 py-1"
                  placeholder="Set name"
                />
                <button 
                  class="p-1 text-green-600 hover:text-green-700 transition-colors flex-shrink-0" 
                  @click="saveEdit(s.id)"
                  title="Save"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button 
                  class="p-1 text-red-600 hover:text-red-700 transition-colors flex-shrink-0" 
                  @click="cancelEdit"
                  title="Cancel"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div class="text-xs text-neutral mt-1">{{ formatDate(s.createdAt) }}</div>
            </div>
            <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <router-link class="btn text-sm flex-1 sm:flex-none min-w-[80px] justify-center" :to="`/sets/${s.id}/start`">Start</router-link>
              <router-link class="btn text-sm flex-1 sm:flex-none min-w-[80px] justify-center" :to="`/sets/${s.id}/polls`">View</router-link>
              <button class="btn bg-red-500 hover:bg-red-600 text-white text-sm flex-1 sm:flex-none min-w-[80px] justify-center" @click="() => deleteSet(s.id, s.name)" :disabled="editingId === s.id">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { listPollSets, deletePollSet, deletePollSetAndPolls, updatePollSet } from '../utils/storage.js'
import { useDialog } from '../composables/useDialog.js'

const sets = ref([])
const loading = ref(true)
const editingId = ref(null)
const editingName = ref('')
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

function startEdit(setId, currentName) {
  editingId.value = setId
  editingName.value = currentName
  nextTick(() => {
    // Find the input element in the DOM
    const input = document.querySelector(`input[placeholder="Set name"]`)
    if (input) {
      input.focus()
      input.select()
    }
  })
}

function cancelEdit() {
  editingId.value = null
  editingName.value = ''
}

async function saveEdit(setId) {
  const newName = editingName.value.trim()
  if (!newName) {
    await alert('Set name cannot be empty.', 'Invalid Name')
    return
  }
  
  try {
    await updatePollSet(setId, newName)
    await load() // Reload sets list
    cancelEdit()
  } catch (error) {
    console.error('Error updating poll set:', error)
    await alert('Failed to update poll set name. Please try again.', 'Error')
  }
}

async function deleteSet(setId, setName) {
  if (editingId.value === setId) {
    return // Prevent deletion while editing
  }
  
  try {
    const confirmed = await confirm(`Delete poll set "${setName}"?`, 'Delete Poll Set')
    if (!confirmed) {
      return
    }
  } catch (error) {
    // User cancelled the first confirmation dialog - silently return
    return
  }
  
  try {
    const deletePolls = await confirm(
      `Do you want to delete all polls in "${setName}" as well?\n\nClick OK to delete set and all polls, or Cancel to keep the polls (just remove the set).`,
      'Delete Polls Too?'
    )
    
    try {
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
  } catch (error) {
    // User cancelled the second confirmation dialog - silently return
    return
  }
}
</script>



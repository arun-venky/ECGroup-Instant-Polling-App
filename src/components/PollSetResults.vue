<template>
  <div class="max-w-6xl mx-auto card flex flex-col overflow-hidden px-4 sm:px-6" style="max-height: calc(100vh - 100px); height: calc(100vh - 100px);">
    <!-- Sticky Header -->
    <div class="sticky top-0 bg-white z-10 pt-1 pb-3 mb-4 border-b border-gray-200 flex-shrink-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
      <h1 class="text-2xl sm:text-3xl font-bold text-primary mb-2">{{ setName || 'Poll Set Results' }}</h1>
      <p class="text-neutral">Complete results for all polls in this set</p>
    </div>
    
    <!-- Scrollable Content Area -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
      <div v-if="loading" class="text-center py-12 text-neutral">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
        <div class="text-lg">Loading results...</div>
      </div>
      
      <div v-else-if="!polls.length" class="text-center py-12 text-neutral text-lg">
        No polls found in this set.
      </div>
      
      <div v-else class="flex flex-col gap-6 pb-4">
        <div v-for="(poll, index) in polls" :key="poll.id" class="card px-4 sm:px-6 flex flex-col">
          <div class="mb-4">
            <h2 class="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-1 break-words">
              {{ index + 1 }}. {{ poll.question }}
            </h2>
          </div>
        
          <!-- Text responses display -->
          <div v-if="poll.type === 'text'" class="flex flex-col gap-6">
            <div v-if="!poll.textResponses || poll.textResponses.length === 0" class="text-neutral text-center py-8 text-lg">
              No responses yet
            </div>
            <div v-else class="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 p-3 sm:p-6 min-h-[30vh] sm:min-h-[40vh]">
              <div
                v-for="(item, i) in getTextResponseItems(poll)"
                :key="i"
                class="inline-block transition-all duration-500 px-3 py-2 rounded-md"
                :class="{ 
                  'bg-green-100 border-2 border-green-500': item.isCorrect,
                  'bg-white border border-gray-200': !item.isCorrect
                }"
                :style="{
                  fontSize: item.fontSize + 'px',
                  color: item.isCorrect ? '#15803d' : colors[i % colors.length],
                  fontWeight: 'bold'
                }"
              >
                {{ item.text }} <span class="opacity-75">({{ item.percentage }}%)</span>
                <span v-if="item.isCorrect" class="text-green-600 text-xs font-semibold ml-2">✓</span>
              </div>
            </div>
          </div>
          
          <!-- List display for all non-text poll types -->
          <div v-else>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm sm:text-base">
              <div v-for="(item, i) in getDisplayItems(poll)" :key="i" class="flex items-center gap-2 p-2 rounded-md transition-colors" :class="{ 'bg-green-100 border-2 border-green-500': item.isCorrect, 'bg-white border border-gray-200': !item.isCorrect }">
                <span v-if="item.labelType !== 'like'" class="inline-block w-3 h-3 rounded-sm flex-shrink-0" :style="{ backgroundColor: colors[i % colors.length] }"></span>
                <span v-else class="inline-block flex-shrink-0">
                  <svg v-if="item.originalOption === 'Like'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2 20h2c.55 0 1-.45 1-1v-7c0-.55-.45-1-1-1H2v9zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.5 8.5C7.07 8.93 6.83 9.53 6.83 10.17V15c0 1.1.9 2 2 2h7.33c.52 0 .99-.2 1.34-.56l3.33-3.33c.33-.33.5-.78.5-1.22s-.17-.89-.5-1.22z" />
                  </svg>
                  <svg v-else-if="item.originalOption === 'Dislike'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15 3H6c-.83 0-1.54.5-1.85 1.22l-3.02 7.05c-.09.23-.13.47-.13.73v1.91l.01.01L1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
                  </svg>
                </span>
                <span class="flex-1 break-words font-medium" :class="{ 'text-green-700 font-bold': item.isCorrect }">{{ item.label }}</span>
                <span v-if="item.isCorrect" class="text-green-600 text-xs font-semibold mr-2">✓</span>
                <span class="text-accent font-bold whitespace-nowrap">{{ item.percentage }}%</span>
                <span class="text-neutral text-xs whitespace-nowrap">({{ item.votes }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sticky Footer -->
    <div v-if="!loading && polls.length" class="flex justify-center gap-3 pt-3 pb-2 sticky bottom-0 bg-white border-t border-gray-200 flex-shrink-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
      <router-link class="btn text-sm sm:text-base justify-center" to="/sets">Back to Sets</router-link>
      <router-link class="btn text-sm sm:text-base justify-center" :to="`/sets/${setId}/polls`">View Polls</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { listPollIdsBySetSorted, getPoll, listPollSets } from '../utils/storage.js'

const route = useRoute()
const setId = computed(() => route.params.setId)
const polls = ref([])
const setName = ref('')
const loading = ref(true)

const colors = ['#00C4CC', '#2F80ED', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444']


function consolidateTextResponses(textResponses) {
  if (!textResponses || !textResponses.length) return []
  
  const groups = new Map()
  textResponses.forEach(response => {
    const normalized = response.trim().toLowerCase()
    const original = response.trim()
    
    if (!groups.has(normalized)) {
      groups.set(normalized, { text: original, count: 0 })
    }
    groups.get(normalized).count++
  })
  
  return Array.from(groups.values())
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.text.localeCompare(b.text)
    })
}

function getTextResponseItems(poll) {
  if (poll.type !== 'text' || !poll.textResponses) return []
  
  const consolidated = consolidateTextResponses(poll.textResponses)
  const total = consolidated.reduce((sum, item) => sum + item.count, 0) || 1
  
  const maxFont = 48
  const minFont = 14
  
  return consolidated.map((item, i) => {
    const percentage = Math.round((item.count * 100) / total)
    const fontSize = Math.max(minFont, Math.min(maxFont, minFont + (percentage / 100) * (maxFont - minFont)))
    return {
      text: item.text,
      percentage,
      fontSize,
      isCorrect: isCorrectAnswer(poll, i)
    }
  })
}

function isCorrectAnswer(poll, index) {
  if (!poll || poll.answer === null || poll.answer === undefined) return false
  const answer = poll.answer
  const pollType = poll.type
  
  if (pollType === 'multiple' || pollType === 'emoji' || pollType === 'star') {
    return parseInt(answer) === index
  } else if (pollType === 'like') {
    return answer === poll.options[index]
  } else if (pollType === 'text') {
    // For text polls, we need to check against the consolidated text responses
    // The answer is stored as lowercase, so we compare case-insensitively
    if (!poll.textResponses || poll.textResponses.length === 0) return false
    const consolidated = consolidateTextResponses(poll.textResponses)
    if (index >= consolidated.length) return false
    const responseText = consolidated[index].text.toLowerCase().trim()
    const correctAnswer = String(answer).toLowerCase().trim()
    return responseText === correctAnswer
  }
  return false
}

function getDisplayItems(poll) {
  if (!poll.options || !poll.votes) return []
  
  const total = poll.votes.reduce((sum, v) => sum + (v || 0), 0) || 1
  return poll.options.map((option, i) => {
    // For star polls, format label to show actual number of stars
    // For like polls, keep label as is (will be displayed with icons)
    let formattedLabel = option
    let labelType = 'text' // 'text', 'star', 'like'
    
    if (poll.type === 'star') {
      // Extract number from label (e.g., "1 ⭐" -> 1, "5 ⭐" -> 5)
      const match = option.match(/^(\d+)/)
      if (match) {
        const starCount = parseInt(match[1])
        formattedLabel = '⭐'.repeat(starCount)
        labelType = 'star'
      }
    } else if (poll.type === 'like') {
      labelType = 'like'
    }
    
    return {
      label: formattedLabel,
      labelType,
      originalOption: option,
      percentage: Math.round(((poll.votes[i] || 0) * 100) / total),
      votes: poll.votes[i] || 0,
      isCorrect: isCorrectAnswer(poll, i)
    }
  })
}

async function loadResults() {
  loading.value = true
  try {
    // Load set name
    const sets = await listPollSets()
    const set = sets.find(s => s.id === setId.value)
    setName.value = set?.name || ''
    
    // Load all poll IDs for the set
    const pollIds = await listPollIdsBySetSorted(setId.value)
    
    // Load all polls with their results
    const pollsData = []
    for (const pollId of pollIds) {
      const poll = await getPoll(pollId)
      if (poll) {
        pollsData.push(poll)
      }
    }
    
    polls.value = pollsData
  } catch (error) {
    console.error('Error loading results:', error)
  } finally {
    loading.value = false
  }
}

onMounted(loadResults)
</script>


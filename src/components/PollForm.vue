<template>
  <div class="flex flex-col gap-4">
    <!-- Sticky Header Section -->
    <div class="sticky top-0 z-10 bg-white pb-4 space-y-4">
      <!-- Question Section -->
      <div>
        <label class="block mb-1">Question</label>
        <textarea 
          v-model="localForm.question" 
          placeholder="What's your question?" 
          class="w-full p-3 border border-gray-300 rounded-md resize-y min-h-[80px]"
        ></textarea>
      </div>

      <!-- Poll Type Section -->
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
      <div class="flex-1 sm:flex-none sm:w-auto min-w-0">
        <label class="block mb-1">Poll Type</label>
        <select v-model="localForm.type" class="w-full sm:w-auto">
          <option value="multiple">Multiple Choice</option>
          <option value="star">Star Rating</option>
          <option value="like">Like / Dislike</option>
          <option value="emoji">Emoji Reactions</option>
          <option value="image">Image Selection</option>
          <option value="text">Text Response</option>
        </select>
      </div>
      <div v-if="localForm.type==='star'" class="flex-1 sm:flex-none sm:w-auto min-w-0">
        <label class="block mb-1">Stars</label>
        <input type="number" min="3" max="10" v-model.number="localForm.stars" class="w-full sm:w-auto" />
      </div>
      <div class="flex items-center gap-2 flex-shrink-0 ml-auto">
        <div v-if="localForm.questionImage" class="relative">
          <img 
            :src="localForm.questionImage" 
            alt="Question image" 
            class="w-16 h-16 object-cover rounded-md border border-gray-200" 
          />
          <button 
            class="absolute -top-1 -right-1 p-0.5 text-red-600 hover:text-red-700 !bg-transparent hover:!bg-transparent min-h-0 min-w-0 rounded-full transition-colors bg-white" 
            @click="localForm.questionImage = ''" 
            title="Remove image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          @click="showImageModal = true"
          class="p-1.5 text-neutral hover:text-primary !bg-transparent hover:!bg-transparent min-h-0 min-w-0 border border-gray-300 rounded-md hover:border-primary transition-colors bg-white shadow-sm"
          title="Add question image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
    </div>

    <!-- Image Upload Modal -->
    <div v-if="showImageModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="showImageModal = false">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-200">
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 class="text-lg font-bold">Upload Question Image</h3>
          <button 
            class="p-2 text-neutral hover:text-primary !bg-transparent hover:!bg-transparent min-h-0 min-w-0" 
            @click="showImageModal = false"
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-4">
          <input 
            type="file" 
            accept="image/*" 
            class="w-full text-sm mb-2"
            @change="handleQuestionImageUpload"
            ref="imageFileInput"
          />
          <div class="text-xs text-neutral">Max file size: 1 MB</div>
        </div>
      </div>
    </div>

    <!-- Set Assignment Section (optional) -->
    <div v-if="showSetAssignment" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block mb-1">Assign to Set</label>
        <select v-model="localForm.selectedSetId" :disabled="loadingSets">
          <option value="">No Set</option>
          <option v-for="s in sets" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <div v-if="loadingSets" class="text-xs text-neutral mt-1">Loading sets...</div>
      </div>
      <div>
        <label class="block mb-1">Create New Set</label>
        <div class="flex gap-2 items-center">
          <input 
            v-model="newSetName" 
            placeholder="e.g., Friday Quiz" 
            class="flex-1" 
            :disabled="creatingSet" 
          />
          <button 
            class="btn flex-shrink-0" 
            @click="handleCreateSet" 
            :disabled="creatingSet || !newSetName.trim()"
          >
            <span v-if="creatingSet" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
            <span>{{ creatingSet ? 'Adding...' : 'Add' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Options Section -->
    <div class="overflow-y-auto flex-1 min-h-0">
      <!-- Multiple Choice Options -->
      <div v-if="localForm.type === 'multiple'" class="relative">
        <div class="flex items-center justify-between mb-1">
          <label class="block">Options</label>
          <button 
            class="text-primary hover:text-accent text-sm underline !bg-transparent hover:!bg-transparent min-h-0 min-w-0 px-2 py-1" 
            @click="addOption"
            title="Add Option"
          >
            + Add Option
          </button>
        </div>
        <div class="flex flex-col gap-2">
          <div v-for="(opt, i) in localForm.options" :key="i" class="flex gap-2 items-center">
            <input 
              v-model="localForm.options[i]" 
              placeholder="Option" 
              class="flex-1" 
            />
            <button 
              class="p-2 text-red-600 hover:text-red-700 !bg-transparent hover:!bg-transparent rounded transition-colors flex-shrink-0 min-h-0 min-w-0" 
              @click="removeOption(i)" 
              title="Remove option"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Image Selection Options -->
      <div v-if="localForm.type === 'image'" class="mt-2">
        <label class="block mb-1">Upload Images</label>
        <div class="border border-gray-300 rounded-md p-2 max-h-64 overflow-y-auto">
          <div class="flex flex-col gap-3">
            <div v-for="(opt, i) in localForm.options" :key="i" class="border border-gray-300 rounded-md p-3 flex-shrink-0">
              <div v-if="opt && opt.startsWith('data:image')" class="flex items-center gap-3">
                <img :src="opt" alt="Option" class="w-20 h-20 object-cover rounded-md border border-gray-200" />
                <div class="flex-1">
                  <div class="text-sm text-neutral mb-1">Image {{ i + 1 }}</div>
                  <button 
                    class="p-2 text-red-600 hover:text-red-700 !bg-transparent hover:!bg-transparent rounded transition-colors min-h-0 min-w-0" 
                    @click="removeOption(i)" 
                    title="Remove image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div v-else>
                <input 
                  type="file" 
                  accept="image/*" 
                  class="text-sm"
                  @change="(e) => handleImageUpload(e, i)"
                />
                <div class="text-xs text-neutral mt-1">Max file size: 1 MB</div>
              </div>
            </div>
          </div>
        </div>
        <button class="btn mt-2" @click="addImageOption">Add Image</button>
      </div>

      <!-- Emoji Selection -->
      <div v-if="localForm.type === 'emoji'" class="mt-2">
        <label class="block mb-1">Select Emojis</label>
        <div class="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto bg-white">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="emoji in availableEmojis"
              :key="emoji"
              type="button"
              @click="toggleEmoji(emoji)"
              :class="[
                'text-2xl p-2 rounded-md transition-all border-2 min-h-0 min-w-0 px-2 py-2',
                localForm.options.includes(emoji)
                  ? '!bg-transparent border-primary scale-110'
                  : '!bg-transparent border-transparent hover:!bg-transparent hover:border-gray-300'
              ]"
              :title="emoji"
            >
              {{ emoji }}
            </button>
          </div>
        </div>
        <div class="text-xs text-neutral mt-1">Click emojis to select/deselect</div>
        <div v-if="localForm.options.length > 0" class="mt-2">
          <label class="block mb-1 text-sm">Selected Emojis ({{ localForm.options.length }}):</label>
          <div class="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-md">
            <span 
              v-for="(opt, i) in localForm.options" 
              :key="i" 
              class="text-2xl relative inline-flex items-center justify-center cursor-pointer !bg-transparent hover:!bg-transparent rounded p-1 transition-colors group"
              @click="removeEmoji(i)"
              title="Click to remove"
            >
              {{ opt }}
              <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Correct Answer Section (Sticky) -->
    <div class="sticky top-0 z-10 bg-white pb-4 pt-4 border-t border-gray-200">
      <label class="block mb-1">
        Correct Answer 
        <span class="text-sm text-neutral font-normal">(optional, for validation)</span>
      </label>
      <div v-if="localForm.type === 'multiple' || localForm.type === 'emoji'">
        <select v-model="localForm.answer" class="w-full">
          <option value="">No answer specified</option>
          <option v-for="(opt, i) in localForm.options" :key="i" :value="i">{{ opt }}</option>
        </select>
      </div>
      <div v-else-if="localForm.type === 'star'">
        <select v-model="localForm.answer" class="w-full">
          <option value="">No answer specified</option>
          <option v-for="n in localForm.stars" :key="n" :value="n">{{ '⭐'.repeat(n) }}</option>
        </select>
      </div>
      <div v-else-if="localForm.type === 'like'">
        <select v-model="localForm.answer" class="w-full">
          <option value="">No answer specified</option>
          <option value="Like">👍 Like</option>
          <option value="Dislike">👎 Dislike</option>
        </select>
      </div>
      <div v-else-if="localForm.type === 'image'">
        <select v-model="localForm.answer" class="w-full">
          <option value="">No answer specified</option>
          <template v-for="(opt, i) in localForm.options" :key="i">
            <option v-if="opt && opt.startsWith('data:image')" :value="i">
              Image {{ i + 1 }}
            </option>
          </template>
        </select>
      </div>
      <div v-else-if="localForm.type === 'text'">
        <input 
          v-model="localForm.answer" 
          placeholder="Expected answer text (case-insensitive)" 
          class="w-full" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { availableEmojis } from '../utils/emojis.js'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      question: '',
      questionImage: '',
      type: 'multiple',
      options: ['Option A', 'Option B'],
      stars: 5,
      answer: '',
      selectedSetId: ''
    })
  },
  showSetAssignment: {
    type: Boolean,
    default: false
  },
  sets: {
    type: Array,
    default: () => []
  },
  loadingSets: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'create-set'])

const localForm = ref({ ...props.modelValue })
const showImageModal = ref(false)
const newSetName = ref('')
const creatingSet = ref(false)

// Watch for prop changes and sync local form
watch(() => props.modelValue, (newVal) => {
  localForm.value = { ...newVal }
}, { deep: true })

// Emit updates when local form changes
watch(localForm, (newVal) => {
  emit('update:modelValue', { ...newVal })
}, { deep: true })

watch(() => localForm.value.type, (newType, oldType) => {
  if (oldType !== undefined) {
    localForm.value.answer = ''
    
    if (newType === 'like') {
      localForm.value.options = ['Like', 'Dislike']
    } else if (newType === 'emoji') {
      localForm.value.options = []
    } else if (newType === 'image') {
      localForm.value.options = ['']
    } else if (newType === 'text') {
      // Keep existing options or set empty
    } else if (newType === 'star') {
      // Options will be generated from stars on save
    } else if (newType === 'multiple') {
      if (oldType === 'emoji' || oldType === 'like' || oldType === 'star') {
        localForm.value.options = ['Option A', 'Option B']
      }
    }
  }
})

function addOption() {
  localForm.value.options.push('New option')
}

function addImageOption() {
  localForm.value.options.push('')
}

function removeOption(index) {
  localForm.value.options.splice(index, 1)
}

function handleQuestionImageUpload(event) {
  showImageModal.value = false
  const file = event.target.files[0]
  if (!file) return
  
  if (file.size > 1048576) {
    alert('File size exceeds 1 MB limit. Please choose a smaller image.')
    event.target.value = ''
    return
  }
  
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file.')
    event.target.value = ''
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    localForm.value.questionImage = e.target.result
  }
  reader.onerror = () => {
    alert('Error reading image file. Please try again.')
    event.target.value = ''
  }
  reader.readAsDataURL(file)
}

function handleImageUpload(event, index) {
  const file = event.target.files[0]
  if (!file) return
  
  if (file.size > 1048576) {
    alert('File size exceeds 1 MB limit. Please choose a smaller image.')
    event.target.value = ''
    return
  }
  
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file.')
    event.target.value = ''
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    localForm.value.options[index] = e.target.result
  }
  reader.onerror = () => {
    alert('Error reading image file. Please try again.')
    event.target.value = ''
  }
  reader.readAsDataURL(file)
}

function toggleEmoji(emoji) {
  if (localForm.value.type === 'emoji') {
    const index = localForm.value.options.indexOf(emoji)
    if (index === -1) {
      localForm.value.options.push(emoji)
    } else {
      localForm.value.options.splice(index, 1)
    }
  }
}

function removeEmoji(index) {
  if (localForm.value.type === 'emoji') {
    localForm.value.options.splice(index, 1)
  }
}

async function handleCreateSet() {
  const name = newSetName.value.trim()
  if (!name || creatingSet.value) return
  creatingSet.value = true
  try {
    emit('create-set', name, (newSet) => {
      localForm.value.selectedSetId = newSet.id
      newSetName.value = ''
    })
  } finally {
    creatingSet.value = false
  }
}

// Expose method to normalize form data for saving
defineExpose({
  normalizeFormData() {
    let finalOptions = localForm.value.options
    if (localForm.value.type === 'star') {
      finalOptions = Array.from({ length: localForm.value.stars }, (_, i) => `${i + 1} ⭐`)
    }
    if (localForm.value.type === 'image') {
      finalOptions = localForm.value.options.filter(opt => opt && opt.startsWith('data:image'))
    }
    if (localForm.value.type === 'text') {
      finalOptions = []
    }
    
    // Normalize answer based on type
    let normalizedAnswer = null
    const ans = localForm.value.answer
    
    if (ans !== '' && ans !== null && ans !== undefined) {
      if (localForm.value.type === 'image') {
        const originalIndex = typeof ans === 'number' ? ans : parseInt(ans)
        if (!isNaN(originalIndex) && originalIndex >= 0 && originalIndex < localForm.value.options.length) {
          let filteredIndex = 0
          for (let i = 0; i < originalIndex; i++) {
            if (localForm.value.options[i] && localForm.value.options[i].startsWith('data:image')) {
              filteredIndex++
            }
          }
          if (localForm.value.options[originalIndex] && localForm.value.options[originalIndex].startsWith('data:image')) {
            normalizedAnswer = filteredIndex
          }
        }
      } else if (localForm.value.type === 'multiple' || localForm.value.type === 'emoji') {
        const num = typeof ans === 'number' ? ans : parseInt(ans)
        if (!isNaN(num) && num >= 0) {
          normalizedAnswer = num
        }
      } else if (localForm.value.type === 'star') {
        const starNum = typeof ans === 'number' ? ans : parseInt(ans)
        if (!isNaN(starNum) && starNum >= 1) {
          normalizedAnswer = starNum - 1
        }
      } else if (localForm.value.type === 'like') {
        const trimmed = String(ans).trim()
        if (trimmed) {
          normalizedAnswer = trimmed
        }
      } else if (localForm.value.type === 'text') {
        const trimmed = String(ans).trim()
        if (trimmed) {
          normalizedAnswer = trimmed.toLowerCase()
        }
      }
    }
    
    return {
      question: localForm.value.question.trim(),
      questionImage: localForm.value.questionImage || null,
      type: localForm.value.type,
      options: finalOptions,
      setId: localForm.value.selectedSetId || null,
      answer: normalizedAnswer
    }
  }
})
</script>


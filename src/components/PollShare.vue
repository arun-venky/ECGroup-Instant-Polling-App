<template>
  <div class="card px-4 sm:px-6">
    <h3 class="text-base sm:text-lg mb-2">Share this Poll</h3>
    <div v-if="loading" class="flex flex-col items-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
      <div class="text-neutral">Loading...</div>
    </div>
    <div v-else class="flex flex-col items-center">
      <Qrcode :value="shareUrl" :size="140" level="H" class="sm:w-40 sm:h-40" />
      <div class="mt-3 flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
        <button class="btn text-sm sm:text-base w-full sm:w-auto min-w-[120px] justify-center" @click="copyLink">Copy link</button>
        <router-link class="btn text-sm sm:text-base w-full sm:w-auto min-w-[120px] justify-center" :to="`/poll/${id}`">Open</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { getPoll } from '../utils/storage.js'
import { useDialog } from '../composables/useDialog.js'

const props = defineProps({ id: { type: String, required: true } })
const poll = ref(null)
const loading = ref(true)
const { success } = useDialog()

// Register the component properly for template use
const Qrcode = QrcodeVue

function encodePoll(p) {
  if (!p) return ''
  try {
    const { id, question, type, options, setId } = p
    const json = JSON.stringify({ id, question, type, options, setId })
    return window.btoa(unescape(encodeURIComponent(json)))
  } catch { return '' }
}

const BASE = 'https://ecgroupinstantpolling.netlify.app/index.html'
const shareUrl = computed(() => {
  const data = encodePoll(poll.value)
  const setId = poll.value?.setId
  const path = setId ? `/sets/${setId}/polls/${props.id}` : `/poll/${props.id}`
  return data ? `${BASE}?poll=${props.id}&data=${data}#${path}` : `${BASE}?poll=${props.id}#${path}`
})

async function copyLink() {
  await navigator.clipboard.writeText(shareUrl.value)
  await success('Link copied!', 'Copied')
}

onMounted(async () => {
  loading.value = true
  try {
    poll.value = await getPoll(props.id)
  } finally {
    loading.value = false
  }
})
</script>



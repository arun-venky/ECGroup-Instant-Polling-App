<template>
  <div class="card">
    <h3 class="text-lg mb-2">Share this Poll</h3>
    <div class="flex flex-col items-center">
      <Qrcode :value="shareUrl" :size="160" level="H" />
      <div class="mt-3 flex gap-2 items-center">
        <button class="btn" @click="copyLink">Copy link</button>
        <router-link class="btn" :to="`/poll/${id}`">Open</router-link>
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
  poll.value = await getPoll(props.id)
})
</script>



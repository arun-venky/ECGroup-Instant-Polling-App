<template>
  <div class="card">
    <h3 class="text-lg mb-2">Share this Poll</h3>
    <div class="flex flex-col sm:flex-row gap-4 items-center">
      <qrcode-vue :value="shareUrl" :size="160" level="H" />
      <div class="flex-1 w-full">
        <div class="text-sm break-all">{{ shareUrl }}</div>
        <div class="mt-3 flex gap-2">
          <button class="sm:w-40" @click="copyLink">Copy link</button>
          <router-link class="sm:w-40" :to="`/poll/${id}`">Open</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { getPoll } from '../utils/storage.js'

const props = defineProps({ id: { type: String, required: true } })

function encodePoll(p) {
  if (!p) return ''
  try {
    const json = JSON.stringify(p)
    return window.btoa(unescape(encodeURIComponent(json)))
  } catch { return '' }
}

const BASE = 'https://ecgroupinstantpolling.netlify.app/index.html'
const shareUrl = computed(() => {
  const poll = getPoll(props.id)
  const data = encodePoll(poll)
  return data ? `${BASE}?poll=${props.id}&data=${data}#${`/poll/${props.id}`}` : `${BASE}?poll=${props.id}#${`/poll/${props.id}`}`
})

async function copyLink() {
  await navigator.clipboard.writeText(shareUrl.value)
  alert('Link copied!')
}
</script>



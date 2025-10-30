<template>
  <div class="absolute inset-0 -z-10 overflow-hidden">
    <svg class="w-full h-full opacity-30" :style="{ animation: `wave ${waveDuration} ease-in-out infinite` }" viewBox="0 0 1440 320" preserveAspectRatio="none">
      <path fill="#2F80ED" fill-opacity="0.8"
        d="M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,106.7C672,85,768,75,864,85.3C960,96,1056,128,1152,160C1248,192,1344,224,1392,240L1440,256L1440,0L0,0Z" />
    </svg>
    <svg class="w-full h-full opacity-20" :style="{ animation: `float ${floatDuration} ease-in-out infinite` }" viewBox="0 0 1440 320" preserveAspectRatio="none">
      <path fill="#00C4CC" fill-opacity="0.6"
        d="M0,64L40,80C80,96,160,128,240,144C320,160,400,160,480,138.7C560,117,640,75,720,69.3C800,64,880,96,960,117.3C1040,139,1120,149,1200,149.3C1280,149,1360,139,1400,133.3L1440,128L1440,0L0,0Z" />
    </svg>
  </div>
  
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ speed: { type: String, default: 'normal' } })

const waveDuration = computed(() => (props.speed === 'fast' ? '3s' : '5s'))
const floatDuration = computed(() => (props.speed === 'fast' ? '4s' : '6s'))
</script>

<style scoped>
svg {
  position: absolute;
  bottom: 0;
  left: 0;
}
</style>



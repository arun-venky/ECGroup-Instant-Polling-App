<template>
  <div />
</template>

<script setup>
import { onMounted } from 'vue'
import confetti from 'canvas-confetti'

onMounted(() => {
  confetti({ particleCount: 150, spread: 80 })
  setTimeout(() => confetti({ particleCount: 100, spread: 60, origin: { y: 0.7 } }), 400)
})
</script>



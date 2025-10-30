<template>
  <div class="min-h-screen relative" :class="isPresent ? 'overflow-hidden' : ''">
    <BackgroundWaves :speed="isPresent ? 'fast' : 'normal'" />
    <div class="container mx-auto px-4 py-6 sm:py-10">
      <router-view />
    </div>
  </div>
  <audio id="bg-music" loop class="hidden"></audio>
</template>

<script setup>
import BackgroundWaves from './components/BackgroundWaves.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isPresent = computed(() => route.name === undefined ? (route.path?.includes('/results') && route.query.present === 'true') : route.query.present === 'true')
</script>



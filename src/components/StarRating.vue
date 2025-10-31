<template>
  <div class="flex justify-center gap-3">
    <button v-for="i in max" :key="i" class="option-button" :class="{ 'bg-primary text-dark': i<=hover }" :disabled="disabled" @mouseenter="hover = i" @mouseleave="hover = 0" @click="$emit('select', i-1)">
      {{ '⭐'.repeat(i) }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({ max: { type: Number, default: 5 }, disabled: { type: Boolean, default: false } })
defineEmits(['select'])

const hover = ref(0)
</script>



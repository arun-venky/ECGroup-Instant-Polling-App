<template>
  <button v-for="(opt,i) in options" :key="i" class="option-button" :disabled="disabled" @click="$emit('select', i)">
    {{ opt }}
  </button>
</template>

<script setup>
defineProps({ options: { type: Array, default: () => [] }, disabled: { type: Boolean, default: false } })
defineEmits(['select'])
</script>



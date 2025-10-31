<template>
  <div class="min-h-screen relative" :class="isPresent ? 'overflow-hidden' : ''">
    <BackgroundWaves :speed="isPresent ? 'fast' : 'normal'" />
    <div class="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-10">
      <router-view />
    </div>
  </div>
  <audio id="bg-music" loop class="hidden"></audio>
  <ConfirmDialog
    :visible="dialogState.visible"
    :title="dialogState.title"
    :message="dialogState.message"
    :confirm-text="dialogState.confirmText"
    :cancel-text="dialogState.cancelText"
    :show-cancel="dialogState.showCancel"
    :type="dialogState.type"
    :icon="dialogState.icon"
    @confirm="handleConfirm"
    @cancel="handleCancel"
    @update:visible="(val) => dialogState.visible = val"
  />
</template>

<script setup>
import BackgroundWaves from './components/BackgroundWaves.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDialog } from './composables/useDialog.js'

const route = useRoute()
const isPresent = computed(() => route.name === undefined ? (route.path?.includes('/results') && route.query.present === 'true') : route.query.present === 'true')

const { dialogState, handleConfirm, handleCancel } = useDialog()
</script>



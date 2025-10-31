<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40" @click="onCancel"></div>
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden relative z-10">
          <div class="p-6">
            <div v-if="icon" class="flex items-center justify-center mb-4">
              <div :class="iconClass" class="w-12 h-12 rounded-full flex items-center justify-center text-2xl">
                {{ icon }}
              </div>
            </div>
            <h3 v-if="title" class="text-xl font-bold text-dark mb-2">{{ title }}</h3>
            <p class="text-neutral mb-6 whitespace-pre-line">{{ message }}</p>
            <div class="flex gap-3 justify-end">
              <button 
                v-if="showCancel"
                class="btn" 
                style="background-color: #e5e7eb; color: #1F2937;"
                @click="onCancel"
              >
                {{ cancelText }}
              </button>
              <button 
                class="btn"
                :class="confirmButtonClass"
                @click="onConfirm"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  message: { type: String, required: true },
  confirmText: { type: String, default: 'OK' },
  cancelText: { type: String, default: 'Cancel' },
  showCancel: { type: Boolean, default: true },
  type: { type: String, default: 'confirm', validator: (v) => ['confirm', 'alert', 'danger', 'success'].includes(v) },
  icon: { type: String, default: '' }
})

const emit = defineEmits(['confirm', 'cancel', 'update:visible'])

const iconClass = computed(() => {
  const classes = {
    confirm: 'bg-blue-100 text-blue-600',
    alert: 'bg-yellow-100 text-yellow-600',
    danger: 'bg-red-100 text-red-600',
    success: 'bg-green-100 text-green-600'
  }
  return classes[props.type] || classes.confirm
})

const confirmButtonClass = computed(() => {
  if (props.type === 'danger') {
    return 'confirm-danger-btn'
  }
  if (props.type === 'success') {
    return 'confirm-success-btn'
  }
  return ''
})

function onConfirm() {
  emit('confirm')
  emit('update:visible', false)
}

function onCancel() {
  if (props.showCancel) {
    emit('cancel')
    emit('update:visible', false)
  }
}
</script>

<style scoped>
.dialog-enter-active, .dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-from, .dialog-leave-to {
  opacity: 0;
}

.dialog-enter-active > div:last-child, .dialog-leave-active > div:last-child {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.dialog-enter-from > div:last-child, .dialog-leave-to > div:last-child {
  transform: scale(0.95);
  opacity: 0;
}

.confirm-danger-btn {
  background-color: #ef4444;
  color: white;
}
.confirm-danger-btn:hover {
  background-color: #dc2626;
}

.confirm-success-btn {
  background-color: #22c55e;
  color: white;
}
.confirm-success-btn:hover {
  background-color: #16a34a;
}
</style>


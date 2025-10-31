import { ref } from 'vue'

// Singleton dialog state
const dialogState = ref({
  visible: false,
  title: '',
  message: '',
  confirmText: 'OK',
  cancelText: 'Cancel',
  showCancel: true,
  type: 'confirm',
  icon: '',
  resolve: null,
  reject: null
})

let dialogInstance = null

export function useDialog() {
  // Return singleton instance
  if (dialogInstance) {
    return dialogInstance
  }

  function showDialog(options = {}) {
    return new Promise((resolve, reject) => {
      dialogState.value = {
        visible: true,
        title: options.title || '',
        message: options.message || '',
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Cancel',
        showCancel: options.showCancel !== false,
        type: options.type || 'confirm',
        icon: options.icon || '',
        resolve,
        reject
      }
    })
  }

  function confirm(message, title = 'Confirm') {
    return showDialog({
      message,
      title,
      type: 'confirm',
      confirmText: 'OK',
      cancelText: 'Cancel',
      showCancel: true,
      icon: '❓'
    })
  }

  function alert(message, title = 'Notice') {
    return showDialog({
      message,
      title,
      type: 'alert',
      confirmText: 'OK',
      showCancel: false,
      icon: 'ℹ️'
    })
  }

  function danger(message, title = 'Warning') {
    return showDialog({
      message,
      title,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      showCancel: true,
      icon: '⚠️'
    })
  }

  function success(message, title = 'Success') {
    return showDialog({
      message,
      title,
      type: 'success',
      confirmText: 'OK',
      showCancel: false,
      icon: '✅'
    })
  }

  function handleConfirm() {
    if (dialogState.value.resolve) {
      dialogState.value.resolve(true)
      dialogState.value.resolve = null
    }
    dialogState.value.visible = false
  }

  function handleCancel() {
    if (dialogState.value.reject) {
      dialogState.value.reject(false)
      dialogState.value.reject = null
    }
    dialogState.value.visible = false
  }

  dialogInstance = {
    dialogState,
    showDialog,
    confirm,
    alert,
    danger,
    success,
    handleConfirm,
    handleCancel
  }

  return dialogInstance
}

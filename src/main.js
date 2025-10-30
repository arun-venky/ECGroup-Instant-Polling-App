import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import './index.css'

// Fallbacks: allow links like index.html?poll=ID and/or index.html?data=ENCODED
try {
  const params = new URLSearchParams(location.search)
  const pollId = params.get('poll')
  const dataParam = params.get('data')

  if (dataParam) {
    try {
      const json = decodeURIComponent(escape(window.atob(dataParam)))
      const poll = JSON.parse(json)
      const KEY = 'polls_v1'
      const existing = JSON.parse(localStorage.getItem(KEY) || '{}')
      if (poll && poll.id && !existing[poll.id]) {
        existing[poll.id] = poll
        localStorage.setItem(KEY, JSON.stringify(existing))
      }
      if (poll && poll.id && (!location.hash || !location.hash.includes(`/poll/`))) {
        location.hash = `#/poll/${poll.id}`
      }
    } catch {}
  }

  if (pollId && (!location.hash || !location.hash.includes(`/poll/`))) {
    location.hash = `#/poll/${pollId}`
  }
} catch {}

createApp(App).use(router).mount('#app')



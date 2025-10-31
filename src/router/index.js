import { createRouter, createWebHashHistory } from 'vue-router'

import PollCreator from '../components/PollCreator.vue'
import PollVote from '../components/PollVote.vue'
import PollResults from '../components/PollResults.vue'
import PollList from '../components/PollList.vue'
import PollSets from '../components/PollSets.vue'
import PollSetCreate from '../components/PollSetCreate.vue'

const routes = [
  { path: '/', redirect: '/sets' }, 
  { path: '/sets', component: PollSets },
  { path: '/sets/create', component: PollSetCreate },
  // List polls inside a set
  { path: '/sets/:setId/polls/create', component: PollCreator },
  { 
    path: '/sets/:setId/start', 
    async beforeEnter(to, from, next) {
      try {
        const mod = await import('../utils/storage.js')
        const setId = to.params.setId
        console.log('BeforeEnter: Starting poll set', setId)
        
        if (!setId) {
          console.warn('No setId provided')
          next({ path: '/sets', replace: true })
          return
        }
        
        const ids = await mod.listPollIdsBySetSorted(setId)
        console.log('BeforeEnter: Poll IDs for set', setId, ':', ids)
        
        if (ids && Array.isArray(ids) && ids.length > 0) {
          const targetPath = `/sets/${setId}/polls/${ids[0]}`
          console.log('BeforeEnter: Redirecting to', targetPath)
          next({ path: targetPath, replace: true })
        } else {
          console.warn('No polls found for set:', setId)
          // Show a message and redirect to sets page
          next({ path: '/sets', replace: true })
        }
      } catch (error) {
        console.error('Error starting poll set:', error)
        console.error('Error details:', error.message, error.stack)
        // Redirect to sets page on error
        next({ path: '/sets', replace: true })
      }
    }
  },
  { path: '/sets/:setId/polls', component: PollList },
  { path: '/sets/:setId/polls/:id', component: PollVote, props: true },
  { path: '/sets/:setId/results/:id', component: PollResults, props: route => ({ id: route.params.id, present: route.query.present === 'true' }) },
  // Backward-compatible legacy routes (hash links and old QRs)
  { path: '/poll/:id', component: PollVote, props: true },
  { path: '/results/:id', component: PollResults, props: route => ({ id: route.params.id, present: route.query.present === 'true' }) },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

export default router



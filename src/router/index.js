import { createRouter, createWebHashHistory } from 'vue-router'

import PollCreator from '../components/PollCreator.vue'
import PollVote from '../components/PollVote.vue'
import PollResults from '../components/PollResults.vue'
import PollList from '../components/PollList.vue'
import PollSets from '../components/PollSets.vue'

const routes = [
  { path: '/', redirect: '/sets' }, 
  { path: '/sets', component: PollSets },
  { path: '/sets/:setId/polls', redirect: to => ({ path: '/polls', query: { set: to.params.setId } }) },
  { path: '/sets/:setId/polls/create', component: PollCreator },
  { path: '/sets/:setId/start', async beforeEnter(to) {
      const mod = await import('../utils/storage.js')
      const ids = mod.listPollIdsBySetSorted(to.params.setId)
      if (ids && ids.length) {
        return { path: `/poll/${ids[0]}` }
      }
      return { path: '/sets' }
    }
  },
  { path: '/sets/:setId/polls', component: PollList },
  { path: '/sets/:setId/polls/:id', component: PollVote, props: true },
  { path: '/sets/:setId/results/:id', component: PollResults, props: route => ({ id: route.params.id, present: route.query.present === 'true' }) },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

export default router



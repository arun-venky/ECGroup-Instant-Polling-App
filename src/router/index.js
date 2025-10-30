import { createRouter, createWebHashHistory } from 'vue-router'

import PollCreator from '../components/PollCreator.vue'
import PollVote from '../components/PollVote.vue'
import PollResults from '../components/PollResults.vue'

const routes = [
  { path: '/', redirect: '/create' },
  { path: '/create', component: PollCreator },
  { path: '/poll/:id', component: PollVote, props: true },
  { path: '/results/:id', component: PollResults, props: route => ({ id: route.params.id, present: route.query.present === 'true' }) },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

export default router



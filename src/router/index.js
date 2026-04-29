import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MeetingView from '../views/MeetingView.vue'
import ResultView from '../views/ResultView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/meeting/:id', component: MeetingView },
    { path: '/meeting/:id/result', component: ResultView },
  ],
})

export default router

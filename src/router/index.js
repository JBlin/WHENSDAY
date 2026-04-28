import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/meeting/:id', component: () => import('../views/MeetingView.vue') },
    { path: '/meeting/:id/result', component: () => import('../views/ResultView.vue') },
    { path: '/host/:id', component: () => import('../views/HostManageView.vue') },
  ],
})

export default router

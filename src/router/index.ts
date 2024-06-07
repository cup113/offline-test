import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue')
    },
    {
      path: '/exam',
      name: 'exam',
      component: () => import('@/views/ExamView.vue'),
    },
    {
      path: '/marking',
      name: 'marking',
      component: () => import('@/views/MarkingView.vue'),
    },
    {
      path: '/stat',
      name: 'stat',
      component: () => import('@/views/StatView.vue'),
    }
  ]
})

export default router

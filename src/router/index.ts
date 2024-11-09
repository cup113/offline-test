import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: HomeView
    },
    {
      path: '/exam',
      name: 'Exam',
      component: () => import('@/views/ExamView.vue'),
    },
    {
      path: '/marking',
      name: 'Marking',
      component: () => import('@/views/MarkingView.vue'),
    },
    {
      path: '/stat',
      name: 'Stat',
      component: () => import('@/views/StatView.vue'),
    }
  ]
})

export default router

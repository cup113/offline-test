import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ExamView from '@/views/ExamView.vue'
import MarkingView from '@/views/MarkingView.vue'
import StatView from '@/views/StatView.vue'

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
      component: ExamView,
    },
    {
      path: '/marking',
      name: 'Marking',
      component: MarkingView,
    },
    {
      path: '/stat',
      name: 'Statistics',
      component: StatView,
    }
  ]
})

export default router

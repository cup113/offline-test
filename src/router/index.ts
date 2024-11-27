import { createRouter, createWebHashHistory } from 'vue-router'
import AboutView from '../views/AboutView.vue'
import ExamView from '@/views/ExamView.vue'
import MarkingView from '@/views/MarkingView.vue'
import StatView from '@/views/StatView.vue'
import PaperView from '@/views/PaperView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
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
    },
    {
      path: '/about',
      name: 'About',
      component: AboutView
    },
    {
      path: '/paper/:name',
      name: 'Paper',
      component: PaperView
    }
  ]
})

export default router

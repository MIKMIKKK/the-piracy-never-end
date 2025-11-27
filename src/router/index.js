import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../components/LandingPage.vue'
import FullGame from '../components/FullGame.vue'
import WheelOnly from '../components/WheelOnly.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingPage
    },
    {
      path: '/game',
      name: 'game',
      component: FullGame
    },
    {
      path: '/wheel',
      name: 'wheel',
      component: WheelOnly
    }
  ]
})

export default router

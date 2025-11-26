import { createRouter, createWebHashHistory } from 'vue-router'
// import OctoGame from '../components/OctoGame.vue'
import HomePage from '../components/HomePage.vue'

const routes = [
  { path: '/', name: 'Home', component: HomePage },
  // { path: '/game', name: 'OctoGame', component: OctoGame }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

export default router

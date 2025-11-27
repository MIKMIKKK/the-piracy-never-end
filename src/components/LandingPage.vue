<template>
  <div id="landing-root">
    <div class="content">
      <h1>Do you have the physical game?</h1>
      <div class="actions">
        <button class="btn-primary" @click="goToWheel">YES</button>
        <button class="btn-secondary" @click="goToFullGame">NO</button>
      </div>
      <p class="subtext">
        "YES" will give you just the wheel.<br>
        "NO" will give you the full digital experience.
      </p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function goToWheel() {
  router.push('/wheel');
}

function goToFullGame() {
  router.push('/game');
}
</script>

<style scoped>
#landing-root {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-image: linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)), url(@/assets/grey_black_grunge.png);
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-blend-mode: normal;
  background-color: #000;
  color: white;
  font-family: var(--font-main);
  text-align: center;
  padding: 2rem;
}

.content {
  background: rgba(0, 0, 0, 0.6);
  padding: 3rem;
  border-radius: 25px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
  max-width: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

h1 {
  font-size: 2.5rem;
  color: var(--primary-color);
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
}

.actions {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

button {
  min-width: 150px;
  font-size: 1.5rem;
  padding: 1rem 2rem;
  cursor: pointer;
  border: none;
  font-family: var(--font-accent);
  text-transform: uppercase;
  letter-spacing: 2px;
  transition: all 0.3s;
}

.btn-primary {
  background: var(--primary-color);
  color: black;
  font-weight: bold;
  clip-path: polygon(10% 0, 100% 0, 100% 80%, 90% 100%, 0 100%, 0 20%);
}

.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px var(--primary-color);
}

.btn-secondary {
  background: transparent;
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
  clip-path: polygon(10% 0, 100% 0, 100% 80%, 90% 100%, 0 100%, 0 20%);
}

.btn-secondary:hover {
  background: rgba(223, 220, 8, 0.1);
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(223, 220, 8, 0.3);
}

.subtext {
  color: #aaa;
  font-size: 1rem;
  line-height: 1.6;
  font-style: italic;
}
</style>

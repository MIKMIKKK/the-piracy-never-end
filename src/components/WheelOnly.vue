<template>
  <div id="home-root">
    <header>
      <div class="header-title">
        <img :src="logo" alt="DESIGNER'S" class="title-img top" />
      </div>
      <div class="header-controls">
        <button id="rules-btn" class="btn-secondary" @click="showRules = true">Captain's Rules</button>
        <button v-if="gamePhase !== 'SETUP'" class="btn-secondary" @click="resetGame">Reset Game</button>
      </div>
    </header>

    <main>
      <!-- SETUP PHASE -->
      <div v-if="gamePhase === 'SETUP'" class="setup-container">
        <h2>Choose Number of Players</h2>
        <div class="player-selection">
          <button v-for="n in [2, 3, 4]" :key="n" class="btn-primary" @click="initGame(n)">
            {{ n }} Players
          </button>
        </div>
        
      </div>
      
      <!-- NAMES PHASE -->
      <div v-else-if="gamePhase === 'NAMES'" class="setup-container">
        <h2>Enter Player Names</h2>
        <div class="name-inputs">
          <div v-for="(player, index) in players" :key="player.id" class="input-group">
            <label>Player {{ index + 1 }}</label>
            <input v-model="player.name" type="text" placeholder="Enter name..." />
          </div>
        </div>
        <button class="btn-primary" @click="startGame">Start Game</button>
      </div>

      <!-- GAME PHASE -->
      <div v-else class="game-layout">
        
        <!-- SCOREBOARD -->
        <aside class="scoreboard">
          <h3>Scoreboard</h3>
          <ul>
            <li v-for="(player, index) in players" :key="player.id" 
                :class="{ active: index === currentPlayerIndex }">
              <span class="player-name">{{ player.name }}</span>
              <div class="score-controls">
                <button class="btn-score minus" @click.stop="adjustScore(player, -1)">-</button>
                <span class="player-score">{{ player.score }} pts</span>
                <button class="btn-score plus" @click.stop="adjustScore(player, 1)">+</button>
              </div>
            </li>
          </ul>
           <button class="btn-secondary small next-turn-btn" @click="nextTurn">Next Turn</button>
        </aside>

        <!-- ROULETTE AREA -->
        <div class="roulette-section">
          <div class="turn-indicator">
            <div class="current-turn-text">
              Current Turn: <span class="highlight">{{ players[currentPlayerIndex].name }}</span>
            </div>
          </div>

          <div class="wheel-container">
            <div class="pointer"></div>
            <div class="wheel" :style="{ 
              transform: `rotate(${wheelRotation}deg)`, 
              backgroundImage: `url(${rouletteWheel})`,
              backgroundPosition: `center`,
              backgroundSize: `125%`
            }">
              <!-- Image replaces manual segments -->
              <!-- Text removed as requested -->
            </div>
            <div class="wheel-center" :style="{ backgroundImage: `url(${rond1})` }"></div>
            <button class="spin-btn" @click="spinWheel" :disabled="isSpinning || gamePhase !== 'PLAYING'"></button>
          </div>
          <div class="spin-instruction">CLICK TO SPIN</div>
        </div>

        <!-- Debug Controls -->




      </div>

    </main>

    <!-- QUESTION CARD MODAL -->

    <!-- Rules Modal -->
    <div id="rules-modal" class="modal" :class="{ hidden: !showRules }" @click.self="showRules = false">
      <div class="modal-content rules-content">
        <span class="close-modal" @click="showRules = false">&times;</span>
        <h2>Captain's Rules</h2>
        <div class="rules-container">
          <h3>ROULETTE</h3>
          <p>Spin the wheel to determine your destiny.</p>
          <ul>
            <li><strong>BEGINNER:</strong> 1 Point. Easy questions.</li>
            <li><strong>MEDIUM:</strong> 2 Points. Standard questions.</li>
            <li><strong>HARD:</strong> 3 Points. Expert questions.</li>
          </ul>
        </div>
      </div>
    </div>
    <!-- Game Over Modal -->
    <div v-if="gamePhase === 'GAME_OVER'" class="modal game-over-modal">
      <div class="modal-content game-over-content">
        <h2>VICTORY!</h2>
        <div class="winner-announcement">
          <span class="winner-name">{{ winner?.name }}</span>
          <p>Has conquered the design world!</p>
        </div>
        <button class="btn-primary" @click="resetGame">Play Again</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import rouletteWheel from '@/assets/test.png';
import rond1 from '@/assets/ROND/rond 1.png';
import logo from '@/assets/logo.svg';


// --- State ---
const showRules = ref(false);
const gamePhase = ref('SETUP'); // SETUP, PLAYING, QUESTION
const players = ref([]);
const currentPlayerIndex = ref(0);
const winner = ref(null);

const isSpinning = ref(false);
const wheelRotation = ref(0);


// --- Game Logic ---
function initGame(playerCount) {
  players.value = Array.from({ length: playerCount }, (_, i) => ({
    id: i + 1,
    name: `Player ${i + 1}`,
    score: 0
  }));
  currentPlayerIndex.value = 0;
  currentPlayerIndex.value = 0;
  gamePhase.value = 'NAMES';
  wheelRotation.value = 0;
}

function startGame() {
  gamePhase.value = 'PLAYING';
}

function resetGame() {
  gamePhase.value = 'SETUP';
  players.value = [];
  winner.value = null;
}



function spinWheel() {
  if (isSpinning.value) return;
  
  isSpinning.value = true;
  
  // Calculate random rotation
  const minSpins = 5;
  const randomAngle = Math.floor(Math.random() * 360);
  const totalRotation = wheelRotation.value + (minSpins * 360) + randomAngle;
  
  wheelRotation.value = totalRotation;
  
  // Just spin, no card drawing
  setTimeout(() => {
    isSpinning.value = false;
    handleSpinResult(totalRotation);
  }, 4000);
}

function adjustScore(player, amount) {
  player.score += amount;
  if (player.score >= 15) {
    winner.value = player;
    gamePhase.value = 'GAME_OVER';
  }
}

function nextTurn() {
  currentPlayerIndex.value = (currentPlayerIndex.value + 1) % players.value.length;
}

function handleSpinResult() {
  // Manual mode: just finish spinning, do not add points or switch turn automatically
  gamePhase.value = 'PLAYING';
}



</script>

<style scoped>



#home-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  color: var(--text-color);
  font-family: var(--font-main);
  overflow-x: hidden;
  overflow-y: auto; /* Enable vertical scroll */
  background-image: linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)), url(@/assets/grey_black_grunge.png);
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-blend-mode: normal;
  background-color: #000;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.6);
  border-bottom: 2px solid var(--primary-color);
  box-shadow: 0 5px 15px rgba(0,0,0,0.5);
  flex-wrap: wrap;
  gap: 1rem;
}

h1 {
  display: none; /* Replaced by images */
}

.header-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.title-img {
  height: 150px;
  object-fit: contain;
}

.title-img.top {
  margin-bottom: -10px;
  z-index: 2;
}

.title-img.bottom {
  z-index: 1;
}

.header-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-secondary {
  background: rgba(0,0,0,0.5);
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-family: var(--font-main);
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.2s;
  clip-path: polygon(10% 0, 100% 0, 100% 80%, 90% 100%, 0 100%, 0 20%);
}

.btn-secondary:hover {
  background: var(--primary-color);
  color: black;
  text-shadow: 0 0 5px rgba(0,0,0,0.5);
}

.btn-primary {
  background: var(--primary-color);
  color: black;
  border: none;
  padding: 1rem 2rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  font-size: 1.1rem;
  font-family: var(--font-accent);
  letter-spacing: 1px;
  text-transform: uppercase;
  clip-path: polygon(5% 0, 100% 0, 100% 85%, 95% 100%, 0 100%, 0 15%);
  box-shadow: 3px 3px 0px rgba(0,0,0,0.5);
}

.btn-primary:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0px rgba(0,0,0,0.7);
  filter: brightness(1.1);
}

/* SETUP */
.setup-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  gap: 2rem;
  padding: 2rem;
  text-align: center;
  position: relative;
  z-index: 10;
}

.player-selection {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.name-inputs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
}

.input-group {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.input-group label {
  color: var(--primary-color);
  font-family: var(--font-accent);
  margin-bottom: 0.5rem;
}

.input-group input {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.8rem;
  color: white;
  font-family: var(--font-main);
  border-radius: 5px;
  font-size: 1rem;
}

.input-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: rgba(255, 255, 255, 0.15);
}

/* GAME LAYOUT */
.game-layout {
  display: flex;
  flex: 1;
  /* height: calc(100vh - 80px); Removed fixed height for mobile scrolling */
  min-height: calc(100vh - 80px);
}

.scoreboard {
  width: 300px;
  background: rgba(0, 0, 0, 0.7);
  border-right: 2px solid #333;
  padding: 2rem;
  flex-shrink: 0;
  backdrop-filter: blur(2px);
}

.scoreboard h3 {
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  font-family: var(--font-main);
  font-size: 1.5rem;
  text-transform: uppercase;
  border-bottom: 1px solid var(--primary-color);
  padding-bottom: 0.5rem;
}

.scoreboard ul {
  list-style: none;
  padding: 0;
}

.scoreboard li {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border: 1px solid transparent;
  transition: all 0.3s;
}

.scoreboard li.active {
  border-color: var(--primary-color);
  background: rgba(212, 175, 55, 0.15);
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.1);
  border-left-width: 5px;
}

.score-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-score {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.5);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.2rem;
  line-height: 1;
  transition: all 0.2s ease;
  padding: 0;
}

.btn-score:hover {
  background: rgba(212, 175, 55, 0.2); /* Gold tint */
  border-color: var(--primary-color);
  color: var(--primary-color);
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.4);
  transform: scale(1.1);
}

.btn-score.minus:hover {
  background: rgba(255, 68, 68, 0.2); /* Red tint */
  border-color: #ff4444;
  color: #ff4444;
  box-shadow: 0 0 8px rgba(255, 68, 68, 0.4);
}

.btn-secondary.small {
  font-size: 0.8rem;
  padding: 0.5rem 1rem;
  margin-left: 0;
  width: auto;
  min-width: 120px;
}

.next-turn-btn {
  width: 100%;
  margin-top: 1rem;
  text-align: center;
  justify-content: center;
  display: flex;
}

.roulette-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start; /* Move up */
  gap: 1rem;
  padding: 0 2rem; /* Remove top/bottom padding */
  margin-top: -2rem; /* Force move up */
  overflow: visible; /* Allow arrow to stick out if needed */
}

.turn-indicator {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.highlight {
  color: var(--primary-color);
  font-weight: bold;
  font-family: var(--font-accent);
  font-size: 1.2em;
  text-shadow: 2px 2px 0px rgba(0,0,0,0.8);
}

/* WHEEL STYLES */
.wheel-container {
  position: relative;
  width: 75vh;
  height: 75vh;
  max-width: 95vw;
  max-height: 95vw;
  aspect-ratio: 1 / 1;
  margin-top: -3rem; /* Move wheel up further */
}

.wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  border: 4px solid white;
  box-shadow: 0 0 30px rgba(0,0,0,0.5);
  transition: transform 4s cubic-bezier(0.1, 0.7, 0.1, 1);
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  border: none;
  box-shadow: none; /* Shadow might be in the image or handled by container */
}

.wheel-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}



.segment {
  position: absolute;
  top: 0;
  right: 0;
  width: 50%;
  height: 50%;
  transform-origin: 0% 100%;
  border: 1px solid rgba(0,0,0,0.1);
  background-size: cover;
  background-position: center;
}

.segment-content {
  position: absolute;
  left: -100%;
  width: 200%;
  height: 200%;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding-bottom: 20px;
}

.segment .label {
  font-family: 'Impact', sans-serif;
  font-weight: bold;
  font-size: 1.5rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 40px; /* Push text towards edge */
}

.segment.soft .label { color: #FFC0CB; } /* Pink */
.segment.medium .label { color: #800080; } /* Purple */
.segment.hard .label { color: #FFD700; } /* Yellow */

.wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  z-index: 10;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
}

.pointer {
  display: none; /* Using center hub or top marker? */
}
/* Add a top marker if needed, or rely on the "12 o'clock" position */
.wheel-container::after {
  content: '';
  position: absolute;
  top: 15px; /* Move down to overlap/touch wheel */
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-top: 40px solid var(--primary-color);
  z-index: 20;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}

.spin-btn {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 30; /* Above everything else */
  opacity: 0; /* Invisible */
}

.spin-instruction {
  margin-top: 1rem;
  font-family: var(--font-accent);
  color: var(--primary-color);
  font-size: 1.5rem;
  letter-spacing: 2px;
  animation: pulseText 2s infinite;
  text-shadow: 0 0 10px rgba(0,0,0,0.8);
}

@keyframes pulseText {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

.spin-btn:disabled {
  filter: grayscale(0.8);
  cursor: not-allowed;
}



/* GAME OVER STYLES */
.game-over-content {
  background: linear-gradient(145deg, #1a1a1a, #000000), url(@/assets/grey_black_grunge.png);
  background-blend-mode: overlay;
  background-size: cover;
  border-radius: 25px;
  padding: 4rem 2rem;
  text-align: center;
  max-width: 600px;
  width: 90%;
  box-shadow: 0 0 60px rgba(223, 220, 8, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.game-over-content h2 {
  font-size: 4rem;
  color: var(--primary-color);
  margin: 0;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 10px;
  text-shadow: 0 0 20px rgba(223, 220, 8, 0.5);
  line-height: 1;
}

.winner-announcement {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.winner-name {
  font-size: 3rem;
  font-weight: 900;
  color: white;
  text-transform: uppercase;
  font-family: var(--font-accent);
  letter-spacing: 2px;
}

.winner-announcement p {
  font-size: 1.2rem;
  color: #aaa;
  font-style: italic;
}

.game-over-content .btn-primary {
  margin-top: 1rem;
  width: auto;
  min-width: 200px;
  font-size: 1.5rem;
  padding: 1rem 3rem;
  background: transparent;
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
  box-shadow: 0 0 15px rgba(223, 220, 8, 0.2);
}

.game-over-content .btn-primary:hover {
  background: var(--primary-color);
  color: black;
  box-shadow: 0 0 30px rgba(223, 220, 8, 0.6);
  transform: scale(1.05);
}

@keyframes victoryPulse {
  0% { box-shadow: 0 0 30px rgba(223, 220, 8, 0.2); border-color: rgba(223, 220, 8, 0.2); }
  50% { box-shadow: 0 0 60px rgba(223, 220, 8, 0.5); border-color: rgba(223, 220, 8, 0.5); }
  100% { box-shadow: 0 0 30px rgba(223, 220, 8, 0.2); border-color: rgba(223, 220, 8, 0.2); }
}

@media (max-width: 768px) {
  /* Mobile Header */
  header {
    flex-direction: column;
    text-align: center;
    padding: 1rem;
    gap: 1rem;
  }

  .title-img {
    height: 80px; /* Smaller logo */
  }

  .game-layout {
    flex-direction: column;
    gap: 2rem;
  }

  /* Grid Scoreboard (2 per row) */
  .scoreboard {
    width: 100%;
    border-right: none;
    border-bottom: 2px solid var(--primary-color);
    padding: 1rem;
    background: rgba(0, 0, 0, 0.8);
  }
  
  .scoreboard h3 {
    display: none; 
  }

  .scoreboard ul {
    display: grid;
    grid-template-columns: 1fr 1fr; /* Two columns */
    gap: 1rem;
    width: 100%;
    padding: 0;
  }

  .scoreboard li {
    width: 100%;
    min-width: 0; /* Allow shrinking */
    margin-bottom: 0;
    flex-direction: column;
    align-items: center;
    text-align: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .scoreboard li.active {
    background: rgba(212, 175, 55, 0.2);
    border: 2px solid var(--primary-color);
    transform: scale(1.05);
  }

  .player-name {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 0.2rem;
  }

  .player-score {
    font-size: 1.5rem;
    color: var(--primary-color);
    font-family: var(--font-accent);
  }

  /* Roulette Section */
  .roulette-section {
    padding: 1rem;
    margin-top: 0;
  }

  .turn-indicator {
    font-size: 1.8rem; /* Larger text */
    margin-bottom: 2rem;
  }

  .wheel-container {
    width: 95vw;
    height: 95vw;
    max-width: 95vw;
    max-height: 95vw;
    margin-top: 1rem;
  }
  
  .spin-instruction {
    font-size: 2rem;
    margin-top: 2rem;
  }

  /* Hide deck on mobile */
  .deck-section {
    display: none;
  }
}

@media (max-width: 480px) {
  .wheel-container {
    width: 125vw;
    height: 125vw;
    max-width: 125vw;
    max-height: 125vw;
  }

  .card-container {
    height: 450px;
  }

  .card-face {
    padding: 1.5rem;
  }

  .resolution-controls {
    flex-direction: column;
  }

  .btn-success, .btn-danger {
    width: 100%;
  }
}


</style>

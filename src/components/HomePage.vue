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

      <!-- GAME PHASE -->
      <div v-else class="game-layout">
        
        <!-- SCOREBOARD -->
        <aside class="scoreboard">
          <h3>Scoreboard</h3>
          <ul>
            <li v-for="(player, index) in players" :key="player.id" 
                :class="{ active: index === currentPlayerIndex }">
              <span class="player-name">{{ player.name }}</span>
              <span class="player-score">{{ player.score }} pts</span>
            </li>
          </ul>
        </aside>

        <!-- ROULETTE AREA -->
        <div class="roulette-section">
          <div class="turn-indicator">
            Current Turn: <span class="highlight">{{ players[currentPlayerIndex].name }}</span>
          </div>

          <div class="wheel-container">
            <div class="pointer"></div>
            <div class="wheel" :style="{ 
              transform: `rotate(${wheelRotation}deg)`, 
              backgroundImage: `url(${rouletteWheel})`,
              backgroundPosition: `calc(50% + 9px) calc(50% + 10px)`
            }">
              <!-- Image replaces manual segments -->
              <!-- Text removed as requested -->
            </div>
            <div class="wheel-center" :style="{ backgroundImage: `url(${rond1})` }"></div>
            <button class="spin-btn" @click="spinWheel" :disabled="isSpinning || gamePhase !== 'PLAYING'">
              <span v-if="!isSpinning">SPIN</span>
              <span v-else>...</span>
            </button>
          </div>
        </div>




        <!-- DECK AREA (PC ONLY) -->
        <aside class="deck-section">
          <div 
            v-for="deck in DECK_TYPES" 
            :key="deck.type"
            class="deck-container"
            :ref="el => { if(el) deckRefs[deck.type] = el }"
          >
            <div class="deck">
              <div class="deck-label" :class="deck.type.toLowerCase()">{{ deck.label }}</div>
              <div class="deck-card" v-for="n in 3" :key="n" :style="{ transform: `translateY(${-n * 2}px) translateZ(${n}px)` }"></div>
              <div class="deck-top" :style="{ backgroundImage: `url(${deck.image})` }"></div>
            </div>
          </div>
        </aside>
      </div>

      <!-- ANIMATION ELEMENTS -->
      <div v-if="isDrawingCard" class="flying-card" :style="flyingCardStyle">
        <div class="card-back-visual" :style="{ backgroundImage: `url(${currentDeckImage})` }"></div>
      </div>
    </main>

    <!-- QUESTION CARD MODAL -->
    <div v-if="gamePhase === 'QUESTION' && currentQuestion" class="modal question-modal">
      <div class="modal-content card-container">
        <div class="card" :class="{ flipped: isCardFlipped }">
          
          <!-- FRONT -->
          <div class="card-face card-front">
            <div class="difficulty-badge" :class="currentQuestion.difficulty.toLowerCase()">
              {{ currentQuestion.difficulty }}
            </div>
            
            <!-- Bonus Instruction -->
            <div v-if="currentQuestion.difficulty === 'BONUS'" class="bonus-instruction">
              <p><strong>BONUS!</strong> Piochez une carte bonus (IRL) !</p>
            </div>

            <h3 class="question-text">{{ currentQuestion.question }}</h3>
            <button class="btn-primary reveal-btn" @click="isCardFlipped = true">
              Afficher la réponse
            </button>
          </div>

          <!-- BACK -->
          <div class="card-face card-back">
            <h3>Réponse</h3>
            <p class="answer-text">{{ currentQuestion.answer }}</p>
            
            <div class="resolution-controls">
              <button class="btn-success" @click="resolveTurn(true)">Correct (+{{ getPoints(currentQuestion.difficulty) }})</button>
              <button class="btn-danger" @click="resolveTurn(false)">Wrong</button>
            </div>
          </div>

        </div>
      </div>
    </div>

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
import { ref, computed } from 'vue';
import fond1 from '@/assets/fond1.png';
import fond2 from '@/assets/fond2.png';
import fond3 from '@/assets/fond3.png';
import logo from '@/assets/logo.svg';
import rond1 from '@/assets/ROND/rond 1.png';
import rouletteWheel from '@/assets/roulette_wheel.png';

// --- Game Data ---
const QUESTIONS = {
  SOFT: [
    { q: "What does HTML stand for?", a: "HyperText Markup Language" },
    { q: "Which tag is used for the largest heading?", a: "<h1>" },
    { q: "What is the CSS property to change text color?", a: "color" },
    { q: "In Vue, how do you bind a variable to text?", a: "{{ variable }} or v-text" },
    { q: "What is the correct HTML element for inserting a line break?", a: "<br>" }
  ],
  MEDIUM: [
    { q: "What is the difference between let and const?", a: "const cannot be reassigned, let can." },
    { q: "What is a Vue computed property?", a: "A property that is cached based on its reactive dependencies." },
    { q: "Explain the box model.", a: "Content, Padding, Border, Margin." },
    { q: "How do you center a div horizontally and vertically with Flexbox?", a: "justify-content: center; align-items: center;" },
    { q: "What does API stand for?", a: "Application Programming Interface" }
  ],
  HARD: [
    { q: "What is the event loop in JavaScript?", a: "Mechanism that handles async callbacks." },
    { q: "Explain Vue's reactivity system (Proxies).", a: "Vue 3 uses Proxies to intercept object access/mutation." },
    { q: "What is the difference between local storage and session storage?", a: "Local persists forever, Session clears on tab close." },
    { q: "What is a closure in JavaScript?", a: "A function remembering its lexical scope even when executed outside it." },
    { q: "Explain SSR vs CSR.", a: "Server-Side Rendering vs Client-Side Rendering." }
  ]

};

const DECK_TYPES = [
  { type: 'SOFT', label: 'SOFT', image: fond1 },
  { type: 'MEDIUM', label: 'MEDIUM', image: fond2 },
  { type: 'HARD', label: 'HARD', image: fond3 }
];

// Wheel Segments (12 total, 30deg each)
// Order clockwise from top: MEDIUM, SOFT, HARD...
const wheelSegments = Array.from({ length: 3 }).flatMap(() => [
  { type: 'HARD', label: 'HARD', image: fond3 },
  { type: 'MEDIUM', label: 'MEDIUM', image: fond1 },
  { type: 'SOFT', label: 'SOFT', image: fond1 },
  { type: 'BONUS', label: 'BONUS', image: fond3 }
]);

// --- State ---
const showRules = ref(false);
const gamePhase = ref('SETUP'); // SETUP, PLAYING, QUESTION
const players = ref([]);
const currentPlayerIndex = ref(0);
const winner = ref(null);

const isSpinning = ref(false);
const wheelRotation = ref(0);
const currentQuestion = ref(null);

const isCardFlipped = ref(false);



const isDrawingCard = ref(false);
const deckRefs = ref({});
const flyingCardStyle = ref({});



const currentDeckImage = computed(() => {
  if (!currentQuestion.value) return fond1;
  const deck = DECK_TYPES.find(d => d.type === currentQuestion.value.difficulty);
  // Fallback for BONUS to HARD deck image if needed, or just keep fond1/fond3
  if (currentQuestion.value.difficulty === 'BONUS') return fond3; 
  return deck ? deck.image : fond1;
});

// --- Game Logic ---
function initGame(playerCount) {
  players.value = Array.from({ length: playerCount }, (_, i) => ({
    id: i + 1,
    name: `Player ${i + 1}`,
    score: 0
  }));
  currentPlayerIndex.value = 0;
  gamePhase.value = 'PLAYING';
  wheelRotation.value = 0;
}

function resetGame() {
  gamePhase.value = 'SETUP';
  players.value = [];
  winner.value = null;
}

function nextTurn() {
  currentPlayerIndex.value = (currentPlayerIndex.value + 1) % players.value.length;
  gamePhase.value = 'PLAYING';
  isCardFlipped.value = false;
  currentQuestion.value = null;
}

function getPoints(difficulty) {
  if (difficulty === 'SOFT') return 1;
  if (difficulty === 'MEDIUM') return 2;
  if (difficulty === 'BONUS') return 2;
  return 3;
}





function spinWheel() {
  if (isSpinning.value) return;
  
  isSpinning.value = true;
  
  // Calculate random rotation
  const minSpins = 5;
  const randomAngle = Math.floor(Math.random() * 360);
  const totalRotation = wheelRotation.value + (minSpins * 360) + randomAngle;
  
  wheelRotation.value = totalRotation;
  
  setTimeout(() => {
    isSpinning.value = false;
    handleSpinResult(totalRotation);
  }, 4000); 
}

function handleSpinResult(rotation) {
  const normalizedRotation = rotation % 360;
  // Pointer is at top (0 deg).
  // The wheel rotates clockwise.
  // The segment at the top is the one that "won".
  // Angle 0 of the wheel is the start of the first segment (Index 0).
  // If rotation is 0, Index 0 is at 0-30 deg (right of top?).
  // Wait, CSS rotate starts at 12 o'clock or 3 o'clock?
  // Usually 0deg is 12 o'clock in my CSS if I set it up that way, or 3 o'clock default.
  // Let's assume standard CSS: 0deg is 12 o'clock if I rotate segments from there.
  // My segments are rotated `index * 30`.
  // Segment 0 is at 0deg.
  // Segment 1 is at 30deg.
  // If wheel rotates -30deg, Segment 1 is at top.
  // So: Angle under pointer = (360 - rotation) % 360.
  
  // CALIBRATION: Adjust this value if the wrong segment is selected.
  // This represents the angle of the first segment (Index 0) on the image relative to the top.
  const ROTATION_OFFSET = 0; 
  
  const angleUnderPointer = (360 - normalizedRotation + ROTATION_OFFSET) % 360;
  const segmentIndex = Math.floor(angleUnderPointer / 30);
  const winningSegment = wheelSegments[segmentIndex];
  
  const difficulty = winningSegment.type;

  // Pick random question
  // If BONUS, use HARD questions
  const pool = difficulty === 'BONUS' ? QUESTIONS['HARD'] : QUESTIONS[difficulty];
  const qData = pool[Math.floor(Math.random() * pool.length)];
  
  currentQuestion.value = {
    difficulty,
    question: qData.q,
    answer: qData.a
  };
  
  gamePhase.value = 'ANIMATING'; // Temporary phase for animation
  triggerCardDraw();
}

function triggerCardDraw() {
  let difficulty = currentQuestion.value.difficulty;
  if (difficulty === 'BONUS') difficulty = 'HARD'; // Draw from HARD deck for animation
  const deckEl = deckRefs.value[difficulty];
  
  if (deckEl) {
    const rect = deckEl.getBoundingClientRect();
    // Calculate center of the deck
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    
    flyingCardStyle.value = {
      '--start-x': `${startX}px`,
      '--start-y': `${startY}px`
    };
  }

  isDrawingCard.value = true;
  
  // Play animation for 1.2s then show question
  setTimeout(() => {
    isDrawingCard.value = false;
    gamePhase.value = 'QUESTION';
  }, 1200);
}

function resolveTurn(correct) {
  if (correct) {
    const player = players.value[currentPlayerIndex.value];
    const points = getPoints(currentQuestion.value.difficulty);
    player.score += points;

    if (player.score >= 15) {
      winner.value = player;
      gamePhase.value = 'GAME_OVER';
      return;
    }
  }
  nextTurn();
}

</script>

<style scoped>
:root {
  --primary-color: #D4AF37;
  --bg-color: #000000;
  --card-bg: #1a1a1a;
}

#home-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  color: white;
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(20, 20, 20, 0.8);
  border-bottom: 1px solid var(--primary-color);
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
  background: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-primary {
  background: var(--primary-color);
  color: black;
  border: none;
  padding: 1rem 2rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
  font-size: 1rem;
}

.btn-primary:hover {
  transform: scale(1.05);
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
}

.player-selection {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* GAME LAYOUT */
.game-layout {
  display: flex;
  flex: 1;
  /* height: calc(100vh - 80px); Removed fixed height for mobile scrolling */
  min-height: calc(100vh - 80px);
}

.scoreboard {
  width: 250px;
  background: rgba(255, 255, 255, 0.05);
  border-right: 1px solid #333;
  padding: 2rem;
  flex-shrink: 0;
}

.scoreboard h3 {
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  font-family: 'Cinzel', serif;
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
  background: rgba(212, 175, 55, 0.1);
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
}

.roulette-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 2rem;
  overflow: hidden; /* Prevent wheel overflow */
}

.turn-indicator {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;
}

.highlight {
  color: var(--primary-color);
  font-weight: bold;
  font-family: 'Cinzel', serif;
}

/* WHEEL STYLES */
.wheel-container {
  position: relative;
  width: 60vh;
  height: 60vh;
  max-width: 90vw;
  max-height: 90vw;
  aspect-ratio: 1 / 1;
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
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 25px solid white;
  z-index: 20;
}

.spin-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 25%; /* Responsive size */
  height: 25%;
  border-radius: 50%;
  background: radial-gradient(circle, #D4AF37, #8B6914);
  border: 4px solid white;
  color: black;
  font-weight: 900;
  cursor: pointer;
  z-index: 20;
  font-size: clamp(0.8rem, 2vw, 1.2rem);
  display: flex;
  align-items: center;
  justify-content: center;
}

.spin-btn:disabled {
  filter: grayscale(0.8);
  cursor: not-allowed;
}

/* CARD MODAL */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  backdrop-filter: blur(5px);
  padding: 1rem;
}

/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.question-modal .card-container {
  animation: modalPop 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes modalPop {
  0% {
    transform: scale(1) rotateY(-90deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotateY(0deg);
    opacity: 1;
  }
}

.modal-content {
  background: transparent;
  perspective: 1000px;
  width: 100%;
  display: flex;
  justify-content: center;
}

.rules-content {
  background: black;
  padding: 2rem;
  border: 2px solid var(--primary-color);
  max-width: 600px;
  width: 100%;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}

.card-container {
  width: 600px; /* Landscape */
  max-width: 90vw;
  height: 420px; /* Landscape */
  max-height: 80vh;
}

.card {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.8s;
  transform-style: preserve-3d;
}

.card.flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border: 2px solid var(--primary-color);
  background: #111;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 0 50px rgba(212, 175, 55, 0.2);
  overflow-y: auto; /* Allow scrolling if content is long */
}

.card-back {
  transform: rotateY(180deg);
  background: #222;
}

.difficulty-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  margin-bottom: 2rem;
  text-transform: uppercase;
  font-size: 0.9rem;
}

.difficulty-badge.beginner { background: #D4AF37; color: black; }
.difficulty-badge.medium { background: #555; color: white; border: 1px solid #aaa; }
.difficulty-badge.medium { background: #555; color: white; border: 1px solid #aaa; }
.difficulty-badge.hard { background: #8B0000; color: white; }
.difficulty-badge.bonus { background: white; color: black; border: 2px solid #D4AF37; }

.bonus-instruction {
  background: rgba(212, 175, 55, 0.2);
  border: 1px solid var(--primary-color);
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  color: var(--primary-color);
  font-size: 1.1rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(212, 175, 55, 0); }
  100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
}

.question-text {
  font-size: clamp(1.2rem, 3vw, 1.5rem);
  line-height: 1.4;
  margin-bottom: 2rem;
}

.answer-text {
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  color: #D4AF37;
  margin-bottom: 2rem;
}

.reveal-btn {
  margin-top: auto;
  width: 100%;
}

.resolution-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}

.btn-success, .btn-danger {
  flex: 1;
  min-width: 120px;
  border: none;
  padding: 1rem;
  cursor: pointer;
  font-weight: bold;
}

.btn-success { background: #28a745; color: white; }
.btn-danger { background: #dc3545; color: white; }

.close-modal {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 2rem;
  color: var(--primary-color);
  cursor: pointer;
}

.hidden { display: none; }

/* MEDIA QUERIES */
/* DECK SECTION */
.deck-section {
  width: 250px;
  background: rgba(255, 255, 255, 0.05);
  border-left: 1px solid #333;
  padding: 2rem;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.deck-container {
  perspective: 1000px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5rem;
}

.deck {
  position: relative;
  width: 240px; /* Enlarged */
  height: 168px; /* Enlarged */
  transform-style: preserve-3d;
  transform: rotateX(20deg) rotateY(-10deg);
  cursor: pointer;
  transition: transform 0.3s;
}

.deck:hover {
  transform: rotateX(10deg) rotateY(-5deg) scale(1.05);
}

.deck-card {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 25px;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.5);
}

.deck-top {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: contain; /* Crop less */
  background-repeat: no-repeat;
  background-color: #000; /* Fallback */
  background-position: center;
  border-radius: 25px;
  border: 2px solid var(--primary-color);
  transform: translateY(-12px) translateZ(6px); /* Sit on top of the stack */
  box-shadow: 0 -5px 15px rgba(0,0,0,0.5);
}

.deck-label {
  font-family: 'Cinzel', serif;
  color: var(--primary-color);
  font-weight: bold;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

.deck-label.beginner { color: #D4AF37; }
.deck-label.medium { color: #aaa; }
.deck-label.hard { color: #8B0000; }

/* FLYING CARD ANIMATION */
.flying-card {
  position: fixed;
  top: 0;
  left: 0;
  width: 240px; /* Match deck */
  height: 168px; /* Match deck */
  z-index: 1000;
  pointer-events: none;
  animation: drawCard 1.2s cubic-bezier(0.45, 0, 0.55, 1) forwards;
}

.card-back-visual {
  width: 100%;
  height: 100%;
  background-size: contain;
  background-repeat: no-repeat;
  background-color: #000;
  background-position: center;
  border-radius: 25px;
  border: 2px solid var(--primary-color);
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
}

@keyframes drawCard {
  0% {
    transform: translate(calc(var(--start-x) - 50%), calc(var(--start-y) - 50%)) scale(1) rotate(0deg);
    opacity: 1;
  }
  50% {
    /* Move to center, slight tilt */
    transform: translate(calc(50vw - 50%), calc(50vh - 50%)) scale(1.2) rotate(5deg);
    opacity: 1;
  }
  100% {
    /* End horizontal and flipped (edge on) */
    transform: translate(calc(50vw - 50%), calc(50vh - 50%)) scale(1) rotate(0deg) rotateY(90deg);
    opacity: 0;
  }
}

/* GAME OVER STYLES */
.game-over-content {
  background: black;
  border: 4px solid var(--primary-color);
  padding: 3rem;
  text-align: center;
  max-width: 500px;
  box-shadow: 0 0 50px var(--primary-color);
  animation: victoryPulse 2s infinite;
}

.game-over-content h2 {
  font-size: 3rem;
  color: var(--primary-color);
  margin-bottom: 2rem;
  font-family: 'Cinzel', serif;
}

.winner-announcement {
  margin-bottom: 2rem;
}

.winner-name {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  display: block;
  margin-bottom: 1rem;
}

@keyframes victoryPulse {
  0% { box-shadow: 0 0 30px var(--primary-color); }
  50% { box-shadow: 0 0 60px var(--primary-color); }
  100% { box-shadow: 0 0 30px var(--primary-color); }
}

@media (max-width: 768px) {
  header {
    flex-direction: column;
    text-align: center;
  }

  .game-layout {
    flex-direction: column;
  }

  .scoreboard {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #333;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .scoreboard ul {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
    width: 100%;
  }

  .scoreboard li {
    margin-bottom: 0;
    flex: 1;
    min-width: 120px;
    justify-content: center;
    gap: 0.5rem;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .roulette-section {
    padding: 1rem;
  }

  .wheel-container {
    width: 300px;
    height: 300px;
  }
  
  .segment .label {
    font-size: 0.9rem;
    top: 12%;
  }

  /* Hide deck on mobile */
  .deck-section {
    display: none;
  }
}

@media (max-width: 480px) {
  .wheel-container {
    width: 280px;
    height: 280px;
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

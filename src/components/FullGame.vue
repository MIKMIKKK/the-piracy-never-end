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
              <div class="score-controls">
                <button class="btn-score minus" @click.stop="adjustScore(player, -1)">-</button>
                <span class="player-score">{{ player.score }} pts</span>
                <button class="btn-score plus" @click.stop="adjustScore(player, 1)">+</button>
              </div>
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
          <div class="card-face card-front" :class="currentQuestion.difficulty.toLowerCase()">
            <div class="difficulty-badge" :class="currentQuestion.difficulty.toLowerCase()">
              {{ currentQuestion.difficulty }}
            </div>
            
            <!-- Bonus Instruction -->
            <div v-if="currentQuestion.difficulty === 'BONUS'" class="bonus-instruction">
              <p><strong>BONUS!</strong> Draw a bonus card (IRL)!</p>
            </div>

            <h3 class="question-text">{{ currentQuestion.question }}</h3>
            <button class="btn-primary reveal-btn" @click="isCardFlipped = true">
              Reveal Answer
            </button>
          </div>

          <!-- BACK -->
          <div class="card-face card-back" :class="currentQuestion.difficulty.toLowerCase()">
            <h3>Answer</h3>
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
import rouletteWheel from '@/assets/test.png';

// --- Game Data ---
const QUESTIONS = {
  SOFT: [
    { q: "What is a brand identity?", a: "The visible elements of a brand, like colors, logo, and design that identify it." },
    { q: "What is the difference between primary and secondary brand colors?", a: "Primary are constant and central; secondary can change for campaigns or trends." },
    { q: "What is a color palette?", a: "A set of colors used consistently in a brand’s visual design." },
    { q: "What is a font?", a: "A specific style used for letters and numbers." },
    { q: "What is a dynamic logo?", a: "A logo that changes to reflect events or news." },
    { q: "What is a vector graphic?", a: "A graphic that can be scaled indefinitely without losing quality." },
    { q: "What is a raster graphic?", a: "An image made of pixels that can become pixelated when enlarged." },
    { q: "What is a wordmark?", a: "Stylized text used as part of a brand’s logo." },
    { q: "What are primary brand colors?", a: "Main colors that are central to a brand’s visual identity." },
    { q: "What are secondary brand colors?", a: "Additional colors that can change for marketing or trends." },
    { q: "What is typography?", a: "The font styles, sizes, and spacing used in text design." },
    { q: "What is a trademark?", a: "A legally registered symbol or word representing a company or product." },
    { q: "What is a design element?", a: "Visual parts that make up brand identity: fonts, logos, colors." },
    { q: "What is scalability in graphics?", a: "The ability for a graphic to look good at any size." },
    { q: "What is the smallest unit of a digital image?", a: "A pixel." }
  ],
  MEDIUM: [
    { q: "What does DPI stand for?", a: "Dots Per Inch – number of dots a printer can print per inch." },
    { q: "What does PPI stand for?", a: "Pixels Per Inch – number of pixels per inch on a screen or image." },
    { q: "Why is consistent typography important in branding?", a: "It reinforces brand identity and professionalism." },
    { q: "What is brand architecture?", a: "Defines roles of each brand and guides relationships between brands." },
    { q: "How does a scalable vector graphic differ from a raster image?", a: "Vectors can resize without losing quality; raster images pixelate when enlarged." },
    { q: "What is the purpose of a style guide?", a: "To provide rules for colors, fonts, logos, and visual identity." },
    { q: "How is a dynamic logo different from a regular logo?", a: "It changes to reflect events or news; regular logos are static." },
    { q: "What is the difference between DPI and PPI?", a: "DPI relates to print; PPI relates to digital screen resolution." },
    { q: "What is the role of design elements in a brand style guide?", a: "To define visual components like fonts, colors, and logos." },
    { q: "Why is a color palette important?", a: "It creates visual consistency and reinforces brand recognition." },
    { q: "What is a wordmark used for?", a: "To represent the brand name in stylized text." },
    { q: "How do trademarks protect a brand?", a: "They legally protect symbols or words from being copied." },
    { q: "What is a design element hierarchy?", a: "Organizing elements by importance for visual clarity." },
    { q: "What is the difference between vector and raster file formats?", a: "Vectors are usually .pdf/.svg; rasters are .jpg/.png/.gif." },
    { q: "How does consistency in brand style guide affect marketing?", a: "Ensures a recognizable and professional brand image across platforms." }
  ],
  HARD: [
    { q: "Explain why scalable vector graphics are preferred for logos.", a: "They maintain sharpness at any size, from business cards to billboards." },
    { q: "What is the difference between brand identity and brand image?", a: "Identity is how the brand is designed; image is how it’s perceived by consumers." },
    { q: "Why are secondary brand colors useful in marketing campaigns?", a: "They allow flexibility and adaptation to trends without changing main identity." },
    { q: "How does a brand style guide help maintain brand consistency?", a: "By defining rules for logos, fonts, colors, and visual elements." },
    { q: "Explain the concept of brand architecture with an example.", a: "Shows relationship between main brand and sub-brands, e.g., Coca-Cola, Diet Coke, Cherry Coke." },
    { q: "What is a pixel and why is it important in digital design?", a: "Smallest unit of digital image; affects clarity and resolution." },
    { q: "How does DPI affect printed material quality?", a: "Higher DPI means more dots per inch, sharper print." },
    { q: "How can typography influence brand perception?", a: "Fonts communicate style, tone, and professionalism." },
    { q: "Why is a dynamic logo strategically useful?", a: "Allows the brand to engage with events, trends, or news creatively." },
    { q: "How do vector and raster images affect scalability?", a: "Vectors scale infinitely without loss; raster images degrade." },
    { q: "What is a style guide’s role in global branding?", a: "Ensures consistent brand identity across all regions and media." },
    { q: "How does color palette choice impact brand recognition?", a: "Consistent use of colors makes the brand easily identifiable." },
    { q: "What is the difference between a trademark and a logo?", a: "Trademark is legally registered; a logo is a visual representation." },
    { q: "Explain why consistency in design elements is crucial.", a: "Maintains professionalism, recognizability, and brand trust." },
    { q: "How does pixel density (PPI) affect digital displays?", a: "Higher PPI gives sharper, clearer images on screens." }
  ]

};

const DECK_TYPES = [
  { type: 'SOFT', label: 'SOFT', image: fond1 },
  { type: 'MEDIUM', label: 'MEDIUM', image: fond2 },
  { type: 'HARD', label: 'HARD', image: fond3 }
];

// Wheel Segments (24 total, 15deg each)
// Order provided by user
const wheelSegments = [
  { type: 'MEDIUM', label: 'MEDIUM', image: fond1 },
  { type: 'BONUS', label: 'BONUS', image: fond3 },
  { type: 'SOFT', label: 'SOFT', image: fond1 },
  { type: 'BONUS', label: 'BONUS', image: fond3 },
  { type: 'BONUS', label: 'BONUS', image: fond3 },
  { type: 'HARD', label: 'HARD', image: fond3 },
  { type: 'BONUS', label: 'BONUS', image: fond3 },
  { type: 'MEDIUM', label: 'MEDIUM', image: fond1 },
  { type: 'BONUS', label: 'BONUS', image: fond3 },
  { type: 'SOFT', label: 'SOFT', image: fond1 },
  { type: 'HARD', label: 'HARD', image: fond3 },
  { type: 'BONUS', label: 'BONUS', image: fond3 },
  { type: 'MEDIUM', label: 'MEDIUM', image: fond1 },
  { type: 'BONUS', label: 'BONUS', image: fond3 },
  { type: 'HARD', label: 'HARD', image: fond3 },
  { type: 'BONUS', label: 'BONUS', image: fond3 },
  { type: 'SOFT', label: 'SOFT', image: fond1 },
  { type: 'MEDIUM', label: 'MEDIUM', image: fond1 },
  { type: 'BONUS', label: 'BONUS', image: fond3 },
  { type: 'SOFT', label: 'SOFT', image: fond1 },
  { type: 'BONUS', label: 'BONUS', image: fond3 },
  { type: 'HARD', label: 'HARD', image: fond3 },
  { type: 'BONUS', label: 'BONUS', image: fond3 },
  { type: 'BONUS', label: 'BONUS', image: fond3 }
];

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
  const ROTATION_OFFSET = 0; 
  
  const angleUnderPointer = (360 - normalizedRotation + ROTATION_OFFSET) % 360;
  const segmentIndex = Math.floor(angleUnderPointer / 15); // 24 segments = 15deg each
  const winningSegment = wheelSegments[segmentIndex];
  
  const difficulty = winningSegment.type;

  // Pick random question
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
  // Check if mobile (width < 768px)
  if (window.innerWidth < 768) {
    gamePhase.value = 'QUESTION';
    return;
  }

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

function adjustScore(player, amount) {
  player.score += amount;
  if (player.score >= 15) {
    winner.value = player;
    gamePhase.value = 'GAME_OVER';
  }
}

</script>

<style scoped>
::before::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}


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

/* Override global modal-content styles for the question modal */
.question-modal .modal-content {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
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
  border: none; /* Remove border */
  border-radius: 25px; /* Rounded corners */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.5); /* Softer shadow */
  overflow-y: auto; /* Allow scrolling if content is long */
  color: white; /* Default white text */
  background-blend-mode: multiply;
  background-size: cover;
}

.card-back {
  transform: rotateY(180deg);
  color: white;
}

/* Specificity fix: Define these AFTER card-back */
.card-face.soft { background-color: var(--soft) !important; }
.card-face.medium { background-color: var(--medium) !important; }
.card-face.hard { background-color: var(--hard) !important; }
.card-face.bonus { background-color: var(--hard) !important; }

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
  color: white;
}

.answer-text {
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  color: white;
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
  background: rgba(0, 0, 0, 0.7);
  border-left: 2px solid #333;
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
  gap: 8rem; /* Increased gap */
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
  font-family: var(--font-accent);
  color: var(--primary-color);
  font-weight: bold;
  letter-spacing: 2px;
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.8);
  font-size: 1.2rem;
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
    max-width: 500px; /* Increased max size */
    max-height: 500px;
    margin-top: 0;
  }
  
  .spin-instruction {
    font-size: 2rem;
    margin-top: 2rem;
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

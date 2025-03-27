// Configurações do jogo
export const gameConfig = {
  // Configuração inicial
  canvasWidth: window.innerWidth < 768 ? window.innerWidth - 50 : 375,
  canvasHeight: window.innerWidth < 768 ? window.innerHeight - 150 : 375,
  platformHeight: 100,
  heroDistanceFromEdge: window.innerWidth < 768 ? 5 : 10,
  paddingX: window.innerWidth < 768 ? 50 : 100,
  perfectAreaSize: 10,
  backgroundSpeedMultiplier: 0.2,
  
  // Configurações de altura das colinas
  hill1BaseHeight: 100,
  hill1Amplitude: 10,
  hill1Stretch: 1,
  hill2BaseHeight: 70,
  hill2Amplitude: 20,
  hill2Stretch: 0.5,
  
  // Velocidades de animação
  stretchingSpeed: 4, // Milliseconds it takes to draw a pixel
  turningSpeed: 4, // Milliseconds it takes to turn a degree
  walkingSpeed: 3,
  transitioningSpeed: 2,
  fallingSpeed: 2,
  
  // Herói
  heroWidth: 24,
  heroHeight: 40,
};

// Variáveis de estado global
export let phase = "waiting"; // waiting | stretching | turning | walking | transitioning | falling
export let lastTimestamp; // The timestamp of the previous requestAnimationFrame cycle

export let heroX; // Changes when moving forward
export let heroY; // Only changes when falling
export let sceneOffset; // Moves the whole game

export let platforms = [];
export let sticks = [];
export let trees = [];
export let clouds = []; // Array para armazenar as nuvens
export let stars = []; // Array para armazenar as estrelas

export let score = 0;

// Animação das pernas
export let legAnimationPhase = 0; // Fase da animação das pernas
export let legAnimationSpeed = 0.1; // Velocidade da animação

// Variáveis para eventos especiais
export let showCastle = false; // Controla quando mostrar o castelo
export let dragonY = 60;
export let dragonDirection = 1; // Direção da animação de flutuação

// Raios de gelo
export let iceRays = []; // Array para armazenar os raios de gelo
export let frozenEntities = []; // Array para entidades congeladas
export let lastRandomFreezeTime = 0;

// Altura do canvas - necessária para cálculos de posicionamento
export let canvasHeight = gameConfig.canvasHeight;

// Atualizar estado global
export function setPhase(newPhase) {
  phase = newPhase;
}

export function setLastTimestamp(timestamp) {
  lastTimestamp = timestamp;
}

export function setHeroX(x) {
  heroX = x;
}

export function setHeroY(y) {
  heroY = y;
}

export function setSceneOffset(offset) {
  sceneOffset = offset;
}

export function setScore(newScore) {
  score = newScore;
}

export function updatePlatforms(newPlatforms) {
  platforms = newPlatforms;
}

export function updateSticks(newSticks) {
  sticks = newSticks;
}

export function updateTrees(newTrees) {
  trees = newTrees;
}

export function updateClouds(newClouds) {
  clouds = newClouds;
}

export function updateStars(newStars) {
  stars = newStars;
}

export function setLegAnimationPhase(phase) {
  legAnimationPhase = phase;
}

export function setLegAnimationSpeed(speed) {
  legAnimationSpeed = speed;
}

// Funções para atualizar elementos especiais
export function setShowCastle(value) {
  showCastle = value;
}

export function setDragonY(value) {
  dragonY = value;
}

export function setDragonDirection(value) {
  dragonDirection = value;
}

export function setIceRays(value) {
  iceRays = value;
}

export function setLastRandomFreezeTime(value) {
  lastRandomFreezeTime = value;
}

// Funções para recalcular constantes
export function recalculateConstants() {
  gameConfig.canvasWidth = window.innerWidth < 768 ? window.innerWidth - 50 : 375;
  gameConfig.canvasHeight = window.innerWidth < 768 ? window.innerHeight - 150 : 375;
  gameConfig.heroDistanceFromEdge = window.innerWidth < 768 ? 5 : 10;
  gameConfig.paddingX = window.innerWidth < 768 ? 50 : 100;
  
  // Atualizar a variável canvasHeight quando as constantes são recalculadas
  canvasHeight = gameConfig.canvasHeight;
} 
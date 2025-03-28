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
export const recalculateConstants = () => {
  const isMobileDevice = window.innerWidth <= 768;
  
  // Define a largura e altura do canvas com base no tamanho do dispositivo
  // Sempre usar toda a largura e altura disponíveis da janela
  gameConfig.canvasWidth = window.innerWidth;
  gameConfig.canvasHeight = window.innerHeight;
  
  // Atualizar a referência de altura do canvas
  canvasHeight = gameConfig.canvasHeight;
  
  // Ajustar configurações específicas para dispositivos móveis
  if (isMobileDevice) {
    // Configurações para mobile mais conservadoras
    gameConfig.paddingX = Math.max(100, window.innerWidth * 0.25); // 25% da largura da tela
    gameConfig.platformPadding = Math.floor(window.innerWidth * 0.1); // 10% da largura da tela
    gameConfig.heroEdgeDistance = Math.min(100, window.innerWidth * 0.12);
    // Aumentar a altura da plataforma em dispositivos móveis para maior visibilidade
    gameConfig.platformHeight = Math.floor(Math.min(120, window.innerHeight * 0.15)); // 15% da altura da tela, máximo 120px
    gameConfig.heroVerticalOffset = 0;
  } else {
    // Configurações para desktop
    gameConfig.paddingX = 200;
    gameConfig.heroEdgeDistance = 350;
    gameConfig.platformHeight = 100;
    gameConfig.platformPadding = 30;
    gameConfig.heroVerticalOffset = 0;
  }
  
  // Garantir que o nível do chão seja ajustado corretamente
  gameConfig.groundLevel = gameConfig.canvasHeight - gameConfig.platformHeight;
  
  // Para debugging
  console.log(`Canvas recalculado: ${gameConfig.canvasWidth}x${gameConfig.canvasHeight}, Mobile: ${isMobileDevice}`);
  console.log(`Configurações da plataforma: altura=${gameConfig.platformHeight}, padding=${gameConfig.platformPadding}, groundLevel=${gameConfig.groundLevel}`);
  console.log(`Distâncias: paddingX=${gameConfig.paddingX}, heroEdgeDistance=${gameConfig.heroEdgeDistance}`);
  
  return gameConfig;
}; 
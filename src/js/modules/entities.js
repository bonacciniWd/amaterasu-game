// Módulo para entidades do jogo
import { 
  platforms, trees, clouds, stars, sticks, iceRays, 
  gameConfig, heroX, sceneOffset, frozenEntities,
  updatePlatforms, updateTrees, updateClouds, updateStars,
  updateSticks
} from './config.js';

// Funções para gerar entidades
export function generateTree() {
  const minimumGap = 30;
  const maximumGap = 150;

  // X coordinate of the right edge of the furthest tree
  const lastTree = trees[trees.length - 1];
  let furthestX = lastTree ? lastTree.x : 0;

  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));

  const treeColors = ["#6D8821", "#8FAC34", "#98B333"];
  const color = treeColors[Math.floor(Math.random() * 3)];

  const newTrees = [...trees, { x, color }];
  updateTrees(newTrees);
}

export function generatePlatform() {
  const minimumGap = 40;
  const maximumGap = 200;
  const minimumWidth = 20;
  const maximumWidth = 100;

  // X coordinate of the right edge of the furthest platform
  const lastPlatform = platforms[platforms.length - 1];
  let furthestX = lastPlatform.x + lastPlatform.w;

  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));
  const w =
    minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

  const newPlatforms = [...platforms, { x, w }];
  updatePlatforms(newPlatforms);
}

// Função para gerar estrelas
export function generateStars() {
  const starCount = 50; // Número de estrelas
  const newStars = []; // Limpa o array de estrelas
  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * window.innerWidth; // Posição X aleatória
    const y = Math.random() * (window.innerHeight / 2); // Posição Y aleatória na parte superior
    const size = Math.random() * 2 + 1; // Tamanho aleatório da estrela
    newStars.push({ x, y, size }); // Armazena a estrela no array
  }
  updateStars(newStars);
}

// Função para gerar nuvens
export function generateCloud() {
  // Gerar nuvem do lado esquerdo da tela
  const cloudX = -50 - Math.random() * 100; // Posição X à esquerda, fora da tela
  const cloudY = Math.random() * (window.innerHeight / 2); // Posição Y aleatória no céu
  const cloudWidth = 40 + Math.random() * 25; // Largura da nuvem aumentada em 5px (era 20)
  const cloudSpeed = 0.5 + Math.random(); // Velocidade da nuvem

  const newClouds = [...clouds, { 
    x: cloudX, 
    y: cloudY, 
    width: cloudWidth, 
    speed: cloudSpeed 
  }];
  
  updateClouds(newClouds);
}

// Função para mover nuvens
export function moveClouds() {
  const now = Date.now();
  const newClouds = clouds.map(cloud => {
    // Mover a nuvem horizontalmente baseado em sua velocidade
    // Se a nuvem estiver congelada, não mover
    if (!cloud.frozen) {
      cloud.x += cloud.speed;
    }
    
    // Se a nuvem sair da tela à direita, reposicioná-la à esquerda
    if (cloud.x > window.innerWidth + cloud.width) {
      return {
        ...cloud,
        x: -cloud.width - Math.random() * 50
      };
    }
    
    return cloud;
  });
  
  updateClouds(newClouds);
}

// Função que determina qual plataforma o stick atinge
export function thePlatformTheStickHits() {
  if (sticks.length === 0 || sticks[sticks.length - 1].rotation != 90)
    throw Error(`Stick is not at 90° or sticks array is empty`);
  
  const stick = sticks[sticks.length - 1];
  const stickFarX = stick.x + stick.length;

  const platformTheStickHits = platforms.find(
    (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
  );

  if (
    platformTheStickHits &&
    platformTheStickHits.x + platformTheStickHits.w / 2 - gameConfig.perfectAreaSize / 2 <
      stickFarX &&
    stickFarX <
      platformTheStickHits.x + platformTheStickHits.w / 2 + gameConfig.perfectAreaSize / 2
  ) {
    return [platformTheStickHits, true];
  }

  return [platformTheStickHits, false];
}

// Função para gerar raios de gelo
export function generateIceRay(startX, startY) {
  // Definir ângulos possíveis em 3 categorias (baixo, diagonal-esquerda, esquerda)
  const possibleAngles = [
    Math.PI/2 + Math.random() * 0.3 - 0.15,                // Para baixo (90° ± variação)
    Math.PI/2 + Math.PI/4 + Math.random() * 0.3 - 0.15,    // Diagonal para baixo-esquerda (135° ± variação)
    Math.PI + Math.random() * 0.3 - 0.15                   // Para esquerda (180° ± variação)
  ];
  
  // Escolher aleatoriamente um dos ângulos
  const angle = possibleAngles[Math.floor(Math.random() * possibleAngles.length)];
  
  // Criar o objeto de raio
  const newIceRays = [...iceRays, {
    x: startX,
    y: startY,
    angle: angle,
    length: 0,
    maxLength: 150 + Math.random() * 250,
    speed: 5 + Math.random() * 5,
    width: 2 + Math.random() * 3,
    active: true
  }];
  
  return newIceRays;
}

// Função para gerar flocos de neve
export function generateSnowflakes(x, y, radius) {
  const flakes = [];
  const numFlakes = 12 + Math.floor(Math.random() * 4); // 12-16 flocos
  
  for (let i = 0; i < numFlakes; i++) {
    const angle = (Math.PI * 2 / numFlakes) * i;
    // Aumentar o raio de distribuição
    const distance = radius * (0.8 + Math.random() * 0.3); // 80-110% do raio
    
    flakes.push({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 2.5 + Math.random() * 3.5,
      opacity: 0.8 + Math.random() * 0.2,
      blinkSpeed: 0.02 + Math.random() * 0.03,
      blinkPhase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.4 ? "#ADD8FF" : "#1E90FF",
      sparkleSize: 4 + Math.random() * 5,
      sparkleSpeed: 0.003 + Math.random() * 0.004
    });
  }
  
  // Adicionar sparkles internos
  for (let i = 0; i < 6; i++) {
    flakes.push({
      x: (Math.random() - 0.5) * radius * 0.6, // 60% do raio para área interna
      y: (Math.random() - 0.5) * radius * 0.6,
      size: 2 + Math.random() * 2.5,
      opacity: 0.7 + Math.random() * 0.3,
      blinkSpeed: 0.03 + Math.random() * 0.05,
      blinkPhase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.3 ? "#E0FFFF" : "#4682B4",
      sparkleSize: 3 + Math.random() * 4,
      sparkleSpeed: 0.004 + Math.random() * 0.006
    });
  }
  
  return flakes;
}

// Função para atualizar entidades congeladas
export function updateFrozenEntities() {
  const currentTime = Date.now();
  const freezeDuration = 5000; // Efeito dura exatamente 5 segundos (5000ms)
  
  // Atualizar nuvens congeladas
  const updatedClouds = clouds.map(cloud => {
    if (cloud.frozen && currentTime - cloud.frozenTime > freezeDuration) {
      return {
        ...cloud,
        frozen: false,
        speed: cloud.originalSpeed || cloud.speed, // Restaurar velocidade original
        snowflakes: null // Remover flocos
      };
    }
    return cloud;
  });
  updateClouds(updatedClouds);
  
  // Atualizar estado congelado do herói
  if (window.heroFrozen && currentTime - window.heroFrozenTime > freezeDuration) {
    window.heroFrozen = false;
    window.heroSnowflakes = null; // Remover flocos
    window.heroLastUnfrozenTime = currentTime; // Registrar quando foi descongelado
    
    // Inicializar o estado de imunidade
    window.heroIsImmune = true;
    window.heroImmunityTime = window.heroImmunityTime || 10000; // Aumentado de 5000 para 10000 (10 segundos)
  }
  
  // Verificar imunidade temporária
  if (!window.heroFrozen && window.heroLastUnfrozenTime) {
    // Se o tempo desde o último descongelamento for menor que o tempo de imunidade,
    // considerar o herói imune a novos congelamentos
    const immunityTimeElapsed = currentTime - window.heroLastUnfrozenTime;
    window.heroIsImmune = (immunityTimeElapsed < window.heroImmunityTime);
    
    // Se o herói não estiver mais imune, limpar as variáveis relacionadas
    if (!window.heroIsImmune) {
      window.heroLastUnfrozenTime = null;
    }
  } else {
    // Se o herói estiver congelado, não está imune
    if (window.heroFrozen) {
      window.heroIsImmune = false;
    }
  }
}

// Helpers para posição vertical de elementos
export function getHillY(windowX, baseHeight, amplitude, stretch) {
  const sineBaseY = window.innerHeight - baseHeight;
  return (
    Math.sinus((sceneOffset * gameConfig.backgroundSpeedMultiplier + windowX) * stretch) *
      amplitude +
    sineBaseY
  );
}

export function getTreeY(x, baseHeight, amplitude) {
  const sineBaseY = window.innerHeight - baseHeight;
  return Math.sinus(x) * amplitude + sineBaseY;
} 
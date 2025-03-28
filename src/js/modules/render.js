// Módulo principal de renderização
import { drawBackground } from './render/background.js';
import { drawHero } from './render/hero.js';
import { drawPlatforms, drawSticks, drawCastle } from './render/game.js';
import { drawDragon, drawIceRays } from './render/special.js';
import { 
  platforms, sticks, score, phase, showCastle, 
  sceneOffset, heroX, canvasHeight, gameConfig 
} from './config.js';
import { thePlatformTheStickHits } from './entities.js';

// Variáveis do canvas
let ctx;
let canvas;

// Inicializar o contexto de renderização
export function initRenderer() {
  canvas = document.getElementById("game");
  if (canvas) {
    ctx = canvas.getContext("2d");
  }
}

// Função principal de desenho
export function draw() {
  // Verificar se o contexto e canvas existem
  if (!ctx || !canvas) {
    console.error("Contexto ou canvas não disponível");
    initRenderer();
    if (!ctx || !canvas) return;
  }

  try {
    ctx.save();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    drawBackground(ctx);

    // Ajustar o posicionamento para centralizar o jogo na tela
    let translateX = 0 - sceneOffset;
    let translateY = 0;
    
    // Garantir que o jogo fique sempre centralizado horizontalmente
    if (gameConfig.canvasWidth < window.innerWidth) {
      translateX = (window.innerWidth - gameConfig.canvasWidth) / 2 - sceneOffset;
    }
    
    // Centralizar verticalmente apenas se necessário
    if (canvasHeight < window.innerHeight) {
      translateY = (window.innerHeight - canvasHeight) / 2;
    }

    // Aplicar transformações
    ctx.translate(translateX, translateY);

    // Draw scene
    drawPlatforms(ctx);
    drawHero(ctx);
    drawSticks(ctx);
    
    // Verificar pontuação e mostrar elementos especiais
    if (score >= 50 && showCastle) {
      drawCastle(ctx);
    }
    
    drawDragon(ctx);
    drawIceRays(ctx);
    
    ctx.restore();
  } catch (e) {
    console.error("Erro ao desenhar:", e);
    
    // Tentar recuperar o contexto
    if (canvas) {
      ctx = canvas.getContext("2d");
    }
  }
}

// Obter o contexto de renderização atual
export function getContext() {
  return ctx;
}

// Obter o canvas
export function getCanvas() {
  return canvas;
}
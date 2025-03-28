// Módulo para renderização principal do jogo
import { 
  platforms, sticks, gameConfig, sceneOffset, showCastle, 
  score, canvasHeight, heroX
} from '../config.js';
import { drawBackground } from './background.js';
import { drawHero } from './hero.js';
import { drawRoundedRect } from './hero.js';
import { drawDragon, drawIceRays } from './special.js';

// Imagens
let castleImage = new Image();
castleImage.src = 'src/images/castle.png';

// Função para desenhar plataformas
export function drawPlatforms(ctx) {
  platforms.forEach(({ x, w }) => {
    // Draw platform
    ctx.fillStyle = "#ADD8E6"; // Azul claro como gelo
    ctx.fillRect(
      x,
      canvasHeight - gameConfig.platformHeight,
      w,
      gameConfig.platformHeight + (window.innerHeight - canvasHeight) / 2
    );

    // Draw perfect area only if hero did not yet reach the platform
    if (sticks.length > 0 && sticks[sticks.length - 1].x < x) {
      ctx.fillStyle = "red";
      ctx.fillRect(
        x + w / 2 - gameConfig.perfectAreaSize / 2,
        canvasHeight - gameConfig.platformHeight,
        gameConfig.perfectAreaSize,
        gameConfig.perfectAreaSize
      );
    }
  });
}

// Função para desenhar bastões
export function drawSticks(ctx) {
  sticks.forEach((stick) => {
    ctx.save();
    
    // Move o ponto de ancoragem para o início do stick e rotaciona
    ctx.translate(stick.x, canvasHeight - gameConfig.platformHeight);
    ctx.rotate((Math.PI / 180) * stick.rotation);
    
    // Criar gradiente para efeito bamboo
    const gradient = ctx.createLinearGradient(0, 0, 0, -stick.length);
    gradient.addColorStop(0, "#8B4513"); // Marrom escuro
    gradient.addColorStop(0.2, "#DEB887"); // Marrom claro
    gradient.addColorStop(0.4, "#8B4513"); // Marrom escuro
    gradient.addColorStop(0.6, "#DEB887"); // Marrom claro
    gradient.addColorStop(0.8, "#8B4513"); // Marrom escuro
    gradient.addColorStop(1, "#DEB887"); // Marrom claro
    
    // Desenhar o stick principal com gradiente
    ctx.beginPath();
    ctx.lineWidth = 4; // Aumentando a espessura para 4px
    ctx.strokeStyle = gradient;
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stick.length);
    ctx.stroke();
    
    // Adicionar "nós" do bamboo a cada 15px
    for (let i = 0; i < stick.length; i += 15) {
      ctx.beginPath();
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#654321"; // Marrom mais escuro para os nós
      ctx.moveTo(-3, -i);
      ctx.lineTo(3, -i);
      ctx.stroke();
    }
    
    ctx.restore();
  });
}

// Função principal de desenho
export function draw(ctx) {
  // Verificar se o contexto existe
  if (!ctx) {
    console.error("Contexto não disponível");
    return;
  }

  try {
    ctx.save();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    drawBackground(ctx);

    // Ajuste para telas menores e mobile
    let scaleRatio = 1;
    let translateX, translateY;
    
    // Verifica se é uma tela pequena (provavelmente mobile)
    if (window.innerWidth < 768) {
      // Calcula uma escala melhor para cada dispositivo
      scaleRatio = Math.min(window.innerWidth / (gameConfig.canvasWidth * 1.1), window.innerHeight / (canvasHeight * 1.2), 1);
      
      // Centraliza melhor o conteúdo na tela
      translateX = (window.innerWidth / 2) - ((gameConfig.canvasWidth * scaleRatio) / 2) - (sceneOffset * scaleRatio);
      translateY = (window.innerHeight / 2) - ((canvasHeight * scaleRatio) / 2);
    } else {
      // Comportamento original para desktop
      translateX = (window.innerWidth - gameConfig.canvasWidth) / 2 - sceneOffset;
      translateY = (window.innerHeight - canvasHeight) / 2;
    }

    // Aplicar transformações
    ctx.translate(translateX, translateY);
    if (window.innerWidth < 768) {
      ctx.scale(scaleRatio, scaleRatio);
    }

    // Draw scene
    drawPlatforms(ctx);
    drawHero(ctx);
    drawSticks(ctx);
    
    // Verificar pontuação e mostrar elementos especiais
    if (score >= 10 && showCastle) {
      drawCastle(ctx);
    }
    
    drawDragon(ctx);
    
    ctx.restore();
  } catch (e) {
    console.error("Erro ao desenhar:", e);
  }
}

// Função para desenhar o castelo ao fundo
export function drawCastle(ctx) {
  if (!castleImage.complete) return;
  
  const castleWidth = 150;
  const castleHeight = 200;
  const castleX = window.innerWidth - castleWidth;
  const castleY = canvasHeight - gameConfig.platformHeight - castleHeight + 50;
  
  ctx.save();
  ctx.globalAlpha = 0.8; // Um pouco transparente para dar sensação de distância
  ctx.drawImage(castleImage, castleX, castleY, castleWidth, castleHeight);
  ctx.globalAlpha = 1.0;
  ctx.restore();
} 
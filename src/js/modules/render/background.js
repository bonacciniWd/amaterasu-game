// Módulo para renderização do background
import { gameConfig, sceneOffset, stars, trees, clouds } from '../config.js';
import { getHillY, getTreeY } from '../entities.js';

// Imagens
let castleImage = new Image();
castleImage.src = '/src/images/castle.png';
let cloudImage = new Image();
cloudImage.src = '/src/images/cloud.png';

// Função para desenhar estrelas
export function drawStars(ctx) {
  ctx.fillStyle = "white"; // Cor da estrela
  stars.forEach(star => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); // Desenha a estrela
    ctx.fill();
  });
}

// Função para desenhar o background completo
export function drawBackground(ctx) {
  // Desenhar céu de inverno
  var gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, "#1a1a4b"); // Azul escuro no topo
  gradient.addColorStop(0.5, "#3a5573"); // Azul médio no meio
  gradient.addColorStop(1, "#b3cce6"); // Azul claro na parte inferior
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  // Desenhar estrelas
  drawStars(ctx); // Chama a função para desenhar estrelas

  // Desenhar castelo atrás da paisagem
  drawCastleBackground(ctx);
  
  // Desenhar colinas (brancas como neve)
  drawHill(ctx, gameConfig.hill1BaseHeight, gameConfig.hill1Amplitude, gameConfig.hill1Stretch, "#ffffff");
  drawHill(ctx, gameConfig.hill2BaseHeight, gameConfig.hill2Amplitude, gameConfig.hill2Stretch, "#f0f0f0");

  // Desenhar árvores
  trees.forEach((tree) => drawTree(ctx, tree.x, tree.color));

  // Desenhar nuvens
  drawClouds(ctx);
}

// Função para desenhar o castelo como background fixo
export function drawCastleBackground(ctx) {
  if (!castleImage.complete) return;
  
  const castleWidth = 200;
  const castleHeight = 250;
  const castleX = window.innerWidth - castleWidth - 50;
  const castleY = window.innerHeight - castleHeight - 50;
  
  ctx.save();
  ctx.globalAlpha = 0.8; // Um pouco transparente para dar sensação de distância
  
  // Garantir que o castelo seja desenhado mesmo se a transformação da cena estiver ativa
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  
  ctx.drawImage(castleImage, castleX, castleY, castleWidth, castleHeight);
  ctx.globalAlpha = 1.0;
  ctx.restore();
}

// Função para desenhar uma árvore
export function drawTree(ctx, x, color) {
  ctx.save();
  ctx.translate(
    (-sceneOffset * gameConfig.backgroundSpeedMultiplier + x) * gameConfig.hill1Stretch,
    getTreeY(x, gameConfig.hill1BaseHeight, gameConfig.hill1Amplitude)
  );

  const treeTrunkHeight = 5;
  const treeTrunkWidth = 2;
  const treeCrownHeight = 25;
  const treeCrownWidth = 10;

  // Draw trunk
  ctx.fillStyle = "#7D833C";
  ctx.fillRect(
    -treeTrunkWidth / 2,
    -treeTrunkHeight,
    treeTrunkWidth,
    treeTrunkHeight
  );

  // Draw crown
  ctx.beginPath();
  ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight);
  ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
  ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);
  ctx.fillStyle = color;
  ctx.fill();
  
  // Adicionar neve no topo da árvore (cobrindo uma área maior)
  ctx.beginPath();
  ctx.moveTo(-treeCrownWidth / 2, -(treeTrunkHeight + treeCrownHeight * 0.6)); // Ampliando a área de cobertura
  ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
  ctx.lineTo(treeCrownWidth / 2, -(treeTrunkHeight + treeCrownHeight * 0.6)); // Ampliando a área de cobertura
  ctx.fillStyle = "#ffffff"; // Branco para neve
  ctx.fill();
  
  // Adicionar um pouco de neve nas laterais
  ctx.beginPath();
  ctx.moveTo(-treeCrownWidth / 2, -(treeTrunkHeight + treeCrownHeight * 0.4));
  ctx.lineTo(-treeCrownWidth / 2 * 0.7, -(treeTrunkHeight + treeCrownHeight * 0.5));
  ctx.lineTo(-treeCrownWidth / 2 * 0.5, -(treeTrunkHeight + treeCrownHeight * 0.3));
  ctx.fillStyle = "#ffffff"; // Branco para neve
  ctx.fill();
  
  // Neve do outro lado
  ctx.beginPath();
  ctx.moveTo(treeCrownWidth / 2, -(treeTrunkHeight + treeCrownHeight * 0.4));
  ctx.lineTo(treeCrownWidth / 2 * 0.7, -(treeTrunkHeight + treeCrownHeight * 0.5));
  ctx.lineTo(treeCrownWidth / 2 * 0.5, -(treeTrunkHeight + treeCrownHeight * 0.3));
  ctx.fillStyle = "#ffffff"; // Branco para neve
  ctx.fill();

  ctx.restore();
}

// Modificar a função drawClouds para mostrar nuvens congeladas
export function drawClouds(ctx) {
  clouds.forEach((cloud) => {
    ctx.save();
    const cloudHeight = (cloud.width / cloudImage.width) * cloudImage.height; // Calcular a altura proporcional
    
    // Aplicar efeito de congelamento se necessário
    if (cloud.frozen) {
      // Desenhar a nuvem com tom azulado
      ctx.globalAlpha = 0.9;
      ctx.drawImage(cloudImage, cloud.x - cloud.width / 2, cloud.y - cloudHeight / 2, cloud.width, cloudHeight); // Desenhar a imagem da nuvem
      
      // Aplicar uma camada de cor azul mais intenso
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = 0.6; // Aumentado de 0.5 para 0.6
      ctx.fillStyle = "#87CEFA"; // Azul céu claro (mais azulado)
      ctx.fillRect(cloud.x - cloud.width / 2, cloud.y - cloudHeight / 2, cloud.width, cloudHeight);
      
      // Adicionar um brilho sutil nas bordas com border radius
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.5; // Aumentado de 0.3 para 0.5
      ctx.strokeStyle = "#ADD8FF";
      ctx.lineWidth = 2.5; // Aumentado de 2 para 2.5
      
      // Usar roundRect para criar bordas arredondadas
      ctx.beginPath();
      const borderRadius = 10;
      ctx.roundRect(
        cloud.x - cloud.width / 2, 
        cloud.y - cloudHeight / 2, 
        cloud.width, 
        cloudHeight, 
        borderRadius
      );
      ctx.stroke();
      
      // Adicionar texto indicativo de congelado
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = "#1E90FF"; // Azul mais vibrante
      ctx.font = "bold 8px Arial";
      ctx.textAlign = "center";
      ctx.fillText("CONGELADA!", cloud.x, cloud.y - cloudHeight/2 - 8);
      
      // Desenhar sparkles ao redor da nuvem congelada
      if (cloud.snowflakes) {
        drawSnowflakes(ctx, cloud.x, cloud.y, cloud.snowflakes);
      }
    } else {
      ctx.drawImage(cloudImage, cloud.x - cloud.width / 2, cloud.y - cloudHeight / 2, cloud.width, cloudHeight); // Desenhar a imagem da nuvem normal
    }
    
    ctx.restore();
  });
}

// Função para desenhar flocos de neve
export function drawSnowflakes(ctx, centerX, centerY, snowflakes) {
  ctx.save();
  
  // Aumentar o raio do brilho
  const glowRadius = 35; // Aumentado para 35
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
  gradient.addColorStop(0, 'rgba(135, 206, 250, 0.5)');
  gradient.addColorStop(0.5, 'rgba(135, 206, 250, 0.3)');
  gradient.addColorStop(1, 'rgba(70, 130, 180, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Adicionar cristais de gelo maiores
  ctx.strokeStyle = "#ADD8FF";
  ctx.lineWidth = 2; // Linha ainda mais grossa
  const crystalSize = 15; // Aumentado para 15
  
  // Criar 6 linhas em formato de estrela
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * crystalSize,
      centerY + Math.sin(angle) * crystalSize
    );
    ctx.stroke();
    
    // Adicionar pequenas linhas nas pontas
    const branchLength = crystalSize * 0.5; // Aumentado proporcionalmente
    const branchAngle1 = angle + Math.PI / 6;
    const branchAngle2 = angle - Math.PI / 6;
    
    const tipX = centerX + Math.cos(angle) * crystalSize;
    const tipY = centerY + Math.sin(angle) * crystalSize;
    
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX + Math.cos(branchAngle1) * branchLength,
      tipY + Math.sin(branchAngle1) * branchLength
    );
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX + Math.cos(branchAngle2) * branchLength,
      tipY + Math.sin(branchAngle2) * branchLength
    );
    ctx.stroke();
  }
  
  // Desenhar cada floco
  snowflakes.forEach(flake => {
    const time = Date.now() * flake.blinkSpeed;
    const blinkOpacity = Math.abs(Math.sin(time + flake.blinkPhase));
    
    const x = centerX + flake.x;
    const y = centerY + flake.y;
    
    const sparkleTime = Date.now() * flake.sparkleSpeed;
    const sparkleSize = flake.sparkleSize * (0.7 + 0.3 * Math.sin(sparkleTime));
    
    ctx.globalAlpha = flake.opacity * blinkOpacity * 0.8;
    ctx.strokeStyle = flake.color;
    ctx.lineWidth = 1; // Linha mais grossa para os sparkles
    
    // Desenhar raios de sparkle
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i + sparkleTime;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + Math.cos(angle) * sparkleSize,
        y + Math.sin(angle) * sparkleSize
      );
      ctx.stroke();
    }
    
    ctx.globalAlpha = flake.opacity * blinkOpacity;
    ctx.fillStyle = flake.color;
    
    ctx.beginPath();
    ctx.arc(x, y, flake.size * (0.5 + 0.5 * Math.sin(sparkleTime * 2)), 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.restore();
}

// A hill is a shape under a stretched out sinus wave
export function drawHill(ctx, baseHeight, amplitude, stretch, color) {
  ctx.beginPath();
  ctx.moveTo(0, window.innerHeight);
  ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));
  for (let i = 0; i < window.innerWidth; i++) {
    ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch));
  }
  ctx.lineTo(window.innerWidth, window.innerHeight);
  ctx.fillStyle = color;
  ctx.fill();
} 
// Módulo para renderização do herói
import { gameConfig, heroX, heroY, canvasHeight, legAnimationPhase, phase } from '../config.js';
import { drawSnowflakes } from './background.js';

// Função auxiliar para desenhar retângulos arredondados
export function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x, y + radius);
  ctx.lineTo(x, y + height - radius);
  ctx.arcTo(x, y + height, x + radius, y + height, radius);
  ctx.lineTo(x + width - radius, y + height);
  ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
  ctx.lineTo(x + width, y + radius);
  ctx.arcTo(x + width, y, x + width - radius, y, radius);
  ctx.lineTo(x + radius, y);
  ctx.arcTo(x, y, x, y + radius, radius);
  ctx.fill();
}

// Função para desenhar o efeito de imunidade (atrás do herói)
function drawImmunityEffect(ctx, heroPositionX, heroPositionY) {
  ctx.save();
  
  const heroWidth = gameConfig.heroWidth;
  const heroHeight = gameConfig.heroHeight;
  // Ajuste na posição para centralizar melhor (corrigindo o deslocamento para baixo e direita)
  const heroScreenX = heroPositionX + heroWidth / 2 - 10; // -10px para ajustar horizontalmente (era -5px)
  const heroScreenY = heroPositionY + heroHeight / 2 - 15; // -15px para ajustar verticalmente (era -10px)
  
  // Pulsação baseada no tempo restante de imunidade - garantir que não seja negativo
  const immunityProgress = Math.max(0, 1 - ((Date.now() - window.heroLastUnfrozenTime) / window.heroImmunityTime));
  
  // Se o progresso de imunidade for 0, a imunidade acabou, então não desenhe nada
  if (immunityProgress <= 0) {
    ctx.restore();
    window.heroIsImmune = false;
    return;
  }
  
  // Guardar o progresso para usar em drawHero
  window.currentImmunityProgress = immunityProgress;
  
  // Garantir que o tamanho do pulso seja sempre positivo
  const pulseSize = Math.max(0.5, 3 + Math.sin(Date.now() * 0.01) * 2);
  
  // Aumentar o raio do escudo e melhorar o aspecto
  const shieldRadius = gameConfig.heroWidth * 2.4; // Aumentado de 2 para 2.4
  
  // Criar um escudo com múltiplas camadas para efeito mais bonito
  
  // Camada externa mais esmaecida
  const outerGradient = ctx.createRadialGradient(
    heroScreenX, heroScreenY, shieldRadius * 0.4,
    heroScreenX, heroScreenY, shieldRadius * 1.1
  );
  
  outerGradient.addColorStop(0, "rgba(100, 255, 255, 0.01)");
  outerGradient.addColorStop(0.5, "rgba(64, 224, 208, 0.03)");
  outerGradient.addColorStop(1, "rgba(72, 209, 204, 0)");
  
  ctx.fillStyle = outerGradient;
  ctx.beginPath();
  ctx.arc(heroScreenX, heroScreenY, shieldRadius * 1.1, 0, Math.PI * 2);
  ctx.fill();
  
  // Camada principal mais visível
  const mainGradient = ctx.createRadialGradient(
    heroScreenX, heroScreenY, shieldRadius * 0.2,
    heroScreenX, heroScreenY, shieldRadius
  );
  
  mainGradient.addColorStop(0, "rgba(64, 224, 208, 0.07)");
  mainGradient.addColorStop(0.6, "rgba(0, 206, 209, 0.12)");
  mainGradient.addColorStop(1, "rgba(72, 209, 204, 0.02)");
  
  ctx.fillStyle = mainGradient;
  ctx.beginPath();
  ctx.arc(heroScreenX, heroScreenY, shieldRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Adicionar uma borda fina brilhante
  ctx.strokeStyle = "rgba(127, 255, 212, " + (0.2 * immunityProgress) + ")";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(heroScreenX, heroScreenY, shieldRadius * 0.95, 0, Math.PI * 2);
  ctx.stroke();
  
  // Círculos pulsantes na borda do escudo - agora com mais detalhes
  for (let i = 0; i < 6; i++) { // Aumentado de 5 para 6 círculos
    const angle = (Date.now() * 0.002) + (i * Math.PI * 2 / 6);
    const x = heroScreenX + Math.cos(angle) * shieldRadius * 0.9;
    const y = heroScreenY + Math.sin(angle) * shieldRadius * 0.9;
    
    // Efeito de brilho atrás do círculo pulsante
    const glowSize = pulseSize * immunityProgress * 1.8;
    ctx.beginPath();
    ctx.arc(x, y, glowSize, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(64, 224, 208, " + (0.15 * immunityProgress) + ")";
    ctx.fill();
    
    // Círculo pulsante principal
    ctx.beginPath();
    ctx.arc(x, y, pulseSize * immunityProgress, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 255, 255, " + (0.5 * immunityProgress) + ")"; // Mais brilhante
    ctx.fill();
    
    // Pequeno ponto branco no centro para efeito de brilho
    ctx.beginPath();
    ctx.arc(x, y, pulseSize * immunityProgress * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, " + (0.7 * immunityProgress) + ")";
    ctx.fill();
  }
  
  ctx.restore();
}

// Função para desenhar o herói
export function drawHero(ctx) {
  ctx.save();
  
  // Posição básica
  let bodyOffsetY = 0;
  
  // Adicionar um leve salto vertical ao corpo durante a caminhada
  if (phase === "walking" || phase === "transitioning") {
    bodyOffsetY = Math.abs(Math.sin(legAnimationPhase * 2)) * 1.5;
  }
  
  const heroWidth = gameConfig.heroWidth;
  const heroHeight = gameConfig.heroHeight;
  const heroPositionX = heroX - heroWidth / 2;
  const heroPositionY = heroY + canvasHeight - gameConfig.platformHeight - heroHeight / 2 - bodyOffsetY;

  // Verificar se o herói está com imunidade e desenhar o efeito SE NÃO estiver congelado
  if (window.heroIsImmune && !window.heroFrozen) {
    drawImmunityEffect(ctx, heroPositionX, heroPositionY);
  }

  // Desenhar sparkles de gelo ao redor do herói quando congelado
  if (window.heroFrozen && window.heroSnowflakes) {
    ctx.save();
    // Usar exatamente a mesma posição do corpo do herói, com offset ajustado
    drawSnowflakes(
      ctx,
      heroPositionX + heroWidth / 2 - 10, // 10px para esquerda
      heroPositionY + heroHeight / 2 - 11, // 11px para cima (8 + 3)
      window.heroSnowflakes
    );
    ctx.restore();
  }

  ctx.fillStyle = window.heroFrozen ? "#ADD8E6" : "black"; // Cor azul gelo quando congelado
  ctx.translate(
    heroPositionX,
    heroPositionY
  );

  // Variáveis para controlar o balanço da espada durante a caminhada
  let swordTilt = 0;
  if (phase === "walking" || phase === "transitioning") {
    // Se o herói estiver congelado, reduzir a velocidade
    if (window.heroFrozen) {
      swordTilt = Math.sin(legAnimationPhase * 0.2) * 1; // 20% da velocidade normal
    } else {
      swordTilt = Math.sin(legAnimationPhase) * 1; // Leve movimento de balanço normal
    }
  }

  // Desenhar a espada nas costas (atrás do corpo) com movimento
  ctx.save();
  ctx.translate(-heroWidth / 2 - 2.5, -heroHeight / 6);
  ctx.rotate(swordTilt * Math.PI / 180); // Converter graus para radianos
  
  // Bainha da espada
  ctx.fillStyle = window.heroFrozen ? "#B0E0E6" : "silver"; // Mudar cor quando congelado
  ctx.fillRect(-2, -heroHeight / 4, 3, heroHeight - 8);
  
  // Cabo da espada
  ctx.fillStyle = window.heroFrozen ? "#B0C4DE" : "#A0522D"; // Mudar cor quando congelado
  ctx.fillRect(-2, -heroHeight / 3, 3, 7);
  
  ctx.restore();

  // Body
  if (window.heroFrozen) {
    // Efeito congelado com silhueta azulada
    ctx.fillStyle = "#ADD8E6"; // Azul claro para efeito de gelo
    drawRoundedRect(
      ctx,
      -heroWidth / 2,
      -heroHeight / 2,
      heroWidth,
      heroHeight - 4,
      5
    );
    
    // Adicionar um leve brilho na borda mais visível
    ctx.strokeStyle = "#F0F8FF"; // Branco azulado
    ctx.lineWidth = 1.5; // Aumentado de 0.7 para 1.5
    ctx.beginPath();
    ctx.roundRect(
      -heroWidth / 2,
      -heroHeight / 2,
      heroWidth,
      heroHeight - 4,
      5
    );
    ctx.stroke();
    
    // Adicionar cristais de gelo no corpo do herói
    const icePositions = [
      { x: -heroWidth/3, y: -heroHeight/3 },
      { x: heroWidth/3, y: -heroHeight/4 },
      { x: 0, y: heroHeight/4 }
    ];
    
    ctx.strokeStyle = "#E0FFFF"; // Branco azulado brilhante
    ctx.lineWidth = 0.8;
    
    icePositions.forEach(pos => {
      // Desenhar um mini cristal em cada posição
      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI / 2) * i + (Date.now() * 0.001);
        const iceSize = 4;
        
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(
          pos.x + Math.cos(angle) * iceSize,
          pos.y + Math.sin(angle) * iceSize
        );
        ctx.stroke();
      }
    });
  } else {
    // Normal
    ctx.fillStyle = "black";
    drawRoundedRect(
      ctx,
      -heroWidth / 2,
      -heroHeight / 2,
      heroWidth,
      heroHeight - 4,
      5
    );
  }

  // Legs com animação
  const legDistance = 7; // Distância entre as pernas
  ctx.fillStyle = window.heroFrozen ? "#ADD8E6" : "black";
  
  // Calcular a posição vertical e horizontal das pernas com base na fase de animação
  const walkingAnimation = (phase === "walking" || phase === "transitioning");
  
  // Ajustar velocidade se estiver congelado
  let animationSpeed = window.heroFrozen ? 0.2 : 1; // 20% da velocidade normal se congelado
  
  // Vertical movement (up and down)
  const leftLegOffsetY = walkingAnimation ? Math.sin(legAnimationPhase * animationSpeed) * 3 : 0;
  const rightLegOffsetY = walkingAnimation ? Math.sin(legAnimationPhase * animationSpeed + Math.PI) * 3 : 0;
  
  // Horizontal movement (forward and backward)
  const leftLegOffsetX = walkingAnimation ? Math.cos(legAnimationPhase * animationSpeed) * 2 : 0;
  const rightLegOffsetX = walkingAnimation ? Math.cos(legAnimationPhase * animationSpeed + Math.PI) * 2 : 0;
  
  // Perna esquerda com efeito de movimento
  if (walkingAnimation && Math.abs(leftLegOffsetY) > 1) {
    // Adicionar rastro de movimento para a perna em movimento
    ctx.beginPath();
    ctx.fillStyle = window.heroFrozen ? "rgba(173, 216, 230, 0.3)" : "rgba(0, 0, 0, 0.3)"; // Versão semi-transparente para o rastro
    ctx.arc(
      -legDistance + leftLegOffsetX * 0.7, 
      heroHeight / 2 - 4 + leftLegOffsetY * 0.7, 
      3, 
      0, 
      Math.PI * 2, 
      false
    );
    ctx.fill();
  }
  
  // Desenhar a perna principal
  ctx.beginPath();
  ctx.fillStyle = window.heroFrozen ? "#ADD8E6" : "black";
  ctx.arc(
    -legDistance + leftLegOffsetX, 
    heroHeight / 2 - 4 + leftLegOffsetY, 
    4, 
    0, 
    Math.PI * 2, 
    false
  );
  ctx.fill();
  
  // Perna direita com efeito de movimento
  if (walkingAnimation && Math.abs(rightLegOffsetY) > 1) {
    // Adicionar rastro de movimento para a perna em movimento
    ctx.beginPath();
    ctx.fillStyle = window.heroFrozen ? "rgba(173, 216, 230, 0.3)" : "rgba(0, 0, 0, 0.3)"; // Versão semi-transparente para o rastro
    ctx.arc(
      legDistance + rightLegOffsetX * 0.7, 
      heroHeight / 2 - 4 + rightLegOffsetY * 0.7, 
      3, 
      0, 
      Math.PI * 2, 
      false
    );
    ctx.fill();
  }
  
  // Desenhar a perna principal
  ctx.beginPath();
  ctx.fillStyle = window.heroFrozen ? "#ADD8E6" : "black";
  ctx.arc(
    legDistance + rightLegOffsetX, 
    heroHeight / 2 - 4 + rightLegOffsetY, 
    4, 
    0, 
    Math.PI * 2, 
    false
  );
  ctx.fill();

  // Eye - Corrigir a posição considerando o novo tamanho
  ctx.beginPath();
  ctx.fillStyle = window.heroFrozen ? "#E0FFFF" : "white"; // Olho mais azulado quando congelado
  ctx.arc(heroWidth / 4, -heroHeight / 5, 4, 0, Math.PI * 2, false);
  ctx.fill();

  // Band
  ctx.fillStyle = window.heroFrozen ? "#E0FFFF" : "red"; // Cor mais clara quando congelado
  ctx.fillRect(-heroWidth / 2 - 1, -12, heroWidth + 2, 4.5);
  ctx.beginPath();
  ctx.moveTo(-9, -14.5);
  ctx.lineTo(-17, -18.5);
  ctx.lineTo(-14, -8.5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-10, -10.5);
  ctx.lineTo(-15, -3.5);
  ctx.lineTo(-5, -7);
  ctx.fill();
  
  // Adicionar texto indicativo de "Congelado" acima do herói quando estiver congelado
  if (window.heroFrozen) {
    ctx.fillStyle = "#1E90FF"; // Azul mais vibrante
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.fillText("CONGELADO!", 0, -heroHeight/2 - 15);
  }

  ctx.restore();
  
  // Adicionar texto "PROTEGIDO" por cima do personagem quando estiver imune
  if (window.heroIsImmune && !window.heroFrozen && window.currentImmunityProgress > 0) {
    // Salvar o contexto para não afetar outras renderizações
    ctx.save();
    
    // Posicionar o texto acima do herói
    const textX = heroPositionX + heroWidth / 2; // Centralizado
    const textY = heroPositionY - 60; // Mantendo a mesma altura
    
    // Desenhar o texto com um contorno mais visível
    ctx.strokeStyle = "rgba(0, 0, 0, 1.0)"; // Contorno preto totalmente opaco
    ctx.lineWidth = 3; // Contorno mais grosso para maior destaque
    ctx.font = "bold 14px Arial"; // Aumentado de 12px para 14px
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Desenhar primeiro o contorno e depois o texto para melhor contraste
    ctx.strokeText("PROTEGIDO", textX, textY);
    
    // Desenhar o texto com brilho extra
    ctx.fillStyle = "rgba(0, 255, 255, 1.0)"; // Cyan totalmente opaco
    ctx.fillText("PROTEGIDO", textX, textY);
    
    // Adicionar um efeito de glow ao redor do texto
    ctx.shadowColor = "rgba(0, 255, 255, 0.8)";
    ctx.shadowBlur = 5;
    ctx.fillText("PROTEGIDO", textX, textY);
    ctx.shadowBlur = 0; // Resetar o shadow blur
    
    ctx.restore();
  }
} 
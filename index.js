// Jogo Amaterasu - Implementação principal
import { soundsEnabled, playBackgroundMusic, pauseBackgroundMusic, playPerfectSound, playFallSound, playIceSound } from './src/js/modules/audio.js';
import { setupInputEvents } from './src/js/modules/input.js';
import { resetGame } from './src/js/modules/ui.js';

// Variáveis do jogo
let canvas;
let ctx;
let canvasHeight;
let phase = "waiting"; // waiting | stretching | turning | walking | transitioning | falling
let lastTimestamp;
let heroX;
let heroY;
let sticks = []; // Array de bastões
let platforms = [];
let score = 0;
let perfectScore = 0;
let legAnimationPhase = 0;
let legAnimationSpeed = 0.1;
let treasureClicked = false; // Flag para controlar se o tesouro já foi clicado
let treasureAnimation = null; // Referência para a animação do tesouro

// Elementos da UI
const restartButton = document.getElementById("restart");

// Constantes do jogo
const platformHeight = 100;
const heroDistanceFromEdge = 40; // Distância entre o herói e a borda da plataforma
const paddingX = 100; // Distância para o lado esquerdo
const perfectAreaSize = 10; // Tamanho do "perfect area"
const stretchingSpeed = 4; // Velocidade para esticar o bastão (pixels por frame)
const turningSpeed = 4; // Velocidade para girar o bastão (graus por frame)
const walkingSpeed = 4; // Velocidade para caminhar (pixels por frame)
const transitioningSpeed = 2; // Velocidade da câmera (pixels por frame)
const fallingSpeed = 2; // Velocidade para cair (pixels por frame)

// Configurar eventos de entrada do usuário
setupInputEvents();

// Inicializar jogo
window.addEventListener("load", function() {
  canvas = document.getElementById("game");
  ctx = canvas.getContext("2d");
  resetGame();
  
  // Tocar música de fundo
  if (soundsEnabled) {
    playBackgroundMusic();
  }
  
  // Esconder botão de reinício inicialmente
  if (restartButton) {
    restartButton.style.display = "none";
  }
  
  // Iniciar o loop do jogo
  window.requestAnimationFrame(animate);
});

// Função para resetar o jogo (chamada quando o jogo é carregado pela primeira vez ou reiniciado)
function resetGame() {
  // Restaurar valores padrão
  phase = "waiting";
  lastTimestamp = undefined;
  score = 0;
  perfectScore = 0;
  sticks = [];
  platforms = [];
  treasureClicked = false;
  
  // Reiniciar as dimensões do canvas
  canvasHeight = document.documentElement.clientHeight * 0.6;
  if (canvasHeight > 400) canvasHeight = 400;
  canvas.height = canvasHeight;
  canvas.width = window.innerWidth;
  
  // Plataforma inicial
  platforms.push({
    x: paddingX,
    w: 100
  });
  
  // Adicionar uma segunda plataforma com largura aleatória
  generatePlatform();
  generatePlatform();
  
  // Posição inicial do herói
  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
  heroY = 0;
  
  draw();
}

// Gerar uma nova plataforma
function generatePlatform() {
  const minGap = 40; // Distância mínima entre plataformas
  const maxGap = 200; // Distância máxima entre plataformas
  const minWidth = 60; // Largura mínima da plataforma
  const maxWidth = 150; // Largura máxima da plataforma
  
  // Última plataforma gerada
  const lastPlatform = platforms[platforms.length - 1];
  
  // Gerar valores aleatórios para o gap e largura
  let gap = minGap + Math.random() * (maxGap - minGap);
  let width = minWidth + Math.random() * (maxWidth - minWidth);
  
  // Criar nova plataforma
  platforms.push({
    x: lastPlatform.x + lastPlatform.w + gap,
    w: width
  });
  
  // 20% de chance de gerar um tesouro na plataforma se o jogador tem mais de 15 pontos
  if (score >= 15 && Math.random() < 0.2) {
    platforms[platforms.length - 1].hasTreasure = true;
  }
}

// Loop principal de animação
function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
    return;
  }
  
  switch (phase) {
    case "waiting":
      draw();
      break;
    case "stretching": {
      sticks.push({
        x: heroX,
        length: 0,
        rotation: 0
      });
      
      draw();
      
      const stick = sticks[sticks.length - 1];
      stick.length += (timestamp - lastTimestamp) / stretchingSpeed;
      
      break;
    }
    case "turning": {
      const stick = sticks[sticks.length - 1];
      stick.rotation += (timestamp - lastTimestamp) / turningSpeed;
      
      if (stick.rotation >= 90) {
        stick.rotation = 90;
        
        const perfectXStart = platforms[1].x - perfectAreaSize / 2;
        const perfectXEnd = platforms[1].x + perfectAreaSize / 2;
        
        const stickEnd = heroX + stick.length;
        
        if (stickEnd >= perfectXStart && stickEnd <= perfectXEnd) {
          playPerfectSound();
          console.log("Perfect landing!");
          perfectScore++;
          
          // Atualizar contador de perfects
          const perfectCounter = document.getElementById("perfect-value");
          if (perfectCounter) {
            perfectCounter.textContent = perfectScore;
          }
        }
        
        // Verificar se o bastão é longo o suficiente para alcançar a próxima plataforma
        if (stickEnd >= platforms[1].x && stickEnd <= platforms[1].x + platforms[1].w) {
          phase = "walking";
        } else {
          phase = "falling";
        }
      }
      
      draw();
      
      break;
    }
    case "walking": {
      // Atualizar fase da animação das pernas
      legAnimationPhase += legAnimationSpeed;
      
      // Mover o herói
      heroX += (timestamp - lastTimestamp) / walkingSpeed;
      
      // Verificar se o herói chegou no bastão
      if (heroX >= sticks[sticks.length - 1].x + sticks[sticks.length - 1].length) {
        // Adicionar pontuação
        score++;
        
        // Atualizar placar
        const scoreElement = document.getElementById("score-value");
        if (scoreElement) {
          scoreElement.textContent = score;
        }
        
        // Iniciar transição para a próxima plataforma
        phase = "transitioning";
      }
      
      draw();
      
      break;
    }
    case "transitioning": {
      // Atualizar fase da animação das pernas
      legAnimationPhase += legAnimationSpeed;
      
      // Mover tudo para a esquerda
      const deltaX = (timestamp - lastTimestamp) / transitioningSpeed;
      platforms.forEach(platform => {
        platform.x -= deltaX;
      });
      
      sticks.forEach(stick => {
        stick.x -= deltaX;
      });
      
      heroX -= deltaX;
      
      // Verificar se o herói chegou ao meio da tela
      if (platforms[1].x + platforms[1].w <= window.innerWidth - paddingX) {
        // Remover plataforma e bastão antigos
        platforms.shift();
        sticks.shift();
        
        // Adicionar nova plataforma
        generatePlatform();
        
        // Restaurar fase para esperar
        phase = "waiting";
      }
      
      draw();
      
      break;
    }
    case "falling": {
      // Resetar a fase de animação das pernas quando estiver caindo
      legAnimationPhase = 0;
      
      if (sticks.last().rotation < 180)
        sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;
      
      heroY += (timestamp - lastTimestamp) / fallingSpeed;
      const maxHeroY = platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
      
      if (heroY > maxHeroY) {
        // Pausar música primeiro, reproduzir som depois
        pauseBackgroundMusic();
        setTimeout(() => playFallSound(), 200);
        
        // Mostrar botão de reinício
        restartButton.style.display = "block";
        document.body.classList.remove("game-active"); // Desativar captura de toques quando o jogo termina
        
        // Esconder o botão de início quando o jogo termina
        const mobileButton = document.getElementById("mobileStartButton");
        if (mobileButton) {
          mobileButton.style.display = "none";
        }
        
        // Garantir que o botão de som ainda está visível e funcionando
        const soundButton = document.getElementById("soundToggle");
        if (soundButton) {
          soundButton.style.zIndex = "3000"; // Aumentar o z-index acima do botão de reinício
        }
        
        return;
      }
      
      draw();
      
      break;
    }
    default:
      throw Error("Fase inválida: " + phase);
  }
  
  window.requestAnimationFrame(animate);
  lastTimestamp = timestamp;
}

// Função para desenhar o jogo
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Desenhar fundo
  drawBackground();
  
  // Transformar o canvas para facilitar o desenho
  ctx.save();
  ctx.translate(0, window.innerHeight - canvasHeight);
  
  // Desenhar as plataformas
  drawPlatforms();
  
  // Desenhar os bastões
  drawSticks();
  
  // Desenhar o herói
  drawHero();
  
  // Restaurar o canvas
  ctx.restore();
}

// Função para desenhar o fundo
function drawBackground() {
  // Cor de fundo gradiente
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#111122");
  gradient.addColorStop(1, "#002244");
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Opcional: adicionar estrelas, nuvens, ou outros elementos decorativos
}

// Função para desenhar as plataformas
function drawPlatforms() {
  platforms.forEach((platform, index) => {
    // Desenhar plataforma
    ctx.fillStyle = "#c2d6e0"; // Cor gelo azulado
    ctx.fillRect(platform.x, 0, platform.w, platformHeight);
    
    // Desenhar sombra/borda
    ctx.fillStyle = "#b0c4d0"; // Versão mais escura para sombra
    ctx.fillRect(platform.x, platformHeight - 5, platform.w, 5);
    
    // Desenhar decoração na plataforma
    ctx.fillStyle = "#d5e5f0"; // Cor mais clara para destaques
    ctx.fillRect(platform.x + 10, 10, platform.w - 20, 5);
    
    // Desenhar tesouro se essa plataforma tiver um tesouro
    if (platform.hasTreasure && !treasureClicked) {
      const treasureSize = 30;
      const treasureX = platform.x + platform.w / 2 - treasureSize / 2;
      const treasureY = -treasureSize;
      
      // Salvar a posição do tesouro para colisão
      window.treasurePosition = {
        x: treasureX, 
        y: window.innerHeight - canvasHeight + treasureY, 
        width: treasureSize, 
        height: treasureSize
      };
      
      // Desenhar tesouro
      ctx.fillStyle = "gold";
      ctx.strokeStyle = "darkgoldenrod";
      ctx.lineWidth = 2;
      
      // Efeito de brilho
      ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
      ctx.shadowBlur = 10;
      
      // Baú do tesouro estilizado
      ctx.beginPath();
      ctx.moveTo(treasureX, treasureY + treasureSize * 0.7);
      ctx.lineTo(treasureX, treasureY + treasureSize * 0.3);
      ctx.quadraticCurveTo(treasureX, treasureY, treasureX + treasureSize / 2, treasureY);
      ctx.quadraticCurveTo(treasureX + treasureSize, treasureY, treasureX + treasureSize, treasureY + treasureSize * 0.3);
      ctx.lineTo(treasureX + treasureSize, treasureY + treasureSize * 0.7);
      ctx.lineTo(treasureX, treasureY + treasureSize * 0.7);
      ctx.fill();
      ctx.stroke();
      
      // Tampa do baú
      ctx.beginPath();
      ctx.moveTo(treasureX, treasureY + treasureSize * 0.3);
      ctx.lineTo(treasureX + treasureSize, treasureY + treasureSize * 0.3);
      ctx.lineTo(treasureX + treasureSize, treasureY + treasureSize * 0.7);
      ctx.lineTo(treasureX, treasureY + treasureSize * 0.7);
      ctx.lineTo(treasureX, treasureY + treasureSize * 0.3);
      ctx.fill();
      ctx.stroke();
      
      // Desativar sombra para o resto do desenho
      ctx.shadowBlur = 0;
    } else if (platform.hasTreasure && treasureClicked) {
      // Limpar a posição do tesouro se já foi clicado
      window.treasurePosition = null;
    }
  });
}

// Função para desenhar os bastões
function drawSticks() {
  sticks.forEach(stick => {
    ctx.save();
    
    // Mover para o ponto de rotação
    ctx.translate(stick.x, platformHeight);
    
    // Rotacionar
    ctx.rotate((Math.PI / 180) * stick.rotation);
    
    // Desenhar o bastão
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stick.length);
    
    // Gradiente para o bastão para dar aparência de bamboo
    const stickGradient = ctx.createLinearGradient(0, 0, 0, -stick.length);
    stickGradient.addColorStop(0, "#886622"); // Cor mais escura na base
    stickGradient.addColorStop(0.5, "#A87822"); // Cor do meio
    stickGradient.addColorStop(1, "#786020"); // Cor mais clara na ponta
    
    ctx.strokeStyle = stickGradient;
    ctx.stroke();
    
    ctx.restore();
  });
}

// Função para desenhar o herói
function drawHero() {
  ctx.save();
  
  // Posição do herói
  const heroHeight = 25; // Altura do herói
  
  // Desenhar sombra
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.beginPath();
  ctx.ellipse(heroX, platformHeight + 2, 12, 4, 0, 0, 2 * Math.PI);
  ctx.fill();
  
  // Transformar para a posição do herói
  ctx.translate(heroX, platformHeight - heroHeight / 2);
  
  // Corpo principal (cabeça)
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(0, 0, heroHeight / 2, 0, 2 * Math.PI);
  ctx.fill();
  
  // Olhos
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.ellipse(-4, -2, 3, 4, Math.PI / 8, 0, 2 * Math.PI);
  ctx.fill();
  
  ctx.beginPath();
  ctx.ellipse(4, -2, 3, 4, -Math.PI / 8, 0, 2 * Math.PI);
  ctx.fill();
  
  // Pupilas
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(-4, -2, 1.5, 0, 2 * Math.PI);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(4, -2, 1.5, 0, 2 * Math.PI);
  ctx.fill();
  
  // Calcular a posição vertical e horizontal das pernas com base na fase de animação
  const walkingAnimation = (phase === "walking" || phase === "transitioning");
  
  // Valores para a animação das pernas
  const legDistance = 5; // Distância entre as pernas
  
  // Movimentos verticais e horizontais das pernas
  const leftLegOffsetY = walkingAnimation ? Math.sin(legAnimationPhase) * 3 : 0;
  const rightLegOffsetY = walkingAnimation ? Math.sin(legAnimationPhase + Math.PI) * 3 : 0;
  const leftLegOffsetX = walkingAnimation ? Math.cos(legAnimationPhase) * 2 : 0;
  const rightLegOffsetX = walkingAnimation ? Math.cos(legAnimationPhase + Math.PI) * 2 : 0;
  
  // Perna esquerda com efeito de movimento
  if (walkingAnimation && Math.abs(leftLegOffsetY) > 1) {
    // Adicionar rastro de movimento para a perna em movimento
    ctx.beginPath();
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
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
  
  // Desenhar a perna principal esquerda
  ctx.beginPath();
  ctx.fillStyle = "black";
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
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
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
  
  // Desenhar a perna principal direita
  ctx.beginPath();
  ctx.fillStyle = "black";
  ctx.arc(
    legDistance + rightLegOffsetX, 
    heroHeight / 2 - 4 + rightLegOffsetY, 
    4, 
    0, 
    Math.PI * 2, 
    false
  );
  ctx.fill();
  
  ctx.restore();
}

// Método auxiliar para acessar o último elemento do array
Array.prototype.last = function() {
  return this[this.length - 1];
};

// Adicionar evento de clique para interagir com o botão de diálogo e o tesouro
window.addEventListener("click", function(event) {
  // Converter coordenadas do clique para coordenadas do canvas
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Verificar se clicou no tesouro
  if (window.treasurePosition &&
      score >= 15 && 
      x >= window.treasurePosition.x && 
      x <= window.treasurePosition.x + window.treasurePosition.width &&
      y >= window.treasurePosition.y && 
      y <= window.treasurePosition.y + window.treasurePosition.height) {
    
    console.log("Tesouro clicado!");
    
    if (!treasureClicked) {
      treasureClicked = true;
      
      // Pausar o jogo temporariamente
      const currentPhase = phase;
      phase = "waiting";
      
      // Usar nossa nova função de animação Lottie para o tesouro
      if (typeof window.showTreasureAnimation === 'function') {
        window.showTreasureAnimation(() => {
          // Callback quando o modal for fechado
          // Retomar o jogo após a animação
          phase = currentPhase;
        });
      } else {
        // Fallback se a função não estiver disponível
        alert("Parabéns! Você encontrou o tesouro!");
        
        // Retomar o jogo após a mensagem
        phase = currentPhase;
      }
    }
  }
}); 
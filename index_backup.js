/*



If you want to know how this game was made, check out this video, that explains how it's made: 

https://youtu.be/eue3UdFvwPo

Follow me on twitter for more: https://twitter.com/HunorBorbely

*/

// Extend the base functionality of JavaScript
Array.prototype.last = function () {
  return this[this.length - 1];
};

// A sinus function that acceps degrees instead of radians
Math.sinus = function (degree) {
  return Math.sin((degree / 180) * Math.PI);
};

// Game data
let phase = "waiting"; // waiting | stretching | turning | walking | transitioning | falling
let lastTimestamp; // The timestamp of the previous requestAnimationFrame cycle

let heroX; // Changes when moving forward
let heroY; // Only changes when falling
let sceneOffset; // Moves the whole game

let platforms = [];
let sticks = [];
let trees = [];
let clouds = []; // Array para armazenar as nuvens
let stars = []; // Array para armazenar as estrelas

// Variável para rastrear a última plataforma processada
let lastProcessedPlatformIndex = -1;

// Todo: Save high score to localStorage (?)

let score = 0;

// Configuration
let canvasWidth = window.innerWidth < 768 ? window.innerWidth - 50 : 375;
let canvasHeight = window.innerWidth < 768 ? window.innerHeight - 150 : 375;
const platformHeight = 100;
let heroDistanceFromEdge = window.innerWidth < 768 ? 5 : 10; // While waiting
let paddingX = window.innerWidth < 768 ? 50 : 100; // The waiting position of the hero in from the original canvas size
const perfectAreaSize = 10;

// The background moves slower than the hero
const backgroundSpeedMultiplier = 0.2;

const hill1BaseHeight = 100;
const hill1Amplitude = 10;
const hill1Stretch = 1;
const hill2BaseHeight = 70;
const hill2Amplitude = 20;
const hill2Stretch = 0.5;

const stretchingSpeed = 4; // Milliseconds it takes to draw a pixel
const turningSpeed = 4; // Milliseconds it takes to turn a degree
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 2;

// Aumentar o tamanho do herói
const heroWidth = 24; // Antes: 17
const heroHeight = 40; // Antes: 30

// Variáveis para animação das pernas
let legAnimationPhase = 0; // Fase da animação das pernas
let legAnimationSpeed = 0.1; // Velocidade da animação (reduzida para movimentos mais naturais)

// Novas variáveis para funcionalidades adicionais
let dragonImage = new Image();
dragonImage.src = '/images/drag.png';
let hirojukiImage = new Image();
hirojukiImage.src = '/images/hirojuki.png';
let spearImage = new Image();
spearImage.src = '/images/spear.png';
let castleImage = new Image();
castleImage.src = '/images/castle.png'; // Presumindo que você tenha essa imagem

// Variáveis para animações e efeitos
let showBoss = false; // Controla quando mostrar o diálogo do boss
let dialoguePhase = 0; // Controla qual diálogo mostrar
let dragonY = 50; // Posição Y inicial do dragão
let dragonDirection = 1; // Direção da animação de flutuação
let dialogueTimer = null; // Para armazenar a animação do tesouro

// Variáveis para os raios de gelo
let iceRays = []; // Array para armazenar os raios de gelo (agora terá no máximo 1 raio)
let lastIceRayTime = 0; // Para controlar quando o último raio foi lançado
let iceRayInterval = 7000; // Intervalo entre os raios (7 segundos - era 5 segundos)

// Adicionar variáveis para controlar o estado congelado do herói
let heroFrozen = false;
let heroFrozenTime = 0;
let heroFrozenDuration = 3000; // 3 segundos congelado

// Adicionar variável para contar perfects
let perfectCounter = 0;

// Adicionar variáveis para controlar o efeito de digitação no nível global
let bossDialogueStartTime = 0;
let heroDialogueStartTime = 0;
let bossDialogueText = "";
let heroResponseShown = false;

const canvas = document.getElementById("game");
canvas.width = window.innerWidth; // Make the Canvas full screen
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

const introductionElement = document.getElementById("introduction");
const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");

let cloudImage = new Image(); // Criar uma nova imagem
cloudImage.src = '/images/cloud.png'; // Definir o caminho da imagem
cloudImage.onload = function() {
  console.log("Imagem da nuvem carregada com sucesso!");
  draw(); // Redesenhar o jogo após a imagem ser carregada
};
cloudImage.onerror = function() {
  console.error("Erro ao carregar a imagem da nuvem.");
};

// Variáveis globais para os sons
let backgroundMusic;
let perfectSound;
let fallSound;
let soundsEnabled = true; // Flag para controlar se os sons estão ativos
let soundsLoaded = false; // Flag para verificar se os sons foram carregados

// Detecta se é um dispositivo móvel
function isMobileDevice() {
  return (window.innerWidth < 768) || 
         /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Configura a interface para dispositivo móvel
function setupMobileInterface() {
  const mobileButton = document.getElementById("mobileStartButton");
  const introText = document.getElementById("introduction");
  
  if (isMobileDevice()) {
    // Ajustar texto de instrução para mobile
    introText.innerText = "Toque na tela para iniciar e esticar o bastão";
    introText.style.padding = "15px 20px";
    introText.style.fontSize = "1em";
    
    // Esconder botão de início para mobile, pois vamos usar toques diretos na tela
    mobileButton.style.display = "none";
  } else {
    // Desktop
    introText.innerText = "Clique e segure para esticar o bastão";
    mobileButton.style.display = "none";
  }
}

// Função adicionada para prevenir seleção de texto durante o jogo
function preventTextSelection() {
  const elements = [
    document.getElementById("score"),
    document.getElementById("introduction"),
    document.getElementById("perfect"),
    document.getElementById("creditos")
  ];
  
  elements.forEach(element => {
    if (element) {
      element.style.webkitUserSelect = "none";
      element.style.userSelect = "none";
      element.setAttribute("unselectable", "on");
    }
  });
}

// Initialize layout
recalculateConstants(); // Garantir que as constantes estejam corretas no início
setupMobileInterface(); // Configurar interface para mobile se necessário
preventTextSelection(); // Prevenir seleção de texto
perfectCounter = 0; // Garantir que o contador de perfects comece zerado
resetGame();

// Função para carregar sons
function loadSounds() {
  if (soundsLoaded) return; // Evitar carregar várias vezes
  
  console.log("Carregando sons...");
  backgroundMusic = document.getElementById("backgroundMusic");
  perfectSound = document.getElementById("perfectSound");
  fallSound = document.getElementById("fallSound");
  
  if (!backgroundMusic || !perfectSound || !fallSound) {
    console.log("Alguns elementos de áudio não foram encontrados. Tentando novamente em breve...");
    // Tentar novamente depois
    setTimeout(loadSounds, 1000);
    return;
  }
  
  // Configurar volume
  backgroundMusic.volume = 0.3;
  perfectSound.volume = 0.5;
  fallSound.volume = 0.6;
  
  // Configurar para preload
  backgroundMusic.preload = "auto";
  perfectSound.preload = "auto";
  fallSound.preload = "auto";
  
  // Impedir erro de reprodução automática
  backgroundMusic.muted = true;
  perfectSound.muted = true;
  fallSound.muted = true;
  
  // Tentar carregar áudio
  try {
    backgroundMusic.load();
    perfectSound.load();
    fallSound.load();
  } catch (e) {
    console.log("Erro ao carregar áudio:", e.message);
  }
  
  soundsLoaded = true;
  console.log("Sons carregados com sucesso!");
  
  // Adicionar evento de interação para ativar áudio
  setupAudioContext();
}

// Função para inicializar contexto de áudio
function setupAudioContext() {
  // Criar função para desmutar após interação
  const unmuteSounds = function() {
    if (backgroundMusic) backgroundMusic.muted = false;
    if (perfectSound) perfectSound.muted = false;
    if (fallSound) fallSound.muted = false;
    
    playBackgroundMusic();
    
    // Remover eventos após primeira interação
    document.removeEventListener('click', unmuteSounds);
    document.removeEventListener('touchstart', unmuteSounds);
    document.removeEventListener('keydown', unmuteSounds);
    
    console.log("Áudio ativado após interação do usuário");
  };
  
  // Adicionar eventos para interação do usuário
  document.addEventListener('click', unmuteSounds);
  document.addEventListener('touchstart', unmuteSounds);
  document.addEventListener('keydown', unmuteSounds);
}

// Função para tocar música de fundo
function playBackgroundMusic() {
  if (!soundsLoaded) {
    loadSounds();
  }
  
  if (soundsEnabled && backgroundMusic) {
    // Verificar se já está tocando para evitar erros
    if (backgroundMusic.paused) {
      console.log("Tentando reproduzir música de fundo...");
      backgroundMusic.play().then(() => {
        console.log("Música de fundo reproduzida com sucesso!");
      }).catch(error => {
        console.log("Não foi possível reproduzir música de fundo:", error.message);
        // Não mostrar erro, apenas registrar
      });
    }
  }
}

// Função para pausar música de fundo
function pauseBackgroundMusic() {
  if (backgroundMusic && !backgroundMusic.paused) {
    try {
      backgroundMusic.pause();
      console.log("Música de fundo pausada");
    } catch (error) {
      console.log("Erro ao pausar música:", error.message);
    }
  }
}

// Função para tocar som de perfect
function playPerfectSound() {
  if (!soundsLoaded) {
    loadSounds();
  }
  
  if (soundsEnabled && perfectSound) {
    perfectSound.currentTime = 0; // Reinicia o som para permitir reprodução repetida
    console.log("Tentando reproduzir som de perfect...");
    perfectSound.play().then(() => {
      console.log("Som de perfect reproduzido com sucesso!");
    }).catch(error => {
      console.error("Erro ao reproduzir som de perfect:", error);
    });
  }
}

// Função para tocar som de queda
function playFallSound() {
  if (!soundsLoaded) {
    loadSounds();
  }
  
  if (soundsEnabled && fallSound) {
    // Primeiro pausar a música de fundo para evitar conflitos
    pauseBackgroundMusic();
    
    // Pequeno atraso para garantir que a música parou
    setTimeout(() => {
      fallSound.currentTime = 0;
      console.log("Tentando reproduzir som de queda...");
      fallSound.play().then(() => {
        console.log("Som de queda reproduzido com sucesso!");
      }).catch(error => {
        console.log("Não foi possível reproduzir som de queda:", error.message);
      });
    }, 100);
  }
}

// Resets game variables and layouts but does not start the game (game starts on keypress)
function resetGame() {
  // Reset game progress
  phase = "waiting";
  lastTimestamp = undefined;
  sceneOffset = 0;
  score = 0;
  perfectCounter = 0; // Reiniciar contador de perfects
  lastProcessedPlatformIndex = -1; // Resetar o rastreamento de plataformas

  // Reiniciar variáveis das novas funcionalidades
  showBoss = false;
  dialoguePhase = 0;
  dragonY = 50;
  dragonDirection = 1;
  
  // Esconder elementos de diálogo
  const bossDialogueContainer = document.getElementById('bossDialogueContainer');
  
  if (bossDialogueContainer) bossDialogueContainer.style.display = 'none';

  // Remover classe de jogo ativo
  document.body.classList.remove("game-active");

  // Garantir que os elementos de interface estejam visíveis
  introductionElement.style.opacity = 0.8;
  perfectElement.style.opacity = 0;
  restartButton.style.display = "none";
  
  // Atualizar a pontuação
  updateScoreDisplay();

  // Limpar nuvens antes de gerar novas
  clouds = []; // Limpa o array de nuvens

  // Gerar estrelas
  generateStars(); // Gera as estrelas uma vez

  // The first platform is always the same
  platforms = [{ x: 50, w: 50 }];
  generatePlatform();
  generatePlatform();
  generatePlatform();
  generatePlatform();

  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

  trees = [];
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();

  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
  heroY = 0;

  // Chame a função para gerar algumas nuvens no início do jogo
  for (let i = 0; i < 3; i++) {
    generateCloud();
  }

  // Garantir que o jogo seja renderizado
  resizeCanvas();
  draw();
  
  // Verificar se precisamos configurar para mobile
  setupMobileInterface();

  // Garantir que os sons estejam carregados
  if (!soundsLoaded) {
    loadSounds();
  } else if (soundsEnabled) {
    // Tentar tocar a música de fundo com um pequeno atraso
    setTimeout(playBackgroundMusic, 300);
  }
}

function generateTree() {
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

  trees.push({ x, color });
}

function generatePlatform() {
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

  platforms.push({ x, w });
}

// Prevenir o menu de contexto ao pressionar a tela
window.addEventListener("contextmenu", function (event) {
  event.preventDefault(); // Prevenir o menu de contexto
});

// Prevenir seleção de texto ao tocar na tela
window.addEventListener("selectstart", function(event) {
  event.preventDefault();
});

// Garantir que os eventos de toque funcionem corretamente
window.addEventListener("touchstart", function (event) {
  // Ignorar eventos do botão de som
  if (event.target.id === 'soundToggle' || event.target.closest('#soundToggle')) {
    return;
  }
  
  // Prevenir comportamento padrão exceto para botões
  if (event.target.tagName !== "BUTTON") {
    event.preventDefault();
  }
  
  if (phase == "waiting") {
    lastTimestamp = undefined;
    introductionElement.style.opacity = 0;
    phase = "stretching";
    document.body.classList.add("game-active"); // Ativar captura de toques
    window.requestAnimationFrame(animate);
  }
});

// Garantir que o evento de soltar o stick funcione
window.addEventListener("touchend", function (event) {
  if (phase == "stretching") {
    phase = "turning"; // Mudar para a fase de turning
  }
});

// Adicionar evento de clique ao botão
document.getElementById("mobileStartButton").addEventListener("click", function (event) {
  event.preventDefault(); // Prevenir comportamento padrão
  if (phase == "waiting") {
    lastTimestamp = undefined;
    introductionElement.style.opacity = 0;
    phase = "stretching";
    window.requestAnimationFrame(animate);
  }
});

// Adicionar eventos para desktop
window.addEventListener("mousedown", function (event) {
  // Ignorar eventos do botão de som
  if (event.target.id === 'soundToggle' || event.target.closest('#soundToggle')) {
    return;
  }
  
  if (phase == "waiting") {
    lastTimestamp = undefined;
    introductionElement.style.opacity = 0;
    phase = "stretching";
    window.requestAnimationFrame(animate);
  }
});

window.addEventListener("mouseup", function (event) {
  if (phase == "stretching") {
    phase = "turning"; // Mudar para a fase de turning
  }
});

window.addEventListener("resize", function (event) {
  resizeCanvas();
  
  // Recalcular constantes ao redimensionar
  recalculateConstants();
  
  // Atualizar interface para mobile se necessário
  setupMobileInterface();
  
  draw();
});

window.requestAnimationFrame(animate);

// The main game loop
function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
    return;
  }

  switch (phase) {
    case "waiting":
      // Resetar a fase de animação das pernas quando estiver parado
      legAnimationPhase = 0;
      // Manter as animações de fundo (dragão, nuvens, etc.) mesmo na fase de espera
      draw();
      window.requestAnimationFrame(animate);
      return; // Não processar o restante do código
    case "stretching": {
      // Resetar a fase de animação das pernas quando estiver esticando
      legAnimationPhase = 0;
      sticks.last().length += (timestamp - lastTimestamp) / stretchingSpeed;
      break;
    }
    case "turning": {
      // Resetar a fase de animação das pernas quando estiver girando
      legAnimationPhase = 0;
      sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

      if (sticks.last().rotation > 90) {
        sticks.last().rotation = 90;

        // Encontrar a próxima plataforma
        const platformIndex = platforms.findIndex(
          (platform) => platform.x < sticks.last().x + sticks.last().length && 
                      sticks.last().x + sticks.last().length < platform.x + platform.w
        );
        
        // Verificar se essa plataforma já foi processada ou não
        if (platformIndex > -1 && platformIndex !== lastProcessedPlatformIndex) {
          lastProcessedPlatformIndex = platformIndex; // Marcar como processada
          
          const platform = platforms[platformIndex];
          const stickFarX = sticks.last().x + sticks.last().length;
          
          // Verificar se é um acerto perfeito
          const isPerfect = (
            platform.x + platform.w / 2 - perfectAreaSize / 2 < stickFarX &&
            stickFarX < platform.x + platform.w / 2 + perfectAreaSize / 2
          );
          
          // Incrementar pontuação
          const oldScore = score;
          score += isPerfect ? 2 : 1;
          
          if (isPerfect) {
            perfectCounter++; // Incrementar contador de perfects
            console.log(`Perfect hit! perfectCounter: ${perfectCounter}, score: ${oldScore} -> ${score}`);
            playPerfectSound();
            
            // Exibir a animação de perfect no centro da tela com a imagem amaterasu.png
            const perfectImage = new Image();
            perfectImage.src = '/images/amaterasu.png';
            perfectImage.onload = function() {
              // Configurar a animação da imagem no centro da tela
              const animDuration = 800; // 800ms para a animação completa
              const startTime = Date.now();
              
              function animateFrame() {
                const elapsed = Date.now() - startTime;
                if (elapsed >= animDuration) return; // Terminar a animação após a duração
                
                const progress = elapsed / animDuration;
                
                // Salvar contexto e resetar transformações
                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                
                // Calcular tamanho para efeito de pulsação
                const baseSize = 120;
                const size = baseSize * (1 + Math.sin(progress * Math.PI) * 0.3);
                
                // Calcular opacidade para fade in/out
                let opacity = 1;
                if (progress < 0.2) opacity = progress / 0.2; // Fade in
                if (progress > 0.8) opacity = (1 - progress) / 0.2; // Fade out
                
                // Posição central
                const x = window.innerWidth / 2 - size / 2;
                const y = window.innerHeight / 2 - size / 2;
                
                // Desenhar com opacidade
                ctx.globalAlpha = opacity;
                ctx.drawImage(perfectImage, x, y, size, size);
                
                ctx.restore();
                
                // Continuar animação
                requestAnimationFrame(animateFrame);
              }
              
              // Iniciar animação
              requestAnimationFrame(animateFrame);
            };
          } else {
            console.log(`Hit normal! score: ${oldScore} -> ${score}`);
          }
          
          updateScoreDisplay();

          generatePlatform();
          generateTree();
          generateTree();
        }

        phase = "walking";
      }
      break;
    }
    case "walking": {
      // Animar as pernas durante o caminhar
      legAnimationPhase += legAnimationSpeed * (heroFrozen ? 1 : 3); // Velocidade reduzida quando congelado
      if (legAnimationPhase > Math.PI * 2) {
        legAnimationPhase = 0;
      }
      
      // Desacelerar movimento quando congelado
      const speedFactor = heroFrozen ? 3 : 1; // Três vezes mais lento quando congelado
      heroX += ((timestamp - lastTimestamp) / walkingSpeed) / speedFactor;

      // Verificar se o herói alcançou outra plataforma
      const nextPlatformIndex = platforms.findIndex(
        (platform) => platform.x < sticks.last().x + sticks.last().length && 
                      sticks.last().x + sticks.last().length < platform.x + platform.w
      );
      
      if (nextPlatformIndex !== -1) {
        // If hero will reach another platform then limit it's position at it's edge
        const nextPlatform = platforms[nextPlatformIndex];
        const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "transitioning";
        }
      } else {
        // If hero won't reach another platform then limit it's position at the end of the pole
        const maxHeroX = sticks.last().x + sticks.last().length + heroWidth;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "falling";
        }
      }
      break;
    }
    case "transitioning": {
      // Animar as pernas durante a transição também
      legAnimationPhase += legAnimationSpeed;
      if (legAnimationPhase > Math.PI * 2) {
        legAnimationPhase = 0;
      }
      
      sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;

      // Encontrar a próxima plataforma
      const nextPlatformIndex = platforms.findIndex(
        (platform) => platform.x < sticks.last().x + sticks.last().length && 
                      sticks.last().x + sticks.last().length < platform.x + platform.w
      );
      
      if (nextPlatformIndex !== -1 && sceneOffset > platforms[nextPlatformIndex].x + platforms[nextPlatformIndex].w - paddingX) {
        // Add the next step
        sticks.push({
          x: platforms[nextPlatformIndex].x + platforms[nextPlatformIndex].w,
          length: 0,
          rotation: 0
        });
        
        // Verificar pontuação para eventos especiais
        if (score === 20 && !showBoss) {
          console.log("Ativando diálogo do Hirojuki no nível 10");
          showBoss = true;
          dialoguePhase = 0;
          bossDialogueStartTime = 0;
        }
        
        phase = "waiting";
      }
      break;
    }
    case "falling": {
      // Resetar a fase de animação das pernas quando estiver caindo
      legAnimationPhase = 0;
      
      if (sticks.last().rotation < 180)
        sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

      heroY += (timestamp - lastTimestamp) / fallingSpeed;
      const maxHeroY =
        platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
      if (heroY > maxHeroY) {
        // Pausar música primeiro, reproduzir som depois
        pauseBackgroundMusic();
        setTimeout(() => playFallSound(), 200);
        
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
      break;
    }
    default:
      throw Error("Wrong phase");
  }

  draw();
  window.requestAnimationFrame(animate);

  lastTimestamp = timestamp;
}

function draw() {
  // Verificar se o contexto e canvas existem
  if (!ctx || !canvas) {
    console.error("Contexto ou canvas não disponível");
    return;
  }

  try {
    ctx.save();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    drawBackground();

    // Ajuste para telas menores e mobile
    let scaleRatio = 1;
    let translateX, translateY;
    
    // Verifica se é uma tela pequena (provavelmente mobile)
    if (window.innerWidth < 768) {
      // Calcula uma escala melhor para cada dispositivo
      scaleRatio = Math.min(window.innerWidth / (canvasWidth * 1.1), window.innerHeight / (canvasHeight * 1.2), 1);
      
      // Centraliza melhor o conteúdo na tela
      translateX = (window.innerWidth / 2) - ((canvasWidth * scaleRatio) / 2) - (sceneOffset * scaleRatio);
      translateY = (window.innerHeight / 2) - ((canvasHeight * scaleRatio) / 2);
    } else {
      // Comportamento original para desktop
      translateX = (window.innerWidth - canvasWidth) / 2 - sceneOffset;
      translateY = (window.innerHeight - canvasHeight) / 2;
    }

    // Aplicar transformações
    ctx.translate(translateX, translateY);
    if (window.innerWidth < 768) {
      ctx.scale(scaleRatio, scaleRatio);
    }

    // Draw scene
    drawPlatforms();
    drawHero();
    drawSticks();
    drawIceRays();
    drawDragon();
    
    // Verificar pontuação e mostrar elementos especiais
    if (score >= 10 && showBoss) {
      showBossDialogue();
    }
    
    // Adicione antes do ctx.restore() final:
    drawPerfectCounter();

    // Restore transformation
    ctx.restore();
  } catch (e) {
    console.error("Erro ao desenhar:", e);
    
    // Tentar recuperar o contexto
    if (canvas) {
      ctx = canvas.getContext("2d");
    }
  }
}

// Adicionar evento de clique ao botão de reiniciar
restartButton.addEventListener("click", function (event) {
  event.preventDefault();
  event.stopPropagation(); // Impedir que o evento se propague
  resetGame();
  restartButton.style.display = "none"; // Esconder o botão após reiniciar
});

function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    // Draw platform com cor de gelo
    ctx.fillStyle = "#a5c5e5"; // Azul claro para plataformas de gelo
    ctx.fillRect(
      x,
      canvasHeight - platformHeight,
      w,
      platformHeight + (window.innerHeight - canvasHeight) / 2
    );

    // Draw perfect area
    if (sticks.last().x < x) {
      ctx.fillStyle = "red"; // Manter área perfeita em vermelho
      ctx.fillRect(
        x + w / 2 - perfectAreaSize / 2,
        canvasHeight - platformHeight,
        perfectAreaSize,
        perfectAreaSize
      );
    }
  });
}

function drawHero() {
  ctx.save();
  
  // Posição básica
  let bodyOffsetY = 0;
  
  // Adicionar um leve salto vertical ao corpo durante a caminhada
  if (phase === "walking" || phase === "transitioning") {
    bodyOffsetY = Math.abs(Math.sin(legAnimationPhase * 2)) * 1.5; // Movimento suave para cima e para baixo
  }
  
  // Verificar se o herói está congelado
  if (heroFrozen) {
    // Verificar se o tempo de congelamento acabou
    if (Date.now() - heroFrozenTime > heroFrozenDuration) {
      heroFrozen = false;
    } else {
      // Aplicar efeito visual de congelamento
      ctx.globalAlpha = 0.7;
      ctx.shadowColor = "rgba(150, 220, 255, 0.8)";
      ctx.shadowBlur = 10;
      
      // Desacelerar o movimento do herói quando congelado
      // (isso deve ser aplicado nas funções de movimento também)
    }
  }
  
  ctx.fillStyle = "black";
  ctx.translate(
    heroX - heroWidth / 2,
    heroY + canvasHeight - platformHeight - heroHeight / 2 - bodyOffsetY
  );

  // Variáveis para controlar o balanço da espada durante a caminhada
  let swordTilt = 0;
  if (phase === "walking" || phase === "transitioning") {
    swordTilt = Math.sin(legAnimationPhase) * 1; // Leve movimento de balanço
  }

  // Desenhar a espada nas costas (atrás do corpo) com movimento
  ctx.save();
  ctx.translate(-heroWidth / 2 - 2.5, -heroHeight / 4);
  ctx.rotate(swordTilt * Math.PI / 180); // Converter graus para radianos
  
  // Bainha da espada
  ctx.fillStyle = "silver";
  ctx.fillRect(-2, -heroHeight / 4, 3, heroHeight - 8);
  
  // Cabo da espada
  ctx.fillStyle = "#A0522D"; // Marrom para o cabo
  ctx.fillRect(-2, -heroHeight / 4, 3, 7);
  
  ctx.restore();

  // Body
  ctx.fillStyle = "black";
  drawRoundedRect(
    -heroWidth / 2,
    -heroHeight / 2,
    heroWidth,
    heroHeight - 4,
    5
  );

  // Legs com animação
  const legDistance = 7; // Distância entre as pernas
  ctx.fillStyle = "black";
  
  // Calcular a posição vertical e horizontal das pernas com base na fase de animação
  const walkingAnimation = (phase === "walking" || phase === "transitioning");
  
  // Vertical movement (up and down)
  const leftLegOffsetY = walkingAnimation ? Math.sin(legAnimationPhase) * 3 : 0;
  const rightLegOffsetY = walkingAnimation ? Math.sin(legAnimationPhase + Math.PI) * 3 : 0;
  
  // Horizontal movement (forward and backward)
  const leftLegOffsetX = walkingAnimation ? Math.cos(legAnimationPhase) * 2 : 0;
  const rightLegOffsetX = walkingAnimation ? Math.cos(legAnimationPhase + Math.PI) * 2 : 0;
  
  // Perna esquerda com efeito de movimento
  if (walkingAnimation && Math.abs(leftLegOffsetY) > 1) {
    // Adicionar rastro de movimento para a perna em movimento
  ctx.beginPath();
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; // Versão semi-transparente para o rastro
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
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; // Versão semi-transparente para o rastro
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

  // Eye - Corrigir a posição considerando o novo tamanho
  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.arc(heroWidth / 4, -heroHeight / 5, 4, 0, Math.PI * 2, false);
  ctx.fill();

  // Band
  ctx.fillStyle = "red";
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

  // Se o herói estiver congelado, adicionar cristais de gelo
  if (heroFrozen) {
    ctx.fillStyle = "rgba(200, 230, 255, 0.7)";
    
    // Desenhar alguns cristais de gelo no herói
    for (let i = 0; i < 5; i++) {
      const crystalX = -heroWidth/2 + Math.random() * heroWidth;
      const crystalY = -heroHeight/2 + Math.random() * heroHeight;
      const crystalSize = 2 + Math.random() * 3;
      
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const angle = j * Math.PI / 3;
        const x = crystalX + Math.cos(angle) * crystalSize;
        const y = crystalY + Math.sin(angle) * crystalSize;
        
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawRoundedRect(x, y, width, height, radius) {
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

function drawSticks() {
  sticks.forEach((stick) => {
    ctx.save();

    // Move the anchor point to the start of the stick and rotate
    ctx.translate(stick.x, canvasHeight - platformHeight);
    ctx.rotate((Math.PI / 180) * stick.rotation);

    // Draw stick
    const stickWidth = 4; // Aumentar a largura do stick (antes era 2)
    
    // Criar gradiente para aparência de bambu
    const gradient = ctx.createLinearGradient(0, 0, 0, -stick.length);
    gradient.addColorStop(0, "#7B3F00");     // Marrom escuro na base
    gradient.addColorStop(0.2, "#D2B48C");   // Tan
    gradient.addColorStop(0.4, "#7B3F00");   // Marrom escuro
    gradient.addColorStop(0.6, "#D2B48C");   // Tan
    gradient.addColorStop(0.8, "#7B3F00");   // Marrom escuro
    gradient.addColorStop(1, "#D2B48C");     // Tan no topo
    
    // Desenhar o stick com gradiente
    ctx.fillStyle = gradient;
    ctx.fillRect(-stickWidth / 2, 0, stickWidth, -stick.length);

    ctx.restore();
  });
}

// Função para gerar estrelas
function generateStars() {
  const starCount = 50; // Número de estrelas
  stars = []; // Limpa o array de estrelas
  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * window.innerWidth; // Posição X aleatória
    const y = Math.random() * (window.innerHeight / 2); // Posição Y aleatória na parte superior
    const size = Math.random() * 2 + 1; // Tamanho aleatório da estrela
    stars.push({ x, y, size }); // Armazena a estrela no array
  }
}

// Função para desenhar estrelas
function drawStars() {
  ctx.fillStyle = "white"; // Cor da estrela
  stars.forEach(star => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); // Desenha a estrela
    ctx.fill();
  });
}

function drawBackground() {
  // Desenhar céu de inverno
  var gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, "#1a2c4b"); // Azul escuro no topo
  gradient.addColorStop(0.5, "#4a6a8a"); // Azul mais claro no meio
  gradient.addColorStop(1, "#d8e6f2"); // Branco azulado na parte inferior
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  // Desenhar estrelas
  drawStars();

  // Desenhar castelo no horizonte (antes das colinas)
  if (castleImage.complete) {
    ctx.save();
    // Posição fixa no horizonte à direita
    const castleWidth = 320;
    const castleHeight = 250;
    // Posicionar no lado direito da tela, sem ser afetado pelo sceneOffset
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Resetar transformações para coordenadas absolutas
    const castleX = window.innerWidth - castleWidth - 20;
    const castleY = window.innerHeight - castleHeight - 45; // Subindo mais 5px (era 40)
    ctx.drawImage(castleImage, castleX, castleY, castleWidth, castleHeight);
    ctx.restore();
  }

  // Desenhar colinas nevadas
  drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#e0f0ff"); // Branco azulado para colina 1
  drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#c0e0f0"); // Branco azulado mais escuro para colina 2

  // Desenhar árvores nevadas
  trees.forEach((tree) => drawSnowTree(tree.x, tree.color));

  // Desenhar nuvens
  drawClouds();
}

// A hill is a shape under a stretched out sinus wave
function drawHill(baseHeight, amplitude, stretch, color) {
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

function drawSnowTree(x, color) {
  ctx.save();
  ctx.translate(
    (-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch,
    getTreeY(x, hill1BaseHeight, hill1Amplitude)
  );

  const treeTrunkHeight = 5;
  const treeTrunkWidth = 2;
  const treeCrownHeight = 25;
  const treeCrownWidth = 10;

  // Draw trunk
  ctx.fillStyle = "#7D833C"; // Manter tronco verde
  ctx.fillRect(
    -treeTrunkWidth / 2,
    -treeTrunkHeight,
    treeTrunkWidth,
    treeTrunkHeight
  );

  // Draw crown com verde e neve no topo
  ctx.beginPath();
  ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight);
  ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
  ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);
  ctx.fillStyle = color; // Verde original
  ctx.fill();
  
  // Adicionar neve no topo da árvore
  ctx.beginPath();
  ctx.moveTo(-treeCrownWidth / 2 + 1, -treeTrunkHeight - treeCrownHeight * 0.3);
  ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight) + 1);
  ctx.lineTo(treeCrownWidth / 2 - 1, -treeTrunkHeight - treeCrownHeight * 0.3);
  ctx.fillStyle = "#ffffff"; // Branco para a neve
  ctx.fill();

  ctx.restore();
}

function getHillY(windowX, baseHeight, amplitude, stretch) {
  const sineBaseY = window.innerHeight - baseHeight;
  return (
    Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) *
      amplitude +
    sineBaseY
  );
}

function getTreeY(x, baseHeight, amplitude) {
  const sineBaseY = window.innerHeight - baseHeight;
  return Math.sinus(x) * amplitude + sineBaseY;
}

// Função para gerar nuvens
function generateCloud() {
  const cloudX = Math.random() * window.innerWidth; // Posição X aleatória
  const cloudY = Math.random() * (canvas.height / 2); // Posição Y aleatória no céu
  const cloudWidth = 40 + Math.random() * 20; // Diminuir a largura da nuvem
  const cloudSpeed = 1; // Velocidade fixa para todas as nuvens

  clouds.push({ x: cloudX, y: cloudY, width: cloudWidth, speed: cloudSpeed });
}

// Função para desenhar nuvens
function drawClouds() {
  clouds.forEach((cloud) => {
    ctx.save();
    const cloudHeight = (cloud.width / cloudImage.width) * cloudImage.height;
    
    // Verificar se a nuvem está congelada
    if (cloud.frozen) {
      // Efeito de gelo (tonalidade azul)
      ctx.globalAlpha = 0.9;
      
      // Desenhar a nuvem com filtro azulado
      if (Date.now() - cloud.frozenTime > 5000) {
        // Após 5 segundos, remover o efeito congelado
        cloud.frozen = false;
        cloud.speed = 1; // Restaurar velocidade fixa
      }
    }
    
    ctx.drawImage(cloudImage, cloud.x - cloud.width / 2, cloud.y - cloudHeight / 2, cloud.width, cloudHeight);
    
    // Se a nuvem estiver congelada, adicionar cristais de gelo
    if (cloud.frozen) {
      ctx.fillStyle = "rgba(200, 230, 255, 0.7)";
      
      // Desenhar alguns cristais de gelo na nuvem
      for (let i = 0; i < 5; i++) {
        const crystalX = cloud.x - cloud.width / 2 + Math.random() * cloud.width;
        const crystalY = cloud.y - cloudHeight / 2 + Math.random() * cloudHeight;
        const crystalSize = 2 + Math.random() * 3;
        
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
          const angle = j * Math.PI / 3;
          const x = crystalX + Math.cos(angle) * crystalSize;
          const y = crystalY + Math.sin(angle) * crystalSize;
          
          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.fill();
      }
    }
    
    ctx.restore();

    // Mover nuvens
    cloud.x += cloud.speed;
    if (cloud.x > window.innerWidth) {
      cloud.x = -cloud.width;
      cloud.frozen = false; // Resetar estado congelado quando a nuvem reinicia
    }
  });
}

// Atualizar a exibição da pontuação
function updateScoreDisplay() {
  scoreElement.innerText = "Pontos: " + score; // Adiciona "Score: " antes da pontuação
  scoreElement.style.textAlign = "center"; // Centraliza o texto
  scoreElement.style.fontSize = "2em"; // Define o tamanho da fonte
}

// Função para recalcular constantes com base no tamanho da tela
function recalculateConstants() {
  // Atualizar valores de configuração
  canvasWidth = window.innerWidth < 768 ? window.innerWidth - 50 : 375;
  canvasHeight = window.innerWidth < 768 ? window.innerHeight - 150 : 375;
  heroDistanceFromEdge = window.innerWidth < 768 ? 5 : 10;
  paddingX = window.innerWidth < 768 ? 50 : 100;
}

// Função para garantir que o canvas ocupe todo o espaço disponível
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Garantir que o canvas tenha o tamanho correto no carregamento e evitar que desapareça
window.addEventListener("load", function() {
  resizeCanvas();
  // Pequeno atraso para garantir que todos os elementos foram carregados
  setTimeout(function() {
    draw();
    setupMobileInterface();
  }, 100);
});

// Garantir que a função draw seja chamada após o carregamento da imagem da nuvem
cloudImage.onload = function() {
  draw();
};

// Função para garantir que o jogo esteja sempre visível
function ensureGameVisibility() {
  // Simplificada para evitar erros de CORS
  // Apenas redesenhar o jogo periodicamente
  draw();
}

// Chamar a função periodicamente para garantir que o jogo seja sempre visível
setInterval(ensureGameVisibility, 500);

// Função para inicializar o jogo após a história
function initGameAfterStory() {
  // Verificar se já foi inicializado antes
  if (!window.gameInitialized) {
    recalculateConstants(); // Garantir que as constantes estejam corretas no início
    setupMobileInterface(); // Configurar interface para mobile se necessário
    preventTextSelection(); // Prevenir seleção de texto
    resetGame();
    window.gameInitialized = true;
  }

  // Garantir que o jogo seja desenhado
  resizeCanvas();
  draw();
  
  // Garantir que os sons estejam carregados
  if (!soundsLoaded) {
    loadSounds();
    // Pequena espera para garantir que o áudio possa ser reproduzido após interação
    window.addEventListener('click', function audioSetup() {
      window.removeEventListener('click', audioSetup);
      if (soundsEnabled) {
        setTimeout(playBackgroundMusic, 500);
      }
    }, { once: true });
  }
}

// Verificar se estamos iniciando o jogo direto da tela de história
window.addEventListener('gameStartFromStory', function() {
  initGameAfterStory();
  // Carregar sons quando o jogo iniciar
  loadSounds();
  setTimeout(playBackgroundMusic, 1000); // Tenta tocar a música após um segundo
});

// Verificar se o documento já está totalmente carregado para inicializar
if (document.readyState === 'complete') {
  // Se não estamos mostrando a história, inicializar o jogo diretamente
  if (!document.getElementById('story-screen') || document.getElementById('story-screen').style.display === 'none') {
    initGameAfterStory();
  }
} else {
  // Esperar o carregamento da página
  window.addEventListener('load', function() {
    // Se não estamos mostrando a história, inicializar o jogo diretamente
    if (!document.getElementById('story-screen') || document.getElementById('story-screen').style.display === 'none') {
      setTimeout(function() {
        initGameAfterStory();
      }, 100);
    }
  });
}

// Adicionar botão para controlar o som
function addSoundControl() {
  // Verificar se o botão já existe para evitar duplicatas
  if (document.getElementById('soundToggle')) return;
  
  const soundButton = document.createElement('button');
  soundButton.id = 'soundToggle';
  soundButton.innerHTML = '🔊';
  soundButton.className = 'sound-button';
  
  document.body.appendChild(soundButton);
  
  soundButton.addEventListener('click', function(event) {
    // Impedir que o evento se propague para o jogo
    event.stopPropagation();
    event.preventDefault();
    
    soundsEnabled = !soundsEnabled;
    
    if (soundsEnabled) {
      soundButton.innerHTML = '🔊';
      // Tentar desmutar os elementos de áudio
      if (backgroundMusic) backgroundMusic.muted = false;
      if (perfectSound) perfectSound.muted = false;
      if (fallSound) fallSound.muted = false;
      
      playBackgroundMusic();
      console.log("Sons ativados");
    } else {
      soundButton.innerHTML = '🔇';
      pauseBackgroundMusic();
      
      // Tentar mutar os elementos de áudio
      if (backgroundMusic) backgroundMusic.muted = true;
      if (perfectSound) perfectSound.muted = true;
      if (fallSound) fallSound.muted = true;
      
      console.log("Sons desativados");
    }
  });
}

// Adicionar o botão de som após o carregamento da página
window.addEventListener('load', function() {
  addSoundControl();
  
  // Tentar carregar sons após a página ser carregada
  loadSounds();
  
  // Adiciona evento de interação global para ativar os sons
  const activateSounds = function() {
    if (soundsEnabled) {
      playBackgroundMusic();
    }
    document.removeEventListener('click', activateSounds);
    document.removeEventListener('touchstart', activateSounds);
  };
  
  document.addEventListener('click', activateSounds);
  document.addEventListener('touchstart', activateSounds);
});

// Garantir que os sons sejam carregados
document.addEventListener('DOMContentLoaded', function() {
  loadSounds();
});

// Função para animar o dragão
function drawDragon() {
  if (!dragonImage.complete) return; // Verifica se a imagem foi carregada
  
  // Animar o movimento de flutuação do dragão
  dragonY += 0.3 * dragonDirection;
  if (dragonY > 60) dragonDirection = -1;
  if (dragonY < 40) dragonDirection = 1;
  
  const dragonWidth = 120;  // Aumentado de 100 para 120
  const dragonHeight = 90;  // Aumentado de 75 para 90
  
  // Criar um novo contexto de desenho para o dragão, sem ser afetado pela translação da cena
  ctx.save();
  
  // Resetar transformações para desenhar em coordenadas absolutas
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  
  // Verificar se está prestes a lançar um raio
  const timeUntilNextRay = iceRayInterval - (Date.now() - lastIceRayTime);
  let preparingAttack = timeUntilNextRay < 1000 && timeUntilNextRay > 0;
  
  // Criar efeito de respiração mais intensa antes de atacar
  let scaleValue = 1 + Math.sin(Date.now() * 0.001) * 0.05;
  if (preparingAttack) {
    // Pulsar mais rápido antes de atacar
    scaleValue = 1 + Math.sin(Date.now() * 0.005) * 0.1;
  }
  
  // Posição fixa na tela, independente do deslocamento da cena
  const dragonScreenX = window.innerWidth - dragonWidth - 20;
  const dragonScreenY = 100;  // Movido mais para baixo (era dragonY - 20)
  
  // Armazenar a posição atual do dragão para referência por outras funções
  // Isso permite que os raios sejam criados exatamente desta posição
  window.currentDragonPosition = {
    x: dragonScreenX,
    y: dragonScreenY,
    width: dragonWidth,
    height: dragonHeight,
    scale: scaleValue
  };
  
  ctx.translate(dragonScreenX, dragonScreenY);
  ctx.scale(scaleValue, scaleValue);
  
  // Efeito de brilho azul ao redor do dragão quando está prestes a atacar
  if (preparingAttack) {
    ctx.shadowColor = 'rgba(100, 200, 255, 0.8)';
    ctx.shadowBlur = 15;
  }
  
  // Desenhar o dragão
  ctx.drawImage(
    dragonImage, 
    -dragonWidth/2, 
    -dragonHeight/2, 
    dragonWidth, 
    dragonHeight
  );
  
  ctx.restore();
}

// Função para mostrar o diálogo do chefe
function showBossDialogue() {
  if (!hirojukiImage.complete) return;
  
  // Debug para verificar se a função está sendo chamada
  console.log("Mostrando diálogo do chefe - fase: " + dialoguePhase);
  
  // Inicializar variáveis de tempo se ainda não foram definidas
  if (bossDialogueStartTime === 0) {
    bossDialogueStartTime = Date.now();
    heroResponseShown = false;
    // Limpar qualquer timer existente
    if (dialogueTimer) {
      clearTimeout(dialogueTimer);
    }
  }
  
  // Encontrar a plataforma uma à frente para posicionar o chefe - modificado de duas para uma
  const platformIndex = platforms.findIndex(platform => platform.x < heroX && heroX < platform.x + platform.w);
  if (platformIndex < 0 || platformIndex + 1 >= platforms.length) {
    console.log("Não foi possível encontrar uma plataforma para o boss. platformIndex:", platformIndex);
    return;
  }
  
  const bossPlatform = platforms[platformIndex + 1];
  const bossX = bossPlatform.x + bossPlatform.w / 2;
  const bossY = canvasHeight - platformHeight - 60;
  
  // Debug para verificar a posição
  console.log("Posição do boss:", bossX, bossY);
  
  // Desenhar o chefe
  ctx.save();
  const bossWidth = 90;
  const bossHeight = 120;
  ctx.drawImage(hirojukiImage, bossX - bossWidth/2, bossY - bossHeight, bossWidth, bossHeight);
  
  // Desenhar o balão de diálogo
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  
  const dialogueX = bossX - 100;
  const dialogueY = bossY - bossHeight - 70;
  const dialogueWidth = 200;
  const dialogueHeight = 60;
  
  // Balão de diálogo
  drawRoundedRect(dialogueX, dialogueY, dialogueWidth, dialogueHeight, 10);
  ctx.stroke();
  
  // Texto do diálogo com efeito de digitação
  ctx.fillStyle = "black";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  
  const fullText = dialoguePhase === 0 
    ? "Você acha que tem força suficiente? HAHAHA!" 
    : "Eu destruirei você e todo seu clã, logo você se juntará aos seus líderes em meu covil!";
    
  // Calcular quantos caracteres mostrar com base no tempo desde o início do diálogo
  const timeSinceStart = Date.now() - bossDialogueStartTime;
  const charsToShow = Math.min(Math.floor(timeSinceStart / 30), fullText.length);
  const currentText = fullText.substring(0, charsToShow);
  
  // Quebrar o texto em múltiplas linhas
  const words = currentText.split(' ');
  let line = '';
  let lines = [];
  let y = dialogueY + 20;
  
  for(let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    if (ctx.measureText(testLine).width > dialogueWidth - 20) {
      lines.push(line);
      line = words[i] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  
  // Desenhar as linhas
  for(let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], dialogueX + dialogueWidth/2, y + i * 15);
  }
  
  // Se o diálogo do boss terminou e estamos no diálogo fase 0, mudar para o próximo diálogo
  if (charsToShow >= fullText.length && dialoguePhase === 0) {
    console.log("Avançando para a fase 1 do diálogo");
    dialoguePhase = 1;
    bossDialogueStartTime = Date.now(); // Reiniciar o tempo para o novo diálogo
  }
  
  // Se o diálogo do boss terminou e estamos no diálogo fase 1, mostrar a resposta do herói
  if (charsToShow >= fullText.length && dialoguePhase === 1 && !heroResponseShown) {
    console.log("Mostrando resposta do herói");
    heroResponseShown = true;
    heroDialogueStartTime = Date.now();
    
    // Configura o timer para esconder o Hirojuki após 2 segundos
    dialogueTimer = setTimeout(() => {
      console.log("Timer acionado: ocultando boss");
      showBoss = false;
      bossDialogueStartTime = 0;
      heroDialogueStartTime = 0;
      heroResponseShown = false;
    }, 2000);
  }
  
  // Se a resposta do herói foi ativada, mostrar o balão de diálogo do herói
  if (heroResponseShown) {
    // Balão de diálogo do herói
    const heroDialogueX = heroX - 50;
    const heroDialogueY = canvasHeight - platformHeight - heroHeight - 60;
    const heroDialogueWidth = 120;
    const heroDialogueHeight = 40;
    
    ctx.fillStyle = "white";
    drawRoundedRect(heroDialogueX, heroDialogueY, heroDialogueWidth, heroDialogueHeight, 10);
    ctx.stroke();
    
    // Texto da resposta com efeito de digitação
    const heroFullText = "Eu te mostrarei!";
    const heroTimeSinceStart = Date.now() - heroDialogueStartTime;
    const heroCharsToShow = Math.min(Math.floor(heroTimeSinceStart / 30), heroFullText.length);
    const heroCurrentText = heroFullText.substring(0, heroCharsToShow);
    
    ctx.fillStyle = "black";
    ctx.fillText(heroCurrentText, heroDialogueX + heroDialogueWidth/2, heroDialogueY + 25);
  }
  
  ctx.restore();
}

// Função para desenhar o castelo ao fundo
function drawCastle() {
  if (!castleImage.complete) return;
  
  const castleWidth = 150;
  const castleHeight = 200;
  const castleX = window.innerWidth - castleWidth;
  const castleY = canvasHeight - platformHeight - castleHeight + 50;
  
  ctx.save();
  ctx.globalAlpha = 0.8; // Um pouco transparente para dar sensação de distância
  ctx.drawImage(castleImage, castleX, castleY, castleWidth, castleHeight);
  ctx.globalAlpha = 1.0;
  ctx.restore();
}

// Adicionar evento de clique para interagir com o botão de diálogo
window.addEventListener("click", function(event) {
  // Converter coordenadas do clique para coordenadas do canvas
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
});

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
      
      // Mostrar uma mensagem simples em vez de usar lottie
      alert("Parabéns! Você encontrou o tesouro!");
      
      // Retomar o jogo após a mensagem
      phase = currentPhase;
      
      /* // Código anterior usando lottie que estava causando problemas
      // Mostrar a animação do tesouro
      const treasureAnimContainer = document.getElementById('treasureAnimation');
      const lottieContainer = document.getElementById('lottieContainer');
      
      if (treasureAnimContainer && lottieContainer) {
        treasureAnimContainer.style.display = 'block';
        
        // Carregar a animação usando lottie
        if (typeof lottie !== 'undefined') {
          treasureAnimation = lottie.loadAnimation({
            container: lottieContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: '/images/treasure.json'
          });
        }
        
        // Adicionar evento ao botão de fechar
        const closeButton = document.getElementById('closeTreasure');
        if (closeButton) {
          closeButton.addEventListener('click', function closeTreasureAnim() {
            treasureAnimContainer.style.display = 'none';
            if (treasureAnimation) {
              treasureAnimation.destroy();
              treasureAnimation = null;
            }
            phase = currentPhase; // Retomar o jogo
            closeButton.removeEventListener('click', closeTreasureAnim);
          }, { once: true });
        }
      }
      */
    }
  }
});

// Função para criar um raio de gelo
function createIceRay() {
  // Se já existe um raio, não criar outro
  if (iceRays.length > 0) return;
  
  // Posição fixa no canto direito da tela, ajustada para o dragão
  const rayStartX = window.innerWidth - 30; // Ajustado para a nova posição do dragão
  const rayStartY = 120 + Math.random() * 50; // Altura ajustada para o dragão
  
  // Criar um novo raio
  const ray = {
    x: rayStartX,
    y: rayStartY,
    targetX: Math.random() * (window.innerWidth / 2), // Alvo aleatório na primeira metade da tela
    targetY: Math.random() * (window.innerHeight / 2), // Altura aleatória
    size: 3 + Math.random() * 2,
    alpha: 1.0,
    segments: [],
    color: `rgb(${100 + Math.random() * 50}, ${200 + Math.random() * 55}, 255)`, // Tons de azul
    // Ajustar propriedades do Hirojuki
    hirojuki: {
      visible: true,
      x: rayStartX + 20, // Posição ajustada para a lança maior
      y: rayStartY + 30, // Posição ajustada para a lança maior
      alpha: 1.0, // Totalmente visível no início
      scale: 1.0 // Escala ajustada para o tamanho aumentado
    }
  };
  
  // Criar segmentos de zigzag para o raio
  let currentX = ray.x;
  let currentY = ray.y;
  const targetX = ray.targetX;
  const targetY = ray.targetY;
  const segments = 6 + Math.floor(Math.random() * 4); // Número de segmentos
  
  for (let i = 0; i < segments; i++) {
    const nextX = currentX + (targetX - currentX) * ((i + 1) / segments) + (Math.random() * 30 - 15);
    const nextY = currentY + (targetY - currentY) * ((i + 1) / segments) + (Math.random() * 30 - 15);
    ray.segments.push({x1: currentX, y1: currentY, x2: nextX, y2: nextY});
    currentX = nextX;
    currentY = nextY;
  }
  
  iceRays = [ray]; // Substituir o array por um array com apenas este raio
  lastIceRayTime = Date.now();
}

// Função para desenhar os raios de gelo
function drawIceRays() {
  // Verificar se é hora de criar um novo raio (apenas se não houver nenhum ativo)
  const currentTime = Date.now();
  if (iceRays.length === 0 && currentTime - lastIceRayTime > iceRayInterval && Math.random() < 0.7) {
    createIceRay();
  }
  
  // Verificamos se há algum raio para desenhar
  if (iceRays.length === 0) return;
  
  // Obter o único raio
  const ray = iceRays[0];
  
  // Desenhar PRIMEIRO os segmentos do raio (para que fique atrás do hirojuki)
  ctx.save();
  ctx.strokeStyle = ray.color;
  ctx.lineWidth = ray.size;
  ctx.globalAlpha = ray.alpha;
  
  // Adicionar brilho
  ctx.shadowColor = 'rgba(150, 220, 255, 0.8)';
  ctx.shadowBlur = 10;
  
  // Desenhar os segmentos em zigzag
  for (const segment of ray.segments) {
    ctx.beginPath();
    ctx.moveTo(segment.x1, segment.y1);
    ctx.lineTo(segment.x2, segment.y2);
    ctx.stroke();
  }
  
  ctx.restore();
  
  // DEPOIS desenhar o Hirojuki por cima do raio
  if (ray.hirojuki.visible && spearImage.complete) {
    ctx.save();
    ctx.globalAlpha = ray.hirojuki.alpha;
    
    // Tamanho maior para a lança
    const spearWidth = 180 * ray.hirojuki.scale;
    const spearHeight = 230 * ray.hirojuki.scale;
    
    // Desenhar lança - posicionado para que o raio saia da ponta, movido um pouco para a direita
    ctx.drawImage(
      spearImage,
      ray.hirojuki.x - spearWidth/2 + 30, // Movido para a direita
      ray.hirojuki.y - spearHeight/2 + 20, // Descido mais 10px (era +10)
      spearWidth,
      spearHeight
    );
    
    ctx.restore();
    
    // Diminuir a opacidade do Hirojuki junto com o raio, mas muito mais lentamente
    ray.hirojuki.alpha = Math.min(1.0, ray.alpha * 1.8); // Faz o Hirojuki permanecer visível muito mais tempo (era 1.2)
    
    // Se o raio está quase sumindo, Hirojuki também some
    if (ray.alpha < 0.08) { // Aumentado o limite para que suma apenas quando o raio estiver bem próximo de desaparecer (era 0.15)
      ray.hirojuki.visible = false;
    }
  }
  
  // Verificar colisão com nuvens
  for (const cloud of clouds) {
    const lastSegment = ray.segments[ray.segments.length - 1];
    const rayEndX = lastSegment.x2;
    const rayEndY = lastSegment.y2;
    
    // Distância aproximada entre o final do raio e a nuvem
    const dx = cloud.x - rayEndX;
    const dy = cloud.y - rayEndY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < cloud.width / 2) {
      // Colisão detectada! Adicionar efeito congelado na nuvem
      cloud.frozen = true;
      cloud.frozenTime = Date.now();
      // Não alterar a velocidade da nuvem, manter sempre a mesma velocidade
      
      // Remover o raio
      ray.alpha = 0;
    }
  }
  
  // Verificar colisão com o herói
  const rayEndX = ray.segments[ray.segments.length - 1].x2;
  const rayEndY = ray.segments[ray.segments.length - 1].y2;
  
  // Calcular a posição real do herói na tela
  const heroScreenX = heroX - sceneOffset;
  const heroScreenY = canvasHeight - platformHeight - heroHeight;
  
  // Verificar se o raio atingiu o herói
  if (Math.abs(rayEndX - heroScreenX) < heroWidth && 
      Math.abs(rayEndY - heroScreenY) < heroHeight && 
      !heroFrozen) {
    // Herói atingido! Aplicar efeito congelado
    heroFrozen = true;
    heroFrozenTime = Date.now();
    
    // Remover o raio
    ray.alpha = 0;
  }
  
  // Atualizar o raio (diminuir transparência para fade out)
  ray.alpha -= 0.008; // Fade muito mais lento para dar mais tempo de ver o efeito (era 0.015)
  
  // Remover o raio quando desaparecer
  if (ray.alpha <= 0) {
    iceRays = []; // Esvaziar o array de raios
  }
}

// Adicionar função para desenhar o contador de perfects
function drawPerfectCounter() {
  // Carregar imagem se ainda não foi carregada
  if (!window.amaterasuImage) {
    window.amaterasuImage = new Image();
    window.amaterasuImage.src = '/images/amaterasu.png';
  }
  
  ctx.save();
  
  // Resetar transformações para desenhar em coordenadas absolutas da tela
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  
  // Encontrar a posição dos créditos
  const creditsElement = document.getElementById('creditos');
  let creditsY = window.innerHeight - 30; // Posição padrão
  
  if (creditsElement) {
    const creditsRect = creditsElement.getBoundingClientRect();
    creditsY = creditsRect.top;
  }
  
  // Posicionar logo acima dos créditos
  const counterX = 15;
  const counterY = creditsY - 20; // 20px acima dos créditos
  
  // Desenhar o ícone com tamanho aumentado (40x40 pixels)
  if (window.amaterasuImage.complete) {
    ctx.drawImage(window.amaterasuImage, counterX, counterY - 30, 40, 40);
  }
  
  // Desenhar o texto do contador com tamanho aumentado
  ctx.font = "bold 28px Arial";
  ctx.fillStyle = "red";
  ctx.textAlign = "left";
  ctx.fillText(`${perfectCounter}`, counterX + 50, counterY);
  
  ctx.restore();
}

// Adicionar esta função no código, antes da função drawPerfectCounter
function animatePerfectImage(image) {
  // Variáveis para controlar a animação
  const animationDuration = 800; // 800ms de duração
  const startTime = Date.now();
  let animationFrame;
  
  function drawPerfectAnimation() {
    const elapsed = Date.now() - startTime;
    // Cancelar a animação após a duração definida
    if (elapsed >= animationDuration) {
      cancelAnimationFrame(animationFrame);
      return;
    }
    
    // Calcular o progresso da animação (0 a 1)
    const progress = elapsed / animationDuration;
    
    // Salvar o contexto atual
    ctx.save();
    
    // Resetar transformações para desenhar em coordenadas absolutas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Calcular tamanho da imagem com efeito de pulsação
    const baseSize = 120; // Tamanho base
    const pulseEffect = Math.sin(progress * Math.PI) * 0.3; // Efeito de pulsação
    const size = baseSize * (1 + pulseEffect);
    
    // Calcular a opacidade com fade in/out
    let opacity = 1;
    if (progress < 0.2) opacity = progress / 0.2; // Fade in
    if (progress > 0.8) opacity = (1 - progress) / 0.2; // Fade out
    
    // Posição central na tela
    const centerX = window.innerWidth / 2 - size / 2;
    const centerY = window.innerHeight / 2 - size / 2;
    
    // Aplicar opacidade
    ctx.globalAlpha = opacity;
    
    // Desenhar a imagem
    ctx.drawImage(image, centerX, centerY, size, size);
    
    // Restaurar o contexto
    ctx.restore();
    
    // Continuar a animação
    animationFrame = requestAnimationFrame(drawPerfectAnimation);
  }
  
  // Iniciar a animação
  animationFrame = requestAnimationFrame(drawPerfectAnimation);
}
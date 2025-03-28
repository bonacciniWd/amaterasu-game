// Módulo para a física do jogo
import { 
  gameConfig, phase, lastTimestamp, heroX, heroY, sceneOffset, 
  sticks, platforms, legAnimationPhase, legAnimationSpeed, score,
  setPhase, setHeroX, setHeroY, setSceneOffset, setLastTimestamp, setScore,
  showCastle, updateSticks, canvasHeight,
  setShowCastle,
  setLegAnimationPhase, setLegAnimationSpeed
} from './config.js';
import { thePlatformTheStickHits, generatePlatform, generateTree, updateFrozenEntities, moveClouds } from './entities.js';
import { updateScoreDisplay, resetGame } from './ui.js';
import { playFallSound, pauseBackgroundMusic, playPerfectSound, playBackgroundMusic } from './audio.js';
import { draw, getContext } from './render.js';
import { getPerfectCount } from './perfectCounter.js';
import { saveScore } from './ranking.js';
import { saveGameScore, firebaseAvailable } from '../services/firebase.js';

// Função de animação principal do jogo
export function animate(timestamp) {
  if (!lastTimestamp) {
    setLastTimestamp(timestamp);
    window.requestAnimationFrame(animate);
    return;
  }

  // Calcular a diferença de tempo
  let timeDifference = timestamp - lastTimestamp;
  
  // Ajustar a velocidade se o herói estiver congelado (reduzir para 2/3 da velocidade normal)
  if (window.heroFrozen && (phase === "walking" || phase === "transitioning")) {
    timeDifference *= 0.67; // 2/3 da velocidade normal
  }
  
  // Atualizar entidades congeladas (verifica se o herói ou nuvens devem ser descongelados)
  updateFrozenEntities();
  
  // Mover nuvens
  moveClouds();

  switch (phase) {
    case "waiting":
      // Resetar a fase de animação das pernas quando estiver parado
      setLegAnimationPhase(0);
      return; // Stop the loop
    case "stretching": {
      // Resetar a fase de animação das pernas quando estiver esticando
      setLegAnimationPhase(0);
      // Aumentar o comprimento do stick atual
      const newSticks = [...sticks];
      newSticks[newSticks.length - 1].length += (timestamp - lastTimestamp) / gameConfig.stretchingSpeed;
      updateSticks(newSticks);
      break;
    }
    case "turning": {
      // Resetar a fase de animação das pernas quando estiver girando
      setLegAnimationPhase(0);
      // Girar o stick atual
      const newSticks = [...sticks];
      newSticks[newSticks.length - 1].rotation += (timestamp - lastTimestamp) / gameConfig.turningSpeed;

      if (newSticks[newSticks.length - 1].rotation > 90) {
        newSticks[newSticks.length - 1].rotation = 90;
        updateSticks(newSticks);
        
        const [nextPlatform, perfectHit] = thePlatformTheStickHits();
        if (nextPlatform) {
          if (perfectHit) {
            playPerfectSound();
            setScore(score + 2);
            
            // Incrementar o contador de perfects
            if (typeof incrementPerfectCounter === 'function') {
              incrementPerfectCounter();
            }
            
            // Exibir a animação de perfect
            showPerfectAnimation();
          } else {
            setScore(score + 1);
          }
          updateScoreDisplay();
          generatePlatform();
          generateTree();
          generateTree();
        }
        
        setPhase("walking");
      } else {
        updateSticks(newSticks);
      }
      break;
    }
    case "walking": {
      // Se estiver congelado, reduzir a velocidade de movimento
      const speedMultiplier = window.heroFrozen ? 0.5 : 1; // Reduz para metade da velocidade quando congelado
      
      setHeroX(heroX + ((timestamp - lastTimestamp) / gameConfig.walkingSpeed) * speedMultiplier);
      
      // Animar as pernas durante o caminhar
      // Se estiver congelado, reduzir a velocidade da animação também
      const legSpeedMultiplier = window.heroFrozen ? 0.2 : 1;
      setLegAnimationPhase(legAnimationPhase + legAnimationSpeed * 3 * legSpeedMultiplier);
      if (legAnimationPhase > Math.PI * 2) {
        setLegAnimationPhase(0);
      }
      
      const [nextPlatform] = thePlatformTheStickHits();
      if (nextPlatform) {
        // If hero will reach another platform then limit it's position at it's edge
        const maxHeroX = nextPlatform.x + nextPlatform.w - gameConfig.heroDistanceFromEdge;
        if (heroX > maxHeroX) {
          setHeroX(maxHeroX);
          setPhase("transitioning");
        }
      } else {
        // If hero won't reach another platform then limit it's position at the end of the pole
        const maxHeroX = sticks.last().x + sticks.last().length + gameConfig.heroWidth;
        if (heroX > maxHeroX) {
          setHeroX(maxHeroX);
          setPhase("falling");
        }
      }
      break;
    }
    case "transitioning": {
      // Se estiver congelado, reduzir a velocidade de transição também
      const speedMultiplier = window.heroFrozen ? 0.5 : 1;
      
      setSceneOffset(sceneOffset + ((timestamp - lastTimestamp) / gameConfig.transitioningSpeed) * speedMultiplier);
      
      // Animar as pernas durante a transição também
      // Se estiver congelado, reduzir a velocidade da animação também
      const legSpeedMultiplier = window.heroFrozen ? 0.2 : 1;
      setLegAnimationPhase(legAnimationPhase + legAnimationSpeed * legSpeedMultiplier);
      if (legAnimationPhase > Math.PI * 2) {
        setLegAnimationPhase(0);
      }
      
      const [nextPlatform] = thePlatformTheStickHits();
      if (sceneOffset > nextPlatform.x + nextPlatform.w - gameConfig.paddingX) {
        // Add the next step
        const newSticks = [...sticks, {
          x: nextPlatform.x + nextPlatform.w,
          length: 0,
          rotation: 0
        }];
        updateSticks(newSticks);
        
        checkSpecialEvents();
        
        setPhase("waiting");
      }
      break;
    }
    case "falling": {
      // Resetar a fase de animação das pernas quando estiver caindo
      setLegAnimationPhase(0);
      
      if (sticks.last().rotation < 180) {
        const newSticks = [...sticks];
        newSticks[newSticks.length - 1].rotation += (timestamp - lastTimestamp) / gameConfig.turningSpeed;
        updateSticks(newSticks);
      }

      setHeroY(heroY + (timestamp - lastTimestamp) / gameConfig.fallingSpeed);
      const maxHeroY =
        gameConfig.platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
      if (heroY > maxHeroY) {
        handleGameOver();
        return;
      }
      break;
    }
    default:
      throw Error("Wrong phase");
  }

  draw();
  window.requestAnimationFrame(animate);

  setLastTimestamp(timestamp);
}

// Função para verificar eventos especiais com base na pontuação atual
function checkSpecialEvents() {
  // Verificar pontuação para eventos especiais
  if (score === 49) {
    setShowCastle(true);
  }
}

// Função para lidar com o fim de jogo
async function handleGameOver() {
  try {
    console.log('Tratando fim de jogo, pontuação atual:', score);
    
    // Pausar música primeiro
    pauseBackgroundMusic();
    
    // Reproduzir som de queda sem verificar a classe game-active
    setTimeout(() => playFallSound(), 200);
    
    // Verificar se o jogador tem perfects suficientes
    let perfectCount = 0;
    if (typeof getPerfectCount === 'function') {
      perfectCount = getPerfectCount();
    }
    
    // Salvar a pontuação no localStorage e obter a posição
    const rankPosition = await saveScore(score);
    
    // Não verificar explicitamente firebaseAvailable !== false para evitar confusão
    // A função saveGameScore já verifica isso internamente
    try {
      const success = await saveGameScore(score);
      if (success) {
        console.log('Pontuação salva com sucesso no Firebase');
      } else {
        console.log('Pontuação salva apenas localmente');
      }
    } catch (error) {
      console.error('Erro ao salvar pontuação:', error);
    }
    
    // SEMPRE mostrar a notificação de ranking, independente da posição
    console.log(`Exibindo notificação para score ${score}, posição: ${rankPosition || 'N/A'}`);
    showRankPosition(rankPosition || '-', score, perfectCount);
    
    // Esconder os botões originais, pois agora estão dentro da notificação
    const restartButton = document.getElementById("restart");
    const buyLifeButton = document.getElementById("buy-life");
    
    if (restartButton) restartButton.style.display = "none";
    if (buyLifeButton) buyLifeButton.style.display = "none";
    
    // Remover classe de jogo ativo para desativar captura de toques
    document.body.classList.remove("game-active");
    
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
  } catch (error) {
    console.error("Erro ao lidar com fim de jogo:", error);
    // Mesmo com erro, tentar mostrar os botões básicos para não travar o jogador
    document.getElementById("restart").style.display = "block";
  }
}

// Função para mostrar a animação de perfect
function showPerfectAnimation() {
  const ctx = getContext();
  if (!ctx) return;
  
  // Exibir a animação de perfect no centro da tela com a imagem amaterasu.png
  const perfectImage = new Image();
  perfectImage.src = './src/images/amaterasu.png';
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
      
      // Desenhar efeito de fogo ao redor da imagem
      const numParticles = 12;
      const radius = size * 0.7;
      
      for (let i = 0; i < numParticles; i++) {
        const angle = (i / numParticles) * Math.PI * 2;
        const flameX = x + size/2 + Math.cos(angle) * radius;
        const flameY = y + size/2 + Math.sin(angle) * radius;
        
        // Criar gradiente para a chama
        const flameGradient = ctx.createRadialGradient(
          flameX, flameY, 0,
          flameX, flameY, 20
        );
        
        // Cores do fogo com opacidade
        flameGradient.addColorStop(0, `rgba(255, 50, 0, ${opacity * 0.8})`);
        flameGradient.addColorStop(0.4, `rgba(255, 100, 0, ${opacity * 0.6})`);
        flameGradient.addColorStop(1, `rgba(255, 150, 0, 0)`);
        
        // Animar a chama
        const flameTime = Date.now() * 0.003 + i;
        const flameSize = 15 + Math.sin(flameTime) * 5;
        
        ctx.beginPath();
        ctx.fillStyle = flameGradient;
        ctx.arc(flameX, flameY, flameSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Desenhar a imagem com opacidade
      ctx.globalAlpha = opacity;
      ctx.drawImage(perfectImage, x, y, size, size);
      
      ctx.restore();
      
      // Continuar animação
      if (elapsed < animDuration) {
        requestAnimationFrame(animateFrame);
      }
    }
    
    // Iniciar animação
    requestAnimationFrame(animateFrame);
  };
}

// Função para mostrar a posição no ranking
function showRankPosition(position, playerScore, perfectCount) {
  try {
    console.log(`Iniciando criação da notificação de ranking: ${position}º lugar com ${playerScore} pontos`);
    
  // Remover notificação anterior, se existir
  const existingNotification = document.querySelector('.rank-notification');
  if (existingNotification) {
    existingNotification.remove();
      console.log('Notificação anterior removida');
    }
    
    // Preparar o botão de vida extra com base nos perfects
    const hasEnoughPerfects = perfectCount >= 5;
    const buyLifeButtonHTML = hasEnoughPerfects 
      ? `<button class="rank-buy-life-btn">
          <img src="./src/images/amaterasu.png" alt="Vida Extra" class="rank-icon">
          Comprar Vida
        </button>`
      : `<button class="rank-buy-life-btn disabled">
          Insuficiente (${perfectCount}/5)
        </button>`;
  
  // Criar um elemento de notificação para mostrar a posição
  const rankNotification = document.createElement('div');
    rankNotification.id = 'rankNotification';
  rankNotification.className = 'rank-notification';
  rankNotification.innerHTML = `
      <div class="rank-close-btn">×</div>
      <div class="rank-content">
        <div class="rank-header">RANKING</div>
        <div class="rank-position">${position}º LUGAR</div>
        <div class="rank-score">${playerScore} pontos</div>
        <div class="rank-buttons-container">
          <div class="rank-buttons">
            <a href="ranking.html" class="rank-view-btn" id="rankViewBtn">
              <img src="./src/images/icons/trophy.png" alt="Troféu" class="rank-icon"> 
              Ver Ranking
            </a>
            <button class="rank-restart-btn">
              <img src="./src/images/icons/restart.png" alt="Reiniciar" class="rank-icon">
              Reiniciar
            </button>
          </div>
          <div class="rank-buttons margin-top">
            ${buyLifeButtonHTML}
          </div>
          <div class="rank-buttons margin-top">
            <a href="index.html" class="rank-menu-btn">
              <svg class="rank-icon menu-icon" viewBox="0 0 24 24" width="20" height="20">
                <path d="M4 6h16M4 12h16M4 18h16" 
                  stroke="currentColor" 
                  stroke-width="2" 
                  stroke-linecap="round"
                  fill="none">
                  <animate
                    attributeName="d"
                    dur="0.3s"
                    begin="parentElement.mouseover"
                    fill="freeze"
                    values="M4 6h16M4 12h16M4 18h16;M6 6h12M4 12h16M6 18h12"
                    calcMode="spline"
                    keySplines="0.4 0 0.2 1"
                  />
                  <animate
                    attributeName="d"
                    dur="0.3s"
                    begin="parentElement.mouseout"
                    fill="freeze"
                    values="M6 6h12M4 12h16M6 18h12;M4 6h16M4 12h16M4 18h16"
                    calcMode="spline"
                    keySplines="0.4 0 0.2 1"
                  />
                </path>
                <g class="menu-dots">
                  <circle cx="2" cy="6" r="1" fill="currentColor">
                    <animate
                      attributeName="cx"
                      dur="0.3s"
                      begin="parentElement.parentElement.mouseover"
                      fill="freeze"
                      values="2;4"
                      calcMode="spline"
                      keySplines="0.4 0 0.2 1"
                    />
                    <animate
                      attributeName="cx"
                      dur="0.3s"
                      begin="parentElement.parentElement.mouseout"
                      fill="freeze"
                      values="4;2"
                      calcMode="spline"
                      keySplines="0.4 0 0.2 1"
                    />
                  </circle>
                  <circle cx="2" cy="12" r="1" fill="currentColor">
                    <animate
                      attributeName="r"
                      dur="0.3s"
                      begin="parentElement.parentElement.mouseover"
                      fill="freeze"
                      values="1;1.2"
                      calcMode="spline"
                      keySplines="0.4 0 0.2 1"
                    />
                    <animate
                      attributeName="r"
                      dur="0.3s"
                      begin="parentElement.parentElement.mouseout"
                      fill="freeze"
                      values="1.2;1"
                      calcMode="spline"
                      keySplines="0.4 0 0.2 1"
                    />
                  </circle>
                  <circle cx="2" cy="18" r="1" fill="currentColor">
                    <animate
                      attributeName="cx"
                      dur="0.3s"
                      begin="parentElement.parentElement.mouseover"
                      fill="freeze"
                      values="2;4"
                      calcMode="spline"
                      keySplines="0.4 0 0.2 1"
                    />
                    <animate
                      attributeName="cx"
                      dur="0.3s"
                      begin="parentElement.parentElement.mouseout"
                      fill="freeze"
                      values="4;2"
                      calcMode="spline"
                      keySplines="0.4 0 0.2 1"
                    />
                  </circle>
                </g>
              </svg>
              Menu Principal
            </a>
          </div>
        </div>
      </div>
    `;
    
    // Adicionar estilos inline diretamente para garantir que sejam aplicados
    rankNotification.style.position = 'fixed';
    rankNotification.style.top = '50%';
    rankNotification.style.left = '50%';
    rankNotification.style.transform = 'translate(-50%, -50%)';
    rankNotification.style.backgroundColor = 'rgba(0, 0, 0, 0.97)';
    rankNotification.style.border = '2px solid rgba(255, 0, 0, 0.3)';
    rankNotification.style.color = 'white';
    rankNotification.style.padding = '25px';
    rankNotification.style.borderRadius = '20px';
    rankNotification.style.textAlign = 'center';
    rankNotification.style.zIndex = '999999';
    rankNotification.style.fontFamily = "'Noto Sans JP', sans-serif";
    rankNotification.style.boxShadow = '0 0 30px rgba(255, 0, 0, 0.2), 0 0 60px rgba(0, 0, 0, 0.4)';
    rankNotification.style.width = '85%';
    rankNotification.style.maxWidth = '380px';
    rankNotification.style.pointerEvents = 'auto';
    rankNotification.style.backdropFilter = 'blur(10px)';
    rankNotification.style.WebkitBackdropFilter = 'blur(10px)';
    
    // Adicionar ao DOM
    document.body.appendChild(rankNotification);
    console.log('Notificação adicionada ao DOM');
    
    // Adicionar estilos para subelementos
    const style = document.createElement('style');
    style.id = 'rankNotificationStyles';
    style.textContent = `
      .rank-content {
        position: relative;
        padding: 10px;
      }
      
      .rank-close-btn {
        position: absolute;
        top: -12px;
        right: -12px;
        width: 30px;
        height: 30px;
        line-height: 28px;
        text-align: center;
        font-size: 20px;
        cursor: pointer;
        background: linear-gradient(45deg, #600, #900);
        border-radius: 50%;
        transition: all 0.3s;
        pointer-events: auto !important;
        z-index: 100000;
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      }
      
      /* Aumentar a área de toque para dispositivos móveis */
      @media (max-width: 600px) {
        .rank-close-btn {
          width: 35px;
          height: 35px;
          line-height: 33px;
          font-size: 24px;
        }
      }
      
      .rank-close-btn:hover {
        background: linear-gradient(45deg, #800, #b00);
        transform: scale(1.1);
      }
      
      .rank-header {
        font-size: 1.3em;
        color: #ff3333;
        margin-bottom: 15px;
        text-transform: uppercase;
        letter-spacing: 2px;
        font-weight: bold;
        text-shadow: 0 0 10px rgba(255, 0, 0, 0.3);
      }
      
      .rank-position {
        font-size: 2.4em;
        font-weight: bold;
        margin-bottom: 8px;
        color: gold;
        text-shadow: 0 0 12px rgba(255, 215, 0, 0.6);
        letter-spacing: 1px;
      }
      
      .rank-score {
        font-size: 1.4em;
        margin-bottom: 20px;
        color: #fff;
        text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
      }
      
      .rank-buttons-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .rank-buttons {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }
      
      .margin-top {
        margin-top: 3px;
      }
      
      .rank-view-btn, .rank-restart-btn, .rank-buy-life-btn, .rank-menu-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        background: linear-gradient(45deg, #600, #900);
        color: white;
        text-decoration: none;
        padding: 12px 18px;
        border-radius: 25px;
        font-size: 1.05em;
        transition: all 0.3s;
        pointer-events: auto !important;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        letter-spacing: 0.5px;
      }
      
      .rank-view-btn:hover, .rank-restart-btn:hover, .rank-buy-life-btn:not(.disabled):hover, .rank-menu-btn:hover {
        background: linear-gradient(45deg, #800, #b00);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      }
      
      .rank-buy-life-btn.disabled {
        background: linear-gradient(45deg, #333, #444);
        opacity: 0.7;
        cursor: not-allowed;
        box-shadow: none;
      }
      
      .rank-icon {
        width: 22px;
        height: 22px;
        margin-right: 8px;
        filter: invert(1) drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
      }
      
      .rank-icon.menu-icon {
        width: 20px;
        height: 20px;
        margin-right: 6px;
        filter: none;
        transition: transform 0.3s ease;
      }
      
      .rank-menu-btn {
        padding: 10px 16px !important;
        font-size: 0.95em !important;
      }
      
      .rank-menu-btn:hover .menu-icon {
        transform: scale(1.05);
      }
      
      @media (max-width: 600px) {
        .rank-menu-btn {
          padding: 8px 14px !important;
          font-size: 0.9em !important;
        }
        
        .rank-icon.menu-icon {
          width: 18px;
          height: 18px;
          margin-right: 5px;
        }
      }
      
      @keyframes rankFadeIn {
        from { 
          opacity: 0; 
          transform: translate(-50%, -40%); 
        }
        to { 
          opacity: 1; 
          transform: translate(-50%, -50%); 
        }
      }
      
      @keyframes rankFadeOut {
        from { 
          opacity: 1; 
          transform: translate(-50%, -50%); 
        }
        to { 
          opacity: 0; 
          transform: translate(-50%, -60%); 
        }
      }
      
      @media (max-width: 600px) {
        .rank-notification {
          width: 92% !important;
          max-width: 320px !important;
          padding: 20px !important;
        }
        
        .rank-position {
          font-size: 2em;
        }
        
        .rank-score {
          font-size: 1.2em;
        }
        
        .rank-view-btn, .rank-restart-btn, .rank-buy-life-btn, .rank-menu-btn {
          padding: 10px 15px;
          font-size: 0.95em;
        }
      }
    `;
  
  // Adicionar ao DOM
  document.head.appendChild(style);
    console.log('Estilos adicionados ao DOM');
    
    // Aplicar animação de entrada
    rankNotification.style.animation = 'rankFadeIn 0.5s ease-out';
  
  // Forçar um pequeno delay para garantir que todos os elementos estejam renderizados
  setTimeout(() => {
      try {
    // Personalizar cores com base na posição
    if (position === 1) {
          const positionElement = rankNotification.querySelector('.rank-position');
          if (positionElement) {
            positionElement.style.color = 'gold';
            positionElement.style.textShadow = '0 0 8px rgba(255, 215, 0, 0.8)';
          }
    } else if (position === 2) {
          const positionElement = rankNotification.querySelector('.rank-position');
          if (positionElement) {
            positionElement.style.color = 'silver';
            positionElement.style.textShadow = '0 0 8px rgba(192, 192, 192, 0.8)';
          }
    } else if (position === 3) {
          const positionElement = rankNotification.querySelector('.rank-position');
          if (positionElement) {
            positionElement.style.color = '#cd7f32';
            positionElement.style.textShadow = '0 0 8px rgba(205, 127, 50, 0.8)';
          }
        }
        
        // Adicionar eventos aos botões
        const closeBtn = rankNotification.querySelector('.rank-close-btn');
        if (closeBtn) {
          // Garantir que o botão de fechar seja clicável
          closeBtn.style.pointerEvents = 'auto';
          closeBtn.style.cursor = 'pointer';
          
          // Adicionar evento de clique
          closeBtn.addEventListener('click', () => {
            console.log('Botão de fechar clicado');
            removeRankNotification(rankNotification, style);
            
            // Reiniciar o jogo diretamente em vez de mostrar os botões
            resetGame();
          });
          
          // Adicionar evento de toque explícito para dispositivos móveis
          closeBtn.addEventListener('touchstart', (e) => {
            console.log('Botão de fechar tocado');
            e.preventDefault();
            e.stopPropagation();
            removeRankNotification(rankNotification, style);
            
            // Reiniciar o jogo diretamente em vez de mostrar os botões
            resetGame();
          }, { passive: false });
        }
        
        const restartBtn = rankNotification.querySelector('.rank-restart-btn');
        if (restartBtn) {
          restartBtn.addEventListener('click', () => {
            console.log('Botão de reiniciar clicado');
            removeRankNotification(rankNotification, style);
            resetGame();
          });
        }
        
        // Garantir que o link para o ranking funcione em dispositivos móveis
        const viewRankingBtn = rankNotification.querySelector('#rankViewBtn');
        if (viewRankingBtn) {
          // Adicionar evento de toque explícito
          viewRankingBtn.addEventListener('touchstart', function(e) {
            console.log('Botão de ver ranking tocado');
            e.stopPropagation(); // Impedir propagação
            // O navegador seguirá o href automaticamente
          }, { passive: false });
          
          // Garantir que o link seja clicável 
          viewRankingBtn.style.cursor = 'pointer';
          viewRankingBtn.style.pointerEvents = 'auto';
        }
        
        const buyLifeBtn = rankNotification.querySelector('.rank-buy-life-btn');
        if (buyLifeBtn && !buyLifeBtn.classList.contains('disabled')) {
          buyLifeBtn.addEventListener('click', () => {
            console.log('Botão de comprar vida clicado');
            removeRankNotification(rankNotification, style);
            // Consumir os perfects
            if (typeof resetPerfectCounter === 'function') {
              resetPerfectCounter(5); // Consumir 5 perfects
            }
            // Emitir evento de revivimento de jogador
            window.dispatchEvent(new Event('playerRevive'));
          });
        }
        
        const menuBtn = rankNotification.querySelector('.rank-menu-btn');
        if (menuBtn) {
          // Adicionar evento de clique
          menuBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir comportamento padrão do link
            console.log('Botão de menu clicado');
            removeRankNotification(rankNotification, style);
            // Redirecionar para o menu principal
            window.location.href = 'index.html';
          });

          // Adicionar evento de toque explícito para dispositivos móveis
          menuBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevenir comportamento padrão do toque
            e.stopPropagation();
            console.log('Botão de menu tocado');
            removeRankNotification(rankNotification, style);
            // Redirecionar para o menu principal
            window.location.href = 'index.html';
          }, { passive: false });

          // Garantir que o link seja clicável
          menuBtn.style.cursor = 'pointer';
          menuBtn.style.pointerEvents = 'auto';
        }
        
        console.log('Eventos dos botões configurados');
      } catch (error) {
        console.error("Erro ao configurar eventos da notificação:", error);
      }
    }, 100);
  } catch (error) {
    console.error("Erro ao criar notificação de ranking:", error);
    // Em caso de erro, mostrar botões padrão para o usuário não ficar preso
    document.getElementById("restart").style.display = "block";
    document.getElementById("buy-life").style.display = "flex";
  }
}

// Função auxiliar para remover notificação de ranking
function removeRankNotification(notification, style) {
  console.log('Removendo notificação de ranking');
  if (notification) {
    notification.style.animation = 'rankFadeOut 0.5s ease-in forwards';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
        console.log('Notificação removida do DOM');
      }
      if (style && style.parentNode) {
        style.remove();
        console.log('Estilos removidos do DOM');
      }
    }, 500);
  }
} 
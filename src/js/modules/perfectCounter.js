// Módulo para gerenciar o contador de perfects e a funcionalidade de comprar vida

let perfectCount = 0;
const PERFECT_REQUIREMENT = 5; // Número de perfects necessários para comprar uma vida

// Inicializa o contador de perfects
export function initPerfectCounter() {
  perfectCount = 0;
  updatePerfectCounterDisplay();
  
  // Configurar o botão de comprar vida
  const buyLifeButton = document.getElementById('buy-life');
  if (buyLifeButton) {
    buyLifeButton.style.display = 'none';
    buyLifeButton.addEventListener('click', buyExtraLife);
  }
}

// Incrementa o contador quando um perfect é atingido
export function incrementPerfectCounter() {
  perfectCount++;
  updatePerfectCounterDisplay();
  checkPerfectRequirement();
}

// Atualiza a exibição do contador
function updatePerfectCounterDisplay() {
  const perfectCounterElement = document.querySelector('#perfect-counter .perfect-value');
  if (perfectCounterElement) {
    perfectCounterElement.textContent = perfectCount;
  }
}

// Verifica se o jogador tem perfects suficientes para comprar vida
function checkPerfectRequirement() {
  const buyLifeButton = document.getElementById('buy-life');
  if (buyLifeButton) {
    // Não mostrar o botão até que o jogador morra
    // A função handleGameOver em physics.js vai cuidar de mostrar o botão quando necessário
    buyLifeButton.style.display = 'none';
  }
}

// Função para comprar vida extra
function buyExtraLife() {
  // Verificar se o botão está desabilitado primeiro
  const buyLifeButton = document.getElementById('buy-life');
  if (buyLifeButton && buyLifeButton.disabled) {
    return; // Não fazer nada se o botão estiver desabilitado
  }
  
  if (perfectCount >= PERFECT_REQUIREMENT) {
    perfectCount -= PERFECT_REQUIREMENT;
    updatePerfectCounterDisplay();
    
    // Efeito visual no contador de perfect
    const perfectCounter = document.getElementById('perfect-counter');
    if (perfectCounter) {
      // Adicionar e remover uma classe para animar
      perfectCounter.classList.add('perfect-used');
      setTimeout(() => {
        perfectCounter.classList.remove('perfect-used');
      }, 1000);
    }
    
    // Adicionar lógica para reviver o jogador
    // Esta função deve ser implementada no módulo responsável pelo estado do jogo
    if (typeof revivePlayer === 'function') {
      revivePlayer();
    } else {
      // Caso a função revivePlayer não esteja disponível globalmente
      // Disparar um evento customizado
      const reviveEvent = new CustomEvent('playerRevive');
      window.dispatchEvent(reviveEvent);
    }
    
    // Esconder o botão após a compra
    if (buyLifeButton) {
      buyLifeButton.style.display = 'none';
    }
  }
}

// Reseta o contador apenas quando solicitado explicitamente
export function resetPerfectCounter() {
  perfectCount = 0;
  updatePerfectCounterDisplay();
  checkPerfectRequirement();
}

// Retorna o número atual de perfects
export function getPerfectCount() {
  return perfectCount;
} 
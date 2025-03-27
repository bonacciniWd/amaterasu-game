// Arquivo principal que inicializa o jogo
import { recalculateConstants } from './modules/config.js';
import { loadSounds, addSoundControl, playBackgroundMusic } from './modules/audio.js';
import { generateStars } from './modules/entities.js';
import { resetGame } from './modules/ui.js';
import { setupMobileInterface, preventTextSelection, resizeCanvas, ensureGameVisibility, initGameAfterStory } from './modules/ui.js';
import { setupInputEvents } from './modules/input.js';
import { animate } from './modules/physics.js';
import { setupInteractionEvents } from './modules/ui.js';
import { draw, initRenderer } from './modules/render.js';
import { initPerfectCounter, incrementPerfectCounter, resetPerfectCounter } from './modules/perfectCounter.js';
import { router } from '../routes/router.js';

// Extend the base functionality of JavaScript
Array.prototype.last = function () {
  return this[this.length - 1];
};

// A sinus function that accepts degrees instead of radians
Math.sinus = function (degree) {
  return Math.sin((degree / 180) * Math.PI);
};

// Expor funções necessárias globalmente
window.draw = draw;
window.resetGame = resetGame;
window.loadSounds = loadSounds;
window.playBackgroundMusic = playBackgroundMusic;
window.incrementPerfectCounter = incrementPerfectCounter;
window.resetPerfectCounter = resetPerfectCounter;

// Debug: Registrar início da inicialização
console.log('Iniciando carregamento do jogo...');

// Função para inicializar o jogo
export function initGame() {
  try {
    console.log('Iniciando função initGame...');
    
    // Inicializar renderer
    console.log('Inicializando renderer...');
    initRenderer();
    
    // Configurar interface
    console.log('Configurando interface...');
    setupMobileInterface();
    preventTextSelection();
    
    // Carregar sons primeiro
    console.log('Carregando sons...');
    loadSounds();
    
    // Adicionar controle de som depois de carregar os sons
    console.log('Adicionando controle de som...');
    setTimeout(() => {
      const soundButton = addSoundControl();
      console.log('Botão de som adicionado:', soundButton ? 'sucesso' : 'falha');
    }, 200);
    
    // Configurar canvas
    console.log('Configurando canvas...');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Configurar eventos de entrada
    console.log('Configurando eventos de entrada...');
    setupInputEvents();
    
    // Configurar eventos de interação especial
    console.log('Configurando eventos de interação...');
    setupInteractionEvents();
    
    // Resetar o jogo
    console.log('Resetando jogo...');
    resetGame();
    
    // Iniciar animação
    console.log('Iniciando animação...');
    window.requestAnimationFrame(animate);
    
    console.log('Jogo inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar o jogo:', error);
    // Mostrar o erro na tela para depuração
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '10px';
    errorDiv.style.left = '10px';
    errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '20px';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.zIndex = '99999';
    errorDiv.textContent = `Erro: ${error.message} - Stack: ${error.stack}`;
    document.body.appendChild(errorDiv);
  }
}

// Função para executar quando o DOM estiver carregado
function onDOMLoaded() {
  // Verificar se estamos mostrando a tela de história
  const storyScreen = document.getElementById('story-screen');
  if (storyScreen && storyScreen.style.display !== 'none') {
    // Ouvir o evento de início do jogo após a história
    window.addEventListener('gameStartFromStory', function() {
      initGameAfterStory();
      loadSounds();
      setTimeout(playBackgroundMusic, 1000);
    });
  } else {
    // Inicializar o jogo diretamente
    initGameAfterStory();
  }

  // Configurar eventos de entrada
  setupInputEvents();
  
  // Configurar eventos de interação especial
  setupInteractionEvents();
  
  // Carregar sons
  loadSounds();
  
  // Adicionar controle de som
  window.addEventListener('load', function() {
    addSoundControl();
    
    // Garantir que o canvas tenha o tamanho correto
    resizeCanvas();
    setTimeout(function() {
      draw();
      setupMobileInterface();
    }, 100);
  });
}

// Inicializar o router quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('DOM carregado, inicializando router...');
    router.init();
    console.log('Router inicializado!');
  } catch (error) {
    console.error('Erro ao inicializar o router:', error);
    // Mostrar o erro na tela para depuração
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '10px';
    errorDiv.style.left = '10px';
    errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '20px';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.zIndex = '99999';
    errorDiv.textContent = `Erro: ${error.message} - Stack: ${error.stack}`;
    document.body.appendChild(errorDiv);
  }
}); 
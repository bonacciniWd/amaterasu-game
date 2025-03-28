// Módulo para entrada de usuário
import { phase, setPhase, setLastTimestamp } from './config.js';
import { animate } from './physics.js';
import { resetGame } from './ui.js';

// Configurar eventos de entrada do usuário
export function setupInputEvents() {
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
    // Ignorar eventos do botão de som com tratamento especial
    if (event.target.id === 'soundToggle' || 
        event.target.closest('#soundToggle') ||
        (event.target.classList && event.target.classList.contains('sound-icon'))) {
      return; // Permitir que o evento seja tratado pelo botão de som
    }
    
    // Prevenir comportamento padrão exceto para botões
    if (event.target.tagName !== "BUTTON") {
      event.preventDefault();
    }
    
    if (phase == "waiting") {
      startStretching();
    }
  }, { passive: false }); // importante para permitir preventDefault

  // Garantir que o evento de soltar o stick funcione
  window.addEventListener("touchend", function (event) {
    // Ignorar eventos do botão de som
    if (event.target.id === 'soundToggle' || 
        event.target.closest('#soundToggle') ||
        (event.target.classList && event.target.classList.contains('sound-icon'))) {
      return;
    }

    if (phase == "stretching") {
      startTurning();
    }
  }, { passive: false });

  // Adicionar evento de clique ao botão
  const mobileStartButton = document.getElementById("mobileStartButton");
  if (mobileStartButton) {
    mobileStartButton.addEventListener("click", function (event) {
      event.preventDefault(); // Prevenir comportamento padrão
      if (phase == "waiting") {
        startStretching();
      }
    });
  }

  // Adicionar eventos para desktop
  window.addEventListener("mousedown", function (event) {
    // Ignorar eventos do botão de som
    if (event.target.id === 'soundToggle' || 
        event.target.closest('#soundToggle') ||
        (event.target.classList && event.target.classList.contains('sound-icon'))) {
      return;
    }
    
    if (phase == "waiting") {
      startStretching();
    }
  });

  window.addEventListener("mouseup", function (event) {
    // Ignorar eventos do botão de som
    if (event.target.id === 'soundToggle' || 
        event.target.closest('#soundToggle') ||
        (event.target.classList && event.target.classList.contains('sound-icon'))) {
      return;
    }

    if (phase == "stretching") {
      startTurning();
    }
  });

  // Adicionar evento de clique ao botão de reiniciar
  const restartButton = document.getElementById("restart");
  if (restartButton) {
    restartButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation(); // Impedir que o evento se propague
      resetGame();
      restartButton.style.display = "none"; // Esconder o botão após reiniciar
    });
  }
}

// Iniciar a fase de esticar o bastão
function startStretching() {
  setLastTimestamp(undefined);
  document.getElementById("introduction").style.opacity = 0;
  setPhase("stretching");
  document.body.classList.add("game-active"); // Ativar captura de toques
  window.requestAnimationFrame(animate);
}

// Iniciar a fase de girar o bastão
function startTurning() {
  setPhase("turning");
} 
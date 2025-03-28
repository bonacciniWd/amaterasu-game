// Arquivo principal que redireciona para a implementação modular
// Este arquivo existe apenas para manter compatibilidade com referências existentes

// Importar a implementação principal do jogo
import { initGame } from './src/js/index.js';

// Quando o DOM estiver pronto, inicializar o jogo
document.addEventListener('DOMContentLoaded', function() {
  console.log('index.js: DOM carregado, verificando se deve inicializar o jogo');
  
  // Verificar se estamos na página do jogo
  const gameContainer = document.querySelector('.game-container');
  if (gameContainer) {
    console.log('index.js: Página de jogo detectada, iniciando jogo...');
    // Iniciar o jogo
    initGame();
        } else {
    console.log('index.js: Esta não é a página de jogo, não inicializando');
  }
}); 
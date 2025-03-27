// Sistema de rotas
import { introScreen } from '../components/intro/intro.js';
import { gameScreen } from '../components/game/game.js';

export class Router {
  constructor() {
    console.log('Router constructor iniciado');
    
    this.routes = {
      '#/': () => this.showIntro(),
      '#/game': () => this.showGame()
    };

    // Inicializar a rota atual
    this.currentHash = window.location.hash || '#/';
    
    // Lidar com navegação
    window.addEventListener('hashchange', () => {
      console.log('Hash alterado para:', window.location.hash);
      this.handleRoute();
    });
    
    // Lidar com o início do jogo
    window.addEventListener('gameStart', () => {
      console.log('Evento gameStart recebido');
      this.navigate('#/game');
    });
    
    console.log('Router constructor finalizado');
  }

  init() {
    console.log('Router init iniciado');
    // Definir hash padrão se não existir
    if (!window.location.hash) {
      console.log('Definindo hash padrão #/');
      window.location.hash = '#/';
    } else {
      console.log('Hash já existe:', window.location.hash);
      this.handleRoute();
    }
    console.log('Router init finalizado');
  }

  handleRoute() {
    try {
      console.log('handleRoute iniciado, hash atual:', window.location.hash);
      const hash = window.location.hash;
      const route = this.routes[hash] || this.routes['#/'];
      console.log('Rota encontrada para hash:', hash);
      route();
    } catch (error) {
      console.error('Erro ao processar rota:', error);
      // Exibir erro na tela
      const errorDiv = document.createElement('div');
      errorDiv.style.position = 'fixed';
      errorDiv.style.top = '10px';
      errorDiv.style.left = '10px';
      errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
      errorDiv.style.color = 'white';
      errorDiv.style.padding = '20px';
      errorDiv.style.borderRadius = '5px';
      errorDiv.style.zIndex = '99999';
      errorDiv.textContent = `Erro de roteamento: ${error.message}`;
      document.body.appendChild(errorDiv);
    }
  }

  navigate(hash) {
    console.log('Navegando para:', hash);
    window.location.hash = hash;
  }

  showIntro() {
    try {
      console.log('showIntro iniciado');
      // Limpar o conteúdo atual
      document.body.innerHTML = '';
      
      // Criar e mostrar a tela de introdução
      console.log('Criando elemento intro');
      const introElement = introScreen.createIntroScreen();
      console.log('Adicionando elemento intro ao DOM');
      document.body.appendChild(introElement);
      console.log('showIntro finalizado');
    } catch (error) {
      console.error('Erro ao mostrar intro:', error);
      // Exibir erro na tela
      const errorDiv = document.createElement('div');
      errorDiv.style.position = 'fixed';
      errorDiv.style.top = '10px';
      errorDiv.style.left = '10px';
      errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
      errorDiv.style.color = 'white';
      errorDiv.style.padding = '20px';
      errorDiv.style.borderRadius = '5px';
      errorDiv.style.zIndex = '99999';
      errorDiv.textContent = `Erro ao mostrar intro: ${error.message}`;
      document.body.appendChild(errorDiv);
    }
  }

  showGame() {
    try {
      console.log('showGame iniciado');
      // Limpar o conteúdo atual
      document.body.innerHTML = '';
      
      // Criar e mostrar a tela do jogo
      console.log('Criando elemento game');
      const gameElement = gameScreen.createGameScreen();
      gameElement.style.display = 'flex'; // Garantir que o jogo esteja visível
      console.log('Adicionando elemento game ao DOM');
      document.body.appendChild(gameElement);
      
      // Inicializar o jogo
      console.log('Inicializando o jogo');
      import('../js/index.js').then(module => {
        console.log('Módulo de jogo importado');
        if (typeof module.initGame === 'function') {
          console.log('Chamando initGame');
          module.initGame();
          console.log('Jogo inicializado com sucesso');
        } else {
          console.error('Função initGame não encontrada');
        }
      }).catch(error => {
        console.error('Erro ao importar módulo do jogo:', error);
      });
      
      console.log('showGame finalizado');
    } catch (error) {
      console.error('Erro ao mostrar jogo:', error);
      // Exibir erro na tela
      const errorDiv = document.createElement('div');
      errorDiv.style.position = 'fixed';
      errorDiv.style.top = '10px';
      errorDiv.style.left = '10px';
      errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
      errorDiv.style.color = 'white';
      errorDiv.style.padding = '20px';
      errorDiv.style.borderRadius = '5px';
      errorDiv.style.zIndex = '99999';
      errorDiv.textContent = `Erro ao mostrar jogo: ${error.message}`;
      document.body.appendChild(errorDiv);
    }
  }
}

// Exportar uma instância única do router
export const router = new Router(); 
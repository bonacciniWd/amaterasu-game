// Componente da tela de introdução
export class IntroScreen {
  constructor() {
    this.currentParagraph = 0;
    this.storyParagraphs = [
      "Em um Japão ancestral coberto por sombras e traições, o lendário Clã Amaterasu protegia os segredos da luz celestial — a força capaz de manter o equilíbrio entre o mundo dos vivos e o reino dos espíritos.",
      "Por séculos, os Amaterasu viveram nas montanhas sagradas, ocultos dos olhos mortais. Até que uma noite, o impiedoso Senhor Kurojin, mestre das artes obscuras, invadiu o santuário e capturou os anciãos do clã, roubando o pergaminho da Luz Eterna.",
      "Com o mundo mergulhando lentamente na escuridão, a última esperança recai sobre um pequeno grupo de jovens ninjas sobreviventes. Ágeis, leais e determinados, eles agora devem atravessar territórios inimigos, enfrentar criaturas das trevas e resgatar seus mestres antes que a luz se apague para sempre.",
      "O destino do clã... e do mundo... está em suas mãos."
    ];
  }

  createIntroScreen() {
    const introScreen = document.createElement('div');
    introScreen.id = 'story-screen';
    
    // Adicionar um elemento de imagem de fundo diretamente
    const backgroundImg = document.createElement('div');
    backgroundImg.id = 'story-background';
    backgroundImg.style.position = 'absolute';
    backgroundImg.style.top = '0';
    backgroundImg.style.left = '0';
    backgroundImg.style.width = '100%';
    backgroundImg.style.height = '100%';
    backgroundImg.style.backgroundImage = "url('./src/images/fundo.webp')";
    backgroundImg.style.backgroundPosition = 'center center';
    backgroundImg.style.backgroundSize = 'cover';
    backgroundImg.style.backgroundRepeat = 'no-repeat';
    backgroundImg.style.opacity = '1';
    backgroundImg.style.zIndex = '-2';
    
    // Adicionar camada de gradiente
    const gradientOverlay = document.createElement('div');
    gradientOverlay.style.position = 'absolute';
    gradientOverlay.style.top = '0';
    gradientOverlay.style.left = '0';
    gradientOverlay.style.width = '100%';
    gradientOverlay.style.height = '100%';
    gradientOverlay.style.background = 'linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(139, 0, 0, 0.3), rgba(0, 0, 0, 0.5))';
    gradientOverlay.style.zIndex = '-1';

    const storyContainer = document.createElement('div');
    storyContainer.className = 'story-container';

    const title = document.createElement('h1');
    title.textContent = 'A Lenda do Clã Amaterasu';

    const storyText = document.createElement('div');
    storyText.id = 'story-text';

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const continueButton = document.createElement('button');
    continueButton.id = 'continue-story';
    continueButton.textContent = 'Continuar';

    const skipButton = document.createElement('button');
    skipButton.id = 'skip-story';
    skipButton.textContent = 'Pular História';

    buttonContainer.appendChild(continueButton);
    buttonContainer.appendChild(skipButton);

    storyContainer.appendChild(title);
    storyContainer.appendChild(storyText);
    storyContainer.appendChild(buttonContainer);
    
    introScreen.appendChild(backgroundImg);
    introScreen.appendChild(gradientOverlay);
    introScreen.appendChild(storyContainer);

    this.setupEventListeners(continueButton, skipButton, storyText);

    return introScreen;
  }

  typeWriter(text, element, speed = 30) {
    let i = 0;
    element.textContent = '';
    const continueButton = document.getElementById('continue-story');
    if (continueButton) continueButton.disabled = true;

    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else {
        if (continueButton) continueButton.disabled = false;
      }
    }

    type();
  }

  setupEventListeners(continueButton, skipButton, storyText) {
    // Exibir o primeiro parágrafo
    this.typeWriter(this.storyParagraphs[this.currentParagraph], storyText);

    continueButton.addEventListener('click', () => {
      this.currentParagraph++;
      if (this.currentParagraph < this.storyParagraphs.length) {
        this.typeWriter(this.storyParagraphs[this.currentParagraph], storyText);
      } else {
        this.startGame();
      }
    });

    skipButton.addEventListener('click', () => {
      this.startGame();
    });
  }

  startGame() {
    // Remover a tela de introdução
    const introScreen = document.getElementById('story-screen');
    if (introScreen) {
      introScreen.style.display = 'none';
      introScreen.remove();
    }

    // Disparar evento para iniciar o jogo
    const gameStartEvent = new CustomEvent('gameStart');
    window.dispatchEvent(gameStartEvent);
  }
}

// Exportar uma instância única do componente
export const introScreen = new IntroScreen(); 
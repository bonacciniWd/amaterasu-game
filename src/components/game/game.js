// Componente do jogo
export class GameScreen {
  constructor() {
    this.initialized = false;
  }

  createGameScreen() {
    const container = document.createElement('div');
    container.className = 'container';
    container.style.display = 'none';

    // Canvas do jogo
    const canvas = document.createElement('canvas');
    canvas.id = 'game';

    // Banner de pontuação
    const scoreBanner = document.createElement('div');
    scoreBanner.className = 'score-banner';

    // Pontuação
    const score = document.createElement('div');
    score.id = 'score';
    score.setAttribute('unselectable', 'on');
    score.innerHTML = `
      <span class="score-label">Pontos</span>
      <span class="score-value">0</span>
    `;

    // Contador de perfects
    const perfectCounter = document.createElement('div');
    perfectCounter.id = 'perfect-counter';
    perfectCounter.setAttribute('unselectable', 'on');
    perfectCounter.innerHTML = `
      <div class="perfect-label-container">
        <img src="./src/images/amaterasu.png" alt="Perfect">
        <span class="score-label">Perfects</span>
      </div>
      <span class="perfect-value">0</span>
    `;

    scoreBanner.appendChild(score);
    scoreBanner.appendChild(perfectCounter);

    // Texto de introdução
    const introduction = document.createElement('div');
    introduction.id = 'introduction';
    introduction.setAttribute('unselectable', 'on');
    introduction.textContent = 'Segure o botão do mouse para esticar o bastão';

    // Elemento perfect
    const perfect = document.createElement('div');
    perfect.id = 'perfect';
    perfect.setAttribute('unselectable', 'on');

    // Botão mobile
    const mobileButton = document.createElement('button');
    mobileButton.id = 'mobileStartButton';
    mobileButton.style.display = 'none';
    mobileButton.textContent = 'Tocar para iniciar';

    // Área de toque
    const touchArea = document.createElement('div');
    touchArea.id = 'touchArea';

    // Botões de ação
    const actionButtons = document.createElement('div');
    actionButtons.className = 'action-buttons';

    const restartButton = document.createElement('button');
    restartButton.id = 'restart';
    restartButton.textContent = 'REINICIAR';

    const buyLifeButton = document.createElement('button');
    buyLifeButton.id = 'buy-life';
    buyLifeButton.innerHTML = `
      <img src="./src/images/amaterasu.png" alt="Vida Extra" class="button-icon">
      COMPRAR VIDA
    `;

    actionButtons.appendChild(restartButton);
    actionButtons.appendChild(buyLifeButton);

    // Botão de som
    // Deixe um comentário anotando a remoção ou desativação

    // Adicionar elementos ao container
    container.appendChild(canvas);
    container.appendChild(scoreBanner);
    container.appendChild(introduction);
    container.appendChild(perfect);
    container.appendChild(mobileButton);
    container.appendChild(touchArea);
    container.appendChild(actionButtons);

    // Adicionar elementos de áudio
    this.createAudioElements(container);

    // Criar os containers de diálogo se ainda não existirem
    this.createDialogContainers();

    return container;
  }

  createAudioElements(container) {
    const audioFiles = {
      backgroundMusic: './src/sounds/howling-wind.mp3',
      perfectSound: './src/sounds/click.mp3',
      fallSound: './src/sounds/fall.mp3',
      iceSound: './src/sounds/ice.mp3'
    };

    Object.entries(audioFiles).forEach(([id, src]) => {
      const audio = document.createElement('audio');
      audio.id = id;
      audio.preload = 'auto';
      audio.muted = true;
      if (id === 'backgroundMusic') audio.loop = true;

      const source = document.createElement('source');
      source.src = src;
      source.type = 'audio/mp3';

      audio.appendChild(source);
      container.appendChild(audio);
    });
  }

  createDialogContainers() {
    // Verificar se os containers de diálogo já existem
    if (!document.getElementById('treasureAnimation')) {
      // Container para animação do tesouro
      const treasureAnimation = document.createElement('div');
      treasureAnimation.id = 'treasureAnimation';
      treasureAnimation.style.display = 'none';

      const lottieContainer = document.createElement('div');
      lottieContainer.id = 'lottieContainer';
      lottieContainer.style.width = '100%';
      lottieContainer.style.height = '100%';

      const closeButton = document.createElement('button');
      closeButton.id = 'closeTreasure';
      closeButton.textContent = 'X';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '10px';
      closeButton.style.right = '10px';
      closeButton.style.background = 'red';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '50%';
      closeButton.style.width = '30px';
      closeButton.style.height = '30px';
      closeButton.style.cursor = 'pointer';

      treasureAnimation.appendChild(lottieContainer);
      treasureAnimation.appendChild(closeButton);
      document.body.appendChild(treasureAnimation);
    }

    if (!document.getElementById('bossDialogueContainer')) {
      // Container para diálogo do boss
      const bossDialogue = document.createElement('div');
      bossDialogue.id = 'bossDialogueContainer';
      bossDialogue.style.display = 'none';

      const title = document.createElement('h3');
      title.id = 'bossDialogueTitle';
      title.textContent = 'Confronto!';
      title.style.color = '#ff7e00';
      title.style.textShadow = '0 0 10px rgba(255, 0, 0, 0.7)';
      title.style.marginTop = '0';

      const text = document.createElement('p');
      text.id = 'bossDialogueText';
      text.style.marginBottom = '20px';
      text.style.lineHeight = '1.4';

      const responseButton = document.createElement('button');
      responseButton.id = 'bossResponseButton';
      responseButton.textContent = 'Eu te mostrarei!';
      responseButton.style.background = 'red';
      responseButton.style.color = 'white';
      responseButton.style.border = 'none';
      responseButton.style.padding = '10px 20px';
      responseButton.style.borderRadius = '5px';
      responseButton.style.marginTop = '10px';
      responseButton.style.fontWeight = 'bold';
      responseButton.style.cursor = 'pointer';

      bossDialogue.appendChild(title);
      bossDialogue.appendChild(text);
      bossDialogue.appendChild(responseButton);
      document.body.appendChild(bossDialogue);
    }
  }

  show() {
    const container = document.querySelector('.container');
    if (container) {
      container.style.display = 'flex';
    }
  }

  hide() {
    const container = document.querySelector('.container');
    if (container) {
      container.style.display = 'none';
    }
  }
}

// Exportar uma instância única do componente
export const gameScreen = new GameScreen(); 
// Módulo para gerenciar áudio
// Variáveis globais para os sons
let backgroundMusic;
let perfectSound;
let fallSound;
let iceSound;
export let soundsEnabled = true; // Flag para controlar se os sons estão ativos
export let soundsLoaded = false; // Flag para verificar se os sons foram carregados

// Função para carregar sons
export function loadSounds() {
  if (soundsLoaded) return; // Evitar carregar várias vezes
  
  console.log("Carregando sons...");
  backgroundMusic = document.getElementById("backgroundMusic");
  perfectSound = document.getElementById("perfectSound");
  fallSound = document.getElementById("fallSound");
  iceSound = document.getElementById("iceSound");
  
  if (!backgroundMusic || !perfectSound || !fallSound || !iceSound) {
    console.log("Alguns elementos de áudio não foram encontrados. Tentando novamente em breve...");
    // Tentar novamente depois
    setTimeout(loadSounds, 1000);
    return;
  }
  
  // Configurar volume
  backgroundMusic.volume = 0.01;
  perfectSound.volume = 0.30;
  fallSound.volume = 0.5;
  iceSound.volume = 0.9; // Volume um pouco mais alto para o efeito de gelo
  
  // Configurar para preload
  backgroundMusic.preload = "auto";
  perfectSound.preload = "auto";
  fallSound.preload = "auto";
  iceSound.preload = "auto";
  
  // Impedir erro de reprodução automática
  backgroundMusic.muted = true;
  perfectSound.muted = true;
  fallSound.muted = true;
  iceSound.muted = true;
  
  // Tentar carregar áudio
  try {
    backgroundMusic.load();
    perfectSound.load();
    fallSound.load();
    iceSound.load();
  } catch (e) {
    console.log("Erro ao carregar áudio:", e.message);
  }
  
  soundsLoaded = true;
  console.log("Sons carregados com sucesso!");
  
  // Adicionar evento de interação para ativar áudio
  setupAudioContext();
}

// Função para inicializar contexto de áudio
export function setupAudioContext() {
  // Criar função para desmutar após interação
  const unmuteSounds = function() {
    if (backgroundMusic) backgroundMusic.muted = false;
    if (perfectSound) perfectSound.muted = false;
    if (fallSound) fallSound.muted = false;
    if (iceSound) iceSound.muted = false;
    
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
export function playBackgroundMusic() {
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
export function pauseBackgroundMusic() {
  if (backgroundMusic && !backgroundMusic.paused) {
    try {
      backgroundMusic.pause();
      console.log("Música de fundo pausada");
    } catch (error) {
      console.log("Erro ao pausar música:", error.message);
    }
  }
}

// Modificar a função playPerfectSound para garantir que não haja reprodução duplicada
export function playPerfectSound() {
  if (!soundsLoaded) {
    loadSounds();
  }
  
  if (soundsEnabled && perfectSound) {
    // Se o som já estiver tocando, não tocar novamente
    if (!perfectSound.paused) {
      return;
    }
    
    perfectSound.currentTime = 0;
    console.log("Tentando reproduzir som de perfect...");
    perfectSound.play().then(() => {
      console.log("Som de perfect reproduzido com sucesso!");
    }).catch(error => {
      console.error("Erro ao reproduzir som de perfect:", error);
    });
  }
}

// Função para tocar som de queda
export function playFallSound() {
  if (!soundsLoaded) {
    loadSounds();
  }
  
  if (soundsEnabled && fallSound) {
    // Verificar se o som já está tocando
    if (!fallSound.paused) {
      return;
    }
    
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

// Adicionar botão para controlar o som
export function addSoundControl() {
  // Remover o botão existente se houver para evitar duplicatas
  const existingButton = document.getElementById('soundToggle');
  if (existingButton) {
    console.log("Removendo botão de som existente");
    existingButton.remove();
  }
  
  console.log("Criando novo botão de som, estado atual:", soundsEnabled ? "ativado" : "desativado");
  
  // Criar o botão
  const soundButton = document.createElement('button');
  soundButton.id = 'soundToggle';
  
  // Usar ícone SVG em vez de emoji
  soundButton.innerHTML = soundsEnabled 
    ? `<img src="./src/images/icons/playing.svg" alt="Som ativado" class="sound-icon">`
    : `<img src="./src/images/icons/muted.svg" alt="Som desativado" class="sound-icon">`;
    
  soundButton.className = 'sound-button';
  soundButton.title = soundsEnabled ? "Desativar sons" : "Ativar sons";
  soundButton.setAttribute('data-sound-enabled', soundsEnabled.toString());
  
  // Adicionar ao corpo do documento
  document.body.appendChild(soundButton);
  
  // Remover qualquer event listener existente
  soundButton.replaceWith(soundButton.cloneNode(true));
  
  // Obter a referência do novo botão
  const newSoundButton = document.getElementById('soundToggle');
  
  // Adicionar event listener explicitamente
  newSoundButton.addEventListener('click', handleSoundToggle);
  
  // Adicionar estilo para o ícone se ainda não existir
  if (!document.getElementById('sound-icon-style')) {
    const style = document.createElement('style');
    style.id = 'sound-icon-style';
    style.textContent = `
      .sound-icon {
        width: 24px;
        height: 24px;
        filter: invert(1);
      }
    `;
    document.head.appendChild(style);
  }
  
  console.log("Botão de som criado e configurado com eventos");
  
  // Retornar o botão para uso em outros contextos
  return newSoundButton;
}

// Função de manipulação separada para o evento de clique do botão
function handleSoundToggle(event) {
  // Impedir que o evento se propague e o comportamento padrão
  event.stopPropagation();
  event.preventDefault();
  
  // Alternar estado de ativação dos sons
  soundsEnabled = !soundsEnabled;
  
  console.log(`Botão de som CLICADO! Sons ${soundsEnabled ? "ATIVADOS" : "DESATIVADOS"}`);
  
  // Atualizar visual do botão e sons
  updateSoundState();
}

// Função auxiliar para atualizar estados de áudio com base na flag soundsEnabled
function updateSoundState() {
  const soundButton = document.getElementById('soundToggle');
  if (!soundButton) {
    console.error("Botão de som não encontrado!");
    return;
  }
  
  console.log(`Atualizando estado de som para: ${soundsEnabled ? "ativado" : "desativado"}`);
  
  // Atualizar atributos do botão com ícones SVG
  soundButton.innerHTML = soundsEnabled 
    ? `<img src="./src/images/icons/playing.svg" alt="Som ativado" class="sound-icon">`
    : `<img src="./src/images/icons/muted.svg" alt="Som desativado" class="sound-icon">`;
    
  soundButton.title = soundsEnabled ? "Desativar sons" : "Ativar sons";
  soundButton.setAttribute('data-sound-enabled', soundsEnabled.toString());
  
  if (soundsEnabled) {
    // Desmutar os elementos de áudio
    if (backgroundMusic) {
      console.log("Desmutando música de fundo");
      backgroundMusic.muted = false;
      // Tentar reproduzir a música de fundo se não estiver tocando
      if (backgroundMusic.paused) {
        console.log("Tentando reproduzir música de fundo");
        playBackgroundMusic();
      }
    }
    if (perfectSound) perfectSound.muted = false;
    if (fallSound) fallSound.muted = false;
    if (iceSound) iceSound.muted = false;
    
    console.log("Sons ativados com sucesso");
  } else {
    // Pausar música de fundo
    if (backgroundMusic && !backgroundMusic.paused) {
      console.log("Pausando música de fundo");
      backgroundMusic.pause();
    }
    
    // Mutar os elementos de áudio
    if (backgroundMusic) backgroundMusic.muted = true;
    if (perfectSound) perfectSound.muted = true;
    if (fallSound) fallSound.muted = true;
    if (iceSound) iceSound.muted = true;
    
    console.log("Sons desativados com sucesso");
  }
}

// Função para tocar som de congelamento
export function playIceSound() {
  if (!soundsLoaded) {
    loadSounds();
  }
  
  if (soundsEnabled && iceSound) {
    // Se o som já estiver tocando, não tocar novamente
    if (!iceSound.paused) {
      return;
    }
    
    iceSound.currentTime = 0;
    console.log("Tentando reproduzir som de congelamento...");
    iceSound.play().then(() => {
      console.log("Som de congelamento reproduzido com sucesso!");
    }).catch(error => {
      console.error("Erro ao reproduzir som de congelamento:", error);
    });
  }
} 
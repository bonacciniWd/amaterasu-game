// Módulo para gerenciar animações Lottie
let activeAnimations = {};

/**
 * Cria e exibe uma animação Lottie em um container
 * @param {string} containerId - ID do elemento HTML onde a animação será carregada
 * @param {string} animationPath - Caminho para o arquivo JSON da animação
 * @param {object} options - Opções adicionais para a animação
 * @returns {object} - Instância da animação Lottie
 */
export function playLottieAnimation(containerId, animationPath, options = {}) {
  // Verificar se o elemento container existe
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container com ID ${containerId} não encontrado`);
    return null;
  }

  // Verificar se a biblioteca Lottie está disponível
  if (typeof lottie === 'undefined') {
    console.error('Biblioteca Lottie não carregada');
    return null;
  }

  // Configurações padrão
  const defaultOptions = {
    container: container,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: animationPath,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid meet'
    }
  };

  // Mesclar opções padrão com as fornecidas
  const animOptions = { ...defaultOptions, ...options };
  
  try {
    // Carregar e iniciar a animação
    const animation = lottie.loadAnimation(animOptions);
    
    // Armazenar a referência da animação
    activeAnimations[containerId] = animation;
    
    // Log de depuração
    console.log(`Animação Lottie iniciada no container: ${containerId}`);
    
    return animation;
  } catch (error) {
    console.error('Erro ao carregar animação Lottie:', error);
    return null;
  }
}

/**
 * Cria um elemento container para exibir uma animação Lottie como um modal
 * @param {string} animationPath - Caminho para o arquivo JSON da animação
 * @param {object} options - Opções para o modal e animação
 * @returns {object} - Objeto com referências e métodos para controlar o modal
 */
export function createLottieModal(animationPath, options = {}) {
  // Configurações padrão para o modal
  const defaultOptions = {
    width: '300px',
    height: '300px',
    background: 'rgba(0, 0, 0, 0.9)',
    borderRadius: '15px',
    border: '2px solid gold',
    zIndex: 9999,
    closeButtonText: 'Fechar',
    containerId: 'lottieModal_' + Date.now(),
    animationId: 'lottieAnimation_' + Date.now(),
    onClose: null, // Callback quando o modal é fechado
    lottieOptions: {} // Opções específicas para a animação Lottie
  };

  // Mesclar opções
  const modalOptions = { ...defaultOptions, ...options };

  // Criar container principal (modal)
  const modalContainer = document.createElement('div');
  modalContainer.id = modalOptions.containerId;
  modalContainer.style.position = 'fixed';
  modalContainer.style.top = '50%';
  modalContainer.style.left = '50%';
  modalContainer.style.transform = 'translate(-50%, -50%)';
  modalContainer.style.width = modalOptions.width;
  modalContainer.style.height = modalOptions.height;
  modalContainer.style.background = modalOptions.background;
  modalContainer.style.borderRadius = modalOptions.borderRadius;
  modalContainer.style.border = modalOptions.border;
  modalContainer.style.padding = '20px';
  modalContainer.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.5)';
  modalContainer.style.zIndex = modalOptions.zIndex;
  modalContainer.style.display = 'none';
  modalContainer.style.opacity = '0';
  modalContainer.style.transition = 'opacity 0.3s ease';
  modalContainer.style.color = 'white';
  modalContainer.style.textAlign = 'center';

  // Container para a animação Lottie
  const animationContainer = document.createElement('div');
  animationContainer.id = modalOptions.animationId;
  animationContainer.style.width = '100%';
  animationContainer.style.height = 'calc(100% - 50px)'; // Espaço para o botão
  
  // Botão de fechar
  const closeButton = document.createElement('button');
  closeButton.textContent = modalOptions.closeButtonText;
  closeButton.style.marginTop = '15px';
  closeButton.style.padding = '8px 20px';
  closeButton.style.background = 'linear-gradient(45deg, #700, #a00)';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.borderRadius = '20px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontFamily = "'Noto Sans JP', sans-serif";
  closeButton.style.fontSize = '1em';
  closeButton.style.boxShadow = '0 3px 5px rgba(0, 0, 0, 0.3)';
  closeButton.style.transition = 'transform 0.2s ease';
  
  // Efeito hover para o botão
  closeButton.onmouseover = () => {
    closeButton.style.transform = 'translateY(-2px)';
    closeButton.style.boxShadow = '0 5px 10px rgba(0, 0, 0, 0.3)';
  };
  
  closeButton.onmouseout = () => {
    closeButton.style.transform = 'translateY(0)';
    closeButton.style.boxShadow = '0 3px 5px rgba(0, 0, 0, 0.3)';
  };

  // Adicionar elementos ao DOM
  modalContainer.appendChild(animationContainer);
  modalContainer.appendChild(closeButton);
  document.body.appendChild(modalContainer);

  // Referência da animação que será criada quando o modal for exibido
  let animation = null;

  // Função para mostrar o modal com animação
  const show = () => {
    modalContainer.style.display = 'block';
    
    // Pequeno timeout para garantir que a transição funcione
    setTimeout(() => {
      modalContainer.style.opacity = '1';
    }, 10);
    
    // Iniciar a animação Lottie
    animation = playLottieAnimation(modalOptions.animationId, animationPath, modalOptions.lottieOptions);
    
    return animation;
  };

  // Função para esconder o modal
  const hide = () => {
    modalContainer.style.opacity = '0';
    
    // Aguardar a transição terminar antes de remover do DOM
    setTimeout(() => {
      modalContainer.style.display = 'none';
      
      // Destruir a animação para liberar recursos
      if (animation) {
        animation.destroy();
        animation = null;
        delete activeAnimations[modalOptions.animationId];
      }
      
      // Executar callback se fornecido
      if (typeof modalOptions.onClose === 'function') {
        modalOptions.onClose();
      }
    }, 300);
  };

  // Adicionar evento ao botão de fechar
  closeButton.addEventListener('click', hide);

  // Retornar objeto com referências e métodos
  return {
    modalContainer,
    animationContainer,
    closeButton,
    show,
    hide
  };
}

/**
 * Remove uma animação Lottie e limpa os recursos
 * @param {string} containerId - ID do container da animação
 */
export function stopLottieAnimation(containerId) {
  if (activeAnimations[containerId]) {
    activeAnimations[containerId].destroy();
    delete activeAnimations[containerId];
    console.log(`Animação Lottie encerrada no container: ${containerId}`);
  }
}

/**
 * Remove todas as animações Lottie ativas
 */
export function stopAllLottieAnimations() {
  Object.keys(activeAnimations).forEach(containerId => {
    stopLottieAnimation(containerId);
  });
}

// Garantir que todas as animações sejam limpas quando a página for descarregada
window.addEventListener('beforeunload', stopAllLottieAnimations); 
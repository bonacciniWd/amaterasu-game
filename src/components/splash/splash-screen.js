// Componente de Splash Screen usando Lottie para animação
export class SplashScreen {
    constructor(options = {}) {
      this.options = {
        duration: options.duration || 3000, // Duração em ms
        animationPath: options.animationPath || 'https://assets5.lottiefiles.com/packages/lf20_iwmd6pyr.json', // Caminho para animação JSON
        onComplete: options.onComplete || (() => {})
      };
      
      this.animationInstance = null;
      this.container = null;
      this.isPlaying = false;
      this.timerId = null;
    }
    
    // Criar elemento da splash screen
    createSplashScreen() {
      // Container principal
      this.container = document.createElement('div');
      this.container.id = 'splash-screen';
      this.container.style.position = 'fixed';
      this.container.style.top = '0';
      this.container.style.left = '0';
      this.container.style.width = '100%';
      this.container.style.height = '100%';
      this.container.style.backgroundColor = '#000';
      this.container.style.display = 'flex';
      this.container.style.justifyContent = 'center';
      this.container.style.alignItems = 'center';
      this.container.style.zIndex = '9990';
      this.container.style.transition = 'opacity 0.5s ease-out';
      
      // Container para a animação Lottie
      const animationContainer = document.createElement('div');
      animationContainer.id = 'lottie-container';
      animationContainer.style.width = '80%';
      animationContainer.style.maxWidth = '400px';
      animationContainer.style.height = '300px';
      
      this.container.appendChild(animationContainer);
      
      return this.container;
    }
    
    // Iniciar animação
    start() {
      if (this.isPlaying) return;
      
      this.isPlaying = true;
      
      // Verificar se a biblioteca Lottie está disponível
      if (typeof lottie !== 'undefined') {
        console.log('Iniciando animação Lottie');
        
        // Container para a animação
        const animationContainer = document.getElementById('lottie-container');
        
        // Inicializar a animação Lottie
        this.animationInstance = lottie.loadAnimation({
          container: animationContainer,
          renderer: 'svg', // 'svg', 'canvas' ou 'html'
          loop: true,
          autoplay: true,
          path: this.options.animationPath,
          rendererSettings: {
            progressiveLoad: true, // Carregamento progressivo para melhor desempenho
            preserveAspectRatio: 'xMidYMid meet'
          }
        });
        
        // Aguardar a duração definida e depois chamar o callback
        this.timerId = setTimeout(() => {
          this.hide();
        }, this.options.duration);
      } else {
        console.error('Biblioteca Lottie não encontrada. Usando fallback.');
        this.drawFallbackAnimation();
      }
    }
    
    // Animação de fallback caso Lottie não esteja disponível
    drawFallbackAnimation() {
      // Criar um canvas para o fallback
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 200;
      canvas.style.margin = 'auto';
      document.getElementById('lottie-container').appendChild(canvas);
      
      const ctx = canvas.getContext('2d');
      
      const drawProgress = () => {
        if (!this.isPlaying) return;
        
        const now = Date.now();
        const progress = (now % 2000) / 2000; // 0 a 1 a cada 2 segundos
        
        // Limpar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Desenhar texto
        const text = 'Amaterasu';
        ctx.font = 'bold 32px "Cinzel", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Efeito de pulsação
        const size = 32 + Math.sin(progress * Math.PI * 2) * 5;
        ctx.font = `bold ${size}px "Cinzel", serif`;
        
        // Gradiente
        const gradient = ctx.createLinearGradient(
          0, canvas.height / 2 - 20,
          0, canvas.height / 2 + 20
        );
        gradient.addColorStop(0, '#ff9d00');
        gradient.addColorStop(0.5, '#ffcc00');
        gradient.addColorStop(1, '#ff9d00');
        
        ctx.fillStyle = gradient;
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // Solicitar próximo quadro
        requestAnimationFrame(drawProgress);
      };
      
      drawProgress();
      
      // Usar o timer normal para esconder
      this.timerId = setTimeout(() => {
        this.hide();
      }, this.options.duration);
    }
    
    // Esconder e remover a splash screen
    hide() {
      if (!this.isPlaying) return;
      this.isPlaying = false;
      
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
      
      // Parar a animação Lottie se estiver ativa
      if (this.animationInstance) {
        this.animationInstance.stop();
        this.animationInstance.destroy();
        this.animationInstance = null;
      }
      
      // Efeito de fade out
      if (this.container) {
        this.container.style.opacity = '0';
        
        // Remover após a transição
        setTimeout(() => {
          if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
          }
          this.options.onComplete();
        }, 500); // Corresponde ao tempo da transição CSS
      }
    }
  }
  
  // Exportar instância
  export const splashScreen = new SplashScreen(); 
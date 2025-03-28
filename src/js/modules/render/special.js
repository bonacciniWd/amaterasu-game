// Módulo para elementos especiais (dragão, raios de gelo, etc)
import { 
  dragonY, dragonDirection, iceRays, lastRandomFreezeTime,
  gameConfig, heroX, heroY, sceneOffset, canvasHeight, clouds, phase,
  setDragonY, setDragonDirection, setIceRays, setLastRandomFreezeTime,
  updateClouds
} from '../config.js';
import { generateIceRay, generateSnowflakes } from '../entities.js';
import { playIceSound } from '../audio.js';

// Imagens
let dragonImage = new Image();
dragonImage.src = 'src/images/drag.png';

// Função para animar o dragão
export function drawDragon(ctx) {
  if (!dragonImage.complete) return; // Verifica se a imagem foi carregada
  
  // Atualizar posição do dragão usando as funções setter
  const newDragonY = dragonY + 0.3 * dragonDirection;
  setDragonY(newDragonY);
  
  if (dragonY > 110) setDragonDirection(-1); // Aumentado de 100 para 110
  if (dragonY < 90) setDragonDirection(1);   // Aumentado de 80 para 90
  
  // Aumentando as dimensões do dragão em 40px
  const dragonWidth = 120; // Antes era 80
  const dragonHeight = 100; // Antes era 60
  
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  
  const scaleValue = 1 + Math.sin(Date.now() * 0.001) * 0.05;
  const dragonScreenX = window.innerWidth - dragonWidth - 20;
  
  ctx.translate(dragonScreenX, dragonY);
  ctx.scale(scaleValue, scaleValue);
  
  ctx.drawImage(
    dragonImage, 
    -dragonWidth/2, 
    -dragonHeight/2, 
    dragonWidth, 
    dragonHeight
  );
  
  // Verificar se deve gerar raio aleatório a cada 8 segundos (era 10 segundos)
  const currentTime = Date.now();
  if (currentTime - lastRandomFreezeTime > 8000) { // Reduzido de 10000 para 8000
    // Atualizar o timestamp da última vez que gerou um raio
    setLastRandomFreezeTime(currentTime);
    
    // Gerar múltiplos raios em direções diferentes (feixe de raios)
    const numRays = 2 + Math.floor(Math.random() * 2); // 2 a 3 raios
    
    // Definir ângulos específicos para melhor cobertura
    const angles = [];
    
    // Sempre incluir um raio para baixo (diretamente para o jogador)
    angles.push(Math.PI/2 + Math.random() * 0.2 - 0.1); // ~90° com pequena variação
    
    // Sempre incluir um raio diagonal para baixo-esquerda
    angles.push(Math.PI/2 + Math.PI/4 + Math.random() * 0.2 - 0.1); // ~135° com pequena variação
    
    // Se tivermos um terceiro raio, direcioná-lo mais para a esquerda
    if (numRays > 2) {
      angles.push(Math.PI + Math.random() * 0.3 - 0.15); // ~180° com pequena variação
    }
    
    // Usar os ângulos calculados para gerar os raios
    for (let i = 0; i < numRays; i++) {
      setIceRays([...iceRays, {
        x: dragonScreenX,
        y: dragonY,
        angle: angles[i],
        length: 0,
        maxLength: 200 + Math.random() * 200,
        speed: 6 + Math.random() * 4,
        width: 3 + Math.random() * 3,
        active: true
      }]);
    }
    
    // Apontar raio de gelo diretamente para o herói com 35% de chance (era 60%)
    if (phase !== "falling" && phase !== "waiting" && Math.random() < 0.35) { // 35% de chance
      const heroScreenX = heroX - sceneOffset;
      const heroScreenY = canvasHeight - gameConfig.platformHeight - gameConfig.heroHeight / 2;
      
      // Calcular ângulo para o herói
      const dx = heroScreenX - dragonScreenX;
      const dy = heroScreenY - dragonY;
      
      // Não atirar no herói se ele estiver muito à direita
      if (dx > 0 && Math.abs(dx) > window.innerWidth * 0.3) {
        // Neste caso, não atiramos - herói está muito à direita
        return;
      }
      
      // Calcular o ângulo correto para o herói
      const angle = Math.atan2(dy, dx);
      
      // Se o herói estiver à direita, ajustar o tiro para direcionar para a esquerda ou para baixo
      let targetAngle = angle;
      if (dx > 0) { // Herói à direita
        // Direcionar para baixo com tendência leve para a esquerda
        targetAngle = Math.PI/2 - Math.random() * 0.2;
      }
      
      // Gerar raio direcionado ao herói
      setIceRays([...iceRays, {
        x: dragonScreenX,
        y: dragonY,
        angle: targetAngle,
        length: 0,
        maxLength: Math.sqrt(dx*dx + dy*dy) + 100,
        speed: 7 + Math.random() * 3,
        width: 4 + Math.random() * 3,
        active: true,
        targetHero: true
      }]);
    }
  }
  
  // Adicionar raios de gelo aleatoriamente (com menor frequência)
  if (Math.random() < 0.005) { // Reduzido de 0.01 para 0.005 (0.5% de chance por frame)
    const newIceRays = generateIceRay(dragonScreenX, dragonY);
    setIceRays([...iceRays, ...newIceRays]);
  }
  
  // Desenhar raios de gelo existentes
  drawIceRays(ctx);
  
  // Verificar colisões dos raios com entidades
  checkIceRayCollisions(ctx);
  
  // Restaurar o contexto original
  ctx.restore();
}

// Função para desenhar raios de gelo
export function drawIceRays(ctx) {
  ctx.save();
  
  // Resetar transformações para desenhar em coordenadas absolutas
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  
  iceRays.forEach((ray, index) => {
    if (!ray.active) return;
    
    // Aumentar o comprimento do raio
    ray.length += ray.speed;
    
    // Verificar se o raio atingiu seu comprimento máximo
    if (ray.length >= ray.maxLength) {
      ray.active = false;
      return;
    }
    
    // Calcular as coordenadas finais do raio
    const endX = ray.x + Math.cos(ray.angle) * ray.length;
    const endY = ray.y + Math.sin(ray.angle) * ray.length;
    
    // Criar um gradiente para o raio
    const gradient = ctx.createLinearGradient(ray.x, ray.y, endX, endY);
    
    if (ray.targetHero) {
      // Raio direcionado ao herói é mais intenso - tom mais azulado
      gradient.addColorStop(0, "rgba(65, 105, 225, 1.0)"); // Azul royal
      gradient.addColorStop(0.5, "rgba(100, 149, 237, 0.9)"); // Azul cornflower
      gradient.addColorStop(1, "rgba(176, 224, 230, 0.7)"); // Pó de azul claro
    } else {
      // Raio normal - tom mais azulado
      gradient.addColorStop(0, "rgba(70, 130, 180, 0.9)"); // Azul aço
      gradient.addColorStop(1, "rgba(135, 206, 250, 0.2)"); // Azul céu claro
    }
    
    // Desenhar o raio
    ctx.beginPath();
    ctx.moveTo(ray.x, ray.y);
    ctx.lineTo(endX, endY);
    ctx.lineWidth = ray.targetHero ? ray.width * 1.8 : ray.width * 1.2;
    ctx.strokeStyle = gradient;
    ctx.stroke();
    
    // Adicionar brilho no início do raio
    ctx.beginPath();
    ctx.arc(ray.x, ray.y, ray.width * 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(135, 206, 235, 0.8)"; // Azul céu
    ctx.fill();
    
    // Adicionar efeito de pulsação na ponta do raio para os raios direcionados
    if (ray.targetHero) {
      const pulseSize = 3 + Math.sin(Date.now() * 0.01) * 2;
      ctx.beginPath();
      ctx.arc(endX, endY, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(100, 149, 237, 0.7)"; // Azul cornflower
      ctx.fill();
    }
  });
  
  // Verificar colisões dos raios com entidades (nuvens e herói)
  checkIceRayCollisions(ctx);
  
  // Remover raios inativos
  setIceRays(iceRays.filter(ray => ray.active));
  
  ctx.restore();
}

// Função para verificar colisões dos raios com entidades
export function checkIceRayCollisions(ctx) {
  // Verificar colisões com nuvens
  let newClouds = [...clouds];
  let cloudsChanged = false;
  
  clouds.forEach((cloud, index) => {
    if (cloud.frozen) return; // Já está congelada
    
    iceRays.forEach(ray => {
      if (!ray.active || ray.targetHero) return; // Ignorar raios inativos ou direcionados ao herói
      
      // Calcular coordenadas finais do raio
      const endX = ray.x + Math.cos(ray.angle) * ray.length;
      const endY = ray.y + Math.sin(ray.angle) * ray.length;
      
      // Verificar colisão com a nuvem
      const dx = cloud.x - endX;
      const dy = cloud.y - endY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < cloud.width / 1.5) { // Aumentado a área de colisão (era cloud.width / 2)
        // Congelar a nuvem
        newClouds[index] = {
          ...cloud,
          frozen: true,
          originalSpeed: cloud.speed,
          speed: cloud.speed * 0.2,
          frozenTime: Date.now(),
          snowflakes: generateSnowflakes(cloud.x, cloud.y, cloud.width)
        };
        cloudsChanged = true;
        
        // Desativar o raio
        const newRays = [...iceRays];
        newRays.find(r => r === ray).active = false;
        setIceRays(newRays);
      }
    });
  });
  
  // Atualizar nuvens se alguma mudou
  if (cloudsChanged) {
    updateClouds(newClouds);
  }
  
  // Verificar colisão com o herói
  const heroScreenX = heroX - sceneOffset;
  const heroScreenY = canvasHeight - gameConfig.platformHeight - gameConfig.heroHeight / 2;
  
  iceRays.forEach(ray => {
    if (!ray.active) return;
    
    // Se o herói estiver com imunidade temporária, ignorar colisões
    if (window.heroIsImmune) return;
    
    // Calcular coordenadas finais do raio
    const endX = ray.x + Math.cos(ray.angle) * ray.length;
    const endY = ray.y + Math.sin(ray.angle) * ray.length;
    
    // Aumentar a área de colisão e usar a posição na tela do herói
    const dx = heroScreenX - endX;
    const dy = heroScreenY - endY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const collisionRadius = gameConfig.heroWidth * 2.2; // Reduzido de 3.3 para 2.2
    
    if (distance < collisionRadius) {
      // Congelar o herói se ainda não estiver congelado
      if (!window.heroFrozen) {
        window.heroFrozen = true;
        window.heroFrozenTime = Date.now();
        // Adicionar tempo de imunidade após descongelar
        window.heroImmunityTime = 10000; // 10 segundos de imunidade após descongelar (era 5 segundos)
        
        // Reproduzir o som de congelamento
        playIceSound();
        
        // Gerar flocos usando a mesma posição do corpo
        window.heroSnowflakes = generateSnowflakes(
          heroX - gameConfig.heroWidth / 2 - 10, // 10px para esquerda
          heroScreenY - 8, // 8px para cima
          gameConfig.heroWidth * 2.5 // Reduzido de 3.3 para 2.5
        );
        
        // Desativar o raio
        const newRays = [...iceRays];
        newRays.find(r => r === ray).active = false;
        setIceRays(newRays);
      }
    }
  });
} 
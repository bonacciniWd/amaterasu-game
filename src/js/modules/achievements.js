// Módulo de gerenciamento de conquistas (achievements) para o jogo Amaterasu

/**
 * Lista de todas as conquistas disponíveis no jogo
 * Cada conquista possui um ID único, nome, descrição, caminho da imagem da badge e pontuação necessária
 */
export const ACHIEVEMENTS = [
  { 
    id: 'first_play', 
    name: 'Primeiro Passo', 
    description: 'Jogar pela primeira vez', 
    badge: './src/images/badges/first-step.webp', 
    requiredScore: 1 
  },
  { 
    id: 'score_50', 
    name: 'Iniciante', 
    description: 'Alcançar 50 pontos', 
    badge: './src/images/badges/begineer.webp', 
    requiredScore: 50 
  },
  { 
    id: 'score_100', 
    name: 'Aprendiz', 
    description: 'Alcançar 100 pontos', 
    badge: './src/images/badges/aprentice.webp', 
    requiredScore: 100 
  },
  { 
    id: 'score_250', 
    name: 'Guerreiro', 
    description: 'Alcançar 250 pontos', 
    badge: './src/images/badges/warrior.webp', 
    requiredScore: 250 
  },
  { 
    id: 'score_500', 
    name: 'Mestre', 
    description: 'Alcançar 500 pontos', 
    badge: './src/images/badges/master.webp', 
    requiredScore: 500 
  },
  { 
    id: 'score_1000', 
    name: 'Lendário', 
    description: 'Alcançar 1000 pontos', 
    badge: './src/images/badges/legendary.webp', 
    requiredScore: 1000 
  },
  { 
    id: 'score_2000', 
    name: 'Divino', 
    description: 'Alcançar 2000 pontos', 
    badge: './src/images/badges/divine.webp', 
    requiredScore: 2000 
  },
  { 
    id: 'score_3000', 
    name: 'Berserker', 
    description: 'Alcançar 3000 pontos', 
    badge: './src/images/badges/berserker.webp', 
    requiredScore: 3000 
  },
  { 
    id: 'score_5000', 
    name: 'Sagrado', 
    description: 'Alcançar 5000 pontos', 
    badge: './src/images/badges/holy.webp', 
    requiredScore: 5000 
  }
];

/**
 * Verifica quais conquistas o usuário desbloqueou com base na pontuação
 * @param {number} score - Pontuação atual do usuário
 * @returns {Array} Lista de conquistas com flag de desbloqueio
 */
export function getUserAchievements(score) {
  return ACHIEVEMENTS.map(achievement => ({
    ...achievement,
    unlocked: score >= achievement.requiredScore
  }));
}

/**
 * Salva as conquistas desbloqueadas no Firebase
 * @param {string} userId - ID do usuário
 * @param {number} score - Pontuação atual
 * @returns {Promise<void>}
 */
export async function saveUserAchievements(userId, score) {
  try {
    if (!firebase || !firebase.database) {
      console.error('Firebase não está disponível');
      return;
    }
    
    const db = firebase.database();
    const achievementsRef = db.ref(`users/${userId}/achievements`);
    
    // Obter conquistas desbloqueadas
    const unlockedAchievements = ACHIEVEMENTS
      .filter(achievement => score >= achievement.requiredScore)
      .map(achievement => achievement.id);
    
    // Salvar no Firebase com timestamp
    await achievementsRef.set({
      unlockedAchievements,
      lastUpdated: Date.now()
    });
    
    console.log(`Conquistas atualizadas para o usuário ${userId}`);
  } catch (error) {
    console.error('Erro ao salvar conquistas:', error);
  }
}

/**
 * Verifica se o usuário desbloqueou novas conquistas após uma pontuação
 * @param {string} userId - ID do usuário
 * @param {number} score - Nova pontuação
 * @returns {Promise<Array>} Lista de novas conquistas desbloqueadas
 */
export async function checkNewAchievements(userId, score) {
  try {
    if (!firebase || !firebase.database) {
      return [];
    }
    
    const db = firebase.database();
    const achievementsRef = db.ref(`users/${userId}/achievements`);
    const snapshot = await achievementsRef.once('value');
    const data = snapshot.val() || { unlockedAchievements: [] };
    
    const previouslyUnlocked = data.unlockedAchievements || [];
    
    // Encontrar novas conquistas desbloqueadas
    const newlyUnlocked = ACHIEVEMENTS
      .filter(achievement => score >= achievement.requiredScore && !previouslyUnlocked.includes(achievement.id));
    
    // Se houver novas conquistas, atualizar no Firebase
    if (newlyUnlocked.length > 0) {
      await saveUserAchievements(userId, score);
    }
    
    return newlyUnlocked;
  } catch (error) {
    console.error('Erro ao verificar novas conquistas:', error);
    return [];
  }
}

/**
 * Exibe um componente visual para mostrar conquistas desbloqueadas
 * @param {HTMLElement} container - Elemento onde as conquistas serão exibidas
 * @param {Array} achievements - Lista de conquistas com status de desbloqueio
 * @returns {void}
 */
export function renderAchievements(container, achievements) {
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!achievements || achievements.length === 0) {
    container.innerHTML = `
      <div class="no-data">
        <p>Você ainda não desbloqueou nenhuma conquista.</p>
        <p>Continue jogando para ganhar conquistas!</p>
      </div>
    `;
    return;
  }
  
  let hasUnlockedAchievements = false;
  
  achievements.forEach(achievement => {
    if (achievement.unlocked) {
      hasUnlockedAchievements = true;
    }
    
    const achievementElement = document.createElement('div');
    achievementElement.className = `achievement ${achievement.unlocked ? 'unlocked' : ''}`;
    
    achievementElement.innerHTML = `
      <div class="achievement-icon">
        <img src="${achievement.badge}" alt="${achievement.name}" class="badge-image">
      </div>
      <div class="achievement-name">${achievement.name}</div>
      <div class="achievement-desc">${achievement.description}</div>
    `;
    
    container.appendChild(achievementElement);
  });
  
  if (!hasUnlockedAchievements) {
    const noAchievementsElement = document.createElement('div');
    noAchievementsElement.className = 'no-data';
    noAchievementsElement.innerHTML = `
      <p>Você ainda não desbloqueou nenhuma conquista.</p>
      <p>Continue jogando para ganhar conquistas!</p>
    `;
    container.appendChild(noAchievementsElement);
  }
}

/**
 * Mostra uma notificação temporária de conquista desbloqueada
 * @param {Object} achievement - Dados da conquista desbloqueada
 * @returns {void}
 */
export function showAchievementNotification(achievement) {
  if (!achievement) return;
  
  // Criar elemento de notificação
  const notification = document.createElement('div');
  notification.className = 'achievement-notification';
  notification.innerHTML = `
    <div class="achievement-notification-icon">
      <img src="${achievement.badge}" alt="${achievement.name}" class="badge-image">
    </div>
    <div class="achievement-notification-content">
      <div class="achievement-notification-title">Conquista Desbloqueada!</div>
      <div class="achievement-notification-name">${achievement.name}</div>
      <div class="achievement-notification-desc">${achievement.description}</div>
    </div>
  `;
  
  // Adicionar ao DOM
  document.body.appendChild(notification);
  
  // Aplicar animação
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Remover após 5 segundos
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 5000);
} 
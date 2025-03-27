/**
 * Serviço de API para o jogo Amaterasu
 * Gerencia todas as requisições ao backend
 */

import { getAuthToken, isAuthenticated } from './firebase.js';
import { getDeviceInfo } from './utils.js';

// URL base da API
// Detectar ambiente: usar endpoint de produção se não estiver em localhost
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BASE_API_URL = isLocalhost 
  ? 'http://localhost:3000/api'
  : 'https://api.amaterasu-game.com/api'; // Substitua pela URL de produção real

/**
 * Helper para fazer requisições autenticadas
 * @param {string} endpoint - Endpoint da API
 * @param {Object} options - Opções da requisição
 * @returns {Promise<Object>} Resposta da API
 */
async function fetchWithAuth(endpoint, options = {}) {
  if (!isAuthenticated()) {
    throw new Error('Usuário não autenticado');
  }
  
  try {
    const token = await getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };
    
    // Tenta fazer a requisição, mas com um timeout de 2 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`${BASE_API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao acessar ${endpoint}:`, error);
    
    // Se for erro de conexão recusada ou timeout, retorna dados simulados
    if (error.name === 'AbortError' || 
        (error instanceof TypeError && error.message.includes('Failed to fetch'))) {
      console.warn('Servidor não disponível, usando dados de fallback');
      return getFallbackData(endpoint);
    }
    
    throw error;
  }
}

/**
 * Helper para fazer requisições públicas (sem autenticação)
 * @param {string} endpoint - Endpoint da API
 * @param {Object} options - Opções da requisição
 * @returns {Promise<Object>} Resposta da API
 */
async function fetchPublic(endpoint, options = {}) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Tenta fazer a requisição, mas com um timeout de 2 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`${BASE_API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao acessar ${endpoint}:`, error);
    
    // Se for erro de conexão recusada ou timeout, retorna dados simulados
    if (error.name === 'AbortError' || 
        (error instanceof TypeError && error.message.includes('Failed to fetch'))) {
      console.warn('Servidor não disponível, usando dados de fallback para endpoint público');
      return getFallbackData(endpoint);
    }
    
    throw error;
  }
}

/**
 * Salva uma pontuação no servidor
 * @param {number} score - Pontuação a ser salva
 * @param {Object} options - Opções adicionais (device, etc)
 * @returns {Promise<Object>} Resultado com posição no ranking
 */
export async function saveScore(score, options = {}) {
  const device = options.device || getDeviceInfo();
  
  return fetchWithAuth('/scores', {
    method: 'POST',
    body: JSON.stringify({
      score,
      device,
      date: new Date().toISOString()
    })
  });
}

/**
 * Obtém o histórico de pontuações do usuário atual
 * @param {number} limit - Limite de resultados
 * @returns {Promise<Array>} Lista de pontuações
 */
export async function getUserScores(limit = 10) {
  return fetchWithAuth(`/scores/user?limit=${limit}`);
}

/**
 * Obtém a melhor pontuação do usuário atual
 * @returns {Promise<Object>} Melhor pontuação e posição no ranking
 */
export async function getUserBestScore() {
  try {
    // Primeiro, tentar obter do servidor API
    const result = await fetchWithAuth('/scores/user/best');
    console.log('Pontuação obtida pela API normal:', result);
    return result;
  } catch (apiError) {
    console.log('API não disponível para obter pontuação, usando Firebase direto:', apiError);
    
    // Fallback: obter diretamente do Firebase
    try {
      if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase não disponível para fallback');
        return { bestScore: 0, position: '-' };
      }
      
      // Obter dados do usuário atual
      const auth = firebase.auth();
      if (!auth.currentUser) {
        console.error('Usuário não autenticado para obter melhor pontuação');
        return { bestScore: 0, position: '-' };
      }
      
      const userId = auth.currentUser.uid;
      const db = firebase.database();
      
      // Verificar fontes múltiplas para a pontuação
      let bestScore = 0;
      let scoreSource = 'default';
      
      // 1. Verificar nas estatísticas do usuário (estrutura nova)
      const statsRef = db.ref(`users/${userId}/stats`);
      const statsSnapshot = await statsRef.once('value');
      const stats = statsSnapshot.val() || {};
      
      if (stats && stats.bestScore !== undefined) {
        bestScore = stats.bestScore;
        scoreSource = 'stats';
        console.log(`Pontuação obtida das estatísticas: ${bestScore}`);
      } else {
        // 2. Verificar no perfil do usuário (para compatibilidade)
        const profileRef = db.ref(`users/${userId}/profile`);
        const profileSnapshot = await profileRef.once('value');
        const profile = profileSnapshot.val() || {};
        
        if (profile && profile.bestScore !== undefined) {
          bestScore = profile.bestScore;
          scoreSource = 'profile';
          console.log(`Pontuação obtida do perfil: ${bestScore}`);
        } else {
          // 3. Verificar nas pontuações individuais
          console.log('Pontuação não encontrada nas estatísticas nem no perfil, buscando das pontuações individuais');
          
          // Ler pontuações e encontrar a melhor
          const scoresRef = db.ref(`users/${userId}/scores`).orderByChild('score').limitToLast(1);
          const scoresSnapshot = await scoresRef.once('value');
          
          scoresSnapshot.forEach((childSnapshot) => {
            const scoreData = childSnapshot.val();
            if (scoreData && scoreData.score > bestScore) {
              bestScore = scoreData.score;
              scoreSource = 'scores';
            }
          });
        }
      }
      
      // Calcular posição no ranking
      let position = '-';
      
      try {
        // Buscar todos os usuários com suas estatísticas
        const usersRef = db.ref('users');
        const usersSnapshot = await usersRef.once('value');
        
        // Coletar pontuações de todos os usuários
        const allScores = [];
        
        usersSnapshot.forEach((userSnapshot) => {
          const userData = userSnapshot.val() || {};
          let userScore = 0;
          
          // Verificar múltiplas fontes de pontuação
          if (userData.stats && userData.stats.bestScore !== undefined) {
            userScore = userData.stats.bestScore;
          } else if (userData.profile && userData.profile.bestScore !== undefined) {
            userScore = userData.profile.bestScore;
          }
          
          if (userScore > 0) {
            allScores.push(userScore);
          }
        });
        
        if (allScores.length > 0) {
          // Ordenar pontuações (maiores primeiro)
          allScores.sort((a, b) => b - a);
          
          // Encontrar a posição
          const posIndex = allScores.findIndex(s => s === bestScore);
          if (posIndex !== -1) {
            position = String(posIndex + 1);
          }
        } else if (bestScore > 0) {
          position = '1'; // Se não há outras pontuações mas o usuário tem pontuação, ele é o primeiro
        }
      } catch (rankError) {
        console.error('Erro ao calcular posição no ranking:', rankError);
      }
      
      console.log(`Melhor pontuação: ${bestScore} (fonte: ${scoreSource}), posição: ${position}`);
      return {
        bestScore: bestScore,
        position: position
      };
    } catch (fbError) {
      console.error('Erro ao obter melhor pontuação do Firebase:', fbError);
      return { bestScore: 0, position: '-' };
    }
  }
}

/**
 * Calcula a posição do usuário no ranking global
 * @param {number} score - Pontuação a ser verificada
 * @returns {Promise<string>} Posição no ranking
 */
async function calculateRankingPosition(score) {
  try {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      return '-';
    }
    
    const db = firebase.database();
    const rankingsRef = db.ref('rankings');
    const rankingsSnapshot = await rankingsRef.once('value');
    
    // Converter em lista de pontuações
    const scoresList = [];
    rankingsSnapshot.forEach((childSnapshot) => {
      const rankingData = childSnapshot.val();
      if (rankingData && rankingData.score) {
        scoresList.push(rankingData.score);
      }
    });
    
    // Ordenar pontuações (maiores primeiro)
    scoresList.sort((a, b) => b - a);
    
    // Encontrar posição
    const position = scoresList.findIndex(s => s === score);
    if (position === -1) {
      // A pontuação não está na lista
      return '-';
    }
    
    // As posições são baseadas em 1 (não em 0)
    return String(position + 1);
  } catch (error) {
    console.error('Erro ao calcular posição no ranking:', error);
    return '-';
  }
}

/**
 * Obtém o perfil do usuário atual
 * @returns {Promise<Object>} Dados do perfil
 */
export async function getUserProfile() {
  try {
    // Primeiro, tentar obter do servidor API
    const result = await fetchWithAuth('/user/profile');
    return result;
  } catch (apiError) {
    console.log('API não disponível para obter perfil, usando Firebase direto:', apiError);
    
    // Fallback: obter diretamente do Firebase
    try {
      if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase não disponível para fallback');
        return { 
          name: 'Usuário Offline', 
          avatar: null, 
          email: 'offline@exemplo.com',
          userId: 'offline-user' 
        };
      }
      
      // Obter dados do usuário atual
      const auth = firebase.auth();
      if (!auth.currentUser) {
        console.error('Usuário não autenticado para obter perfil');
        return { 
          name: 'Usuário Offline', 
          avatar: null, 
          email: 'offline@exemplo.com',
          userId: 'offline-user' 
        };
      }
      
      const userId = auth.currentUser.uid;
      const db = firebase.database();
      
      // Ler perfil do usuário
      const profileRef = db.ref(`users/${userId}/profile`);
      const profileSnapshot = await profileRef.once('value');
      const profile = profileSnapshot.val() || {};
      
      // Ler estatísticas
      const statsRef = db.ref(`users/${userId}/stats`);
      const statsSnapshot = await statsRef.once('value');
      const stats = statsSnapshot.val() || {};
      
      // Combinar dados
      return {
        name: profile.name || auth.currentUser.displayName || 'Ninja',
        avatar: profile.photoURL || auth.currentUser.photoURL,
        email: auth.currentUser.email,
        userId: userId,
        stats: {
          bestScore: stats.bestScore || 0,
          totalGames: stats.totalGames || 0
        }
      };
    } catch (fbError) {
      console.error('Erro ao obter perfil do Firebase:', fbError);
      return { 
        name: 'Usuário Offline', 
        avatar: null, 
        email: 'offline@exemplo.com',
        userId: 'offline-user' 
      };
    }
  }
}

/**
 * Atualiza o perfil do usuário atual
 * @param {Object} data - Dados a serem atualizados
 * @returns {Promise<Object>} Perfil atualizado
 */
export async function updateUserProfile(data) {
  return fetchWithAuth('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * Verifica o status do servidor
 * @returns {Promise<Object>} Informações sobre o status do servidor
 */
export async function checkServerStatus() {
  try {
    // Tenta fazer uma requisição simples com timeout curto
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    
    const response = await fetch(`${BASE_API_URL}/test`, {
      method: 'GET',
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));
    
    if (response.ok) {
      return { online: true, message: 'Servidor online' };
    } else {
      return { online: false, message: 'Servidor retornou erro' };
    }
  } catch (error) {
    console.warn('Servidor não disponível:', error.message);
    return { online: false, message: error.message };
  }
}

/**
 * Inicializa o banco de dados com dados de teste (apenas para desenvolvimento)
 * @returns {Promise<Object>} Resultado da inicialização
 */
export async function initTestDatabase() {
  try {
    return await fetchPublic('/init-db');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

/**
 * Obtém as estatísticas globais do jogo
 * @returns {Promise<Object>} Estatísticas globais
 */
export async function getGameStats() {
  return fetchPublic('/stats');
}

/**
 * Envia feedback ou relatório de erro
 * @param {Object} data - Dados do feedback
 * @returns {Promise<Object>} Confirmação do envio
 */
export async function sendFeedback(data) {
  return fetchWithAuth('/feedback', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Marca conquista como desbloqueada
 * @param {string} achievementId - ID da conquista
 * @returns {Promise<Object>} Conquista atualizada
 */
export async function unlockAchievement(achievementId) {
  return fetchWithAuth(`/achievements/${achievementId}/unlock`, {
    method: 'POST'
  });
}

/**
 * Obtém todas as conquistas do usuário
 * @returns {Promise<Array>} Lista de conquistas
 */
export async function getUserAchievements() {
  return fetchWithAuth('/achievements/user');
}

// Dados de fallback para quando o servidor não estiver disponível
function getFallbackData(endpoint) {
  // Mapeia endpoints para dados de fallback
  const fallbackMap = {
    '/scores/user/best': { bestScore: 0, position: '-' },
    '/user/profile': { 
      name: 'Usuário Offline', 
      avatar: null, 
      email: 'offline@exemplo.com',
      userId: 'offline-user' 
    },
    '/scores/user': [],
    '/ranking': []
  };
  
  // Verificar se o usuário está autenticado
  if (typeof firebase !== 'undefined' && firebase.apps.length && firebase.auth().currentUser) {
    // Se estiver autenticado, personalizar os dados de fallback
    const user = firebase.auth().currentUser;
    
    if (endpoint === '/user/profile') {
      return {
        name: user.displayName || 'Ninja',
        avatar: user.photoURL,
        email: user.email,
        userId: user.uid,
        stats: {
          bestScore: 0,
          totalGames: 0
        }
      };
    }
  }
  
  // Retorna os dados correspondentes ou um objeto vazio
  return fallbackMap[endpoint] || {};
} 
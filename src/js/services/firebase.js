/**
 * Serviço de autenticação Firebase para o jogo Amaterasu
 */

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDzrt3PWm1w38I4n3AZuUMIwjvKFXaVoGg",
    authDomain: "music-art-djg389.firebaseapp.com",
    databaseURL: "https://music-art-djg389-default-rtdb.firebaseio.com",
    projectId: "music-art-djg389",
    storageBucket: "music-art-djg389.firebasestorage.app",
    messagingSenderId: "548735106022",
    appId: "1:548735106022:web:33cf29b68a8b7f3fb7b427"
};

// Verificar se o Firebase está disponível e inicializá-lo
let firebaseAvailable = false;
let auth;
let database;

try {
  console.log('Verificando disponibilidade do Firebase no módulo firebase.js...');
  
  // Verificar se o Firebase foi inicializado globalmente
  if (typeof window !== 'undefined') {
    if (window.firebaseDatabaseAvailable === true) {
      console.log('Firebase Database já foi confirmado como disponível no escopo global');
      firebaseAvailable = true;
    } else if (window.firebaseDatabaseUnavailable === true) {
      console.log('Firebase Database já foi confirmado como indisponível no escopo global');
      firebaseAvailable = false;
    }
  }
  
  if (typeof firebase === 'undefined') {
    console.error('O objeto Firebase não está definido. Os scripts do Firebase não foram carregados corretamente.');
    firebaseAvailable = false;
  } else {
    console.log('Firebase está disponível, verificando inicialização...');
    
    // Verifica se o Firebase já foi inicializado
    if (!firebase.apps || !firebase.apps.length) {
      console.log('Firebase ainda não foi inicializado, inicializando no módulo firebase.js...');
      try {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase inicializado com sucesso no módulo firebase.js');
      } catch (initError) {
        console.error('Erro ao inicializar Firebase no módulo firebase.js:', initError);
      }
    } else {
      console.log('Firebase já estava inicializado anteriormente');
    }
    
    // Verificar se o Firebase Auth está disponível
    if (typeof firebase.auth === 'function') {
      try {
        auth = firebase.auth();
        console.log('Firebase Auth inicializado com sucesso');
      } catch (authError) {
        console.error('Erro ao inicializar Firebase Auth:', authError);
        auth = createMockAuth();
      }
    } else {
      console.error('Firebase Auth não está disponível');
      auth = createMockAuth();
    }
    
    // Tentar usar o Database do escopo global primeiro
    if (typeof firebase.database === 'function') {
      try {
        console.log('Tentando inicializar Firebase Database...');
        
        // Garantir que a inicialização foi feita
        if (!firebase.apps || !firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
          console.log('Firebase inicializado antes de acessar Database');
        }
        
        // Se o firebase.database() está disponível, usamos diretamente
        database = firebase.database();
        
        // Testar se o database realmente funciona
        if (database && typeof database.ref === 'function') {
          // Teste de uma referência para confirmar que está funcionando
          const testRef = database.ref('test');
          console.log('Firebase Database inicializado com sucesso e testado:', testRef ? 'Referência OK' : 'Referência falhou');
          firebaseAvailable = true;
        } else {
          console.error('Firebase Database inicializado mas método ref não está disponível');
          database = createMockDatabase();
        }
      } catch (dbError) {
        console.error('Erro ao inicializar Firebase Database:', dbError);
        database = createMockDatabase();
      }
    } else {
      console.error('Firebase Database não está disponível como função');
      console.log('Tentando importar Database de outro modo...');
      
      // Verificar se estamos em um navegador
      if (typeof window !== 'undefined') {
        // Tentar forçar o carregamento
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/firebasejs/9.6.10/firebase-database-compat.js';
        script.onload = function() {
          console.log('Script Firebase Database carregado dinamicamente');
          
          // Tenta inicializar novamente após o carregamento
          if (typeof firebase.database === 'function') {
            try {
              database = firebase.database();
              console.log('Firebase Database inicializado após carregamento dinâmico');
              firebaseAvailable = true;
            } catch (error) {
              console.error('Erro após carregamento dinâmico:', error);
              database = createMockDatabase();
            }
          } else {
            console.error('Firebase Database ainda não disponível após carregamento dinâmico');
            database = createMockDatabase();
          }
        };
        
        script.onerror = function() {
          console.error('Falha ao carregar Firebase Database dinamicamente');
          database = createMockDatabase();
        };
        
        document.head.appendChild(script);
      } else {
        database = createMockDatabase();
      }
    }
  }
} catch (error) {
  console.error('Erro geral ao inicializar Firebase:', error);
  auth = createMockAuth();
  database = createMockDatabase();
}

// Registrar resultado final
console.log('Status final do Firebase:', firebaseAvailable ? 'Disponível' : 'Indisponível');
console.log('Auth inicializado?', !!auth);
console.log('Database inicializado?', !!database);

// Criar objeto de autenticação simulado quando o Firebase não está disponível
function createMockAuth() {
  console.warn('Usando autenticação simulada devido a problemas com Firebase');
  return {
    currentUser: null,
    onAuthStateChanged: (callback) => {
      // Simular que não há usuário logado
      setTimeout(() => callback(null), 100);
      return () => {}; // função de cleanup
    },
    signInWithEmailAndPassword: () => Promise.reject(new Error('Autenticação simulada')),
    createUserWithEmailAndPassword: () => Promise.reject(new Error('Autenticação simulada')),
    signOut: () => Promise.resolve()
  };
}

// Criar objeto de banco de dados simulado quando o Firebase não está disponível
function createMockDatabase() {
  console.warn('Usando banco de dados simulado devido a problemas com Firebase');
  return {
    ref: (path) => ({
      push: () => ({
        set: async (data) => {
          console.warn('Salvamento simulado:', path, data);
          return Promise.resolve();
        }
      }),
      once: () => Promise.resolve({ 
        val: () => null,
        forEach: () => {}
      }),
      update: async () => Promise.resolve(),
      orderByChild: () => ({
        limitToLast: () => ({
          once: () => Promise.resolve({
            val: () => null,
            forEach: () => {}
          })
        })
      })
    })
  };
}

// Exportar objetos
export { auth, database, firebaseAvailable };

// Variável para controlar o estado de inicialização do Firebase
let authInitialized = false;

// Adicionar um listener para quando a autenticação estiver pronta
if (firebaseAvailable) {
  auth.onAuthStateChanged(() => {
    authInitialized = true;
    console.log('Estado de autenticação do Firebase inicializado');
  });
}

/**
 * Verifica se um usuário está autenticado
 * @returns {boolean} Verdadeiro se autenticado
 */
export function isAuthenticated() {
  if (!firebaseAvailable) {
    console.warn('Firebase não está disponível, usuário considerado não autenticado');
    return false;
  }
  
  console.log('Verificando autenticação:', auth.currentUser);
  // Só considerar autenticado se o auth está inicializado e currentUser existir
  return authInitialized && !!auth.currentUser;
}

/**
 * Obtém o usuário atual
 * @returns {Object|null} Objeto de usuário do Firebase ou null
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Obtém o token de autenticação para requisições à API
 * @returns {Promise<string>} Token de autenticação
 */
export async function getAuthToken() {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }
  return await auth.currentUser.getIdToken();
}

/**
 * Registra um novo usuário com e-mail e senha
 * @param {string} email - E-mail do usuário
 * @param {string} password - Senha do usuário
 * @returns {Promise<Object>} Usuário registrado
 */
export async function registerWithEmail(email, password) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(
      email, 
      password
    );
    return userCredential.user;
  } catch (error) {
    console.error('Erro ao registrar:', error);
    
    // Traduzir mensagens de erro para português
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Este e-mail já está sendo utilizado por outra conta.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('O e-mail fornecido é inválido.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('A senha é muito fraca. Use pelo menos 6 caracteres.');
    } else {
      throw new Error('Erro ao criar conta: ' + error.message);
    }
  }
}

/**
 * Faz login com e-mail e senha
 * @param {string} email - E-mail do usuário
 * @param {string} password - Senha do usuário
 * @returns {Promise<Object>} Usuário autenticado
 */
export async function loginWithEmail(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(
      email, 
      password
    );
    return userCredential.user;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    
    // Traduzir mensagens de erro para português
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('E-mail ou senha incorretos.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('O e-mail fornecido é inválido.');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('Esta conta foi desativada.');
    } else {
      throw new Error('Erro ao fazer login: ' + error.message);
    }
  }
}

/**
 * Faz login com Google
 * @returns {Promise<Object>} Usuário autenticado
 */
export async function loginWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const userCredential = await auth.signInWithPopup(provider);
    return userCredential.user;
  } catch (error) {
    console.error('Erro ao fazer login com Google:', error);
    
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Login cancelado. A janela foi fechada.');
    } else {
      throw new Error('Erro ao fazer login com Google: ' + error.message);
    }
  }
}

/**
 * Faz logout do usuário atual
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    // Limpar dados de ranking do localStorage
    localStorage.removeItem('gameScores');
    localStorage.removeItem('lastRankPosition');
    localStorage.removeItem('userRankings');
    
    // Outros itens relacionados ao ranking que possam existir
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.includes('rank') || key.includes('score') || key.includes('player')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Continuar com o logout normal
    await firebase.auth().signOut();
    return true;
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    throw error;
  }
}

/**
 * Observa mudanças no estado de autenticação
 * @param {Function} callback - Função chamada quando o estado muda
 * @returns {Function} Função para remover o observer
 */
export function onAuthStateChanged(callback) {
  return auth.onAuthStateChanged(callback);
}

/**
 * Envia e-mail de redefinição de senha
 * @param {string} email - E-mail do usuário
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
  try {
    await auth.sendPasswordResetEmail(email);
  } catch (error) {
    console.error('Erro ao enviar e-mail de redefinição:', error);
    
    if (error.code === 'auth/user-not-found') {
      throw new Error('Não existe conta com este e-mail.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('O e-mail fornecido é inválido.');
    } else {
      throw new Error('Erro ao enviar e-mail de redefinição: ' + error.message);
    }
  }
}

/**
 * Atualiza o perfil do usuário atual
 * @param {Object} profileData - Dados do perfil (displayName, photoURL)
 * @returns {Promise<void>}
 */
export async function updateProfile(profileData) {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }
  
  try {
    // Atualizar no Firebase Auth
    await auth.currentUser.updateProfile(profileData);
    
    // Se temos um nome de exibição, também atualizar no Realtime Database para consistência
    if (profileData.displayName) {
      const userId = auth.currentUser.uid;
      const db = firebase.database();
      
      // Atualizar no perfil do usuário
      await db.ref(`users/${userId}/profile`).update({
        name: profileData.displayName,
        updatedAt: new Date().toISOString()
      });
      
      // Atualizar também nas estatísticas para ranking
      await db.ref(`users/${userId}/stats`).update({
        rankingName: profileData.displayName
      });
      
      console.log('Nome de exibição atualizado em todos os locais:', profileData.displayName);
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw new Error('Erro ao atualizar perfil: ' + error.message);
  }
}

/**
 * Atualiza o e-mail do usuário atual
 * @param {string} newEmail - Novo e-mail
 * @returns {Promise<void>}
 */
export async function updateEmail(newEmail) {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }
  
  try {
    await auth.currentUser.updateEmail(newEmail);
  } catch (error) {
    console.error('Erro ao atualizar e-mail:', error);
    
    if (error.code === 'auth/requires-recent-login') {
      throw new Error('Por favor, faça login novamente para alterar seu e-mail.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('O novo e-mail é inválido.');
    } else if (error.code === 'auth/email-already-in-use') {
      throw new Error('Este e-mail já está sendo utilizado por outra conta.');
    } else {
      throw new Error('Erro ao atualizar e-mail: ' + error.message);
    }
  }
}

/**
 * Atualiza a senha do usuário atual
 * @param {string} newPassword - Nova senha
 * @returns {Promise<void>}
 */
export async function updatePassword(newPassword) {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }
  
  try {
    await auth.currentUser.updatePassword(newPassword);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    
    if (error.code === 'auth/requires-recent-login') {
      throw new Error('Por favor, faça login novamente para alterar sua senha.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('A nova senha é muito fraca. Use pelo menos 6 caracteres.');
    } else {
      throw new Error('Erro ao atualizar senha: ' + error.message);
    }
  }
}

/**
 * Exclui a conta do usuário atual
 * @returns {Promise<void>}
 */
export async function deleteAccount() {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }
  
  try {
    await auth.currentUser.delete();
  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    
    if (error.code === 'auth/requires-recent-login') {
      throw new Error('Por favor, faça login novamente para excluir sua conta.');
    } else {
      throw new Error('Erro ao excluir conta: ' + error.message);
    }
  }
}

/**
 * Salva uma pontuação no banco de dados do Firebase
 * @param {number} score - A pontuação a ser salva
 * @returns {Promise<boolean>} - Indica se o salvamento foi bem-sucedido
 */
export async function saveGameScore(score) {
  try {
    console.log(`Tentando salvar pontuação ${score} no Firebase`);
    
    // Verificar se estamos usando o Firebase ou o modo local
    if (!firebaseAvailable) {
      console.log('Firebase não está disponível, salvando pontuação localmente');
      return saveScoreLocally(score);
    }
    
    // Verificar se o usuário está autenticado
    if (!auth.currentUser) {
      console.error('Tentativa de salvar pontuação sem usuário autenticado');
      return saveScoreLocally(score);
    }
    
    const userId = auth.currentUser.uid;
    console.log(`Salvando pontuação para o usuário: ${userId}`);
    
    // Se o Firebase está disponível e o usuário está autenticado, salvar no Firebase
    try {
      // Referência para o local onde a pontuação será salva
      const scoreRef = database.ref(`users/${userId}/scores`).push();
      
      // Dados da pontuação
      const scoreData = {
        score: score,
        date: Date.now(), // Usar timestamp local, mais confiável que ServerValue.TIMESTAMP
        device: 'Web Game'
      };
      
      // Salvar os dados
      await scoreRef.set(scoreData);
      console.log('Pontuação salva com sucesso no Firebase');
      
      // Atualizar as estatísticas do usuário se necessário
      await updateUserStats(userId, score);
      
      // Atualizar o ranking global para exibição consistente
      await updateGlobalRanking(userId, score);
      
      // Forçar atualização do ranking na próxima vez que for carregado
      localStorage.setItem('forceRankingReload', 'true');
      
      return true;
    } catch (saveError) {
      console.error('Erro ao salvar pontuação no Firebase:', saveError);
      return saveScoreLocally(score, userId);
    }
  } catch (error) {
    console.error('Erro geral ao salvar pontuação:', error);
    return saveScoreLocally(score);
  }
}

/**
 * Atualiza as estatísticas do usuário no banco de dados
 * @param {string} userId - ID do usuário
 * @param {number} score - Pontuação atual
 * @returns {Promise<void>}
 */
async function updateUserStats(userId, score) {
  try {
    // Referência para as estatísticas do usuário
    const statsRef = database.ref(`users/${userId}/stats`);
    const statsSnapshot = await statsRef.once('value');
    const stats = statsSnapshot.val() || {};
    
    // Verificar se é a melhor pontuação
    if (!stats.bestScore || score > stats.bestScore) {
      console.log(`Nova melhor pontuação para o usuário ${userId}: ${score}`);
      
      // Atualizar estatísticas
      await statsRef.update({
        bestScore: score,
        lastUpdated: Date.now()
      });
      
      // Atualizar também no perfil para compatibilidade
      const profileRef = database.ref(`users/${userId}/profile`);
      await profileRef.update({
        bestScore: score,
        lastScoreUpdate: Date.now()
      });
      
      console.log('Estatísticas do usuário atualizadas com sucesso');
    } else {
      console.log(`A pontuação ${score} não é maior que a melhor atual (${stats.bestScore})`);
    }
    
    // Incrementar contagem total de partidas
    const totalGames = stats.totalGames || 0;
    await statsRef.update({
      totalGames: totalGames + 1
    });
  } catch (error) {
    console.error('Erro ao atualizar estatísticas do usuário:', error);
  }
}

/**
 * Atualiza o ranking global com a pontuação do usuário
 * @param {string} userId - ID do usuário
 * @param {number} score - Pontuação atual
 * @returns {Promise<void>}
 */
async function updateGlobalRanking(userId, score) {
  try {
    // Obter dados do perfil do usuário
    const profileRef = database.ref(`users/${userId}/profile`);
    const profileSnapshot = await profileRef.once('value');
    const profile = profileSnapshot.val() || {};
    
    // Nome para exibição no ranking
    const displayName = profile.name || auth.currentUser.displayName || 'Ninja';
    
    // Em vez de salvar diretamente em /rankings, salvamos nas estatísticas do usuário
    // para evitar problemas de permissão
    const statsRef = database.ref(`users/${userId}/stats`);
    const statsSnapshot = await statsRef.once('value');
    const stats = statsSnapshot.val() || {};
    
    // Verificar se a pontuação é melhor que a atual
    if (!stats.bestScore || score > stats.bestScore) {
      console.log(`Atualizando estatísticas de ranking para o usuário ${userId} com pontuação ${score}`);
      
      // Dados para o ranking incorporados nas estatísticas do usuário
      const rankingData = {
        bestScore: score,
        lastScoreUpdate: Date.now(),
        rankingName: displayName, // Nome para exibição no ranking
        publicRanking: true // Flag para indicar que o usuário permite aparecer no ranking público
      };
      
      // Salvar nas estatísticas do usuário
      await statsRef.update(rankingData);
      console.log('Estatísticas de ranking atualizadas com sucesso');
      
      // Forçar atualização do ranking na próxima vez
      localStorage.setItem('forceRankingReload', 'true');
    } else {
      console.log(`A pontuação ${score} não é maior que a atual (${stats.bestScore})`);
    }
  } catch (error) {
    console.error('Erro ao atualizar estatísticas de ranking:', error);
  }
}

/**
 * Função para salvar pontuação localmente quando o Firebase falha
 * @param {number} score - Pontuação a ser salva
 * @param {string} [userId] - ID do usuário, se disponível
 * @returns {boolean} - Indica se o salvamento local foi bem-sucedido
 */
function saveScoreLocally(score, userId = 'anônimo') {
  try {
    const localScores = JSON.parse(localStorage.getItem('localScores') || '[]');
    localScores.push({
      score: score,
      date: new Date().toISOString(),
      userId: userId
    });
    localStorage.setItem('localScores', JSON.stringify(localScores));
    console.log('Pontuação salva localmente como fallback');
    return false; // Retorna false para indicar que não salvou no Firebase
  } catch (localError) {
    console.error('Erro ao salvar pontuação localmente:', localError);
    return false;
  }
}

/**
 * Verifica se o usuário é novo ou se nunca jogou
 * @returns {Promise<boolean>} Verdadeiro se for a primeira vez do usuário
 */
export async function checkNewPlayer() {
  try {
    if (!firebaseAvailable || !auth.currentUser) {
      console.log('Firebase não disponível ou usuário não autenticado');
      return false;
    }
    
    const userId = auth.currentUser.uid;
    console.log(`Verificando se ${userId} é um novo jogador...`);
    
    // Verificar no banco de dados se o usuário já jogou antes
    const userRef = database.ref(`users/${userId}/profile`);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();
    
    // Se não existir dados do usuário ou não tiver campo introductionSeen, é um novo jogador
    if (!userData || userData.introductionSeen !== true) {
      console.log('Usuário novo detectado, precisa ver a introdução');
      return true;
    }
    
    console.log('Usuário já viu a introdução anteriormente');
    return false;
  } catch (error) {
    console.error("Erro ao verificar se o usuário é novo:", error);
    return false;
  }
}

/**
 * Marca que o usuário já viu a introdução
 * @returns {Promise<void>}
 */
export async function markIntroductionSeen() {
  try {
    if (!firebaseAvailable || !auth.currentUser) {
      console.log('Firebase não disponível ou usuário não autenticado');
      return;
    }
    
    const userId = auth.currentUser.uid;
    console.log(`Marcando introdução como vista para ${userId}`);
    
    // Atualizar os dados do usuário no Firebase
    await database.ref(`users/${userId}/profile`).update({
      introductionSeen: true,
      lastLogin: new Date().toISOString()
    });
    
    console.log('Introdução marcada como vista com sucesso');
  } catch (error) {
    console.error("Erro ao marcar introdução como vista:", error);
  }
} 
// Módulo para gerenciamento do ranking
export function generateSampleData() {
  const ninjaNames = [
    "Hirojuki", "Katana", "Sombra", "Shuriken", 
    "Hanzo", "Tora", "Kitsune", "Yamato", 
    "Shinobi", "Ryuu", "Kagemaru", "Tsuki"
  ];
  
  const sampleData = [];
  
  // Verificar se já existem dados no localStorage
  const existingData = localStorage.getItem('ninjaRanking');
  if (existingData) {
    return JSON.parse(existingData);
  }
  
  // Gerar dados de exemplo
  for (let i = 0; i < 10; i++) {
    const randomName = ninjaNames[Math.floor(Math.random() * ninjaNames.length)];
    const randomScore = Math.floor(Math.random() * 50) + 10;
    
    // Gerar data aleatória nos últimos 30 dias
    const randomDaysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - randomDaysAgo);
    
    sampleData.push({
      name: randomName,
      score: randomScore,
      date: date.toISOString()
    });
  }
  
  // Ordenar por pontuação
  sampleData.sort((a, b) => b.score - a.score);
  
  // Salvar no localStorage
  localStorage.setItem('ninjaRanking', JSON.stringify(sampleData));
  
  return sampleData;
}

// Função para formatar data
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

// Carregar e exibir o ranking
export async function displayRanking() {
  try {
    // Usar localStorage para verificar se devemos forçar uma recarga dos dados
    const forceReload = localStorage.getItem('forceRankingReload') === 'true';
    if (forceReload) {
      localStorage.removeItem('forceRankingReload');
      console.log('Forçando recarga dos dados do ranking');
    }
    
    // Exibir mensagem de carregamento
    const tableBody = document.getElementById('rankingBody');
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Carregando ranking...</td></tr>';
    
    // Verificar se o Firebase está disponível
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      console.error('Firebase não está inicializado');
      // Fallback para dados de exemplo
      const rankingData = generateSampleData();
      displayRankingData(rankingData);
      return;
    }
    
    console.log('Buscando ranking do Firebase Realtime Database');
    
    // Inicializar Firebase se necessário
    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: "AIzaSyDzrt3PWm1w38I4n3AZuUMIwjvKFXaVoGg",
        authDomain: "music-art-djg389.firebaseapp.com",
        databaseURL: "https://music-art-djg389-default-rtdb.firebaseio.com",
        projectId: "music-art-djg389",
        storageBucket: "music-art-djg389.firebasestorage.app",
        messagingSenderId: "548735106022",
        appId: "1:548735106022:web:33cf29b68a8b7f3fb7b427"
      });
    }
    
    // Obter referência ao Realtime Database
    const db = firebase.database();
    
    // Agora lendo dos nós de estatísticas dos usuários
    const usersRef = db.ref('users');
    
    // Definir um timeout para a operação
    let timeoutTriggered = false;
    const timeout = setTimeout(() => {
      timeoutTriggered = true;
      console.error('Timeout ao buscar dados do Firebase');
      const rankingData = generateSampleData();
      displayRankingData(rankingData);
    }, 5000); // 5 segundos de timeout
    
    try {
      const usersSnapshot = await usersRef.once('value');
      
      // Cancelar o timeout se a operação foi bem-sucedida
      clearTimeout(timeout);
      
      // Se o timeout já foi disparado, não continue
      if (timeoutTriggered) return;
      
      // Estrutura para armazenar o ranking
      const rankingEntries = [];
      
      // Processar dados do ranking a partir das estatísticas dos usuários
      usersSnapshot.forEach((userSnapshot) => {
        const userId = userSnapshot.key;
        const userData = userSnapshot.val();
        
        if (!userData) return; // Pular entradas vazias
        
        // Verificar múltiplas fontes para o melhor score
        let bestScore = 0;
        let lastUpdate = new Date().toISOString();
        
        // 1. Verificar nas estatísticas (fonte preferida)
        if (userData.stats && typeof userData.stats.bestScore === 'number' && userData.stats.bestScore > 0) {
          bestScore = userData.stats.bestScore;
          lastUpdate = userData.stats.lastScoreUpdate || lastUpdate;
        } 
        // 2. Verificar no perfil (fallback)
        else if (userData.profile && typeof userData.profile.bestScore === 'number' && userData.profile.bestScore > 0) {
          bestScore = userData.profile.bestScore;
          lastUpdate = userData.profile.updatedAt || lastUpdate;
        }
        
        // Pular usuários sem pontuação
        if (bestScore <= 0) return;
        
        // Obter nome do usuário para exibição
        let userName = 'Ninja Anônimo';
        
        // Verificar diferentes fontes para o nome em ordem de prioridade
        if (userData.stats && userData.stats.rankingName) {
          userName = userData.stats.rankingName;
        } else if (userData.profile && userData.profile.name) {
          userName = userData.profile.name;
        } else if (userData.displayName) {
          userName = userData.displayName;
        } else if (userData.profile && userData.profile.email) {
          // Extrair nome do email como último recurso
          userName = userData.profile.email.split('@')[0];
        }
        
        // Adicionar ao ranking apenas se o usuário permitir (publicRanking não é false)
        // Por padrão, assumimos que o usuário deseja aparecer no ranking
        const publicRanking = userData.stats?.publicRanking !== false;
        
        if (publicRanking && bestScore > 0) {
          rankingEntries.push({
            userId: userId,
            name: userName,
            score: bestScore,
            date: lastUpdate,
            device: userData.stats?.device || 'Web'
          });
        }
      });
      
      // Ordenar por pontuação (maior para menor)
      rankingEntries.sort((a, b) => b.score - a.score);
      
      console.log('Ranking carregado das estatísticas dos usuários:', rankingEntries);
      
      // Exibir o ranking
      displayRankingData(rankingEntries);
    } catch (dbError) {
      // Cancelar o timeout se ocorrer um erro
      clearTimeout(timeout);
      
      // Se o timeout já foi disparado, não continue
      if (timeoutTriggered) return;
      
      console.error('Erro ao acessar o Firebase Database:', dbError);
      
      // Fallback para dados de exemplo
      const rankingData = generateSampleData();
      displayRankingData(rankingData);
    }
  } catch (error) {
    console.error('Erro ao carregar ranking do Firebase:', error);
    
    // Fallback para dados de exemplo
    const rankingData = generateSampleData();
    displayRankingData(rankingData);
  }
}

// Função auxiliar para exibir os dados do ranking na tabela
function displayRankingData(rankingData) {
  const tableBody = document.getElementById('rankingBody');
  const emptyState = document.getElementById('emptyState');
  
  // Limpar tabela
  tableBody.innerHTML = '';
  
  if (rankingData.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  
  emptyState.style.display = 'none';
  
  // Preencher tabela
  rankingData.forEach((entry, index) => {
    const row = document.createElement('tr');
    
    // Posição
    const posCell = document.createElement('td');
    posCell.className = `position position-${index + 1}`;
    posCell.textContent = index + 1;
    
    // Nome
    const nameCell = document.createElement('td');
    nameCell.className = 'ninja';
    nameCell.textContent = entry.name;
    
    // Pontuação
    const scoreCell = document.createElement('td');
    scoreCell.className = 'score';
    scoreCell.textContent = entry.score;
    
    // Data
    const dateCell = document.createElement('td');
    dateCell.className = 'date';
    dateCell.textContent = formatDate(entry.date);
    
    row.appendChild(posCell);
    row.appendChild(nameCell);
    row.appendChild(scoreCell);
    row.appendChild(dateCell);
    
    tableBody.appendChild(row);
  });
}

// Verificar melhor pontuação do jogador atual
export async function checkPlayerScore() {
  try {
    const playerScoreElement = document.getElementById('playerBestScore');
    const userScoreDiv = document.getElementById('userScore');
    
    // Exibir estado de carregamento
    playerScoreElement.textContent = '...';
    
    // Verificar se o Firebase está disponível
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      console.error('Firebase não está inicializado');
      userScoreDiv.style.display = 'none';
      return;
    }
    
    // Obter o usuário atual
    const auth = firebase.auth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('Usuário não está autenticado');
      playerScoreElement.textContent = '0';
      userScoreDiv.style.display = 'none';
      return;
    }
    
    const userId = currentUser.uid;
    console.log('Verificando pontuação para o usuário:', userId);
    
    // Obter referência ao Realtime Database
    const db = firebase.database();
    
    // Definir variável para armazenar a melhor pontuação
    let bestScore = 0;
    
    // 1. Primeiro, verificar no nó de estatísticas (estrutura preferida)
    try {
      console.log('Verificando pontuação no nó de estatísticas');
      const statsRef = db.ref(`users/${userId}/stats`);
      const statsSnapshot = await statsRef.once('value');
      const stats = statsSnapshot.val() || {};
      
      if (stats && typeof stats.bestScore === 'number' && stats.bestScore > 0) {
        bestScore = stats.bestScore;
        console.log('Pontuação encontrada nas estatísticas:', bestScore);
      } else {
        // 2. Se não encontrada nas estatísticas, verificar no perfil
        console.log('Pontuação não encontrada nas estatísticas, verificando no perfil');
        const profileRef = db.ref(`users/${userId}/profile`);
        const profileSnapshot = await profileRef.once('value');
        const profile = profileSnapshot.val() || {};
        
        if (profile && typeof profile.bestScore === 'number' && profile.bestScore > 0) {
          bestScore = profile.bestScore;
          console.log('Pontuação encontrada no perfil:', bestScore);
        } else {
          // 3. Se não encontrada no perfil, buscar nas pontuações individuais
          console.log('Pontuação não encontrada no perfil, buscando nas pontuações individuais');
          
          // Buscar pontuações do usuário
          const userScoresRef = db.ref(`users/${userId}/scores`);
          const userScoresSnapshot = await userScoresRef.orderByChild('score').limitToLast(1).once('value');
          
          // Processar pontuações
          userScoresSnapshot.forEach((scoreSnapshot) => {
            const scoreData = scoreSnapshot.val();
            if (scoreData && typeof scoreData.score === 'number' && scoreData.score > bestScore) {
              bestScore = scoreData.score;
              console.log('Pontuação encontrada nas pontuações individuais:', bestScore);
            }
          });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar pontuação do usuário:', error);
    }
    
    // Exibir a pontuação
    console.log('Melhor pontuação final:', bestScore);
    playerScoreElement.textContent = bestScore;
    
    // Mostrar ou esconder o elemento baseado na pontuação
    userScoreDiv.style.display = bestScore > 0 ? 'flex' : 'none';
    
    // Verificar o nome do usuário
    try {
      const userProfileRef = db.ref(`users/${userId}/profile`);
      const userProfileSnapshot = await userProfileRef.once('value');
      const userProfile = userProfileSnapshot.val() || {};
      
      // Exibir nome do usuário no botão de edição
      if (userProfile && userProfile.name) {
        const nameBtn = document.getElementById('editNameBtn');
        if (nameBtn) {
          nameBtn.innerHTML = `<img src="./src/images/icons/trophy.png" alt="Troféu" class="button-icon">Editar Nome (${userProfile.name})`;
        }
      }
    } catch (profileError) {
      console.error('Erro ao buscar perfil do usuário:', profileError);
    }
  } catch (error) {
    console.error('Erro geral ao verificar pontuação do jogador:', error);
    // Em caso de erro, esconder o elemento
    const userScoreDiv = document.getElementById('userScore');
    if (userScoreDiv) {
      userScoreDiv.style.display = 'none';
    }
  }
}

// Configurar eventos para o formulário de nome
export function setupNameForm() {
  try {
    console.log("Configurando formulário de nome de jogador");
    
    const editBtn = document.getElementById('editNameBtn');
    const nameForm = document.getElementById('nameForm');
    const nameInput = document.getElementById('playerNameInput');
    const saveBtn = document.getElementById('saveNameBtn');
    const cancelBtn = document.getElementById('cancelNameBtn');
    
    if (!editBtn || !nameForm || !nameInput || !saveBtn || !cancelBtn) {
      console.error("Elementos do formulário de nome não encontrados");
      console.error("editBtn:", editBtn);
      console.error("nameForm:", nameForm);
      console.error("nameInput:", nameInput);
      console.error("saveBtn:", saveBtn);
      console.error("cancelBtn:", cancelBtn);
      return;
    }
    
    console.log("Todos os elementos do formulário encontrados");
    console.log("Estado inicial do nameForm:", nameForm.className);
    
    // Garantir que o formulário comece fechado
    nameForm.classList.remove('active');
    
    // Remover event listeners existentes para evitar duplicação
    const newEditBtn = editBtn.cloneNode(true);
    editBtn.parentNode.replaceChild(newEditBtn, editBtn);
    
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    const newNameInput = nameInput.cloneNode(true);
    nameInput.parentNode.replaceChild(newNameInput, nameInput);
    
    // Atualizar as referências
    const currentEditBtn = document.getElementById('editNameBtn');
    const currentNameForm = document.getElementById('nameForm');
    const currentNameInput = document.getElementById('playerNameInput');
    const currentSaveBtn = document.getElementById('saveNameBtn');
    const currentCancelBtn = document.getElementById('cancelNameBtn');
    
    // Carregar nome atual
    const currentName = localStorage.getItem('playerName') || '';
    currentNameInput.value = currentName;
    
    // Atualizar o texto do botão para incluir o nome atual, se houver
    if (currentName) {
      currentEditBtn.innerHTML = `<img src="./src/images/icons/trophy.svg" alt="Troféu" class="button-icon">Editar Nome (${currentName})`;
    }
    
    // Abrir/fechar formulário (accordion)
    currentEditBtn.addEventListener('click', function() {
      console.log("Botão de editar nome clicado");
      console.log("Estado do nameForm antes:", currentNameForm.className);
      currentNameForm.classList.toggle('active');
      console.log("Estado do nameForm depois:", currentNameForm.className);
      
      if (currentNameForm.classList.contains('active')) {
        currentNameInput.focus();
        console.log("Formulário aberto e foco definido");
      } else {
        console.log("Formulário fechado");
      }
    });
    
    // Salvar nome
    currentSaveBtn.addEventListener('click', function() {
      console.log("Botão de salvar clicado");
      const newName = currentNameInput.value.trim();
      if (newName) {
        const oldName = localStorage.getItem('playerName') || '';
        localStorage.setItem('playerName', newName);
        console.log(`Nome atualizado de "${oldName}" para "${newName}"`);
        currentEditBtn.innerHTML = `<img src="./src/images/icons/trophy.svg" alt="Troféu" class="button-icon">Editar Nome (${newName})`;
        
        // Salvar o nome no Firebase
        updatePlayerNameInFirebase(newName)
          .then(success => {
            if (success) {
              console.log('Nome atualizado no Firebase com sucesso');
              // Recarregar o ranking para refletir a mudança
              displayRanking();
            } else {
              console.warn('Nome não foi atualizado no Firebase');
            }
          })
          .catch(error => {
            console.error('Erro ao atualizar nome no Firebase:', error);
          });
        
        // Atualizar rankings se houver pontuações
        const rankings = JSON.parse(localStorage.getItem('ninjaRanking') || '[]');
        const playerScore = localStorage.getItem('playerBestScore') || 0;
        
        if (rankings.length > 0 && playerScore > 0) {
          // Procurar e atualizar todas as entradas com o nome antigo
          if (oldName) {
            let rankingUpdated = false;
            
            rankings.forEach(entry => {
              if (entry.name === oldName) {
                entry.name = newName;
                rankingUpdated = true;
              }
            });
            
            if (rankingUpdated) {
              localStorage.setItem('ninjaRanking', JSON.stringify(rankings));
              console.log(`Atualizado nome de "${oldName}" para "${newName}" no ranking`);
              displayRanking(); // Atualizar a exibição
            }
          }
        }
        
        // Armazenar o nome atual como o antigo para referência futura
        localStorage.setItem('oldPlayerName', newName);
      } else {
        console.log("Nome vazio, não foi salvo");
      }
      
      // Fechar o accordion
      currentNameForm.classList.remove('active');
      console.log("Formulário fechado após salvar");
    });
    
    // Cancelar edição
    currentCancelBtn.addEventListener('click', function() {
      console.log("Botão de cancelar clicado");
      currentNameForm.classList.remove('active');
      console.log("Formulário fechado após cancelar");
    });
    
    // Tecla Enter para salvar
    currentNameInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        console.log("Tecla Enter pressionada no campo de nome");
        currentSaveBtn.click();
      }
    });
    
    console.log("Formulário de nome configurado com sucesso");
  } catch (error) {
    console.error("Erro ao configurar formulário de nome:", error);
  }
}

// Função para obter o ranking atual
export function getCurrentRanking() {
  return JSON.parse(localStorage.getItem('ninjaRanking') || '[]');
}

// Função para obter o nome do jogador atual
export function getPlayerName() {
  return localStorage.getItem('playerName') || `Ninja ${Math.floor(Math.random() * 1000)}`;
}

// Função para verificar se é recorde pessoal
export function isPersonalBest(newScore) {
  const currentBestScore = localStorage.getItem('playerBestScore') || 0;
  return newScore > currentBestScore;
}

// Função para salvar a pontuação
export async function saveScore(newScore) {
  console.log(`Salvando pontuação: ${newScore}`);
  
  // Verificar se é a melhor pontuação do jogador
  if (isPersonalBest(newScore)) {
    localStorage.setItem('playerBestScore', newScore);
    console.log(`Nova melhor pontuação pessoal: ${newScore}`);
  }

  try {
    // Tentar obter posição do Firebase primeiro
    if (typeof firebase !== 'undefined' && firebase.database) {
      console.log('Calculando posição usando Firebase...');
      const db = firebase.database();
      
      // Usar o nó users em vez de scores
      const usersRef = db.ref('users');
      
      // Buscar todas as pontuações dos usuários
      const snapshot = await usersRef.once('value');
      const allScores = [];
      
      snapshot.forEach((userSnapshot) => {
        const userData = userSnapshot.val();
        if (userData && userData.stats && typeof userData.stats.bestScore === 'number') {
          allScores.push({
            score: userData.stats.bestScore
          });
        }
      });
      
      // Adicionar a pontuação atual para comparação
      allScores.push({ score: newScore });
      
      // Ordenar pontuações em ordem decrescente
      allScores.sort((a, b) => b.score - a.score);
      
      // Encontrar a posição da nova pontuação
      const position = allScores.findIndex(score => score.score === newScore) + 1;
      
      console.log(`Posição calculada no Firebase: ${position}`);
      return position;
    }
  } catch (error) {
    console.warn('Erro ao calcular posição no Firebase:', error);
    console.log('Fallback para cálculo local de posição');
  }
  
  // Fallback para cálculo local se Firebase falhar
  console.log('Usando cálculo local para posição no ranking');
  
  // Buscar rankings existentes
  let rankings = getCurrentRanking();
  
  // Obter nome do jogador
  const playerName = getPlayerName();
  console.log(`Jogador: ${playerName}`);
  
  // Verificar se o jogador já existe no ranking
  const playerEntryIndex = rankings.findIndex(entry => entry.name === playerName);
  
  if (playerEntryIndex !== -1) {
    // Jogador já existe no ranking
    const existingScore = rankings[playerEntryIndex].score;
    
    // Atualizar a pontuação apenas se a nova for maior que a existente
    if (newScore > existingScore) {
      console.log(`Atualizando pontuação existente de ${existingScore} para ${newScore}`);
      rankings[playerEntryIndex].score = newScore;
      rankings[playerEntryIndex].date = new Date().toISOString();
    } else {
      console.log(`Mantendo pontuação existente ${existingScore} (maior que a nova ${newScore})`);
    }
  } else {
    // Jogador não existe no ranking, adicionar nova entrada
    console.log(`Adicionando nova entrada para o jogador ${playerName} com pontuação ${newScore}`);
    rankings.push({
      name: playerName,
      score: newScore,
      date: new Date().toISOString()
    });
  }
  
  // Ordenar por pontuação (maior para menor)
  rankings.sort((a, b) => b.score - a.score);
  
  // Manter apenas os top 20
  if (rankings.length > 20) {
    rankings = rankings.slice(0, 20);
  }
  
  // Salvar de volta no localStorage
  localStorage.setItem('ninjaRanking', JSON.stringify(rankings));
  
  // Retornar a posição do jogador no ranking
  const position = rankings.findIndex(entry => entry.name === playerName) + 1;
  
  console.log(`Posição no ranking local: ${position}`);
  return position;
}

// Modificar a função para obter os dados do Firebase
export async function getTopThreeScores() {
  // Tentar obter do Firebase primeiro
  try {
    // Verificar se o Firebase está disponível
    if (typeof firebase !== 'undefined' && firebase.database) {
      console.log('Buscando top 3 scores a partir das estatísticas dos usuários');
      
      // Obter referência ao Realtime Database
      const db = firebase.database();
      
      // Buscar estatísticas dos usuários
      const usersRef = db.ref('users');
      const usersSnapshot = await usersRef.once('value');
      
      // Estrutura para armazenar o ranking
      const rankingEntries = [];
      
      // Processar dados do ranking a partir das estatísticas dos usuários
      usersSnapshot.forEach((userSnapshot) => {
        const userId = userSnapshot.key;
        const userData = userSnapshot.val();
        
        // Verificar se o usuário tem estatísticas
        if (userData && userData.stats && userData.stats.bestScore) {
          // Obter nome do usuário para exibição
          let userName = 'Ninja Anônimo';
          
          // Verificar diferentes fontes para o nome em ordem de prioridade
          if (userData.stats.rankingName) {
            userName = userData.stats.rankingName;
          } else if (userData.profile && userData.profile.name) {
            userName = userData.profile.name;
          } else if (userData.displayName) {
            userName = userData.displayName;
          }
          
          // Adicionar ao ranking apenas se o usuário permitir (publicRanking não é false)
          if (userData.stats.publicRanking !== false) {
            rankingEntries.push({
              userId: userId,
              name: userName,
              score: userData.stats.bestScore
            });
          }
        }
      });
      
      // Ordenar por pontuação (maior para menor)
      rankingEntries.sort((a, b) => b.score - a.score);
      
      // Pegar os top 3
      const topScores = rankingEntries.slice(0, 3).map((entry, index) => ({
        position: index + 1,
        name: entry.name,
        score: entry.score
      }));
      
      console.log('Top 3 scores carregados com sucesso:', topScores);
      return topScores;
    }
  } catch (error) {
    console.error("Erro ao obter ranking do Firebase:", error);
  }
  
  // Fallback para localStorage apenas se Firebase falhar
  return getTopThreeScoresFromLocalStorage();
}

// Função auxiliar para obter do localStorage (fallback)
function getTopThreeScoresFromLocalStorage() {
  try {
    const scoresJSON = localStorage.getItem('gameScores');
    if (!scoresJSON) return [];
    
    const scores = JSON.parse(scoresJSON);
    return scores.slice(0, 3).map((score, index) => ({
      position: index + 1,
      name: score.playerName || 'Ninja Anônimo',
      score: score.score
    }));
  } catch (error) {
    console.error("Erro ao obter ranking local:", error);
    return [];
  }
}

// Modificação para salvar o nome no Firebase
export async function updatePlayerNameInFirebase(newName) {
  try {
    // Verificar se o Firebase está disponível
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      console.error('Firebase não está inicializado');
      return false;
    }
    
    // Obter o usuário atual
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      console.error('Usuário não está autenticado');
      return false;
    }
    
    const userId = currentUser.uid;
    
    // Obter referência ao Realtime Database
    const db = firebase.database();
    
    // Atualizar o perfil do usuário
    await db.ref(`users/${userId}/profile`).update({
      name: newName
    });
    
    // Também atualizar nas estatísticas para manter consistência com o ranking
    await db.ref(`users/${userId}/stats`).update({
      rankingName: newName
    });
    
    // Atualizar também no Firebase Auth para garantir consistência
    await currentUser.updateProfile({
      displayName: newName
    });
    
    console.log(`Nome atualizado no Firebase para: ${newName}`);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar nome no Firebase:', error);
    return false;
  }
}
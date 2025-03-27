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
export function displayRanking() {
  const rankingData = generateSampleData();
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
export function checkPlayerScore() {
  const playerScoreElement = document.getElementById('playerBestScore');
  const playerScore = localStorage.getItem('playerBestScore') || 0;
  playerScoreElement.textContent = playerScore;
  
  // Esconder o elemento se o jogador não tiver pontuação
  if (playerScore == 0) {
    document.getElementById('userScore').style.display = 'none';
  } else {
    // Mostrar o nome atual do jogador
    const playerName = localStorage.getItem('playerName');
    if (playerName) {
      const nameBtn = document.getElementById('editNameBtn');
      nameBtn.textContent = `Editar Nome (${playerName})`;
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
      return;
    }
    
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
      currentEditBtn.innerHTML = `<img src="./src/images/icons/trophy.png" alt="Troféu" class="button-icon">Editar Nome (${currentName})`;
    }
    
    // Abrir/fechar formulário (accordion)
    currentEditBtn.addEventListener('click', function() {
      currentNameForm.classList.toggle('active');
      if (currentNameForm.classList.contains('active')) {
        currentNameInput.focus();
      }
    });
    
    // Salvar nome
    currentSaveBtn.addEventListener('click', function() {
      const newName = currentNameInput.value.trim();
      if (newName) {
        const oldName = localStorage.getItem('playerName') || '';
        localStorage.setItem('playerName', newName);
        currentEditBtn.innerHTML = `<img src="./src/images/icons/trophy.png" alt="Troféu" class="button-icon">Editar Nome (${newName})`;
        
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
      }
      
      // Fechar o accordion
      currentNameForm.classList.remove('active');
    });
    
    // Cancelar edição
    currentCancelBtn.addEventListener('click', function() {
      currentNameForm.classList.remove('active');
    });
    
    // Tecla Enter para salvar
    currentNameInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
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
export function saveScore(newScore) {
  console.log(`Salvando pontuação: ${newScore}`);
  
  // Verificar se é a melhor pontuação do jogador
  if (isPersonalBest(newScore)) {
    localStorage.setItem('playerBestScore', newScore);
    console.log(`Nova melhor pontuação pessoal: ${newScore}`);
  }
  
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
  
  console.log(`Posição no ranking: ${position}`);
  return position;
}

// Função para obter as 3 melhores pontuações
export function getTopThreeScores() {
  const rankings = getCurrentRanking();
  
  // Limitar aos 3 primeiros resultados
  return rankings.slice(0, 3).map((entry, index) => {
    return {
      position: index + 1,
      name: entry.name,
      score: entry.score,
      date: formatDate(entry.date)
    };
  });
}
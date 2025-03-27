/**
 * Módulo de migração para o sistema de ranking online
 * Este módulo permite migrar pontuações armazenadas localmente para o servidor
 */

import { getCurrentUser } from '../services/firebase.js';
import { saveScore, updateUserProfile } from '../services/api.js';
import { setWithExpiry, getWithExpiry } from '../services/utils.js';

/**
 * Verifica se a migração já foi realizada
 * @returns {boolean} Verdadeiro se os dados já foram migrados
 */
export function hasMigratedData() {
  return getWithExpiry('dataMigrated') === true;
}

/**
 * Obtém as pontuações armazenadas no localStorage
 * @returns {Array} Lista de pontuações
 */
function getLocalScores() {
  try {
    // Obter dados do ranking
    const rankingData = JSON.parse(localStorage.getItem('ninjaRanking') || '[]');
    
    // Obter nome do jogador
    const playerName = localStorage.getItem('playerName');
    
    if (!playerName) {
      console.log('Nome do jogador não encontrado, nenhum dado para migrar');
      return [];
    }
    
    // Filtrar apenas as pontuações do jogador atual
    return rankingData
      .filter(entry => entry.name === playerName)
      .map(entry => ({
        score: entry.score,
        date: entry.date || new Date().toISOString()
      }));
  } catch (error) {
    console.error('Erro ao obter pontuações locais:', error);
    return [];
  }
}

/**
 * Migra as pontuações locais para o servidor
 * @returns {Promise<Object>} Resultado da migração
 */
export async function migrateLocalScores() {
  try {
    // Verificar se o usuário está autenticado
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Usuário não autenticado. Faça login para migrar os dados.');
    }
    
    // Verificar se a migração já foi realizada
    if (hasMigratedData()) {
      return { 
        success: true, 
        message: 'Dados já foram migrados anteriormente.',
        migrated: 0
      };
    }
    
    // Obter pontuações locais
    const localScores = getLocalScores();
    
    if (localScores.length === 0) {
      setWithExpiry('dataMigrated', true, 60 * 24 * 30); // 30 dias
      return { 
        success: true, 
        message: 'Nenhuma pontuação local encontrada para migrar.',
        migrated: 0
      };
    }
    
    console.log(`Encontradas ${localScores.length} pontuações para migrar`);
    
    // Obter a melhor pontuação local
    const bestScore = Math.max(...localScores.map(score => score.score));
    
    // Ordenar pontuações por data (mais recentes primeiro)
    const sortedScores = localScores.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Limitar a migração às 10 pontuações mais recentes para evitar sobrecarga
    const scoresToMigrate = sortedScores.slice(0, 10);
    
    // Migrar o nome do jogador
    const playerName = localStorage.getItem('playerName');
    if (playerName) {
      await updateUserProfile({ name: playerName });
      console.log(`Nome do jogador "${playerName}" migrado com sucesso`);
    }
    
    // Migrar pontuações para o servidor
    const results = await Promise.allSettled(
      scoresToMigrate.map(score => saveScore(score.score, { isMigration: true }))
    );
    
    // Contar quantas pontuações foram migradas com sucesso
    const successCount = results.filter(result => result.status === 'fulfilled').length;
    
    // Marcar a migração como concluída
    setWithExpiry('dataMigrated', true, 60 * 24 * 30); // 30 dias
    
    return {
      success: true,
      message: `${successCount} de ${scoresToMigrate.length} pontuações migradas com sucesso.`,
      migrated: successCount,
      bestScore
    };
  } catch (error) {
    console.error('Erro ao migrar pontuações:', error);
    return {
      success: false,
      message: `Erro ao migrar pontuações: ${error.message}`,
      migrated: 0
    };
  }
}

/**
 * Exibe o diálogo de migração
 * @param {Function} onComplete - Callback chamado quando a migração for concluída
 */
export function showMigrationDialog(onComplete) {
  // Verificar se o usuário está autenticado
  const user = getCurrentUser();
  if (!user) {
    console.log('Usuário não autenticado, não exibindo diálogo de migração');
    if (onComplete) onComplete({ skipped: true });
    return;
  }
  
  // Verificar se a migração já foi realizada
  if (hasMigratedData()) {
    console.log('Dados já foram migrados, não exibindo diálogo');
    if (onComplete) onComplete({ skipped: true });
    return;
  }
  
  // Obter pontuações locais
  const localScores = getLocalScores();
  
  if (localScores.length === 0) {
    console.log('Nenhuma pontuação local encontrada, não exibindo diálogo');
    setWithExpiry('dataMigrated', true, 60 * 24 * 30); // 30 dias
    if (onComplete) onComplete({ skipped: true });
    return;
  }
  
  // Criar o diálogo de migração
  const dialog = document.createElement('div');
  dialog.className = 'migration-dialog';
  dialog.innerHTML = `
    <div class="migration-content">
      <h2>Migrar Pontuações</h2>
      <p>Detectamos ${localScores.length} pontuações salvas localmente.</p>
      <p>Deseja migrar suas pontuações para sua conta online?</p>
      <div class="migration-buttons">
        <button id="migrationYes" class="btn-primary">Sim, migrar</button>
        <button id="migrationNo" class="btn-secondary">Não, obrigado</button>
      </div>
      <div id="migrationStatus" class="migration-status"></div>
    </div>
  `;
  
  // Adicionar estilos
  const style = document.createElement('style');
  style.textContent = `
    .migration-dialog {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .migration-content {
      background: rgba(20, 20, 20, 0.95);
      padding: 25px;
      border-radius: 15px;
      max-width: 90%;
      width: 400px;
      color: white;
      box-shadow: 0 5px 30px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .migration-content h2 {
      margin-top: 0;
      color: #ff7e00;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 10px;
    }
    
    .migration-buttons {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
    }
    
    .btn-primary {
      background: linear-gradient(45deg, #700, #a00);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: a50px;
      cursor: pointer;
      font-weight: bold;
    }
    
    .btn-primary:hover {
      background: linear-gradient(45deg, #900, #c00);
    }
    
    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 10px 20px;
      border-radius: 50px;
      cursor: pointer;
      font-weight: bold;
    }
    
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .migration-status {
      margin-top: 20px;
      text-align: center;
      min-height: 20px;
    }
  `;
  
  // Adicionar o diálogo ao corpo do documento
  document.head.appendChild(style);
  document.body.appendChild(dialog);
  
  // Configurar eventos
  const yesButton = document.getElementById('migrationYes');
  const noButton = document.getElementById('migrationNo');
  const statusEl = document.getElementById('migrationStatus');
  
  yesButton.addEventListener('click', async () => {
    // Desativar botões durante a migração
    yesButton.disabled = true;
    noButton.disabled = true;
    
    statusEl.textContent = 'Migrando pontuações...';
    
    try {
      const result = await migrateLocalScores();
      
      if (result.success) {
        statusEl.textContent = result.message;
        
        // Remover o diálogo após 3 segundos
        setTimeout(() => {
          document.body.removeChild(dialog);
          document.head.removeChild(style);
          
          if (onComplete) onComplete(result);
        }, 3000);
      } else {
        statusEl.textContent = result.message;
        
        // Reativar botões
        yesButton.disabled = false;
        noButton.disabled = false;
      }
    } catch (error) {
      statusEl.textContent = 'Erro ao migrar pontuações: ' + error.message;
      
      // Reativar botões
      yesButton.disabled = false;
      noButton.disabled = false;
    }
  });
  
  noButton.addEventListener('click', () => {
    // Marcar que o usuário optou por não migrar
    setWithExpiry('dataMigrated', true, 60 * 24 * 7); // 7 dias
    
    // Remover o diálogo
    document.body.removeChild(dialog);
    document.head.removeChild(style);
    
    if (onComplete) onComplete({ skipped: true });
  });
}

/**
 * Migração manual para a API de console
 * Pode ser chamada diretamente no console do navegador
 */
window.migrateScores = async function() {
  console.log('Iniciando migração manual de pontuações...');
  const result = await migrateLocalScores();
  console.log('Resultado da migração:', result);
  return result;
}; 
/**
 * Utilitários gerais para o jogo Amaterasu
 */

/**
 * Formata um número com separador de milhares
 * @param {number} num - Número a ser formatado
 * @returns {string} Número formatado
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Formata uma data no padrão brasileiro
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada (DD/MM/YYYY)
 */
export function formatDate(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleDateString('pt-BR');
}

/**
 * Formata uma data completa com horário
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data e hora formatadas (DD/MM/YYYY HH:MM)
 */
export function formatDateTime(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  const dateStr = date.toLocaleDateString('pt-BR');
  const timeStr = date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return `${dateStr} ${timeStr}`;
}

/**
 * Trunca um texto e adiciona reticências se exceder o limite
 * @param {string} text - Texto a ser truncado
 * @param {number} limit - Limite de caracteres
 * @returns {string} Texto truncado
 */
export function truncateText(text, limit) {
  if (text.length <= limit) return text;
  return text.substring(0, limit) + '...';
}

/**
 * Gera um ID único
 * @returns {string} ID único
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Obtém o dispositivo atual
 * @returns {string} Nome do dispositivo
 */
export function getDeviceInfo() {
  const ua = navigator.userAgent;
  let deviceName = 'Desconhecido';
  
  if (/android/i.test(ua)) {
    deviceName = 'Android';
  } else if (/iPad|iPhone|iPod/.test(ua)) {
    deviceName = 'iOS';
  } else if (/Windows/.test(ua)) {
    deviceName = 'Windows';
  } else if (/Mac OS/.test(ua)) {
    deviceName = 'macOS';
  } else if (/Linux/.test(ua)) {
    deviceName = 'Linux';
  }
  
  return deviceName;
}

/**
 * Determina se o dispositivo é mobile
 * @returns {boolean} Verdadeiro se for mobile
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.innerWidth < 768;
}

/**
 * Calcula o tempo decorrido em formato legível
 * @param {string|Date} date - Data a calcular o tempo decorrido
 * @returns {string} Tempo decorrido em formato legível
 */
export function timeAgo(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  const seconds = Math.floor((new Date() - date) / 1000);
  
  // Intervalos em segundos
  const intervals = {
    ano: 31536000,
    mês: 2592000,
    semana: 604800,
    dia: 86400,
    hora: 3600,
    minuto: 60
  };
  
  // Plural de intervalos
  const plurals = {
    ano: 'anos',
    mês: 'meses',
    semana: 'semanas',
    dia: 'dias',
    hora: 'horas',
    minuto: 'minutos'
  };
  
  for (const [interval, secondsInInterval] of Object.entries(intervals)) {
    const count = Math.floor(seconds / secondsInInterval);
    if (count > 0) {
      const plural = count === 1 ? interval : plurals[interval];
      return `${count} ${plural} atrás`;
    }
  }
  
  return 'Agora mesmo';
}

/**
 * Verifica se uma string é um e-mail válido
 * @param {string} email - E-mail a ser verificado
 * @returns {boolean} Verdadeiro se for um e-mail válido
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Verifica a força de uma senha
 * @param {string} password - Senha a ser verificada
 * @returns {Object} Objeto com propriedades sobre a força da senha
 */
export function checkPasswordStrength(password) {
  const result = {
    isStrong: false,
    hasMinLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /[0-9]/.test(password),
    hasSpecialChars: /[^A-Za-z0-9]/.test(password)
  };
  
  result.isStrong = result.hasMinLength && 
                   result.hasUpperCase && 
                   result.hasLowerCase && 
                   result.hasNumbers;
  
  return result;
}

/**
 * Salva um objeto no localStorage com expiração
 * @param {string} key - Chave do localStorage
 * @param {any} value - Valor a ser salvo
 * @param {number} expirationMinutes - Minutos até expirar (opcional)
 */
export function setWithExpiry(key, value, expirationMinutes) {
  const now = new Date();
  
  const item = {
    value: value,
    expiry: expirationMinutes ? now.getTime() + (expirationMinutes * 60 * 1000) : null
  };
  
  localStorage.setItem(key, JSON.stringify(item));
}

/**
 * Obtém um item do localStorage respeitando a expiração
 * @param {string} key - Chave do localStorage
 * @returns {any} Valor armazenado ou null se expirado
 */
export function getWithExpiry(key) {
  const itemStr = localStorage.getItem(key);
  
  if (!itemStr) return null;
  
  const item = JSON.parse(itemStr);
  
  // Verificar se tem expiração e se já expirou
  if (item.expiry && new Date().getTime() > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }
  
  return item.value;
}

/**
 * Debounce para evitar múltiplas chamadas de função
 * @param {Function} func - Função a aplicar debounce
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} Função com debounce
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Limita a taxa de execução de uma função
 * @param {Function} func - Função a aplicar throttle
 * @param {number} limit - Limite de tempo em ms
 * @returns {Function} Função com throttle
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Sorteia aleatoriamente um elemento de um array
 * @param {Array} array - Array para escolher elemento
 * @returns {any} Elemento aleatório do array
 */
export function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Embaralha elementos de um array
 * @param {Array} array - Array para embaralhar
 * @returns {Array} Array embaralhado
 */
export function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Obtém parâmetros da URL
 * @param {string} param - Nome do parâmetro (opcional)
 * @returns {string|Object} Valor do parâmetro ou objeto com todos os parâmetros
 */
export function getUrlParams(param) {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (param) {
    return urlParams.get(param);
  }
  
  const params = {};
  for (const [key, value] of urlParams.entries()) {
    params[key] = value;
  }
  
  return params;
}

// Exportar todas as funções como um objeto único também
export default {
  formatNumber,
  formatDate,
  formatDateTime,
  truncateText,
  generateId,
  getDeviceInfo,
  isMobileDevice,
  timeAgo,
  isValidEmail,
  checkPasswordStrength,
  setWithExpiry,
  getWithExpiry,
  debounce,
  throttle,
  randomChoice,
  shuffleArray,
  getUrlParams
} 
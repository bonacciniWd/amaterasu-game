// Módulo para interface do usuário
import { score, setScore, phase, setPhase, platforms, updatePlatforms, sticks, updateSticks,
  trees, updateTrees, heroX, setHeroX, heroY, setHeroY, 
  sceneOffset, setSceneOffset, setLastTimestamp, clouds, updateClouds,
  showCastle, dragonY, dragonDirection,
  setShowCastle, setDragonY, setDragonDirection,
  gameConfig, recalculateConstants } from './config.js';
import { generatePlatform, generateTree, generateCloud, generateStars } from './entities.js';
import { loadSounds, playBackgroundMusic, pauseBackgroundMusic, playFallSound, soundsLoaded, soundsEnabled } from './audio.js';
import { draw } from './render.js';
import { initPerfectCounter } from './perfectCounter.js';

// Estender a funcionalidade base do JavaScript
if (!Array.prototype.last) {
Array.prototype.last = function () {
return this[this.length - 1];
};
}

// Funções de interface do usuário
export function isMobileDevice() {
return (window.innerWidth < 768) || 
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function setupMobileInterface() {
const mobileButton = document.getElementById("mobileStartButton");
const introText = document.getElementById("introduction");

if (isMobileDevice()) {
// Ajustar texto de instrução para mobile
introText.innerText = "Toque na tela para iniciar e esticar o bastão";
introText.style.padding = "15px 20px";
introText.style.fontSize = "1em";

// Esconder botão de início para mobile, pois vamos usar toques diretos na tela
mobileButton.style.display = "none";
} else {
// Desktop
introText.innerText = "Clique e segure para esticar o bastão";
mobileButton.style.display = "none";
}
}

export function preventTextSelection() {
const elements = [
document.getElementById("score"),
document.getElementById("introduction"),
document.getElementById("perfect"),
document.getElementById("creditos")
];

elements.forEach(element => {
if (element) {
element.style.webkitUserSelect = "none";
element.style.userSelect = "none";
element.setAttribute("unselectable", "on");
}
});
}

// Função para reiniciar o jogo
export function resetGame() {
// Reset game progress
setPhase("waiting");
setLastTimestamp(undefined);
setSceneOffset(0);
setScore(0);

// Reiniciar variáveis das novas funcionalidades
setShowCastle(false);
setDragonY(60); // Aumentado de 50 para 60 (10px para baixo)
setDragonDirection(1); // Direção da animação de flutuação

// Remover classe de jogo ativo
document.body.classList.remove("game-active");

// Garantir que os elementos de interface estejam visíveis
document.getElementById("introduction").style.opacity = 0.8;
document.getElementById("perfect").style.opacity = 0;

// Esconder os botões de ação
document.getElementById("restart").style.display = "none";
document.getElementById("buy-life").style.display = "none";

// Resetar o contador de perfects
if (typeof resetPerfectCounter === 'function') {
resetPerfectCounter();
} else {
// Inicializar o contador de perfects se ainda não foi feito
initPerfectCounter();
}

// Atualizar a pontuação
updateScoreDisplay();

// Limpar nuvens antes de gerar novas
updateClouds([]);

// Gerar estrelas
generateStars(); // Gera as estrelas uma vez

// The first platform is always the same
const initialPlatforms = [{ x: 50, w: 50 }];
updatePlatforms(initialPlatforms);
generatePlatform();
generatePlatform();
generatePlatform();
generatePlatform();
generatePlatform();

const initialSticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];
updateSticks(initialSticks);

const initialTrees = [];
updateTrees(initialTrees);
generateTree();
generateTree();
generateTree();
generateTree();
generateTree();
generateTree();
generateTree();
generateTree();
generateTree();
generateTree();

setHeroX(platforms[0].x + platforms[0].w - gameConfig.heroDistanceFromEdge);
setHeroY(0);

// Chame a função para gerar algumas nuvens no início do jogo
for (let i = 0; i < 5; i++) {
generateCloud();
}

// Garantir que o jogo seja renderizado
resizeCanvas();
draw();

// Verificar se precisamos configurar para mobile
setupMobileInterface();

// Garantir que os sons estejam carregados
if (!soundsLoaded) {
loadSounds();
} else if (soundsEnabled) {
// Tentar tocar a música de fundo com um pequeno atraso
setTimeout(playBackgroundMusic, 300);
}
}

// Atualizar a exibição da pontuação
export function updateScoreDisplay() {
const scoreValueElement = document.querySelector("#score .score-value");
if (scoreValueElement) {
scoreValueElement.textContent = score;
}
}

// Função para garantir que o canvas ocupe todo o espaço disponível
export function resizeCanvas() {
const canvas = document.getElementById("game");
if (!canvas) return;

// Recalcular constantes do jogo baseado no tamanho atual da janela
recalculateConstants();

// Ajustar o tamanho do canvas para cobrir toda a tela disponível
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Garantir que o estilo CSS também corresponda ao tamanho do canvas
canvas.style.width = "100%";
canvas.style.height = "100%";
canvas.style.maxWidth = "100%";
canvas.style.maxHeight = "100%";
canvas.style.position = "fixed";
canvas.style.top = "0";
canvas.style.left = "0";
canvas.style.objectFit = "cover";

// Força um novo render para atualizar o jogo
if (typeof draw === 'function') {
draw();
}

console.log(`Canvas redimensionado para: ${canvas.width}x${canvas.height}`);
}

// Função para garantir que o jogo esteja sempre visível
export function ensureGameVisibility() {
// Não redesenhar o jogo automaticamente, apenas garantir que esteja visível
// Se o jogo estiver rodando (fase não é waiting ou falling), não interfira
if (phase === "waiting" || phase === "falling") {
// Desenhar apenas se o jogo não estiver em progresso
draw();
}
}

// Função para inicializar o jogo após a história
export function initGameAfterStory() {
// Verificar se já foi inicializado antes
if (!window.gameInitialized) {
recalculateConstants(); // Garantir que as constantes estejam corretas no início
setupMobileInterface(); // Configurar interface para mobile se necessário
preventTextSelection(); // Prevenir seleção de texto
resetGame();
window.gameInitialized = true;
}

// Garantir que o jogo seja desenhado
resizeCanvas();
draw();

// Garantir que os sons estejam carregados
if (!soundsLoaded) {
loadSounds();
// Pequena espera para garantir que o áudio possa ser reproduzido após interação
window.addEventListener('click', function audioSetup() {
window.removeEventListener('click', audioSetup);
if (soundsEnabled) {
 setTimeout(playBackgroundMusic, 500);
}
}, { once: true });
}

// Inicializar o contador de perfects
initPerfectCounter();
}

// Configura eventos para clicks em elementos especiais
export function setupInteractionEvents() {
// Adicionar evento de clique para interagir com elementos do jogo
window.addEventListener("click", function(event) {
// Verificar se o clique foi em um botão ou elemento de interface
if (event.target.tagName === 'BUTTON' || 
 event.target.closest('.action-buttons') || 
 event.target.closest('#story-screen') ||
 event.target.closest('#bossDialogueContainer') ||
 event.target.closest('#treasureAnimation')) {
return; // Não processar o clique se for em um botão ou elemento de interface
}

// Converter coordenadas do clique para coordenadas do canvas
const canvas = document.getElementById('game');
const rect = canvas.getBoundingClientRect();
const x = event.clientX - rect.left;
const y = event.clientY - rect.top;
});
}

// Função para reviver o jogador
export function revivePlayer() {
// Esconder ambos os botões
document.getElementById("restart").style.display = "none";
document.getElementById("buy-life").style.display = "none";

// Reativar controles do jogo
document.body.classList.add("game-active");

// Definir fase como "waiting" para permitir que o jogador continue
setPhase("waiting");

// Encontrar a última plataforma visível (a plataforma atual onde o jogador caiu)
if (platforms.length > 0) {
// Determinar qual plataforma usar para reviver
let revivePlatformIndex = 0;

if (platforms.length > 1) {
// Se há mais de uma plataforma, usar a plataforma atual (índice 0)
// A plataforma anterior já foi removida do array quando o jogador caiu
revivePlatformIndex = 0;
}

const currentPlatform = platforms[revivePlatformIndex];

// Garantir que o jogador esteja na posição correta na plataforma
setHeroX(currentPlatform.x + currentPlatform.w - gameConfig.heroDistanceFromEdge);
setHeroY(0); // Resetar a altura do herói para ficar em cima da plataforma

// Corrigir o offset da cena para garantir que o jogador esteja visível
setSceneOffset(Math.max(0, currentPlatform.x - gameConfig.paddingX));

// Criar um novo bastão para ser usado
const newSticks = [];
newSticks.push({
x: currentPlatform.x + currentPlatform.w,
length: 0,
rotation: 0
});
updateSticks(newSticks);

// Retomar música de fundo após um breve atraso
if (typeof playBackgroundMusic === 'function') {
setTimeout(playBackgroundMusic, 300);
}

// Atualizar a cena imediatamente
draw();

// Adicionar uma pequena animação para indicar que o jogador renasceu
const perfectElement = document.getElementById("perfect");
perfectElement.innerText = "VIDA EXTRA!";
perfectElement.style.opacity = 1;
perfectElement.style.color = "white";
perfectElement.style.fontWeight = "bold";
perfectElement.style.fontSize = "1.5em";
perfectElement.style.textShadow = "0 2px 4px rgba(0, 0, 0, 0.5)";

// Esconder a mensagem após alguns segundos
setTimeout(() => {
perfectElement.style.opacity = 0;
}, 2000);
}
}

// Adicionar listener para o evento de reviver jogador
window.addEventListener('playerRevive', revivePlayer); 
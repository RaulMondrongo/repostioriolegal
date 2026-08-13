// ==========================================================
// SONS SUTIS (gerados via Web Audio API, sem arquivos externos)
// ==========================================================
let contextoAudio = null;

function pegarContextoAudio() {
    if (!contextoAudio) {
        contextoAudio = new (window.AudioContext || window.webkitAudioContext)();
    }
    return contextoAudio;
}

function tocarSom({ freqInicial, freqFinal, duracao, volume }) {
    const ctx = pegarContextoAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqInicial, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freqFinal, ctx.currentTime + duracao);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracao);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duracao);
}

// Som suave de "vidro" ao passar o mouse
function tocarSomHover() {
    tocarSom({ freqInicial: 900, freqFinal: 1400, duracao: 0.08, volume: 0.03 });
}

// Som de "clique vidrado" ao clicar
function tocarSomClique() {
    tocarSom({ freqInicial: 500, freqFinal: 200, duracao: 0.12, volume: 0.06 });
}

// Aplica os sons em todos os elementos clicáveis (botões e links do menu)
document.querySelectorAll('.botao, .sub-botao, .fechar-janela').forEach((el) => {
    el.addEventListener('mouseenter', tocarSomHover);
    el.addEventListener('click', tocarSomClique);
});

// ==========================================================
// TELA DE SPLASH / CARREGAMENTO
// ==========================================================
const telaSplash = document.getElementById('tela-splash');
const splashPreenchimento = document.getElementById('splash-preenchimento');

function iniciarSplash() {
    let progresso = 0;
    const intervalo = setInterval(() => {
        // avança de forma não-linear, mais rápido no início, mais devagar perto do fim
        progresso += (100 - progresso) * 0.18 + 2;
        if (progresso >= 100) {
            progresso = 100;
            clearInterval(intervalo);

            setTimeout(() => {
                telaSplash.classList.add('escondido');
            }, 300);
        }
        splashPreenchimento.style.width = `${progresso}%`;
    }, 140);
}

iniciarSplash();

// ==========================================================
// WIDGET DE RELÓGIO
// ==========================================================
const widgetHora = document.getElementById('widget-hora');
const widgetData = document.getElementById('widget-data');
const nomesMeses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function atualizarRelogio() {
    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    widgetHora.textContent = `${horas}:${minutos}`;
    widgetData.textContent = `${agora.getDate()} de ${nomesMeses[agora.getMonth()]}`;
}

atualizarRelogio();
setInterval(atualizarRelogio, 1000 * 30);

// ==========================================================
// SQUISH ELÁSTICO NO CLIQUE
// ==========================================================
function aplicarSquish(elemento) {
    elemento.classList.remove('squish');
    void elemento.offsetWidth; // reinicia a animação mesmo em cliques rápidos
    elemento.classList.add('squish');
    setTimeout(() => elemento.classList.remove('squish'), 400);
}

document.querySelectorAll('.botao, .sub-botao, .fechar-janela').forEach((el) => {
    el.addEventListener('click', () => aplicarSquish(el));
});

// --- EFEITO PARALLAX NO FUNDO ---
const bgImagem = document.querySelector('.bg-imagem');

document.addEventListener('mousemove', (event) => {
    const centroX = window.innerWidth / 2;
    const centroY = window.innerHeight / 2;

    const offsetX = (event.clientX - centroX) * 0.03;
    const offsetY = (event.clientY - centroY) * 0.03;

    bgImagem.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(1.05)`;
});

// --- GERENCIADOR DE BOLHAS DINÂMICAS ---
const MAX_BOLHAS = 8;

function criarBolha() {
    const bolhasAtuais = document.querySelectorAll('.bolha').length;
    if (bolhasAtuais >= MAX_BOLHAS) return;

    const bolha = document.createElement('div');
    bolha.classList.add('bolha');

    const tamanho = Math.floor(Math.random() * 70) + 40;
    bolha.style.width = `${tamanho}px`;
    bolha.style.height = `${tamanho}px`;

    const posicaoX = Math.floor(Math.random() * 90);
    bolha.style.left = `${posicaoX}%`;

    const duracao = (Math.random() * 6 + 6).toFixed(1);
    bolha.style.animation = `subir ${duracao}s linear forwards`;

    bolha.addEventListener('click', () => {
        bolha.classList.add('estourando');
        setTimeout(() => {
            bolha.remove();
            criarBolha();
        }, 150);
    });

    bolha.addEventListener('animationend', () => {
        bolha.remove();
        criarBolha();
    });

    document.body.appendChild(bolha);
}

for (let i = 0; i < MAX_BOLHAS; i++) {
    setTimeout(criarBolha, i * 700);
}

// ==========================================================
// SISTEMA DE JANELAS DESLIZANTES
//
// Cada "tela" do site é uma .janela empilhada dentro do .palco.
// Só existe UMA janela .ativa por vez (visível, no centro).
// Ao trocar de janela:
//   - a janela atual desliza pra ESQUERDA e some
//   - a nova janela entra vindo da DIREITA
// Ao voltar (fechar), o processo se inverte:
//   - a janela de conteúdo desliza pra DIREITA e some
//   - o menu volta vindo da ESQUERDA
// ==========================================================

const janelaMenu = document.getElementById('janela-menu');
const botoesAbrir = document.querySelectorAll('[data-tela]');
const botoesFechar = document.querySelectorAll('[data-fechar]');

let animando = false; // trava cliques repetidos durante a animação

/**
 * Troca a janela visível.
 * @param {HTMLElement} janelaSai - janela que está saindo de cena
 * @param {HTMLElement} janelaEntra - janela que vai aparecer
 * @param {'direita'|'esquerda'} direcaoEntrada - de que lado a nova janela entra
 */
function trocarJanela(janelaSai, janelaEntra, direcaoEntrada) {
    if (animando || janelaSai === janelaEntra) return;
    animando = true;

    if (direcaoEntrada === 'esquerda') {
        // Prepara a janela que entra do lado esquerdo, sem animar ainda
        janelaEntra.classList.remove('ativa');
        janelaEntra.classList.add('fora-esquerda');

        // Força o navegador a "registrar" essa posição antes de animar
        void janelaEntra.offsetWidth;

        janelaEntra.classList.remove('fora-esquerda');
        janelaSai.classList.remove('ativa');
        janelaSai.classList.add('saindo-direita');
        janelaEntra.classList.add('ativa');
    } else {
        // Entrada padrão pela direita (comportamento normal do CSS)
        janelaSai.classList.remove('ativa');
        janelaSai.classList.add('saindo-esquerda');
        janelaEntra.classList.add('ativa');
    }

    // Depois que a transição termina, limpa as classes auxiliares
    const duracaoAnimacao = 520; // um pouco mais que os 0.5s do CSS
    setTimeout(() => {
        janelaSai.classList.remove('saindo-esquerda', 'saindo-direita');
        animando = false;
    }, duracaoAnimacao);
}

// Abrir: menu sai pela esquerda, janela de conteúdo entra pela direita
botoesAbrir.forEach((botao) => {
    botao.addEventListener('click', () => {
        const id = botao.getAttribute('data-tela');
        const janelaAlvo = document.getElementById(id);

        if (!janelaAlvo) {
            console.warn(`Nenhuma janela encontrada com id="${id}"`);
            return;
        }

        trocarJanela(janelaMenu, janelaAlvo, 'direita');
    });
});

// Fechar: janela de conteúdo sai pela direita, menu volta pela esquerda
botoesFechar.forEach((botao) => {
    botao.addEventListener('click', () => {
        const janelaAtual = botao.closest('.janela');
        trocarJanela(janelaAtual, janelaMenu, 'esquerda');
    });
});

// Fecha a janela atual com a tecla ESC (exceto se já estiver no menu)
document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    const janelaAberta = document.querySelector('.janela.ativa:not(#janela-menu)');
    if (janelaAberta) {
        trocarJanela(janelaAberta, janelaMenu, 'esquerda');
    }
});
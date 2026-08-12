const bgImagem = document.querySelector('.bg-imagem');

// --- EFEITO PARALLAX NO FUNDO ---
document.addEventListener('mousemove', (event) => {
    const centroX = window.innerWidth / 2;
    const centroY = window.innerHeight / 2;

    const offsetX = (event.clientX - centroX) * 0.03;
    const offsetY = (event.clientY - centroY) * 0.03;

    bgImagem.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(1.05)`;
});

// --- GERENCIADOR DE BOLHAS DINÂMICAS ---
const MAX_BOLHAS = 8; // Ajuste este número se quiser mais ou menos bolhas simultâneas

function criarBolha() {
    // Controla para não ultrapassar o limite na tela
    const bolhasAtuais = document.querySelectorAll('.bolha').length;
    if (bolhasAtuais >= MAX_BOLHAS) return;

    const bolha = document.createElement('div');
    bolha.classList.add('bolha');

    // Tamanho aleatório entre 40px e 110px
    const tamanho = Math.floor(Math.random() * 70) + 40;
    bolha.style.width = `${tamanho}px`;
    bolha.style.height = `${tamanho}px`;

    // Posição horizontal aleatória (em %)
    const posicaoX = Math.floor(Math.random() * 90);
    bolha.style.left = `${posicaoX}%`;

    // Tempo de subida aleatório entre 6s e 12s
    const duracao = (Math.random() * 6 + 6).toFixed(1);
    bolha.style.animation = `subir ${duracao}s linear forwards`;

    // Clique para estourar
    bolha.addEventListener('click', () => {
        bolha.classList.add('estourando');
        setTimeout(() => {
            bolha.remove();
            criarBolha(); // Gera uma nova para repor
        }, 150);
    });

    // Remove do HTML quando terminar de subir até o topo
    bolha.addEventListener('animationend', () => {
        bolha.remove();
        criarBolha(); // Gera outra bolha no lugar
    });

    document.body.appendChild(bolha);
}

// Cria as bolhas gradualmente com pequenos intervalos ao carregar
for (let i = 0; i < MAX_BOLHAS; i++) {
    setTimeout(criarBolha, i * 700);
}
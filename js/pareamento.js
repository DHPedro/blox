import { database, ref, push, onValue, update, remove } from './firebase-config.js';

const PAREAMENTO_PATH = 'pareamento_1v1';
const pareamentoRef = ref(database, PAREAMENTO_PATH);
const TEMPO_LIMITE_SEGUNDOS = 120;

let jogadorPartidaId = null;
let countdownInterval = null;
let partidaEntradaCache = null;

document.addEventListener('DOMContentLoaded', () => {
    const btnCriar = document.getElementById('btn-criar-partida');
    const btnEncontrar = document.getElementById('btn-encontrar-partida');
    const listaPartidasAbertas = document.getElementById('lista-partidas-abertas');

    const modalCriar = document.getElementById('modal-criar');
    const formCriarPartida = document.getElementById('form-criar-partida');
    const modalEntrada = document.getElementById('modal-entrada');
    const formEntradaPartida = document.getElementById('form-entrada-partida');
    const modalResultado = document.getElementById('modal-resultado');
    const modalResultadoContent = document.getElementById('modal-resultado-content');

    const fecharModal = (modalElement) => {
        modalElement.style.display = 'none';
        if (modalElement === modalResultado) clearInterval(countdownInterval);
    };
    const abrirModal = (modalElement) => modalElement.style.display = 'block';
    const gerarCodigo = () => Math.floor(10000 + Math.random() * 90000);

    btnCriar.addEventListener('click', () => abrirModal(modalCriar));
    btnEncontrar.addEventListener('click', () => {
        alert("A lista de partidas abertas é atualizada em tempo real abaixo!");
        listaPartidasAbertas.scrollIntoView({ behavior: 'smooth' });
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => fecharModal(e.target.closest('.modal')));
    });

    window.onclick = (event) => {
        if (event.target === modalCriar) fecharModal(modalCriar);
        if (event.target === modalEntrada) fecharModal(modalEntrada);
        if (event.target === modalResultado) fecharModal(modalResultado);
    };

    // --- Criar Partida ---
    formCriarPartida.addEventListener('submit', (e) => {
        e.preventDefault();

        const p1Data = {
            nick: document.getElementById('p-nick').value,
            discord: document.getElementById('p-discord').value,
            nivel: parseInt(document.getElementById('p-nivel').value),
            estilo: document.getElementById('p-estilo').value,
            arma: document.getElementById('p-arma').value,
            espada: document.getElementById('p-espada').value,
            fruta: document.getElementById('p-fruta').value,
            raca: document.getElementById('p-raca').value
        };

        const novaPartida = {
            status: 'aguardando',
            data: new Date().toISOString(),
            jogador1: p1Data,
            jogador2: null,
            codigo: null,
            timestamp: null
        };

        const newRef = push(pareamentoRef, novaPartida);
        jogadorPartidaId = newRef.key;

        fecharModal(modalCriar);

        modalResultadoContent.innerHTML = `
            <h2><i class="fas fa-clock"></i> Partida Criada!</h2>
            <p>ID: <strong>${jogadorPartidaId}</strong></p>
            <p style="color: var(--cor-primaria); font-weight: 700; margin-top: 10px;">Aguardando oponente...</p>
            <button id="btn-cancelar-partida" class="btn-acao" style="background-color: var(--cor-erro); margin-top: 20px;">
                <i class="fas fa-times-circle"></i> Cancelar Partida
            </button>
        `;
        abrirModal(modalResultado);

        startPartidaListener(jogadorPartidaId, p1Data.discord);
    });

    const abrirModalEntrada = (partidaId, partidaData) => {
        partidaEntradaCache = { id: partidaId, data: partidaData };
        formEntradaPartida.reset();
        abrirModal(modalEntrada);
    };

    formEntradaPartida.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!partidaEntradaCache) return alert("Erro: Partida de entrada não encontrada.");

        const partidaId = partidaEntradaCache.id;
        const jogador2 = {
            nick: document.getElementById('e-nick').value,
            discord: document.getElementById('e-discord').value,
            nivel: parseInt(document.getElementById('e-nivel').value),
            estilo: document.getElementById('e-estilo').value,
            arma: document.getElementById('e-arma').value,
            espada: document.getElementById('e-espada').value,
            fruta: document.getElementById('e-fruta').value,
            raca: document.getElementById('e-raca').value
        };

        const codigoGerado = gerarCodigo();

        const partidaRefToUpdate = ref(database, `${PAREAMENTO_PATH}/${partidaId}`);
        update(partidaRefToUpdate, {
            status: 'confirmado',
            jogador2: jogador2,
            codigo: codigoGerado,
            timestamp: new Date().getTime()
        })
        .then(() => {
            fecharModal(modalEntrada);
            mostrarResultadoPareamento(partidaId, jogador2, partidaEntradaCache.data.jogador1);
        })
        .catch(error => {
            fecharModal(modalEntrada);
            alert("Erro ao entrar na partida: " + error.message);
        });
    });

    const startPartidaListener = (partidaId, jogadorDiscord) => {
        const partidaEspecificaRef = ref(database, `${PAREAMENTO_PATH}/${partidaId}`);
        onValue(partidaEspecificaRef, (snapshot) => {
            const partida = snapshot.val();
            if (!partida) {
                fecharModal(modalResultado);
                alert("A partida foi encerrada/cancelada.");
                return;
            }
            if (partida.status === 'confirmado') {
                mostrarResultadoPareamento(partidaId, partida.jogador2, partida.jogador1);
            }
        });
    };

    const mostrarResultadoPareamento = (partidaId, jogador2, jogador1) => {
        modalResultadoContent.innerHTML = `
            <h2 style="color: var(--cor-sucesso);"><i class="fas fa-robot"></i> PARTIDA CONFIRMADA!</h2>
            <p>O canal privado do Discord foi criado automaticamente para vocês.</p>
            <p>Confira o canal: <strong>#partida-${partidaId.substring(0, 4)}</strong></p>

            <h3>Dados do Oponente (${jogador1.nick})</h3>
            <p><strong>Discord:</strong> ${jogador1.discord}</p>
            <p><strong>Nível:</strong> ${jogador1.nivel}</p>
            <p><strong>Build:</strong> ${jogador1.fruta} / ${jogador1.espada} / ${jogador1.arma} / ${jogador1.raca} / ${jogador1.estilo}</p>

            <h3>Sua Build (${jogador2.nick})</h3>
            <p><strong>Discord:</strong> ${jogador2.discord}</p>
            <p><strong>Nível:</strong> ${jogador2.nivel}</p>
            <p><strong>Build:</strong> ${jogador2.fruta} / ${jogador2.espada} / ${jogador2.arma} / ${jogador2.raca} / ${jogador2.estilo}</p>
        `;
        abrirModal(modalResultado);
    };

    // --- Listar Partidas Abertas ---
    onValue(pareamentoRef, (snapshot) => {
        listaPartidasAbertas.innerHTML = '';
        const partidas = snapshot.val();
        let encontrouPartida = false;

        if (partidas) {
            Object.entries(partidas).forEach(([id, partida]) => {
                if (partida.status === 'aguardando') {
                    encontrouPartida = true;
                    const p1 = partida.jogador1;
                    const card = document.createElement('div');
                    card.className = 'card-pareamento';
                    card.innerHTML = `
                        <h4><i class="fas fa-clock"></i> Aguardando Oponente</h4>
                        <p><strong>Criador:</strong> ${p1.nick}</p>
                        <p><strong>Nível:</strong> ${p1.nivel}</p>
                        <hr style="border-color: rgba(255,255,255,0.1); margin: 5px 0;">
                        <p><strong>Fruta:</strong> ${p1.fruta}</p>
                        <p><strong>Espada:</strong> ${p1.espada}</p>
                        <p><strong>Arma:</strong> ${p1.arma}</p>
                        <p><strong>Estilo:</strong> ${p1.estilo}</p>
                        <p><strong>Raça:</strong> ${p1.raca}</p>

                        <button class="btn-entrar" data-id="${id}">
                            <i class="fas fa-handshake"></i> ENTRAR NESSA PARTIDA
                        </button>
                    `;
                    listaPartidasAbertas.appendChild(card);
                }
            });
        }

        if (!encontrouPartida) {
            listaPartidasAbertas.innerHTML = '<p class="msg-sem-partida" style="grid-column: 1/-1;">Nenhuma partida aguardando oponente. Crie uma!</p>';
        }

        document.querySelectorAll('.btn-entrar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const partidaId = e.currentTarget.dataset.id;
                const partidaData = partidas[partidaId];
                abrirModalEntrada(partidaId, partidaData);
            });
        });
    });

    modalResultado.addEventListener('click', (e) => {
        if (e.target.id === 'btn-cancelar-partida') {
            if (!jogadorPartidaId) return;
            if (confirm("Tem certeza que deseja cancelar e deletar esta partida?")) {
                const partidaRefToDelete = ref(database, `${PAREAMENTO_PATH}/${jogadorPartidaId}`);
                remove(partidaRefToDelete)
                    .then(() => {
                        alert("Partida cancelada com sucesso.");
                        fecharModal(modalResultado);
                        jogadorPartidaId = null;
                    })
                    .catch(error => alert("Erro ao cancelar: " + error.message));
            }
        }
    });
});

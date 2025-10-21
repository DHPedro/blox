
import { partidasRef, onValue } from './firebase-config.js'; 

document.addEventListener('DOMContentLoaded', () => {
    const partidasContainer = document.getElementById('partidas-container');
    const filtroStatus = document.getElementById('filtro-status');
    const campoBusca = document.getElementById('campo-busca');
    const modal = document.getElementById('partida-modal');
    const modalContent = document.getElementById('modal-body-content');
    
    let cachedPartidas = [];

    if (!partidasContainer || !filtroStatus || !campoBusca || !modal) {
        console.warn("Aviso: Elementos essenciais não encontrados. Verifique o index.html.");
        return; 
    }

    
    const criarConteudoModal = (partida) => {
        const valorEmReais = partida.valor ? 
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(partida.valor) : 
            'Valor Não Definido';

        let jogadoresHtml = '';
        partida.times.forEach(time => {
            const timeLetra = time.nome_time.split(' ')[1];
            time.jogadores.forEach(jogador => {
                jogadoresHtml += `
                    <div class="detalhes-modal-jogador">
                        <h4><i class="fas fa-user-circle"></i> ${jogador.nome} <span style="font-size: 0.8em; color: #aaa;">(Time ${timeLetra})</span></h4>
                        <p><strong>Discord ID:</strong> ${jogador.discord_id || 'N/A'}</p>
                        <p><strong>Build:</strong> <span style="color: #ff9800;">${jogador.itens || 'Não Informado'}</span></p>
                    </div>
                `;
            });
        });
        
        return `
            <span class="close-btn" style="float: right; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
            <h2 style="color: var(--cor-secundaria);">Partida #${partida.numeroPartida}</h2>
            <p style="font-weight: 700; margin-top: 10px;">Status: <span style="color: var(--cor-primaria);">${partida.status.toUpperCase()}</span></p>
            <p style="font-size: 1.2rem; margin-bottom: 20px;">💰 Valor Apostado: ${valorEmReais}</p>
            <p style="font-size: 0.8em; color: #777;">ID de Referência: ${partida.id}</p>
            
            ${partida.vencedor ? `<h3 style="color: var(--cor-sucesso); margin-top: 15px;"><i class="fas fa-trophy"></i> VENCEDOR: ${partida.vencedor}</h3>` : ''}
            
            <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">

            <h3 style="margin-bottom: 15px;"><i class="fas fa-users"></i> Jogadores e Builds (${partida.times[0].jogadores.length}v${partida.times[1].jogadores.length})</h3>
            ${jogadoresHtml}
            
            <p style="margin-top: 15px;"><strong>Observações:</strong> ${partida.descricao || 'Nenhuma.'}</p>
            ${partida.replay_url ? `<a href="${partida.replay_url}" target="_blank" class="link-replay btn-detalhes-modal" style="display: block; text-align: center; margin-top: 20px;"><i class="fas fa-video"></i> Ver Replay</a>` : ''}
        `;
    };

    const abrirModal = (partida) => {
        modalContent.innerHTML = criarConteudoModal(partida);
        modal.style.display = 'block';

        const closeBtn = document.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }
    };
    
    // Fechar o modal ao clicar fora dele (pode permanecer fora do abrirModal)
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
    
    
    const criarCardPartida = (numeroPartida, id, partida) => {
        let statusCor, statusIcone;
        switch (partida.status.toLowerCase()) {
            case 'finalizada': statusCor = 'verde'; statusIcone = 'fa-check-circle'; break;
            case 'em andamento': statusCor = 'amarelo'; statusIcone = 'fa-circle-notch fa-spin'; break;
            case 'anulada': statusCor = 'vermelho'; statusIcone = 'fa-times-circle'; break;
            default: statusCor = 'cinza'; statusIcone = 'fa-hourglass-half'; break;
        }

        const nomesJogadores = partida.times.map(t => 
            t.jogadores.map(j => j.nome).join(' & ')
        ).join(' vs ');
        
        const valorEmReais = partida.valor ? 
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(partida.valor) : 
            'Valor Não Definido';

        return `
            <div class="card-partida ${statusCor}" data-id="${id}">
                <div class="card-header">
                    <span class="status-badge">#${numeroPartida} | <i class="fas ${statusIcone}"></i> ${partida.status}</span>
                    <span class="valor-aposta">${valorEmReais}</span>
                </div>
                <h3 class="partida-title-vs">${nomesJogadores}</h3>
                <p class="jogadores-info">
                    <i class="fas fa-users"></i> Formato: ${partida.times[0].jogadores.length}v${partida.times[1].jogadores.length}
                </p>
                <div class="card-footer">
                    ${partida.vencedor ? `<span class="vencedor"><i class="fas fa-trophy"></i> Vencedor: ${partida.vencedor}</span>` : `<span class="vencedor"><i class="fas fa-clock"></i> Aguardando resultado</span>`}
                    <button class="btn-detalhes-modal" data-id="${id}">Ver Detalhes</button>
                </div>
            </div>
        `;
    };

    const renderizarPartidas = (snapshot) => {
        const partidasData = snapshot.val(); 
        partidasContainer.innerHTML = ''; 

        if (!partidasData) {
            partidasContainer.innerHTML = '<p class="msg-sem-partida">Nenhuma partida registrada ainda.</p>';
            cachedPartidas = [];
            return;
        }

        const todasPartidas = Object.entries(partidasData)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => new Date(a.data) - new Date(b.data)); 
        
        todasPartidas.forEach((p, index) => p.numeroPartida = index + 1);
        cachedPartidas = todasPartidas; 
        
        const partidasParaExibir = [...todasPartidas].reverse(); 
        
        const statusSelecionado = filtroStatus.value;
        const termoBusca = campoBusca.value.toLowerCase().trim();
        
        const partidasFiltradas = partidasParaExibir.filter(partida => {
            const statusCorresponde = statusSelecionado === 'todos' || partida.status.toLowerCase() === statusSelecionado.toLowerCase();
            
            let buscaCorresponde = true;
            if (termoBusca) {
                const dadosPartida = JSON.stringify(partida).toLowerCase();
                buscaCorresponde = dadosPartida.includes(termoBusca);
            }

            return statusCorresponde && buscaCorresponde;
        });

        if (partidasFiltradas.length > 0) {
            partidasFiltradas.forEach(partida => {
                partidasContainer.innerHTML += criarCardPartida(partida.numeroPartida, partida.id, partida);
            });
            
            setTimeout(() => {
                document.querySelectorAll('.btn-detalhes-modal').forEach(btn => {
                    btn.removeEventListener('click', handleDetalhesClick);
                    btn.addEventListener('click', handleDetalhesClick);
                });
            }, 0);
            
        } else {
            partidasContainer.innerHTML = '<p class="msg-sem-partida">Nenhuma partida encontrada com os filtros atuais.</p>';
        }
    };
    
    // Função clique do botão "Ver Detalhes"
    const handleDetalhesClick = (e) => {
        const partidaId = e.target.dataset.id;
        const partidaData = cachedPartidas.find(p => p.id === partidaId);
        
        if (partidaData) {
            abrirModal(partidaData);
        } else {
            console.error("Dados da partida não encontrados para o ID:", partidaId);
        }
    };

    // Ouvinte em tempo real
    onValue(partidasRef, renderizarPartidas);

    filtroStatus.addEventListener('change', () => onValue(partidasRef, renderizarPartidas));
    campoBusca.addEventListener('input', () => onValue(partidasRef, renderizarPartidas));
});
document.addEventListener('DOMContentLoaded', () => {
    const detalhesContainer = document.getElementById('detalhes-partida');

    const urlParams = new URLSearchParams(window.location.search);
    const partidaId = urlParams.get('id');

    if (!partidaId) {
        detalhesContainer.innerHTML = '<p class="msg-sem-partida">❌ ID da partida não encontrado na URL.</p>';
        return;
    }

    partidasRef.child(partidaId).once('value', (snapshot) => {
        const partida = snapshot.val();

        if (!partida) {
            detalhesContainer.innerHTML = '<p class="msg-sem-partida">❌ Partida não encontrada no banco de dados.</p>';
            return;
        }
        
        renderizarDetalhes(partida);
    });

    const renderizarDetalhes = (partida) => {
        let statusCor, statusIcone;
        switch (partida.status.toLowerCase()) {
            case 'finalizada':
                statusCor = 'verde'; statusIcone = 'fa-check-circle'; break;
            case 'em andamento':
                statusCor = 'amarelo'; statusIcone = 'fa-circle-notch fa-spin'; break;
            case 'anulada':
                statusCor = 'vermelho'; statusIcone = 'fa-times-circle'; break;
            default: // Pendente
                statusCor = 'cinza'; statusIcone = 'fa-hourglass-half'; break;
        }

        const tituloPartida = partida.times.map(t => t.nome_time).join(' vs ');
        const valorFormatado = partida.valor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(partida.valor).replace('R$', '') + ' Beli' : 'N/A';
        const dataPartida = partida.data ? new Date(partida.data).toLocaleDateString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';
        
        const timesHTML = partida.times.map(time => `
            <div class="time-card">
                <h4><i class="fas fa-users"></i> ${time.nome_time}</h4>
                ${time.jogadores.map(jogador => `
                    <span class="player-tag">
                        <strong>${jogador.nome}</strong> (ID Discord: ${jogador.discord_id})
                    </span>
                `).join('')}
            </div>
        `).join('');

        // HTML final
        detalhesContainer.innerHTML = `
            <div class="detalhes-container">
                <div class="detalhes-header">
                    <span class="status-grande ${statusCor}">
                        <i class="fas ${statusIcone}"></i> Status: ${partida.status.toUpperCase()}
                    </span>
                    <h1>${tituloPartida}</h1>
                    <p class="jogadores-info">Registrada em: ${dataPartida}</p>
                </div>
                
                <div style="display: flex; gap: 30px; flex-wrap: wrap;">
                    
                    <div style="flex: 1; min-width: 300px;">
                        <div class="info-secao">
                            <h3><i class="fas fa-coins"></i> Informações Financeiras</h3>
                            <div class="info-item">
                                <p><strong>Valor da Aposta:</strong> ${valorFormatado}</p>
                                ${partida.vencedor ? `<p class="vencedor-destaque"><i class="fas fa-trophy"></i> VENCEDOR: ${partida.vencedor}</p>` : ''}
                            </div>
                        </div>

                        <div class="info-secao">
                            <h3><i class="fas fa-list-alt"></i> Detalhes da Partida</h3>
                            <div class="info-item">
                                <p><strong>Itens/Frutas Utilizadas:</strong> ${partida.itens_usados || 'Não informado.'}</p>
                                <p><strong>Descrição Admin:</strong> ${partida.descricao || 'Sem observações adicionais.'}</p>
                                ${partida.status.toLowerCase() === 'anulada' && partida.motivo_anulamento ? 
                                    `<p style="color: var(--cor-erro); font-weight: 700;"><strong>Motivo Anulamento:</strong> ${partida.motivo_anulamento}</p>` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div style="flex: 1; min-width: 300px;">
                        <div class="info-secao">
                            <h3><i class="fas fa-users-cog"></i> Times Participantes</h3>
                            ${timesHTML}
                        </div>
                    </div>
                </div>

                ${partida.replay_url ? `
                    <a href="${partida.replay_url}" target="_blank" class="link-replay">
                        <i class="fas fa-video"></i> ASSISTIR REPLAY OFICIAL
                    </a>
                ` : '<p style="text-align: center; margin-top: 30px;">O link do replay não está disponível.</p>'}
                
                <p style="text-align: center; margin-top: 20px;"><a href="index.html"><i class="fas fa-arrow-left"></i> Voltar à Lista</a></p>
            </div>
        `;
    };
});
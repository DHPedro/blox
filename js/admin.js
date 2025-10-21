
import { 
    auth, database, partidasRef, onValue, push, remove, ref, update, get,
    signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from './firebase-config.js'; 

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginFormContent = document.getElementById('login-form-content');
    const adminPanel = document.getElementById('admin-panel');
    const partidaForm = document.getElementById('partida-form');
    const listaAdminContainer = document.getElementById('lista-admin-partidas');
    const adminActions = document.getElementById('admin-actions');
    
    const numJogadoresA = document.getElementById('num-jogadores-a');
    const numJogadoresB = document.getElementById('num-jogadores-b');
    const jogadoresInputsContainer = document.getElementById('jogadores-inputs-container');

    let isEditing = false;
    let currentPartidaId = null;

    const gerarInputJogador = (timeLetra, num, jogador = {}) => {
        return `
            <div class="form-group" style="border-left: 3px solid var(--cor-secundaria); padding-left: 10px; margin-top: 10px;">
                <label style="color: var(--cor-primaria);">JOGADOR ${num} (Time ${timeLetra}):</label>
                <input type="text" id="nome-${timeLetra}-${num}" placeholder="Nome (Ex: Luffy)" required 
                       value="${jogador.nome || ''}">
                <input type="text" id="discord-${timeLetra}-${num}" placeholder="ID Discord" required 
                       value="${jogador.discord_id || ''}">
                <input type="text" id="itens-${timeLetra}-${num}" placeholder="Itens/Build (Ex: Yoru, Buda V2, Godhuman)"
                       value="${jogador.itens || ''}">
            </div>
        `;
    };

    const atualizarFormularioJogadores = (partidaData = null) => {
        const numA = parseInt(numJogadoresA.value);
        const numB = parseInt(numJogadoresB.value);
        let html = '';

        for (let i = 1; i <= numA; i++) {
            const jogadorData = partidaData?.times?.[0]?.jogadores?.[i - 1] || {};
            html += gerarInputJogador('A', i, jogadorData);
        }
        
        for (let i = 1; i <= numB; i++) {
            const jogadorData = partidaData?.times?.[1]?.jogadores?.[i - 1] || {};
            html += gerarInputJogador('B', i, jogadorData);
        }

        jogadoresInputsContainer.innerHTML = html;
    };
    
    numJogadoresA.addEventListener('input', () => atualizarFormularioJogadores());
    numJogadoresB.addEventListener('input', () => atualizarFormularioJogadores());
    
    atualizarFormularioJogadores(); 
    
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginForm.style.display = 'none';
            adminPanel.style.display = 'block';
            adminActions.style.display = 'block';
            carregarListaPartidasAdmin();
        } else {
            loginForm.style.display = 'block';
            adminPanel.style.display = 'none';
            adminActions.style.display = 'none';
            resetForm(); 
        }
    });

    loginFormContent.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const senha = document.getElementById('admin-senha').value;
        signInWithEmailAndPassword(auth, email, senha).catch((error) => alert("Erro no Login: " + error.message));
    });
    
    document.getElementById('btn-logout').addEventListener('click', () => {
        signOut(auth);
    });

    const resetForm = () => {
        partidaForm.reset();
        isEditing = false;
        currentPartidaId = null;
        partidaForm.querySelector('button[type="submit"]').textContent = 'Salvar Partida';
        numJogadoresA.value = 1;
        numJogadoresB.value = 1;
        atualizarFormularioJogadores();
    }
    
    partidaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const valor = parseFloat(document.getElementById('p-valor').value);
        const status = document.getElementById('p-status').value;
        const vencedor = document.getElementById('p-vencedor').value || "";
        const replayUrl = document.getElementById('p-replay-url').value || "";
        const descricao = document.getElementById('p-descricao').value || "";
        
        const numA = parseInt(numJogadoresA.value);
        const numB = parseInt(numJogadoresB.value);
        
        let times = [
            { nome_time: "Time A", jogadores: [] },
            { nome_time: "Time B", jogadores: [] }
        ];

        for (let i = 1; i <= numA; i++) {
            times[0].jogadores.push({
                nome: document.getElementById(`nome-A-${i}`).value,
                discord_id: document.getElementById(`discord-A-${i}`).value,
                itens: document.getElementById(`itens-A-${i}`).value || ""
            });
        }
        for (let i = 1; i <= numB; i++) {
            times[1].jogadores.push({
                nome: document.getElementById(`nome-B-${i}`).value,
                discord_id: document.getElementById(`discord-B-${i}`).value,
                itens: document.getElementById(`itens-B-${i}`).value || ""
            });
        }
        
        let motivoAnulamento = '';
        if (status.toLowerCase() === 'anulada') {
            motivoAnulamento = prompt("Por favor, insira o motivo do anulamento:") || "Motivo não especificado";
        }
        
        let partidaExistente = null;
        if (isEditing) {
             const snapshot = await get(ref(database, 'partidas/' + currentPartidaId));
             partidaExistente = snapshot.val();
        }

        const partidaData = {
            times: times,
            valor: valor,
            status: status,
            vencedor: vencedor,
            replay_url: replayUrl,
            descricao: descricao,
            motivo_anulamento: motivoAnulamento,
            data: isEditing ? partidaExistente?.data : new Date().toISOString()
        };

        if (isEditing) {
            const partidaRefToUpdate = ref(database, 'partidas/' + currentPartidaId);
            update(partidaRefToUpdate, partidaData)
                .then(() => {
                    alert("✅ Partida ATUALIZADA com sucesso!");
                    resetForm();
                })
                .catch((error) => alert("❌ Erro ao atualizar partida: " + error.message));
        } else {
            // CRIAR (PUSH)
            push(partidasRef, partidaData)
                .then(() => {
                    alert("✅ Partida criada com sucesso!");
                    resetForm();
                })
                .catch((error) => alert("❌ Erro ao criar partida: " + error.message));
        }
    });

    function carregarListaPartidasAdmin() {
        onValue(partidasRef, (snapshot) => {
            listaAdminContainer.innerHTML = '';
            const partidasData = snapshot.val();
            
            if (partidasData) {
                const todasPartidas = Object.entries(partidasData)
                    .map(([id, data]) => ({ id, ...data }))
                    .sort((a, b) => new Date(a.data) - new Date(b.data)); 
                
                todasPartidas.forEach((p, index) => p.numeroPartida = index + 1);
                
                const partidasArray = [...todasPartidas].reverse(); 

                partidasArray.forEach((partida) => {
                    const nomesJogadores = partida.times.map(t => 
                        t.jogadores.map(j => j.nome).join(' & ')
                    ).join(' vs ');
                    
                    const listItem = document.createElement('div');
                    listItem.className = 'admin-partida-item';
                    listItem.innerHTML = `
                        <span>#${partida.numeroPartida} | ${nomesJogadores} (${partida.status})</span>
                        <div>
                            <button class="btn-editar btn-submit" data-id="${partida.id}"><i class="fas fa-edit"></i> Editar</button>
                            <button class="btn-excluir" style="background-color: var(--cor-erro); color: white;" data-id="${partida.id}"><i class="fas fa-trash-alt"></i> Excluir</button>
                        </div>
                    `;
                    listaAdminContainer.appendChild(listItem);
                });

                document.querySelectorAll('.btn-excluir').forEach(btn => btn.addEventListener('click', excluirPartida));
                document.querySelectorAll('.btn-editar').forEach(btn => btn.addEventListener('click', iniciarEdicao));
            } else {
                listaAdminContainer.innerHTML = '<p style="color: var(--cor-neutra);">Nenhuma partida encontrada.</p>';
            }
        });
    }

    function excluirPartida(e) {
        e.preventDefault();
        const partidaId = e.currentTarget.dataset.id;
        if (confirm(`Tem certeza que deseja EXCLUIR permanentemente a partida ${partidaId.substring(0, 8)}?`)) {
            // CORREÇÃO: Passa o banco de dados e o caminho completo
            const partidaRefToDelete = ref(database, 'partidas/' + partidaId); 
            remove(partidaRefToDelete)
                .then(() => alert("✅ Partida excluída com sucesso!"))
                .catch(error => alert("❌ Erro ao excluir: " + error.message));
        }
    }
    
    async function iniciarEdicao(e) {
        const partidaId = e.currentTarget.dataset.id;
        
        document.getElementById('admin-panel').scrollIntoView({ behavior: 'smooth' });

        const snapshot = await get(ref(database, 'partidas/' + partidaId));
        const partida = snapshot.val();
        
        if (!partida) return;

        isEditing = true;
        currentPartidaId = partidaId;
        partidaForm.querySelector('button[type="submit"]').textContent = 'Atualizar Partida';
        
        document.getElementById('p-valor').value = partida.valor;
        document.getElementById('p-status').value = partida.status;
        document.getElementById('p-vencedor').value = partida.vencedor || '';
        document.getElementById('p-replay-url').value = partida.replay_url || '';
        document.getElementById('p-descricao').value = partida.descricao || '';
        
        const numA = partida.times[0].jogadores.length;
        const numB = partida.times[1].jogadores.length;
        numJogadoresA.value = numA;
        numJogadoresB.value = numB;
        
        atualizarFormularioJogadores(partida);
    }
    
    const btnCancelar = document.createElement('button');
    btnCancelar.textContent = 'Criar Nova';
    btnCancelar.className = 'btn-header';
    btnCancelar.style.marginLeft = '10px';
    btnCancelar.onclick = (e) => {
        e.preventDefault();
        resetForm();
    };
    partidaForm.parentElement.querySelector('h2').appendChild(btnCancelar);

});
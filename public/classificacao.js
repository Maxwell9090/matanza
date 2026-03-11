// ========================
// Configurações
// ========================
const PONTOS_POSICAO = [100,90,80,70,60,50,40,30,20,10];
const PONTOS_POR_KILL = 20;
const NUM_QUEDAS = 3;
const NUM_MAX_TIMES = 25;

let times = [];
let rankingsAnteriores = {};

// ========================
// Lógica Principal com Firebase
// ========================
function carregarTimesSalvos() {
  db.ref("classificacao/times").on('value', snapshot => {
    const dados = snapshot.val();
    
    times.forEach(time => {
      if (time.nome) {
        rankingsAnteriores[time.nome] = time.rank;
      }
    });

    if (dados && Array.isArray(dados)) {
      times = dados.map(t => ({
        ...t,
        cla: t.cla || "", // Recebe o Clã também
        queda3Preenchida: t.queda3Preenchida || false
      }));
    } else {
      times = [];
    }

    renderTabela();
  });
}

function salvarTimes() {
  times.forEach(calcularPontuacaoTime);
  db.ref("classificacao/times").set(times);
}

carregarTimesSalvos();

// ========================
// Estrutura de dados e Cálculos
// ========================
function criarNovoTime(cla = "", line = "") {
  return {
    cla: cla,
    nome: line,
    quedas: Array.from({ length: NUM_QUEDAS }, () => ({posicao: 30, kills: 0})),
    total: 0,
    rank: 0,
    queda3Preenchida: false
  }
}

function calcularPontuacaoTime(time) {
  time.total = 0;
  time.totalKills = 0;
  time.quedas.forEach(queda => {
    const pos = queda.posicao || 25;
    const kills = queda.kills || 0;
    let pontosPosicao = (pos >= 1 && pos <= 10) ? PONTOS_POSICAO[pos - 1] : 0;
    let pontosKills = kills * PONTOS_POR_KILL;
    time.total += pontosPosicao + pontosKills;
    time.totalKills += kills;
  });
}

function todasLinesAtivasCompletas() {
  const linesAtivas = times.filter(t => t.nome && t.nome.trim() !== "");
  if (linesAtivas.length === 0) return false;
  return linesAtivas.every(t => t.queda3Preenchida === true);
}

// ========================
// IMPORTAÇÃO DOS SLOTS AUTOMÁTICA
// ========================
window.importarSlots = async function() {
  if (!confirm("ATENÇÃO: Isso vai importar os Clãs e Lines preenchidos nos Slots e ADICIONAR na tabela de Classificação. Deseja continuar?")) return;
  
  try {
    const snapshot = await db.ref('slots').once('value');
    const slots = snapshot.val();
    
    if(!slots) {
      alert("Nenhum slot encontrado no banco de dados.");
      return;
    }

    let novosTimes = [];
    
    // Varre os slots possíveis
    for (let key in slots) {
      let slot = slots[key];
      // Se houver um clã ou uma line preenchida
      if (slot.clã || slot.line) {
        novosTimes.push(criarNovoTime(slot.clã || "Sem Clã", slot.line || "Sem Line"));
      }
    }

    if (novosTimes.length === 0) {
      alert("Nenhum slot preenchido encontrado.");
      return;
    }

    // Atualiza a tabela com as novas equipes
    times = novosTimes;
    rankingsAnteriores = {};
    salvarTimes();
    alert("Slots importados com sucesso!");

  } catch(error) {
    console.error("Erro ao importar slots:", error);
    alert("Ocorreu um erro ao importar os slots. Verifique sua conexão.");
  }
}


// ========================
// Renderização da Tabela (HTML)
// ========================
function renderTabela() {
  times.forEach(calcularPontuacaoTime);

  const rankingLiberado = todasLinesAtivasCompletas();

  if (rankingLiberado) {
    times.sort((a,b) => b.total - a.total);
  }

  const tbody = document.querySelector('#tbl-classificacao tbody');
  tbody.innerHTML = "";

  if (times.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="padding: 20px; font-style: italic; color: #888;">Nenhuma line adicionada. Clique em "Importar dos Slots" ou "Adicionar Line".</td></tr>';
    return;
  }

  times.forEach((time, idx) => {
    let rank;
    if (rankingLiberado) {
      rank = idx + 1;
      time.rank = rank;
    } else {
      rank = time.rank || (idx + 1);
    }

    let setaHTML = '';
    const rankAntigo = rankingsAnteriores[time.nome];

    if (rankingLiberado && rankAntigo && time.nome) {
      if (rank < rankAntigo) {
        setaHTML = `<span class="rank-up">▲</span>`;
      } else if (rank > rankAntigo) {
        setaHTML = `<span class="rank-down">▼</span>`;
      }
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="rank-cell">${rank}º ${setaHTML}</td>
      <td>
        <input type="text" class="input-cla" value="${time.cla || ''}" onchange="onEditCla(${idx}, this.value)" placeholder="Nome do Clã" maxlength="30"/><br>
        <input type="text" class="input-line" value="${time.nome}" onchange="onEditNome(${idx}, this.value)" placeholder="Nome da Line" maxlength="30"/>
      </td>
      ${time.quedas.map((queda, qIdx) => {
        const pontosPosicao = (queda.posicao >= 1 && queda.posicao <= 10) ? PONTOS_POSICAO[queda.posicao - 1] : 0;
        const pontosKills = (queda.kills || 0) * PONTOS_POR_KILL;
        return `
          <td>
            <select onchange="onEditPosicao(${idx}, ${qIdx}, this.value)">
              ${Array.from({length: NUM_MAX_TIMES}, (_, i) => `<option value="${i + 1}" ${queda.posicao == (i + 1) ? "selected" : ""}>${i + 1}º</option>`).join("")}
            </select>
            <span class="kill-input">
              <input type="number" min="0" max="99" value="${queda.kills || 0}" onchange="onEditKills(${idx}, ${qIdx}, this.value)"/> Kills
            </span>
            <span class="pontos-queda">${pontosPosicao + pontosKills} pts</span>
          </td>
        `;
      }).join("")}
      <td class="total-kills-cell">${time.totalKills}</td>
      <td class="total-cell">${time.total}</td>
      <td>
        <button onclick="removerTime(${idx})" class="btn-remover">X</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ========================
// Funções de Evento (Chamadas pelo HTML)
// ========================
window.onEditCla = function(idx, value) {
  times[idx].cla = value.trim();
  salvarTimes();
}

window.onEditNome = function(idx, value) {
  times[idx].nome = value.trim();
  salvarTimes();
}

window.onEditPosicao = function(idx, qIdx, value) {
  times[idx].quedas[qIdx].posicao = parseInt(value);
  salvarTimes();
}

window.onEditKills = function(idx, qIdx, value) {
  const killValue = parseInt(value);
  times[idx].quedas[qIdx].kills = killValue;
  if (qIdx === 2) { times[idx].queda3Preenchida = true; }
  salvarTimes();
}

window.removerTime = function(idx) {
  if (confirm(`Tem certeza que deseja remover a equipe "${times[idx].nome || `Time ${idx+1}`}"?`)) {
    delete rankingsAnteriores[times[idx].nome];
    times.splice(idx, 1);
    salvarTimes();
  }
}

// ========================
// Funções dos Botões de Ação
// ========================
function limparTabela() {
  if (confirm("ATENÇÃO!\n\nVocê tem certeza que deseja apagar TODAS as lines da tabela?")) {
    times = [];
    rankingsAnteriores = {};
    salvarTimes();
  }
}

document.getElementById('btn-adicionar-time').onclick = function() {
  if (times.length >= NUM_MAX_TIMES) return alert('Máximo de times atingido!');
  times.push(criarNovoTime());
  salvarTimes();
};
document.getElementById('btn-limpar-tabela').onclick = limparTabela;
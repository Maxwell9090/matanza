// ========================
// Configurações
// ========================
const PONTOS_POSICAO = [100,90,80,70,60,50,40,30,20,10]; // índice 0 = 1º lugar
const NUM_QUEDAS = 3;
const NUM_MAX_TIMES = 16;

let userLogado = false;
let times = [];
let rankAnterior = [];

// ========================
// Modal de login
// ========================
const loginModal = document.getElementById('login-modal');
const btnLogin = document.getElementById('btn-login-modal');
const closeLogin = document.getElementById('close-login-modal');
const painelClassificacao = document.getElementById('painel-classificacao');
const loginForm = document.getElementById('login-form');
const loginErro = document.getElementById('login-erro');

btnLogin.onclick = () => loginModal.style.display = 'flex';
closeLogin.onclick = () => { loginModal.style.display = 'none'; loginErro.textContent = ""; };
window.onclick = (e) => { if (e.target === loginModal) loginModal.style.display = 'none'; };

loginForm.onsubmit = async function(e) {
  e.preventDefault();
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  loginErro.textContent = "Validando...";
  // Chamada para backend de autenticação
  try {
    const resp = await fetch('/api/superuser-login', {
      method: "POST",
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ user, pass })
    });
    const data = await resp.json();
    if (!data.ok) throw new Error(data.error || "Login inválido");
    userLogado = true;
    loginModal.style.display = 'none';
    painelClassificacao.style.display = 'block';
    carregarTimesSalvos();
    renderTabela();
  } catch (err) {
    loginErro.textContent = err.message || "Falha ao autenticar";
  }
};

// ========================
// Estrutura e dados
// ========================
function criarNovoTime() {
  return {
    nome: "",
    quedas: Array(NUM_QUEDAS).fill().map(()=>({posicao:1, kills:0})),
    total: 0,
    rank: 0,
    rankAnt: 0
  }
}

// ========================
// Renderização da tabela
// ========================
function renderTabela() {
  const tbody = document.querySelector('#tbl-classificacao tbody');
  tbody.innerHTML = "";
  if (!times.length) {
    for (let i=0;i<10;i++) times.push(criarNovoTime());
  }

  // Salva ranking anterior para setas
  rankAnterior = times.map(t=>t.rank);

  // Calcula pontos e ordena
  times.forEach(calcPontuacaoTime);
  times.sort((a,b)=>b.total-a.total);

  // Atualiza ranking atual
  times.forEach((t,i) => { t.rankAnt = t.rank; t.rank = i+1; });

  times.slice(0,NUM_MAX_TIMES).forEach((time, idx) => {
    const tr = document.createElement('tr');
    // Rank + seta
    let seta = "";
    if(time.rankAnt && time.rankAnt > 0) {
      if (time.rank < time.rankAnt) seta = `<span class="rank-up">&#9650;</span>`;
      else if (time.rank > time.rankAnt) seta = `<span class="rank-down">&#9660;</span>`;
    }
    tr.innerHTML = `
      <td style="font-weight:bold;">${time.rank}º ${seta}</td>
      <td>
        <input type="text" value="${time.nome}" onchange="onEditNome(${idx}, this.value)" placeholder="Nome da Line" maxlength="30"/>
      </td>
      ${[0,1,2].map(q=>`
        <td>
          <select onchange="onEditPosicao(${idx},${q},this.value)">
            ${PONTOS_POSICAO.map((p,ix)=>`<option value="${ix+1}" ${time.quedas[q].posicao==(ix+1)?"selected":""}>${ix+1}º</option>`).join("")}
          </select>
          <span style="margin:0 6px;">
            <input type="number" min="0" max="99" value="${time.quedas[q].kills}" onchange="onEditKills(${idx},${q},this.value)" style="width:38px;"/> Kills
          </span>
          <span style="color:#ffd700;font-weight:bold;">
            ${PONTOS_POSICAO[time.quedas[q].posicao-1]+time.quedas[q].kills*20} pts
          </span>
        </td>
      `).join("")}
      <td style="font-weight:bold;color:#0fa;">${time.total}</td>
      <td>
        <button onclick="removerTime(${idx})" style="background:#f33;color:#fff;border:none;border-radius:4px;cursor:pointer;padding:2px 10px;">X</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  salvarTimes();
}

// ========================
// Eventos dos campos editáveis
// ========================
window.onEditNome = function(idx, value) {
  times[idx].nome = value;
  salvarTimes();
  renderTabela();
}
window.onEditPosicao = function(idx, q, value) {
  times[idx].quedas[q].posicao = parseInt(value);
  salvarTimes();
  renderTabela();
}
window.onEditKills = function(idx, q, value) {
  times[idx].quedas[q].kills = parseInt(value);
  salvarTimes();
  renderTabela();
}
window.removerTime = function(idx) {
  times.splice(idx, 1);
  salvarTimes();
  renderTabela();
}

// ========================
// Cálculo de pontuação
// ========================
function calcPontuacaoTime(time) {
  time.total = 0;
  for (let q=0; q<NUM_QUEDAS; q++) {
    const pos = time.quedas[q].posicao;
    const kills = time.quedas[q].kills;
    const pontos = (pos>=1 && pos<=10 ? PONTOS_POSICAO[pos-1] : 0) + (kills*20);
    time.total += pontos;
  }
}

// ========================
// Adicionar time
// ========================
document.getElementById('btn-adicionar-time').onclick = function() {
  if (times.length >= NUM_MAX_TIMES) return alert('Máximo de times atingido!');
  times.push(criarNovoTime());
  salvarTimes();
  renderTabela();
}

// ========================
// Salvar/carregar do localStorage
// ========================
function salvarTimes() {
  localStorage.setItem('classificacao_times', JSON.stringify(times));
}
function carregarTimesSalvos() {
  try {
    const salvo = localStorage.getItem('classificacao_times');
    if (salvo) {
      times = JSON.parse(salvo);
      // Corrige estrutura se necessário (em caso de atualização futura)
      times.forEach(t=>{
        if (!t.quedas || t.quedas.length!==NUM_QUEDAS) t.quedas = Array(NUM_QUEDAS).fill().map(()=>({posicao:1, kills:0}));
      });
    }
  } catch {}
}

// ========================
// Inicialização automática se já autenticado
// ========================
if (userLogado || painelClassificacao.style.display === "block") {
  carregarTimesSalvos();
  renderTabela();
}
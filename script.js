// ==========================
// AVISO: Não há senhas/segredos no frontend.
// Autenticação é feita no backend via cookies HttpOnly.
// ==========================

// ==========================
// Blocos editáveis (Dinâmica/Regras)
// ==========================
function getDinamica() {
  return localStorage.getItem('mtz-dinamica') ||
`🎯 3 quedas
🗺️ Mapa: Isolated
🚫 Sem habilidades
🔫 Munição infinita
♻️ Reanimação automática`;
}
function setDinamica(text) { localStorage.setItem('mtz-dinamica', text); }
function getRegras() {
  return localStorage.getItem('mtz-regras') ||
`✍️ Antes de alterar a lista, envie: “Digitando” ou "Editando".
📜 Respeite a ordem — nada de furar fila.
📌 Regras e punições na descrição do grupo.

⛔ PROIBIDO:
Hackers
Falta de respeito
Bazucas (SMRS, FHJ, Thumper)
Escopetas auto/semi (HS-2126, Striker)
Munição especial
Atropelar
Call aberta para todos

❗ Quebrou regra = EXPULSÃO`;
}
function setRegras(text) { localStorage.setItem('mtz-regras', text); }
function renderDinamica() {
  const el = document.getElementById('dinamica-content');
  if (el) el.textContent = getDinamica();
}
function renderRegras() {
  const el = document.getElementById('regras-content');
  if (el) el.textContent = getRegras();
}

// ==========================
// Admin / Dono / Logs (sem expor senhas)
// ==========================
function getAdminLogs() { return JSON.parse(localStorage.getItem('mtz-admin-logs') || '[]'); }
function saveAdminLogs(logs) { localStorage.setItem('mtz-admin-logs', JSON.stringify(logs)); }
function addAdminLog(msg, autor) {
  const logs = getAdminLogs();
  const now = new Date().toLocaleString();
  logs.unshift(`[${now}] (${autor||"Admin"}) ${msg}`);
  saveAdminLogs(logs);
  renderLogs();
}
function getDonoLogs() { return JSON.parse(localStorage.getItem('mtz-dono-logs') || '[]'); }
function saveDonoLogs(logs) { localStorage.setItem('mtz-dono-logs', JSON.stringify(logs)); }
function addDonoLog(msg) {
  const logs = getDonoLogs();
  const now = new Date().toLocaleString();
  logs.unshift(`[${now}] ${msg}`);
  saveDonoLogs(logs);
  renderMasterLogs();
}
function apagarLogs() { saveAdminLogs([]); addAdminLog("Todos os logs foram apagados","Admin"); }
function apagarLogsMaster() { saveDonoLogs([]); renderMasterLogs(); }

// Painel admin (UI)
let loggedAdmin = null;
function openAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) {
    modal.style.display = 'block';
    const lf = document.getElementById('login-form');
    const ac = document.getElementById('admin-config');
    if (lf) lf.style.display = 'block';
    if (ac) ac.style.display = 'none';
  }
}
function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) modal.style.display = 'none';
  const u = document.getElementById('admin-usuario');
  const s = document.getElementById('admin-senha');
  if (u) u.value = '';
  if (s) s.value = '';
  loggedAdmin = null;
}
function logoutAdmin() {
  fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
    const ac = document.getElementById('admin-config');
    const lf = document.getElementById('login-form');
    if (ac) ac.style.display = 'none';
    if (lf) lf.style.display = 'block';
    loggedAdmin = null;
  });
}
async function adminLogin() {
  const usuario = (document.getElementById('admin-usuario')||{}).value || '';
  const senha = (document.getElementById('admin-senha')||{}).value || '';
  try {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ username: usuario, password: senha, role: 'admin' })
    });
    const data = await r.json();
    if (!data.ok) return alert(data.error || 'Falha no login');
    loggedAdmin = usuario;

    const lf = document.getElementById('login-form');
    const ac = document.getElementById('admin-config');
    if (lf) lf.style.display = 'none';
    if (ac) ac.style.display = 'block';

    renderAdminEditables();
    renderLogs();
    renderDinamica();
    renderRegras();
    renderSlots();

    // Preenche inputs do evento
    const eventData = JSON.parse(localStorage.getItem('mtz-evento') || '{}');
    if (eventData.date && document.getElementById('event-date')) document.getElementById('event-date').value = eventData.date;
    if (eventData.open && document.getElementById('event-open')) document.getElementById('event-open').value = eventData.open;
    if (eventData.start && document.getElementById('event-start')) document.getElementById('event-start').value = eventData.start;
  } catch {
    alert('Erro no login');
  }
}
function renderAdminEditables() {
  const d = document.getElementById('dinamica-edit');
  const r = document.getElementById('regras-edit');
  if (d) d.value = getDinamica();
  if (r) r.value = getRegras();
}
function saveDinamica() {
  const txt = (document.getElementById('dinamica-edit')||{}).value || '';
  setDinamica(txt);
  addAdminLog("Dinâmica editada", loggedAdmin);
  addDonoLog(`Dinâmica editada por ${loggedAdmin||"Admin"}`);
  renderDinamica();
}
function saveRegras() {
  const txt = (document.getElementById('regras-edit')||{}).value || '';
  setRegras(txt);
  addAdminLog("Regras editadas", loggedAdmin);
  addDonoLog(`Regras editadas por ${loggedAdmin||"Admin"}`);
  renderRegras();
}
function renderLogs() {
  const ul = document.getElementById('logs-list');
  if (!ul) return;
  const logs = getAdminLogs();
  ul.innerHTML = '';
  logs.forEach(log => ul.innerHTML += `<li>${log}</li>`);
}

// Painel master (dono) – backend auth
function openMasterModal() {
  const m = document.getElementById('master-modal');
  if (!m) return;
  m.style.display = 'block';
  const login = document.getElementById('master-login');
  const cfg = document.getElementById('master-config');
  if (login) login.style.display = 'block';
  if (cfg) cfg.style.display = 'none';
  const pwd = document.getElementById('master-senha');
  if (pwd) pwd.value = '';
}
function closeMasterModal() {
  const m = document.getElementById('master-modal');
  if (m) m.style.display = 'none';
}
async function masterLogin() {
  const senha = (document.getElementById('master-senha')||{}).value || '';
  try {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ username: 'owner', password: senha, role: 'master' })
    });
    const data = await r.json();
    if (!data.ok) return alert(data.error || 'Senha incorreta!');
    const login = document.getElementById('master-login');
    const cfg = document.getElementById('master-config');
    if (login) login.style.display = 'none';
    if (cfg) cfg.style.display = 'block';
    renderMasterLogs();
    renderMasterAdmins();
  } catch {
    alert('Erro no login');
  }
}
function renderMasterLogs() {
  const ul = document.getElementById('master-logs-list');
  if (!ul) return;
  const logsAdmin = getAdminLogs();
  const logsDono = getDonoLogs();
  ul.innerHTML = '';
  logsAdmin.forEach(log => ul.innerHTML += `<li><b>[Admin]</b> ${log}</li>`);
  logsDono.forEach(log => ul.innerHTML += `<li><b>[Dono]</b> ${log}</li>`);
}
function renderMasterAdmins() {
  const ul = document.getElementById('master-admin-list');
  if (!ul) return;
  ul.innerHTML = '<li>Administração de contas realizada no servidor (sem exibir senhas).</li>';
}

// ==========================
// Slots (lado cliente)
// ==========================
const defaultPlayers = {
  duo: [{name:""},{name:""}],
  squad: [{name:""},{name:""},{name:""},{name:""}]
};
function getSavedSlots() {
  const slots = localStorage.getItem('mtz-slots');
  if (slots) return JSON.parse(slots);
  const arr = [];
  while (arr.length < 22)
    arr.push({clã:"", tag:"", line:"", contato:"", players: JSON.parse(JSON.stringify(defaultPlayers.squad)), lastEditor:""});
  return arr;
}
function saveSlotsLocal(slots) { localStorage.setItem('mtz-slots', JSON.stringify(slots)); }
let slots = getSavedSlots();
let editingSlot = Array(slots.length).fill(false);

function showEditModal(idx) {
  const bg = document.createElement('div');
  bg.classList.add('edit-modal-bg');
  bg.innerHTML = `<div class="edit-modal">
    <label>Seu nome (para registro de edição):</label>
    <input type="text" id="slot-editor-name" placeholder="Digite seu nome">
    <button onclick="confirmEditorName(${idx})">Continuar</button>
  </div>`;
  document.body.appendChild(bg);
}
function confirmEditorName(idx) {
  const name = (document.getElementById('slot-editor-name')||{}).value?.trim();
  if (!name) return alert("Digite seu nome!");
  slots[idx].lastEditor = name;
  editingSlot[idx] = true;
  const modal = document.querySelector('.edit-modal-bg');
  if (modal) modal.remove();
  renderSlots();
}
function editSlot(idx) { showEditModal(idx); }
function saveSlot(idx) {
  slots[idx].clã = (document.getElementById(`clã${idx}`)||{}).value || "";
  slots[idx].tag = (document.getElementById(`tag${idx}`)||{}).value || "";
  slots[idx].line = (document.getElementById(`line${idx}`)||{}).value || "";
  slots[idx].contato = (document.getElementById(`contato${idx}`)||{}).value || "";
  const modo = getModoJogo();
  const quant = (modo === 'duo') ? 2 : 4;
  slots[idx].players = [];
  for (let p = 0; p < quant; p++) {
    const v = (document.getElementById(`player${idx}_${p}`)||{}).value || "";
    slots[idx].players.push({name: v});
  }
  editingSlot[idx] = false;
  saveSlotsLocal(slots);
  addAdminLog(`Slot ${idx+1} editado`, slots[idx].lastEditor || loggedAdmin);
  addDonoLog(`Slot ${idx+1} editado por ${slots[idx].lastEditor || loggedAdmin}`);
  renderSlots();
}
function isSlotFilled(slot) {
  if (slot.clã?.trim() || slot.tag?.trim() || slot.line?.trim() || slot.contato?.trim()) return true;
  if (Array.isArray(slot.players)) {
    return slot.players.some(p => (p?.name || "").trim().length > 0);
  }
  return false;
}
function renderSlots() {
  const modo = getModoJogo();
  const modoLabel = document.getElementById('modo-label');
  if (modoLabel) modoLabel.textContent = `Modo: ${modo.charAt(0).toUpperCase()+modo.slice(1)}`;
  const container = document.getElementById('slots-container');
  if (!container) return;
  container.innerHTML = '';

  for (let idx = 0; idx < 19; idx++) {
    const slot = slots[idx];
    const stateClass = isSlotFilled(slot) ? 'filled' : 'empty';
    const isEditing = editingSlot[idx];
    container.innerHTML += `
      <div class="slot-card ${stateClass}">
        <div class="slot-number">
          <span class="slot-icon">☠︎</span> ${String(idx+1).padStart(2,'0')}
          ${slot.lastEditor ? `<span style="font-size:0.85em;color:#0fa;margin-left:10px;">por ${slot.lastEditor}</span>` : ""}
        </div>
        <label>Clã:</label>
        <input type="text" value="${slot.clã}" id="clã${idx}" ${!isEditing ? 'disabled' : ''}>
        <label>Tag:</label>
        <input type="text" value="${slot.tag}" id="tag${idx}" ${!isEditing ? 'disabled' : ''}>
        <label>Line:</label>
        <input type="text" value="${slot.line}" id="line${idx}" ${!isEditing ? 'disabled' : ''}>
        <label>Contato:</label>
        <input type="text" value="${slot.contato}" id="contato${idx}" ${!isEditing ? 'disabled' : ''}>
        <div class="players-label">${modo === 'duo' ? 'Jogadores DUO' : 'Jogadores SQUAD'}</div>
        ${slot.players.map((player, pidx) => `
          <label>Player ${pidx+1}:</label>
          <input type="text" value="${player.name}" id="player${idx}_${pidx}" ${!isEditing ? 'disabled' : ''}>
        `).join('')}
        ${isEditing
          ? `<button class="save-btn" onclick="saveSlot(${idx})">Salvar</button>`
          : `<button class="edit-btn" onclick="editSlot(${idx})">Editar</button>`}
      </div>
    `;
  }

  for (let idx = 19; idx < 22; idx++) {
    const slot = slots[idx];
    const stateClass = isSlotFilled(slot) ? 'filled' : 'empty';
    const isEditing = editingSlot[idx];
    container.innerHTML += `
      <div class="slot-card waiting ${stateClass}">
        <div class="slot-number">
          <span class="slot-icon">🕒</span> Lista de Espera ${String(idx-18)}
          ${slot.lastEditor ? `<span style="font-size:0.85em;color:#0fa;margin-left:10px;">por ${slot.lastEditor}</span>` : ""}
        </div>
        <label>Clã:</label>
        <input type="text" value="${slot.clã}" id="clã${idx}" ${!isEditing ? 'disabled' : ''}>
        <label>Tag:</label>
        <input type="text" value="${slot.tag}" id="tag${idx}" ${!isEditing ? 'disabled' : ''}>
        <label>Line:</label>
        <input type="text" value="${slot.line}" id="line${idx}" ${!isEditing ? 'disabled' : ''}>
        <label>Contato:</label>
        <input type="text" value="${slot.contato}" id="contato${idx}" ${!isEditing ? 'disabled' : ''}>
        <div class="players-label">${modo === 'duo' ? 'Jogadores DUO' : 'Jogadores SQUAD'}</div>
        ${slot.players.map((player, pidx) => `
          <label>Player ${pidx+1}:</label>
          <input type="text" value="${player.name}" id="player${idx}_${pidx}" ${!isEditing ? 'disabled' : ''}>
        `).join('')}
        ${isEditing
          ? `<button class="save-btn" onclick="saveSlot(${idx})">Salvar</button>`
          : `<button class="edit-btn" onclick="editSlot(${idx})">Editar</button>`}
      </div>
    `;
  }
}

// ==========================
// Evento / Timer – data correta no label
// ==========================
function formatDateLabelBRFromDateObj(dateObj) {
  const dias = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
  const dd = String(dateObj.getDate()).padStart(2,'0');
  const mm = String(dateObj.getMonth()+1).padStart(2,'0');
  const yyyy = dateObj.getFullYear();
  return `${dias[dateObj.getDay()]} – ${dd}/${mm}/${yyyy}`;
}

function saveEventData() {
  const date = (document.getElementById('event-date')||{}).value || '';
  const open = (document.getElementById('event-open')||{}).value || '';
  const start = (document.getElementById('event-start')||{}).value || '';
  if (!date || !open || !start) return alert('Preencha todos os campos!');
  localStorage.setItem('mtz-evento', JSON.stringify({date, open, start}));
  startTimer();
  addAdminLog(`Evento alterado: ${date}, abertura ${open}, início ${start}`, loggedAdmin);
  alert('Evento atualizado!');
}

function startTimer() {
  const eventData = JSON.parse(localStorage.getItem('mtz-evento') || '{}');
  const now = new Date();

  // Defaults
  let startH = 23, startM = 35; // início
  let openH  = 23, openM  = 25; // abertura
  let eventDateObj;

  if (eventData.date) {
    const [year, month, day] = eventData.date.split('-').map(Number);
    eventDateObj = new Date(year, month - 1, day);
    if (eventData.start) { const [h, m] = eventData.start.split(':').map(Number); startH = h; startM = m; }
    if (eventData.open)  { const [h, m] = eventData.open.split(':').map(Number);  openH  = h; openM  = m; }
  } else {
    eventDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    while (true) {
      if (eventDateObj.getDay() === 5) {
        const candidate = new Date(eventDateObj.getFullYear(), eventDateObj.getMonth(), eventDateObj.getDate(), startH, startM, 0);
        if (candidate > now) break;
      }
      eventDateObj.setDate(eventDateObj.getDate() + 1);
    }
  }

  const eventStartDate = new Date(eventDateObj.getFullYear(), eventDateObj.getMonth(), eventDateObj.getDate(), startH, startM, 0);

  const labelData      = formatDateLabelBRFromDateObj(eventDateObj);
  const labelAbertura  = `${String(openH).padStart(2,'0')}:${String(openM).padStart(2,'0')}h`;
  const labelInicio    = `${String(startH).padStart(2,'0')}:${String(startM).padStart(2,'0')}h`;

  const dateEl  = document.getElementById('date-label');
  const openEl  = document.getElementById('open-label');
  const startEl = document.getElementById('start-label');
  if (dateEl)  dateEl.textContent  = labelData;
  if (openEl)  openEl.textContent  = labelAbertura;
  if (startEl) startEl.textContent = labelInicio;

  function update() {
    const diff = eventStartDate - new Date();
    const tEl = document.getElementById('timer');
    if (!tEl) return;
    if (diff <= 0) { tEl.innerText = "O evento está em andamento!"; return; }
    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const hBlock = `${days > 0 ? days + "d " : ""}${String(hours).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
    tEl.innerText = `Faltam ${hBlock} para o evento!`;
  }
  clearInterval(window.timerInterval);
  window.timerInterval = setInterval(update, 1000);
  update();
}

// ==========================
// Modal "Entrar para o Clã"
// ==========================
function openEntryModal() {
  const m = document.getElementById('entry-modal');
  if (m) m.style.display = 'block';
}
function closeEntryModal() {
  const m = document.getElementById('entry-modal');
  if (m) m.style.display = 'none';
  const n = document.getElementById('entry-nome');
  const cn = document.getElementById('entry-codnome');
  const id = document.getElementById('entry-codid');
  const st = document.getElementById('entry-status');
  if (n) n.value = "";
  if (cn) cn.value = "";
  if (id) id.value = "";
  if (st) st.textContent = "";
}
function enviarEntry() {
  const nome = document.getElementById('entry-nome')?.value.trim() || "";
  const codnome = document.getElementById('entry-codnome')?.value.trim() || "";
  const codid = document.getElementById('entry-codid')?.value.trim() || "";
  const st = document.getElementById('entry-status');

  if (!nome || !codnome || !codid) {
    if (st) st.textContent = "Preencha todos os campos!";
    return;
  }

  fetch("/api/sendTelegram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, codnome, codid })
  })
    .then(r => r.json())
    .then(data => {
      if (st) st.textContent = data.ok ? "Pedido enviado com sucesso!" : "Erro ao enviar!";
      if (data.ok) setTimeout(closeEntryModal, 1800);
    })
    .catch(() => { if (st) st.textContent = "Erro ao enviar, tente novamente!"; });
}

// ==========================
// Modo de jogo (DUO/SQUAD) + sync
// ==========================
const MODE_KEY = 'mtz-modo';
function getModoJogo() { return localStorage.getItem(MODE_KEY) || 'squad'; }
function resizePlayers(slot, targetLen) {
  const curr = Array.isArray(slot.players) ? slot.players.map(p => ({ name: (p?.name || "") })) : [];
  if (curr.length > targetLen) slot.players = curr.slice(0, targetLen);
  else if (curr.length < targetLen) slot.players = curr.concat(Array.from({ length: targetLen - curr.length }, () => ({ name: "" })));
  else slot.players = curr;
}
function applyModeToAllSlots(modo) {
  const target = (modo === 'duo') ? 2 : 4;
  if (typeof slots !== 'undefined' && Array.isArray(slots)) {
    slots.forEach(slot => resizePlayers(slot, target));
    saveSlotsLocal(slots);
  }
}
function setModeLabel(modo) {
  const lbl = document.getElementById('modo-label');
  if (lbl) lbl.textContent = `Modo: ${modo.charAt(0).toUpperCase() + modo.slice(1)}`;
}
function updateModeRadios(modo) {
  const md = document.getElementById('modo-duo');
  const ms = document.getElementById('modo-squad');
  if (md) md.checked = (modo === 'duo');
  if (ms) ms.checked = (modo === 'squad');
}
function setModoJogo(modo, { broadcast = true, rerender = true } = {}) {
  if (!['duo', 'squad'].includes(modo)) modo = 'squad';
  localStorage.setItem(MODE_KEY, modo);
  setModeLabel(modo);
  applyModeToAllSlots(modo);
  if (rerender && document.getElementById('slots-container')) renderSlots();
  if (broadcast) {
    try { localStorage.setItem('mtz-modo-tick', String(Date.now())); } catch {}
    try { window.mtzChannel?.postMessage({ type: 'modo-changed', value: modo }); } catch {}
  }
}
function initModeSyncAndControls() {
  const current = getModoJogo();
  updateModeRadios(current);
  setModeLabel(current);

  ['modo-duo', 'modo-squad'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => setModoJogo(id === 'modo-duo' ? 'duo' : 'squad'));
  });

  try {
    window.mtzChannel = new BroadcastChannel('mtz-sync');
    window.mtzChannel.onmessage = (e) => {
      if (e.data?.type === 'modo-changed') {
        const m = getModoJogo();
        updateModeRadios(m);
        setModeLabel(m);
        if (document.getElementById('slots-container')) renderSlots();
      }
    };
  } catch {}

  window.addEventListener('storage', (e) => {
    if (e.key === MODE_KEY || e.key === 'mtz-modo-tick') {
      const m = getModoJogo();
      updateModeRadios(m);
      setModeLabel(m);
      if (document.getElementById('slots-container')) renderSlots();
    }
  });

  applyModeToAllSlots(current);
  if (document.getElementById('slots-container')) renderSlots();
}
function saveModoJogo() {
  const modo = (document.getElementById('modo-duo')||{}).checked ? 'duo' : 'squad';
  setModoJogo(modo);
  addAdminLog(`Modo de jogo alterado para: ${modo}`, loggedAdmin);
  alert('Modo de jogo salvo!');
}

// ==========================
// Inicialização e atalho "donoadmin"
// ==========================
(function setupMasterShortcut(){
  let buffer = "";
  document.addEventListener('keydown', (e) => {
    buffer += e.key;
    if (buffer.length > 20) buffer = buffer.slice(-20);
    if (buffer.toLowerCase().includes('donoadmin')) {
      buffer = "";
      openMasterModal();
    }
  });
})();

window.addEventListener('load', () => {
  initModeSyncAndControls();
  renderDinamica();
  renderRegras();
  startTimer();
});
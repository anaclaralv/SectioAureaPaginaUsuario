function mostrarTela(tela) {

  const telas = [
    "inicio",
    "tarefas",
    "notas",
    "calendario",
    "relogio",
    "estatistica",
    "cronograma",
    "metodos",
    "revisao",
    "progressoEstudos"
  ];

  // esconde tudo
  telas.forEach(t => {
   const el = document.getElementById(t + "Section");
    if (el) el.style.display = "none";
  });

   const ativa = document.getElementById(tela + "Section");
  if (ativa) {
    ativa.style.display = "block";
  }

  if (tela === "calendario") {
    setTimeout(() => {
      calendar.updateSize();
    }, 100);
  }

  if (tela === "cronograma") {
  renderizarCronograma();
}


  // funções específicas
  if (tela === "tarefas") atualizarTabela();
  if (tela === "relogio") carregarHistorico();
}

// ---------- ATIVAR MENU ----------
function mudarPagina(elemento) {
  const links = document.querySelectorAll('#menuLateral .nav-link');

  links.forEach(link => link.classList.remove('active'));

  elemento.classList.add('active');
}


// ---------- TAREFAS ----------
let tarefas = [];

try {
  tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];
} catch (e) {
  tarefas = [];
}

function salvar() {
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
}

function hojeFormatado() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function adicionarTarefa() {
  const tituloEl = document.getElementById("titulo");
  const prioridadeEl = document.getElementById("prioridade");
  const dataEl = document.getElementById("data");

  if (!tituloEl || !prioridadeEl || !dataEl) {
    alert("Os campos da tarefa não foram encontrados no HTML.");
    return;
  }

  const titulo = tituloEl.value.trim();
  const prioridade = prioridadeEl.value;
  const data = dataEl.value;

  if (!titulo || !data) {
    alert("Preencha todos os campos!");
    return;
  }

  tarefas.push({
    id: Date.now(),
    titulo,
    prioridade,
    data,
    concluida: false
  });

  salvar();
  atualizarTudo();

  tituloEl.value = "";
  dataEl.value = "";
  prioridadeEl.value = "alta";
}

function atualizarTudo() {
  renderizar();
  atualizarTabela();
}

function renderizar() {
  const hojeLista = document.getElementById("tarefasHoje");
  const futurasLista = document.getElementById("tarefasFuturas");

  if (!hojeLista || !futurasLista) return;

  hojeLista.innerHTML = "";
  futurasLista.innerHTML = "";

  const hoje = hojeFormatado();

  tarefas.forEach((tarefa) => {
    const li = document.createElement("li");

    if (tarefa.concluida) {
      li.classList.add("concluida");
    }

    li.innerHTML = `
      <span style="color:${corPrioridade(tarefa.prioridade)}">
        ${tarefa.titulo} (${tarefa.prioridade}) - ${tarefa.data}
      </span>
      <button onclick="toggle(${tarefa.id})">
        ${tarefa.concluida ? "Desfazer" : "Concluir"}
      </button>
    `;

    if (tarefa.data === hoje) {
      hojeLista.appendChild(li);
    } else if (tarefa.data > hoje) {
      futurasLista.appendChild(li);
    }
  });
}

function atualizarTabela() {
  const tabela = document.getElementById("tabelaTarefas");
  if (!tabela) return;

  tabela.innerHTML = "";

  const hoje = hojeFormatado();

  tarefas
    .filter(t => t.data === hoje)
    .forEach((tarefa) => {
      tabela.innerHTML += `
        <tr>
          <td style="color:${corPrioridade(tarefa.prioridade)}">
            ${tarefa.titulo}
          </td>
          <td>${tarefa.concluida ? "✔" : ""}</td>
          <td>
            <button onclick="toggle(${tarefa.id})">
              ${tarefa.concluida ? "↩" : "✔"}
            </button>
          </td>
        </tr>
      `;
    });
}

function toggle(id) {
  id = Number(id);
  const tarefa = tarefas.find(t => t.id === id);

  if (!tarefa) return;

  tarefa.concluida = !tarefa.concluida;
  salvar();
  atualizarTudo();
}

function corPrioridade(prioridade) {
  if (prioridade === "alta") return "red";
  if (prioridade === "media") return "orange";
  return "green";
}

// garante que os botões onclick encontrem as funções
window.adicionarTarefa = adicionarTarefa;
window.toggle = toggle;

document.addEventListener("DOMContentLoaded", () => {
  atualizarTudo();
});


//--------TEMPORIZADORES--------------
// ---------- INICIAR ----------
document.addEventListener("DOMContentLoaded", () => {
  renderizar();
  atualizarTabela();
});


// ---------- INICIAR ----------
document.addEventListener("DOMContentLoaded", () => {
  mostrarTela("inicio");
});

let intervaloCronometro;
let segundos = 0;
let materiaAtual = "";

function iniciarCronometro() {
  materiaAtual = document.getElementById("materia").value;

  if (!materiaAtual) {
    alert("Digite a matéria!");
    return;
  }

  clearInterval(intervaloCronometro);

  intervaloCronometro = setInterval(() => {
    segundos++;

    let h = String(Math.floor(segundos / 3600)).padStart(2, '0');
    let m = String(Math.floor((segundos % 3600) / 60)).padStart(2, '0');
    let s = String(segundos % 60).padStart(2, '0');

    document.getElementById("tempoCronometro").textContent = `${h}:${m}:${s}`;
  }, 1000);
}

function pararCronometro() {
  clearInterval(intervaloCronometro);

  salvarHistorico(materiaAtual, segundos);

  segundos = 0;
  document.getElementById("tempoCronometro").textContent = "00:00:00";
}
function iniciarTimer() {
  let minutos = document.getElementById("minutosTimer").value;

  if (!minutos) return;

  let tempo = minutos * 60;

  const intervalo = setInterval(() => {
    tempo--;

    let m = Math.floor(tempo / 60);
    let s = tempo % 60;

    document.getElementById("tempoTimer").textContent = `${m}:${s}`;

    if (tempo <= 0) {
      clearInterval(intervalo);
      alert("Tempo acabou!");
    }
  }, 1000);
}
function iniciarPomodoro() {
  let tempo = 25 * 60;

  const intervalo = setInterval(() => {
    tempo--;

    let m = Math.floor(tempo / 60);
    let s = tempo % 60;

    document.getElementById("tempoPomodoro").textContent = `${m}:${s}`;

    if (tempo <= 0) {
      clearInterval(intervalo);
      alert("Pomodoro finalizado! Descanse 5 min 😄");
    }
  }, 1000);
}
function salvarHistorico(materia, tempo) {

  let historico = JSON.parse(localStorage.getItem("historicoEstudos")) || [];

  historico.push({
    materia: materia,
    tempo: tempo,
    data: new Date().toLocaleString()
  });

  localStorage.setItem("historicoEstudos", JSON.stringify(historico));

  carregarHistorico();
}

function carregarHistorico() {
  const lista = document.getElementById("historico");
  lista.innerHTML = "";

  let historico = JSON.parse(localStorage.getItem("historicoEstudos")) || [];

  historico.forEach(item => {
    lista.innerHTML += `
      <li>
        ${item.materia} - ${Math.floor(item.tempo / 60)} min - ${item.data}
      </li>
    `;
  });
}
document.addEventListener("DOMContentLoaded", carregarHistorico);



/** CALENDÁRIO */
let calendar;

document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendario');

  if (!calendarEl) return; // evita erro se não existir

  const eventosSalvos = JSON.parse(localStorage.getItem("eventosCalendario")) || [];

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',

    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },

    events: eventosSalvos
  });

  calendar.render();
});

function adicionarEvento() {
  if (!calendar) {
    alert("Calendário ainda não carregou!");
    return;
  }

  const titulo = document.getElementById("tituloEvento").value;
  const data = document.getElementById("dataEvento").value;
  const materia = document.getElementById("materiaEvento").value;

  if (!titulo || !data) {
    alert("Preencha os campos!");
    return;
  }

  const novoEvento = {
    title: titulo,
    date: data,
    color: definirCorMateria(materia),
    extendedProps: { materia }
  };

  calendar.addEvent(novoEvento);
  salvarEventos();

  // limpar campos
  document.getElementById("tituloEvento").value = "";
  document.getElementById("dataEvento").value = "";
  document.getElementById("materiaEvento").value = "";
}







// ===== NOTAS =====


let notas = JSON.parse(localStorage.getItem("notas")) || [];
let notaAtual = null;
let excluirIndex = null;

// ALERTA
function alertaNota(msg){
  const a = document.getElementById("alertaNota");
  a.innerText = msg;
  a.classList.add("mostrar");
  setTimeout(()=>a.classList.remove("mostrar"),2000);
}

// SALVAR
function salvarNotas(){
  localStorage.setItem("notas", JSON.stringify(notas));
}

// ORDENAR FAVORITOS
function ordenarNotas(){
  notas.sort((a,b)=>b.favorito - a.favorito);
}

// RENDER
function renderNotas(){
  ordenarNotas();
  const lista = document.getElementById("listaNotas");
  lista.innerHTML = "";

  const filtro = document.getElementById("pesquisaNota").value.toLowerCase();

  notas.forEach((n,i)=>{
    if(!n.titulo.toLowerCase().includes(filtro)) return;

    const div = document.createElement("div");
    div.className="card-nota";
    div.style.background = n.cor || "#fff";

    div.innerHTML = `
      <div class="topo-card">
        <span class="estrela ${n.favorito?"ativa":""}" onclick="favoritarNota(${i})">⭐</span>

        <div class="acoes-card">
          <button onclick="editarNota(${i})">✏️</button>
          <button onclick="abrirExcluirNota(${i})">🗑️</button>
        </div>
      </div>

      <h3 onclick="toggleNota(${i})">${n.titulo || "Sem título"}</h3>

      <div class="conteudo-nota" id="c${i}">
        <p>${n.texto}</p>

        <ul>
          ${n.checklist.map((c,j)=>`
            <li>
              <input type="checkbox" ${c.feito?"checked":""}
              onclick="checkNota(${i},${j})">
              ${c.texto}
            </li>
          `).join("")}
        </ul>
      </div>
    `;

    lista.appendChild(div);
  });
}

// NOVA NOTA
document.getElementById("criarNota").onclick = () => {
  notas.push({
    titulo:"",
    texto:"",
    checklist:[],
    cor:"#ffffff",
    favorito:false
  });

  notaAtual = notas.length - 1;
  abrirEditorNota();
};

// EDITOR
function abrirEditorNota(){
  document.getElementById("editorView").style.display="block";

  const n = notas[notaAtual];
  document.getElementById("tituloNota").value = n.titulo;
  document.getElementById("editorTexto").value = n.texto;
  document.getElementById("corNota").value = n.cor;

  renderChecklist();
}

function voltarLista(){
  document.getElementById("editorView").style.display="none";
  salvarNotas();
  renderNotas();
}

// EDITAR
function editarNota(i){
  notaAtual = i;
  abrirEditorNota();
}

// FAVORITO
function favoritarNota(i){
  notas[i].favorito = !notas[i].favorito;
  salvarNotas();
  renderNotas();
}

// CHECK
function checkNota(i,j){
  notas[i].checklist[j].feito = !notas[i].checklist[j].feito;
  salvarNotas();
  renderNotas();
}

// ADD ITEM
function addItemNota(){
  const novoItem = document.getElementById("novoItem");
  const txt = novoItem.value;
  if(!txt) return;

  notas[notaAtual].checklist.push({texto:txt,feito:false});
  novoItem.value="";
  renderChecklist();
  salvarNotas();
}

// RENDER CHECKLIST
function renderChecklist(){
  const lista = document.getElementById("checklist");
  lista.innerHTML = "";
  notas[notaAtual].checklist.forEach((c,j)=>{
    const li = document.createElement("li");
    li.innerHTML = `
      <input type="checkbox" ${c.feito?"checked":""} onclick="checkNota(${notaAtual},${j})">
      ${c.texto}
      <button onclick="removerItem(${j})">❌</button>
    `;
    lista.appendChild(li);
  });
}

// REMOVER ITEM
function removerItem(j){
  notas[notaAtual].checklist.splice(j,1);
  renderChecklist();
  salvarNotas();
}

// TEXTO
document.getElementById("editorTexto").oninput = () => {
  notas[notaAtual].texto = document.getElementById("editorTexto").value;
};
document.getElementById("tituloNota").oninput = () => {
  notas[notaAtual].titulo = document.getElementById("tituloNota").value;
};
document.getElementById("corNota").oninput = () => {
  notas[notaAtual].cor = document.getElementById("corNota").value;
};

// TOGGLE CONTEÚDO
function toggleNota(i){
  document.getElementById("c"+i).classList.toggle("ativo");
}

// EXCLUIR
function abrirExcluirNota(i){
  excluirIndex = i;
  document.getElementById("modalExcluirNota").style.display="flex";
}

function fecharModalNota(){
  document.getElementById("modalExcluirNota").style.display="none";
}

function confirmarExcluirNota(){
  notas.splice(excluirIndex,1);
  salvarNotas();
  fecharModalNota();
  renderNotas();
}

// ALERTA SALVAR
function salvarManualNota(){
  salvarNotas();
  alertaNota("Salvo ✔");
}

// BUSCA
document.getElementById("pesquisaNota").addEventListener("input", renderNotas);

// INIT
renderNotas();
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


// ===== DADOS =====
let notas = JSON.parse(localStorage.getItem('notas')) || [];
let notaAtual = null;

// HISTÓRICO
let historico = [];
let passoAtual = -1;

// ELEMENTOS
const listaNotas = document.getElementById('listaNotas');
const editor = document.getElementById('editorTexto');
const tituloInput = document.getElementById('tituloNota');
const corSelect = document.getElementById('corNota');
const pesquisa = document.getElementById('pesquisaNota');

// ===== SALVAR =====
function salvarNotas() {
  localStorage.setItem('notas', JSON.stringify(notas));
}

// ===== RENDER =====
function renderNotas() {
  listaNotas.innerHTML = '';

  const filtro = pesquisa.value.toLowerCase();

  notas.forEach((nota, index) => {

    if (!nota.titulo.toLowerCase().includes(filtro)) return;

    const div = document.createElement('div');
    div.classList.add('card-nota');
    div.draggable = true;

    div.style.background = nota.cor || 'white';

    div.innerHTML = `
      <div onclick="toggleNota(${index})">
        ${nota.favorito ? '⭐ ' : ''}
        <strong>${nota.titulo || 'Sem título'}</strong>
      </div>

      <div id="conteudo-${index}" class="conteudo-nota">
        <p>${nota.texto}</p>
      </div>

      <div class="acoes">
        <button onclick="editarNota(${index})">✏️</button>
        <button onclick="excluirNota(${index})">🗑️</button>
      </div>
    `;

    // DRAG
    div.addEventListener('dragstart', () => {
      div.classList.add('dragging');
    });

    div.addEventListener('dragend', () => {
      div.classList.remove('dragging');
    });

    listaNotas.appendChild(div);
  });
}

// ===== DRAG DROP =====
listaNotas.addEventListener('dragover', e => {
  e.preventDefault();
  const dragging = document.querySelector('.dragging');
  const after = getDragAfterElement(e.clientY);

  if (after == null) {
    listaNotas.appendChild(dragging);
  } else {
    listaNotas.insertBefore(dragging, after);
  }
});

function getDragAfterElement(y) {
  const elements = [...listaNotas.querySelectorAll('.card-nota:not(.dragging)')];

  return elements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ===== CRIAR =====
document.getElementById('criarNota').onclick = () => {
  notas.push({
    titulo: '',
    texto: '',
    checklist: [],
    cor: 'white',
    favorito: false
  });

  notaAtual = notas.length - 1;
  abrirEditor();
};

// ===== EDITOR =====
function abrirEditor() {
  document.getElementById('editorView').style.display = 'block';

  const nota = notas[notaAtual];

  tituloInput.value = nota.titulo;
  editor.value = nota.texto;
  corSelect.value = nota.cor;

  historico = [];
  passoAtual = -1;
  salvarHistorico(editor.value);

  renderChecklist();
}

function voltarLista() {
  document.getElementById('editorView').style.display = 'none';
  renderNotas();
}

function editarNota(index) {
  notaAtual = index;
  abrirEditor();
}

function excluirNota(index) {
  if (confirm("Excluir nota?")) {
    notas.splice(index, 1);
    salvarNotas();
    renderNotas();
  }
}

// ===== AUTO SAVE =====
editor.addEventListener('input', () => {
  notas[notaAtual].texto = editor.value;
  salvarNotas();
  salvarHistorico(editor.value);
});

tituloInput.addEventListener('input', () => {
  notas[notaAtual].titulo = tituloInput.value;
  salvarNotas();
  renderNotas();
});

corSelect.addEventListener('change', () => {
  notas[notaAtual].cor = corSelect.value;
  salvarNotas();
});

// ===== FAVORITO =====
function toggleFavorito() {
  notas[notaAtual].favorito = !notas[notaAtual].favorito;
  salvarNotas();
}

// ===== CHECKLIST =====
function addItem() {
  const input = document.getElementById('novoItem');

  notas[notaAtual].checklist.push({
    texto: input.value,
    feito: false
  });

  input.value = '';
  salvarNotas();
  renderChecklist();
}

function toggleItem(i) {
  notas[notaAtual].checklist[i].feito =
    !notas[notaAtual].checklist[i].feito;

  salvarNotas();
  renderChecklist();
}

function renderChecklist() {
  const ul = document.getElementById('checklist');
  ul.innerHTML = '';

  notas[notaAtual].checklist.forEach((item, i) => {
    const li = document.createElement('li');

    li.innerHTML = `
      <input type="checkbox"
        ${item.feito ? 'checked' : ''}
        onclick="toggleItem(${i})">

      <span style="text-decoration:${item.feito ? 'line-through' : 'none'}">
        ${item.texto}
      </span>
    `;

    ul.appendChild(li);
  });
}

// ===== UNDO / REDO =====
function salvarHistorico(texto) {
  historico = historico.slice(0, passoAtual + 1);
  historico.push(texto);
  passoAtual++;
}

function desfazer() {
  if (passoAtual > 0) {
    passoAtual--;
    editor.value = historico[passoAtual];
    notas[notaAtual].texto = editor.value;
    salvarNotas();
  }
}

function refazer() {
  if (passoAtual < historico.length - 1) {
    passoAtual++;
    editor.value = historico[passoAtual];
    notas[notaAtual].texto = editor.value;
    salvarNotas();
  }
}

// ===== ACCORDION =====
function toggleNota(index) {
  const el = document.getElementById(`conteudo-${index}`);
  el.classList.toggle('ativo');
}

// ===== PESQUISA =====
pesquisa.addEventListener('input', renderNotas);

// ===== INIT =====
renderNotas();
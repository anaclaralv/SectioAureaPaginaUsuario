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

if (tela === "estatistica") {
  setTimeout(() => {
    carregarEstatisticas();
  }, 100);
}

if (tela === "revisao") {
  setTimeout(() => {
    carregarRevisao();
  }, 100);
}


function corPrioridade(prioridade) {
  if (prioridade === "alta") return "#ef4444";   // vermelho
  if (prioridade === "media") return "#f59e0b";  // laranja
  if (prioridade === "baixa") return "#22c55e";  // verde
  return "#6b7280";
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

function ordenarPorPrioridade(arrayTarefas) {
  const prioridadeValor = { "alta": 1, "media": 2, "baixa": 3 };
  return arrayTarefas.sort((a, b) => prioridadeValor[a.prioridade] - prioridadeValor[b.prioridade]);
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


function renderizar() {
  const hojeLista = document.getElementById("tarefasHoje");
  const futurasLista = document.getElementById("tarefasFuturas");

  if (!hojeLista || !futurasLista) return;

  hojeLista.innerHTML = "";
  futurasLista.innerHTML = "";

  const hoje = hojeFormatado();

  const prioridadeOrdem = { alta: 3, media: 2, baixa: 1 };

  // Função para criar card
  function criarCard(tarefa) {
    const card = document.createElement("div");
    card.classList.add("tarefa-card");
    if (tarefa.concluida) card.classList.add("concluida");

    const info = document.createElement("div");
    info.classList.add("tarefa-info");

    const spanTitulo = document.createElement("span");
    spanTitulo.textContent = `${tarefa.titulo} (${tarefa.data})`;

    const badge = document.createElement("span");
    badge.classList.add("tarefa-prioridade", `tarefa-${tarefa.prioridade}`);
    badge.textContent = tarefa.prioridade.toUpperCase();

    info.appendChild(spanTitulo);
    info.appendChild(badge);

    const btnConcluir = document.createElement("button");
    btnConcluir.classList.add("btn-concluir");
    btnConcluir.textContent = tarefa.concluida ? "↩ Desfazer" : "✔ Concluir";
    btnConcluir.onclick = () => {
      tarefa.concluida = !tarefa.concluida;
      salvar();
      renderizar();
      atualizarResumoInicio();
    };

    const btnExcluir = document.createElement("button");
    btnExcluir.classList.add("btn-excluir");
    btnExcluir.textContent = "❌ Excluir";
    btnExcluir.onclick = () => {
      tarefas = tarefas.filter(t => t.id !== tarefa.id);
      salvar();
      renderizar();
      atualizarResumoInicio();
    };

    card.appendChild(info);
    card.appendChild(btnConcluir);
    card.appendChild(btnExcluir);

    return card;
  }

  // Separar tarefas de hoje e futuras e ordenar
  const tarefasHoje = tarefas.filter(t => t.data === hoje)
                             .sort((a, b) => prioridadeOrdem[b.prioridade] - prioridadeOrdem[a.prioridade]);

  const tarefasFuturas = tarefas.filter(t => t.data > hoje)
                                .sort((a, b) => prioridadeOrdem[b.prioridade] - prioridadeOrdem[a.prioridade]);

  if (tarefasHoje.length === 0) hojeLista.innerHTML = "<p>Nenhuma tarefa cadastrada hoje!</p>";
  else tarefasHoje.forEach(t => hojeLista.appendChild(criarCard(t)));

  if (tarefasFuturas.length === 0) futurasLista.innerHTML = "<p>Nenhuma tarefa futura cadastrada!</p>";
  else tarefasFuturas.forEach(t => futurasLista.appendChild(criarCard(t)));
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



/**CALENDARIOO */
let calendar;

document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendario');
  if (!calendarEl) return;

  const eventosSalvos = JSON.parse(localStorage.getItem("eventosCalendario")) || [];
  const tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];

  // 🔗 CONVERTE tarefas em eventos
  const eventosTarefas = tarefas
    .filter(t => t.data)
    .map(tarefa => ({
      title: tarefa.titulo,
      date: tarefa.data,
      backgroundColor: corPrioridade(tarefa.prioridade)
    }));

  // ✅ CRIA calendário UMA VEZ SÓ
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',

    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },

    events: [...eventosSalvos, ...eventosTarefas]
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
  const cor = document.getElementById("corEvento").value;

  if (!titulo || !data) {
    alert("Preencha os campos!");
    return;
  }

  const novoEvento = {
    title: titulo,
    date: data,
    backgroundColor: cor,
    borderColor: cor
  };

  calendar.addEvent(novoEvento);
  salvarEventos();

  document.getElementById("tituloEvento").value = "";
  document.getElementById("dataEvento").value = "";
  document.getElementById("corEvento").value = "#3788d8";
}
function salvarEventos() {
  const eventos = calendar.getEvents().map(event => ({
    title: event.title,
    date: event.startStr,
    backgroundColor: event.backgroundColor
  }));

  localStorage.setItem("eventosCalendario", JSON.stringify(eventos));
}






// NOTAS
document.addEventListener("DOMContentLoaded", () => {
  let notas = JSON.parse(localStorage.getItem("notas")) || [];
  let notaAtual = null;
  const notasContainer = document.getElementById("notasContainer");
  const searchInput = document.getElementById("search");
  const notaModal = new bootstrap.Modal(document.getElementById("notaModal"));

  function renderNotas() {
    notasContainer.innerHTML = "";
    const filtro = searchInput.value.toLowerCase();
    notas
      .filter(n => n.titulo.toLowerCase().includes(filtro))
      .sort((a,b) => b.favorito - a.favorito)
      .forEach((nota, idx) => {
        const card = document.createElement("div");
        card.className = "col-md-4";
        card.innerHTML = `
          <div class="card-nota" style="background-color:${nota.cor}; padding:10px; border-radius:5px;">
            <i class="fa fa-star estrela ${nota.favorito ? 'favorito' : ''}" data-idx="${idx}" style="cursor:pointer;"></i>
            <h5>${nota.titulo}</h5>
            <div class="card-conteudo">
              ${nota.texto}
              <div class="checklist-card">
                ${nota.checklist.map((c,i) => `
                  <div class="check-item ${c.checked ? 'completed' : ''}" data-idx="${i}" data-cardidx="${idx}">
                    <input type="checkbox" ${c.checked ? 'checked' : ''}>
                    <span>${c.texto}</span>
                    <button class="btn-excluir-check" style="border:none; background:none; cursor:pointer;">✕</button>
                  </div>
                `).join("")}
              </div>
            </div>
            <div class="mt-2">
              <button class="btn btn-sm btn-warning btn-editar" data-idx="${idx}">Editar</button>
              <button class="btn btn-sm btn-danger btn-excluir" data-idx="${idx}">Excluir</button>
            </div>
          </div>
        `;
        notasContainer.appendChild(card);
      });

    document.querySelectorAll(".check-item input").forEach(input => {
      input.addEventListener("change", (e) => {
        const div = e.target.parentElement;
        const idx = div.dataset.idx;
        const cardidx = div.dataset.cardidx;
        notas[cardidx].checklist[idx].checked = e.target.checked;
        salvarNotas();
        renderNotas();
      });
    });

    document.querySelectorAll(".btn-excluir-check").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const div = e.target.parentElement;
        const idx = div.dataset.idx;
        const cardidx = div.dataset.cardidx;
        notas[cardidx].checklist.splice(idx,1);
        salvarNotas();
        renderNotas();
      });
    });
  }

  function salvarNotas() {
    localStorage.setItem("notas", JSON.stringify(notas));
  }




  
  function abrirModal(nota=null, idx=null){
    notaAtual = idx;
    document.getElementById("notaTitulo").value = nota?.titulo || "";
    document.getElementById("notaTexto").innerHTML = nota?.texto || "";
    document.getElementById("notaCor").value = nota?.cor || "#ffffff";
    renderChecklist(nota?.checklist || []);
    notaModal.show();
  }

  function renderChecklist(items){
    const container = document.getElementById("checklistContainer");
    container.innerHTML = "";
    items.forEach((c,i) => {
      const div = document.createElement("div");
      div.className = "check-item" + (c.checked ? "completed" : "");
      div.style.display = "flex"; div.style.alignItems = "center"; div.style.marginBottom = "5px";
      div.innerHTML = `
        <input type="checkbox" ${c.checked ? 'checked' : ''} style="margin-right:5px;">
        <input type="text" class="form-control form-control-sm" value="${c.texto}" style="flex:1; margin-right:5px;">
        <button class="btn-excluir-check" style="border:none; background:none; cursor:pointer;">✕</button>
      `;
      const checkbox = div.querySelector("input[type=checkbox]");
      const textoInput = div.querySelector("input[type=text]");
      checkbox.addEventListener("change", () => {
        c.checked = checkbox.checked;
        renderChecklist(items);
      });
      textoInput.addEventListener("input", () => {
        c.texto = textoInput.value;
      });
      div.querySelector(".btn-excluir-check").addEventListener("click", () => {
        items.splice(i,1);
        renderChecklist(items);
      });
      container.appendChild(div);
    });
  }

  document.getElementById("addCheck").addEventListener("click", () => {
    const checklist = notaAtual !== null ? notas[notaAtual].checklist : [];
    checklist.push({texto:"Novo item", checked:false});
    renderChecklist(checklist);
  });

  document.getElementById("btnSalvar").addEventListener("click", () => {
    const titulo = document.getElementById("notaTitulo").value;
    const texto = document.getElementById("notaTexto").innerHTML;
    const cor = document.getElementById("notaCor").value;
    const checklist = Array.from(document.querySelectorAll("#checklistContainer .check-item")).map(item => ({
      texto: item.querySelector("input[type=text]").value,
      checked: item.querySelector("input[type=checkbox]").checked
    }));
    const novaNota = {titulo,texto,cor,checklist,favorito:notaAtual!==null ? notas[notaAtual].favorito : false};
    if(notaAtual !== null) notas[notaAtual] = novaNota;
    else notas.push(novaNota);
    salvarNotas();
    notaModal.hide();
    renderNotas();
    Swal.fire({icon:'success', title:'Nota salva!', timer:1500, showConfirmButton:false});
  });

  notasContainer.addEventListener("click", e => {
    const idx = e.target.dataset.idx;
    if(e.target.classList.contains("estrela")){
      notas[idx].favorito = !notas[idx].favorito;
      salvarNotas();
      renderNotas();
    }
    if(e.target.classList.contains("btn-excluir")){
      Swal.fire({
        title:'Excluir nota?',
        text:"Essa ação não pode ser desfeita!",
        icon:'warning',
        showCancelButton:true,
        confirmButtonColor:'#d33',
        cancelButtonColor:'#3085d6',
        confirmButtonText:'Sim, excluir'
      }).then(result => {
        if(result.isConfirmed){
          notas.splice(idx,1);
          salvarNotas();
          renderNotas();
          Swal.fire('Excluída!', '', 'success');
        }
      });
    }
    if(e.target.classList.contains("btn-editar")){
      abrirModal(notas[idx], idx);
    }
  });

  document.getElementById("btnNova").addEventListener("click", () => abrirModal());
  searchInput.addEventListener("input", renderNotas);

  renderNotas();
});





//INICIO

function atualizarResumoInicio() {
  const hoje = hojeFormatado();

  // TAREFAS
  const tarefasResumo = document.getElementById("tarefasResumo");
  if (tarefasResumo) {
    tarefasResumo.innerHTML = "";

  const tarefasHoje = tarefas.filter(t => t.data === hoje);
  const tarefasFuturas = tarefas.filter(t => t.data > hoje);

    function criarLiTarefa(tarefa) {
      const li = document.createElement("li");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = tarefa.concluida || false;

      const span = document.createElement("span");
      span.textContent = `${tarefa.titulo} - ${tarefa.data} - prioridade ${tarefa.prioridade}`;
      span.style.color = corPrioridade(tarefa.prioridade);
      if(tarefa.concluida) span.classList.add("concluida");

      checkbox.addEventListener("change", () => {
        tarefa.concluida = checkbox.checked;
        if(tarefa.concluida) span.classList.add("concluida");
        else span.classList.remove("concluida");
        localStorage.setItem("tarefas", JSON.stringify(tarefas));
      });

      if (calendar && tarefa.data) {
  calendar.addEvent({
    title: tarefa.titulo,
    date: tarefa.data,
    backgroundColor: corPrioridade(tarefa.prioridade)
  });
}

      li.appendChild(checkbox);
      li.appendChild(span);
      return li;
    }

    if (tarefasHoje.length > 0) {
      const titulo = document.createElement("li");
      titulo.innerHTML = "<strong>Tarefas de Hoje:</strong>";
      tarefasResumo.appendChild(titulo);
      tarefasHoje.forEach(t => tarefasResumo.appendChild(criarLiTarefa(t)));
    }

    if (tarefasFuturas.length > 0) {
      const titulo = document.createElement("li");
      titulo.innerHTML = "<strong>Tarefas Futuras:</strong>";
      tarefasResumo.appendChild(titulo);
      tarefasFuturas.forEach(t => tarefasResumo.appendChild(criarLiTarefa(t)));
    }

    if(tarefasHoje.length === 0 && tarefasFuturas.length === 0){
      const li = document.createElement("li");
      li.textContent = "Nenhuma tarefa cadastrada!";
      tarefasResumo.appendChild(li);
    }
  }

  // EVENTOS
  const eventosResumo = document.getElementById("eventosResumo");
  if (eventosResumo && calendar) {
    eventosResumo.innerHTML = "";
    const proximosEventos = calendar.getEvents()
      .filter(e => new Date(e.start).toDateString() >= new Date().toDateString())
      .slice(0,5);
    proximosEventos.forEach(ev => {
      const li = document.createElement("li");
      li.textContent = `${ev.title} - ${ev.start.toLocaleDateString()}`;
      li.style.color = ev.backgroundColor || "black";
      eventosResumo.appendChild(li);
    });
  }

  // CRONOGRAMA
  const cronogramaResumo = document.getElementById("cronogramaResumo");
  if (cronogramaResumo) {
    cronogramaResumo.innerHTML = "";
    const diasSemana = ["domingo","segunda","terca","quarta","quinta","sexta","sabado"];
    const hojeSemana = diasSemana[new Date().getDay()];
    const blocosHoje = JSON.parse(localStorage.getItem("cronograma")) || [];
    blocosHoje
      .filter(b => b.dia === hojeSemana)
      .forEach(bloco => {
        const li = document.createElement("li");
        li.textContent = `${bloco.materia} - ${bloco.inicio} às ${bloco.fim}`;
        cronogramaResumo.appendChild(li);
      });
  }
}

function atualizarTudo() {
  renderizar();
  atualizarTabela();
  atualizarResumoInicio();
}

document.addEventListener("DOMContentLoaded", () => {
  atualizarResumoInicio();
});

/**CRONOGRAMA JAVA SCRIPT*/
// ---------- CRONOGRAMA ----------
let cronograma = JSON.parse(localStorage.getItem("cronograma")) || [];

function salvarCronograma() {
  localStorage.setItem("cronograma", JSON.stringify(cronograma));
}

// ---------- CORES POR MATÉRIA ----------
function corMateria(materia) {
  const cores = {
    matematica: "#4a90e2",
    fisica: "#9b59b6",
    quimica: "#27ae60",
    historia: "#e67e22",
    portugues: "#e74c3c"
  };

  return cores[materia.toLowerCase()] || "#555";
}

function converterParaMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function adicionarBloco() {
  const materiaEl = document.getElementById("materiaCronograma");
  const diaEl = document.getElementById("dia");
  const inicioEl = document.getElementById("inicio");
  const fimEl = document.getElementById("fim");

  if (!materiaEl || !diaEl || !inicioEl || !fimEl) {
    alert("Erro nos campos!");
    return;
  }

  const materia = materiaEl.value.trim();
  const dia = diaEl.value;
  const inicio = inicioEl.value;
  const fim = fimEl.value;

  if (!materia) {
    alert("Digite a matéria!");
    return;
  }

  if (!inicio || !fim) {
    alert("Preencha os horários!");
    return;
  }

  const inicioMin = converterParaMinutos(inicio);
  const fimMin = converterParaMinutos(fim);

  // 🔥 validação de horário
  if (inicioMin >= fimMin) {
    alert("O horário final deve ser depois do início!");
    return;
  }

  // 🔥 validação de conflito (CORRIGIDA)
  const conflito = cronograma.some(b => {
    if (b.dia !== dia) return false;

    const bInicio = converterParaMinutos(b.inicio);
    const bFim = converterParaMinutos(b.fim);

    return (
      inicioMin < bFim && fimMin > bInicio
    );
  });

  if (conflito) {
    alert("Já existe um bloco nesse horário!");
    return;
  }

  // ✅ AGORA SIM adiciona
  cronograma.push({
    id: Date.now(),
    materia,
    dia,
    inicio,
    fim
  });

  salvarCronograma();
  renderizarCronograma();

  materiaEl.value = "";
  inicioEl.value = "";
  fimEl.value = "";
}
// ---------- RENDER ----------
function renderizarCronograma() {
  const container = document.getElementById("cronogramaLista");
  if (!container) return;

  container.innerHTML = "";

  const dias = ["segunda","terca","quarta","quinta","sexta","sabado","domingo"];

  dias.forEach(dia => {
    const divDia = document.createElement("div");
    divDia.innerHTML = `<h3>${dia.toUpperCase()}</h3>`;

    cronograma
      .filter(b => b.dia === dia)
      .forEach(b => {
        const item = document.createElement("div");

        item.style.background = "#f5f5f5";
        item.style.padding = "10px";
        item.style.margin = "5px 0";
        item.style.borderLeft = `5px solid ${corMateria(b.materia)}`;

        item.innerHTML = `
          <strong>${b.materia}</strong> (${b.inicio} - ${b.fim})
          <br>
          <button onclick="editarBloco(${b.id})">✏️</button>
          <button onclick="excluirBloco(${b.id})">❌</button>
        `;

        divDia.appendChild(item);
      });

    container.appendChild(divDia);
  });

  mostrarAgora();
}

// ---------- EXCLUIR ----------
function excluirBloco(id) {
  cronograma = cronograma.filter(b => b.id !== id);
  salvarCronograma();
  renderizarCronograma();
}

// ---------- EDITAR ----------
function editarBloco(id) {
  const bloco = cronograma.find(b => b.id === id);
  if (!bloco) return;

  const novaMateria = prompt("Matéria:", bloco.materia);
  const novoInicio = prompt("Início:", bloco.inicio);
  const novoFim = prompt("Fim:", bloco.fim);

  if (!novaMateria || !novoInicio || !novoFim) return;

  bloco.materia = novaMateria;
  bloco.inicio = novoInicio;
  bloco.fim = novoFim;

  salvarCronograma();
  renderizarCronograma();
}

// ---------- VER AGORA ----------
function mostrarAgora() {
  const agoraEl = document.getElementById("agora");
  if (!agoraEl) return;

  const agora = new Date();
  const diaSemana = ["domingo","segunda","terca","quarta","quinta","sexta","sabado"][agora.getDay()];

  const horaAtual = agora.toTimeString().slice(0,5);

  const atual = cronograma.find(b =>
    b.dia === diaSemana &&
    horaAtual >= b.inicio &&
    horaAtual <= b.fim
  );

  if (atual) {
    agoraEl.textContent = `📌 Agora: ${atual.materia} até ${atual.fim}`;
  } else {
    agoraEl.textContent = "📌 Agora: Livre";
  }
}

// ---------- INICIAR ----------
document.addEventListener("DOMContentLoaded", () => {
  renderizarCronograma();
});


function renderizarResumoHoje() {
  const lista = document.getElementById("listaHojeCronograma");
  if (!lista) return;

  const hojeSemana = ["domingo","segunda","terca","quarta","quinta","sexta","sabado"][new Date().getDay()];
  const cronograma = JSON.parse(localStorage.getItem("cronograma")) || [];

  lista.innerHTML = "";

  const blocosHoje = cronograma.filter(b => b.dia === hojeSemana);

  if (blocosHoje.length === 0) {
    lista.innerHTML = "<li>Sem atividades hoje 😊</li>";
    return;
  }

  blocosHoje.forEach(bloco => {
    const li = document.createElement("li");
    li.textContent = `🕒 ${bloco.inicio} - ${bloco.fim} : ${bloco.materia}`;
    lista.appendChild(li);
  });
}




// ABRIR MODAL AO CLICAR NO USERINFO
document.getElementById('userInfo').addEventListener('click', function() {
  const novoNome = document.getElementById('sidebarNome').textContent;
  const novoEmail = document.getElementById('sidebarEmail').textContent;
  const fotoSrc = document.getElementById('sidebarFoto').src;

  document.getElementById('novoNome').value = novoNome;
  document.getElementById('novoEmail').value = novoEmail;
  document.getElementById('previewFoto').src = fotoSrc;

  const modal = new bootstrap.Modal(document.getElementById('configModal'));
  modal.show();
});

// SALVAR CONFIGURAÇÕES
function salvarConfiguracao() {
  const novoNome = document.getElementById('novoNome').value;
  const novoEmail = document.getElementById('novoEmail').value;
  const novaFotoInput = document.getElementById('novaFoto');

  document.getElementById('sidebarNome').textContent = novoNome;
  document.getElementById('sidebarEmail').textContent = novoEmail;

  if (novaFotoInput.files && novaFotoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('sidebarFoto').src = e.target.result;
      document.getElementById('previewFoto').src = e.target.result;
    }
    reader.readAsDataURL(novaFotoInput.files[0]);
  }

  Swal.fire({
    icon: 'success',
    title: 'Sucesso!',
    text: 'Configurações salvas com sucesso.',
    timer: 1500,
    showConfirmButton: false
  });

  bootstrap.Modal.getInstance(document.getElementById('configModal')).hide();
}


/**ESTATISTICAS */
/** 📊 ESTATÍSTICAS */
let graficoSemanal;
let graficoMaterias;
let graficoMensal;

function carregarEstatisticas() {

  const historico = JSON.parse(localStorage.getItem("historicoEstudos")) || [];
  const tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];

  // ---------- 📅 ÚLTIMOS 7 DIAS ----------
  const dias = [];
  const horasPorDia = [];

  for (let i = 6; i >= 0; i--) {
    const data = new Date();
    data.setDate(data.getDate() - i);

    const diaStr = data.toLocaleDateString('pt-BR');
    dias.push(diaStr);

    let total = 0;

    historico.forEach(item => {
      if (item.data.includes(diaStr)) {
        total += item.tempo / 3600; // segundos → horas
      }
    });

    horasPorDia.push(Number(total.toFixed(2)));
  }

  // ---------- 📚 POR MATÉRIA ----------
  const materias = {};
  historico.forEach(item => {
    if (!materias[item.materia]) materias[item.materia] = 0;
    materias[item.materia] += item.tempo / 3600;
  });

  const nomesMaterias = Object.keys(materias);
  const horasMaterias = Object.values(materias).map(h => Number(h.toFixed(2)));

  // ---------- ✅ TAREFAS ----------
  const total = tarefas.length;
  const concluidas = tarefas.filter(t => t.concluida).length;
  const percentual = total ? ((concluidas / total) * 100).toFixed(0) : 0;

  // ---------- 🔥 STREAK ----------
  let streak = 0;
  for (let i = 0; i < 7; i++) {
    if (horasPorDia[6 - i] > 0) streak++;
    else break;
  }

  // ---------- 🏆 MATÉRIA TOP ----------
  let materiaTop = "-";
  if (nomesMaterias.length > 0) {
    materiaTop = nomesMaterias.reduce((a, b) =>
      materias[a] > materias[b] ? a : b
    );
  }

  // ---------- 📊 GRÁFICO SEMANAL ----------
  const ctx1 = document.getElementById("graficoSemanal");

  if (graficoSemanal) graficoSemanal.destroy();

  graficoSemanal = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: dias,
      datasets: [{
        label: 'Horas estudadas',
        data: horasPorDia,
        backgroundColor: '#9f042c'
      }]
    }
  });

  // ---------- 🥧 GRÁFICO MATÉRIAS ----------
  const ctx2 = document.getElementById("graficoMaterias");

  if (graficoMaterias) graficoMaterias.destroy();

  graficoMaterias = new Chart(ctx2, {
    type: 'pie',
    data: {
      labels: nomesMaterias,
      datasets: [{
        data: horasMaterias,
        backgroundColor: ['#9f042c', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7']
      }]
    }
  });


  // ---------- 📋 RESUMO ----------
  document.getElementById("resumoEstatisticas").innerHTML = `
    ✅ ${percentual}% das tarefas concluídas <br>
    🔥 Ofensiva: ${streak} dias <br>
    🏆 Matéria mais estudada: ${materiaTop}
  `;
  // ---------- 🎯 META SEMANAL ----------
const META_SEMANAL = 10; // horas (pode mudar)

const totalSemana = horasPorDia.reduce((a, b) => a + b, 0);
const porcentagemMeta = Math.min((totalSemana / META_SEMANAL) * 100, 100);

document.getElementById("barraMeta").style.width = porcentagemMeta + "%";

document.getElementById("textoMeta").innerHTML = `
  ${totalSemana.toFixed(1)}h / ${META_SEMANAL}h (${porcentagemMeta.toFixed(0)}%)
`;

// ---------- 📈 EVOLUÇÃO MENSAL ----------
const diasMes = {};
historico.forEach(item => {
  const data = new Date(item.data);
  const dia = data.getDate();

  if (!diasMes[dia]) diasMes[dia] = 0;
  diasMes[dia] += item.tempo / 3600;
});

const labelsMes = Object.keys(diasMes);
const dadosMes = Object.values(diasMes).map(h => Number(h.toFixed(2)));

const ctx3 = document.getElementById("graficoMensal");

if (graficoMensal) graficoMensal.destroy();

graficoMensal = new Chart(ctx3, {
  type: 'line',
  data: {
    labels: labelsMes,
    datasets: [{
      label: 'Horas por dia no mês',
      data: dadosMes,
      borderColor: '#9f042c',
      fill: false,
      tension: 0.3
    }]
  }
});
// ---------- 🤖 SUGESTÕES ----------
const sugestoes = [];

if (totalSemana < 5) {
  sugestoes.push("📉 Você estudou pouco essa semana. Tente aumentar o tempo!");
}

if (streak === 0) {
  sugestoes.push("😴 Você não estudou hoje. Que tal começar agora?");
}

if (nomesMaterias.length > 1) {
  const menorMateria = nomesMaterias.reduce((a, b) =>
    materias[a] < materias[b] ? a : b
  );
  sugestoes.push(`⚠️ Você está estudando pouco ${menorMateria}`);
}

if (percentual < 50) {
  sugestoes.push("❌ Muitas tarefas não concluídas. Foque nas prioridades!");
}

const listaSugestoes = document.getElementById("sugestoes");
listaSugestoes.innerHTML = "";

if (sugestoes.length === 0) {
  listaSugestoes.innerHTML = "<li>👏 Tudo indo muito bem! Continue assim!</li>";
} else {
  sugestoes.forEach(s => {
    const li = document.createElement("li");
    li.textContent = s;
    listaSugestoes.appendChild(li);
  });
}
}

/** 🔁 REVISÃO */
function carregarRevisao() {
  // ---------- Revisão do Dia ----------
  const cronograma = JSON.parse(localStorage.getItem("cronograma")) || [];
  const listaDia = document.getElementById("listaRevisaoDia");
  listaDia.innerHTML = "";

  const diasSemana = ["domingo","segunda","terca","quarta","quinta","sexta","sabado"];
  const hojeSemana = diasSemana[new Date().getDay()];
  const horaAtual = new Date().toTimeString().slice(0,5);

  const blocosHoje = cronograma.filter(b => b.dia === hojeSemana);

  if(blocosHoje.length === 0) {
    listaDia.innerHTML = "<li>Sem blocos de revisão hoje 😊</li>";
  } else {
    blocosHoje.forEach(b => {
      const li = document.createElement("li");
      li.textContent = `🕒 ${b.inicio} - ${b.fim} : ${b.materia}`;
      listaDia.appendChild(li);
    });
  }

  // ---------- Checklist de Notas ----------
  const notas = JSON.parse(localStorage.getItem("notas")) || [];
  const checklistNotas = document.getElementById("checklistNotas");
  checklistNotas.innerHTML = "";

  notas.forEach((nota, idx) => {
    const li = document.createElement("li");
    li.style.marginBottom = "5px";
    li.innerHTML = `
      <input type="checkbox" id="notaRevisao${idx}" ${nota.revisado ? "checked" : ""}>
      <label for="notaRevisao${idx}">${nota.titulo}</label>
    `;
    li.querySelector("input").addEventListener("change", e => {
      nota.revisado = e.target.checked;
      localStorage.setItem("notas", JSON.stringify(notas));
      carregarResumoRevisao();
    });
    checklistNotas.appendChild(li);
  });

  // ---------- Flashcards ----------
  const flashcardContainer = document.getElementById("flashcardContainer");
  flashcardContainer.innerHTML = "";

  notas.forEach((nota, idx) => {
    const card = document.createElement("div");
    card.classList.add("flashcard");
    card.style.border = "1px solid #ccc";
    card.style.borderRadius = "8px";
    card.style.padding = "10px";
    card.style.marginBottom = "8px";
    card.style.cursor = "pointer";
    card.style.background = nota.cor || "#fff";
    card.innerHTML = `
      <strong>${nota.titulo}</strong>
      <div class="resposta" style="display:none; margin-top:5px;">${nota.texto}</div>
    `;
    card.addEventListener("click", () => {
      const resp = card.querySelector(".resposta");
      resp.style.display = resp.style.display === "none" ? "block" : "none";
    });
    flashcardContainer.appendChild(card);
  });

  // ---------- Estatísticas de Revisão ----------
  carregarResumoRevisao();
}

// ---------- Função de resumo ----------
function carregarResumoRevisao() {
  const notas = JSON.parse(localStorage.getItem("notas")) || [];
  const revisadas = notas.filter(n => n.revisado).length;
  const totais = notas.length;

  const resumo = document.getElementById("resumoRevisao");
  resumo.innerHTML = `✅ ${revisadas} de ${totais} notas revisadas`;
}

// ---------- Atualiza toda vez que a aba abre ----------
function mostrarTela(tela) {
  const telas = [
    "inicio","tarefas","notas","calendario","relogio","estatistica","cronograma","metodos","revisao","progressoEstudos"
  ];
  telas.forEach(t => {
    const el = document.getElementById(t + "Section");
    if(el) el.style.display = "none";
  });

  const ativa = document.getElementById(tela + "Section");
  if(ativa) ativa.style.display = "block";

  if(tela === "revisao") carregarRevisao();
  if(tela === "estatistica") setTimeout(carregarEstatisticas, 100);
  if(tela === "cronograma") renderizarCronograma();
  if(tela === "tarefas") atualizarTabela();
  if(tela === "relogio") carregarHistorico();
}


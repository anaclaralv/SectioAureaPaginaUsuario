
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

  atualizarTudo();

  if (tela === "calendario" && calendar) {
    setTimeout(() => {
      calendar.updateSize();
    }, 100);
  }

  if (tela === "cronograma") {
    renderCronogramaNovo();
  }

  if (tela === "estatistica") {
    setTimeout(() => {
      carregarEstatisticas();
    }, 100);
  }




  // funções específicas
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

function salvarTarefas() {
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

  tituloEl.value = "";
  dataEl.value = "";
  prioridadeEl.value = "alta";


  tarefas.push({
    id: Date.now(),
    titulo,
    prioridade,
    data,
    concluida: false
  });

  salvarTarefas();
  atualizarTudo();
  atualizarEventosTarefas();
}


function renderizarTarefas() {
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

    // --- Botões ---
    const btnConcluir = document.createElement("button");
    btnConcluir.classList.add("btn-concluir");
    btnConcluir.textContent = tarefa.concluida ? "↩ Desfazer" : "✔ Concluir";
    btnConcluir.onclick = () => {
      tarefa.concluida = !tarefa.concluida;
      salvarTarefas();
      renderizarTarefas();
      atualizarResumoInicio();
      atualizarEventosTarefas();
    };

    const btnEditar = document.createElement("button");
    btnEditar.classList.add("btn-editar");
    btnEditar.textContent = "✏️ Editar";
    btnEditar.onclick = () => {
      Swal.fire({
        title: 'Editar Tarefa',
        html: `
        <input type="text" id="editTitulo" class="swal2-input" value="${tarefa.titulo}">
        <select id="editPrioridade" class="swal2-input">
          <option value="alta" ${tarefa.prioridade === 'alta' ? 'selected' : ''}>Alta</option>
          <option value="media" ${tarefa.prioridade === 'media' ? 'selected' : ''}>Média</option>
          <option value="baixa" ${tarefa.prioridade === 'baixa' ? 'selected' : ''}>Baixa</option>
        </select>
        <input type="date" id="editData" class="swal2-input" value="${tarefa.data}">
      `,
        showCancelButton: true,
        confirmButtonText: 'Salvar'
      }).then(result => {
        if (result.isConfirmed) {
          const novoTitulo = document.getElementById('editTitulo').value.trim();
          const novaPrioridade = document.getElementById('editPrioridade').value;
          const novaData = document.getElementById('editData').value;

          if (!novoTitulo || !novaData) {
            Swal.fire({ icon: 'error', title: 'Preencha todos os campos!' });
            return;
          }

          tarefa.titulo = novoTitulo;
          tarefa.prioridade = novaPrioridade;
          tarefa.data = novaData;
          salvarTarefas();
          atualizarTudo();
          atualizarEventosTarefas();
        }
      });
    };

    const btnExcluir = document.createElement("button");
    btnExcluir.classList.add("btn-excluir");
    btnExcluir.textContent = "❌ Excluir";
    btnExcluir.onclick = () => {
      tarefas = tarefas.filter(t => t.id !== tarefa.id);
      salvarTarefas();
      renderizarTarefas();
      atualizarResumoInicio();
      atualizarEventosTarefas();
    };

    card.appendChild(info);
    card.appendChild(btnConcluir);
    card.appendChild(btnEditar); // adiciona aqui
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
  salvarTarefas();
  atualizarTudo();
  atualizarEventosTarefas();
}


function corPrioridade(prioridade) {
  if (prioridade === "alta") return "#ef4444";   // vermelho
  if (prioridade === "media") return "#f59e0b";  // laranja
  if (prioridade === "baixa") return "#22c55e";  // verde
  return "#6b7280";
}


// garante que os botões onclick encontrem as funções
window.adicionarTarefa = adicionarTarefa;
window.toggle = toggle;
/*variaveis */
let intervaloCronometro = null;
let segundos = 0;
let pausado = false;
let metaSegundos = null;

function iniciarCronometro() {
  if (intervalo) return;
  if (intervaloCronometro) return;

  materiaAtual = document.getElementById("materia").value || materiaAtualAuto;

  if (!materiaAtual) {
    alert("Digite a matéria!");
    return;
  }

  pausado = false;

  intervaloCronometro = setInterval(() => {
    if (!pausado) {
      segundos++;

      let h = String(Math.floor(segundos / 3600)).padStart(2, '0');
      let m = String(Math.floor((segundos % 3600) / 60)).padStart(2, '0');
      let s = String(segundos % 60).padStart(2, '0');

      document.getElementById("tempoCronometro").textContent = `${h}:${m}:${s}`;

      // 🔔 NOTIFICAÇÃO
      if (metaSegundos && segundos === metaSegundos) {
        alert("⏰ Tempo atingido!");
      }
    }
  }, 1000);
}

function pausarCronometro() {
  pausado = true;
}

function continuarCronometro() {
  pausado = false;
}

function pararCronometro() {
  clearInterval(intervaloCronometro);
  intervaloCronometro = null;

  try {
    tempoMaterias = JSON.parse(localStorage.getItem("tempoMaterias")) || {};
  } catch {
    tempoMaterias = {};
  }

  if (!tempoMaterias[materiaAtual]) {
    tempoMaterias[materiaAtual] = 0;
  }

  tempoMaterias[materiaAtual] += segundos;

  localStorage.setItem("tempoMaterias", JSON.stringify(tempoMaterias));

  segundos = 0;
  pausado = false;

  document.getElementById("tempoCronometro").textContent = "00:00:00";
}

function definirMeta() {
  const minutos = prompt("Defina o tempo (em minutos):");

  if (!minutos) return;

  metaSegundos = minutos * 60;
}


function iniciarTimer() {
  let minutos = document.getElementById("minutosTimer").value;

  if (!minutos) return;

  let tempo = minutos * 60;

  const intervalo = setInterval(() => {
    tempo--;

    let m = Math.floor(tempo / 60);
    let s = tempo % 60;

    document.getElementById("tempoTimer").textContent =
  `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    if (tempo <= 0) {
      clearInterval(intervalo);
      alert("Tempo acabou!");
    }
  }, 1000);
}
function iniciarPomodoro() {
  let tempo = 25 * 60;
  let modo = "foco";

  const intervalo = setInterval(() => {
    tempo--;

    let m = Math.floor(tempo / 60);
    let s = tempo % 60;

    document.getElementById("tempoPomodoro").textContent = `${m}:${s}`;

    if (tempo <= 0) {
      if (modo === "foco") {
        alert("Hora do descanso! 😴 (5 min)");
        tempo = 5 * 60;
        modo = "descanso";
      } else {
        alert("Bora voltar! 🚀");
        tempo = 25 * 60;
        modo = "foco";
      }
    }
  }, 1000);
}

function renderTempoMaterias() {
  const lista = document.getElementById("tempoMaterias");

  lista.innerHTML = "";

  for (let mat in tempoMaterias) {
    const li = document.createElement("li");

    let min = Math.floor(tempoMaterias[mat] / 60);

    li.textContent = `${mat}: ${min} min`;
    lista.appendChild(li);
  }
}
function analisarEstudos() {
  for (let mat in tempoMaterias) {
    if (tempoMaterias[mat] < 60) {
      console.log(`⚠️ Estude mais ${mat}`);
    }
  }
}



// ---------- CALENDÁRIO ----------
let calendar;

document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendario');
  if (!calendarEl) return;

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    editable: true, // permite arrastar e mudar datas
    selectable: true,
    eventClick: function (info) {
      const event = info.event;


      // Se o evento é de tarefa
      if (event.extendedProps.isTarefa) {
        const tarefa = tarefas.find(t => `${t.titulo} - ${t.prioridade.toUpperCase()}` === event.title);
        if (!tarefa) return;

        Swal.fire({
          title: 'Editar tarefa',
          html: `
        <input type="text" id="editTitulo" class="swal2-input" value="${tarefa.titulo}">
        <input type="date" id="editData" class="swal2-input" value="${tarefa.data}">
      `,
          showCancelButton: true,
          confirmButtonText: 'Salvar',
          denyButtonText: 'Excluir',
          showDenyButton: true
        }).then(result => {
          if (result.isConfirmed) {
            const novoTitulo = document.getElementById('editTitulo').value.trim();
            const novaData = document.getElementById('editData').value;
            if (novoTitulo && novaData) {
              tarefa.titulo = novoTitulo;
              tarefa.data = novaData;
              salvarTarefas();
              atualizarTudo();
              atualizarEventosTarefas();
            }
          } else if (result.isDenied) {
            tarefas = tarefas.filter(t => t.id !== tarefa.id);
            salvarTarefas();
            atualizarTudo();
            atualizarEventosTarefas();
          }
        });

      } else {
        // Eventos normais
        Swal.fire({
          title: 'Editar evento',
          html: `
        <input type="text" id="editTitulo" class="swal2-input" value="${event.title}">
        <input type="date" id="editData" class="swal2-input" value="${event.startStr}">
        <input type="color" id="editCor" class="swal2-input" value="${event.backgroundColor}">
      `,
          showCancelButton: true,
          confirmButtonText: 'Salvar',
          denyButtonText: 'Excluir',
          showDenyButton: true
        }).then(result => {
          if (result.isConfirmed) {
            const novoTitulo = document.getElementById('editTitulo').value.trim();
            const novaData = document.getElementById('editData').value;
            const novaCor = document.getElementById('editCor').value;
            if (novoTitulo && novaData) {
              event.setProp('title', novoTitulo);
              event.setStart(novaData);
              event.setProp('backgroundColor', novaCor);
              event.setProp('borderColor', novaCor);
              salvarEventos();
            }
          } else if (result.isDenied) {
            event.remove();
            salvarEventos();
          }
        });
      }
    },
    eventDrop: function (info) {
      const event = info.event;

      // 👉 SE FOR TAREFA
      if (event.extendedProps.isTarefa) {
        const tarefaId = event.extendedProps.tarefaId;

        const tarefa = tarefas.find(t => t.id === tarefaId);
        if (!tarefa) return;

        // Atualiza a data da tarefa
        tarefa.data = event.startStr;

        salvarTarefas();
        atualizarTudo();
        atualizarEventosTarefas();

      } else {
        // 👉 SE FOR EVENTO NORMAL
        salvarEventos();
      }
    },

    events: carregarEventos()
  });

  calendar.render();
  atualizarEventosTarefas();
});

// Função para adicionar evento do formulário
function adicionarEvento() {
  if (!calendar) return;

  const titulo = document.getElementById("tituloEvento").value.trim();
  const data = document.getElementById("dataEvento").value;
  const cor = document.getElementById("corEvento").value;

  if (!titulo || !data) return alert("Preencha os campos!");

  calendar.addEvent({
    title: titulo,
    date: data,
    backgroundColor: cor,
    borderColor: cor
  });

  salvarEventos();

  document.getElementById("tituloEvento").value = "";
  document.getElementById("dataEvento").value = "";
  document.getElementById("corEvento").value = "#3788d8";
}

// Salvar todos eventos no localStorage
function salvarEventos() {
  const eventos = calendar.getEvents().map(ev => ({
    title: ev.title,
    date: ev.startStr,
    backgroundColor: ev.backgroundColor
  }));
  localStorage.setItem("eventosCalendario", JSON.stringify(eventos));
}

// Carregar eventos do localStorage
function carregarEventos() {
  const eventosSalvos = JSON.parse(localStorage.getItem("eventosCalendario")) || [];
  const tarefasLS = JSON.parse(localStorage.getItem("tarefas")) || [];

  // Mapeia apenas tarefas não concluídas
  const eventosTarefas = tarefasLS
    .filter(t => t.data && !t.concluida)
    .map(t => ({
      title: `${t.titulo} - ${t.prioridade.toUpperCase()}`,
      date: t.data,
      backgroundColor: corPrioridade(t.prioridade),
      borderColor: corPrioridade(t.prioridade),
      extendedProps: { isTarefa: true, tarefaId: t.id }
    }));

  // Junta e remove duplicações caso existam
  const eventos = [...eventosSalvos, ...eventosTarefas];
  const eventosUnicos = [];
  const ids = new Set();

  eventos.forEach(ev => {
    const id = ev.extendedProps?.tarefaId || ev.title + ev.date;
    if (!ids.has(id)) {
      ids.add(id);
      eventosUnicos.push(ev);
    }
  });

  return eventosUnicos;
}


function atualizarEventosTarefas() {
  if (!calendar) return;

  // 🔥 REMOVE TODOS os eventos
  calendar.getEvents().forEach(ev => ev.remove());

  // 🔄 RECRIA tudo (eventos + tarefas)
  const eventos = carregarEventos();
  eventos.forEach(ev => {
    calendar.addEvent(ev);
  });


  // Adiciona somente tarefas **não concluídas**
  tarefas.forEach(t => {
    if (!t.data || t.concluida) return;
    // Evita duplicar: checa se já existe
    const jaExiste = calendar.getEvents().some(ev => ev.extendedProps.tarefaId === t.id);
    if (jaExiste) return;

    calendar.addEvent({
      title: `${t.titulo} - ${t.prioridade.toUpperCase()}`,
      date: t.data,
      backgroundColor: corPrioridade(t.prioridade),
      borderColor: corPrioridade(t.prioridade),
      extendedProps: { isTarefa: true, tarefaId: t.id }
    });
  });
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
      .filter(n =>
        n.titulo.toLowerCase().includes(filtro) ||
        n.texto.toLowerCase().includes(filtro)
      )
      .sort((a, b) => {
        if (b.favorito !== a.favorito) return b.favorito - a.favorito;
        return a.titulo.localeCompare(b.titulo);
      })
      .forEach((nota, idx) => {
        const card = document.createElement("div");
        card.className = "col-md-4";
        card.innerHTML = `
          <div class="card-nota" style="background-color:${nota.cor}; padding:10px; border-radius:5px;">
          <i class="fa fa-star estrela ${nota.favorito ? 'favorito' : ''}" 
   data-idx="${idx}"
   style="cursor:pointer;"></i>
            <h5>${nota.titulo}</h5>
            <small>${nota.dataCriacao || ""}</small>
            <div class="card-conteudo">
             ${nota.texto.replace(/<[^>]+>/g, "").slice(0, 100)}
              <div class="checklist-card">
                ${nota.checklist.map((c, i) => `
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
        notas[cardidx].checklist.splice(idx, 1);
        salvarNotas();
        renderNotas();
      });
    });
  }

  function salvarNotas() {
    localStorage.setItem("notas", JSON.stringify(notas));
  }
  document.getElementById("notaTexto").addEventListener("input", salvarNotas);




  function abrirModal(nota = null, idx = null) {
    notaAtual = idx;
    document.getElementById("notaTitulo").value = nota?.titulo || "";
    document.getElementById("notaTexto").innerHTML = nota?.texto || "";
    document.getElementById("notaCor").value = nota?.cor || "#ffffff";
    renderChecklist(nota?.checklist || []);
    notaModal.show();
  }

  function renderChecklist(items) {
    const container = document.getElementById("checklistContainer");
    container.innerHTML = "";
    items.forEach((c, i) => {
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
        items.splice(i, 1);
        renderChecklist(items);
      });
      container.appendChild(div);
    });
  }

  document.getElementById("addCheck").addEventListener("click", () => {
    const checklist = notaAtual !== null ? notas[notaAtual].checklist : [];
    checklist.push({ texto: "Novo item", checked: false });
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
    const novaNota = {
      titulo,
      texto,
      cor,
      checklist,
      favorito: false,
      dataCriacao: notaAtual !== null
        ? notas[notaAtual].dataCriacao
        : new Date().toLocaleString()
    };
    if (notaAtual !== null) notas[notaAtual] = novaNota;
    else notas.push(novaNota);
    salvarNotas();
    notaModal.hide();
    renderNotas();
    Swal.fire({ icon: 'success', title: 'Nota salva!', timer: 1500, showConfirmButton: false });
  });

  notasContainer.addEventListener("click", e => {
    const idx = e.target.dataset.idx;

    if (e.target.classList.contains("estrela")) {
      notas[idx].favorito = !notas[idx].favorito;
      salvarNotas();
      renderNotas();
    }

    if (e.target.classList.contains("btn-excluir")) {
      Swal.fire({
        title: 'Excluir nota?',
        text: "Essa ação não pode ser desfeita!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, excluir'
      }).then(result => {
        if (result.isConfirmed) {
          notas.splice(idx, 1);
          salvarNotas();
          renderNotas();
          Swal.fire('Excluída!', '', 'success');
        }
      });
    }

    if (e.target.classList.contains("btn-editar")) {
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
  const hojeSemana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"][new Date().getDay()];

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
      if (tarefa.concluida) span.classList.add("concluida");

      checkbox.addEventListener("change", () => {
        tarefa.concluida = checkbox.checked;
        if (tarefa.concluida) span.classList.add("concluida");
        else span.classList.remove("concluida");
        localStorage.setItem("tarefas", JSON.stringify(tarefas));
      });
      renderizarResumoHoje();

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

    if (tarefasHoje.length === 0 && tarefasFuturas.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Nenhuma tarefa cadastrada!";
      tarefasResumo.appendChild(li);
    }
  }


  // EVENTOS
  const eventosResumo = document.getElementById("eventosResumo");
  if (eventosResumo && calendar) {
    eventosResumo.innerHTML = "";

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // 🔥 zera hora

    const umaSemana = new Date(hoje);
    umaSemana.setDate(hoje.getDate() + 7);

    const proximosEventos = calendar.getEvents()
      .filter(e => !(e.extendedProps && e.extendedProps.isTarefa)) // 🔥 GARANTE: só eventos
      .filter(e => {
        const data = new Date(e.start);
        data.setHours(0, 0, 0, 0); // 🔥 zera hora também
        return data >= hoje && data <= umaSemana;
      })
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    if (proximosEventos.length === 0) {
      eventosResumo.innerHTML = "<li>Nenhum evento nos próximos 7 dias!</li>";
    } else {
      proximosEventos.forEach(ev => {
        const li = document.createElement("li");
        const data = new Date(ev.start);
        const diaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][data.getDay()];
        li.textContent = `${ev.title} - ${diaSemana}, ${data.toLocaleDateString()}`;
        li.style.color = ev.backgroundColor || "black";
        eventosResumo.appendChild(li);
      });
    }
  }

  // ---------- MATÉRIAS DO DIA ----------
  const materiasHojeResumo = document.getElementById("materiasHojeResumo");
  if (materiasHojeResumo) {
    materiasHojeResumo.innerHTML = "";

    // pegar cronograma novo
    const cronogramaNovo = JSON.parse(localStorage.getItem("cronogramaNovo")) || [];

    const blocosHoje = cronogramaNovo
      .filter(b => b.dia === hojeSemana)
      .sort((a, b) => a.inicio.localeCompare(b.inicio));

    if (blocosHoje.length === 0) {
      materiasHojeResumo.innerHTML = "<li>Sem matérias hoje 😊</li>";
    } else {
      blocosHoje.forEach(bloco => {
        const li = document.createElement("li");
        li.textContent = `${bloco.materia.nome} - ${bloco.inicio} às ${bloco.fim}`;
        li.style.background = bloco.materia.cor;
        li.style.color = "#fff";
        li.style.padding = "3px 5px";
        li.style.borderRadius = "4px";
        li.style.marginBottom = "3px";
        materiasHojeResumo.appendChild(li);
      });
    }
  }
}

function atualizarTudo() {
  renderizarTarefas();
  atualizarResumoInicio();
}


document.addEventListener("DOMContentLoaded", () => {
  // TELA
  mostrarTela("inicio");

  // CRONOGRAMA / MATÉRIAS
  renderMaterias();
  renderCronogramaNovo();
  renderizarResumoHoje();
  atualizarMateriaAgora();

  // SISTEMAS
  renderizarTarefas();
  renderizarRevisao();
  carregarHistorico();

  // CALENDÁRIO
  if (typeof calendar !== "undefined" && calendar) {
    atualizarEventosTarefas();
    atualizarResumoInicio();
  }

  // FINAL (atualiza tudo junto)
  atualizarTudo();
});

function renderizarResumoHoje() {
  const lista = document.getElementById("listaHojeCronograma");
  if (!lista) return;

  const hojeSemana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"][new Date().getDay()];
  const cronogramaNovo = JSON.parse(localStorage.getItem("cronogramaNovo")) || [];

  lista.innerHTML = "";

  const blocosHoje = cronogramaNovo.filter(b => b.dia === hojeSemana);

  if (blocosHoje.length === 0) {
    lista.innerHTML = "<li>Sem atividades hoje 😊</li>";
    return;
  }

  blocosHoje.forEach(bloco => {
    const li = document.createElement("li");
    li.textContent = `🕒 ${bloco.inicio} - ${bloco.fim} : ${bloco.materia.nome}`;
    lista.appendChild(li);
  });
}




// ABRIR MODAL AO CLICAR NO USERINFO
document.getElementById('userInfo').addEventListener('click', function () {
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
    reader.onload = function (e) {
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





// ---------- CRIAR MATÉRIA ----------
// ---------- VARIÁVEIS GLOBAIS ----------
let materias = [];
let cronograma = [];

// 🔥 ADICIONA ISSO AQUI
let tempoMaterias = {};
let materiaAtualAuto = null;
let materiaAnterior = null;

// ---------- CARREGAR DO LOCALSTORAGE ----------
try {
  materias = JSON.parse(localStorage.getItem("materias")) || [];
  cronograma = JSON.parse(localStorage.getItem("cronogramaNovo")) || [];
} catch (e) {
  materias = [];
  cronograma = [];
}

// ---------- SALVAR ----------
function salvarMaterias() {
  localStorage.setItem("materias", JSON.stringify(materias));
}

function salvarCronogramaNovo() {
  localStorage.setItem("cronogramaNovo", JSON.stringify(cronograma));
}

// ---------- RENDERIZAR MATÉRIAS ----------
function renderMaterias() {
  const container = document.getElementById("materiasContainer");
  if (!container) return;
  container.innerHTML = "";

  materias.forEach(m => {
    const div = document.createElement("div");
    div.classList.add("materia-bloco");
    div.style.background = m.cor;
    div.textContent = m.nome;
    div.id = m.id;
    div.draggable = true;

    div.ondragstart = (e) => e.dataTransfer.setData("id", m.id);

    // editar
    div.addEventListener("dblclick", () => {
      Swal.fire({
        title: `Editar Matéria`,
        html: `
          <input type="text" id="editNome" class="swal2-input" value="${m.nome}">
          <input type="color" id="editCor" class="swal2-input" value="${m.cor}">
        `,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Salvar",
        denyButtonText: "Excluir"
      }).then(result => {

        // ✅ EDITAR
        if (result.isConfirmed) {
          const novoNome = document.getElementById("editNome").value.trim();
          const novaCor = document.getElementById("editCor").value;

          if (!novoNome) {
            Swal.fire({ icon: 'error', title: 'Digite um nome!' });
            return;
          }

          m.nome = novoNome;
          m.cor = novaCor;

          salvarMaterias();
          renderMaterias();
          renderCronogramaNovo();
        }

        // ❌ EXCLUIR
        else if (result.isDenied) {
          materias = materias.filter(mat => mat.id !== m.id);
          cronograma = cronograma.filter(c => c.materia.id !== m.id);

          salvarMaterias();
          salvarCronogramaNovo();
          renderMaterias();
          renderCronogramaNovo();
        }
      });
    });

    // excluir (clique direito)
    div.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      Swal.fire({
        title: `Excluir ${m.nome}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
      }).then(res => {
        if (res.isConfirmed) {
          materias = materias.filter(mat => mat.id !== m.id);
          cronograma = cronograma.filter(c => c.materia.id !== m.id);

          salvarMaterias();
          salvarCronogramaNovo();
          renderMaterias();
          renderCronogramaNovo();
        }
      });
    });

    container.appendChild(div);
  });
}

// ---------- RENDERIZAR CRONOGRAMA ----------
function renderCronogramaNovo() {
  const dias = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];

  dias.forEach(dia => {
    const coluna = document.getElementById(dia);
    if (!coluna) return;
    coluna.innerHTML = `<h5>${dia.toUpperCase()}</h5><div class="dia-drop" ondragover="event.preventDefault()"></div>`;
    const dropArea = coluna.querySelector(".dia-drop");

    const blocos = cronograma.filter(b => b.dia === dia)
      .sort((a, b) => a.inicio.localeCompare(b.inicio));

    blocos.forEach(b => {
      const div = document.createElement("div");
      div.classList.add("bloco-materia");
      div.style.background = b.materia.cor;
      div.textContent = `${b.materia.nome} (${b.inicio} - ${b.fim})`;

      // editar horário ou excluir
      div.addEventListener("dblclick", () => {
        Swal.fire({
          title: `Editar ${b.materia.nome}`,
          html: `
            <input type="time" id="editInicio" class="swal2-input" value="${b.inicio}">
            <input type="time" id="editFim" class="swal2-input" value="${b.fim}">
          `,
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: "Salvar",
          denyButtonText: "Excluir"
        }).then(res => {
          if (res.isConfirmed) {
            const inicio = document.getElementById("editInicio").value;
            const fim = document.getElementById("editFim").value;
            if (!inicio || !fim || fim <= inicio) {
              Swal.fire({ icon: 'error', title: 'Horário inválido!' });
              return;
            }
            b.inicio = inicio;
            b.fim = fim;
            salvarCronogramaNovo();
            renderCronogramaNovo();
          } else if (res.isDenied) {
            cronograma = cronograma.filter(c => c.id !== b.id);
            salvarCronogramaNovo();
            renderCronogramaNovo();
          }
        });
      });

      dropArea.appendChild(div);
    });
  });
}

// ---------- DROP ----------
function drop(ev) {
  ev.preventDefault();

  const id = ev.dataTransfer.getData("id");
  const materia = materias.find(m => m.id == id);
  const dia = ev.currentTarget.id;

  if (!materia) return;

  Swal.fire({
    title: `Horário de ${materia.nome}`,
    html: `
      <input type="time" id="inicio" class="swal2-input">
      <input type="time" id="fim" class="swal2-input">
    `,
    confirmButtonText: "Salvar",
    preConfirm: () => {
      const inicio = document.getElementById("inicio").value;
      const fim = document.getElementById("fim").value;

      if (!inicio || !fim || fim <= inicio) {
        Swal.showValidationMessage("Preencha horários válidos!");
        return false;
      }

      return { inicio, fim };
    }
  }).then(result => {

    if (!result.isConfirmed) return;

    const inicio = result.value.inicio;
    const fim = result.value.fim;

    // 🚨 VERIFICAR CONFLITO DE HORÁRIO
    const conflito = cronograma.some(b =>
      b.dia === dia &&
      (
        (inicio >= b.inicio && inicio < b.fim) ||
        (fim > b.inicio && fim <= b.fim) ||
        (inicio <= b.inicio && fim >= b.fim)
      )
    );

    if (conflito) {
      Swal.fire({
        icon: "error",
        title: "Horário ocupado!",
        text: "Já existe uma matéria nesse horário."
      });
      return;
    }

    const bloco = {
      id: Date.now(),
      materia,
      dia,
      inicio,
      fim
    };

    cronograma.push(bloco);

    salvarCronogramaNovo();
    renderCronogramaNovo();
    renderizarResumoHoje();
    atualizarMateriaAgora();

  });
}


document.addEventListener("DOMContentLoaded", () => {
  const cronogramaItens = document.querySelectorAll(".bloco-materia");

  cronogramaItens.forEach(item => {
    // Duplo clique no nome da matéria
    item.addEventListener("dblclick", () => {
      const novoNome = prompt("Digite o novo nome da matéria:", item.textContent);
      if (novoNome) item.textContent = novoNome;
    });

    // Duplo clique no horário (se você tiver span ou data-horario)
    const horario = item.querySelector(".horario"); // ou criar
    if (horario) {
      horario.addEventListener("dblclick", () => {
        const novoHorario = prompt("Digite o novo horário:", horario.textContent);
        if (novoHorario) horario.textContent = novoHorario;
      });
    }
  });
});

function adicionarMateria() {
  const nome = document.getElementById("novaMateriaNome").value.trim();
  const cor = document.getElementById("novaMateriaCor").value;

  if (!nome) return Swal.fire({ icon: 'error', title: 'Digite o nome da matéria!' });

  const novaMateria = {
    id: Date.now().toString(),
    nome,
    cor
  };

  materias.push(novaMateria);
  salvarMaterias();
  renderMaterias();
}


function atualizarMateriaAgora() {

  const el = document.getElementById("materiaAgora");
  if (!el) return;

  const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const hojeSemana = dias[new Date().getDay()];

  const agora = new Date();
  const horaAtual =
    String(agora.getHours()).padStart(2, '0') + ":" +
    String(agora.getMinutes()).padStart(2, '0');

  const cronogramaNovo = JSON.parse(localStorage.getItem("cronogramaNovo")) || [];

  const blocoAtual = cronogramaNovo.find(b =>
    b.dia === hojeSemana &&
    horaAtual >= b.inicio &&
    horaAtual < b.fim
  );

  if (blocoAtual) {
  if (materiaAnterior && materiaAnterior !== blocoAtual.materia.nome) {
      alert("Matéria concluída! Deseja fazer uma pausa? 😄");
    }

    materiaAnterior = blocoAtual.materia.nome;
    el.innerHTML =
      `<span style="
        background:${blocoAtual.materia.cor};
        color:white;
        padding:6px 10px;
        border-radius:6px;
      ">
      ${blocoAtual.materia.nome}
      (${blocoAtual.inicio} - ${blocoAtual.fim})
      </span>`;

  } else {

    el.innerHTML = "😴 Descanso";

  }

  materiaAtualAuto = blocoAtual?.materia?.nome || null;

} setInterval(atualizarMateriaAgora, 60000);


/** REVISÃO INTELIGENTE */
let revisoes = [];

try {
  revisoes = JSON.parse(localStorage.getItem("revisoes")) || [];
} catch {
  revisoes = [];
}

function salvarRevisao() {
  localStorage.setItem("revisoes", JSON.stringify(revisoes));
}

function hoje() {
  return new Date().toISOString().split("T")[0];
}

// 🔥 SISTEMA DE REPETIÇÃO (1, 3, 7 dias)
function proximaRevisao(nivel) {
  const dias = [1, 3, 7];
  const data = new Date();
  data.setDate(data.getDate() + dias[nivel]);
  return data.toISOString().split("T")[0];
}

// CARD
function criarCard(revisao) {
  const card = document.createElement("div");
  card.classList.add("revisao-card");

  const info = document.createElement("div");
  info.classList.add("revisao-info");

  info.innerHTML = `
    <span>${revisao.titulo} (${revisao.data})</span>
    <small>Nível: ${revisao.nivel}</small>
  `;

  const acoes = document.createElement("div");

  // ACERTEI (avança nível)
  const btnAcerto = document.createElement("button");
  btnAcerto.textContent = "👍";
  btnAcerto.onclick = () => {
    revisao.nivel = Math.min(revisao.nivel + 1, 2);
    revisao.data = proximaRevisao(revisao.nivel);
    salvarRevisao();
    renderizarRevisao();
  };

  // ERREI (reset)
  const btnErro = document.createElement("button");
  btnErro.textContent = "👎";
  btnErro.onclick = () => {
    revisao.nivel = 0;
    revisao.data = proximaRevisao(0);
    salvarRevisao();
    renderizarRevisao();
  };

  // EXCLUIR
  const btnExcluir = document.createElement("button");
  btnExcluir.textContent = "❌";
  btnExcluir.onclick = () => {
    revisoes = revisoes.filter(r => r.id !== revisao.id);
    salvarRevisao();
    renderizarRevisao();
  };

  acoes.append(btnAcerto, btnErro, btnExcluir);

  card.append(info, acoes);
  return card;
}

// RENDERIZAR
function renderizarRevisao() {
  const lista = document.getElementById("listaRevisaoDia");
  const notas = document.getElementById("checklistNotas");
  const flash = document.getElementById("flashcardContainer");
  const resumo = document.getElementById("resumoRevisao");

  if (!lista || !notas || !flash || !resumo) return;

  lista.innerHTML = "";
  notas.innerHTML = "";
  flash.innerHTML = "";

  const hojeData = hoje();

  revisoes.forEach(r => {
    if (r.data !== hojeData) return;

    let container;

    if (r.tipo === "nota") container = notas;
    else if (r.tipo === "flashcard") container = flash;
    else container = lista;

    container.appendChild(criarCard(r));
  });

  // 📊 PROGRESSO
  const total = revisoes.length;
  const feitas = revisoes.filter(r => r.nivel > 0).length;

  resumo.textContent = `Progresso: ${feitas}/${total} revisões avançadas`;
}

function adicionarRevisao() {
  Swal.fire({
    title: 'Nova Revisão',
    html: `
      <input id="titulo" class="swal2-input" placeholder="Ex: Função do 2º grau">
      
      <select id="tipo" class="swal2-input">
        <option value="nota">📒 Nota</option>
        <option value="flashcard">🧠 Flashcard</option>
        <option value="geral">📌 Geral</option>
      </select>

      <input type="date" id="data" class="swal2-input">
    `,
    confirmButtonText: 'Criar',
    showCancelButton: true
  }).then(res => {
    if (!res.isConfirmed) return;

    const titulo = document.getElementById("titulo").value.trim();
    const tipo = document.getElementById("tipo").value;
    const data = document.getElementById("data").value || hoje();

    if (!titulo) {
      Swal.fire("Erro", "Digite um título!", "error");
      return;
    }

    revisoes.push({
      id: Date.now(),
      titulo,
      tipo,
      data,
      nivel: 0
    });

    salvarRevisao();
    renderizarRevisao();
  });
}

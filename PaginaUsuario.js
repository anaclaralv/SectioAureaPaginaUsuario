// ===== FUNÇÕES GLOBAIS PARA ANEXOS =====
window.removerAnexo = function (index) {
  if (typeof anexosTemp !== 'undefined') {
    anexosTemp.splice(index, 1);
    if (typeof renderizarPreviews === 'function') {
      renderizarPreviews();
    }
  }
};

window.abrirLightbox = function (src) {
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.onclick = (e) => {
    if (e.target === lightbox || e.target.classList.contains('btn-fechar-lightbox')) {
      lightbox.remove();
    }
  };
  lightbox.innerHTML = `
    <button class="btn-fechar-lightbox" onclick="this.closest('.lightbox').remove()">✕</button>
    <img src="${src}" alt="Visualização">
  `;
  document.body.appendChild(lightbox);
};

function mostrarTela(tela) {
  const telas = [
    "inicio", "tarefas", "notas", "calendario", "relogio",
    "estatistica", "cronogramaNovo", "metodos", "revisao"
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
    calendar.updateSize();  // ← SEM setTimeout!
  }
  if (tela === "cronogramaNovo") {
    renderCronogramaNovo();
  }
  if (tela === "estatistica") {
    carregarEstatisticas();  // ← SEM setTimeout!
  }
  // funções específicas
  if (tela === "relogio") {
    renderTabelaMaterias();
  }
}

// CONEXÃO COM EFEITO
document.addEventListener('DOMContentLoaded', function () {
  const params = new URLSearchParams(window.location.search);
  const tipoInteligencia = params.get('tipo');

  if (tipoInteligencia) {
    aplicarTemaInteligencia(tipoInteligencia);
  } else {
    const tipoSalvo = localStorage.getItem('inteligenciaUsuario');
    if (tipoSalvo) {
      aplicarTemaInteligencia(tipoSalvo);
    }
  }
});

function aplicarTemaInteligencia(tipo) {
  const cores = {
    linguistica: "#9f042c",   // Vermelho
    logico: "#ffbd59",        // Amarelo/Laranja
    musical: "#8a03d2",       // Roxo
    corporal: "#00bf63",      // Verde
    espacial: "#d203a4",      // Rosa
    interpessoal: "#ff5f00",  // Laranja
    intrapessoal: "#5170ff"   // Azul
  };

  const corPrimaria = cores[tipo] || "#6c757d";

  // Atualiza a variável CSS
  document.documentElement.style.setProperty('--cor-primaria', corPrimaria);

  // Atualiza elementos que não usam variáveis CSS
  document.querySelectorAll('.user-avatar, .foto-usuario-container img').forEach(el => {
    el.style.borderColor = corPrimaria;
  });

  // Salva no localStorage
  localStorage.setItem('inteligenciaUsuario', tipo);
  localStorage.setItem('corPrimaria', corPrimaria);
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
    Swal.fire({
      icon: "warning",
      title: "Campos incompletos",
      text: "Preencha todos os campos!"
    });
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
let filtroPrioridadeAtual = "todas";

function renderizarTarefas() {
  const hojeLista = document.getElementById("tarefasHoje");
  const futurasLista = document.getElementById("tarefasFuturas");
  if (!hojeLista || !futurasLista) return;

  hojeLista.innerHTML = "";
  futurasLista.innerHTML = "";

  const hoje = hojeFormatado();
  const prioridadeOrdem = { alta: 3, media: 2, baixa: 1 };

  // Aplicar filtro de prioridade
  let tarefasFiltradas = [...tarefas];
  if (filtroPrioridadeAtual !== "todas") {
    tarefasFiltradas = tarefasFiltradas.filter(t => t.prioridade === filtroPrioridadeAtual);
  }

  function criarCard(tarefa) {
    const card = document.createElement("div");
    card.classList.add("tarefa-card");
    if (tarefa.concluida) card.classList.add("concluida");

    const info = document.createElement("div");
    info.classList.add("tarefa-info");
    const spanTitulo = document.createElement("span");
    spanTitulo.className = "tarefa-titulo";
    spanTitulo.textContent = `${tarefa.titulo} (${tarefa.data})`;
    const badge = document.createElement("span");
    badge.classList.add("tarefa-prioridade", `tarefa-${tarefa.prioridade}`);
    badge.textContent = tarefa.prioridade.toUpperCase();
    info.appendChild(spanTitulo);
    info.appendChild(badge);

    const btnConcluir = document.createElement("button");
    btnConcluir.classList.add("btn-concluir");
    btnConcluir.textContent = tarefa.concluida ? " ↩ " : " ✔ ";
    btnConcluir.onclick = () => {
      tarefa.concluida = !tarefa.concluida;
      salvarTarefas();
      renderizarTarefas();
      atualizarResumoInicio();
      atualizarEventosTarefas();
    };

    const btnEditar = document.createElement("button");
    btnEditar.classList.add("btn-editar");
    btnEditar.textContent = " ✏️ ";
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
    btnExcluir.textContent = " ❌ ";
    btnExcluir.onclick = () => {
      tarefas = tarefas.filter(t => t.id !== tarefa.id);
      salvarTarefas();
      renderizarTarefas();
      atualizarResumoInicio();
      atualizarEventosTarefas();
    };

    card.appendChild(info);
    card.appendChild(btnConcluir);
    card.appendChild(btnEditar);
    card.appendChild(btnExcluir);
    return card;
  }

  const tarefasHoje = tarefasFiltradas.filter(t => t.data === hoje)
    .sort((a, b) => prioridadeOrdem[b.prioridade] - prioridadeOrdem[a.prioridade]);
  const tarefasFuturas = tarefasFiltradas.filter(t => t.data > hoje)
    .sort((a, b) => prioridadeOrdem[b.prioridade] - prioridadeOrdem[a.prioridade]);

  if (tarefasHoje.length === 0) hojeLista.innerHTML = "<p>Nenhuma tarefa cadastrada hoje!</p>";
  else tarefasHoje.forEach(t => hojeLista.appendChild(criarCard(t)));

  if (tarefasFuturas.length === 0) futurasLista.innerHTML = "<p>Nenhuma tarefa futura cadastrada!</p>";
  else tarefasFuturas.forEach(t => futurasLista.appendChild(criarCard(t)));
}

// Configurar os botões de filtro
function configurarFiltroPrioridade() {
  const botoes = document.querySelectorAll('.btn-filtro-prioridade');
  botoes.forEach(btn => {
    btn.addEventListener('click', () => {
      botoes.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filtroPrioridadeAtual = btn.dataset.prioridade;
      renderizarTarefas();
    });
  });
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
  if (prioridade === "media") return "#f5d60b";  // laranja
  if (prioridade === "baixa") return "#22c55e";  // verde
  return "#6b7280";
}
// garante que os botões onclick encontrem as funções
window.adicionarTarefa = adicionarTarefa;
window.toggle = toggle;
// ---------- CALENDÁRIO ----------
let calendar;
let isUpdating = false;
let updateTimeout = null;

function adicionarEvento() {
  if (!calendar) return;

  const titulo = document.getElementById("tituloEvento").value.trim();
  const data = document.getElementById("dataEvento").value;
  const cor = document.getElementById("corEvento").value;
  const tipo = document.getElementById("tipoEvento").value;
  const recorrencia = document.getElementById("recorrenciaEvento").value;

  // Validação com SweetAlert2
  if (!titulo || !data) {
    Swal.fire({
      icon: 'warning',
      title: 'Campos incompletos',
      text: 'Por favor, preencha o título e a data do evento!',
      confirmButtonText: 'Entendi',
      confirmButtonColor: '#9f042c',
      iconColor: '#f59e0b',
      background: '#fff',
      borderRadius: '20px',
      padding: '1.5rem'
    });
    return;
  }

  // Adicionar evento principal
  calendar.addEvent({
    title: titulo,
    start: data,
    backgroundColor: cor,
    borderColor: cor,
    extendedProps: { isTarefa: false, tipo: tipo, recorrencia: recorrencia }
  });

  // Adicionar eventos recorrentes
  if (recorrencia !== "nenhuma") {
    const dataInicio = new Date(data + 'T12:00:00'); // Evita problema de fuso
    let maxIteracoes = 0;

    if (recorrencia === "diaria") maxIteracoes = 30;
    else if (recorrencia === "semanal") maxIteracoes = 12;
    else if (recorrencia === "mensal") maxIteracoes = 6;

    for (let i = 1; i <= maxIteracoes; i++) {
      const novaData = new Date(dataInicio);

      if (recorrencia === "diaria") {
        novaData.setDate(dataInicio.getDate() + i);
      } else if (recorrencia === "semanal") {
        novaData.setDate(dataInicio.getDate() + (i * 7));
      } else if (recorrencia === "mensal") {
        novaData.setMonth(dataInicio.getMonth() + i);
      }

      calendar.addEvent({
        title: titulo,
        start: novaData.toISOString().split('T')[0],
        backgroundColor: cor,
        borderColor: cor,
        extendedProps: { isTarefa: false, tipo: tipo, recorrencia: recorrencia, isRecorrente: true }
      });
    }
  }

  calendar.render();
  salvarEventos();
  atualizarResumoInicio();

  // Limpar formulário
  document.getElementById("tituloEvento").value = "";
  document.getElementById("dataEvento").value = "";
  document.getElementById("corEvento").value = "#3788d8";
  document.getElementById("recorrenciaEvento").value = "nenhuma";

  // Feedback de sucesso
  Swal.fire({
    icon: 'success',
    title: 'Evento adicionado!',
    text: `"${titulo}" foi agendado com sucesso!`,
    timer: 1500,
    showConfirmButton: false,
    position: 'top-end',
    toast: true,
    iconColor: '#22c55e'
  });
}

function salvarEventos() {
  if (isUpdating || !calendar) return;

  console.log('💾 salvarEventos foi chamada!'); // ← ADICIONE

  try {
    const eventos = calendar.getEvents();
    console.log('📊 Total de eventos no calendário:', eventos.length); // ← ADICIONE

    const eventosParaSalvar = eventos.map(ev => ({
      title: ev.title,
      start: ev.startStr,
      backgroundColor: ev.backgroundColor,
      extendedProps: ev.extendedProps
    }));

    console.log('💿 Salvando no localStorage:', eventosParaSalvar.length, 'eventos'); // ← ADICIONE
    localStorage.setItem("eventosCalendario", JSON.stringify(eventosParaSalvar));
  } catch (error) {
    console.error("Erro ao salvar eventos:", error);
  }
}

// ADICIONE esta nova função logo abaixo:
function atualizarAposMudancaCalendario() {
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }

  updateTimeout = setTimeout(() => {
    salvarEventos();
    atualizarResumoInicio();
    updateTimeout = null;
  }, 200);
}

// Carregar eventos do localStorage
function carregarEventos() {
  const eventosSalvos = JSON.parse(localStorage.getItem("eventosCalendario")) || [];
  const tarefasLS = JSON.parse(localStorage.getItem("tarefas")) || [];

  // Mapeia apenas tarefas não concluídas com flag EXPLÍCITA
  const eventosTarefas = tarefasLS
    .filter(t => t.data && !t.concluida)
    .map(t => ({
      title: `${t.titulo} - ${t.prioridade.toUpperCase()}`,
      start: t.data,
      backgroundColor: corPrioridade(t.prioridade),
      borderColor: corPrioridade(t.prioridade),
      extendedProps: {
        isTarefa: true,
        tarefaId: t.id
      }
    }));

  // Remover duplicações
  const todosEventos = [...eventosSalvos, ...eventosTarefas];
  const eventosUnicos = [];
  const ids = new Set();

  todosEventos.forEach(ev => {
    const id = ev.extendedProps?.tarefaId || ev.title + ev.start;
    if (!ids.has(id)) {
      ids.add(id);
      eventosUnicos.push(ev);
    }
  });

  return eventosUnicos;
}

function atualizarEventosTarefas() {
  if (!calendar) return;

  isUpdating = true;
  // Remove todos os eventos
  try {
    // Remove apenas eventos de tarefas
    calendar.getEvents()
      .filter(ev => ev.extendedProps?.isTarefa === true)
      .forEach(ev => ev.remove());

    const tarefasLS = JSON.parse(localStorage.getItem("tarefas")) || [];
    tarefasLS
      .filter(t => t.data && !t.concluida)
      .forEach(t => {
        calendar.addEvent({
          title: `📋 ${t.titulo}`,
          start: t.data,
          backgroundColor: corPrioridade(t.prioridade),
          borderColor: corPrioridade(t.prioridade),
          textColor: '#ffffff',
          extendedProps: {
            isTarefa: true,
            tarefaId: t.id
          }
        });
      });
  } catch (error) {
    console.error("Erro ao atualizar tarefas:", error);
  } finally {
    isUpdating = false;
  }
}

// Inicialização do calendário
document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendario');
  if (!calendarEl) return;

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    lazyFetching: true,
    progressiveEventRendering: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    editable: true,
    selectable: true,
    eventDrop: function (info) {
      const event = info.event;
      const novaData = event.startStr;
      const titulo = event.title;
      const cor = event.backgroundColor;
      const props = event.extendedProps;

      console.log('🎯 Movendo evento:', titulo, 'para', novaData);

      // Atualiza tarefa se necessário
      if (props?.isTarefa) {
        const tarefaId = props.tarefaId;
        const tarefa = tarefas.find(t => t.id === tarefaId);
        if (tarefa) {
          tarefa.data = novaData;
          salvarTarefas();
        }
      }

      // 🔥 SOLUÇÃO RADICAL: Remove o evento antigo
      event.remove();

      // 🔥 Recria o evento na nova data
      calendar.addEvent({
        title: titulo,
        start: novaData,
        backgroundColor: cor,
        borderColor: cor,
        extendedProps: props
      });

      // Salva e atualiza
      salvarEventos();
      atualizarResumoInicio();

      // Feedback
      const dataFormatada = novaData.split('-').reverse().join('/');
      Swal.fire({
        icon: 'success',
        title: 'Movido!',
        text: `Nova data: ${dataFormatada}`,
        timer: 800,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
      });

      console.log('✅ Evento recriado na nova data!');
    },

    eventResize: function (info) {
      salvarEventos();
      atualizarResumoInicio();

      Swal.fire({
        icon: 'success',
        title: 'Duração alterada!',
        timer: 800,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
      });
    },

    eventClick: function (info) {
      const event = info.event;
      const isRecorrente = event.extendedProps?.recorrencia && event.extendedProps.recorrencia !== "nenhuma";

      if (event.extendedProps?.isTarefa === true) {
        const tarefaId = event.extendedProps.tarefaId;
        const tarefa = tarefas.find(t => t.id === tarefaId);

        if (!tarefa) {
          event.remove();
          salvarEventos();
          return;
        }

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
              atualizarEventosTarefas();
              atualizarResumoInicio();
              renderizarTarefas();

              Swal.fire({
                icon: 'success',
                title: 'Tarefa atualizada!',
                timer: 1000,
                showConfirmButton: false
              });
            }
          } else if (result.isDenied) {
            tarefas = tarefas.filter(t => t.id !== tarefa.id);
            salvarTarefas();
            atualizarEventosTarefas();
            atualizarResumoInicio();
            renderizarTarefas();

            Swal.fire({
              icon: 'success',
              title: 'Tarefa excluída!',
              timer: 1000,
              showConfirmButton: false
            });
          }
        });

      } else if (isRecorrente) {
        Swal.fire({
          title: 'Excluir evento recorrente',
          text: `"${event.title}" se repete ${event.extendedProps.recorrencia}`,
          icon: 'warning',
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: 'Apenas este dia',
          denyButtonText: 'Todas repetições',
          cancelButtonText: 'Cancelar'
        }).then(result => {
          if (result.isConfirmed) {
            event.remove();
            salvarEventos();
            atualizarResumoInicio();
          } else if (result.isDenied) {
            const eventosParaRemover = calendar.getEvents().filter(e =>
              e.title === event.title &&
              e.extendedProps?.recorrencia === event.extendedProps?.recorrencia
            );
            eventosParaRemover.forEach(e => e.remove());
            salvarEventos();
            atualizarResumoInicio();
          }
        });

      } else {
        // Evento normal
        Swal.fire({
          title: 'Editar evento',
          html: `
    <input type="text" id="editTitulo" class="swal2-input" value="${event.title.replace(/"/g, '&quot;')}" placeholder="Título">
    <input type="date" id="editData" class="swal2-input" value="${event.startStr}">
    <input type="color" id="editCor" class="swal2-input" value="${event.backgroundColor || '#3788d8'}" style="width: 100%; height: 45px; padding: 5px; border-radius: 8px; cursor: pointer;">
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

            if (!novoTitulo || !novaData) {
              Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Por favor, preencha o título e a data!',
                confirmButtonColor: '#9f042c'
              });
              return;
            }
            const eventoAntigo = event;
            const props = eventoAntigo.extendedProps;
            eventoAntigo.remove();
            event.setProp('title', novoTitulo);
            event.setStart(novaData);
            event.setProp('backgroundColor', novaCor);
            event.setProp('borderColor', novaCor);
            calendar.addEvent({
              title: novoTitulo,
              start: novaData,
              backgroundColor: novaCor,
              borderColor: novaCor,
              extendedProps: props
            });
            calendar.render();
            salvarEventos();
            atualizarResumoInicio();
            calendar.refetchEvents();

            Swal.fire({
              icon: 'success',
              title: 'Evento atualizado!',
              timer: 1200,
              showConfirmButton: false,
              position: 'top-end',
              toast: true
            });
          } else if (result.isDenied) {
            // Excluir evento
            Swal.fire({
              title: 'Confirmar exclusão',
              text: 'Tem certeza que deseja excluir este evento?',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Sim, excluir',
              cancelButtonText: 'Cancelar',
              confirmButtonColor: '#dc3545'
            }).then(confirmResult => {
              if (confirmResult.isConfirmed) {
                event.remove();
                calendar.render();
                salvarEventos();
                atualizarResumoInicio();

                Swal.fire({
                  icon: 'success',
                  title: 'Evento excluído!',
                  timer: 1200,
                  showConfirmButton: false,
                  position: 'top-end',
                  toast: true
                });
              }
            });
          }
        });
      }
    },
    events: carregarEventos()
  });

  calendar.render();

  setTimeout(() => {
    atualizarEventosTarefas();
    atualizarResumoInicio();
  }, 100);
});

// Expor funções globalmente
window.adicionarEvento = adicionarEvento;

// NOTAS
document.addEventListener("DOMContentLoaded", () => {
  let notas = JSON.parse(localStorage.getItem("notas")) || [];

  // Garantir que todas as notas tenham ID
  notas = notas.map(nota => {
    if (!nota.id) {
      nota.id = 'nota_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    return nota;
  });

  let notaAtual = null;
  const notasContainer = document.getElementById("notasContainer");
  const searchInput = document.getElementById("search");
  const notaModal = new bootstrap.Modal(document.getElementById("notaModal"));

  function salvarNotas() {
    localStorage.setItem("notas", JSON.stringify(notas));
  }

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
      .forEach((nota) => {
        // Garantir ID
        if (!nota.id) {
          nota.id = 'nota_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        const totalItens = nota.checklist?.length || 0;
        const itensConcluidos = nota.checklist?.filter(c => c.checked).length || 0;
        const pendentes = totalItens - itensConcluidos;

        let checklistStats = "";
        if (totalItens > 0) {
          const statsClass = pendentes === 0 ? "concluido" : "pendente";
          const statsIcon = pendentes === 0 ? "✅" : "📋";
          checklistStats = `<div class="checklist-stats ${statsClass}">${statsIcon} ${itensConcluidos}/${totalItens} itens ${pendentes === 0 ? 'concluídos' : 'pendentes'}</div>`;
        }

        const card = document.createElement("div");
        card.className = "col-md-4";
        card.dataset.notaId = nota.id;

        card.innerHTML = `
          <div class="card-nota" style="background-color:${nota.cor}; color:${nota.corTexto || '#000000'}; padding:10px; border-radius:5px;">
            <i class="fa fa-star estrela ${nota.favorito ? 'favorito' : ''}" data-nota-id="${nota.id}" style="cursor:pointer;"></i>
            <h5>${nota.titulo}</h5>
            <small>${nota.dataCriacao || ""}</small>
            ${checklistStats}
            <div class="card-conteudo">
              ${nota.texto.replace(/<[^>]+>/g, "").slice(0, 100)}
              <div class="checklist-card">
                ${nota.checklist.map((c, i) => `
                  <div class="check-item ${c.checked ? 'completed' : ''}" data-check-index="${i}" data-nota-id="${nota.id}">
                    <input type="checkbox" ${c.checked ? 'checked' : ''}>
                    <span>${c.texto}</span>
                    <button class="btn-excluir-check" style="border:none; background:none; cursor:pointer;">✕</button>
                  </div>
                `).join("")}
              </div>
            </div>
            ${renderizarIndicadorAnexos(nota.anexos)}
            ${renderizarAnexosCard(nota.anexos)}
            <div class="mt-2">
              <button class="btn btn-sm btn-warning btn-editar" data-nota-id="${nota.id}">Editar</button>
              <button class="btn btn-sm btn-danger btn-excluir" data-nota-id="${nota.id}">Excluir</button>
            </div>
          </div>
        `;
        notasContainer.appendChild(card);
      });

    // ===== EVENT LISTENERS (USANDO IDs) =====

    // Checkbox do checklist
    document.querySelectorAll(".check-item input").forEach(input => {
      input.addEventListener("change", (e) => {
        const div = e.target.closest('.check-item');
        const notaId = div.dataset.notaId;
        const checkIndex = parseInt(div.dataset.checkIndex);

        const nota = notas.find(n => n.id === notaId);
        if (nota && nota.checklist[checkIndex]) {
          nota.checklist[checkIndex].checked = e.target.checked;
          salvarNotas();
          renderNotas();
        }
      });
    });

    // Botão excluir item do checklist
    document.querySelectorAll(".btn-excluir-check").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const div = e.target.closest('.check-item');
        const notaId = div.dataset.notaId;
        const checkIndex = parseInt(div.dataset.checkIndex);

        const nota = notas.find(n => n.id === notaId);
        if (nota) {
          nota.checklist.splice(checkIndex, 1);
          salvarNotas();
          renderNotas();
        }
      });
    });

    // Estrela (favorito)
    document.querySelectorAll(".estrela").forEach(estrela => {
      estrela.addEventListener("click", (e) => {
        e.stopPropagation();
        const notaId = e.target.dataset.notaId;
        const nota = notas.find(n => n.id === notaId);
        if (nota) {
          nota.favorito = !nota.favorito;
          salvarNotas();
          renderNotas();
        }
      });
    });

    // Botão Editar
    document.querySelectorAll(".btn-editar").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const notaId = e.target.dataset.notaId;
        const nota = notas.find(n => n.id === notaId);
        const index = notas.findIndex(n => n.id === notaId);
        if (nota) {
          abrirModal(nota, index);
        }
      });
    });

    // Botão Excluir
    document.querySelectorAll(".btn-excluir").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const notaId = e.target.dataset.notaId;
        const nota = notas.find(n => n.id === notaId);

        if (nota) {
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
              notas = notas.filter(n => n.id !== notaId);
              salvarNotas();
              renderNotas();
              Swal.fire('Excluída!', '', 'success');
            }
          });
        }
      });
    });
  }

  // ===== FUNÇÕES AUXILIARES (mantidas como estavam) =====

  function atualizarContadorCaracteres() {
    const textoDiv = document.getElementById("notaTexto");
    const contadorSpan = document.getElementById("contadorTexto");
    if (!textoDiv || !contadorSpan) return;
    const texto = textoDiv.innerText || textoDiv.textContent || "";
    const caracteres = texto.length;
    contadorSpan.textContent = caracteres;
    const contadorDiv = document.querySelector(".contador-caracteres");
    if (caracteres > 5000) {
      contadorDiv?.classList.add("alerta");
    } else {
      contadorDiv?.classList.remove("alerta");
    }
  }

  function iniciarMonitoramentoTexto() {
    const textoDiv = document.getElementById("notaTexto");
    if (!textoDiv) return;
    textoDiv.addEventListener("input", atualizarContadorCaracteres);
    textoDiv.addEventListener("keyup", atualizarContadorCaracteres);
    const observer = new MutationObserver(() => atualizarContadorCaracteres());
    observer.observe(textoDiv, { childList: true, subtree: true, characterData: true });
  }

  function renderizarPreviews() {
    const container = document.getElementById("previewAnexos");
    if (!container) return;
    if (anexosTemp.length === 0) {
      container.innerHTML = '<p style="color: #9ca3af; font-size: 0.85rem; width: 100%;">Nenhuma imagem anexada</p>';
      return;
    }
    container.innerHTML = anexosTemp.map((anexo, index) => `
      <div class="anexo-thumb" onclick="abrirLightbox('${anexo.data}')">
        <img src="${anexo.data}" alt="Anexo ${index + 1}">
        <button class="btn-remover-anexo" onclick="event.stopPropagation(); removerAnexo(${index})">✕</button>
      </div>
    `).join('');
  }

  function processarImagens(files) {
    if (!files || files.length === 0) return;
    let processadas = 0;
    const total = files.length;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        processadas++;
        if (processadas === total && total > 0) {
          Swal.fire({ icon: 'warning', title: 'Apenas imagens são permitidas!', timer: 1500 });
        }
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: 'warning', title: 'Imagem muito grande!', text: 'Máximo 5MB por imagem.', timer: 2000 });
        processadas++;
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        anexosTemp.push({
          nome: file.name,
          data: e.target.result,
          tipo: file.type,
          tamanho: file.size
        });
        processadas++;
        if (processadas === total) {
          renderizarPreviews();
        }
      };
      reader.readAsDataURL(file);
    });
  }

  window.removerAnexo = function (index) {
    anexosTemp.splice(index, 1);
    renderizarPreviews();
  };

  window.abrirLightbox = function (src) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.onclick = (e) => {
      if (e.target === lightbox || e.target.classList.contains('btn-fechar-lightbox')) {
        lightbox.remove();
      }
    };
    lightbox.innerHTML = `
      <button class="btn-fechar-lightbox" onclick="this.closest('.lightbox').remove()">✕</button>
      <img src="${src}" alt="Visualização">
    `;
    document.body.appendChild(lightbox);
  };

  function renderizarAnexosCard(anexos) {
    if (!anexos || anexos.length === 0) return '';
    if (anexos.length === 1) {
      return `
        <div class="anexos-card">
          <div class="anexo-mini" onclick="abrirLightbox('${anexos[0].data}')">
            <img src="${anexos[0].data}" alt="Anexo">
          </div>
        </div>
      `;
    }
    const miniaturas = anexos.slice(0, 3).map((a, i) => `
      <div class="anexo-mini" onclick="abrirLightbox('${a.data}')">
        <img src="${a.data}" alt="Anexo ${i + 1}">
      </div>
    `).join('');
    const extras = anexos.length > 3 ? `<span style="font-size: 0.75rem; color: #6b7280;">+${anexos.length - 3}</span>` : '';
    return `
      <div class="anexos-card">
        ${miniaturas}
        ${extras}
      </div>
    `;
  }

  function renderizarIndicadorAnexos(anexos) {
    if (!anexos || anexos.length === 0) return '';
    return `
      <div class="anexo-indicador">
        <i class="bi bi-image"></i>
        <span>${anexos.length} anexo${anexos.length > 1 ? 's' : ''}</span>
      </div>
    `;
  }

  function abrirModal(nota = null, idx = null) {
    notaAtual = idx;
    document.getElementById("notaTitulo").value = nota?.titulo || "";
    document.getElementById("notaTexto").innerHTML = nota?.texto || "";
    document.getElementById("notaCor").value = nota?.cor || "#ffffff";
    document.getElementById("notaCorTexto").value = nota?.corTexto || "#000000";
    const checklist = nota?.checklist ? [...nota.checklist] : [];
    renderChecklist(checklist);
    anexosTemp = nota?.anexos ? [...nota.anexos] : [];
    renderizarPreviews();
    notaModal.show();
    atualizarContadorCaracteres();
  }

  function renderChecklist(items) {
    const container = document.getElementById("checklistContainer");
    if (!container) return;
    container.innerHTML = "";
    if (!Array.isArray(items)) items = [];
    items.forEach((item, i) => {
      const div = document.createElement("div");
      div.className = "check-item" + (item.checked ? " completed" : "");
      div.style.display = "flex";
      div.style.alignItems = "center";
      div.style.marginBottom = "5px";
      div.innerHTML = `
        <input type="checkbox" ${item.checked ? 'checked' : ''} style="margin-right:5px;">
        <input type="text" class="form-control form-control-sm" value="${item.texto || ''}" style="flex:1; margin-right:5px;">
        <button class="btn-excluir-check" style="border:none; background:none; cursor:pointer;" type="button">✕</button>
      `;
      const checkbox = div.querySelector('input[type="checkbox"]');
      const textoInput = div.querySelector('input[type="text"]');
      const btnExcluir = div.querySelector('.btn-excluir-check');
      checkbox.addEventListener('change', () => {
        item.checked = checkbox.checked;
        div.classList.toggle('completed', item.checked);
      });
      textoInput.addEventListener('input', () => {
        item.texto = textoInput.value;
      });
      btnExcluir.addEventListener('click', () => {
        items.splice(i, 1);
        renderChecklist(items);
      });
      container.appendChild(div);
    });
  }

  // ===== INICIALIZAÇÃO =====
  document.getElementById("addCheck").addEventListener("click", () => {
    const container = document.getElementById("checklistContainer");
    const items = [];
    container.querySelectorAll('.check-item').forEach(item => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      const textoInput = item.querySelector('input[type="text"]');
      if (textoInput) {
        items.push({
          texto: textoInput.value,
          checked: checkbox ? checkbox.checked : false
        });
      }
    });
    items.push({ texto: "", checked: false });
    renderChecklist(items);
  });

  document.getElementById("btnSalvar").addEventListener("click", () => {
    const titulo = document.getElementById("notaTitulo").value;
    const texto = document.getElementById("notaTexto").innerHTML;
    const cor = document.getElementById("notaCor").value;
    const corTexto = document.getElementById("notaCorTexto").value;
    const checklist = [];
    const container = document.getElementById("checklistContainer");
    if (container) {
      container.querySelectorAll('.check-item').forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const textoInput = item.querySelector('input[type="text"]');
        if (textoInput) {
          checklist.push({
            texto: textoInput.value || "",
            checked: checkbox ? checkbox.checked : false
          });
        }
      });
    }

    // Garantir ID para nova nota
    const novoId = 'nota_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const novaNota = {
      id: (notaAtual !== null && notas[notaAtual]) ? notas[notaAtual].id : novoId,
      titulo,
      texto,
      cor,
      corTexto,
      checklist: checklist,
      anexos: [...anexosTemp],
      favorito: notaAtual !== null && notas[notaAtual] ? notas[notaAtual].favorito : false,
      dataCriacao: notaAtual !== null && notas[notaAtual]
        ? notas[notaAtual].dataCriacao
        : new Date().toLocaleString()
    };

    if (notaAtual !== null && notas[notaAtual]) {
      notas[notaAtual] = novaNota;
    } else {
      notas.push(novaNota);
    }

    salvarNotas();
    anexosTemp = [];
    notaModal.hide();
    renderNotas();
    Swal.fire({ icon: 'success', title: 'Nota salva!', timer: 1500, showConfirmButton: false });
  });

  document.getElementById("btnNova").addEventListener("click", () => abrirModal());
  searchInput.addEventListener("input", renderNotas);

  renderNotas();
  iniciarMonitoramentoTexto();
  setupNotaTextFormatting();

  const anexoInput = document.getElementById('notaAnexos');
  if (anexoInput) {
    anexoInput.addEventListener('change', (e) => {
      processarImagens(e.target.files);
      anexoInput.value = '';
    });
  }

  const anexosArea = document.querySelector('.anexos-area');
  if (anexosArea) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      anexosArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
    anexosArea.addEventListener('dragover', () => {
      anexosArea.style.background = '#fef2f2';
      anexosArea.style.borderColor = 'var(--cor-primaria)';
    });
    anexosArea.addEventListener('dragleave', () => {
      anexosArea.style.background = '#fafafa';
      anexosArea.style.borderColor = '#ccc';
    });
    anexosArea.addEventListener('drop', (e) => {
      anexosArea.style.background = '#fafafa';
      anexosArea.style.borderColor = '#ccc';
      const files = e.dataTransfer.files;
      processarImagens(files);
    });
  }
});
function atualizarResumoInicio() {
  const hoje = hojeFormatado();
  const hojeSemana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"][new Date().getDay()];
  const hojeDate = new Date(hoje);
  const limiteDate = new Date(hojeDate);
  limiteDate.setDate(hojeDate.getDate() + 7);
  const limite = limiteDate.toISOString().split('T')[0];

  const tarefasResumo = document.getElementById("tarefasResumo");
  if (tarefasResumo) {
    tarefasResumo.innerHTML = "";
    const tarefasHoje = tarefas.filter(t => t.data === hoje);
    const tarefasFuturas = tarefas.filter(t => t.data > hoje && t.data <= limite);

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
    hoje.setHours(0, 0, 0, 0);
    const umaSemana = new Date(hoje);
    umaSemana.setDate(hoje.getDate() + 7);

    const proximosEventos = calendar.getEvents()
      .filter(e => {
        // 👈 VERIFICAÇÃO MAIS ROBUSTA
        const isTarefa = e.extendedProps?.isTarefa === true;
        return !isTarefa;  // Só mostra se NÃO for tarefa
      })
      .filter(e => {
        const data = new Date(e.start);
        data.setHours(0, 0, 0, 0);
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
  // pegar cronograma novo
  const cronogramaNovo = JSON.parse(localStorage.getItem("cronogramaNovo")) || [];
  const blocosHoje = cronogramaNovo
    .filter(b => b.dia === hojeSemana)
    .sort((a, b) => a.inicio.localeCompare(b.inicio));

  // Usar o elemento que realmente existe no HTML
  const listaHojeCronograma = document.getElementById("listaHojeCronograma");
  if (listaHojeCronograma) {
    listaHojeCronograma.innerHTML = "";
    if (blocosHoje.length === 0) {
      listaHojeCronograma.innerHTML = "<li>Sem matérias hoje 😊</li>";
    } else {
      blocosHoje.forEach(bloco => {
        const li = document.createElement("li");
        li.textContent = `${bloco.materia.nome} - ${bloco.inicio} às ${bloco.fim}`;
        li.style.background = bloco.materia.cor;
        li.style.color = "#fff";
        li.style.padding = "3px 5px";
        li.style.borderRadius = "4px";
        li.style.marginBottom = "3px";
        listaHojeCronograma.appendChild(li);
      });
    }
  }
}

function atualizarTudo() {
  renderizarTarefas();
  atualizarResumoInicio();
  atualizarEventosTarefas();
}

// No final do arquivo PaginaUsuario.js, após TODAS as funções
document.addEventListener("DOMContentLoaded", () => {
  configurarFiltroPrioridade();
  migrarDadosAntigos();
  mostrarTela("inicio");
  renderMaterias();
  renderCronogramaNovo();
  renderizarResumoHoje();
  atualizarMateriaAgora();
  renderizarTarefas();
  initRevisao();
  renderizarFlashcards();
  carregarMetas();
  if (typeof calendar !== "undefined" && calendar) {
    atualizarEventosTarefas();
    atualizarResumoInicio();
  }
  atualizarTudo();
  closeSidebarOnLinkClick();

  const fotoSalva = localStorage.getItem("userFoto");
  if (fotoSalva) {
    const sidebarFoto = document.getElementById('sidebarFoto');
    const previewFoto = document.getElementById('previewFoto');
    if (sidebarFoto) sidebarFoto.src = fotoSalva;
    if (previewFoto) previewFoto.src = fotoSalva;
  }
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

  // CORREÇÃO: Verifica se o usuário selecionou uma nova foto
  if (novaFotoInput.files && novaFotoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      // Atualiza a foto da sidebar E do preview
      const sidebarFoto = document.getElementById('sidebarFoto');
      const previewFoto = document.getElementById('previewFoto');

      if (sidebarFoto) sidebarFoto.src = e.target.result;
      if (previewFoto) previewFoto.src = e.target.result;

      // Salva a foto no localStorage para persistir
      localStorage.setItem("userFoto", e.target.result);
    }
    reader.readAsDataURL(novaFotoInput.files[0]);
  }

  // Salvar nome e email no localStorage
  localStorage.setItem("userName", novoNome);
  localStorage.setItem("userEmail", novoEmail);

  Swal.fire({
    icon: 'success',
    title: 'Sucesso!',
    text: 'Configurações salvas com sucesso.',
    timer: 1500,
    showConfirmButton: false
  });

  bootstrap.Modal.getInstance(document.getElementById('configModal')).hide();
}

// ADICIONE esta função no seu JS (após a função salvarConfiguracao, por exemplo)
function previewFotoSelecionada() {
  const input = document.getElementById('novaFoto');
  const preview = document.getElementById('previewFoto');

  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;  // Atualiza o preview no modal
    }
    reader.readAsDataURL(input.files[0]);
  }
}
// ---------- VARIÁVEIS GLOBAIS ----------
let materiaAtualAuto = null;
let materiaAnterior = null;
let notificarMudanca = true;
let estudoAtual = null;
let modoEstudo = "auto";
let materias = [];  // APENAS UM ARRAY para todas as matérias
let cronogramaNovo = [];
let notas = [];
let anexosTemp = [];
let materiasCronograma = [];
let materiasRelogio = [];
let tempoEstudo = JSON.parse(localStorage.getItem("tempoEstudo")) || {};

// Carregar do localStorage
try {
  materias = JSON.parse(localStorage.getItem("materias")) || [];
  cronogramaNovo = JSON.parse(localStorage.getItem("cronogramaNovo")) || [];
} catch (e) {
  materias = [];
  cronogramaNovo = [];
}
function allowDrop(ev) {
  ev.preventDefault();
}

// ===== FORMATAÇÃO DE TEXTO DAS NOTAS (SUBSTITUI document.execCommand) =====
function setupNotaTextFormatting() {
  const textoDiv = document.getElementById("notaTexto");
  if (!textoDiv) return;

  const btnBold = document.getElementById("btnBoldNota");
  const btnItalic = document.getElementById("btnItalicNota");
  const btnUnderline = document.getElementById("btnUnderlineNota");

  if (btnBold) {
    btnBold.addEventListener("click", () => {
      document.execCommand('bold', false, null);
      textoDiv.focus();
    });
  }

  if (btnItalic) {
    btnItalic.addEventListener("click", () => {
      document.execCommand('italic', false, null);
      textoDiv.focus();
    });
  }

  if (btnUnderline) {
    btnUnderline.addEventListener("click", () => {
      document.execCommand('underline', false, null);
      textoDiv.focus();
    });
  }
}
/*MIGRAR DADOS ANTIGOS */
function migrarDadosAntigos() {
  let precisaSalvar = false;

  Object.keys(tempoEstudo).forEach(id => {
    const dado = tempoEstudo[id];
    if (typeof dado === 'number') {
      const hoje = new Date().toISOString().split('T')[0];
      tempoEstudo[id] = {
        total: dado,
        historico: { [hoje]: dado }
      };
      precisaSalvar = true;
    }
  });

  if (precisaSalvar) {
    localStorage.setItem("tempoEstudo", JSON.stringify(tempoEstudo));
  }
}

// ---------- CARREGAR DO LOCALSTORAGE ----------
try {
  materias = JSON.parse(localStorage.getItem("materias")) || [];
  cronogramaNovo = JSON.parse(localStorage.getItem("cronogramaNovo")) || [];
} catch (e) {
  materias = [];
  cronogramaNovo = [];
}
// ---------- SALVAR ----------
function salvarMaterias() {
  localStorage.setItem("materias", JSON.stringify(materias));
}
function salvarCronogramaNovo() {
  localStorage.setItem("cronogramaNovo", JSON.stringify(cronogramaNovo));
}

// ---------- RENDERIZAR MATÉRIAS ----------
function renderMaterias() {
  const container = document.getElementById("materiasContainer");
  if (!container) return;
  container.innerHTML = "";

  // Usar 'materias' diretamente (é o array principal que você já tem)
  materias.forEach(m => {
    const div = document.createElement("div");
    div.classList.add("materia-bloco");
    div.style.background = m.cor;
    div.textContent = m.nome;
    div.id = m.id;
    div.draggable = true;
    div.ondragstart = (e) => e.dataTransfer.setData("id", m.id);

    // Editar (duplo clique)
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
          renderTabelaMaterias();
        } else if (result.isDenied) {
          materias = materias.filter(mat => mat.id !== m.id);
          cronogramaNovo = cronogramaNovo.filter(c => c.materia.id !== m.id);
          salvarMaterias();
          salvarCronogramaNovo();
          renderMaterias();
          renderCronogramaNovo();
          renderTabelaMaterias();
        }
      });
    });

    // Excluir (clique direito)
    div.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      Swal.fire({
        title: `Excluir ${m.nome}?`,
        text: "Isso também removerá a matéria de TODOS os dias do cronograma!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir tudo',
        cancelButtonText: 'Cancelar'
      }).then(res => {
        if (res.isConfirmed) {
          materias = materias.filter(mat => mat.id !== m.id);
          cronogramaNovo = cronogramaNovo.filter(c => c.materia.id !== m.id);
          salvarMaterias();
          salvarCronogramaNovo();
          renderMaterias();
          renderCronogramaNovo();
          renderTabelaMaterias();
          renderizarResumoHoje();
          Swal.fire({ icon: 'success', title: 'Matéria excluída!', timer: 1500, showConfirmButton: false });
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

    const blocos = cronogramaNovo.filter(b => b.dia === dia)
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
            cronogramaNovo = cronogramaNovo.filter(c => c.id !== b.id);
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
  const dia = ev.currentTarget.closest('.dia').id;
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
    const conflito = cronogramaNovo.some(b =>
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
    cronogramaNovo.push(bloco);
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
} function atualizarMateriaAgora() {
  const el = document.getElementById("materiaAgoraInicio");
  if (!el) return;

  const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const hojeSemana = dias[new Date().getDay()];
  const agora = new Date();
  const horaAtual = String(agora.getHours()).padStart(2, '0') + ":" + String(agora.getMinutes()).padStart(2, '0');

  const cronogramaNovoLocal = JSON.parse(localStorage.getItem("cronogramaNovo")) || [];
  const blocoAtual = cronogramaNovoLocal.find(b =>
    b.dia === hojeSemana &&
    horaAtual >= b.inicio &&
    horaAtual < b.fim
  );

  // Só entra no modo automático se não estiver em modo foco
  const modoFocoAtivo = document.getElementById("modoFocoContainer")?.style.display === "flex";

  if (!modoFocoAtivo && modoEstudo === "auto") {
    if (blocoAtual) {
      const idMateria = blocoAtual.materia.id;
      if (estudoAtual !== idMateria && typeof iniciarEstudo === 'function') {
        if (estudoAtual) pausarEstudo();
        iniciarEstudo(idMateria);
      }
      if (notificarMudanca && materiaAnterior !== idMateria) {
        Swal.fire({
          icon: "info",
          title: "Hora de estudar!",
          text: `Agora é ${blocoAtual.materia.nome}`,
          timer: 2000,
          showConfirmButton: false
        });
      }
      materiaAnterior = idMateria;
      materiaAtualAuto = blocoAtual.materia.nome;
    } else {
      if (estudoAtual && typeof pausarEstudo === 'function') pausarEstudo();
      materiaAtualAuto = null;
    }
  }
}


/* ===================== RELOGIO =====================*/
let intervaloEstudo;

function atualizarSistema() {
  atualizarMateriaAgora();
  atualizarRelogioInfo();
  // Verifica se a função existe antes de chamar
  if (typeof atualizarMeta === 'function') {
    atualizarMeta();
  }
}

/* ================= CRONOMETRO ================= */
let cronometro = 0;
let cronometroInterval;
function iniciarCronometro() {
  clearInterval(cronometroInterval);
  cronometroInterval = setInterval(() => {
    cronometro++;
    const h = String(Math.floor(cronometro / 3600)).padStart(2, "0");
    const m = String(Math.floor((cronometro % 3600) / 60)).padStart(2, "0");
    const s = String(cronometro % 60).padStart(2, "0");
    document.getElementById("cronometroDisplay").textContent =
      `${h}:${m}:${s}`;
  }, 1000)
}
function pausarCronometro() {
  clearInterval(cronometroInterval);
}
function resetarCronometro() {
  clearInterval(cronometroInterval);
  cronometro = 0;
  document.getElementById("cronometroDisplay").textContent = "00:00:00";
}
/* ================= TIMER ================= */
let timerInterval;
let tempoRestante = 0;
function iniciarTimer() {
  clearInterval(timerInterval);
  const minutos = document.getElementById("timerMinutos").value;
  tempoRestante = minutos * 60;
  timerInterval = setInterval(() => {
    tempoRestante--;
    const min = String(Math.floor(tempoRestante / 60)).padStart(2, "0");
    const seg = String(tempoRestante % 60).padStart(2, "0");
    document.getElementById("timerDisplay").textContent = `${min}:${seg}`;
    if (tempoRestante <= 0) {
      clearInterval(timerInterval);
      tempoRestante = 0;
      document.getElementById("timerDisplay").textContent = "00:00";
      Swal.fire({
        icon: "info",
        title: "Tempo acabou!",
        timer: 2000,
        showConfirmButton: false
      });
    }
  }, 1000)
}
function pararTimer() {
  clearInterval(timerInterval);
}
/* ================= TEMPO POR MATERIA ================= */
function renderTabelaMaterias() {
  const tabela = document.getElementById("tabelaMateriasTempo");
  if (!tabela) return;
  tabela.innerHTML = "";

  materias.forEach(m => {
    const dados = tempoEstudo[m.id];
    let tempo = 0;
    if (dados) {
      if (typeof dados === 'number') tempo = dados;
      else tempo = dados.total || 0;
    }
    const h = String(Math.floor(tempo / 3600)).padStart(2, "0");
    const min = String(Math.floor((tempo % 3600) / 60)).padStart(2, "0");
    const seg = String(tempo % 60).padStart(2, "0");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.nome}</td>
      <td>${h}:${min}:${seg}</td>
      <td>
        <button onclick="iniciarEstudo('${m.id}')">▶</button>
        <button onclick="pausarEstudo()">⏸</button>
      </td>
    `;
    tabela.appendChild(tr);
  });
}/* ================= POMODORO CORRIGIDO (APENAS ESTE BLOCO) ================= */
let pomodoroTempo = 1500;
let pomodoroInterval = null;
let pomodoroRodando = false;
let modoPomodoro = "foco"; // "foco" ou "pausa"
let estudoIdPomodoro = null;

function atualizarDisplayPomodoro() {
  const min = String(Math.floor(pomodoroTempo / 60)).padStart(2, "0");
  const seg = String(pomodoroTempo % 60).padStart(2, "0");
  const display = document.getElementById("pomodoroDisplay");
  if (display) display.textContent = `${min}:${seg}`;
}

function iniciarPomodoroPadrao() {
  if (pomodoroRodando) {
    Swal.fire({ icon: 'warning', title: 'Já rodando!', text: 'Pause ou resete primeiro.', timer: 1500, showConfirmButton: false });
    return;
  }

  modoPomodoro = "foco";
  pomodoroTempo = 1500;
  pomodoroRodando = true;
  const statusEl = document.getElementById("pomodoroStatus");
  if (statusEl) statusEl.textContent = "🍅 Estudando...";
  atualizarDisplayPomodoro();

  pomodoroInterval = setInterval(() => {
    if (!pomodoroRodando) return;

    if (pomodoroTempo <= 0) {
      clearInterval(pomodoroInterval);
      pomodoroRodando = false;

      if (modoPomodoro === "foco") {
        // Pausar estudo se tiver
        if (estudoIdPomodoro) {
          if (typeof pausarEstudo === 'function') pausarEstudo();
          estudoIdPomodoro = null;
        }

        Swal.fire({ icon: 'success', title: '🍅 Foco concluído!', text: 'Hora da pausa! ☕', timer: 2000, showConfirmButton: false });
        modoPomodoro = "pausa";
        pomodoroTempo = 300;
        if (statusEl) statusEl.textContent = "☕ Em pausa...";
        iniciarPomodoroPadrao();
      } else {
        Swal.fire({ icon: 'info', title: '☕ Pausa concluída!', text: 'Hora de estudar!', timer: 2000, showConfirmButton: false });
        modoPomodoro = "foco";
        pomodoroTempo = 1500;
        if (statusEl) statusEl.textContent = "⚪ Parado";
      }
      atualizarDisplayPomodoro();
      return;
    }

    pomodoroTempo--;
    atualizarDisplayPomodoro();
  }, 1000);
}

function pausarPomodoro() {
  if (!pomodoroRodando) return;
  pomodoroRodando = false;
  clearInterval(pomodoroInterval);
  const statusEl = document.getElementById("pomodoroStatus");
  if (statusEl) statusEl.textContent = "⏸ Pausado";
  if (estudoIdPomodoro && typeof pausarEstudo === 'function') pausarEstudo();
}

function resetarPomodoro() {
  clearInterval(pomodoroInterval);
  pomodoroRodando = false;
  modoPomodoro = "foco";
  pomodoroTempo = 1500;
  atualizarDisplayPomodoro();
  const statusEl = document.getElementById("pomodoroStatus");
  if (statusEl) statusEl.textContent = "⚪ Parado";
  if (estudoIdPomodoro) {
    if (typeof pausarEstudo === 'function') pausarEstudo();
    estudoIdPomodoro = null;
  }
}

function abrirModalPomodoro() {
  const select = document.getElementById('pomodoroMateria');
  if (select && materias) {
    select.innerHTML = '<option value="">Selecione uma matéria</option>';
    materias.forEach(m => {
      select.innerHTML += `<option value="${m.id}">${m.nome}</option>`;
    });
  }

  const tempoEstudoInput = document.getElementById('pomodoroTempoEstudo');
  const tempoPausaInput = document.getElementById('pomodoroTempoPausa');
  if (tempoEstudoInput) tempoEstudoInput.value = 25;
  if (tempoPausaInput) tempoPausaInput.value = 5;

  const modal = new bootstrap.Modal(document.getElementById('modalPomodoro'));
  modal.show();
}

function iniciarPomodoroPersonalizado() {
  const materiaId = document.getElementById('pomodoroMateria')?.value;
  const tempoEstudo = parseInt(document.getElementById('pomodoroTempoEstudo')?.value || 25);
  const tempoPausa = parseInt(document.getElementById('pomodoroTempoPausa')?.value || 5);

  if (!materiaId) {
    Swal.fire({ icon: 'warning', title: 'Selecione uma matéria!', timer: 1500, showConfirmButton: false });
    return;
  }

  const materia = materias.find(m => m.id == materiaId);
  if (!materia) return;

  // Configurar o Pomodoro personalizado
  if (pomodoroRodando) resetarPomodoro();

  modoPomodoro = "foco";
  pomodoroTempo = tempoEstudo * 60;
  pomodoroRodando = true;
  estudoIdPomodoro = materiaId;

  // Iniciar estudo
  if (typeof iniciarEstudo === 'function') iniciarEstudo(materiaId);

  const statusEl = document.getElementById("pomodoroStatus");
  if (statusEl) statusEl.textContent = "🍅 Estudando...";
  atualizarDisplayPomodoro();

  // Fechar modal
  bootstrap.Modal.getInstance(document.getElementById('modalPomodoro'))?.hide();

  // Iniciar timer
  if (pomodoroInterval) clearInterval(pomodoroInterval);
  pomodoroInterval = setInterval(() => {
    if (!pomodoroRodando) return;

    if (pomodoroTempo <= 0) {
      clearInterval(pomodoroInterval);
      pomodoroRodando = false;

      if (modoPomodoro === "foco") {
        if (estudoIdPomodoro && typeof pausarEstudo === 'function') pausarEstudo();

        Swal.fire({ icon: 'success', title: '🍅 Foco concluído!', text: `${tempoPausa} min de pausa ☕`, timer: 2000, showConfirmButton: false });
        modoPomodoro = "pausa";
        pomodoroTempo = tempoPausa * 60;
        if (statusEl) statusEl.textContent = "☕ Em pausa...";
        atualizarDisplayPomodoro();

        // Continuar para a pausa
        setTimeout(() => {
          if (!pomodoroRodando) {
            pomodoroRodando = true;
            pomodoroInterval = setInterval(() => {
              if (!pomodoroRodando) return;
              if (pomodoroTempo <= 0) {
                clearInterval(pomodoroInterval);
                pomodoroRodando = false;
                Swal.fire({ icon: 'info', title: '☕ Pausa concluída!', text: 'Pronto para outro ciclo!', timer: 2000, showConfirmButton: false });
                if (statusEl) statusEl.textContent = "⚪ Parado";
                estudoIdPomodoro = null;
              } else {
                pomodoroTempo--;
                atualizarDisplayPomodoro();
              }
            }, 1000);
          }
        }, 10);
      }
      return;
    }

    pomodoroTempo--;
    atualizarDisplayPomodoro();
  }, 1000);
}

/* ================= INICIAR ESTUDO ================= */
function iniciarEstudo(id) {
  atualizarStreak();
  estudoAtual = id;

  // Inicializar estrutura se não existir
  if (!tempoEstudo[id]) {
    tempoEstudo[id] = {
      total: 0,
      historico: {} // vai guardar { "2024-03-31": segundos }
    };
  }

  // Garantir que tem a estrutura correta
  if (typeof tempoEstudo[id] === 'number') {
    // Migrar formato antigo para novo
    const tempoAntigo = tempoEstudo[id];
    tempoEstudo[id] = {
      total: tempoAntigo,
      historico: {}
    };
  }

  const hoje = new Date().toISOString().split('T')[0];
  if (!tempoEstudo[id].historico[hoje]) {
    tempoEstudo[id].historico[hoje] = 0;
  }

  clearInterval(intervaloEstudo);
  intervaloEstudo = setInterval(() => {
    // Incrementar total
    tempoEstudo[id].total++;
    // Incrementar histórico do dia
    tempoEstudo[id].historico[hoje]++;

    localStorage.setItem("tempoEstudo", JSON.stringify(tempoEstudo));
    renderTabelaMaterias();
    atualizarMeta(); // Atualizar a meta em tempo real
    if (typeof carregarEstatisticas === 'function' && document.getElementById("estatisticaSection")?.style.display === "block") {
      carregarEstatisticas();
    }
    if (typeof atualizarRelogioInfo === 'function') {
      atualizarRelogioInfo();
    }
  }, 1000);
}/* ================= MODO FOCO PERSONALIZADO ================= */

// Função para abrir o modal
function abrirModalModoFoco() {
  // Atualizar lista de matérias no select
  const select = document.getElementById('focoMateriaSelect');
  if (select && typeof materias !== 'undefined' && materias) {
    select.innerHTML = '<option value="">Selecione uma matéria</option>';
    materias.forEach(m => {
      select.innerHTML += `<option value="${m.id}">${m.nome}</option>`;
    });
  }

  document.getElementById('focoTempoPersonalizado').value = 25;

  // Abrir modal usando Bootstrap
  const modalElement = document.getElementById('modalModoFoco');
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
}

// Função chamada quando clica em "Iniciar Foco"
function iniciarModoFocoPersonalizado() {
  const materiaId = document.getElementById('focoMateriaSelect').value;
  const tempoFoco = parseInt(document.getElementById('focoTempoPersonalizado').value);

  if (!materiaId) {
    Swal.fire({
      icon: 'warning',
      title: 'Selecione uma matéria!',
      timer: 1500,
      showConfirmButton: false,
      background: '#1f2937',
      color: 'white'
    });
    return;
  }

  const materia = materias.find(m => m.id == materiaId);

  if (!materia) {
    Swal.fire({
      icon: 'error',
      title: 'Erro!',
      text: 'Matéria não encontrada!',
      timer: 1500,
      showConfirmButton: false
    });
    return;
  }

  // Fechar modal
  const modalElement = document.getElementById('modalModoFoco');
  const modal = bootstrap.Modal.getInstance(modalElement);
  if (modal) modal.hide();

  // Iniciar o modo foco
  iniciarTimerFoco(materia, tempoFoco);
}

// Função principal do timer
function iniciarTimerFoco(materia, tempoMinutos) {
  const materiaNome = materia.nome;
  const materiaCor = materia.cor || "#9f042c";
  const tempoSegundos = tempoMinutos * 60;

  // Remove container existente
  const existingContainer = document.getElementById("modoFocoContainer");
  if (existingContainer) existingContainer.remove();

  // Criar o HTML do modo foco
  const focoHTML = `
    <div id="modoFocoRelogioContainer" class="modo-foco-container">
      <div class="modo-foco-card">
        <div class="modo-foco-icon" style="background: ${materiaCor}; box-shadow: 0 0 30px ${materiaCor}80;">
          <i class="bi bi-brain"></i>
        </div>
        <h1 class="modo-foco-titulo">${materiaNome}</h1>
        <div id="focoTimer" class="modo-foco-timer">${String(tempoMinutos).padStart(2, '0')}:00</div>
        <div class="modo-foco-progresso-bg">
          <div id="focoProgresso" class="modo-foco-progresso-bar" style="background: ${materiaCor}; width: 100%;"></div>
        </div>
        <div class="modo-foco-botoes">
          <button id="focoPausarBtn" class="modo-foco-btn modo-foco-btn-pausar">⏸ Pausar</button>
          <button id="focoResetBtn" class="modo-foco-btn modo-foco-btn-reset">🔄 Reset</button>
          <button id="focoSairBtn" class="modo-foco-btn modo-foco-btn-sair">✕ Sair</button>
        </div>
        <p id="focoFrase" class="modo-foco-frase">🎯 Foco total em ${materiaNome}! Você consegue!</p>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', focoHTML);

  let tempoRestante = tempoSegundos;
  let focoAtivo = true;
  let intervalId = null;

  const timerEl = document.getElementById("focoTimer");
  const progressoEl = document.getElementById("focoProgresso");
  const fraseEl = document.getElementById("focoFrase");
  const pausarBtn = document.getElementById("focoPausarBtn");
  const resetBtn = document.getElementById("focoResetBtn");
  const sairBtn = document.getElementById("focoSairBtn");

  function atualizarDisplay() {
    if (!timerEl) return;
    const minutos = Math.floor(tempoRestante / 60);
    const segundos = tempoRestante % 60;
    timerEl.textContent = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

    const progressoPercent = (tempoRestante / tempoSegundos) * 100;
    if (progressoEl) progressoEl.style.width = `${progressoPercent}%`;

    if (fraseEl && focoAtivo) {
      if (tempoRestante > tempoSegundos * 0.8) {
        fraseEl.textContent = `🎯 Começando com tudo! Mantenha o foco em ${materiaNome}!`;
      } else if (tempoRestante > tempoSegundos * 0.5) {
        fraseEl.textContent = '💪 Continue assim! Você está indo bem!';
      } else if (tempoRestante > 60) {
        fraseEl.textContent = '🔥 Quase lá! Mais um pouco!';
      } else if (tempoRestante > 0) {
        fraseEl.textContent = '⏰ Último minuto! Dá pra finalizar com força!';
      }
    }
  }

  // Iniciar timer
  intervalId = setInterval(() => {
    if (!focoAtivo) return;

    if (tempoRestante > 0) {
      tempoRestante--;
      atualizarDisplay();
    } else {
      clearInterval(intervalId);

      // Salvar tempo estudado
      if (typeof tempoEstudo !== 'undefined' && tempoEstudo && materia.id) {
        if (!tempoEstudo[materia.id]) tempoEstudo[materia.id] = 0;
        tempoEstudo[materia.id] += tempoSegundos;
        localStorage.setItem("tempoEstudo", JSON.stringify(tempoEstudo));
        if (typeof renderTabelaMaterias === 'function') renderTabelaMaterias();
      }

      // Comemoração
      Swal.fire({
        icon: 'success',
        title: '🎉 Tempo concluído!',
        text: `Parabéns! Você focou ${tempoMinutos} minutos em ${materiaNome}!`,
        timer: 3000,
        showConfirmButton: false,
        background: '#1f2937',
        color: 'white'
      });

      setTimeout(() => {
        const container = document.getElementById("modoFocoRelogioContainer");
        if (container) container.remove();
      }, 3000);
    }
  }, 1000);

  // Botões
  if (pausarBtn) {
    pausarBtn.onclick = () => {
      focoAtivo = !focoAtivo;
      pausarBtn.innerHTML = focoAtivo ? '⏸ Pausar' : '▶ Continuar';
      pausarBtn.classList.toggle('modo-foco-btn-continuar', !focoAtivo);
      if (fraseEl) {
        fraseEl.textContent = focoAtivo ? `🎯 Foco total em ${materiaNome}!` : '⏸ Pausado. Respire fundo e volte quando estiver pronto!';
      }
    };
  }

  if (resetBtn) {
    resetBtn.onclick = () => {
      tempoRestante = tempoSegundos;
      focoAtivo = true;
      atualizarDisplay();
      if (pausarBtn) {
        pausarBtn.innerHTML = '⏸ Pausar';
        pausarBtn.classList.remove('modo-foco-btn-continuar');
      }
      if (fraseEl) fraseEl.textContent = '🔄 Timer resetado! Vamos começar de novo!';
    };
  }

  if (sairBtn) {
    sairBtn.onclick = () => {
      if (intervalId) clearInterval(intervalId);
      const container = document.getElementById("modoFocoRelogioContainer");
      if (container) container.remove();
    };
  }

  atualizarDisplay();
}
/* ================= META PERSONALIZÁVEL ================= */
let metas = {
  diaria: 2,
  semanal: 14,
  mensal: 60
};
let metaAtiva = "semanal";

// 1. PRIMEIRO: FUNÇÃO PARA CALCULAR HORAS
function calcularHorasEstudadas(periodo) {
  const hoje = new Date();
  let totalSegundos = 0;

  function formatarData(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  const hojeStr = formatarData(hoje);
  let dataInicio = new Date();
  let dataInicioStr;

  if (periodo === "diaria") {
    dataInicioStr = hojeStr;
  } else if (periodo === "semanal") {
    dataInicio.setDate(hoje.getDate() - 7);
    dataInicioStr = formatarData(dataInicio);
  } else if (periodo === "mensal") {
    dataInicio.setDate(hoje.getDate() - 30);
    dataInicioStr = formatarData(dataInicio);
  }

  Object.entries(tempoEstudo).forEach(([materiaId, materia]) => {
    if (typeof materia === 'number') {
      totalSegundos += materia;
      return;
    }

    if (materia.historico) {
      Object.entries(materia.historico).forEach(([dataStr, segundos]) => {
        if (dataStr >= dataInicioStr && dataStr <= hojeStr) {
          totalSegundos += segundos;
        }
      });
    } else if (materia.total) {
      totalSegundos += materia.total;
    }
  });

  return totalSegundos / 3600;
}

// 2. SEGUNDO: FUNÇÃO PARA ATUALIZAR A META (antes de ser chamada)
function atualizarMeta() {
  let metaValor, totalHoras, unidade;

  if (metaAtiva === "diaria") {
    metaValor = metas.diaria;
    unidade = "dia";
  } else if (metaAtiva === "semanal") {
    metaValor = metas.semanal;
    unidade = "semana";
  } else {
    metaValor = metas.mensal;
    unidade = "mês";
  }

  totalHoras = calcularHorasEstudadas(metaAtiva);
  const progresso = Math.min((totalHoras / metaValor) * 100, 100);
  const faltam = Math.max(metaValor - totalHoras, 0);

  const metaTexto = document.getElementById("metaTextoResumo");
  if (metaTexto) {
    metaTexto.textContent = `📊 ${totalHoras.toFixed(1)}h de ${metaValor}h (${unidade})`;
  }

  const metaBarra = document.getElementById("metaBarraResumo");
  if (metaBarra) {
    metaBarra.style.width = `${progresso}%`;
  }

  const metaRestante = document.getElementById("metaRestanteResumo");
  if (metaRestante) {
    if (faltam > 0) {
      metaRestante.textContent = `⏳ Faltam ${faltam.toFixed(1)}h para bater a meta ${unidade}!`;
    } else {
      metaRestante.textContent = `🎉 Meta ${unidade} alcançada! Parabéns! 🎉`;
    }
  }
}

// 3. TERCEIRO: FUNÇÕES QUE CHAMAM atualizarMeta
function carregarMetas() {
  const metasSalvas = localStorage.getItem("metas");
  if (metasSalvas) {
    metas = JSON.parse(metasSalvas);
  } else {
    localStorage.setItem("metas", JSON.stringify(metas));
  }

  const metaAtivaSalva = localStorage.getItem("metaAtiva");
  if (metaAtivaSalva) {
    metaAtiva = metaAtivaSalva;
  }

  atualizarMeta();
  atualizarBotoesMeta();
}

function atualizarBotoesMeta() {
  const botoes = document.querySelectorAll('.meta-tipo-btn');
  botoes.forEach(btn => {
    if (btn.dataset.tipo === metaAtiva) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }

    btn.onclick = () => {
      metaAtiva = btn.dataset.tipo;
      localStorage.setItem("metaAtiva", metaAtiva);
      atualizarBotoesMeta();
      atualizarMeta();
    };
  });
}

function abrirModalMeta() {
  document.getElementById("metaDiaria").value = metas.diaria;
  document.getElementById("metaSemanal").value = metas.semanal;
  document.getElementById("metaMensal").value = metas.mensal;
  const modal = new bootstrap.Modal(document.getElementById('modalMeta'));
  modal.show();
}

function salvarMeta() {
  metas.diaria = parseFloat(document.getElementById("metaDiaria").value) || 2;
  metas.semanal = parseFloat(document.getElementById("metaSemanal").value) || 14;
  metas.mensal = parseFloat(document.getElementById("metaMensal").value) || 60;

  localStorage.setItem("metas", JSON.stringify(metas));
  atualizarMeta();

  bootstrap.Modal.getInstance(document.getElementById('modalMeta')).hide();
  Swal.fire({
    icon: 'success',
    title: 'Metas atualizadas!',
    text: `🎯 Diária: ${metas.diaria}h | Semanal: ${metas.semanal}h | Mensal: ${metas.mensal}h`,
    timer: 2500,
    showConfirmButton: false
  });
}

function calcularMetas() {
  atualizarMeta();
}

/* ================= STREAK ================= */
function atualizarStreak() {
  const hoje = new Date().toDateString();
  let ultimoDia = localStorage.getItem("ultimoDiaEstudo");
  let streak = parseInt(localStorage.getItem("streak")) || 0;
  if (!ultimoDia) {
    localStorage.setItem("ultimoDiaEstudo", hoje);
    localStorage.setItem("streak", 1);
    return;
  }
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  if (new Date(ultimoDia).toDateString() === ontem.toDateString()) {
    streak++;
    localStorage.setItem("streak", streak);
  } else if (ultimoDia !== hoje) {
    streak = 1;
    localStorage.setItem("streak", streak);
  }
  localStorage.setItem("ultimoDiaEstudo", hoje);
}

/* ================= RELOGIO INTELIGENTE ================= */
function atualizarRelogioInfo() {
  const materiaEl = document.getElementById("materiaRelogio");
  const horarioEl = document.getElementById("horarioRelogio");
  const tempoRestanteEl = document.getElementById("tempoRestante");
  const tempoHojeEl = document.getElementById("tempoHoje");
  const streakEl = document.getElementById("streakRelogio");

  if (!materiaEl) return;

  const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const hojeSemana = dias[new Date().getDay()];
  const agora = new Date();
  const horaAtual = String(agora.getHours()).padStart(2, "0") + ":" + String(agora.getMinutes()).padStart(2, "0");

  const cronogramaNovo = JSON.parse(localStorage.getItem("cronogramaNovo")) || [];
  const blocoAtual = cronogramaNovo.find(b =>
    b.dia === hojeSemana &&
    horaAtual >= b.inicio &&
    horaAtual < b.fim
  );

  if (blocoAtual) {
    materiaEl.textContent = "📚 " + blocoAtual.materia.nome;
    horarioEl.textContent = blocoAtual.inicio + " - " + blocoAtual.fim;
    const [fh, fm] = blocoAtual.fim.split(":");
    const fim = new Date();
    fim.setHours(fh);
    fim.setMinutes(fm);
    fim.setSeconds(0);
    const restante = Math.floor((fim - agora) / 1000);
    if (restante > 0) {
      const h = String(Math.floor(restante / 3600)).padStart(2, "0");
      const m = String(Math.floor((restante % 3600) / 60)).padStart(2, "0");
      const s = String(restante % 60).padStart(2, "0");
      tempoRestanteEl.textContent = "⏳ faltam " + h + ":" + m + ":" + s;
    } else {
      tempoRestanteEl.textContent = "⏳ terminou";
    }
  } else {
    materiaEl.innerHTML = "<i class='bi bi-moon-stars-fill'></i> Descanso";
    horarioEl.textContent = "";
    tempoRestanteEl.textContent = "";
  }

  // ✅ CALCULAR APENAS AS HORAS ESTUDADAS HOJE
  const hoje = new Date().toISOString().split('T')[0];
  let totalSegundosHoje = 0;

  Object.values(tempoEstudo).forEach(materia => {
    if (typeof materia === 'number') {
      // Formato antigo - considera tudo
      totalSegundosHoje += materia;
    } else if (materia.historico && materia.historico[hoje]) {
      // Formato novo - pega só o dia de hoje
      totalSegundosHoje += materia.historico[hoje];
    } else if (materia.total) {
      // Fallback
      totalSegundosHoje += materia.total;
    }
  });

  const h = String(Math.floor(totalSegundosHoje / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSegundosHoje % 3600) / 60)).padStart(2, "0");
  const s = String(totalSegundosHoje % 60).padStart(2, "0");
  tempoHojeEl.textContent = "⏱ " + h + ":" + m + ":" + s + " estudados hoje";

  const streak = localStorage.getItem("streak") || 0;
  streakEl.textContent = "🔥 " + streak + " dias seguidos";
}

function pausarEstudo() {
  clearInterval(intervaloEstudo);
  estudoAtual = null;
  modoEstudo = "manual";
  notificarMudanca = false;  // 👈 DESATIVA NOTIFICAÇÕES
  Swal.fire({
    icon: "info",
    title: "Estudo pausado",
    text: "As notificações de estudo automático foram desativadas.",
    timer: 2000,
    showConfirmButton: false
  });
}
function adicionarMateriaRelogio() {
  const nome = document.getElementById("novaMateriaRelogio").value.trim();
  if (!nome) return;

  const novaMateria = {
    id: "m" + Date.now(),
    nome: nome,
    cor: "#9f042c"
  };

  materias.push(novaMateria);
  localStorage.setItem("materias", JSON.stringify(materias));
  document.getElementById("novaMateriaRelogio").value = "";
  renderTabelaMaterias();
  renderMaterias(); // atualiza o cronograma também
  Swal.fire({ icon: "success", title: "Matéria adicionada!", timer: 1500, showConfirmButton: false });
}
function finalizarEstudo() {
  clearInterval(intervaloEstudo);
  estudoAtual = null;
  if (typeof carregarEstatisticas === 'function') {
    carregarEstatisticas(); // 👈 ADICIONE
  }
  Swal.fire({ icon: "success", title: "Sessão finalizada!", timer: 1500, showConfirmButton: false });
}



/* ================= INFO RELÓGIO ================= */
function mostrarInfoRelogio() {
  Swal.fire({
    title: '⏰ Como funciona o Relógio Inteligente?',
    html: `
      <div style="text-align: left;">
        <p>📌 <strong>Modo Automático:</strong> O relógio acompanha seu cronograma e começa a contar automaticamente quando chega o horário de cada matéria.</p>
        <p>⏸️ <strong>Pausar:</strong> Você pode pausar o estudo a qualquer momento clicando no botão ⏸ ao lado da matéria.</p>
        <p>🔄 <strong>Voltar ao Automático:</strong> Depois de pausar, clique em "Voltar automático" para voltar a seguir o cronograma.</p>
        <p>📚 <strong>Estudo por Matéria:</strong> Você também pode estudar "solto", sem seguir o cronograma, usando os botões ▶ ao lado de cada matéria.</p>
        <p>🍅 <strong>Pomodoro:</strong> Clique no timer do Pomodoro para personalizar o tempo de estudo e pausa!</p>
      </div>
    `,
    icon: 'info',
    confirmButtonText: 'Entendi!',
    confirmButtonColor: '#9f042c'
  });
}

function atualizarPainelEstudos() {
  console.log("🔄 Atualizando painel de estudos...");

  const agora = new Date();
  let blocoAtual = null;
  let proximoBloco = null;

  // Pega o cronograma do localStorage
  let cronogramaLocal = JSON.parse(localStorage.getItem("cronogramaNovo")) || [];

  // Usa a variável global se estiver vazia
  if (cronogramaLocal.length === 0 && window.cronogramaNovo && window.cronogramaNovo.length > 0) {
    cronogramaLocal = window.cronogramaNovo;
  }

  console.log("📅 Cronograma carregado:", cronogramaLocal.length, "blocos");

  // Verificar se cronogramaNovo existe e tem dados
  if (!cronogramaLocal || cronogramaLocal.length === 0) {
    console.log("⚠️ Nenhum bloco no cronograma");
    const materiaAgoraEl = document.getElementById("materiaAgoraInicio");
    const horarioAgoraEl = document.getElementById("horarioAgoraInicio");
    const tempoRestanteEl = document.getElementById("tempoRestanteInicio");
    const materiaProximaEl = document.getElementById("materiaProximaInicio");
    const horarioProximaEl = document.getElementById("horarioProximaInicio");
    const tempoProximaEl = document.getElementById("tempoProximaInicio");

    if (materiaAgoraEl) materiaAgoraEl.innerHTML = "<i class='bi bi-moon-stars-fill'></i> Descanso";
    if (horarioAgoraEl) horarioAgoraEl.textContent = "";
    if (tempoRestanteEl) tempoRestanteEl.textContent = "";
    if (materiaProximaEl) materiaProximaEl.textContent = "Nenhuma matéria agendada";
    if (horarioProximaEl) horarioProximaEl.textContent = "";
    if (tempoProximaEl) tempoProximaEl.textContent = "";
    return;
  }

  // Dias da semana
  const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const hojeSemana = dias[agora.getDay()];
  const horaAtual = String(agora.getHours()).padStart(2, '0') + ":" + String(agora.getMinutes()).padStart(2, '0');

  console.log(`📅 Hoje: ${hojeSemana}, Hora: ${horaAtual}`);

  // Filtrar blocos do dia atual e ordenar
  const blocosHoje = cronogramaLocal
    .filter(b => b.dia === hojeSemana)
    .sort((a, b) => a.inicio.localeCompare(b.inicio));

  console.log(`📖 Blocos de hoje: ${blocosHoje.length}`);

  // Encontrar bloco atual e próximo
  for (let i = 0; i < blocosHoje.length; i++) {
    const bloco = blocosHoje[i];
    if (!bloco.inicio || !bloco.fim) continue;

    // Verificar se é o bloco atual
    if (horaAtual >= bloco.inicio && horaAtual < bloco.fim) {
      blocoAtual = bloco;
      console.log(`✅ MATÉRIA ATUAL: ${bloco.materia.nome} (${bloco.inicio} - ${bloco.fim})`);
    }

    // Verificar se é o próximo bloco (primeiro que começa depois da hora atual)
    if (!blocoAtual && bloco.inicio > horaAtual && !proximoBloco) {
      proximoBloco = bloco;
      console.log(`⏰ PRÓXIMA: ${bloco.materia.nome} às ${bloco.inicio}`);
    }
  }

  // Se não encontrou bloco atual mas tem blocos, pega o próximo
  if (!blocoAtual && blocosHoje.length > 0 && !proximoBloco) {
    // Pega o primeiro bloco do dia (se for antes do primeiro horário)
    if (horaAtual < blocosHoje[0].inicio) {
      proximoBloco = blocosHoje[0];
      console.log(`⏰ PRÓXIMA (primeira do dia): ${proximoBloco.materia.nome} às ${proximoBloco.inicio}`);
    }
  }

  // Atualizar UI - Matéria Atual
  const materiaAtualEl = document.getElementById("materiaAgoraInicio");
  const horarioAtualEl = document.getElementById("horarioAgoraInicio");
  const tempoRestanteEl = document.getElementById("tempoRestanteInicio");

  if (blocoAtual) {
    if (materiaAtualEl) materiaAtualEl.textContent = blocoAtual.materia.nome;
    if (horarioAtualEl) horarioAtualEl.textContent = `${blocoAtual.inicio} - ${blocoAtual.fim}`;

    // Calcular tempo restante
    const [h, m] = blocoAtual.fim.split(":");
    const fim = new Date();
    fim.setHours(parseInt(h), parseInt(m), 0);
    const diff = fim - agora;
    if (diff > 0) {
      const minutos = Math.floor(diff / 60000);
      const segundos = Math.floor((diff % 60000) / 1000);
      if (tempoRestanteEl) tempoRestanteEl.textContent = `⏳ faltam ${minutos}min ${segundos}s`;
    } else {
      if (tempoRestanteEl) tempoRestanteEl.textContent = `⏳ terminou`;
    }

    console.log(`✅ Painel atualizado: ${blocoAtual.materia.nome}`);
  } else {
    if (materiaAtualEl) materiaAtualEl.innerHTML = "<i class='bi bi-moon-stars-fill'></i> Descanso";
    if (horarioAtualEl) horarioAtualEl.textContent = "";
    if (tempoRestanteEl) tempoRestanteEl.textContent = "";
    console.log("😴 Nenhuma matéria no momento");
  }

  // Atualizar UI - Próxima Matéria
  const materiaProximaEl = document.getElementById("materiaProximaInicio");
  const horarioProximaEl = document.getElementById("horarioProximaInicio");
  const tempoProximaEl = document.getElementById("tempoProximaInicio");

  if (proximoBloco) {
    if (materiaProximaEl) materiaProximaEl.textContent = proximoBloco.materia.nome;
    if (horarioProximaEl) horarioProximaEl.textContent = `${proximoBloco.inicio} - ${proximoBloco.fim}`;

    const [h, m] = proximoBloco.inicio.split(":");
    const inicio = new Date();
    inicio.setHours(parseInt(h), parseInt(m), 0);
    const diff = inicio - agora;
    if (diff > 0) {
      const minutos = Math.floor(diff / 60000);
      const horas = Math.floor(minutos / 60);
      const minsRest = minutos % 60;
      if (horas > 0) {
        if (tempoProximaEl) tempoProximaEl.textContent = `(em ${horas}h ${minsRest}min)`;
      } else {
        if (tempoProximaEl) tempoProximaEl.textContent = `(em ${minutos} min)`;
      }
    } else {
      if (tempoProximaEl) tempoProximaEl.textContent = `(em breve)`;
    }
  } else {
    if (materiaProximaEl) materiaProximaEl.textContent = "Nenhuma matéria agendada";
    if (horarioProximaEl) horarioProximaEl.textContent = "";
    if (tempoProximaEl) tempoProximaEl.textContent = "";
  }
}

// Garantir que o painel seja atualizado na inicialização e quando o cronograma mudar
function forcarAtualizacaoPainel() {
  console.log("🔄 Forçando atualização do painel...");
  setTimeout(() => {
    atualizarPainelEstudos();
  }, 10);
}

// Adicionar listener para quando o cronograma for alterado
function atualizarCronogramaCompleto() {
  renderCronogramaNovo();
  renderizarResumoHoje();
  atualizarMateriaAgora();
  forcarAtualizacaoPainel();
}

// Substituir a chamada do setInterval por uma mais confiável
/*setInterval(() => {
  if (typeof atualizarPainelEstudos === 'function') {
    atualizarPainelEstudos();
  }
}, 30000); // atualiza a cada 30 segundos
*/
// Forçar atualização inicial
forcarAtualizacaoPainel();


/*setInterval(atualizarSistema, 10000); */
function voltarModoAuto() {
  modoEstudo = "auto";
  notificarMudanca = true;
  Swal.fire({
    icon: "info",
    title: "Modo automático ativado",
    text: "Você receberá notificações quando for hora de estudar.",
    timer: 2000,
    showConfirmButton: false
  });
  atualizarMateriaAgora();
  atualizarPainelEstudos();
}



// ===== MENU HAMBÚRGUER PARA CELULAR =====
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('overlay');

  if (!sidebar) return;

  // Alterna a classe show na sidebar
  sidebar.classList.toggle('show');

  // Gerencia o overlay
  if (overlay) {
    if (sidebar.classList.contains('show')) {
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    } else {
      overlay.classList.remove('show');
      document.body.style.overflow = '';
    }
  }
}

function closeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('overlay');

  if (sidebar) sidebar.classList.remove('show');
  if (overlay) overlay.classList.remove('show');
  document.body.style.overflow = '';
}

// Fechar sidebar ao clicar no overlay
document.addEventListener('DOMContentLoaded', function () {
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.onclick = closeSidebar;
  }
});

// Fechar menu ao clicar em um link (no celular)
function closeSidebarOnLinkClick() {
  const links = document.querySelectorAll('#menuLateral .nav-link');
  links.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        closeSidebar();
      }
    });
  });
}

// Detectar redimensionamento da tela
window.addEventListener('resize', function () {
  if (window.innerWidth > 768) {
    closeSidebar();
  }
});

/* ================= ESTATÍSTICAS ================= */

// Variável para controlar o gráfico atual
let graficoPrincipalAtual = null;
let periodoAtual = "semana";

// Calcular estudo de hoje
function calcularEstudoHoje() {
  const hoje = new Date().toISOString().split('T')[0];
  let totalSegundos = 0;

  Object.values(tempoEstudo).forEach(materia => {
    if (materia.historico && materia.historico[hoje]) {
      totalSegundos += materia.historico[hoje];
    }
  });

  return totalSegundos / 3600;
}

// Calcular estudo semanal (últimos 7 dias)
function calcularEstudoSemanal() {
  const hoje = new Date();
  let totalSegundos = 0;

  for (let i = 0; i < 7; i++) {
    const data = new Date();
    data.setDate(hoje.getDate() - i);
    const dataStr = data.toISOString().split('T')[0];

    Object.values(tempoEstudo).forEach(materia => {
      if (materia.historico && materia.historico[dataStr]) {
        totalSegundos += materia.historico[dataStr];
      }
    });
  }

  return totalSegundos / 3600;
}

// Calcular estudo mensal (últimos 30 dias)
function calcularEstudoMensal() {
  const hoje = new Date();
  let totalSegundos = 0;

  for (let i = 0; i < 30; i++) {
    const data = new Date();
    data.setDate(hoje.getDate() - i);
    const dataStr = data.toISOString().split('T')[0];

    Object.values(tempoEstudo).forEach(materia => {
      if (materia.historico && materia.historico[dataStr]) {
        totalSegundos += materia.historico[dataStr];
      }
    });
  }

  return totalSegundos / 3600;
}

// Dados para gráfico por dia da semana
function getDadosPorDiaSemana() {
  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const horasPorDia = [0, 0, 0, 0, 0, 0, 0];

  Object.values(tempoEstudo).forEach(materia => {
    if (materia.historico) {
      Object.entries(materia.historico).forEach(([dataStr, segundos]) => {
        const data = new Date(dataStr);
        const diaSemana = data.getDay();
        horasPorDia[diaSemana] += segundos / 3600;
      });
    }
  });

  return { labels: diasSemana, dados: horasPorDia };
}

// Dados para gráfico de hoje (por matéria)
function getDadosEstudoHoje() {
  const hoje = new Date().toISOString().split('T')[0];
  const dadosPorMateria = [];

  materias.forEach(m => {
    const dados = tempoEstudo[m.id];
    let segundos = 0;
    if (dados && dados.historico && dados.historico[hoje]) {
      segundos = dados.historico[hoje];
    }
    if (segundos > 0) {
      dadosPorMateria.push({ nome: m.nome, horas: segundos / 3600 });
    }
  });

  dadosPorMateria.sort((a, b) => b.horas - a.horas);

  return {
    labels: dadosPorMateria.map(d => d.nome),
    dados: dadosPorMateria.map(d => d.horas)
  };
}

// Dados para gráfico semanal (últimos 7 dias)
function getDadosEstudoSemanal() {
  const hoje = new Date();
  const labels = [];
  const dados = [];

  for (let i = 6; i >= 0; i--) {
    const data = new Date();
    data.setDate(hoje.getDate() - i);
    const dataStr = data.toISOString().split('T')[0];
    const diaNome = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][data.getDay()];
    labels.push(`${diaNome} ${data.getDate()}/${data.getMonth() + 1}`);

    let total = 0;
    Object.values(tempoEstudo).forEach(materia => {
      if (materia.historico && materia.historico[dataStr]) {
        total += materia.historico[dataStr];
      }
    });
    dados.push(total / 3600);
  }

  return { labels, dados };
}

// Dados para gráfico mensal (últimos 30 dias)
function getDadosEstudoMensal() {
  const hoje = new Date();
  const labels = [];
  const dados = [];

  for (let i = 29; i >= 0; i--) {
    const data = new Date();
    data.setDate(hoje.getDate() - i);
    const dataStr = data.toISOString().split('T')[0];
    labels.push(`${data.getDate()}/${data.getMonth() + 1}`);

    let total = 0;
    Object.values(tempoEstudo).forEach(materia => {
      if (materia.historico && materia.historico[dataStr]) {
        total += materia.historico[dataStr];
      }
    });
    dados.push(total / 3600);
  }

  return { labels, dados };
}

// Atualizar gráfico principal conforme período
function atualizarGraficoPrincipal() {
  let dados, titulo;

  if (periodoAtual === "semana") {
    dados = getDadosPorDiaSemana();
    titulo = "📅 Estudos por Dia da Semana";
  } else if (periodoAtual === "hoje") {
    dados = getDadosEstudoHoje();
    titulo = "📆 Estudo de Hoje (por matéria)";
  } else if (periodoAtual === "semanal") {
    dados = getDadosEstudoSemanal();
    titulo = "📊 Estudo Semanal (últimos 7 dias)";
  } else {
    dados = getDadosEstudoMensal();
    titulo = "📈 Estudo Mensal (últimos 30 dias)";
  }

  document.getElementById("graficoTitulo").textContent = titulo;

  const ctx = document.getElementById('graficoPrincipal').getContext('2d');
  if (graficoPrincipalAtual) graficoPrincipalAtual.destroy();

  graficoPrincipalAtual = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dados.labels,
      datasets: [{
        label: 'Horas Estudadas',
        data: dados.dados,
        backgroundColor: '#9f042c',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { position: 'top' } }
    }
  });
}

// Atualizar todas as metas
function atualizarMetas() {
  const totalHoje = calcularEstudoHoje();
  const totalSemana = calcularEstudoSemanal();
  const totalMes = calcularHorasEstudadas("mensal");

  // Meta Diária
  const metaDiaria = metas.diaria;
  const progressoDiario = Math.min((totalHoje / metaDiaria) * 100, 100);
  document.getElementById("barraMetaDiaria").style.width = `${progressoDiario}%`;
  document.getElementById("metaDiariaTexto").textContent = `${metaDiaria}h`;
  document.getElementById("metaDiariaRestante").textContent = `${totalHoje.toFixed(1)}h de ${metaDiaria}h`;

  // Meta Semanal
  const metaSemanal = metas.semanal;
  const progressoSemanal = Math.min((totalSemana / metaSemanal) * 100, 100);
  document.getElementById("barraMetaSemanal").style.width = `${progressoSemanal}%`;
  document.getElementById("metaSemanalTexto").textContent = `${metaSemanal}h`;
  document.getElementById("metaSemanalRestante").textContent = `${totalSemana.toFixed(1)}h de ${metaSemanal}h`;

  // Meta Mensal
  const metaMensal = metas.mensal;
  const progressoMensal = Math.min((totalMes / metaMensal) * 100, 100);
  document.getElementById("barraMetaMensal").style.width = `${progressoMensal}%`;
  document.getElementById("metaMensalTexto").textContent = `${metaMensal}h`;
  document.getElementById("metaMensalRestante").textContent = `${totalMes.toFixed(1)}h de ${metaMensal}h`;
}

// Atualizar conquistas separadas
function atualizarConquistasSeparadas() {
  const totalHoras = calcularTotais().totalHoras;
  const streak = parseInt(localStorage.getItem("streak")) || 0;
  const qtdMaterias = materias.length;

  const conquistas = [
    { id: "primeiro-estudo", nome: "⭐ Primeiro Estudo", condicao: totalHoras > 0 },
    { id: "7-dias", nome: "🔥 7 Dias Seguidos", condicao: streak >= 7 },
    { id: "30-dias", nome: "🏆 30 Dias Seguidos", condicao: streak >= 30 },
    { id: "10-horas", nome: "⏱️ 10 Horas Totais", condicao: totalHoras >= 10 },
    { id: "50-horas", nome: "⚡ 50 Horas Totais", condicao: totalHoras >= 50 },
    { id: "100-horas", nome: "💪 100 Horas Totais", condicao: totalHoras >= 100 },
    { id: "5-materias", nome: "📚 5 Matérias", condicao: qtdMaterias >= 5 }
  ];

  const desbloqueadas = conquistas.filter(c => c.condicao);
  const bloqueadas = conquistas.filter(c => !c.condicao);

  const containerDesbloq = document.getElementById("conquistasDesbloqueadas");
  const containerBloq = document.getElementById("conquistasBloqueadas");

  if (desbloqueadas.length > 0) {
    containerDesbloq.innerHTML = desbloqueadas.map(c => `
      <div class="badge desbloqueado">
        <i class="bi bi-check-circle-fill"></i> ${c.nome}
      </div>
    `).join('');
  } else {
    containerDesbloq.innerHTML = '<p class="text-muted">Nenhuma conquista ainda. Continue estudando!</p>';
  }

  if (bloqueadas.length > 0) {
    containerBloq.innerHTML = bloqueadas.map(c => `
      <div class="badge">
        <i class="bi bi-lock-fill"></i> ${c.nome}
      </div>
    `).join('');
  }
}

/* ================= CALCULAR TOTAIS ================= */
function calcularTotais() {
  let totalSegundos = 0;
  let diasEstudados = new Set();
  let maiorStreak = parseInt(localStorage.getItem("streak")) || 0;

  Object.values(tempoEstudo).forEach(materia => {
    if (typeof materia === 'number') {
      totalSegundos += materia;
    } else if (materia.historico) {
      Object.entries(materia.historico).forEach(([data, segundos]) => {
        totalSegundos += segundos;
        diasEstudados.add(data);
      });
    } else if (materia.total) {
      totalSegundos += materia.total;
    }
  });

  const totalHoras = totalSegundos / 3600;
  const dias = diasEstudados.size;
  const mediaDiaria = dias > 0 ? totalHoras / dias : 0;

  return { totalHoras, dias, maiorStreak, mediaDiaria };
}

/* ================= CALCULAR HORAS POR MATÉRIA ================= */
function calcularHorasPorMateria() {
  const materiasEstudo = [];

  materias.forEach(m => {
    const dados = tempoEstudo[m.id];
    let tempo = 0;
    if (dados) {
      if (typeof dados === 'number') {
        tempo = dados;
      } else {
        tempo = dados.total || 0;
      }
    }
    if (tempo > 0) {
      materiasEstudo.push({ nome: m.nome, horas: tempo / 3600 });
    }
  });

  materiasEstudo.sort((a, b) => b.horas - a.horas);
  return materiasEstudo.slice(0, 5);
}

// Função principal
function carregarEstatisticas() {
  // Totais
  const { totalHoras, dias, maiorStreak, mediaDiaria } = calcularTotais();
  document.getElementById("totalGeralEstat").textContent = `${totalHoras.toFixed(1)}h`;
  document.getElementById("diasEstudadosEstat").textContent = dias;
  document.getElementById("maiorStreakEstat").textContent = maiorStreak;
  document.getElementById("mediaDiariaEstat").textContent = `${mediaDiaria.toFixed(1)}h`;

  // Gráfico de matérias (top 5)
  // Gráfico de matérias (barras horizontais)
  const materiasTop = calcularHorasPorMateria();
  const ctxMaterias = document.getElementById('graficoMaterias').getContext('2d');

  // Destruir gráfico anterior se existir
  if (window.graficoMateriasAtual) {
    window.graficoMateriasAtual.destroy();
  }

  window.graficoMateriasAtual = new Chart(ctxMaterias, {
    type: 'bar',
    data: {
      labels: materiasTop.map(m => m.nome),
      datasets: [{
        label: 'Horas Estudadas',
        data: materiasTop.map(m => m.horas),
        backgroundColor: '#9f042c',
        borderRadius: 8,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      }]
    },
    options: {
      indexAxis: 'y', // 👈 ISSO FAZ O GRÁFICO FICAR HORIZONTAL
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.raw.toFixed(1)} horas`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Horas',
            font: { size: 11 }
          },
          grid: { color: '#e5e7eb' }
        },
        y: {
          ticks: {
            font: { size: 11 }
          },
          grid: { display: false }
        }
      }
    }
  });

  // Configurar seletor de período
  document.querySelectorAll('.periodo-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.periodo-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      periodoAtual = btn.dataset.periodo;
      atualizarGraficoPrincipal();
    };
  });

  // Atualizar gráfico inicial
  atualizarGraficoPrincipal();

  // Atualizar metas
  atualizarMetas();

  // Atualizar conquistas
  atualizarConquistasSeparadas();

  // Sugestões
  gerarSugestoes();

  // Resumo
  const resumoEl = document.getElementById("resumoEstatisticas");
  if (resumoEl) {
    resumoEl.innerHTML = `📊 Você já estudou ${totalHoras.toFixed(1)} horas no total! ${dias > 0 ? `Isso dá uma média de ${mediaDiaria.toFixed(1)}h por dia.` : 'Comece hoje!'}`;
  }
}

// Gerar sugestões personalizadas
function gerarSugestoes() {
  const { totalHoras, dias } = calcularTotais();
  const streak = parseInt(localStorage.getItem("streak")) || 0;
  const materiasEstudo = calcularHorasPorMateria();

  const sugestoes = [];

  if (totalHoras === 0) {
    sugestoes.push("📚 Comece seus estudos! Clique em ▶ ao lado de uma matéria.");
  }
  if (streak === 0 && totalHoras > 0) {
    sugestoes.push("🔥 Estude hoje para começar um streak de dias consecutivos!");
  }
  if (streak > 0 && streak < 7) {
    sugestoes.push(`🔥 Você está com ${streak} dia(s) de streak! Mantenha por mais ${7 - streak} dias para ganhar a conquista "7 Dias"!`);
  }
  if (materiasEstudo.length === 0 && totalHoras === 0) {
    sugestoes.push("➕ Adicione matérias no cronograma para começar a estudar!");
  }
  if (sugestoes.length === 0) {
    sugestoes.push("🎉 Parabéns! Você está indo muito bem! Continue assim!");
  }

  const sugestoesLista = document.getElementById("sugestoes");
  if (sugestoesLista) {
    sugestoesLista.innerHTML = sugestoes.map(s => `<li><i class="bi bi-lightbulb"></i> ${s}</li>`).join('')
  }
}



/** ==================== REVISÃO INTELIGENTE ==================== */

let flashcards = [];
let revisoesEmAndamento = [];
let indiceAtualFoco = 0;
let filtroAtivo = "hoje";

// ==================== CARREGAR DADOS ====================
function carregarFlashcards() {
  try {
    const salvos = localStorage.getItem("flashcards_sistema");
    if (salvos) {
      flashcards = JSON.parse(salvos);
    }
  } catch (e) {
    flashcards = [];
  }
  popularFiltroMaterias();  // ← NOVO
  renderizarFlashcardsAgrupados();
  atualizarEstatisticas();
  verificarProvasProximas();
}

function salvarFlashcards() {
  localStorage.setItem("flashcards_sistema", JSON.stringify(flashcards));
}

// ==================== VERIFICAR PROVAS NO CALENDÁRIO ====================
function verificarProvasProximas() {
  if (!calendar) return;
  const hoje = new Date();
  const eventos = calendar.getEvents();
  const provasProximas = [];

  eventos.forEach(evento => {
    // Só considera se for do tipo "prova"
    if (evento.extendedProps?.tipo !== "prova") return;

    const dataEvento = new Date(evento.start);
    const diasRestantes = Math.ceil((dataEvento - hoje) / (1000 * 60 * 60 * 24));
    if (diasRestantes <= 7 && diasRestantes > 0) {
      provasProximas.push({
        titulo: evento.title,
        data: dataEvento,
        dias: diasRestantes
      });
    }
  });

  if (provasProximas.length > 0) {
    const avisoDiv = document.getElementById("avisoProva");
    const textoAviso = document.getElementById("textoAvisoProva");

    if (avisoDiv && textoAviso && provasProximas[0]) {
      const prova = provasProximas[0];
      textoAviso.innerHTML = `${prova.titulo} - Faltam ${prova.dias} dias!`;
      avisoDiv.style.display = "block";
      window.provaAtual = prova;
    }
  }
}

function criarRevisaoPorProva() {
  if (window.provaAtual) {
    abrirModalFlashcardComProva(window.provaAtual.titulo);
  }
}

//REVISAO
function configurarAbasRevisao() {
  document.querySelectorAll('.aba-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const aba = btn.dataset.aba;
      document.getElementById('abaMeusCards').style.display = aba === 'meusCards' ? 'block' : 'none';
      document.getElementById('abaRevisar').style.display = aba === 'revisar' ? 'block' : 'none';

      if (aba === 'revisar') {
        atualizarMensagemRevisar();
      }

      // Recarrega os cards com o filtro atual
      renderizarFlashcardsAgrupados();
    });
  });
}

// NOVO: Atualizar mensagem da aba revisar
function atualizarMensagemRevisar() {
  const hojeData = hoje();
  const pendentes = flashcards.filter(f => f.dataProxima <= hojeData).length;
  document.getElementById('countPendentes').textContent = pendentes;
}

// NOVO: Renderizar flashcards agrupados com acordeão
function renderizarFlashcardsAgrupados() {
  const container = document.getElementById('listaFlashcardsAgrupada');
  if (!container) return;

  // Pega o filtro de matéria
  const filtroMateria = document.getElementById('filtroMateriaRevisao')?.value || 'todas';

  // Filtra por matéria se necessário
  let cardsFiltrados = [...flashcards];
  if (filtroMateria !== 'todas') {
    cardsFiltrados = cardsFiltrados.filter(f => f.materiaId === filtroMateria);
  }

  if (cardsFiltrados.length === 0) {
    container.innerHTML = '<p class="vazio">✨ Nenhum flashcard encontrado!</p>';
    return;
  }

  // Agrupar por matéria
  const porMateria = {};
  cardsFiltrados.forEach(f => {
    if (!porMateria[f.materiaNome]) {
      porMateria[f.materiaNome] = { temas: {}, count: 0 };
    }
    if (!porMateria[f.materiaNome].temas[f.tema]) {
      porMateria[f.materiaNome].temas[f.tema] = [];
    }
    porMateria[f.materiaNome].temas[f.tema].push(f);
    porMateria[f.materiaNome].count++;
  });

  // Ordenar cards dentro de cada tema
  const ordenarCards = (cards) => {
    const hojeData = hoje();
    return cards.sort((a, b) => {
      const aAtrasado = a.dataProxima < hojeData;
      const bAtrasado = b.dataProxima < hojeData;
      if (aAtrasado && !bAtrasado) return -1;
      if (!aAtrasado && bAtrasado) return 1;
      return a.dataProxima.localeCompare(b.dataProxima);
    });
  };

  // Renderizar com acordeão
  let html = '';
  let index = 0;

  for (const materia in porMateria) {
    const materiaData = porMateria[materia];
    const materiaId = `materia-${index}`;

    html += `
      <div class="materia-acordeon">
        <div class="materia-header" onclick="toggleAcordeon('${materiaId}')">
          <div class="materia-titulo">
            <i class="bi bi-journal-bookmark-fill"></i>
            <h3>${materia}</h3>
            <span class="materia-badge-count">${materiaData.count}</span>
          </div>
          <span class="materia-seta" id="${materiaId}-seta">▶</span>
        </div>
        <div class="materia-conteudo" id="${materiaId}-conteudo">
    `;

    for (const tema in materiaData.temas) {
      const cards = ordenarCards(materiaData.temas[tema]);
      const temaCount = cards.length;

      html += `
        <div class="tema-grupo">
          <div class="tema-header">
            <i class="bi bi-folder2"></i>
            <h4>${tema}</h4>
            <span class="tema-badge-count">${temaCount}</span>
          </div>
      `;

      cards.forEach(f => {
        const isAtrasada = f.dataProxima < hoje();
        const isHoje = f.dataProxima === hoje();
        const classeDestaque = isAtrasada ? 'atrasada' : (isHoje ? 'hoje' : '');

        html += `
          <div class="card-flashcard ${classeDestaque}">
            <div class="card-pergunta">${f.pergunta}</div>
            <div class="card-data">📅 ${formatarData(f.dataProxima)}</div>
            <div class="card-acoes">
              <button onclick="editarFlashcard(${f.id})" title="Editar">✏️</button>
              <button onclick="excluirFlashcard(${f.id})" title="Excluir">🗑️</button>
            </div>
          </div>
        `;
      });

      html += `</div>`;
    }

    html += `
        </div>
      </div>
    `;
    index++;
  }

  container.innerHTML = html;
}

// NOVO: Função para toggle do acordeão
function toggleAcordeon(materiaId) {
  const conteudo = document.getElementById(`${materiaId}-conteudo`);
  const seta = document.getElementById(`${materiaId}-seta`);

  if (conteudo.style.display === 'block') {
    conteudo.style.display = 'none';
    seta.classList.remove('aberto');
    seta.textContent = '▶';
  } else {
    conteudo.style.display = 'block';
    seta.classList.add('aberto');
    seta.textContent = '▼';
  }
}

// NOVO: Formatar data
function formatarData(dataStr) {
  const data = new Date(dataStr);
  return data.toLocaleDateString('pt-BR');
}

// ==================== MODAL E CRIAÇÃO ====================
function abrirModalFlashcard() {
  const select = document.getElementById("revisaoMateria");
  if (select && materias) {
    select.innerHTML = '<option value="">Selecione uma matéria</option>';
    materias.forEach(m => {
      select.innerHTML += `<option value="${m.id}">${m.nome}</option>`;
    });
  }

  document.getElementById("revisaoTema").value = "";
  document.getElementById("revisaoPergunta").value = "";
  document.getElementById("revisaoResposta").value = "";

  const modal = new bootstrap.Modal(document.getElementById("modalRevisao"));
  modal.show();
}

function abrirModalFlashcardComProva(tituloProva) {
  // Popular o select de matérias também!
  const select = document.getElementById("revisaoMateria");
  if (select && materias) {
    select.innerHTML = '<option value="">Selecione uma matéria</option>';
    materias.forEach(m => {
      select.innerHTML += `<option value="${m.id}">${m.nome}</option>`;
    });
  }

  document.getElementById("revisaoTema").value = "Prova";
  document.getElementById("revisaoPergunta").value = `Revisar conteúdo da prova: ${tituloProva}`;
  document.getElementById("revisaoResposta").value = "Revisar todos os conteúdos relacionados";

  const modal = new bootstrap.Modal(document.getElementById("modalRevisao"));
  modal.show();
}

function salvarFlashcard() {
  const materiaId = document.getElementById("revisaoMateria").value;
  const tema = document.getElementById("revisaoTema").value.trim();
  const pergunta = document.getElementById("revisaoPergunta").value.trim();
  const resposta = document.getElementById("revisaoResposta").value.trim();

  if (!materiaId) {
    Swal.fire("Erro", "Selecione uma matéria!", "error");
    return;
  }
  if (!pergunta || !resposta) {
    Swal.fire("Erro", "Preencha pergunta e resposta!", "error");
    return;
  }

  const materia = materias.find(m => m.id == materiaId);

  flashcards.push({
    id: Date.now(),
    materiaId: materiaId,
    materiaNome: materia ? materia.nome : "Matéria",
    tema: tema || "Geral",
    pergunta: pergunta,
    resposta: resposta,
    nivel: 0,
    dataProxima: hoje(),
    acertos: 0,
    erros: 0,
    tipo: "flashcard"
  });

  salvarFlashcards();
  renderizarFlashcardsAgrupados();
  atualizarEstatisticas();

  bootstrap.Modal.getInstance(document.getElementById("modalRevisao")).hide();
  Swal.fire({
    icon: 'success',
    title: 'Flashcard criado!',
    timer: 1500,
    showConfirmButton: false
  });
}

// ==================== RENDERIZAR LISTA ====================
function hoje() {
  return new Date().toISOString().split("T")[0];
}

function proximaRevisao(nivel, dificuldade) {
  let dias = [1, 3, 7, 14, 30];
  if (dificuldade === "facil") dias = [3, 7, 14, 30, 60];
  if (dificuldade === "dificil") dias = [0.5, 1, 3, 7, 14];

  const data = new Date();
  data.setDate(data.getDate() + dias[nivel]);
  return data.toISOString().split("T")[0];
}

function renderizarFlashcards() {
  const container = document.getElementById("listaFlashcards");
  if (!container) return;

  let flashcardsFiltrados = [...flashcards];

  // Aplicar filtros
  // Filtro por tipo
  const tipoFiltro = document.getElementById("filtroTipo")?.value;
  if (tipoFiltro) {
    flashcardsFiltrados = flashcardsFiltrados.filter(f => f.tipo === tipoFiltro);
  }
  if (filtroAtivo === "hoje") {
    flashcardsFiltrados = flashcardsFiltrados.filter(f => f.dataProxima === hoje());
  } else if (filtroAtivo === "atrasadas") {
    flashcardsFiltrados = flashcardsFiltrados.filter(f => f.dataProxima < hoje());
  } else if (filtroAtivo === "semana") {
    const semanaQueVem = new Date();
    semanaQueVem.setDate(semanaQueVem.getDate() + 7);
    flashcardsFiltrados = flashcardsFiltrados.filter(f => f.dataProxima <= semanaQueVem.toISOString().split("T")[0]);
  }

  const materiaFiltro = document.getElementById("filtroMateria")?.value;
  if (materiaFiltro && materiaFiltro !== "") {
    flashcardsFiltrados = flashcardsFiltrados.filter(f => String(f.materiaId) === String(materiaFiltro));
  }
  const busca = document.getElementById("buscaRevisao")?.value.toLowerCase();
  if (busca) {
    flashcardsFiltrados = flashcardsFiltrados.filter(f =>
      f.pergunta.toLowerCase().includes(busca) ||
      f.resposta.toLowerCase().includes(busca) ||
      f.tema.toLowerCase().includes(busca)
    );
  }

  // Ordenar: atrasadas primeiro
  flashcardsFiltrados.sort((a, b) => {
    if (a.dataProxima < hoje() && b.dataProxima >= hoje()) return -1;
    if (a.dataProxima >= hoje() && b.dataProxima < hoje()) return 1;
    return a.dataProxima.localeCompare(b.dataProxima);
  });

  if (flashcardsFiltrados.length === 0) {
    container.innerHTML = '<div class="empty-message">🎉 Nenhum flashcard encontrado!</div>';
  } else {
    container.innerHTML = flashcardsFiltrados.map(f => criarCardHTML(f)).join('');
  }

  atualizarEstatisticas();
  adicionarEventosCards();
}

function criarCardHTML(flashcard) {
  const isAtrasada = flashcard.dataProxima < hoje();
  const dataFormatada = new Date(flashcard.dataProxima).toLocaleDateString();

  // Calcular dias até a próxima revisão
  const hojeDate = new Date();
  const proximaDate = new Date(flashcard.dataProxima);
  const diffTime = proximaDate - hojeDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let mensagemRevisao = "";
  if (isAtrasada) {
    mensagemRevisao = `<span style="color: #ef4444; font-size: 0.7rem;">⚠️ Atrasada! Revise hoje!</span>`;
  } else if (diffDays === 0) {
    mensagemRevisao = `<span style="color: #22c55e; font-size: 0.7rem;">📅 Hoje! Revise agora!</span>`;
  } else if (diffDays === 1) {
    mensagemRevisao = `<span style="color: #f59e0b; font-size: 0.7rem;">⏰ Amanhã</span>`;
  } else {
    mensagemRevisao = `<span style="color: #6b7280; font-size: 0.7rem;">🔄 Próxima revisão em ${diffDays} dias</span>`;
  }

  return `
    <div class="flashcard-item" data-id="${flashcard.id}">
      <div class="flashcard-header">
        <div class="flashcard-badges">
          <span class="materia-badge">${flashcard.materiaNome}</span>
          <span class="tema-badge">📂 ${flashcard.tema}</span>
          <span class="data-badge ${isAtrasada ? 'atrasada' : ''}">
            ${isAtrasada ? '⚠️ Atrasada' : '📅 ' + dataFormatada}
          </span>
        </div>
      </div>
      <div class="flashcard-pergunta">${flashcard.pergunta}</div>
      <div class="flashcard-resposta">${flashcard.resposta}</div>
      <div style="margin-top: 8px; font-size: 0.7rem;">
        ${mensagemRevisao}
      </div>
      <div class="flashcard-acoes">
        <button class="btn-editar-flashcard" onclick="editarFlashcard(${flashcard.id})">✏️ Editar</button>
        <button class="btn-excluir-flashcard" onclick="excluirFlashcard(${flashcard.id})">🗑️ Excluir</button>
        <button class="btn-iniciar-revisao" onclick="iniciarRevisao()">▶️ Revisar</button>
      </div>
    </div>
  `;
}
function adicionarEventosCards() {
  document.querySelectorAll('.flashcard-item').forEach(card => {
    const pergunta = card.querySelector('.flashcard-pergunta');
    const resposta = card.querySelector('.flashcard-resposta');

    card.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      if (resposta.style.display === 'none' || !resposta.style.display) {
        resposta.style.display = 'block';
      } else {
        resposta.style.display = 'none';
      }
    });
  });
}

// ==================== ESTATÍSTICAS ====================
function atualizarEstatisticas() {
  const hojeData = hoje();
  const revisoesHoje = flashcards.filter(f => f.dataProxima === hojeData).length;
  const revisoesAtrasadas = flashcards.filter(f => f.dataProxima < hojeData).length;
  const revisoesConcluidas = flashcards.filter(f => f.nivel > 0).length;

  const totalAcertos = flashcards.reduce((sum, f) => sum + f.acertos, 0);
  const totalRespostas = flashcards.reduce((sum, f) => sum + f.acertos + f.erros, 0);
  const taxaAcerto = totalRespostas > 0 ? Math.round((totalAcertos / totalRespostas) * 100) : 0;

  document.getElementById("totalHoje").textContent = revisoesHoje;
  document.getElementById("totalAtrasadas").textContent = revisoesAtrasadas;
  document.getElementById("totalConcluidas").textContent = revisoesConcluidas;
  document.getElementById("taxaAcertoGeral").textContent = `${taxaAcerto}%`;
}

// ==================== MODO FOCO ====================
function iniciarRevisao() {
  const hojeData = hoje();
  const filtroMateria = document.getElementById('filtroMateriaRevisao')?.value || 'todas';

  // Filtra cards pendentes
  let cardsPendentes = flashcards.filter(f => f.dataProxima <= hojeData);

  // Aplica filtro de matéria
  if (filtroMateria !== 'todas') {
    cardsPendentes = cardsPendentes.filter(f => f.materiaId === filtroMateria);
  }

  if (cardsPendentes.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'Nenhuma revisão pendente!',
      text: filtroMateria !== 'todas' ?
        'Não há cards para revisar nesta matéria.' :
        'Você já revisou tudo por hoje. Volte amanhã!',
      timer: 2000,
      showConfirmButton: false
    });
    return;
  }

  revisoesEmAndamento = cardsPendentes;
  indiceAtualFoco = 0;
  mostrarCardFoco();
}

// NOVO: Mostrar card no modo foco
function mostrarCardFoco() {
  if (indiceAtualFoco >= revisoesEmAndamento.length) {
    finalizarRevisao();
    return;
  }

  const card = revisoesEmAndamento[indiceAtualFoco];

  document.getElementById('focoMateria').textContent = card.materiaNome;
  document.getElementById('focoTema').textContent = `📂 ${card.tema}`;
  document.getElementById('focoPergunta').textContent = card.pergunta;
  document.getElementById('focoResposta').innerHTML = card.resposta;
  document.getElementById('focoResposta').style.display = 'none';
  document.getElementById('botoesResposta').style.display = 'none';
  document.getElementById('btnMostrarResposta').style.display = 'block';

  const total = revisoesEmAndamento.length;
  const atual = indiceAtualFoco + 1;
  document.getElementById('focoContador').textContent = `Card ${atual} de ${total}`;

  const progresso = (atual / total) * 100;
  document.getElementById('focoProgressoBarra').style.width = `${progresso}%`;

  document.getElementById('modoFocoContainer').style.display = 'flex';
}

// NOVO: Popular select de matérias no filtro
function popularFiltroMaterias() {
  const select = document.getElementById('filtroMateriaRevisao');
  if (!select) return;

  select.innerHTML = '<option value="todas">📚 Todas as matérias</option>';

  // Pega matérias únicas dos flashcards
  const materiasUnicas = [...new Set(flashcards.map(f => f.materiaNome))];

  materiasUnicas.sort().forEach(materia => {
    select.innerHTML += `<option value="${materia}">${materia}</option>`;
  });
}

// Mostrar resposta e botões
function mostrarRespostaFoco() {
  document.getElementById('focoResposta').style.display = 'block';
  document.getElementById('btnMostrarResposta').style.display = 'none';
  document.getElementById('botoesResposta').style.display = 'flex';
}

// NOVO: Responder com Acertou/Errou
function responderFlashcard(resultado) {
  const card = revisoesEmAndamento[indiceAtualFoco];
  const flashcardOriginal = flashcards.find(f => f.id === card.id);

  if (!flashcardOriginal) return;

  if (resultado === 'acertei') {
    // Aumenta o nível (espaça mais)
    flashcardOriginal.nivel = Math.min(flashcardOriginal.nivel + 1, 4);
    flashcardOriginal.acertos++;
  } else {
    // Diminui o nível (revisar mais vezes)
    flashcardOriginal.nivel = Math.max(flashcardOriginal.nivel - 1, 0);
    flashcardOriginal.erros++;
  }

  // Define próxima data baseado no nível
  const intervalos = [1, 3, 7, 14, 30]; // dias
  const dias = intervalos[flashcardOriginal.nivel] || 1;
  const novaData = new Date();
  novaData.setDate(novaData.getDate() + dias);
  flashcardOriginal.dataProxima = novaData.toISOString().split('T')[0];
  salvarFlashcards();
  atualizarEstatisticas();
  indiceAtualFoco++;
  mostrarCardFoco();
}


function finalizarRevisao() {
  document.getElementById("modoFocoContainer").style.display = "none";
  renderizarFlashcards();

  Swal.fire({
    icon: 'success',
    title: '🎉 Revisão concluída!',
    text: 'Parabéns! Você revisou tudo por hoje.',
    timer: 2000,
    showConfirmButton: false
  });
}

function fecharModoFoco() {
  document.getElementById("modoFocoContainer").style.display = "none";
}

// ==================== EDITAR E EXCLUIR ====================
function editarFlashcard(id) {
  const flashcard = flashcards.find(f => f.id === id);
  if (!flashcard) return;

  Swal.fire({
    title: 'Editar Flashcard',
    html: `
      <input id="editPergunta" class="swal2-input" value="${flashcard.pergunta.replace(/"/g, '&quot;')}">
      <textarea id="editResposta" class="swal2-textarea" rows="3">${flashcard.resposta.replace(/"/g, '&quot;')}</textarea>
      <input id="editTema" class="swal2-input" value="${flashcard.tema}">
    `,
    confirmButtonText: 'Salvar',
    showCancelButton: true,
    preConfirm: () => {
      const pergunta = document.getElementById('editPergunta').value;
      const resposta = document.getElementById('editResposta').value;
      const tema = document.getElementById('editTema').value;

      if (!pergunta || !resposta) {
        Swal.showValidationMessage('Preencha todos os campos!');
        return false;
      }

      flashcard.pergunta = pergunta;
      flashcard.resposta = resposta;
      flashcard.tema = tema || "Geral";
      salvarFlashcards();
      renderizarFlashcardsAgrupados();
      atualizarEstatisticas();

      Swal.fire('Atualizado!', '', 'success');
    }
  });
}

function excluirFlashcard(id) {
  Swal.fire({
    title: 'Excluir flashcard?',
    text: 'Essa ação não pode ser desfeita!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      flashcards = flashcards.filter(f => f.id !== id);
      salvarFlashcards();
      renderizarFlashcardsAgrupados();
      atualizarEstatisticas();
      Swal.fire('Excluído!', '', 'success');
    }
  });
}

// ==================== FILTROS ====================
function configurarFiltros() {
  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filtroAtivo = btn.dataset.filtro;
      renderizarFlashcards();
    });
  });

  document.getElementById("filtroMateria")?.addEventListener('change', () => renderizarFlashcards());
  document.getElementById("buscaRevisao")?.addEventListener('input', () => renderizarFlashcards());
}

// ==================== MODAL FLASHCARD HTML ====================
// Adicione este modal no final do body
function adicionarModalFlashcardHTML() {
  if (document.getElementById("modalRevisao")) {
    // console.log("Modal já existe no HTML");
    return;
  }

  const modalHTML = `
    <div class="modal fade modal-flashcard" id="modalRevisao" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">🧠 Novo Flashcard</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-bold">📚 Matéria</label>
              <select id="revisaoMateria" class="form-select">
                <option value="">Selecione uma matéria</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">📂 Tema</label>
              <input type="text" id="revisaoTema" class="form-control" placeholder="Ex: Citologia, Funções...">
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">❓ Pergunta</label>
              <textarea id="revisaoPergunta" class="form-control" rows="2" placeholder="Digite a pergunta..."></textarea>
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">✅ Resposta</label>
              <textarea id="revisaoResposta" class="form-control" rows="3" placeholder="Digite a resposta..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-danger" onclick="salvarFlashcard()">Salvar Flashcard</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}
// ==================== INICIALIZAR ====================
function initRevisao() {
  adicionarModalFlashcardHTML();
  carregarFlashcards();
  configurarAbasRevisao();
}

// Chamar no DOMContentLoaded
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initRevisao();
  });
}


function exportarDados() {
  const dados = {
    tarefas: tarefas,
    notas: notas,
    eventos: calendar?.getEvents().map(e => ({ title: e.title, start: e.startStr })),
    tempoEstudo: tempoEstudo,
    metas: metas,
    flashcards: flashcards
  };
  const dataStr = JSON.stringify(dados, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sectio_aurea_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  Swal.fire({ icon: 'success', title: 'Exportado!', text: 'Backup salvo com sucesso!', timer: 2000, showConfirmButton: false });
}


// Adicione esta linha dentro do DOMContentLoaded principal
// loadDarkModePreference();

// ===== NOTIFICAÇÕES DE TAREFAS =====
function verificarNotificacoesTarefas() {
  // Verifica se o navegador suporta notificações
  if (!("Notification" in window)) {
    console.log("Este navegador não suporta notificações");
    return;
  }

  // Pede permissão se ainda não tiver
  if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
  }

  if (Notification.permission !== "granted") return;

  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);
  const amanhaStr = amanha.toISOString().split('T')[0];

  // Busca tarefas para amanhã
  const tarefasAmanha = tarefas.filter(t => t.data === amanhaStr && !t.concluida);

  // Verifica se já notificou hoje
  const ultimaNotificacao = localStorage.getItem('ultimaNotificacaoTarefas');
  const hojeStr = hoje.toISOString().split('T')[0];

  if (tarefasAmanha.length > 0 && ultimaNotificacao !== hojeStr) {
    const titulo = `📋 Você tem ${tarefasAmanha.length} tarefa(s) para amanhã!`;
    const corpo = tarefasAmanha.map(t => `• ${t.titulo} (${t.prioridade})`).join('\n');

    new Notification(titulo, { body: corpo, icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' });
    localStorage.setItem('ultimaNotificacaoTarefas', hojeStr);
  }
}

// Chamar a função uma vez por dia
setInterval(() => {
  verificarNotificacoesTarefas();
}, 3600000); // a cada hora

// Chamar também ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(verificarNotificacoesTarefas, 5000);
});

// ==================== FORÇAR ATUALIZAÇÃO IMEDIATA ====================
function forcarAtualizacaoImediata() {
  // Atualiza tudo AGORA, sem delay
  if (typeof atualizarTudo === 'function') atualizarTudo();
  if (typeof renderizarTarefas === 'function') renderizarTarefas();
  if (typeof renderizarFlashcardsAgrupados === 'function') renderizarFlashcardsAgrupados();
  if (typeof atualizarResumoInicio === 'function') atualizarResumoInicio();
  if (typeof atualizarPainelEstudos === 'function') atualizarPainelEstudos();

  // Força o calendário a redimensionar
  if (calendar) setTimeout(() => calendar.updateSize(), 10);
}

// Executa AGORA (sem esperar eventos)
setTimeout(forcarAtualizacaoImediata, 10);
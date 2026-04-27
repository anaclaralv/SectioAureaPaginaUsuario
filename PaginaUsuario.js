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
  if (tela === "estatistica" && !verificarAcesso('estatisticas')) return;
  if (tela === "cronogramaNovo" && !verificarAcesso('cronograma')) return;
  const telas = [
    "inicio", "tarefas", "notas", "calendario", "relogio",
    "estatistica", "cronogramaNovo", "metodos", "revisao", "planos"
  ];

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
      if (calendar && typeof calendar.updateSize === 'function') {
        calendar.updateSize();
      }
    }, 100);
  }

  if (tela === "cronogramaNovo") {
    renderCronogramaNovo();
  }

  if (tela === "estatistica") {
    setTimeout(() => {
      if (typeof carregarEstatisticas === 'function') {
        carregarEstatisticas();
      }
    }, 100);
  }

  if (tela === "relogio") {
    renderTabelaMaterias();
  }
  if (tela === "planos") {
    atualizarBotoesPlanos();
  }
}// CONEXÃO COM EFEITO
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
function corPrioridade(prioridade) {
  if (prioridade === "alta") return "#ef4444";   // vermelho
  if (prioridade === "media") return "#f5d60b";  // laranja
  if (prioridade === "baixa") return "#22c55e";  // verde
  return "#6b7280";
}
// garante que os botões onclick encontrem as funções
window.adicionarTarefa = adicionarTarefa;
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
          title: `${t.titulo}`,
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

      console.log('Movendo evento:', titulo, 'para', novaData);

      // Atualiza tarefa se necessário
      if (props?.isTarefa) {
        const tarefaId = props.tarefaId;
        const tarefa = tarefas.find(t => t.id === tarefaId);
        if (tarefa) {
          tarefa.data = novaData;
          salvarTarefas();
        }
      }
      event.remove();
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
            <i class="bi bi-star-fill estrela ${nota.favorito ? 'favorito' : ''}" data-nota-id="${nota.id}" style="cursor:pointer; font-size:1.5rem;"></i>
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
      listaHojeCronograma.innerHTML = "<li>Sem matérias hoje</li>";
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
  configurarFiltroRevisao();
  initToggleNotificacoes();
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
  closeSidebarOnLinkClick();
  aplicarBloqueiosPlano();
  atualizarBadgePlano();
  renderizarHistoricoCronometro();
  mostrarTourBoasVindas();
  if (typeof calendar !== "undefined" && calendar) {
    atualizarEventosTarefas();
    atualizarResumoInicio();
  }
  atualizarTudo();

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
    lista.innerHTML = "<li>Sem atividades hoje</li>";
    return;
  }
  blocosHoje.forEach(bloco => {
    const li = document.createElement("li");
    li.textContent = `${bloco.inicio} - ${bloco.fim} : ${bloco.materia.nome}`;
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
// ===== ADICIONAR MATÉRIA (NOVA) =====
function adicionarMateria() {
  const inputNome = document.getElementById("novaMateriaNome");
  const inputCor = document.getElementById("novaMateriaCor");

  if (!inputNome || !inputCor) return;

  const nome = inputNome.value.trim();
  const cor = inputCor.value;

  if (!nome) {
    Swal.fire({
      icon: 'warning',
      title: 'Ops!',
      text: 'Digite o nome da matéria!',
      timer: 2000,
      showConfirmButton: false
    });
    return;
  }

  // Verificar se já existe
  const existe = materias.some(m => m.nome.toLowerCase() === nome.toLowerCase());
  if (existe) {
    Swal.fire({
      icon: 'error',
      title: 'Já existe!',
      text: `A matéria "${nome}" já foi cadastrada.`,
      timer: 2000,
      showConfirmButton: false
    });
    return;
  }

  const novaMateria = {
    id: Date.now().toString(),
    nome: nome,
    cor: cor
  };

  materias.push(novaMateria);
  salvarMaterias();

  inputNome.value = "";
  inputCor.value = "#9f042c";

  renderMaterias();
  renderCronogramaNovo();
  renderTabelaMaterias();

  Swal.fire({
    icon: 'success',
    title: 'Pronto!',
    text: `Matéria "${nome}" adicionada!`,
    timer: 1500,
    showConfirmButton: false,
    position: 'top-end',
    toast: true
  });
}

// ===== RENDERIZAR MATÉRIAS (NOVA) =====
function renderMaterias() {
  const container = document.getElementById("materiasContainer");
  if (!container) return;

  container.innerHTML = "";

  if (materias.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #9ca3af; width: 100%;">Nenhuma matéria cadastrada. Adicione acima!</p>';
    return;
  }

  materias.forEach(m => {
    const div = document.createElement("div");
    div.classList.add("materia-bloco");
    div.style.background = m.cor;
    div.textContent = m.nome;
    div.id = m.id;
    div.draggable = true;

    div.ondragstart = (e) => {
      e.dataTransfer.setData("text/plain", m.id);
    };

    // Duplo clique para editar
    div.addEventListener("dblclick", () => {
      Swal.fire({
        title: 'Editar Matéria',
        html: `
          <input type="text" id="editNome" class="swal2-input" value="${m.nome}">
          <input type="color" id="editCor" class="swal2-input" value="${m.cor}">
        `,
        showCancelButton: true,
        confirmButtonText: 'Salvar'
      }).then(result => {
        if (result.isConfirmed) {
          const novoNome = document.getElementById('editNome').value.trim();
          const novaCor = document.getElementById('editCor').value;
          if (novoNome) {
            m.nome = novoNome;
            m.cor = novaCor;
            cronogramaNovo.forEach(bloco => {
              if (bloco.materia.id === m.id) {
                bloco.materia.nome = novoNome;
                bloco.materia.cor = novaCor;
              }
            });
            salvarMaterias();
            salvarCronogramaNovo();
            renderMaterias();
            renderCronogramaNovo();
          }
        }
      });
    });    // Duplo clique para editar OU excluir
    div.addEventListener("dblclick", () => {
      Swal.fire({
        title: 'Editar Matéria',
        html: `
          <input type="text" id="editNome" class="swal2-input" value="${m.nome}">
          <input type="color" id="editCor" class="swal2-input" value="${m.cor}">
        `,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Salvar',
        denyButtonText: 'Excluir'
      }).then(result => {
        if (result.isConfirmed) {
          const novoNome = document.getElementById('editNome').value.trim();
          const novaCor = document.getElementById('editCor').value;
          if (novoNome) {
            m.nome = novoNome;
            m.cor = novaCor;
            salvarMaterias();
            renderMaterias();
            renderCronogramaNovo();
          }
        } else if (result.isDenied) {
          Swal.fire({
            title: 'Excluir ' + m.nome + '?',
            text: 'Também será removida do cronograma!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir',
            confirmButtonColor: '#dc3545'
          }).then(confirmResult => {
            if (confirmResult.isConfirmed) {
              materias = materias.filter(mat => mat.id !== m.id);
              cronogramaNovo = cronogramaNovo.filter(b => b.materia.id !== m.id);
              salvarMaterias();
              salvarCronogramaNovo();
              renderMaterias();
              renderCronogramaNovo();
              renderTabelaMaterias();
              renderizarResumoHoje();
            }
          });
        }
      });
    });
    container.appendChild(div);
  });
}

// ===== RENDERIZAR CRONOGRAMA (NOVA) =====
function renderCronogramaNovo() {
  const dias = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];

  dias.forEach(dia => {
    const coluna = document.getElementById(dia);
    if (!coluna) return;

    coluna.innerHTML = `
      <h5>${dia.charAt(0).toUpperCase() + dia.slice(1)}</h5>
      <div class="dia-drop"></div>
    `;

    const dropArea = coluna.querySelector(".dia-drop");

    const blocos = cronogramaNovo
      .filter(b => b.dia === dia)
      .sort((a, b) => a.inicio.localeCompare(b.inicio));

    blocos.forEach(bloco => {
      const div = document.createElement("div");
      div.classList.add("bloco-materia");
      div.style.background = bloco.materia.cor || '#9f042c';
      div.textContent = `${bloco.materia.nome} (${bloco.inicio} - ${bloco.fim})`;

      div.addEventListener("dblclick", () => {
        Swal.fire({
          title: 'Editar Horário',
          html: `
            <input type="time" id="editInicio" class="swal2-input" value="${bloco.inicio}">
            <input type="time" id="editFim" class="swal2-input" value="${bloco.fim}">
          `,
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: 'Salvar',
          denyButtonText: 'Excluir'
        }).then(result => {
          if (result.isConfirmed) {
            const inicio = document.getElementById('editInicio').value;
            const fim = document.getElementById('editFim').value;
            if (inicio && fim && fim > inicio) {
              bloco.inicio = inicio;
              bloco.fim = fim;
              salvarCronogramaNovo();
              renderCronogramaNovo();
            }
          } else if (result.isDenied) {
            cronogramaNovo = cronogramaNovo.filter(b => b.id !== bloco.id);
            salvarCronogramaNovo();
            renderCronogramaNovo();
            renderizarResumoHoje();
          }
        });
      });

      dropArea.appendChild(div);
    });
  });
}

// ===== DROP (NOVO) =====
function drop(ev) {
  ev.preventDefault();

  const materiaId = ev.dataTransfer.getData("text/plain");
  const materia = materias.find(m => m.id === materiaId);
  const dia = ev.target.closest('.dia')?.id;

  if (!materia || !dia) return;

  Swal.fire({
    title: `Horário de ${materia.nome}`,
    html: `
      <div style="display: flex; gap: 10px; justify-content: center;">
        <div>
          <label>Início</label>
          <input type="time" id="inicio" class="swal2-input" value="08:00">
        </div>
        <div>
          <label>Fim</label>
          <input type="time" id="fim" class="swal2-input" value="09:00">
        </div>
      </div>
    `,
    confirmButtonText: 'Salvar',
    showCancelButton: true,
    preConfirm: () => {
      const inicio = document.getElementById("inicio").value;
      const fim = document.getElementById("fim").value;

      if (!inicio || !fim || fim <= inicio) {
        Swal.showValidationMessage("Horário inválido!");
        return false;
      }

      return { inicio, fim };
    }
  }).then(result => {
    if (result.isConfirmed) {
      cronogramaNovo.push({
        id: Date.now(),
        materia: materia,
        dia: dia,
        inicio: result.value.inicio,
        fim: result.value.fim
      });

      salvarCronogramaNovo();
      renderCronogramaNovo();
      renderizarResumoHoje();
      atualizarMateriaAgora();
    }
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

function atualizarMateriaAgora() {
  if (typeof materias === 'undefined') {
    try {
      materias = JSON.parse(localStorage.getItem("materias")) || [];
    } catch (e) {
      materias = [];
    }
  }
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

  const modoFocoAtivo = document.getElementById("modoFocoContainer")?.style.display === "flex";

  if (!modoFocoAtivo && modoEstudo === "auto") {
    if (blocoAtual) {
      const idMateria = blocoAtual.materia.id;
      if (estudoAtual !== idMateria && typeof iniciarEstudo === 'function') {
        if (estudoAtual) pausarEstudo();
        iniciarEstudo(idMateria);
      }

      // SÓ MOSTRA NOTIFICAÇÃO SE ESTIVER ATIVADA
      if (notificacoesAtivas && notificarMudanca && materiaAnterior !== idMateria) {
        Swal.fire({
          icon: "info",
          title: "Hora de estudar!",
          text: `Agora e ${blocoAtual.materia.nome}`,
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
// Variável global para controlar notificações
let notificacoesAtivas = true;

// Carregar preferência salva
try {
  const saved = localStorage.getItem("notificacoesAtivas");
  if (saved !== null) {
    notificacoesAtivas = saved === "true";
  }
} catch (e) {
  notificacoesAtivas = true;
}

function toggleNotificacoes() {
  const checkbox = document.getElementById("toggleNotificacoes");
  const slider = document.getElementById("toggleNotificacoesSlider");

  if (checkbox) {
    notificacoesAtivas = checkbox.checked;
    localStorage.setItem("notificacoesAtivas", notificacoesAtivas);

    if (slider) {
      if (notificacoesAtivas) {
        slider.style.backgroundColor = "#22c55e";
      } else {
        slider.style.backgroundColor = "#d1d5db";
      }
    }

    if (notificacoesAtivas) {
      Swal.fire({
        icon: 'success',
        title: 'Notificacoes ativadas',
        text: 'Voce recebera alertas quando for hora de estudar.',
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
      });
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Notificacoes desativadas',
        text: 'Voce nao recebera mais alertas automaticos.',
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
      });
    }
  }
}

// Inicializar o toggle ao carregar a página
function initToggleNotificacoes() {
  const checkbox = document.getElementById("toggleNotificacoes");
  const slider = document.getElementById("toggleNotificacoesSlider");

  if (checkbox) {
    checkbox.checked = notificacoesAtivas;
  }

  if (slider) {
    if (notificacoesAtivas) {
      slider.style.backgroundColor = "#22c55e";
    } else {
      slider.style.backgroundColor = "#d1d5db";
    }
  }
}
let intervaloEstudo;
// Atualizar relógio inteligente a cada 10 segundos
setInterval(() => {
  if (typeof atualizarRelogioInfo === 'function') {
    atualizarRelogioInfo();
  }
}, 10000);

// Atualizar imediatamente ao carregar
if (typeof atualizarRelogioInfo === 'function') {
  atualizarRelogioInfo();
}
/* ================= CRONÔMETRO COM HISTÓRICO ================= */
let cronometro = 0;
let cronometroInterval;
let cronometroRodando = false;
let historicoCronometro = [];

// Carregar histórico do localStorage
try {
  historicoCronometro = JSON.parse(localStorage.getItem("historicoCronometro")) || [];
} catch (e) {
  historicoCronometro = [];
}

function salvarHistoricoCronometro() {
  localStorage.setItem("historicoCronometro", JSON.stringify(historicoCronometro));
}

function iniciarCronometro() {
  if (cronometroRodando) return;

  clearInterval(cronometroInterval);
  cronometroRodando = true;

  cronometroInterval = setInterval(() => {
    cronometro++;
    atualizarDisplayCronometro();
  }, 1000);
}

function pausarCronometro() {
  if (!cronometroRodando) return;

  clearInterval(cronometroInterval);
  cronometroRodando = false;

  // Salvar no histórico se tiver tempo
  if (cronometro > 0) {
    const agora = new Date();
    const registro = {
      id: Date.now(),
      tempo: cronometro,
      tempoFormatado: formatarTempoCronometro(cronometro),
      data: agora.toLocaleDateString('pt-BR'),
      hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    historicoCronometro.unshift(registro); // Adiciona no início

    // Manter apenas os últimos 50 registros
    if (historicoCronometro.length > 50) {
      historicoCronometro = historicoCronometro.slice(0, 50);
    }

    salvarHistoricoCronometro();
    renderizarHistoricoCronometro();
  }
}

function resetarCronometro() {
  clearInterval(cronometroInterval);
  cronometroRodando = false;
  cronometro = 0;
  document.getElementById("cronometroDisplay").textContent = "00:00:00";
}

function atualizarDisplayCronometro() {
  const display = document.getElementById("cronometroDisplay");
  if (!display) return;

  const horas = Math.floor(cronometro / 3600);
  const minutos = Math.floor((cronometro % 3600) / 60);
  const segundos = cronometro % 60;

  display.textContent = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

function formatarTempoCronometro(totalSegundos) {
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;

  if (horas > 0) {
    return `${horas}h ${minutos}min ${segundos}s`;
  } else if (minutos > 0) {
    return `${minutos}min ${segundos}s`;
  } else {
    return `${segundos}s`;
  }
}

function toggleAcordeonCronometro() {
  const conteudo = document.getElementById("cronometroHistoricoConteudo");
  const seta = document.getElementById("cronometroSeta");

  if (conteudo.style.display === "none" || conteudo.style.display === "") {
    conteudo.style.display = "block";
    seta.textContent = "▼";
    seta.style.transform = "rotate(0deg)";
  } else {
    conteudo.style.display = "none";
    seta.textContent = "▶";
    seta.style.transform = "rotate(0deg)";
  }
}

function renderizarHistoricoCronometro() {
  const lista = document.getElementById("cronometroHistoricoLista");
  const count = document.getElementById("cronometroHistoricoCount");

  if (!lista) return;

  if (count) {
    count.textContent = `(${historicoCronometro.length})`;
  }

  if (historicoCronometro.length === 0) {
    lista.innerHTML = '<p style="color: #43474c; text-align: center; padding: 10px; font-size: 0.7rem !important;">Nenhum tempo registrado</p>';
    return;
  }

  lista.innerHTML = historicoCronometro.map((registro, index) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #f3f4f6; ${index % 2 === 0 ? 'background: #fafafa;' : ''}">
      <div>
        <div style="font-weight: 600; color: #1f2937;">${registro.tempoFormatado}</div>
        <div style="font-size: 0.7rem; color: #6b7280;">${registro.data} às ${registro.hora}</div>
      </div>
      <button onclick="excluirRegistroCronometro(${registro.id})" 
              style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.8rem;"
              title="Excluir registro">
        ✕
      </button>
    </div>
  `).join('');
}

function limparHistoricoCronometro() {
  if (historicoCronometro.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'Histórico vazio',
      text: 'Não há registros para limpar!',
      timer: 1500,
      showConfirmButton: false
    });
    return;
  }

  Swal.fire({
    title: 'Limpar histórico?',
    text: `Tem certeza que deseja excluir todos os ${historicoCronometro.length} registros?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, limpar tudo!',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444'
  }).then((result) => {
    if (result.isConfirmed) {
      historicoCronometro = [];
      salvarHistoricoCronometro();
      renderizarHistoricoCronometro();

      Swal.fire({
        icon: 'success',
        title: 'Histórico limpo!',
        timer: 1500,
        showConfirmButton: false
      });
    }
  });
}

function excluirRegistroCronometro(id) {
  historicoCronometro = historicoCronometro.filter(r => r.id !== id);
  salvarHistoricoCronometro();
  renderizarHistoricoCronometro();

  Swal.fire({
    icon: 'success',
    title: 'Registro excluído!',
    timer: 1000,
    showConfirmButton: false,
    position: 'top-end',
    toast: true
  });
}
/* ================= TIMER SIMPLES ================= */
let timerInterval;
let tempoRestanteTimer = 0;

function iniciarTimer() {
  clearInterval(timerInterval);

  const minutosInput = document.getElementById("timerMinutos");
  const segundosInput = document.getElementById("timerSegundos");

  const minutos = parseInt(minutosInput.value) || 0;
  const segundos = parseInt(segundosInput.value) || 0;

  // Converte tudo para segundos
  tempoRestanteTimer = (minutos * 60) + segundos;

  if (tempoRestanteTimer <= 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Valor inválido!',
      text: 'Digite pelo menos 1 segundo!',
      timer: 2000,
      showConfirmButton: false
    });
    return;
  }

  atualizarDisplayTimer();

  timerInterval = setInterval(() => {
    tempoRestanteTimer--;
    atualizarDisplayTimer();

    if (tempoRestanteTimer <= 0) {
      clearInterval(timerInterval);

      Swal.fire({
        icon: "info",
        title: "Tempo acabou!",
        timer: 2000,
        showConfirmButton: false
      });
    }
  }, 1000);
}

function pararTimer() {
  clearInterval(timerInterval);
}

function resetarTimer() {
  clearInterval(timerInterval);
  tempoRestanteTimer = 0;
  document.getElementById("timerMinutos").value = "";
  document.getElementById("timerSegundos").value = "";
  document.getElementById("timerDisplay").textContent = "00:00";
}

function atualizarDisplayTimer() {
  const display = document.getElementById("timerDisplay");
  if (!display) return;

  const minutos = Math.floor(tempoRestanteTimer / 60);
  const segundos = tempoRestanteTimer % 60;

  display.textContent = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}
/* ================= TEMPO POR MATERIA ================= */
function renderTabelaMaterias() {
  const tabela = document.getElementById("tabelaMateriasTempo");
  if (!tabela) {
    console.error('Tabela de matérias não encontrada!');
    return;
  }

  tabela.innerHTML = "";

  if (!materias || materias.length === 0) {
    tabela.innerHTML = '<tr><td colspan="3" style="text-align: center;">Nenhuma matéria cadastrada</td></tr>';
    return;
  }

  materias.forEach(m => {
    const dados = tempoEstudo[m.id];
    let tempoSegundos = 0;

    // Calcular tempo total da matéria
    if (dados) {
      if (typeof dados === 'number') {
        tempoSegundos = dados;
      } else if (dados.total) {
        tempoSegundos = dados.total;
      }
    }

    // Formatar tempo
    const h = String(Math.floor(tempoSegundos / 3600)).padStart(2, "0");
    const min = String(Math.floor((tempoSegundos % 3600) / 60)).padStart(2, "0");
    const seg = String(tempoSegundos % 60).padStart(2, "0");

    // Verificar se é a matéria atual
    const isEstudando = estudoAtual == m.id;

    const tr = document.createElement("tr");
    tr.style.background = isEstudando ? '#fef2f2' : 'transparent';
    tr.innerHTML = `
      <td>
        ${m.nome}
        ${isEstudando ? ' <span style="color: #22c55e;">● Estudando</span>' : ''}
      </td>
      <td class="tempo">${h}:${min}:${seg}</td>
      <td>
  ${isEstudando ?
        `<button onclick="pausarEstudo()" style="background: #f59e0b; margin-right: 5px;">⏸</button>
     <button onclick="finalizarEstudo()" style="background: #ef4444;">⏹ Finalizar</button>` :
        `<button onclick="iniciarEstudo('${m.id}')" style="background: #22c55e;">▶ Iniciar</button>`
      }
</td>
    `;
    tabela.appendChild(tr);
  });
}
/* ================= POMODORO CORRIGIDO (APENAS ESTE BLOCO) ================= */
/* ================= POMODORO SEM STATUS ================= */
let pomodoroTempo = 1500;
let pomodoroInterval = null;
let pomodoroRodando = false;
let modoPomodoro = "foco";
let estudoIdPomodoro = null;

function atualizarDisplayPomodoro() {
  const min = String(Math.floor(pomodoroTempo / 60)).padStart(2, "0");
  const seg = String(pomodoroTempo % 60).padStart(2, "0");
  const display = document.getElementById("pomodoroDisplay");
  if (display) display.textContent = `${min}:${seg}`;
}

function iniciarPomodoroPadrao() {
  if (pomodoroRodando) {
    Swal.fire({
      icon: 'warning',
      title: 'Já rodando!',
      text: 'Pause ou resete primeiro.',
      timer: 1500,
      showConfirmButton: false
    });
    return;
  }

  modoPomodoro = "foco";
  pomodoroTempo = 1500;
  pomodoroRodando = true;
  atualizarDisplayPomodoro();

  pomodoroInterval = setInterval(() => {
    if (!pomodoroRodando) return;

    if (pomodoroTempo <= 0) {
      clearInterval(pomodoroInterval);
      pomodoroRodando = false;

      if (modoPomodoro === "foco") {
        if (estudoIdPomodoro) {
          if (typeof pausarEstudo === 'function') pausarEstudo();
          estudoIdPomodoro = null;
        }

        Swal.fire({
          icon: 'success',
          title: 'Foco concluído!',
          text: 'Hora da pausa!',
          timer: 2000,
          showConfirmButton: false
        });
        modoPomodoro = "pausa";
        pomodoroTempo = 300;
        iniciarPomodoroPadrao();
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Pausa concluída!',
          text: 'Hora de estudar!',
          timer: 2000,
          showConfirmButton: false
        });
        modoPomodoro = "foco";
        pomodoroTempo = 1500;
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
  if (estudoIdPomodoro && typeof pausarEstudo === 'function') pausarEstudo();
}

function resetarPomodoro() {
  clearInterval(pomodoroInterval);
  pomodoroRodando = false;
  modoPomodoro = "foco";
  pomodoroTempo = 1500;
  atualizarDisplayPomodoro();
  if (estudoIdPomodoro) {
    if (typeof pausarEstudo === 'function') pausarEstudo();
    estudoIdPomodoro = null;
  }
}

function abrirModalPomodoro() {
  if (!verificarAcesso('pomodoroPersonalizado')) return;
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
    Swal.fire({
      icon: 'warning',
      title: 'Selecione uma matéria!',
      timer: 1500,
      showConfirmButton: false
    });
    return;
  }

  const materia = materias.find(m => m.id == materiaId);
  if (!materia) return;

  if (pomodoroRodando) resetarPomodoro();

  modoPomodoro = "foco";
  pomodoroTempo = tempoEstudo * 60;
  pomodoroRodando = true;
  estudoIdPomodoro = materiaId;

  if (typeof iniciarEstudo === 'function') iniciarEstudo(materiaId);

  atualizarDisplayPomodoro();

  bootstrap.Modal.getInstance(document.getElementById('modalPomodoro'))?.hide();

  if (pomodoroInterval) clearInterval(pomodoroInterval);
  pomodoroInterval = setInterval(() => {
    if (!pomodoroRodando) return;

    if (pomodoroTempo <= 0) {
      clearInterval(pomodoroInterval);
      pomodoroRodando = false;

      if (modoPomodoro === "foco") {
        if (estudoIdPomodoro && typeof pausarEstudo === 'function') pausarEstudo();

        Swal.fire({
          icon: 'success',
          title: ' Foco concluído!',
          text: `${tempoPausa} min de pausa `,
          timer: 2000,
          showConfirmButton: false
        });
        modoPomodoro = "pausa";
        pomodoroTempo = tempoPausa * 60;
        atualizarDisplayPomodoro();

        setTimeout(() => {
          if (!pomodoroRodando) {
            pomodoroRodando = true;
            pomodoroInterval = setInterval(() => {
              if (!pomodoroRodando) return;
              if (pomodoroTempo <= 0) {
                clearInterval(pomodoroInterval);
                pomodoroRodando = false;
                Swal.fire({
                  icon: 'info',
                  title: '☕ Pausa concluída!',
                  text: 'Pronto para outro ciclo!',
                  timer: 2000,
                  showConfirmButton: false
                });
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
  if (!id) {
    console.error('ID da materia nao fornecido');
    return;
  }

  const materia = materias.find(m => m.id == id);
  if (!materia) {
    console.error('Materia nao encontrada:', id);
    return;
  }

  if (estudoAtual && estudoAtual !== id) {
    pausarEstudo();
  }

  atualizarStreak();
  estudoAtual = id;
  modoEstudo = "manual";

  if (!tempoEstudo[id]) {
    tempoEstudo[id] = { total: 0, historico: {} };
  }

  if (typeof tempoEstudo[id] === 'number') {
    const tempoAntigo = tempoEstudo[id];
    tempoEstudo[id] = { total: tempoAntigo, historico: {} };
  }

  const hoje = new Date().toISOString().split('T')[0];
  if (!tempoEstudo[id].historico[hoje]) {
    tempoEstudo[id].historico[hoje] = 0;
  }

  clearInterval(intervaloEstudo);
  intervaloEstudo = setInterval(() => {
    if (tempoEstudo[id] && tempoEstudo[id].historico) {
      tempoEstudo[id].total++;
      tempoEstudo[id].historico[hoje]++;
      localStorage.setItem("tempoEstudo", JSON.stringify(tempoEstudo));
      renderTabelaMaterias();
      if (typeof atualizarMeta === 'function') atualizarMeta();
      if (typeof atualizarRelogioInfo === 'function') atualizarRelogioInfo();

      const estatisticaSection = document.getElementById("estatisticaSection");
      if (estatisticaSection && estatisticaSection.style.display === "block") {
        if (typeof carregarEstatisticas === 'function') carregarEstatisticas();
      }
    }
  }, 1000);

  Swal.fire({
    icon: 'success',
    title: 'Estudando: ' + materia.nome,
    text: 'O tempo esta sendo contado!',
    timer: 1500,
    showConfirmButton: false,
    position: 'top-end',
    toast: true
  });
}/* ================= MODO FOCO PERSONALIZADO ================= */

// Função para abrir o modal
function abrirModalModoFoco() {
  if (!verificarAcesso('focoPersonalizado')) return;
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
        fraseEl.textContent = `Começando com tudo! Mantenha o foco em ${materiaNome}!`;
      } else if (tempoRestante > tempoSegundos * 0.5) {
        fraseEl.textContent = 'Continue assim! Você está indo bem!';
      } else if (tempoRestante > 60) {
        fraseEl.textContent = 'Quase lá! Mais um pouco!';
      } else if (tempoRestante > 0) {
        fraseEl.textContent = 'Último minuto! Dá pra finalizar com força!';
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
        fraseEl.textContent = focoAtivo ? `Foco total em ${materiaNome}!` : '⏸ Pausado. Respire fundo e volte quando estiver pronto!';
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
      if (fraseEl) fraseEl.textContent = 'Timer resetado! Vamos começar de novo!';
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
  diaria: 0.5,
  semanal: 3.5,
  mensal: 14
};
let metaAtiva = "semanal";

function converterParaHoras(horas, minutos) {
  return (parseInt(horas) || 0) + ((parseInt(minutos) || 0) / 60);
}

function formatarMeta(horasDecimais) {
  const h = Math.floor(horasDecimais);
  const m = Math.round((horasDecimais - h) * 60);

  if (h === 0 && m === 0) return "0min";
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function atualizarDisplayMetas() {
  const metaDiariaTexto = document.getElementById("metaDiariaTexto");
  const metaSemanalTexto = document.getElementById("metaSemanalTexto");
  const metaMensalTexto = document.getElementById("metaMensalTexto");

  if (metaDiariaTexto) metaDiariaTexto.textContent = formatarMeta(metas.diaria);
  if (metaSemanalTexto) metaSemanalTexto.textContent = formatarMeta(metas.semanal);
  if (metaMensalTexto) metaMensalTexto.textContent = formatarMeta(metas.mensal);
}
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
  let dataInicioStr;

  if (periodo === "diaria") {
    dataInicioStr = hojeStr;
  } else if (periodo === "semanal") {
    const dataInicio = new Date();
    dataInicio.setDate(hoje.getDate() - 7);
    dataInicioStr = formatarData(dataInicio);
  } else if (periodo === "mensal") {
    const dataInicio = new Date();
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
    unidade = "mes";
  }

  totalHoras = calcularHorasEstudadas(metaAtiva);
  const progresso = Math.min((totalHoras / metaValor) * 100, 100);
  const faltam = Math.max(metaValor - totalHoras, 0);

  const metaTexto = document.getElementById("metaTextoResumo");
  if (metaTexto) {
    if (progresso >= 100) {
      metaTexto.innerHTML = `<span style="color: #16a34a;">Meta batida!</span> ${totalHoras.toFixed(1)}h de ${formatarMeta(metaValor)}`;
    } else if (progresso >= 75) {
      metaTexto.textContent = `Quase la! ${totalHoras.toFixed(1)}h de ${formatarMeta(metaValor)}`;
    } else if (progresso >= 50) {
      metaTexto.textContent = `Na metade! ${totalHoras.toFixed(1)}h de ${formatarMeta(metaValor)}`;
    } else if (progresso > 0) {
      metaTexto.textContent = `Comecando! ${totalHoras.toFixed(1)}h de ${formatarMeta(metaValor)}`;
    } else {
      metaTexto.textContent = `Nenhum estudo ainda. Meta: ${formatarMeta(metaValor)}`;
    }
  }

  const metaBarra = document.getElementById("metaBarraResumo");
  if (metaBarra) {
    metaBarra.style.width = `${progresso}%`;
    metaBarra.classList.remove("baixa", "media", "alta");
    if (progresso >= 100) {
      metaBarra.classList.add("alta");
    } else if (progresso >= 50) {
      metaBarra.classList.add("media");
    } else {
      metaBarra.classList.add("baixa");
    }
  }

  const metaRestante = document.getElementById("metaRestanteResumo");
  if (metaRestante) {
    if (faltam <= 0) {
      metaRestante.innerHTML = `<span style="color: #16a34a; font-weight: 600;">Concluido!</span>`;
    } else {
      metaRestante.textContent = `Faltam ${formatarMeta(faltam)}`;
    }
  }

  atualizarDisplayMetas();
}
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
  atualizarDisplayMetas();
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
  if (!verificarAcesso('metaEstudo')) return;
  const diariaH = Math.floor(metas.diaria);
  const diariaM = Math.round((metas.diaria - diariaH) * 60);
  const semanalH = Math.floor(metas.semanal);
  const semanalM = Math.round((metas.semanal - semanalH) * 60);
  const mensalH = Math.floor(metas.mensal);
  const mensalM = Math.round((metas.mensal - mensalH) * 60);
  document.getElementById("metaDiariaHoras").value = diariaH;
  document.getElementById("metaDiariaMinutos").value = diariaM;
  document.getElementById("metaSemanalHoras").value = semanalH;
  document.getElementById("metaSemanalMinutos").value = semanalM;
  document.getElementById("metaMensalHoras").value = mensalH;
  document.getElementById("metaMensalMinutos").value = mensalM;
  const modal = new bootstrap.Modal(document.getElementById('modalMeta'));
  modal.show();
}
function salvarMeta() {
  const diariaHoras = parseInt(document.getElementById("metaDiariaHoras").value) || 0;
  const diariaMinutos = parseInt(document.getElementById("metaDiariaMinutos").value) || 0;
  const semanalHoras = parseInt(document.getElementById("metaSemanalHoras").value) || 0;
  const semanalMinutos = parseInt(document.getElementById("metaSemanalMinutos").value) || 0;
  const mensalHoras = parseInt(document.getElementById("metaMensalHoras").value) || 0;
  const mensalMinutos = parseInt(document.getElementById("metaMensalMinutos").value) || 0;
  metas.diaria = converterParaHoras(diariaHoras, diariaMinutos);
  metas.semanal = converterParaHoras(semanalHoras, semanalMinutos);
  metas.mensal = converterParaHoras(mensalHoras, mensalMinutos);
  if (metas.diaria <= 0 && metas.semanal <= 0 && metas.mensal <= 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Meta invalida!',
      text: 'Defina pelo menos 1 minuto para uma das metas.',
      timer: 2000,
      showConfirmButton: false
    }); return;
  }
  localStorage.setItem("metas", JSON.stringify(metas));
  atualizarMeta();
  atualizarDisplayMetas();
  bootstrap.Modal.getInstance(document.getElementById('modalMeta')).hide();
  Swal.fire({
    icon: 'success',
    title: 'Metas atualizadas!',
    html: `
      Diaria: ${formatarMeta(metas.diaria)}<br>
      Semanal: ${formatarMeta(metas.semanal)}<br>
      Mensal: ${formatarMeta(metas.mensal)}
    `,
    timer: 2500,
    showConfirmButton: false
  });
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
  } const ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
  if (new Date(ultimoDia).toDateString() === ontem.toDateString()) {
    streak++; localStorage.setItem("streak", streak);
  } else if (ultimoDia !== hoje) {
    streak = 1; localStorage.setItem("streak", streak);
  } localStorage.setItem("ultimoDiaEstudo", hoje);
}/* ================= RELOGIO INTELIGENTE ================= */
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
    materiaEl.textContent = blocoAtual.materia.nome;
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
      tempoRestanteEl.textContent = "faltam " + h + ":" + m + ":" + s;
    } else {
      tempoRestanteEl.textContent = "terminou";
    }
  } else {
    materiaEl.innerHTML = "Descanso";
    horarioEl.textContent = "--:-- - --:--";
    tempoRestanteEl.textContent = "aguardando...";
  }
  const hoje = new Date().toISOString().split('T')[0];
  let totalSegundosHoje = 0;
  Object.values(tempoEstudo).forEach(materia => {
    if (typeof materia === 'number') {
      totalSegundosHoje += materia;
    } else if (materia.historico && materia.historico[hoje]) {
      totalSegundosHoje += materia.historico[hoje];
    } else if (materia.total) {
      totalSegundosHoje += materia.total;
    }
  });
  const h = String(Math.floor(totalSegundosHoje / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSegundosHoje % 3600) / 60)).padStart(2, "0");
  const s = String(totalSegundosHoje % 60).padStart(2, "0");
  if (tempoHojeEl) {
    tempoHojeEl.textContent = h + ":" + m + ":" + s;
  }
  const streak = localStorage.getItem("streak") || 0;
  if (streakEl) {
    streakEl.textContent = streak + " dias";
  }
} function pausarEstudo() {
  if (intervaloEstudo) {
    clearInterval(intervaloEstudo);
    intervaloEstudo = null;
  }
  if (estudoAtual) {
    localStorage.setItem("tempoEstudo", JSON.stringify(tempoEstudo));
    const materia = materias.find(m => m.id == estudoAtual);
    const nomeMateria = materia ? materia.nome : 'Desconhecida';
    console.log(`⏸ Estudo pausado: ${nomeMateria}`);
    Swal.fire({
      icon: 'info',
      title: 'Estudo pausado',
      text: `${nomeMateria} - Tempo salvo!`,
      timer: 2000,
      showConfirmButton: false,
      position: 'top-end',
      toast: true
    });
  }
  estudoAtual = null;
  modoEstudo = "manual";
  notificarMudanca = false;
  renderTabelaMaterias();
  if (typeof atualizarRelogioInfo === 'function') {
    atualizarRelogioInfo();
  }
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
  const materia = estudoAtual ? materias.find(m => m.id == estudoAtual) : null;
  const nomeMateria = materia ? materia.nome : 'Desconhecida';
  const tempoSessao = tempoEstudo[estudoAtual]?.historico?.[hoje] || 0;
  const horas = Math.floor(tempoSessao / 3600);
  const minutos = Math.floor((tempoSessao % 3600) / 60);
  Swal.fire({
    title: 'Finalizar estudo?',
    html: `
      <p>Matéria: <strong>${nomeMateria}</strong></p>
      <p>Tempo nesta sessão: <strong>${horas}h ${minutos}min</strong></p>
      <p>Tem certeza que deseja encerrar?</p>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sim, finalizar!',
    cancelButtonText: 'Continuar estudando',
    confirmButtonColor: '#22c55e',
    cancelButtonColor: '#6b7280'
  }).then((result) => {
    if (result.isConfirmed) {
      if (intervaloEstudo) {
        clearInterval(intervaloEstudo);
        intervaloEstudo = null;
      }
      localStorage.setItem("tempoEstudo", JSON.stringify(tempoEstudo));
      estudoAtual = null;
      modoEstudo = "manual";
      renderTabelaMaterias();
      if (typeof atualizarRelogioInfo === 'function') {
        atualizarRelogioInfo();
      }
      if (typeof carregarEstatisticas === 'function') {
        carregarEstatisticas();
      }
      Swal.fire({
        icon: 'success',
        title: 'Estudo finalizado!',
        text: `${nomeMateria} - ${horas}h ${minutos}min registrados!`,
        timer: 2000,
        showConfirmButton: false
      });
    }
  });
}
/* ================= INFO RELÓGIO ================= */
function atualizarPainelEstudos() {
  console.log("Atualizando painel de estudos...");
  const agora = new Date();
  let blocoAtual = null;
  let proximoBloco = null;
  let cronogramaLocal = JSON.parse(localStorage.getItem("cronogramaNovo")) || [];
  if (cronogramaLocal.length === 0 && window.cronogramaNovo && window.cronogramaNovo.length > 0) {
    cronogramaLocal = window.cronogramaNovo;
  }
  console.log("Cronograma carregado:", cronogramaLocal.length, "blocos");
  if (!cronogramaLocal || cronogramaLocal.length === 0) {
    console.log("Nenhum bloco no cronograma");
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
  const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const hojeSemana = dias[agora.getDay()];
  const horaAtual = String(agora.getHours()).padStart(2, '0') + ":" + String(agora.getMinutes()).padStart(2, '0');
  console.log(`Hoje: ${hojeSemana}, Hora: ${horaAtual}`);
  const blocosHoje = cronogramaLocal
    .filter(b => b.dia === hojeSemana)
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
  console.log(`Blocos de hoje: ${blocosHoje.length}`);
  for (let i = 0; i < blocosHoje.length; i++) {
    const bloco = blocosHoje[i];
    if (!bloco.inicio || !bloco.fim) continue;
    if (horaAtual >= bloco.inicio && horaAtual < bloco.fim) {
      blocoAtual = bloco;
      console.log(`MATÉRIA ATUAL: ${bloco.materia.nome} (${bloco.inicio} - ${bloco.fim})`);
    }
    if (!blocoAtual && bloco.inicio > horaAtual && !proximoBloco) {
      proximoBloco = bloco;
      console.log(`PRÓXIMA: ${bloco.materia.nome} às ${bloco.inicio}`);
    }
  }
  if (!blocoAtual && blocosHoje.length > 0 && !proximoBloco) {
    if (horaAtual < blocosHoje[0].inicio) {
      proximoBloco = blocosHoje[0];
      console.log(`PRÓXIMA (primeira do dia): ${proximoBloco.materia.nome} às ${proximoBloco.inicio}`);
    }
  }
  const materiaAtualEl = document.getElementById("materiaAgoraInicio");
  const horarioAtualEl = document.getElementById("horarioAgoraInicio");
  const tempoRestanteEl = document.getElementById("tempoRestanteInicio");
  if (blocoAtual) {
    if (materiaAtualEl) materiaAtualEl.textContent = blocoAtual.materia.nome;
    if (horarioAtualEl) horarioAtualEl.textContent = `${blocoAtual.inicio} - ${blocoAtual.fim}`;
    const [h, m] = blocoAtual.fim.split(":");
    const fim = new Date();
    fim.setHours(parseInt(h), parseInt(m), 0);
    const diff = fim - agora;
    if (diff > 0) {
      const minutos = Math.floor(diff / 60000);
      const segundos = Math.floor((diff % 60000) / 1000);
      if (tempoRestanteEl) tempoRestanteEl.textContent = `faltam ${minutos}min ${segundos}s`;
    } else {
      if (tempoRestanteEl) tempoRestanteEl.textContent = `terminou`;
    }

    console.log(`✅ Painel atualizado: ${blocoAtual.materia.nome}`);
  } else {
    if (materiaAtualEl) materiaAtualEl.innerHTML = "<i class='bi bi-moon-stars-fill'></i> Descanso";
    if (horarioAtualEl) horarioAtualEl.textContent = "";
    if (tempoRestanteEl) tempoRestanteEl.textContent = "";
    console.log("Nenhuma matéria no momento");
  }
  const btnVamosLa = document.getElementById("btnVamosLa");
  if (btnVamosLa) {
    if (blocoAtual) {
      btnVamosLa.style.display = "block";
    } else {
      btnVamosLa.style.display = "none";
    }
  }
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
function irParaEstudar() {
  closeSidebar();

  mostrarTela("relogio");

  const links = document.querySelectorAll('#menuLateral .nav-link');
  links.forEach(link => link.classList.remove('active'));

  const linkRelogio = document.querySelector('#menuLateral .nav-link[onclick*="relogio"]');
  if (linkRelogio) {
    linkRelogio.classList.add('active');
  }
  setTimeout(() => {
    if (typeof atualizarRelogioInfo === 'function') {
      atualizarRelogioInfo();
    }
    if (typeof atualizarMateriaAgora === 'function') {
      atualizarMateriaAgora();
    }
  }, 100);
  if (modoEstudo !== "auto") {
    voltarModoAuto();
  }
  setTimeout(() => {
    const relogioInfo = document.getElementById("relogioInfo");
    if (relogioInfo) {
      relogioInfo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 300);
}
function forcarAtualizacaoPainel() {
  console.log("Forçando atualização do painel...");
  setTimeout(() => {
    atualizarPainelEstudos();
  }, 10);
}
function atualizarCronogramaCompleto() {
  renderCronogramaNovo();
  renderizarResumoHoje();
  atualizarMateriaAgora();
  forcarAtualizacaoPainel();
}
forcarAtualizacaoPainel();

function pausarModoAuto() {
  modoEstudo = "manual";
  notificarMudanca = false;

  if (intervaloEstudo) {
    clearInterval(intervaloEstudo);
    intervaloEstudo = null;
  }
  estudoAtual = null;

  const statusEl = document.getElementById("statusModoAuto");
  if (statusEl) {
    statusEl.textContent = "Modo automatico pausado - Controle manual ativo";
    statusEl.style.color = "#f59e0b";
  }

  renderTabelaMaterias();
  if (typeof atualizarRelogioInfo === 'function') {
    atualizarRelogioInfo();
  }

  Swal.fire({
    icon: "info",
    title: "Modo automatico pausado",
    text: "O estudo nao iniciara automaticamente. Clique em uma materia para estudar manualmente.",
    timer: 2500,
    showConfirmButton: false
  });
}
function voltarModoAuto() {
  modoEstudo = "auto";
  notificarMudanca = true;

  const statusEl = document.getElementById("statusModoAuto");
  if (statusEl) {
    statusEl.textContent = "Modo automatico ativo - Seguindo o cronograma";
    statusEl.style.color = "#22c55e";
  }

  atualizarMateriaAgora();
  if (typeof atualizarRelogioInfo === 'function') {
    atualizarRelogioInfo();
  }

  Swal.fire({
    icon: "info",
    title: "Modo automatico ativado",
    text: "O estudo iniciara automaticamente conforme seu cronograma.",
    timer: 2500,
    showConfirmButton: false
  });
}
// ===== MENU HAMBÚRGUER PARA CELULAR =====
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('overlay');
  if (!sidebar) return;
  sidebar.classList.toggle('show');
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
document.addEventListener('DOMContentLoaded', function () {
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.onclick = closeSidebar;
  }
});
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
window.addEventListener('resize', function () {
  if (window.innerWidth > 768) {
    closeSidebar();
  }
});

/* ==================== ESTATÍSTICAS (VERSÃO CORRIGIDA) ==================== */

let graficoPrincipalAtual = null;
let graficoMateriasAtual = null;
let periodoAtual = "semana";
let estatisticasAtualizando = false;
// ==================== CALCULAR TOTAIS (UNIFICADO) ====================
function calcularTotais() {
  let totalSegundos = 0;
  const diasEstudados = new Set();

  Object.values(tempoEstudo).forEach(materia => {
    if (typeof materia === 'number') {
      totalSegundos += materia;
      // Assume que estudou hoje se tem tempo registrado
      diasEstudados.add(new Date().toISOString().split('T')[0]);
    } else if (materia && materia.historico) {
      Object.entries(materia.historico).forEach(([data, segundos]) => {
        if (segundos > 0) {
          totalSegundos += segundos;
          diasEstudados.add(data);
        }
      });
    } else if (materia && materia.total) {
      totalSegundos += materia.total;
    }
  });

  const totalHoras = totalSegundos / 3600;
  const dias = diasEstudados.size;
  const maiorStreak = parseInt(localStorage.getItem("streak")) || 0;
  const mediaDiaria = dias > 0 ? totalHoras / dias : 0;

  return {
    totalHoras: totalHoras || 0,
    dias: dias || 0,
    maiorStreak: maiorStreak || 0,
    mediaDiaria: mediaDiaria || 0
  };
}// ==================== CALCULAR HORAS POR MATÉRIA ====================
function calcularHorasPorMateria() {
  const materiasEstudo = [];

  if (!materias || materias.length === 0) {
    return materiasEstudo;
  }

  materias.forEach(m => {
    const dados = tempoEstudo[m.id];
    let totalSegundos = 0;

    if (dados) {
      if (typeof dados === 'number') {
        totalSegundos = dados;
      } else if (dados.total) {
        totalSegundos = dados.total;
      }
    }
    if (totalSegundos > 0) {
      materiasEstudo.push({
        nome: m.nome,
        horas: totalSegundos / 3600,
        cor: m.cor || '#9f042c'
      });
    }
  });
  return materiasEstudo.sort((a, b) => b.horas - a.horas);
}
// ==================== CALCULAR ESTUDO POR PERÍODO ====================
function calcularEstudoPeriodo(dias) {
  const hoje = new Date();
  let totalSegundos = 0;

  for (let i = 0; i < dias; i++) {
    const data = new Date();
    data.setDate(hoje.getDate() - i);
    const dataStr = data.toISOString().split('T')[0];

    Object.values(tempoEstudo).forEach(materia => {
      if (materia && materia.historico && materia.historico[dataStr]) {
        totalSegundos += materia.historico[dataStr];
      }
    });
  }

  return totalSegundos / 3600;
}
// ==================== DADOS PARA GRÁFICOS ====================
function getDadosPorDiaSemana() {
  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const horasPorDia = [0, 0, 0, 0, 0, 0, 0];
  Object.values(tempoEstudo).forEach(materia => {
    if (materia && materia.historico) {
      Object.entries(materia.historico).forEach(([dataStr, segundos]) => {
        if (segundos > 0) {
          const data = new Date(dataStr + 'T12:00:00'); // Evita problema de fuso
          if (!isNaN(data.getTime())) {
            const diaSemana = data.getDay();
            horasPorDia[diaSemana] += segundos / 3600;
          }
        }
      });
    }
  }); return { labels: diasSemana, dados: horasPorDia };
}
function getDadosEstudoHoje() {
  const hoje = new Date().toISOString().split('T')[0];
  const dadosPorMateria = [];
  if (!materias || materias.length === 0) {
    return { labels: ['Sem dados'], dados: [0] };
  }
  materias.forEach(m => {
    const dados = tempoEstudo[m.id];
    let segundos = 0;
    if (dados && dados.historico && dados.historico[hoje]) {
      segundos = dados.historico[hoje];
    }
    dadosPorMateria.push({ nome: m.nome, horas: segundos / 3600 });
  });
  return {
    labels: dadosPorMateria.map(d => d.nome),
    dados: dadosPorMateria.map(d => d.horas)
  };
}
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
      if (materia && materia.historico && materia.historico[dataStr]) {
        total += materia.historico[dataStr];
      }
    });
    dados.push(total / 3600);
  }
  return { labels, dados };
}
function getDadosEstudoMensal() {
  const hoje = new Date();
  const labels = [];
  const dados = [];
  const step = 1; // Pode ajustar para 2 se quiser menos barras
  for (let i = 29; i >= 0; i -= step) {
    const data = new Date();
    data.setDate(hoje.getDate() - i);
    const dataStr = data.toISOString().split('T')[0];
    labels.push(`${data.getDate()}/${data.getMonth() + 1}`);
    let total = 0;
    for (let j = 0; j < step; j++) {
      const dataInterna = new Date(data);
      dataInterna.setDate(data.getDate() - j);
      const dataInternaStr = dataInterna.toISOString().split('T')[0];
      Object.values(tempoEstudo).forEach(materia => {
        if (materia && materia.historico && materia.historico[dataInternaStr]) {
          total += materia.historico[dataInternaStr];
        }
      });
    }
    dados.push((total / 3600) / step); // Média do período
  }
  return { labels, dados };
}
// ==================== ATUALIZAR GRÁFICO PRINCIPAL ====================
function atualizarGraficoPrincipal() {
  const ctx = document.getElementById('graficoPrincipal');
  if (!ctx) return;

  let dados, titulo;
  try {
    switch (periodoAtual) {
      case "semana":
        dados = getDadosPorDiaSemana();
        titulo = "Estudos por Dia da Semana";
        break;
      case "hoje":
        dados = getDadosEstudoHoje();
        titulo = "Estudo de Hoje (por materia)";
        break;
      case "semanal":
        dados = getDadosEstudoSemanal();
        titulo = "Estudo Semanal (ultimos 7 dias)";
        break;
      case "mensal":
        dados = getDadosEstudoMensal();
        titulo = "Estudo Mensal (ultimos 30 dias)";
        break;
      default:
        dados = getDadosPorDiaSemana();
        titulo = "Estudos por Dia da Semana";
    }

    const tituloEl = document.getElementById("graficoTitulo");
    if (tituloEl) tituloEl.textContent = titulo;

    if (graficoPrincipalAtual) {
      graficoPrincipalAtual.destroy();
      graficoPrincipalAtual = null;
    }

    graficoPrincipalAtual = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dados.labels,
        datasets: [{
          label: 'Horas Estudadas',
          data: dados.dados,
          backgroundColor: dados.dados.map(v => v > 0 ? '#9f042c' : '#e5e7eb'),
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { font: { size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return context.raw.toFixed(2) + ' horas';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Horas' },
            ticks: {
              callback: function (value) {
                return value.toFixed(1) + 'h';
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar grafico principal:', error);
  }
}
// ==================== ATUALIZAR GRÁFICO DE MATÉRIAS (PIZZA) ====================
function atualizarGraficoMaterias() {
  const ctx = document.getElementById('graficoMaterias');
  if (!ctx) {
    console.warn('Canvas do gráfico de matérias não encontrado');
    return;
  }
  try {
    const materiasTop = calcularHorasPorMateria();
    if (graficoMateriasAtual) {
      graficoMateriasAtual.destroy();
      graficoMateriasAtual = null;
    }
    if (materiasTop.length === 0) {
      graficoMateriasAtual = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Sem dados'],
          datasets: [{
            data: [1],
            backgroundColor: ['#e5e7eb'],
            borderColor: ['#d1d5db'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return 'Nenhum estudo registrado';
                }
              }
            }
          }
        }
      });
      return;
    }
    const cores = [
      '#9f042c', // Vermelho principal
      '#ff6b6b', // Vermelho claro
      '#4ecdc4', // Turquesa
      '#45b7d1', // Azul
      '#96ceb4', // Verde
      '#ffeaa7', // Amarelo
      '#dfe6e9', // Cinza claro
      '#6c5ce7', // Roxo
      '#a29bfe', // Lilás
      '#fd79a8', // Rosa
      '#00b894', // Verde escuro
      '#fdcb6e', // Laranja
      '#e17055', // Coral
      '#74b9ff', // Azul claro
      '#55efc4'  // Verde menta
    ];
    const labels = materiasTop.map(m => m.nome);
    const dados = materiasTop.map(m => m.horas);
    const coresUsar = materiasTop.map((_, i) => cores[i % cores.length]);
    const totalHoras = dados.reduce((a, b) => a + b, 0);
    graficoMateriasAtual = new Chart(ctx, {
      type: 'doughnut', // ou 'pie' se preferir pizza tradicional
      data: {
        labels: labels,
        datasets: [{
          data: dados,
          backgroundColor: coresUsar,
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverBorderWidth: 4,
          hoverBorderColor: '#f8f9fa'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyleWidth: 12,
              font: {
                size: 11,
                family: "'Poppins', sans-serif"
              },
              generateLabels: function (chart) {
                const data = chart.data;
                return data.labels.map((label, i) => ({
                  text: `${label} (${((data.datasets[0].data[i] / totalHoras) * 100).toFixed(1)}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor,
                  lineWidth: 2,
                  hidden: false,
                  index: i,
                  pointStyle: 'circle',
                  rotation: 0
                }));
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 13,
              family: "'Poppins', sans-serif"
            }, bodyFont: {
              size: 12,
              family: "'Poppins', sans-serif"
            }, callbacks: {
              title: function (context) {
                return context[0].label;
              },
              label: function (context) {
                const horas = context.raw;
                const porcentagem = ((horas / totalHoras) * 100).toFixed(1);
                const h = Math.floor(horas);
                const m = Math.round((horas - h) * 60);
                let tempoFormatado;
                if (h === 0 && m === 0) tempoFormatado = '0min';
                else if (h === 0) tempoFormatado = `${m}min`;
                else if (m === 0) tempoFormatado = `${h}h`;
                else tempoFormatado = `${h}h ${m}min`;
                return [
                  `${tempoFormatado}`,
                  `${porcentagem}% do total`
                ];
              }
            }
          }
        }, animation: {
          animateScale: true,
          animateRotate: true,
          duration: 1000
        }
      },      // Plugin para texto no centro
      plugins: [{
        id: 'centerText',
        afterDraw: function (chart) {
          const { ctx, chartArea: { top, bottom, left, right } } = chart;
          const centerX = (left + right) / 2;
          const centerY = (top + bottom) / 2;
          ctx.save();
          ctx.font = "bold 14px 'Poppins', sans-serif";
          ctx.fillStyle = '#6b7280';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Total', centerX, centerY - 10);
          ctx.font = "bold 18px 'Poppins', sans-serif";
          ctx.fillStyle = '#1f2937';
          const totalFormatado = totalHoras.toFixed(1) + 'h';
          ctx.fillText(totalFormatado, centerX, centerY + 15);
          ctx.restore();
        }
      }]
    });
  } catch (error) {
    console.error('Erro ao atualizar gráfico de matérias:', error);
  }
}
// ==================== ATUALIZAR METAS ====================
function atualizarMetas() {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    let totalHoje = 0;
    Object.values(tempoEstudo).forEach(materia => {
      if (materia && materia.historico && materia.historico[hoje]) {
        totalHoje += materia.historico[hoje];
      }
    });
    totalHoje = totalHoje / 3600;
    let totalSemana = 0;
    for (let i = 0; i < 7; i++) {
      const data = new Date();
      data.setDate(data.getDate() - i);
      const dataStr = data.toISOString().split('T')[0];

      Object.values(tempoEstudo).forEach(materia => {
        if (materia && materia.historico && materia.historico[dataStr]) {
          totalSemana += materia.historico[dataStr];
        }
      });
    }
    totalSemana = totalSemana / 3600;
    let totalMes = 0;
    for (let i = 0; i < 30; i++) {
      const data = new Date();
      data.setDate(data.getDate() - i);
      const dataStr = data.toISOString().split('T')[0];

      Object.values(tempoEstudo).forEach(materia => {
        if (materia && materia.historico && materia.historico[dataStr]) {
          totalMes += materia.historico[dataStr];
        }
      });
    }
    totalMes = totalMes / 3600;
    const metaDiaria = metas.diaria || 0.5;
    const metaSemanal = metas.semanal || 3.5;
    const metaMensal = metas.mensal || 14;
    atualizarBarraMeta('barraMetaDiaria', 'metaDiariaRestante', totalHoje, metaDiaria);
    atualizarBarraMeta('barraMetaSemanal', 'metaSemanalRestante', totalSemana, metaSemanal);
    atualizarBarraMeta('barraMetaMensal', 'metaMensalRestante', totalMes, metaMensal);
  } catch (error) {
    console.error('Erro ao atualizar metas:', error);
  }
}
function atualizarBarraMeta(barraId, textoId, atual, meta) {
  const barra = document.getElementById(barraId);
  const texto = document.getElementById(textoId);
  if (!barra || !texto) return;
  const progresso = meta > 0 ? Math.min((atual / meta) * 100, 100) : 0;
  barra.style.width = `${progresso}%`;
  barra.classList.remove('baixa', 'media', 'alta');
  if (progresso >= 100) {
    barra.classList.add('alta');
  } else if (progresso >= 50) {
    barra.classList.add('media');
  } else {
    barra.classList.add('baixa');
  }
  const faltam = Math.max(meta - atual, 0);
  texto.textContent = `${atual.toFixed(1)}h de ${formatarMeta(meta)}`;
  if (faltam <= 0) {
    texto.innerHTML += ' <span style="color: #16a34a;">✅ Concluído!</span>';
  }
}
// ==================== ATUALIZAR CONQUISTAS ====================
function atualizarConquistas() {
  try {
    const { totalHoras } = calcularTotais();
    const streak = parseInt(localStorage.getItem("streak")) || 0;
    const qtdMaterias = materias ? materias.length : 0;
    const conquistas = [
      {
        id: "primeiro-estudo",
        nome: "Primeiro Estudo",
        icone: "bi-star-fill",
        condicao: totalHoras > 0,
        cor: "#f59e0b" // Amarelo
      },
      {
        id: "7-dias",
        nome: "7 Dias Seguidos",
        icone: "bi-fire",
        condicao: streak >= 7,
        cor: "#ef4444" // Vermelho
      },
      {
        id: "30-dias",
        nome: "30 Dias Seguidos",
        icone: "bi-trophy-fill",
        condicao: streak >= 30,
        cor: "#f59e0b" // Dourado
      },
      {
        id: "10-horas",
        nome: "10 Horas Totais",
        icone: "bi-hourglass-split",
        condicao: totalHoras >= 10,
        cor: "#3b82f6" // Azul
      },
      {
        id: "50-horas",
        nome: "50 Horas Totais",
        icone: "bi-lightning-charge-fill",
        condicao: totalHoras >= 50,
        cor: "#8b5cf6" // Roxo
      },
      {
        id: "100-horas",
        nome: "100 Horas Totais",
        icone: "bi-rocket-takeoff-fill",
        condicao: totalHoras >= 100,
        cor: "#ec4899" // Rosa
      },
      {
        id: "5-materias",
        nome: "5 Matérias",
        icone: "bi-book-fill",
        condicao: qtdMaterias >= 5,
        cor: "#10b981" // Verde
      },
      {
        id: "10-materias",
        nome: "10 Matérias",
        icone: "bi-journal-bookmark-fill",
        condicao: qtdMaterias >= 10,
        cor: "#06b6d4" // Ciano
      }
    ];
    const desbloqueadas = conquistas.filter(c => c.condicao);
    const bloqueadas = conquistas.filter(c => !c.condicao);
    const containerDesbloq = document.getElementById("conquistasDesbloqueadas");
    const containerBloq = document.getElementById("conquistasBloqueadas");
    if (containerDesbloq) {
      if (desbloqueadas.length > 0) {
        containerDesbloq.innerHTML = desbloqueadas.map(c => `
          <div class="badge desbloqueado" title="${c.nome}">
            <i class="bi ${c.icone}"></i> ${c.nome}
          </div>
        `).join('');
      } else {
        containerDesbloq.innerHTML = '<p class="text-muted" style="font-size: 0.85rem;">Nenhuma conquista ainda. Continue estudando!</p>';
      }
    }

    if (containerBloq) {
      if (bloqueadas.length > 0) {
        containerBloq.innerHTML = bloqueadas.map(c => `
          <div class="badge" title="Ainda não desbloqueada">
            <i class="bi bi-lock-fill"></i> ${c.nome}
          </div>
        `).join('');
      } else {
        containerBloq.innerHTML = '<p class="text-muted" style="font-size: 0.85rem;">Todas as conquistas desbloqueadas!</p>';
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar conquistas:', error);
  }
}

// ==================== GERAR SUGESTÕES ====================
function gerarSugestoes() {
  const sugestoesLista = document.getElementById("sugestoes");
  if (!sugestoesLista) return;
  try {
    const { totalHoras, dias, maiorStreak } = calcularTotais();
    const streak = parseInt(localStorage.getItem("streak")) || 0;
    const materiasTop = calcularHorasPorMateria();
    const sugestoes = [];
    if (totalHoras === 0) {
      sugestoes.push("Comece seus estudos! Vá para o Relógio e clique em ▶ ao lado de uma matéria.");
      sugestoes.push("Monte seu cronograma semanal para organizar os estudos.");
    } else {
      if (streak === 0 && totalHoras > 0) {
        sugestoes.push("Estude hoje para começar um streak de dias consecutivos!");
      }

      if (streak > 0 && streak < 7) {
        const faltam = 7 - streak;
        sugestoes.push(`Você está com ${streak} dia(s) de streak! Faltam ${faltam} para a conquista "7 Dias"!`);
      } else if (streak >= 7 && streak < 30) {
        const faltam = 30 - streak;
        sugestoes.push(`Streak de ${streak} dias! Continue para alcançar 30 dias!`);
      }

      if (materiasTop.length > 0) {
        const maisEstudada = materiasTop[0];
        sugestoes.push(`Sua matéria mais estudada é "${maisEstudada.nome}" com ${maisEstudada.horas.toFixed(1)}h.`);
        if (materiasTop.length > 1) {
          const menosEstudada = materiasTop[materiasTop.length - 1];
          sugestoes.push(`Que tal dar mais atenção para "${menosEstudada.nome}"?`);
        }
      }
      if (dias > 0) {
        const media = totalHoras / dias;
        if (media < 0.5) {
          sugestoes.push(`Sua média é de ${media.toFixed(1)}h/dia. Tente aumentar para 1h por dia!`);
        } else if (media >= 2) {
          sugestoes.push(`Excelente! Sua média de ${media.toFixed(1)}h/dia está ótima!`);
        }
      }
    }
    if (sugestoes.length === 0) {
      sugestoes.push("Continue com o ótimo trabalho! Consistência é a chave!");
      sugestoes.push("Use a seção de Revisão para fixar o conteúdo com flashcards.");
    }
    sugestoesLista.innerHTML = sugestoes.map(s =>
      `<li><i class="bi bi-lightbulb"></i> ${s}</li>`
    ).join('');

  } catch (error) {
    console.error('Erro ao gerar sugestões:', error);
    sugestoesLista.innerHTML = '<li>Carregando sugestões...</li>';
  }
}
// ==================== EXPORTAR DADOS (CORRIGIDO) ====================
function exportarDados() {
  try {
    const dados = {
      versao: "1.0",
      dataExportacao: new Date().toISOString(),
      tarefas: tarefas || [],
      notas: JSON.parse(localStorage.getItem("notas")) || [],
      eventos: calendar ? calendar.getEvents().map(e => ({
        title: e.title,
        start: e.startStr,
        backgroundColor: e.backgroundColor,
        extendedProps: e.extendedProps
      })) : [],
      tempoEstudo: tempoEstudo || {},
      metas: metas || {},
      flashcards: JSON.parse(localStorage.getItem("flashcards_sistema")) || [],
      cronograma: JSON.parse(localStorage.getItem("cronogramaNovo")) || [],
      streak: parseInt(localStorage.getItem("streak")) || 0,
      ultimoDiaEstudo: localStorage.getItem("ultimoDiaEstudo") || ""
    };
    const dataStr = JSON.stringify(dados, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sectio_aurea_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Swal.fire({
      icon: 'success',
      title: 'Exportado!',
      text: 'Backup salvo com sucesso!',
      timer: 2000,
      showConfirmButton: false
    });
  } catch (error) {
    console.error('Erro ao exportar:', error);
    Swal.fire({
      icon: 'error',
      title: 'Erro!',
      text: 'Não foi possível exportar os dados.',
      timer: 2000,
      showConfirmButton: false
    });
  }
}
// ==================== FUNÇÃO PRINCIPAL ====================
function carregarEstatisticas() {
  if (estatisticasAtualizando) {
    console.log('Estatísticas já estão sendo atualizadas...');
    return;
  }
  estatisticasAtualizando = true;
  try {
    const { totalHoras, dias, maiorStreak, mediaDiaria } = calcularTotais();
    const totalGeralEl = document.getElementById("totalGeralEstat");
    const diasEstudadosEl = document.getElementById("diasEstudadosEstat");
    const maiorStreakEl = document.getElementById("maiorStreakEstat");
    const mediaDiariaEl = document.getElementById("mediaDiariaEstat");
    if (totalGeralEl) totalGeralEl.textContent = `${totalHoras.toFixed(1)}h`;
    if (diasEstudadosEl) diasEstudadosEl.textContent = dias;
    if (maiorStreakEl) maiorStreakEl.textContent = maiorStreak;
    if (mediaDiariaEl) mediaDiariaEl.textContent = `${mediaDiaria.toFixed(1)}h`;
    atualizarGraficoPrincipal();
    atualizarGraficoMaterias();
    atualizarMetas();
    atualizarConquistas();
    gerarSugestoes();
    const resumoEl = document.getElementById("resumoEstatisticas");
    if (resumoEl) {
      if (totalHoras > 0) {
        resumoEl.innerHTML = `
          <strong>${totalHoras.toFixed(1)} horas</strong> estudadas no total<br>
          <strong>${dias} dias</strong> de estudo registrados<br>
          Média de <strong>${mediaDiaria.toFixed(1)}h/dia</strong>
        `;
      } else {
        resumoEl.innerHTML = 'Nenhum estudo registrado ainda. Comece agora!';
      }
    }
    configurarBotoesPeriodo();
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  } finally {
    estatisticasAtualizando = false;
  }
}
// ==================== CONFIGURAR BOTÕES DE PERÍODO ====================
function configurarBotoesPeriodo() {
  document.querySelectorAll('.periodo-btn').forEach(btn => {
    // Remove listeners antigos para não duplicar
    const novoBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(novoBtn, btn);
    novoBtn.addEventListener('click', function () {
      document.querySelectorAll('.periodo-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      periodoAtual = this.dataset.periodo;
      atualizarGraficoPrincipal();
    });
  });
  document.querySelectorAll('.periodo-btn').forEach(btn => {
    if (btn.dataset.periodo === periodoAtual) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}
// ==================== INICIALIZAR ====================
document.addEventListener('DOMContentLoaded', () => {
  // Só carrega estatísticas quando a seção estiver visível
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target.id === 'estatisticaSection' &&
        mutation.target.style.display === 'block') {
        setTimeout(carregarEstatisticas, 100);
      }
    });
  });
  const estatisticaSection = document.getElementById('estatisticaSection');
  if (estatisticaSection) {
    observer.observe(estatisticaSection, {
      attributes: true,
      attributeFilter: ['style']
    });
  } const btnExportar = document.querySelector('.btn-exportar');
  if (btnExportar) {
    btnExportar.addEventListener('click', exportarDados);
  }
  console.log('✅ Seção de Estatísticas inicializada');
});
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
}//REVISAO
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
      renderizarFlashcardsAgrupados();
    });
  });
}
// NOVO: Atualizar mensagem da aba revisar
function atualizarMensagemRevisar() {
  const hojeData = new Date().toISOString().split('T')[0];
  const filtroMateria = document.getElementById('filtroMateriaRevisao')?.value || 'todas';
  let pendentes = flashcards.filter(f => f.dataProxima <= hojeData);
  if (filtroMateria !== 'todas') {
    pendentes = pendentes.filter(f => f.materiaNome === filtroMateria);
  }
  const countEl = document.getElementById('countPendentes');
  if (countEl) {
    countEl.textContent = pendentes.length;
    if (pendentes.length === 0) {
      countEl.style.color = '#22c55e'; // Verde - tudo revisado
    } else if (pendentes.length > 10) {
      countEl.style.color = '#ef4444'; // Vermelho - muitos atrasados
    } else {
      countEl.style.color = '#f59e0b'; // Laranja - quantidade normal
    }
  }
}
function configurarFiltroRevisao() {
  const filtro = document.getElementById('filtroMateriaRevisao');
  if (filtro) {
    filtro.addEventListener('change', () => {
      renderizarFlashcardsAgrupados();
      atualizarMensagemRevisar();
    });
  }
}
function renderizarFlashcardsAgrupados() {
  const container = document.getElementById('listaFlashcardsAgrupada');
  if (!container) return;
  const filtroMateria = document.getElementById('filtroMateriaRevisao')?.value || 'todas';
  let cardsFiltrados = [...flashcards];
  if (filtroMateria !== 'todas') {
    cardsFiltrados = cardsFiltrados.filter(f => f.materiaId === filtroMateria);
  }

  if (cardsFiltrados.length === 0) {
    container.innerHTML = '<p class="vazio">Nenhum flashcard encontrado!</p>';
    return;
  }
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
  <button onclick="editarFlashcard(${f.id})" title="Editar">
    <i class="bi bi-pencil"></i>
  </button>
  <button onclick="excluirFlashcard(${f.id})" title="Excluir">
    <i class="bi bi-trash"></i>
  </button>
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
function formatarData(dataStr) {
  const data = new Date(dataStr);
  return data.toLocaleDateString('pt-BR');
}
// ==================== MODAL E CRIAÇÃO ====================
function abrirModalFlashcard() {
  const select = document.getElementById("revisaoMateria");
  if (select && materias) {
    select.innerHTML = '<option value="">Selecione uma materia</option>';
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
    Swal.fire({
      icon: 'warning',
      title: 'Atencao',
      text: 'Selecione uma materia!',
      confirmButtonColor: '#9f042c'
    });
    return;
  }
  if (!pergunta || !resposta) {
    Swal.fire({
      icon: 'warning',
      title: 'Atencao',
      text: 'Preencha a pergunta e a resposta!',
      confirmButtonColor: '#9f042c'
    });
    return;
  }
  const materia = materias.find(m => m.id == materiaId);
  flashcards.push({
    id: Date.now(),
    materiaId: materiaId,
    materiaNome: materia ? materia.nome : "Sem materia",
    tema: tema || "Geral",
    pergunta: pergunta,
    resposta: resposta,
    nivel: 0,
    dataProxima: new Date().toISOString().split("T")[0],
    acertos: 0,
    erros: 0
  });
  salvarFlashcards();
  popularFiltroMaterias();
  renderizarFlashcardsAgrupados();
  atualizarEstatisticas();
  const modal = bootstrap.Modal.getInstance(document.getElementById("modalRevisao"));
  if (modal) modal.hide();
  Swal.fire({
    icon: 'success',
    title: 'Flashcard criado!',
    text: 'Comece a revisar para fixar o conteudo.',
    timer: 2000,
    showConfirmButton: false,
    position: 'top-end',
    toast: true
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
  const hojeDate = new Date();
  const proximaDate = new Date(flashcard.dataProxima);
  const diffTime = proximaDate - hojeDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  let mensagemRevisao = "";
  if (isAtrasada) {
    mensagemRevisao = `<span style="color: #ef4444; font-size: 0.7rem;"> Atrasada! Revise hoje!</span>`;
  } else if (diffDays === 0) {
    mensagemRevisao = `<span style="color: #22c55e; font-size: 0.7rem;"> Hoje! Revise agora!</span>`;
  } else if (diffDays === 1) {
    mensagemRevisao = `<span style="color: #f59e0b; font-size: 0.7rem;"> Amanhã</span>`;
  } else {
    mensagemRevisao = `<span style="color: #6b7280; font-size: 0.7rem;"> Próxima revisão em ${diffDays} dias</span>`;
  }
  return `
    <div class="flashcard-item" data-id="${flashcard.id}">
      <div class="flashcard-header">
        <div class="flashcard-badges">
          <span class="materia-badge">${flashcard.materiaNome}</span>
          <span class="tema-badge"> ${flashcard.tema}</span>
          <span class="data-badge ${isAtrasada ? 'atrasada' : ''}">
            ${isAtrasada ? ' Atrasada' : ' ' + dataFormatada}
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
  const hojeData = new Date().toISOString().split('T')[0];
  const filtroMateria = document.getElementById('filtroMateriaRevisao')?.value || 'todas';
  let cardsPendentes = flashcards.filter(f => f.dataProxima <= hojeData);
  if (filtroMateria !== 'todas') {
    cardsPendentes = cardsPendentes.filter(f => f.materiaNome === filtroMateria);
  }
  if (cardsPendentes.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'Nada para revisar!',
      text: filtroMateria !== 'todas' ?
        'Nao ha cards pendentes para esta materia.' :
        'Todos os cards foram revisados! Volte quando houver novos.',
      confirmButtonColor: '#9f042c',
      confirmButtonText: 'Entendi'
    });
    return;
  }
  revisoesEmAndamento = cardsPendentes.sort(() => Math.random() - 0.5);
  indiceAtualFoco = 0;
  mostrarCardFoco();
  Swal.fire({
    icon: 'success',
    title: 'Boa revisao!',
    text: `${cardsPendentes.length} cards para revisar.`,
    timer: 1500,
    showConfirmButton: false,
    position: 'top-end',
    toast: true
  });
}
function mostrarCardFoco() {
  if (indiceAtualFoco >= revisoesEmAndamento.length) {
    finalizarRevisao();
    return;
  }
  const card = revisoesEmAndamento[indiceAtualFoco];
  document.getElementById('focoMateria').textContent = card.materiaNome;
  document.getElementById('focoMateria').className = 'badge';
  document.getElementById('focoMateria').style.background = '#9f042c';
  document.getElementById('focoMateria').style.color = 'white';
  document.getElementById('focoMateria').style.padding = '5px 12px';
  document.getElementById('focoMateria').style.borderRadius = '20px';
  document.getElementById('focoTema').textContent = card.tema;
  document.getElementById('focoTema').className = 'badge';
  document.getElementById('focoTema').style.background = '#e5e7eb';
  document.getElementById('focoTema').style.color = '#374151';
  document.getElementById('focoTema').style.padding = '5px 12px';
  document.getElementById('focoTema').style.borderRadius = '20px';
  document.getElementById('focoPergunta').textContent = card.pergunta;
  document.getElementById('focoResposta').innerHTML = card.resposta;
  document.getElementById('focoResposta').style.display = 'none';
  document.getElementById('botoesResposta').style.display = 'none';
  document.getElementById('btnMostrarResposta').style.display = 'inline-block';
  const total = revisoesEmAndamento.length;
  const atual = indiceAtualFoco + 1;
  document.getElementById('focoContador').textContent = `Card ${atual} de ${total}`;
  const progresso = (atual / total) * 100;
  document.getElementById('focoProgressoBarra').style.width = `${progresso}%`;
  document.getElementById('modoFocoContainer').style.display = 'flex';
}
function popularFiltroMaterias() {
  const select = document.getElementById('filtroMateriaRevisao');
  if (!select) return;
  select.innerHTML = '<option value="todas">Todas as matérias</option>';
  const materiasUnicas = [...new Set(flashcards.map(f => f.materiaNome))];
  materiasUnicas.sort().forEach(materia => {
    select.innerHTML += `<option value="${materia}">${materia}</option>`;
  });
}
function mostrarRespostaFoco() {
  document.getElementById('focoResposta').style.display = 'block';
  document.getElementById('btnMostrarResposta').style.display = 'none';
  document.getElementById('botoesResposta').style.display = 'flex';
}
function responderFlashcard(resultado) {
  const card = revisoesEmAndamento[indiceAtualFoco];
  const flashcardOriginal = flashcards.find(f => f.id === card.id);
  if (!flashcardOriginal) return;
  if (resultado === 'acertei') {
    flashcardOriginal.nivel = Math.min(flashcardOriginal.nivel + 1, 4);
    flashcardOriginal.acertos++;
  } else {
    flashcardOriginal.nivel = Math.max(flashcardOriginal.nivel - 1, 0);
    flashcardOriginal.erros++;
  }
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
// ==================== INICIALIZAR ====================
function initRevisao() {
  adicionarModalFlashcardHTML();
  carregarFlashcards();
  configurarAbasRevisao();
}
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initRevisao();
  });
}
// ===== NOTIFICAÇÕES DE TAREFAS =====
function verificarNotificacoesTarefas() {
  // Verifica se o navegador suporta notificações
  if (!("Notification" in window)) {
    console.log("Este navegador não suporta notificações");
    return;
  }
  if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
  }
  if (Notification.permission !== "granted") return;
  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);
  const amanhaStr = amanha.toISOString().split('T')[0];
  const tarefasAmanha = tarefas.filter(t => t.data === amanhaStr && !t.concluida);
  const ultimaNotificacao = localStorage.getItem('ultimaNotificacaoTarefas');
  const hojeStr = hoje.toISOString().split('T')[0];

  if (tarefasAmanha.length > 0 && ultimaNotificacao !== hojeStr) {
    const titulo = `📋 Você tem ${tarefasAmanha.length} tarefa(s) para amanhã!`;
    const corpo = tarefasAmanha.map(t => `• ${t.titulo} (${t.prioridade})`).join('\n');

    new Notification(titulo, { body: corpo, icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' });
    localStorage.setItem('ultimaNotificacaoTarefas', hojeStr);
  }
} setInterval(() => {
  verificarNotificacoesTarefas();
}, 3600000);

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

  if (calendar) setTimeout(() => calendar.updateSize(), 10);
}

setTimeout(forcarAtualizacaoImediata, 10);

function adicionarModalFlashcardHTML() {
  if (document.getElementById("modalRevisao")) {
    return;
  }
  const modalHTML = `
    <div class="modal fade modal-flashcard" id="modalRevisao" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Novo Flashcard</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-bold">Materia</label>
              <select id="revisaoMateria" class="form-select">
                <option value="">Selecione uma materia</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">Tema</label>
              <input type="text" id="revisaoTema" class="form-control" placeholder="Ex: Citologia, Funcoes...">
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">Pergunta</label>
              <textarea id="revisaoPergunta" class="form-control" rows="2" placeholder="Digite a pergunta..."></textarea>
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">Resposta</label>
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
// ===== PLANOS =====
function verificarPlano() {
  const plano = localStorage.getItem("planoUsuario") || "gratuito";

  const permissoes = {
    gratuito: {
      pomodoroPersonalizado: false,
      focoPersonalizado: false,
      metaEstudo: false,
      estatisticas: false,
      cronograma: false
    },
    basico: {
      pomodoroPersonalizado: true,
      focoPersonalizado: true,
      metaEstudo: true,
      estatisticas: true,
      cronograma: true
    },
    pro: {
      pomodoroPersonalizado: true,
      focoPersonalizado: true,
      metaEstudo: true,
      estatisticas: true,
      cronograma: true
    }
  };

  return {
    plano,
    permissoes: permissoes[plano] || permissoes.gratuito
  };
}

function verificarAcesso(funcionalidade) {
  const { plano, permissoes } = verificarPlano();

  if (!permissoes[funcionalidade]) {
    Swal.fire({
      icon: 'info',
      title: 'Recurso Premium',
      html: `
        <p>Esta funcionalidade esta disponivel nos planos <strong>Basico</strong> e <strong>Pro</strong>.</p>
        <p style="font-size: 0.8rem; color: #6b7280;">Seu plano atual: <strong>${plano.charAt(0).toUpperCase() + plano.slice(1)}</strong></p>
      `,
      confirmButtonText: 'Ver Planos',
      confirmButtonColor: '#9f042c',
      showCancelButton: true,
      cancelButtonText: 'Fechar'
    }).then(result => {
      if (result.isConfirmed) {
        mostrarTela('planos');
        const links = document.querySelectorAll('#menuLateral .nav-link');
        links.forEach(link => link.classList.remove('active'));
        const linkPlanos = document.querySelector('#menuLateral .nav-link[onclick*="planos"]');
        if (linkPlanos) linkPlanos.classList.add('active');
      }
    });
    return false;
  }
  return true;
}

function escolherPlano(tipo) {
  const planoAtual = localStorage.getItem("planoUsuario") || "gratuito";

  if (tipo === planoAtual) {
    Swal.fire({
      icon: 'info',
      title: 'Voce ja esta neste plano!',
      timer: 2000,
      showConfirmButton: false
    });
    return;
  }

  Swal.fire({
    title: 'Confirmar mudanca',
    html: `Deseja mudar para o plano <strong>${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</strong>?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sim, mudar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#9f042c'
  }).then(result => {
    if (result.isConfirmed) {
      localStorage.setItem("planoUsuario", tipo);
      atualizarBotoesPlanos();
      atualizarBadgePlano();
      aplicarBloqueiosPlano();

      Swal.fire({
        icon: 'success',
        title: 'Plano atualizado!',
        text: `Agora voce esta no plano ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}.`,
        timer: 2000,
        showConfirmButton: false
      });
    }
  });
}

function atualizarBotoesPlanos() {
  const { plano } = verificarPlano();

  const btnGratuito = document.getElementById("btnGratuito");
  const btnBasico = document.getElementById("btnBasico");
  const btnPro = document.getElementById("btnPro");

  if (btnGratuito) {
    btnGratuito.textContent = plano === "gratuito" ? "Plano atual" : "Mudar para Gratuito";
    btnGratuito.disabled = plano === "gratuito";
    btnGratuito.style.opacity = plano === "gratuito" ? "0.6" : "1";
  }

  if (btnBasico) {
    btnBasico.textContent = plano === "basico" ? "Plano atual" : "Assinar Basico";
    btnBasico.disabled = plano === "basico";
    btnBasico.style.opacity = plano === "basico" ? "0.6" : "1";
  }

  if (btnPro) {
    btnPro.textContent = plano === "pro" ? "Plano atual" : "Assinar Pro";
    btnPro.disabled = plano === "pro";
    btnPro.style.opacity = plano === "pro" ? "0.6" : "1";
  }

  atualizarBadgePlano();
}

function atualizarBadgePlano() {
  const { plano } = verificarPlano();
  const badge = document.getElementById("badgePlano");

  if (badge) {
    badge.textContent = "Seu plano: " + plano.charAt(0).toUpperCase() + plano.slice(1);
    badge.style.background = plano === "pro" ? "#981515" : plano === "basico" ? "#f59e0b" : "#22c55e";
    badge.style.color = "white";
  }
}
// ===== APLICAR BLOQUEIOS DO PLANO =====
function aplicarBloqueiosPlano() {
  const { permissoes } = verificarPlano();

  const mapaBloqueios = {
    'estatistica': 'estatisticas',
    'cronogramaNovo': 'cronograma'
  };

  document.querySelectorAll('#menuLateral .nav-link').forEach(link => {
    const onclick = link.getAttribute('onclick') || '';

    link.classList.remove('bloqueado');

    for (const [tela, permissao] of Object.entries(mapaBloqueios)) {
      if (onclick.includes(tela) && !permissoes[permissao]) {
        link.classList.add('bloqueado');
      }
    }
  });
}

function mostrarTourBoasVindas() {
  const jaViu = localStorage.getItem("tourBoasVindas");
  if (jaViu) return;
  
  const { plano } = verificarPlano();
  
  const passos = [
    {
      titulo: "Bem-vindo ao Sectio Aurea!",
      texto: "Sua plataforma de estudos personalizada esta pronta. Vou te mostrar como tudo funciona.",
      icone: "bi bi-rocket-takeoff-fill"
    },
    {
      titulo: "Inicio",
      texto: "Aqui voce ve um resumo das suas tarefas, proximos eventos e materias do dia. Tudo centralizado para facilitar sua rotina.",
      icone: "bi bi-house-fill"
    },
    {
      titulo: "Tarefas",
      texto: "Organize suas tarefas com prioridades e datas. Marque como concluidas e mantenha tudo em ordem.",
      icone: "bi bi-check2-square"
    },
    {
      titulo: "Notas",
      texto: "Crie notas com checklist, anexos e personalize as cores. Perfeito para resumos e lembretes.",
      icone: "bi bi-journal-bookmark"
    },
    {
      titulo: "Calendario",
      texto: "Agende seus eventos, provas e compromissos. Tudo integrado com suas tarefas para nao perder nenhum prazo.",
      icone: "bi bi-calendar-event"
    },
    {
      titulo: "Relogio de Estudos",
      texto: "Use o timer, cronometro ou pomodoro para gerenciar seu tempo. O Modo Automatico segue o seu cronograma e inicia os estudos na hora certa.",
      icone: "bi bi-clock"
    },
    {
      titulo: "Estatisticas",
      texto: plano === "gratuito"
        ? "Disponivel nos planos Basico e Pro. Acompanhe seu progresso com graficos detalhados."
        : "Acompanhe seu progresso com graficos, metas e conquistas. Veja quanto tempo estudou cada materia.",
      icone: "bi bi-graph-up"
    },
    {
      titulo: "Cronograma Inteligente",
      texto: plano === "gratuito" 
        ? "Disponivel nos planos Basico e Pro. Monte sua grade semanal arrastando as materias para os dias."
        : "Arraste as materias para os dias da semana e monte sua grade de estudos. O relogio inteligente segue esse cronograma.",
      icone: "bi bi-diagram-3"
    },
    {
      titulo: "Revisao Inteligente",
      texto: "Crie flashcards e use a revisao espacada para fixar o conteudo. O sistema agenda automaticamente as proximas revisoes.",
      icone: "bi bi-arrow-repeat"
    },
    {
      titulo: "Pronto para começar!",
      texto: plano === "gratuito"
        ? "Voce esta no plano Gratuito. Explore as funcionalidades e faca upgrade quando quiser nos Planos."
        : `Voce esta no plano ${plano.charAt(0).toUpperCase() + plano.slice(1)}. Aproveite todas as funcionalidades!`,
      icone: "bi bi-check-circle-fill"
    }
  ];  
  let passoAtual = 0;
  
  function mostrarPasso() {
    const passo = passos[passoAtual];
    const isUltimo = passoAtual === passos.length - 1;
    const isPrimeiro = passoAtual === 0;
    
    Swal.fire({
      title: passo.titulo,
      html: `
        <div style="text-align: center;">
          <i class="${passo.icone}" style="font-size: 3rem; color: var(--cor-primaria); display: block; margin-bottom: 15px;"></i>
          <p style="font-size: 0.95rem; color: #4b5563; line-height: 1.6;">${passo.texto}</p>
          <p style="font-size: 0.75rem; color: #9ca3af; margin-top: 15px;">${passoAtual + 1} de ${passos.length}</p>
        </div>
      `,
      showCancelButton: !isPrimeiro,
      showConfirmButton: true,
      confirmButtonText: isUltimo ? 'Comecar!' : 'Proximo',
      cancelButtonText: 'Voltar',
      confirmButtonColor: '#9f042c',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then((result) => {
      if (result.isConfirmed && !isUltimo) {
        passoAtual++;
        mostrarPasso();
      } else if (result.isConfirmed && isUltimo) {
        localStorage.setItem("tourBoasVindas", "true");
        Swal.fire({
          icon: 'success',
          title: 'Tudo pronto!',
          text: 'Bons estudos e aproveite a plataforma!',
          timer: 2000,
          showConfirmButton: false
        });
      } else if (result.isDismissed && !isPrimeiro) {
        passoAtual--;
        mostrarPasso();
      }
    });
  }
  
  mostrarPasso();
}
function abrirModalAmbiente() {
  const passos = [
    {
      titulo: "Escolha o local",
      texto: "Busque um lugar silencioso, bem iluminado e livre de distracoes. Um ambiente calmo faz toda a diferenca na concentracao.",
      icone: "bi bi-house-check-fill"
    },
    {
      titulo: "Celular longe",
      texto: "Deixe o celular no modo silencioso e fora do seu alcance. Notificacoes sao os maiores viloes do foco nos estudos.",
      icone: "bi bi-phone-vibrate"
    },
    {
      titulo: "Mantenha-se hidratado",
      texto: "Tenha sempre uma garrafa de agua por perto. A hidratacao ajuda o cerebro a funcionar melhor.",
      icone: "bi bi-cup-straw"
    },
    {
      titulo: "Organize o material",
      texto: "Separe todo o material antes de comecar: livros, cadernos, canetas. Assim voce nao perde tempo procurando depois.",
      icone: "bi bi-folder-check"
    },
    {
      titulo: "Metas e pausas",
      texto: "Defina quanto tempo vai estudar e quando vai fazer pausas. Use o timer ou pomodoro do seu Relogio de Estudos.",
      icone: "bi bi-stopwatch"
    },
    {
      titulo: "Objetivos claros",
      texto: "Tenha em mente o que quer aprender nessa sessao. Fica mais facil manter o foco quando voce sabe exatamente o que fazer.",
      icone: "bi bi-bullseye"
    }
  ];
  
  let passoAtual = 0;
  
  function mostrarPasso() {
    const passo = passos[passoAtual];
    const isUltimo = passoAtual === passos.length - 1;
    const isPrimeiro = passoAtual === 0;
    
    Swal.fire({
      title: passo.titulo,
      html: `
        <div style="text-align: center;">
          <i class="${passo.icone}" style="font-size: 3rem; color: var(--cor-primaria); display: block; margin-bottom: 15px;"></i>
          <p style="font-size: 0.95rem; color: #4b5563; line-height: 1.6;">${passo.texto}</p>
          <p style="font-size: 0.75rem; color: #9ca3af; margin-top: 15px;">${passoAtual + 1} de ${passos.length}</p>
        </div>
      `,
      showCancelButton: !isPrimeiro,
      showConfirmButton: true,
      confirmButtonText: isUltimo ? 'Pronto!' : 'Proximo',
      cancelButtonText: 'Voltar',
      confirmButtonColor: '#9f042c',
      customClass: {
        popup: 'rounded-4'
      }
    }).then((result) => {
      if (result.isConfirmed && !isUltimo) {
        passoAtual++;
        mostrarPasso();
      } else if (result.isDismissed && !isPrimeiro) {
        passoAtual--;
        mostrarPasso();
      }
    });
  }
  
  mostrarPasso();
}
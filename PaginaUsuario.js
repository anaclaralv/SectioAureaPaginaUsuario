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
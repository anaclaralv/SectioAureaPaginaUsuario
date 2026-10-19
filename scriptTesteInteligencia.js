// Fallback local caso api.js não seja carregado
if (typeof apiFetch === 'undefined') {
  const API_BASE_URL = 'http://localhost/api_sectio_aurea';
  window.API_BASE_URL = API_BASE_URL;
  window.apiFetch = async function (endpoint, options = {}) {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const config = { ...options, headers };
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);
    if (response.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'ProjetoIntegrador.html';
    }
    return response;
  };
}

if (typeof normalizarInteligenciaParaBanco === 'undefined') {
  window.normalizarInteligenciaParaBanco = function(slug) {
    const mapa = {
      "linguistica": "Linguística", "logico": "Lógico-matemática", "musical": "Musical",
      "corporal": "Cinestésica", "espacial": "Espacial", "interpessoal": "Interpessoal", "intrapessoal": "Intrapessoal"
    };
    return mapa[slug] || slug;
  };
}

const area = document.getElementById("perguntasArea");
const tipos = { A: "Corporal-Cinestésica", B: "Espacial", C: "Interpessoal", D: "Intrapessoal", E: "Linguística", F: "Lógico-Matemática", G: "Musical" };
const coresInteligencia = { A: "#00bf63", B: "#d203a4", C: "#ff5f00", D: "#5170ff", E: "#9f042c", F: "#ffbd59", G: "#8a03d2" };
const pontuacao = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0 };
let respostasPorEtapa = [];

const etapas = [
  {
    titulo: "O que mais gosto de fazer:",
    itens: {
      A: "Praticar esportes", B: "Dirigir", C: "Compartilhar atividades",
      D: "Refletir sobre meus sentimentos", E: "Debater ideias", F: "Ordenar coisas", G: "Cantar"
    }
  }
];

let etapaAtual = 0;
let chartInstance = null;
let respostasEtapa = {};

function mostrarEtapa() {
  area.innerHTML = "";
  const etapa = etapas[etapaAtual];
  const totalEtapas = etapas.length;
  
  if (respostasPorEtapa[etapaAtual]) respostasEtapa = { ...respostasPorEtapa[etapaAtual] };
  else respostasEtapa = {};

  const div = document.createElement("div");
  div.classList.add("etapa-container");
  
  let html = `
    <h4 class="etapa-titulo text-center mb-3">${etapa.titulo}</h4>
    <p class="etapa-info text-center">Etapa ${etapaAtual + 1} de ${totalEtapas}</p>
  `;
  
  for (let letra in etapa.itens) {
    const item = etapa.itens[letra];
    const cor = coresInteligencia[letra];
    html += `
      <div class="item-bloco" data-item="${letra}" style="border-left: 5px solid ${cor};">
        <h5 style="color: ${cor};">${item}</h5>
        <div class="question" data-letra="${letra}">
          ${[1, 2, 3, 4, 5, 6, 7].map(valor => `
            <label class="radio-label">
            <input type="radio" name="item_${letra}" value="${valor}" data-letra="${letra}" ${valor == respostasEtapa[letra] ? 'checked' : ''}>
              <span>${valor}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  div.innerHTML = html;
  area.appendChild(div);
  
  function atualizarDestaqueItens() {
    document.querySelectorAll('.item-bloco').forEach(bloco => {
      const letra = bloco.querySelector('input[type="radio"]')?.dataset.letra;
      if (letra && !respostasEtapa[letra]) {
        bloco.style.border = '1px solid #03030360';
        bloco.style.borderLeft = '5px solid #030303c1'; 
        bloco.style.opacity = '1';
      } else {
        bloco.style.border = '1px solid transparent'; 
        bloco.style.borderLeft = `5px solid ${coresInteligencia[letra]}`;
        bloco.style.opacity = '0.85';
      }
    });
  }
  
  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('click', function(e) {
      if (this.checked && respostasEtapa[this.dataset.letra] === this.value) {
        this.checked = false;
        delete respostasEtapa[this.dataset.letra];
        document.querySelectorAll('input[type="radio"]').forEach(r => {
          if (r.value === this.value) r.disabled = false;
        });
        atualizarBotao(); atualizarDestaqueItens();
        e.stopPropagation(); return;
      }
    });
    
    radio.addEventListener('change', function() {
      const letra = this.dataset.letra;
      if (respostasEtapa[letra]) {
        const valorAntigo = respostasEtapa[letra];
        document.querySelectorAll('input[type="radio"]').forEach(r => {
          if (r.value === valorAntigo) r.disabled = false;
        });
        delete respostasEtapa[letra];
      }
      respostasEtapa[letra] = this.value;
      document.querySelectorAll('input[type="radio"]').forEach(r => {
        const valorUsado = Object.entries(respostasEtapa).some(([l, v]) => l !== r.dataset.letra && v === r.value);
        r.disabled = valorUsado;
      });
      atualizarBotao(); atualizarDestaqueItens();
    });
  });
  
  atualizarBarra(); atualizarBotao(); atualizarDestaqueItens(); atualizarBotaoVoltar();
}

function atualizarBotao() {
  const btn = document.getElementById("btnNext");
  const total = Object.keys(respostasEtapa).length;
  if (total === 7) { btn.disabled = false; btn.innerText = etapaAtual === etapas.length - 1 ? "Finalizar" : "Próxima Etapa"; }
  else { btn.disabled = true; btn.innerText = `Responda ${7 - total} item(ns)`; }
}

function atualizarBotaoVoltar() {
  const btnPrev = document.getElementById("btnPrev");
  if (btnPrev) { btnPrev.disabled = (etapaAtual === 0); btnPrev.style.opacity = etapaAtual === 0 ? '0.5' : '1'; }
}

document.getElementById("btnNext").onclick = () => {
  if (Object.keys(respostasEtapa).length < 7) return;
  respostasPorEtapa[etapaAtual] = { ...respostasEtapa };
  etapaAtual++;
  if (etapaAtual < etapas.length) mostrarEtapa();
  else {
    respostasPorEtapa.forEach(respostas => { for (let letra in respostas) pontuacao[letra] += parseInt(respostas[letra]); });
    mostrarResultado();
  }
};

document.getElementById("btnPrev").onclick = () => {
  if (etapaAtual > 0) { respostasPorEtapa[etapaAtual] = { ...respostasEtapa }; etapaAtual--; mostrarEtapa(); }
};

document.getElementById("btnLimpar").onclick = () => {
  Swal.fire({
    title: 'Limpar tudo?', text: 'Todas as respostas serão apagadas.', icon: 'warning',
    showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Sim', cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      respostasPorEtapa = []; respostasEtapa = {};
      for (let letra in pontuacao) pontuacao[letra] = 0;
      etapaAtual = 0; mostrarEtapa();
    }
  });
};

function atualizarBarra() {
  document.getElementById("barraInterna").style.width = ((etapaAtual / etapas.length) * 100) + "%";
}

function mostrarResultado() {
  let maior = ""; let maiorValor = -1;
  for (let letra in pontuacao) { if (pontuacao[letra] > maiorValor) { maiorValor = pontuacao[letra]; maior = letra; } }

  const tipoMapeado = { 'A': 'corporal', 'B': 'espacial', 'C': 'interpessoal', 'D': 'intrapessoal', 'E': 'linguistica', 'F': 'logico', 'G': 'musical' };
  const tipoFinal = tipoMapeado[maior];
  document.getElementById("dominante").innerHTML = `<strong>Sua inteligência dominante é:</strong><br>${tipos[maior]}`;

  const ordenadas = Object.entries(pontuacao).sort((a, b) => b[1] - a[1]);
  const tresDominantes = {}; ordenadas.slice(0, 3).forEach(([letra, valor]) => { tresDominantes[letra] = valor; });

  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  if (token) {
    apiFetch("perfil", {
      method: "PUT",
      body: JSON.stringify({ tipo_dom: normalizarInteligenciaParaBanco(tipoFinal), clas_inteli: tresDominantes })
    }).then(response => {
      if (response.ok) {
        const storage = sessionStorage.getItem("token") ? sessionStorage : localStorage;
        const user = JSON.parse(storage.getItem("user") || "{}");
        user.tipo_dom = tipoFinal; user.clas_inteli = tresDominantes;
        storage.setItem("user", JSON.stringify(user));
      }
    }).catch(err => console.error(err));
  }

  const modalEl = document.getElementById('resultadoModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  modalEl.addEventListener('shown.bs.modal', function() {
    const ctx = document.getElementById('graficoPizza').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: { labels: Object.values(tipos), datasets: [{ data: Object.values(pontuacao), backgroundColor: Object.values(coresInteligencia), borderWidth: 2, borderColor: '#ffffff' }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 15, padding: 15, font: { size: 11 }, color: document.body.classList.contains('dark') ? '#ffffff' : '#000000' } } } }
    });
  }, { once: true });

  const coresPorSlug = { 'corporal': '#00bf63', 'espacial': '#d203a4', 'interpessoal': '#ff5f00', 'intrapessoal': '#5170ff', 'linguistica': '#9f042c', 'logico': '#ffbd59', 'musical': '#8a03d2' };
  const corFinal = coresPorSlug[tipoFinal] || coresInteligencia[maior] || "#00bf63";

  localStorage.setItem('inteligenciaUsuario', tipoFinal);
  localStorage.setItem('corPrimaria', corFinal);
  sessionStorage.setItem('inteligenciaUsuario', tipoFinal);
  sessionStorage.setItem('corPrimaria', corFinal);

  document.getElementById("btnVamo").onclick = () => {
    modal.hide();
    setTimeout(() => {
      const tokenAtual = sessionStorage.getItem("token") || localStorage.getItem("token");
      const userAtual = sessionStorage.getItem("user") || localStorage.getItem("user");
      if (tokenAtual) {
        localStorage.setItem("token", tokenAtual);
        if (userAtual) localStorage.setItem("user", userAtual);
      }
      const corSalva = localStorage.getItem('corPrimaria') || '#6c757d';
      // 👇 AQUI ELE MANDA O TOKEN NA URL
      window.location.href = `http://localhost:5173/?tipo=${tipoFinal}&cor=${encodeURIComponent(corSalva)}&token=${tokenAtual}`;
    }, 300);
  };
}

const toggleBtn = document.getElementById('toggleTema');
const iconTheme = document.getElementById('iconTheme');
if (localStorage.getItem('theme') === 'dark') { document.body.classList.add('dark'); if (iconTheme) iconTheme.textContent = '☀️'; }
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    if (iconTheme) iconTheme.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    if (chartInstance) { chartInstance.options.plugins.legend.labels.color = document.body.classList.contains('dark') ? '#ffffff' : '#000000'; chartInstance.update(); }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (token) {
    apiFetch("perfil").then(response => {
      if (!response.ok) throw new Error('Erro');
      return response.json();
    }).then(data => {
      if (data.tipo_dom && data.tipo_dom.trim() !== '') bloquearTeste();
      else iniciarTeste();
    }).catch(() => {
      const user = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
      if (user.tipo_dom && user.tipo_dom.trim() !== '') bloquearTeste();
      else iniciarTeste();
    });
  } else iniciarTeste();
});

function bloquearTeste() {
  Swal.fire({
    icon: 'warning', title: 'Teste já realizado!', text: 'Você já realizou o teste.',
    confirmButtonColor: '#000000', allowOutsideClick: false, allowEscapeKey: false
  }).then(() => {
    const tokenAtual = sessionStorage.getItem("token") || localStorage.getItem("token");
    const tipoSalvo = localStorage.getItem('inteligenciaUsuario') || 'logico';
    const corSalva = localStorage.getItem('corPrimaria') || '#6c757d';
    window.location.href = `http://localhost:5173/?tipo=${tipoSalvo}&cor=${encodeURIComponent(corSalva)}&token=${tokenAtual}`;
  });
}

function iniciarTeste() {
  if (!localStorage.getItem('tutorialVisto')) {
    setTimeout(() => {
      const modalEl = document.getElementById('modalTutorial');
      if (modalEl) { new bootstrap.Modal(modalEl).show(); localStorage.setItem('tutorialVisto', 'true'); }
    }, 500);
  }
  mostrarEtapa();
}
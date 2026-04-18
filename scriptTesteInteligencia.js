const area = document.getElementById("perguntasArea");

const tipos = {
  A: "Corporal-Cinestésica",
  B: "Espacial",
  C: "Interpessoal",
  D: "Intrapessoal",
  E: "Linguística",
  F: "Lógico-Matemática",
  G: "Musical"
};

// Cores para cada inteligência
const coresInteligencia = {
  A: "#00bf63", // Verde - Corporal
  B: "#d203a4", // Rosa - Espacial
  C: "#ff5f00", // Laranja - Interpessoal
  D: "#5170ff", // Azul - Intrapessoal
  E: "#9f042c", // Vermelho - Linguística
  F: "#ffbd59", // Amarelo - Lógico
  G: "#8a03d2"  // Roxo - Musical
};

const pontuacao = {
  A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0
};

// Array para guardar as respostas de CADA etapa (para poder voltar)
let respostasPorEtapa = [];

// ===== PERGUNTAS =====
const etapas = [/*
  {
    titulo: "O que mais gosto de fazer:",
    itens: {
      A: "Praticar esportes",
      B: "Dirigir",
      C: "Compartilhar atividades",
      D: "Refletir sobre meus sentimentos",
      E: "Debater ideias",
      F: "Ordenar coisas",
      G: "Cantar"
    }
  },
  {
    titulo: "Tenho facilidade em:",
    itens: {
      A: "Aprender esportes",
      B: "Executar tarefas delicadas",
      C: "Trabalhar em equipe",
      D: "Analisar sentimentos",
      E: "Contar histórias",
      F: "Organizar coisas",
      G: "Tocar instrumentos"
    }
  },
  {
    titulo: "Na escola eu prefiro:",
    itens: {
      A: "Me movimentar",
      B: "Fazer algo funcionar",
      C: "Trabalhar com pessoas",
      D: "Trabalhar sozinho",
      E: "Conversar ideias",
      F: "Analisar dados",
      G: "Ouvir sons"
    }
  },
  {
    titulo: "Pergunta que mais faço:",
    itens: {
      A: "Onde?",
      B: "Como?",
      C: "Quem?",
      D: "Para quê?",
      E: "Por quê?",
      F: "O quê?",
      G: "Quando?"
    }
  },
  {
    titulo: "No tempo livre gosto de:",
    itens: {
      A: "Dançar",
      B: "Trabalho manual",
      C: "Sair com amigos",
      D: "Refletir",
      E: "Ler",
      F: "Jogos de estratégia",
      G: "Ouvir música"
    }
  },
  {
    titulo: "Tenho facilidade em:",
    itens: {
      A: "Aprender praticando",
      B: "Perceber detalhes",
      C: "Compartilhar ideias",
      D: "Criar teorias",
      E: "Discutir ideias",
      F: "Organizar informações",
      G: "Estudar com música"
    }
  },
  {
    titulo: "Em casa eu:",
    itens: {
      A: "Não paro",
      B: "Conserto coisas",
      C: "Ajudo pessoas",
      D: "Fico quieto",
      E: "Converso",
      F: "Organizo tudo",
      G: "Ouço música"
    }
  },
  {
    titulo: "As pessoas me veem como:",
    itens: {
      A: "Esportista",
      B: "Competente",
      C: "Perceptivo",
      D: "Analítico",
      E: "Comunicativo",
      F: "Lógico",
      G: "Artista"
    }
  },
  {
    titulo: "Aprendo melhor com:",
    itens: {
      A: "Prática",
      B: "Passo a passo",
      C: "Discussões",
      D: "Leitura",
      E: "Explicações",
      F: "Análise",
      G: "Música"
    }
  },*/
  {
    titulo: "Eu me considero:",
    itens: {
      A: "Ágil",
      B: "Detalhista",
      C: "Amigo",
      D: "Sensível",
      E: "Comunicativo",
      F: "Racional",
      G: "Musical"
    }
  }
];

let etapaAtual = 0;
let chartInstance = null;
let respostasEtapa = {};

function mostrarEtapa() {
  area.innerHTML = "";
  
 area.innerHTML = "";
  
  const etapa = etapas[etapaAtual];
  const totalEtapas = etapas.length;
  
  // ✅ CORRETO - Carrega ou cria vazio
  if (respostasPorEtapa[etapaAtual]) {
    respostasEtapa = { ...respostasPorEtapa[etapaAtual] };
  } else {
    respostasEtapa = {};
  }

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
  
  // NOVO: Função para atualizar destaque dos itens
  function atualizarDestaqueItens() {
  document.querySelectorAll('.item-bloco').forEach(bloco => {
    const letra = bloco.querySelector('input[type="radio"]')?.dataset.letra;
    
    if (letra && !respostasEtapa[letra]) {
      // Item NÃO respondido -> borda sutil
      bloco.style.transition = 'all 0.3s ease';
      bloco.style.border = '1px solid #03030360';        // Borda fina ao redor
      bloco.style.borderLeft = '5px solid #030303c1'; 
      bloco.style.opacity = '1';
    } else {
      // Item respondido -> borda da cor da inteligência (já existe)
      const cor = coresInteligencia[letra];
      bloco.style.border = '1px solid transparent'; 
      bloco.style.borderLeft = `5px solid ${cor}`;
      bloco.style.opacity = '0.85'; // Levemente "resolvido"
    }
  });
}
  
  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    // Permite desselecionar clicando no mesmo rádio
    radio.addEventListener('click', function(e) {
      if (this.checked && respostasEtapa[this.dataset.letra] === this.value) {
        this.checked = false;
        const letra = this.dataset.letra;
        delete respostasEtapa[letra];
        
        const valor = this.value;
        document.querySelectorAll('input[type="radio"]').forEach(r => {
          if (r.value === valor) {
            r.disabled = false;
          }
        });
        
        atualizarBotao();
        atualizarDestaqueItens(); // NOVO
        e.stopPropagation();
        return;
      }
    });
    
    radio.addEventListener('change', function() {
      const letra = this.dataset.letra;
      const valor = this.value;
      
      if (respostasEtapa[letra]) {
        const valorAntigo = respostasEtapa[letra];
        document.querySelectorAll('input[type="radio"]').forEach(r => {
          if (r.value === valorAntigo) {
            r.disabled = false;
          }
        });
        delete respostasEtapa[letra];
      }
      
      respostasEtapa[letra] = valor;
      
      document.querySelectorAll('input[type="radio"]').forEach(r => {
        const rLetra = r.dataset.letra;
        const rValor = r.value;
        
        const valorUsado = Object.entries(respostasEtapa).some(
          ([l, v]) => l !== rLetra && v === rValor
        );
        
        r.disabled = valorUsado;
      });
      
      atualizarBotao();
      atualizarDestaqueItens(); // NOVO
    });
  });
  
  atualizarBarra();
  atualizarBotao();
  atualizarDestaqueItens(); // NOVO: destaque inicial
  atualizarBotaoVoltar();
}

function atualizarBotao() {
  const btn = document.getElementById("btnNext");
  const totalRespondido = Object.keys(respostasEtapa).length;
  
  if (totalRespondido === 7) {
    btn.disabled = false;
    btn.innerText = etapaAtual === etapas.length - 1 ? "Finalizar" : "Próxima Etapa";
  } else {
    btn.disabled = true;
    btn.innerText = `Responda ${7 - totalRespondido} item(ns)`;
  }
}
function atualizarBotaoVoltar() {
  const btnPrev = document.getElementById("btnPrev");
  if (btnPrev) {
    btnPrev.disabled = (etapaAtual === 0);
    btnPrev.style.opacity = etapaAtual === 0 ? '0.5' : '1';
  }
}

// Botão Próxima
document.getElementById("btnNext").onclick = () => {
  if (Object.keys(respostasEtapa).length < 7) {
    Swal.fire({
      icon: "warning",
      title: "Atenção!",
      text: "Você precisa classificar todos os 7 itens de 1 a 7.",
      confirmButtonColor: "#000000"
    });
    return;
  }
  
  // Salva as respostas desta etapa
  respostasPorEtapa[etapaAtual] = { ...respostasEtapa };
  
  etapaAtual++;
  
  if (etapaAtual < etapas.length) {
    mostrarEtapa();
  } else {
    // Soma todas as pontuações ao finalizar
    respostasPorEtapa.forEach(respostas => {
      for (let letra in respostas) {
        pontuacao[letra] += parseInt(respostas[letra]);
      }
    });
    mostrarResultado();
  }
};

// Botão Voltar
document.getElementById("btnPrev").onclick = () => {
  if (etapaAtual > 0) {
    // Salva respostas atuais antes de voltar
    respostasPorEtapa[etapaAtual] = { ...respostasEtapa };
    
    etapaAtual--;
    mostrarEtapa();
  }
};

function atualizarBarra() {
  const total = etapas.length;
  const progresso = (etapaAtual / total) * 100; // ✅ Usa etapaAtual (já foi decrementada no voltar)
  document.getElementById("barraInterna").style.width = progresso + "%";
}

function mostrarResultado() {
  let maior = "";
  let maiorValor = -1;

  for (let letra in pontuacao) {
    if (pontuacao[letra] > maiorValor) {
      maiorValor = pontuacao[letra];
      maior = letra;
    }
  }

  const tipoMapeado = {
    'A': 'corporal',
    'B': 'espacial',
    'C': 'interpessoal',
    'D': 'intrapessoal',
    'E': 'linguistica',
    'F': 'logico',
    'G': 'musical'
  };

  const tipoFinal = tipoMapeado[maior];
  
  document.getElementById("dominante").innerHTML = 
    `<strong>Sua inteligência dominante é:</strong><br>${tipos[maior]}`;

  const modalEl = document.getElementById('resultadoModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  modalEl.addEventListener('shown.bs.modal', function() {
    const canvas = document.getElementById('graficoPizza');
    const ctx = canvas.getContext('2d');
    
    if (chartInstance) {
      chartInstance.destroy();
    }
    
    const valores = Object.values(pontuacao);
    const labels = Object.values(tipos);
    
    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: valores,
          backgroundColor: Object.values(coresInteligencia),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 15,
              padding: 15,
              font: { size: 11 },
              color: document.body.classList.contains('dark') ? '#ffffff' : '#000000'
            }
          }
        }
      }
    });
  }, { once: true });

  document.getElementById("btnVamo").onclick = () => {
    modal.hide();
    setTimeout(() => {
      window.location.href = `efeito.html?tipo=${tipoFinal}`;
    }, 300);
  };
}

// Dark Mode
const toggleBtn = document.getElementById('toggleTema');
const iconTheme = document.getElementById('iconTheme');

if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
  iconTheme.textContent = '☀️';
}

toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  iconTheme.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  
  if (chartInstance) {
    chartInstance.options.plugins.legend.labels.color = 
      document.body.classList.contains('dark') ? '#ffffff' : '#000000';
    chartInstance.update();
  }
});

// Inicia
mostrarEtapa();

// Abre o tutorial automaticamente (só na primeira vez)
document.addEventListener('DOMContentLoaded', function() {
  const tutorialVisto = localStorage.getItem('tutorialVisto');
  
  if (!tutorialVisto) {
    setTimeout(() => {
      const modalTutorial = new bootstrap.Modal(document.getElementById('modalTutorial'));
      modalTutorial.show();
      localStorage.setItem('tutorialVisto', 'true');
    }, 300);
  }
});

// Opcional: Botão "Revisar tutorial" na navbar ou rodapé
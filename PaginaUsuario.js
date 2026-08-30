// Fallback local caso api.js não seja carregado
if (typeof apiFetch === 'undefined') {
  const API_BASE_URL = (window.location.origin && window.location.origin !== 'null' && !window.location.href.startsWith('file:'))
    ? window.location.origin + '/SectioAureaPaginaUsuario/api'
    : 'http://localhost/SectioAureaPaginaUsuario/api';
  window.API_BASE_URL = API_BASE_URL;
  window.apiFetch = async function (endpoint, options = {}) {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const config = {
      ...options,
      headers,
    };
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

if (typeof normalizarInteligencia === 'undefined') {
  window.normalizarInteligencia = function (nomeDb) {
    if (!nomeDb || typeof nomeDb !== 'string') return "";
    const mapa = {
      "Linguística": "linguistica",
      "linguistica": "linguistica",
      "Lógico-matemática": "logico",
      "Lógico-Matemática": "logico",
      "lógico-matemática": "logico",
      "lógico-matematica": "logico",
      "logico-matematica": "logico",
      "Musical": "musical",
      "musical": "musical",
      "Cinestésica": "corporal",
      "cinestésica": "corporal",
      "cinestesica": "corporal",
      "Corporal-Cinestésica": "corporal",
      "corporal-cinestésica": "corporal",
      "corporal-cinestesica": "corporal",
      "Espacial": "espacial",
      "espacial": "espacial",
      "Interpessoal": "interpessoal",
      "interpessoal": "interpessoal",
      "Intrapessoal": "intrapessoal",
      "intrapessoal": "intrapessoal"
    };
    return mapa[nomeDb] || mapa[nomeDb.trim()] || nomeDb.toLowerCase().trim();
  };
}

if (!sessionStorage.getItem("token") && !localStorage.getItem("token")) {
  window.location.href = "ProjetoIntegrador.html";
}

async function carregarPerfilUsuario() {
  try {
    const response = await apiFetch("perfil");
    if (response.ok) {
      const data = await response.json();
      const sidebarNome = document.getElementById('sidebarNome');
      const sidebarEmail = document.getElementById('sidebarEmail');
      const sidebarFoto = document.getElementById('sidebarFoto');
      if (sidebarNome) sidebarNome.textContent = data.nome;
      if (sidebarEmail) sidebarEmail.textContent = data.email;
      const previewFoto = document.getElementById('previewFoto');
      const storage = sessionStorage.getItem("token") ? sessionStorage : localStorage;
      if (data.foto) {
        if (sidebarFoto) sidebarFoto.src = data.foto;
        if (previewFoto) previewFoto.src = data.foto;
        storage.setItem("userFoto", data.foto);
      } else {
        const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
        if (sidebarFoto) sidebarFoto.src = defaultAvatar;
        if (previewFoto) previewFoto.src = defaultAvatar;
        storage.removeItem("userFoto");
      }
      storage.setItem("user", JSON.stringify(data));
      window.usuarioLogadoPerfil = data;

      if (data.tipo_dom) {
        aplicarTemaInteligencia(normalizarInteligencia(data.tipo_dom));
      }

      // Atualizar badge, botões e bloqueios de planos
      if (typeof atualizarBadgePlano === 'function') atualizarBadgePlano();
      if (typeof atualizarBotoesPlanos === 'function') atualizarBotoesPlanos();
    }
    if (typeof aplicarBloqueiosPlano === 'function') {
        aplicarBloqueiosPlano();
      }
      if (typeof atualizarBotoesPlanos === 'function') {
        atualizarBotoesPlanos();
      }
  } catch (err) {
    console.error(err);
  }
}

async function carregarTarefasDoBackend() {
  try {
    const response = await apiFetch("tarefas");
    if (response.ok) {
      const data = await response.json();
      tarefas = data.map(t => {
        const dif = t.dificuldade || "media";
        const concluida = dif.endsWith("-concluida");
        const prioridade = concluida ? dif.replace("-concluida", "") : dif;
        return {
          id: t.id_tarefa,
          titulo: extrairTituloLimpo(t.nome_tarefa) || "Tarefa sem nome",
          prioridade: prioridade || "media",
          data: t.prazo || "",
          concluida: concluida
        };
      });
    }
  } catch (err) {
    console.error("Erro ao carregar tarefas:", err);
  }
}

async function carregarNotasDoBackend() {
  try {
    const response = await apiFetch("blocos");
    if (response.ok) {
      const data = await response.json();
      notas = data.map(n => {
        let parsed = {};
        try {
          parsed = JSON.parse(n.conteudo);
        } catch (e) {
          parsed = { texto: n.conteudo };
        }
        return {
          id: n.id_anotacao,
          titulo: parsed.titulo || "",
          texto: parsed.texto || "",
          cor: n.cor_nota || "#ffffff",
          corTexto: parsed.corTexto || "#000000",
          checklist: parsed.checklist || [],
          anexos: parsed.anexos || [],
          favorito: parsed.favorito || false,
          dataCriacao: parsed.dataCriacao || ""
        };
      });
    }
  } catch (err) {
    console.error("Erro ao carregar notas:", err);
  }
}

function decodeHtmlEntities(str) {
  if (typeof str !== 'string') return str;
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

function extrairTituloLimpo(val) {
  if (!val) return "";
  if (typeof val === "object" && val !== null) {
    if (val.title) return extrairTituloLimpo(val.title);
    return JSON.stringify(val);
  }
  if (typeof val === "string") {
    let str = decodeHtmlEntities(val).trim();
    if (str.startsWith("{") && str.endsWith("}")) {
      try {
        const parsed = JSON.parse(str);
        if (parsed && typeof parsed === "object") {
          if (parsed.title) return extrairTituloLimpo(parsed.title);
        }
      } catch (e) { }
    }
    return str;
  }
  return val;
}
window.extrairTituloLimpo = extrairTituloLimpo;

async function carregarEventosDoBackend() {
  try {
    const response = await apiFetch("eventos");
    if (response.ok) {
      const data = await response.json();
      const events = data.map(e => {
        let parsed = {};
        let rawTipo = decodeHtmlEntities(e.tipo);
        let rawTitle = rawTipo;
        try {
          parsed = JSON.parse(rawTipo);
          if (typeof parsed === 'string') {
            try { parsed = JSON.parse(parsed); } catch (ex) { }
          }
          if (typeof parsed === 'object' && parsed !== null) {
            rawTitle = parsed.title || rawTipo;
          }
        } catch (err) {
          parsed = { title: rawTipo, extendedProps: {} };
        }
        const cleanTitle = extrairTituloLimpo(rawTitle);
        return {
          id: e.id_evento,
          title: cleanTitle,
          start: e.data,
          backgroundColor: e.cor,
          borderColor: e.cor,
          extendedProps: (parsed && parsed.extendedProps) ? parsed.extendedProps : {}
        };
      });
      return events;
    }
  } catch (err) {
    console.error("Erro ao carregar eventos:", err);
  }
  return [];
}

async function salvarEventoNoBackend(titulo, data, cor, extendedProps) {
  const tituloLimpo = extrairTituloLimpo(titulo);
  try {
    const response = await apiFetch("eventos", {
      method: "POST",
      body: JSON.stringify({
        tipo: JSON.stringify({ title: tituloLimpo, extendedProps: extendedProps }),
        data: data,
        cor: cor
      })
    });
    return response.ok;
  } catch (err) {
    console.error("Erro ao salvar evento:", err);
    return false;
  }
}

async function carregarMateriasDoBackend() {
  try {
    const response = await apiFetch("materias");
    if (response.ok) {
      const data = await response.json();
      materias = data.map(m => ({
        id: m.id_materia.toString(),
        nome: m.nome,
        cor: m.cor
      }));
    }
  } catch (err) {
    console.error("Erro ao carregar matérias:", err);
  }
}

async function carregarCronogramaDoBackend() {
  try {
    const response = await apiFetch("cronogramas");
    if (response.ok) {
      const data = await response.json();
      cronogramaNovo = data.map(c => {
        const materiaObj = materias.find(m => m.id == c.id_materia);
        return {
          id: c.id_cronograma,
          materia: {
            id: c.id_materia,
            nome: c.nome_materia,
            cor: materiaObj ? materiaObj.cor : '#9f042c'
          },
          dia: c.dia_semana,
          inicio: c.hora_inicio.substring(0, 5),
          fim: c.hora_final.substring(0, 5)
        };
      });
    }
  } catch (err) {
    console.error("Erro ao carregar cronograma:", err);
  }
}

async function carregarSessoesDoBackend() {
  try {
    const response = await apiFetch("cronometros");
    if (response.ok) {
      const sessoes = await response.json();
      tempoEstudo = {};

      materias.forEach(m => {
        tempoEstudo[m.id] = { total: 0, historico: {} };
      });

      sessoes.forEach(sessao => {
        const matId = sessao.id_materia;
        if (!matId) return;
        if (!tempoEstudo[matId]) {
          tempoEstudo[matId] = { total: 0, historico: {} };
        }

        const segundos = timeToSeconds(sessao.tempo_cronometro);
        tempoEstudo[matId].total += segundos;

        const dataStr = sessao.created_at.split(' ')[0];
        if (!tempoEstudo[matId].historico[dataStr]) {
          tempoEstudo[matId].historico[dataStr] = 0;
        }
        tempoEstudo[matId].historico[dataStr] += segundos;
      });
    }
  } catch (err) {
    console.error("Erro ao carregar sessões de estudo:", err);
  }
}

function timeToSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hrs = parseInt(parts[0]) || 0;
  const mins = parseInt(parts[1]) || 0;
  const secs = parseInt(parts[2]) || 0;
  return (hrs * 3600) + (mins * 60) + secs;
}

function secondsToTime(totalSecs) {
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return [
    String(hrs).padStart(2, '0'),
    String(mins).padStart(2, '0'),
    String(secs).padStart(2, '0')
  ].join(':');
}

async function salvarSessaoEstudoNoBackend(materiaId, segundos, descricao = "Sessão de Estudo") {
  if (!materiaId || segundos <= 0) return;
  try {
    const formattedTime = secondsToTime(segundos);
    const response = await apiFetch("cronometros", {
      method: "POST",
      body: JSON.stringify({
        id_materia: materiaId,
        tempo_cronometro: formattedTime,
        descricao: descricao,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })
    });
    if (response.ok) {
      console.log("Sessão de estudo registrada no backend com sucesso!");
      await carregarSessoesDoBackend();
    }
  } catch (err) {
    console.error("Erro ao salvar sessão de estudo:", err);
  }
}

let todasInteligencias = [];

async function carregarInteligenciasDoBackend() {
  try {
    const response = await apiFetch("inteligencias");
    if (response.ok) {
      todasInteligencias = await response.json();
    }
  } catch (err) {
    console.error("Erro ao carregar inteligências:", err);
  }
}

const iconesInteligencia = {
  linguistica: "Icones/linguistica.png",
  logico: "Icones/logico.png",
  musical: "Icones/musical.png",
  corporal: "Icones/corporal.png",
  espacial: "Icones/espacial.png",
  interpessoal: "Icones/interpessoal.png",
  intrapessoal: "Icones/intrapessoal.png"
};

const metodosPorInteligencia = {
  // ==================== LINGUÍSTICA ====================
  linguistica: {
    nome: "Linguística",
    cor: "#9f042c",
    descricao: "Você aprende melhor com palavras, leitura, escrita e comunicação. Os métodos abaixo foram selecionados para seu perfil.",
    metodos: [
      {
        id: 1, titulo: "Pomodoro", tempo: "25 min", dificuldade: "Fácil",
        descricao: "Estude em blocos de 25 minutos com pausas de 5 minutos. A cada ciclo, mude o conteúdo.",
        passos: ["Escolha o conteúdo", "Estude por 25 minutos", "Descanse 5 minutos", "Repita o ciclo", "A cada 4 ciclos, faça uma pausa longa de 15-30 minutos"],
        beneficios: ["Mantém o foco", "Evita cansaço mental", "Aumenta a produtividade"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Técnica Feynman", tempo: "30 min", dificuldade: "Médio",
        descricao: "Aprenda explicando o conceito em voz alta com suas próprias palavras, como se estivesse ensinando alguém.",
        passos: ["Escolha um conceito", "Explique em voz alta com palavras simples", "Identifique as lacunas na sua explicação", "Volte ao material original e estude novamente", "Reveja e simplifique"],
        beneficios: ["Desenvolve a comunicação", "Identifica pontos fracos", "Fixa o conteúdo"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 3, titulo: "Leitura Savoring", tempo: "40 min", dificuldade: "Fácil",
        descricao: "Leia devagar, intercalando com pausas para reflexão e resumos pessoais.",
        passos: ["Escolha um texto relevante", "Leia um trecho por vez", "Pause e reflita sobre o que leu", "Anote suas reflexões", "Faça um resumo com suas palavras"],
        beneficios: ["Aumenta a compreensão", "Melhora o vocabulário", "Desenvolve pensamento crítico"],
        irParaRevisao: false
      },
      {
        id: 4, titulo: "Grupos de Estudo", tempo: "50 min", dificuldade: "Médio",
        descricao: "Estude em grupo para trocar conhecimento, esclarecer dúvidas e reforçar conceitos ao ensinar colegas.",
        passos: ["Forme um grupo de 3-5 pessoas", "Divida os temas entre os membros", "Cada um prepara sua parte", "Revezem as explicações", "Tirem dúvidas coletivamente"],
        beneficios: ["Troca de conhecimento", "Desenvolve habilidades sociais", "Aprendizado colaborativo"],
        irParaRevisao: false
      },
      {
        id: 5, titulo: "Flashcards", tempo: "25 min", dificuldade: "Fácil",
        descricao: "Crie cartões com perguntas de um lado e respostas do outro para revisar conceitos.",
        passos: ["Escreva uma pergunta na frente do cartão", "Escreva a resposta no verso", "Teste-se diariamente", "Separe o que acertou do que errou", "Revise mais os que errou"],
        beneficios: ["Memorização ativa", "Revisão eficiente", "Portabilidade"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 6, titulo: "Mnemônica com Palavras, Poemas ou Músicas", tempo: "20 min", dificuldade: "Fácil",
        descricao: "Crie associações usando rimas, siglas, poemas ou músicas para memorizar conteúdo.",
        passos: ["Liste as informações a memorizar", "Crie uma sigla ou frase conectando os conceitos", "Ou transforme em uma música/paródia", "Repita várias vezes até fixar"],
        beneficios: ["Memorização divertida", "Criação de associações únicas", "Retenção de longo prazo"],
        irParaRevisao: true, tipoRevisao: "revisao_normal"
      },
      {
        id: 7, titulo: "Repetição Espaçada", tempo: "15 min/dia", dificuldade: "Médio",
        descricao: "Sistema de revisão que aumenta os intervalos conforme você acerta as respostas.",
        passos: ["Dia 1: Estude o conteúdo", "Dia 2: Revise rapidamente", "Dia 4: Revise os pontos difíceis", "Dia 7: Teste seus conhecimentos", "Dia 15: Revisão final"],
        beneficios: ["Revisão eficiente", "Memorização duradoura", "Otimização do tempo"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      }
    ]
  },

  // ==================== INTRAPESSOAL ====================
  intrapessoal: {
    nome: "Intrapessoal",
    cor: "#5170ff",
    descricao: "Você aprende melhor sozinho, com reflexão, autoanálise e estudos individuais. Os métodos abaixo foram selecionados para seu perfil.",
    metodos: [
      {
        id: 1, titulo: "Pomodoro", tempo: "25 min", dificuldade: "Fácil",
        descricao: "Estude em blocos de 25 minutos com pausas de 5 minutos. A cada ciclo, mude o conteúdo.",
        passos: ["Escolha o conteúdo", "Estude por 25 minutos", "Descanse 5 minutos", "Repita o ciclo", "A cada 4 ciclos, faça uma pausa longa"],
        beneficios: ["Mantém o foco", "Evita cansaço mental", "Aumenta a produtividade"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Técnica Feynman", tempo: "30 min", dificuldade: "Médio",
        descricao: "Aprenda explicando o conceito em voz alta com suas próprias palavras.",
        passos: ["Escolha um conceito", "Explique em voz alta", "Identifique lacunas", "Volte ao material", "Simplifique a explicação"],
        beneficios: ["Desenvolve autoconhecimento", "Identifica pontos fracos", "Fixa o conteúdo"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 3, titulo: "Método Cornell", tempo: "35 min", dificuldade: "Médio",
        descricao: "Divida a página em duas colunas: esquerda para perguntas, direita para respostas e informações.",
        passos: ["Divida a página em duas colunas", "Lado esquerdo: escreva perguntas", "Lado direito: anote respostas e informações", "Revise cobrindo o lado direito e respondendo as perguntas"],
        beneficios: ["Organização visual", "Facilita autoavaliação", "Material de revisão eficiente"],
        irParaRevisao: false
      },
      {
        id: 4, titulo: "Leitura Savoring", tempo: "40 min", dificuldade: "Fácil",
        descricao: "Leia devagar, intercalando com pausas para reflexão e resumos pessoais.",
        passos: ["Escolha um local tranquilo", "Leia um trecho por vez", "Pause e reflita", "Anote suas reflexões", "Faça um resumo pessoal"],
        beneficios: ["Conexão pessoal com o conteúdo", "Desenvolvimento de empatia", "Aprendizado significativo"],
        irParaRevisao: false
      },
      {
        id: 5, titulo: "Repetição Espaçada", tempo: "15 min/dia", dificuldade: "Médio",
        descricao: "Sistema personalizado de revisão que você gerencia conforme seu ritmo.",
        passos: ["Dia 1: Estude o conteúdo", "Dia 2: Revise rapidamente", "Dia 4: Reveja pontos difíceis", "Dia 7: Autoavaliação", "Dia 15: Revisão final"],
        beneficios: ["Autonomia no aprendizado", "Revisão personalizada", "Memorização duradoura"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      },
      {
        id: 6, titulo: "Flashcards", tempo: "20 min", dificuldade: "Fácil",
        descricao: "Crie seus próprios cartões para testar seus conhecimentos sozinho.",
        passos: ["Crie perguntas para si mesmo", "Escreva pergunta de um lado e resposta do outro", "Teste-se sem olhar a resposta", "Separe por nível de dificuldade"],
        beneficios: ["Material personalizado", "Autoavaliação honesta", "Estudo independente"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      }
    ]
  },

  // ==================== INTERPESSOAL ====================
  interpessoal: {
    nome: "Interpessoal",
    cor: "#ff5f00",
    descricao: "Você aprende melhor com outras pessoas, em grupo, discutindo e colaborando. Os métodos abaixo foram selecionados para seu perfil.",
    metodos: [
      {
        id: 1, titulo: "Pomodoro", tempo: "25 min", dificuldade: "Fácil",
        descricao: "Estude em blocos de 25 minutos com pausas de 5 minutos. Pode ser feito em grupo.",
        passos: ["Escolha o conteúdo", "Estude por 25 minutos", "Descanse 5 minutos", "Repita o ciclo"],
        beneficios: ["Mantém o foco", "Pode ser feito em grupo", "Aumenta a produtividade"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Técnica Feynman", tempo: "40 min", dificuldade: "Médio",
        descricao: "Aprenda explicando conceitos para seus colegas como se estivessem aprendendo pela primeira vez.",
        passos: ["Cada membro escolhe um conceito", "Explique para o grupo", "Use analogias e exemplos simples", "Peça perguntas e feedback", "Troque de papéis"],
        beneficios: ["Desenvolve liderança", "Aprendizado colaborativo", "Feedback em tempo real"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 3, titulo: "Teste Prático", tempo: "30 min", dificuldade: "Médio",
        descricao: "Resolva provas anteriores e exercícios. Pode ser feito em dupla para correção conjunta.",
        passos: ["Escolha provas ou exercícios", "Responda individualmente", "Corrija com um colega", "Discutam os erros", "Criem um banco de questões"],
        beneficios: ["Avaliação colaborativa", "Discussão enriquecedora", "Identificação de pontos fracos"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 4, titulo: "Mnemônica com Poemas ou Músicas", tempo: "25 min", dificuldade: "Fácil",
        descricao: "Criem juntos músicas, paródias ou poemas para memorizar conteúdo de forma divertida.",
        passos: ["Reúnam o grupo", "Escolham um conteúdo", "Selecionem uma melodia conhecida", "Criem a letra juntos", "Ensaie e apresentem"],
        beneficios: ["Aprendizado lúdico", "Criação coletiva", "Fixação por música"],
        irParaRevisao: true, tipoRevisao: "revisao_normal"
      },
      {
        id: 5, titulo: "Estudo com Vídeos Educativos", tempo: "30 min", dificuldade: "Fácil",
        descricao: "Assistam vídeos educativos juntos e depois discutam os pontos principais.",
        passos: ["Escolham um vídeo educativo", "Assistam juntos", "Pausem para discutir", "Cada um anota um ponto principal", "Criem um resumo coletivo"],
        beneficios: ["Aprendizado colaborativo", "Discussão enriquecedora", "Diferentes pontos de vista"],
        irParaRevisao: false
      },
      {
        id: 6, titulo: "Repetição Espaçada", tempo: "20 min/sessão", dificuldade: "Médio",
        descricao: "Sistema de revisão em grupo onde cada um testa o outro em intervalos programados.",
        passos: ["Formem um grupo de compromisso", "Dia 1: Estudo inicial", "Dia 2: Revisão rápida em duplas", "Dia 4: Testem uns aos outros", "Dia 7: Sessão de dúvidas", "Dia 15: Revisão final"],
        beneficios: ["Compromisso coletivo", "Aprendizado colaborativo", "Responsabilidade compartilhada"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      },
      {
        id: 7, titulo: "Grupos de Estudo", tempo: "60 min", dificuldade: "Médio",
        descricao: "Estratégia para trocar conhecimento, esclarecer dúvidas e reforçar conceitos ao ensinar colegas.",
        passos: ["Definam um grupo de 3-5 pessoas", "Dividam o conteúdo em partes", "Cada um prepara sua parte", "Revezem explicações", "Tirem dúvidas coletivamente"],
        beneficios: ["Desenvolvimento social", "Aprendizado diversificado", "Rede de apoio mútuo"],
        irParaRevisao: false
      }
    ]
  },

  // ==================== MUSICAL ====================
  musical: {
    nome: "Musical",
    cor: "#8a03d2",
    descricao: "Você aprende melhor com ritmo, melodia, sons e músicas. Os métodos abaixo foram selecionados para seu perfil.",
    metodos: [
      {
        id: 1, titulo: "Pomodoro", tempo: "25 min", dificuldade: "Fácil",
        descricao: "Estude em blocos de 25 minutos com músicas instrumentais para manter o foco e ritmo.",
        passos: ["Escolha uma playlist instrumental", "Configure um timer de 25 minutos", "Estude até o timer tocar", "Descanse 5 minutos", "Repita o ciclo"],
        beneficios: ["Ritmo constante", "Associação música-produtividade", "Experiência prazerosa"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Mnemônica com Poemas ou Músicas", tempo: "30 min", dificuldade: "Fácil",
        descricao: "Crie músicas, paródias ou rimas para memorizar conteúdo de forma divertida e melódica.",
        passos: ["Escolha uma melodia conhecida", "Adapte o conteúdo para a letra", "Mantenha o ritmo e a rima", "Ensaiote cantando", "Grave sua paródia"],
        beneficios: ["Memorização natural", "Desenvolvimento criativo", "Aprendizado leve"],
        irParaRevisao: true, tipoRevisao: "revisao_normal"
      },
      {
        id: 3, titulo: "Gravação de Podcast", tempo: "40 min", dificuldade: "Médio",
        descricao: "Grave áudio da sua própria explicação para enfatizar a memorização da matéria.",
        passos: ["Escolha um tema", "Escreva um roteiro simples", "Configure o gravador", "Grave explicando o conteúdo", "Ouça e identifique pontos a melhorar"],
        beneficios: ["Material de revisão auditiva", "Desenvolvimento de comunicação", "Criação de portfólio"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      },
      {
        id: 4, titulo: "Estudo com Vídeos Educativos", tempo: "25 min", dificuldade: "Fácil",
        descricao: "Assista vídeos educativos e crie trilhas sonoras ou resumos em formato de música.",
        passos: ["Selecione um vídeo educativo", "Assista prestando atenção aos sons", "Pause e crie um jingle para cada tópico", "Anote o conteúdo", "Produza uma paródia"],
        beneficios: ["Aprendizado multimodal", "Associações musicais", "Engajamento auditivo"],
        irParaRevisao: false
      },
      {
        id: 5, titulo: "Repetição Espaçada", tempo: "15 min/dia", dificuldade: "Médio",
        descricao: "Sistema de revisão onde você usa batidas e ritmos para marcar os intervalos.",
        passos: ["Crie uma playlist com músicas para cada dia", "Dia 1: Estudo inicial", "Dia 2: Revisão rápida", "Dia 4: Teste cantando", "Dia 7: Crie um beatbox do conteúdo", "Dia 15: Revisão final"],
        beneficios: ["Revisão no seu ritmo", "Associações rítmicas", "Consistência musical"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      }
    ]
  },

  // ==================== LÓGICO-MATEMÁTICA ====================
  logico: {
    nome: "Lógico-Matemática",
    cor: "#ffbd59",
    descricao: "Você tem facilidade com números, padrões e raciocínio abstrato. Os métodos abaixo foram selecionados para seu perfil.",
    metodos: [
      {
        id: 1, titulo: "Pomodoro", tempo: "25 min", dificuldade: "Fácil",
        descricao: "Estude em blocos de 25 minutos com pausas de 5 minutos. Ideal para manter o foco em cálculos e problemas.",
        passos: ["Escolha o conteúdo", "Estude por 25 minutos", "Descanse 5 minutos", "Repita o ciclo"],
        beneficios: ["Mantém o foco", "Evita cansaço mental", "Aumenta a produtividade"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Método Cornell", tempo: "35 min", dificuldade: "Médio",
        descricao: "Divida a página em duas colunas: esquerda para perguntas, direita para respostas e fórmulas.",
        passos: ["Divida a página em duas colunas", "Lado esquerdo: escreva perguntas e fórmulas", "Lado direito: anote respostas e explicações", "Revise cobrindo o lado direito"],
        beneficios: ["Organização lógica", "Facilita autoavaliação", "Material de revisão"],
        irParaRevisao: false
      },
      {
        id: 3, titulo: "Mapa Mental", tempo: "30 min", dificuldade: "Médio",
        descricao: "Organize o conteúdo de forma gráfica com foco no tema central e tópicos relacionados.",
        passos: ["Escreva o tema central no meio", "Puxe ramos para cada subtópico", "Adicione palavras-chave em cada ramo", "Use cores para diferenciar categorias", "Conecte ideias relacionadas"],
        beneficios: ["Visualização geral", "Conexão entre conceitos", "Organização hierárquica"],
        irParaRevisao: false
      },
      {
        id: 4, titulo: "Teste Prático", tempo: "35 min", dificuldade: "Médio",
        descricao: "Resolver provas anteriores e exercícios é uma forma eficiente para fixar o conteúdo.",
        passos: ["Escolha provas ou exercícios", "Resolva sem consulta", "Corrija seus erros", "Refaça os exercícios que errou", "Anote o que precisa revisar"],
        beneficios: ["Fixação por prática", "Identificação de dificuldades", "Preparação para provas"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 5, titulo: "Mnemônica com Números ou Listas Ordenadas", tempo: "20 min", dificuldade: "Fácil",
        descricao: "Crie associações usando números, sequências ou listas ordenadas para memorizar.",
        passos: ["Liste as informações em ordem", "Crie uma sequência lógica ou numérica", "Associe cada item a um número", "Repita a sequência várias vezes"],
        beneficios: ["Memorização estruturada", "Associações lógicas", "Retenção de sequências"],
        irParaRevisao: true, tipoRevisao: "revisao_normal"
      },
      {
        id: 6, titulo: "Diagrama de Fluxos", tempo: "30 min", dificuldade: "Médio",
        descricao: "Representação gráfica dos passos de um processo, ideal para visualizar etapas lógicas.",
        passos: ["Identifique o processo a mapear", "Liste as etapas em ordem", "Desenhe caixas para cada etapa", "Conecte com setas indicando o fluxo", "Revise a lógica do diagrama"],
        beneficios: ["Visualização de processos", "Clareza nas etapas", "Identificação de falhas"],
        irParaRevisao: false
      },
      {
        id: 7, titulo: "Repetição Espaçada", tempo: "15 min/dia", dificuldade: "Médio",
        descricao: "Sistema de revisão que aumenta os intervalos conforme você acerta.",
        passos: ["Dia 1: Estude o conteúdo", "Dia 2: Revise rapidamente", "Dia 4: Revise pontos difíceis", "Dia 7: Teste seus conhecimentos", "Dia 15: Revisão final"],
        beneficios: ["Revisão eficiente", "Memorização duradoura", "Otimização do tempo"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      }
    ]
  },

  // ==================== ESPACIAL ====================
  espacial: {
    nome: "Espacial",
    cor: "#d203a4",
    descricao: "Você pensa em imagens e visualiza o mundo tridimensionalmente. Os métodos abaixo foram selecionados para seu perfil.",
    metodos: [
      {
        id: 1, titulo: "Pomodoro", tempo: "25 min", dificuldade: "Fácil",
        descricao: "Estude em blocos de 25 minutos com pausas de 5 minutos.",
        passos: ["Escolha o conteúdo", "Estude por 25 minutos", "Descanse 5 minutos", "Repita o ciclo"],
        beneficios: ["Mantém o foco", "Evita cansaço mental", "Aumenta a produtividade"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Método Cornell", tempo: "35 min", dificuldade: "Médio",
        descricao: "Divida a página em duas colunas para organizar perguntas e respostas visualmente.",
        passos: ["Divida a página em duas colunas", "Lado esquerdo: perguntas", "Lado direito: respostas", "Use cores e desenhos para destacar"],
        beneficios: ["Organização visual", "Facilita revisão", "Material personalizado"],
        irParaRevisao: false
      },
      {
        id: 3, titulo: "Mapa Mental", tempo: "30 min", dificuldade: "Médio",
        descricao: "Organize o conteúdo de forma gráfica e visual com foco no tema central.",
        passos: ["Escreva o tema central no meio", "Puxe ramos para cada subtópico", "Use imagens e cores", "Conecte ideias relacionadas", "Crie uma hierarquia visual"],
        beneficios: ["Visualização geral", "Conexão entre conceitos", "Estímulo visual"],
        irParaRevisao: false
      },
      {
        id: 4, titulo: "Flashcards", tempo: "25 min", dificuldade: "Fácil",
        descricao: "Crie cartões visuais com perguntas de um lado e respostas do outro.",
        passos: ["Crie cartões com elementos visuais", "Frente: pergunta ou imagem", "Verso: resposta ou explicação", "Teste-se diariamente"],
        beneficios: ["Memorização visual", "Revisão eficiente", "Portabilidade"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 5, titulo: "Mnemônica com Imagens e Objetos", tempo: "20 min", dificuldade: "Fácil",
        descricao: "Crie associações visuais usando imagens, desenhos ou objetos para memorizar.",
        passos: ["Liste as informações a memorizar", "Crie uma imagem mental para cada item", "Associe as imagens entre si", "Desenhe se preferir", "Revise visualizando as imagens"],
        beneficios: ["Memorização visual", "Criação de associações", "Retenção duradoura"],
        irParaRevisao: true, tipoRevisao: "revisao_normal"
      },
      {
        id: 6, titulo: "Diagrama de Fluxos", tempo: "30 min", dificuldade: "Médio",
        descricao: "Representação gráfica dos passos de um processo para visualizar etapas.",
        passos: ["Identifique o processo", "Liste as etapas em ordem", "Desenhe o fluxo com setas", "Use cores para cada etapa", "Revise a lógica visual"],
        beneficios: ["Visualização de processos", "Clareza nas etapas", "Organização gráfica"],
        irParaRevisao: false
      },
      {
        id: 7, titulo: "Repetição Espaçada", tempo: "15 min/dia", dificuldade: "Médio",
        descricao: "Sistema de revisão que aumenta os intervalos conforme você acerta.",
        passos: ["Dia 1: Estude o conteúdo", "Dia 2: Revise rapidamente", "Dia 4: Revise pontos difíceis", "Dia 7: Teste seus conhecimentos", "Dia 15: Revisão final"],
        beneficios: ["Revisão eficiente", "Memorização duradoura", "Otimização do tempo"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      }
    ]
  },

  // ==================== CORPORAL-CINESTÉSICA ====================
  corporal: {
    nome: "Corporal-Cinestésica",
    cor: "#00bf63",
    descricao: "Você aprende melhor com movimento, prática e experiências hands-on. Os métodos abaixo foram selecionados para seu perfil.",
    metodos: [
      {
        id: 1, titulo: "Pomodoro com Descanso Ativo", tempo: "25 min", dificuldade: "Fácil",
        descricao: "Estude em blocos de 25 minutos. Nos intervalos, faça caminhadas curtas ou alongamentos.",
        passos: ["Escolha o conteúdo", "Estude por 25 minutos", "Descanse 5 minutos com caminhada ou alongamento", "Repita o ciclo"],
        beneficios: ["Mantém o foco", "Movimento no descanso", "Aumenta a produtividade"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Teste Prático", tempo: "35 min", dificuldade: "Médio",
        descricao: "Resolver provas anteriores e exercícios práticos é uma forma eficiente para fixar o conteúdo.",
        passos: ["Escolha provas ou exercícios", "Resolva sem consulta", "Corrija seus erros", "Refaça os exercícios que errou"],
        beneficios: ["Fixação por prática", "Identificação de dificuldades", "Preparação para provas"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 3, titulo: "Grupos de Estudo", tempo: "50 min", dificuldade: "Médio",
        descricao: "Estude em grupo para trocar conhecimento e reforçar conceitos ao ensinar colegas.",
        passos: ["Forme um grupo de 3-5 pessoas", "Divida os temas", "Cada um prepara sua parte", "Revezem as explicações", "Tirem dúvidas coletivamente"],
        beneficios: ["Troca de conhecimento", "Desenvolvimento social", "Aprendizado colaborativo"],
        irParaRevisao: false
      },
      {
        id: 4, titulo: "Mnemônica com Movimentos", tempo: "20 min", dificuldade: "Fácil",
        descricao: "Crie associações usando gestos, movimentos ou danças para memorizar conteúdo.",
        passos: ["Liste as informações a memorizar", "Crie um gesto ou movimento para cada item", "Repita os movimentos em sequência", "Associe o movimento ao conteúdo"],
        beneficios: ["Memorização cinestésica", "Associação movimento-conteúdo", "Aprendizado ativo"],
        irParaRevisao: true, tipoRevisao: "revisao_normal"
      },
      {
        id: 5, titulo: "Estudo com Vídeos Educativos", tempo: "30 min", dificuldade: "Fácil",
        descricao: "Assista vídeos educativos para visualizar e compreender conceitos difíceis no papel.",
        passos: ["Escolha um vídeo educativo", "Assista fazendo anotações", "Pause para praticar o que aprendeu", "Reveja os trechos difíceis"],
        beneficios: ["Visualização de conceitos", "Aprendizado dinâmico", "Complemento ao estudo"],
        irParaRevisao: false
      },
      {
        id: 6, titulo: "Repetição Espaçada", tempo: "15 min/dia", dificuldade: "Médio",
        descricao: "Sistema de revisão que aumenta os intervalos conforme você acerta.",
        passos: ["Dia 1: Estude o conteúdo", "Dia 2: Revise rapidamente", "Dia 4: Revise pontos difíceis", "Dia 7: Teste seus conhecimentos", "Dia 15: Revisão final"],
        beneficios: ["Revisão eficiente", "Memorização duradoura", "Otimização do tempo"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      },
      {
        id: 7, titulo: "Flashcards", tempo: "20 min", dificuldade: "Fácil",
        descricao: "Crie cartões com perguntas de um lado e respostas do outro para revisar.",
        passos: ["Crie cartões de estudo", "Frente: pergunta", "Verso: resposta", "Teste-se caminhando enquanto revisa"],
        beneficios: ["Memorização ativa", "Revisão em movimento", "Portabilidade"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      }
    ]
  }
};

function fecharMetodoModal() {
  const modal = document.getElementById("metodoModalOverlay");
  if (modal) modal.style.display = "none";
}
window.fecharMetodoModal = fecharMetodoModal;

function irParaRevisao(tipoRevisao, metodoTitulo) {
  console.log('🔄 [REVISÃO] Indo para revisão:', tipoRevisao, metodoTitulo);

  localStorage.setItem('revisaoTipoAtivo', tipoRevisao);
  localStorage.setItem('metodoSelecionado', metodoTitulo);

  fecharMetodoModal();

  if (typeof mostrarTela === 'function') {
    mostrarTela('revisao');
  }

  // Inicializa a revisão (carrega matérias e flashcards)
  initRevisao().then(() => {
    // Se for simulado, abre a aba de simulado
    if (tipoRevisao === 'simulado') {
      setTimeout(() => {
        // Mostrar a aba de simulado
        document.getElementById('abaSimuladoBtn').style.display = 'block';
        trocarAbaRevisao('simulado');
        carregarOpcoesSimulado();
      }, 300);
    } else if (tipoRevisao === 'flashcards') {
      // Abre a aba de cards
      setTimeout(() => {
        trocarAbaRevisao('meusCards');
        abrirModalFlashcard();
      }, 300);
    } else {
      // Abre a aba de revisar
      setTimeout(() => {
        trocarAbaRevisao('revisar');
        atualizarContadoresRevisao();
      }, 300);
    }
  });

  const sidebarLinks = document.querySelectorAll('#menuLateral .nav-link');
  sidebarLinks.forEach(link => {
    const onclickAttr = link.getAttribute('onclick');
    if (onclickAttr && typeof onclickAttr === 'string' && onclickAttr.includes("'revisao'")) {
      if (typeof mudarPagina === 'function') {
        mudarPagina(link);
      }
    }
  });
}

window.irParaRevisao = irParaRevisao;

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
  console.log('🔄 Mostrando tela:', tela);
  
  // Verificar acesso ANTES de mostrar
  if (tela === "estatistica" && !verificarAcesso('estatisticas')) return;
  if (tela === "cronogramaNovo" && !verificarAcesso('cronograma')) return;
  const telas = ["inicio", "tarefas", "notas", "calendario", "relogio", "estatistica", "cronogramaNovo", "metodos", "revisao"];

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
  if (tela === "metodos") {
    console.log('🎨 Chamando renderizarMetodosEstudo');
    renderizarMetodosEstudo();
  }
  if (tela === "revisao") {
    popularFiltroMaterias();
    renderizarFlashcardsAgrupados();
    atualizarMensagemRevisar();
  }
}// CONEXÃO COM EFEITO
document.addEventListener('DOMContentLoaded', function () {
  const params = new URLSearchParams(window.location.search);
  const tipoInteligencia = params.get('tipo');

  if (tipoInteligencia) {
    aplicarTemaInteligencia(normalizarInteligencia(tipoInteligencia));
  } else {
    const tipoSalvo = localStorage.getItem('inteligenciaUsuario');
    if (tipoSalvo) {
      aplicarTemaInteligencia(normalizarInteligencia(tipoSalvo));
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

function ordenarPorPrioridade(arrayTarefas) {
  const prioridadeValor = { "alta": 1, "media": 2, "baixa": 3 };
  return arrayTarefas.sort((a, b) => prioridadeValor[a.prioridade] - prioridadeValor[b.prioridade]);
}
function salvarTarefas() {
  // Sincronizado diretamente no banco de dados via API
}
function hojeFormatado() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}
async function adicionarTarefa() {
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

  try {
    const response = await apiFetch("tarefas", {
      method: "POST",
      body: JSON.stringify({
        nome_tarefa: titulo,
        dificuldade: prioridade,
        prazo: data
      })
    });
    if (response.ok) {
      const resData = await response.json();
      tarefas.push({
        id: resData.id_tarefa,
        titulo,
        prioridade,
        data,
        concluida: false
      });
      salvarTarefas();
      atualizarTudo();
      atualizarEventosTarefas();
    }
  } catch (err) {
    console.error("Erro ao adicionar tarefa:", err);
  }
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
    btnConcluir.onclick = async () => {
      const novoEstado = !tarefa.concluida;
      const dificuldade = tarefa.prioridade + (novoEstado ? "-concluida" : "");
      try {
        const response = await apiFetch(`tarefas/${tarefa.id}`, {
          method: "PUT",
          body: JSON.stringify({
            nome_tarefa: tarefa.titulo,
            dificuldade: dificuldade,
            prazo: tarefa.data
          })
        });
        if (response.ok) {
          tarefa.concluida = novoEstado;
          salvarTarefas();
          renderizarTarefas();
          atualizarResumoInicio();
          atualizarEventosTarefas();
        }
      } catch (err) {
        console.error(err);
      }
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
      }).then(async (result) => {
        if (result.isConfirmed) {
          const novoTitulo = document.getElementById('editTitulo').value.trim();
          const novaPrioridade = document.getElementById('editPrioridade').value;
          const novaData = document.getElementById('editData').value;
          if (!novoTitulo || !novaData) {
            Swal.fire({ icon: 'error', title: 'Preencha todos os campos!' });
            return;
          }
          const dificuldade = novaPrioridade + (tarefa.concluida ? "-concluida" : "");
          try {
            const response = await apiFetch(`tarefas/${tarefa.id}`, {
              method: "PUT",
              body: JSON.stringify({
                nome_tarefa: novoTitulo,
                dificuldade: dificuldade,
                prazo: novaData
              })
            });
            if (response.ok) {
              tarefa.titulo = novoTitulo;
              tarefa.prioridade = novaPrioridade;
              tarefa.data = novaData;
              salvarTarefas();
              atualizarTudo();
              atualizarEventosTarefas();
            }
          } catch (err) {
            console.error(err);
          }
        }
      });
    };

    const btnExcluir = document.createElement("button");
    btnExcluir.classList.add("btn-excluir");
    btnExcluir.textContent = " ❌ ";
    btnExcluir.onclick = async () => {
      try {
        const response = await apiFetch(`tarefas/${tarefa.id}`, {
          method: "DELETE"
        });
        if (response.ok) {
          tarefas = tarefas.filter(t => t.id !== tarefa.id);
          salvarTarefas();
          renderizarTarefas();
          atualizarResumoInicio();
          atualizarEventosTarefas();
        }
      } catch (err) {
        console.error(err);
      }
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

async function adicionarEvento() {
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

  // Salva o evento principal no backend
  const extProps = { isTarefa: false, tipo: tipo, recorrencia: recorrencia };
  const ok = await salvarEventoNoBackend(titulo, data, cor, extProps);

  if (ok && recorrencia !== "nenhuma") {
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

      const dataStr = novaData.toISOString().split('T')[0];
      await salvarEventoNoBackend(titulo, dataStr, cor, { ...extProps, isRecorrente: true });
    }
  }

  if (ok) {
    calendar.refetchEvents();
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
}

function salvarEventos() {
  // Chamada fictícia - os dados agora são salvos diretamente no banco de dados.
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

// Carregar eventos de tarefas para o calendário
function carregarEventos() {
  const listaTarefas = (typeof tarefas !== 'undefined' && Array.isArray(tarefas)) ? tarefas : [];

  // Mapeia apenas tarefas não concluídas com flag EXPLÍCITA
  const eventosTarefas = listaTarefas
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

  return eventosTarefas;
}

function atualizarEventosTarefas() {
  if (calendar && typeof calendar.refetchEvents === 'function') {
    calendar.refetchEvents();
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
          const dificuldade = tarefa.prioridade + (tarefa.concluida ? "-concluida" : "");
          apiFetch(`tarefas/${tarefa.id}`, {
            method: "PUT",
            body: JSON.stringify({
              nome_tarefa: tarefa.titulo,
              dificuldade: dificuldade,
              prazo: novaData
            })
          }).then(response => {
            if (response.ok) {
              tarefa.data = novaData;
              calendar.refetchEvents();
              atualizarResumoInicio();
            }
          }).catch(err => console.error(err));
        }
      } else {
        apiFetch(`eventos/${event.id}`, {
          method: "PUT",
          body: JSON.stringify({
            tipo: JSON.stringify({ title: titulo, extendedProps: props }),
            data: novaData,
            cor: cor
          })
        }).then(response => {
          if (response.ok) {
            calendar.refetchEvents();
            atualizarResumoInicio();
          }
        }).catch(err => console.error(err));
      }

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
    },

    eventResize: function (info) {
      const event = info.event;
      apiFetch(`eventos/${event.id}`, {
        method: "PUT",
        body: JSON.stringify({
          tipo: JSON.stringify({ title: event.title, extendedProps: event.extendedProps }),
          data: event.startStr,
          cor: event.backgroundColor
        })
      }).then(response => {
        if (response.ok) {
          calendar.refetchEvents();
          atualizarResumoInicio();
        }
      }).catch(err => console.error(err));

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
        }).then(async (result) => {
          if (result.isConfirmed) {
            const novoTitulo = document.getElementById('editTitulo').value.trim();
            const novaData = document.getElementById('editData').value;
            if (novoTitulo && novaData) {
              const dificuldade = tarefa.prioridade + (tarefa.concluida ? "-concluida" : "");
              try {
                const response = await apiFetch(`tarefas/${tarefa.id}`, {
                  method: "PUT",
                  body: JSON.stringify({
                    nome_tarefa: novoTitulo,
                    dificuldade: dificuldade,
                    prazo: novaData
                  })
                });
                if (response.ok) {
                  tarefa.titulo = novoTitulo;
                  tarefa.data = novaData;
                  calendar.refetchEvents();
                  atualizarResumoInicio();
                  renderizarTarefas();

                  Swal.fire({
                    icon: 'success',
                    title: 'Tarefa atualizada!',
                    timer: 1000,
                    showConfirmButton: false
                  });
                }
              } catch (err) {
                console.error(err);
              }
            }
          } else if (result.isDenied) {
            try {
              const response = await apiFetch(`tarefas/${tarefa.id}`, {
                method: "DELETE"
              });
              if (response.ok) {
                tarefas = tarefas.filter(t => t.id !== tarefa.id);
                calendar.refetchEvents();
                atualizarResumoInicio();
                renderizarTarefas();

                Swal.fire({
                  icon: 'success',
                  title: 'Tarefa excluída!',
                  timer: 1000,
                  showConfirmButton: false
                });
              }
            } catch (err) {
              console.error(err);
            }
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
        }).then(async (result) => {
          if (result.isConfirmed) {
            const response = await apiFetch(`eventos/${event.id}`, { method: "DELETE" });
            if (response.ok) {
              calendar.refetchEvents();
              atualizarResumoInicio();
            }
          } else if (result.isDenied) {
            const eventosParaRemover = calendar.getEvents().filter(e =>
              e.title === event.title &&
              e.extendedProps?.recorrencia === event.extendedProps?.recorrencia
            );
            for (const ev of eventosParaRemover) {
              if (ev.id) {
                await apiFetch(`eventos/${ev.id}`, { method: "DELETE" });
              }
            }
            calendar.refetchEvents();
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
        }).then(async (result) => {
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

            try {
              const response = await apiFetch(`eventos/${event.id}`, {
                method: "PUT",
                body: JSON.stringify({
                  tipo: JSON.stringify({ title: novoTitulo, extendedProps: event.extendedProps }),
                  data: novaData,
                  cor: novaCor
                })
              });
              if (response.ok) {
                calendar.refetchEvents();
                atualizarResumoInicio();

                Swal.fire({
                  icon: 'success',
                  title: 'Evento atualizado!',
                  timer: 1200,
                  showConfirmButton: false,
                  position: 'top-end',
                  toast: true
                });
              }
            } catch (err) {
              console.error(err);
            }
          } else if (result.isDenied) {
            Swal.fire({
              title: 'Confirmar exclusão',
              text: 'Tem certeza que deseja excluir este evento?',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Sim, excluir',
              cancelButtonText: 'Cancelar',
              confirmButtonColor: '#dc3545'
            }).then(async (confirmResult) => {
              if (confirmResult.isConfirmed) {
                try {
                  const response = await apiFetch(`eventos/${event.id}`, {
                    method: "DELETE"
                  });
                  if (response.ok) {
                    calendar.refetchEvents();
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
                } catch (err) {
                  console.error(err);
                }
              }
            });
          }
        });
      }
    },
    events: async function (info, successCallback, failureCallback) {
      try {
        const eventosBackend = await carregarEventosDoBackend();
        const listaTarefas = (tarefas && tarefas.length > 0) ? tarefas : [];

        const eventosTarefas = listaTarefas
          .filter(t => t.data && !t.concluida)
          .map(t => ({
            id: 't_' + t.id,
            title: `${t.titulo}`,
            start: t.data,
            backgroundColor: corPrioridade(t.prioridade),
            borderColor: corPrioridade(t.prioridade),
            textColor: '#ffffff',
            extendedProps: {
              isTarefa: true,
              tarefaId: t.id
            }
          }));

        const mapEventos = new Map();
        eventosBackend.forEach(e => mapEventos.set('e_' + (e.id || e.title + e.start), e));
        eventosTarefas.forEach(t => mapEventos.set(t.id, t));

        successCallback(Array.from(mapEventos.values()));
      } catch (err) {
        console.error("Erro ao carregar eventos no calendário:", err);
        failureCallback(err);
      }
    },
    eventsSet: function (events) {
      atualizarResumoInicio();
    }
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
  let notas = [];

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
      input.addEventListener("change", async (e) => {
        const div = e.target.closest('.check-item');
        const notaId = div.dataset.notaId;
        const checkIndex = parseInt(div.dataset.checkIndex);

        const nota = notas.find(n => n.id === notaId);
        if (nota && nota.checklist[checkIndex]) {
          nota.checklist[checkIndex].checked = e.target.checked;
          const payload = {
            conteudo: JSON.stringify({
              titulo: nota.titulo,
              texto: nota.texto,
              corTexto: nota.corTexto,
              checklist: nota.checklist,
              favorito: nota.favorito,
              dataCriacao: nota.dataCriacao,
              anexos: nota.anexos
            }),
            cor_nota: nota.cor
          };
          try {
            await apiFetch(`blocos/${notaId}`, {
              method: "PUT",
              body: JSON.stringify(payload)
            });
            renderNotas();
          } catch (err) {
            console.error(err);
          }
        }
      });
    });

    // Botão excluir item do checklist
    document.querySelectorAll(".btn-excluir-check").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const div = e.target.closest('.check-item');
        const notaId = div.dataset.notaId;
        const checkIndex = parseInt(div.dataset.checkIndex);

        const nota = notas.find(n => n.id === notaId);
        if (nota) {
          nota.checklist.splice(checkIndex, 1);
          const payload = {
            conteudo: JSON.stringify({
              titulo: nota.titulo,
              texto: nota.texto,
              corTexto: nota.corTexto,
              checklist: nota.checklist,
              favorito: nota.favorito,
              dataCriacao: nota.dataCriacao,
              anexos: nota.anexos
            }),
            cor_nota: nota.cor
          };
          try {
            await apiFetch(`blocos/${notaId}`, {
              method: "PUT",
              body: JSON.stringify(payload)
            });
            renderNotas();
          } catch (err) {
            console.error(err);
          }
        }
      });
    });

    // Estrela (favorito)
    document.querySelectorAll(".estrela").forEach(estrela => {
      estrela.addEventListener("click", async (e) => {
        e.stopPropagation();
        const notaId = e.target.dataset.notaId;
        const nota = notas.find(n => n.id === notaId);
        if (nota) {
          nota.favorito = !nota.favorito;
          const payload = {
            conteudo: JSON.stringify({
              titulo: nota.titulo,
              texto: nota.texto,
              corTexto: nota.corTexto,
              checklist: nota.checklist,
              favorito: nota.favorito,
              dataCriacao: nota.dataCriacao,
              anexos: nota.anexos
            }),
            cor_nota: nota.cor
          };
          try {
            await apiFetch(`blocos/${notaId}`, {
              method: "PUT",
              body: JSON.stringify(payload)
            });
            renderNotas();
          } catch (err) {
            console.error(err);
          }
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
          }).then(async (result) => {
            if (result.isConfirmed) {
              try {
                const response = await apiFetch(`blocos/${notaId}`, {
                  method: "DELETE"
                });
                if (response.ok) {
                  notas = notas.filter(n => n.id !== notaId);
                  renderNotas();
                  Swal.fire('Excluída!', '', 'success');
                }
              } catch (err) {
                console.error(err);
              }
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

  document.getElementById("btnSalvar").addEventListener("click", async () => {
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

    const payload = {
      conteudo: JSON.stringify({
        titulo,
        texto,
        corTexto,
        checklist,
        favorito: notaAtual !== null && notas[notaAtual] ? notas[notaAtual].favorito : false,
        dataCriacao: notaAtual !== null && notas[notaAtual] ? notas[notaAtual].dataCriacao : new Date().toLocaleString(),
        anexos: [...anexosTemp]
      }),
      cor_nota: cor
    };

    if (notaAtual !== null && notas[notaAtual]) {
      const notaId = notas[notaAtual].id;
      try {
        const response = await apiFetch(`blocos/${notaId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          notas[notaAtual] = {
            id: notaId,
            titulo,
            texto,
            cor,
            corTexto,
            checklist,
            anexos: [...anexosTemp],
            favorito: notas[notaAtual].favorito,
            dataCriacao: notas[notaAtual].dataCriacao
          };
          renderNotas();
          notaModal.hide();
          Swal.fire({ icon: 'success', title: 'Nota salva!', timer: 1500, showConfirmButton: false });
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        const response = await apiFetch("blocos", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          const resData = await response.json();
          notas.push({
            id: resData.id_anotacao,
            titulo,
            texto,
            cor,
            corTexto,
            checklist,
            anexos: [...anexosTemp],
            favorito: false,
            dataCriacao: new Date().toLocaleString()
          });
          renderNotas();
          notaModal.hide();
          Swal.fire({ icon: 'success', title: 'Nota salva!', timer: 1500, showConfirmButton: false });
        }
      } catch (err) {
        console.error(err);
      }
    }
    anexosTemp = [];
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
        apiFetch(`tarefas/${tarefa.id}`, {
          method: "PUT",
          body: JSON.stringify({
            titulo: tarefa.titulo,
            data_tarefa: tarefa.data,
            prioridade: tarefa.prioridade,
            concluida: tarefa.concluida ? 1 : 0
          })
        }).catch(err => console.error("Erro ao sincronizar tarefa:", err));
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
  renderizarResumoHoje();
}

function atualizarTudo() {
  renderizarTarefas();
  atualizarResumoInicio();
  atualizarEventosTarefas();
}

document.addEventListener("DOMContentLoaded", async () => {
  // Carrega os dados do backend antes de renderizar
  await carregarPerfilUsuario();
  await carregarTarefasDoBackend();
  await carregarNotasDoBackend();
  await carregarMateriasDoBackend();
  await carregarCronogramaDoBackend();
  await carregarSessoesDoBackend();
  await carregarFlashcardsDoBackend();
  await carregarInteligenciasDoBackend();

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
  carregarMetas();
  closeSidebarOnLinkClick();
  aplicarBloqueiosPlano();
  atualizarBadgePlano();
  renderizarHistoricoCronometro();
  mostrarTourBoasVindas();
  if (typeof calendar !== "undefined" && calendar) {
    calendar.refetchEvents();
    atualizarResumoInicio();
  }
  atualizarTudo();

  const fotoSalva = sessionStorage.getItem("userFoto") || localStorage.getItem("userFoto");
  const sidebarFoto = document.getElementById('sidebarFoto');
  const previewFoto = document.getElementById('previewFoto');
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
  if (fotoSalva) {
    if (sidebarFoto) sidebarFoto.src = fotoSalva;
    if (previewFoto) previewFoto.src = fotoSalva;
  } else {
    if (sidebarFoto) sidebarFoto.src = defaultAvatar;
    if (previewFoto) previewFoto.src = defaultAvatar;
  }
});


function renderizarResumoHoje() {
  const lista = document.getElementById("listaHojeCronograma");
  if (!lista) return;

  const agora = new Date();
  const horaAtual = String(agora.getHours()).padStart(2, '0') + ":" + String(agora.getMinutes()).padStart(2, '0');
  const hojeSemana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"][agora.getDay()];
  const cronogramaLocal = (typeof cronogramaNovo !== 'undefined' && cronogramaNovo) ? cronogramaNovo : [];

  lista.innerHTML = "";
  const blocosHoje = cronogramaLocal
    .filter(b => b.dia === hojeSemana)
    .sort((a, b) => {
      const aPassou = (a.fim || "00:00") <= horaAtual;
      const bPassou = (b.fim || "00:00") <= horaAtual;

      if (aPassou && !bPassou) return 1;  // 'a' já passou -> vai pro final
      if (!aPassou && bPassou) return -1; // 'b' já passou -> vai pro final

      return (a.inicio || "").localeCompare(b.inicio || "");
    });

  if (blocosHoje.length === 0) {
    lista.innerHTML = "<li style='color: #6b7280; font-style: italic; list-style: none;'>Sem atividades agendadas para hoje</li>";
    return;
  }

  blocosHoje.forEach(bloco => {
    const li = document.createElement("li");
    li.style.padding = "6px 10px";
    li.style.borderRadius = "6px";
    li.style.marginBottom = "6px";
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.justifyContent = "space-between";
    li.style.fontSize = "0.9rem";
    li.style.listStyle = "none";
    li.style.transition = "all 0.2s ease";

    const cor = bloco.materia?.cor || "#9f042c";
    const nomeMateria = bloco.materia?.nome || "Matéria";
    const inicio = bloco.inicio || "00:00";
    const fim = bloco.fim || "00:00";

    const jaPassou = fim <= horaAtual;
    const emAndamento = inicio <= horaAtual && fim > horaAtual;

    if (jaPassou) {
      // Passou da hora -> Riscar (line-through) e esmaecer
      li.style.background = "#f3f4f6";
      li.style.color = "#9ca3af";
      li.style.textDecoration = "line-through";
      li.style.borderLeft = "4px solid #d1d5db";
      li.innerHTML = `
        <span><i class="bi bi-check-circle-fill me-1" style="color: #9ca3af;"></i> ${nomeMateria} (${inicio} às ${fim})</span>
        <span style="font-size: 0.75rem; text-decoration: none; font-style: italic; color: #9ca3af;">Encerrado</span>
      `;
    } else if (emAndamento) {
      // Em andamento -> Destacar com a cor da matéria e badge
      li.style.background = cor;
      li.style.color = "#ffffff";
      li.style.fontWeight = "bold";
      li.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
      li.innerHTML = `
        <span><i class="bi bi-play-circle-fill me-1"></i> ${nomeMateria} (${inicio} às ${fim})</span>
        <span class="badge bg-light text-dark" style="font-size: 0.75rem;">Agora!</span>
      `;
    } else {
      // Futuro -> Normal
      li.style.background = cor;
      li.style.color = "#ffffff";
      li.innerHTML = `
        <span><i class="bi bi-clock me-1"></i> ${nomeMateria} (${inicio} às ${fim})</span>
      `;
    }

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
async function salvarConfiguracao() {
  const novoNome = document.getElementById('novoNome')?.value.trim();
  const novoEmail = document.getElementById('novoEmail')?.value.trim();
  const previewFoto = document.getElementById('previewFoto');
  const foto = previewFoto ? previewFoto.src : "";

  if (!novoNome || !novoEmail) {
    Swal.fire({
      icon: 'warning',
      title: 'Atenção',
      text: 'Preencha o nome e o e-mail!'
    });
    return;
  }

  try {
    const response = await apiFetch("perfil", {
      method: "PUT",
      body: JSON.stringify({
        nome: novoNome,
        email: novoEmail,
        foto: foto
      })
    });
    if (response.ok) {
      const sidebarNome = document.getElementById('sidebarNome');
      const sidebarEmail = document.getElementById('sidebarEmail');
      const sidebarFoto = document.getElementById('sidebarFoto');

      if (sidebarNome) sidebarNome.textContent = novoNome;
      if (sidebarEmail) sidebarEmail.textContent = novoEmail;
      if (foto && sidebarFoto) sidebarFoto.src = foto;

      const storage = sessionStorage.getItem("token") ? sessionStorage : localStorage;
      storage.setItem("userName", novoNome);
      if (foto) storage.setItem("userFoto", foto);

      const user = JSON.parse(storage.getItem("user") || "{}");
      user.nome = novoNome;
      user.email = novoEmail;
      user.foto = foto;
      storage.setItem("user", JSON.stringify(user));

      Swal.fire({
        icon: 'success',
        title: 'Sucesso!',
        text: 'Configurações salvas com sucesso.',
        timer: 1500,
        showConfirmButton: false
      });
  // Fechar com segurança
  fecharModalSeguro('configModal');
  
  mostrarToast('✅ Dados salvos!', '#22c55e');
      const modalEl = document.getElementById('configModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
    } else {
      const data = await response.json();
      Swal.fire({
        icon: 'error',
        title: 'Erro!',
        text: data.message || 'Erro ao salvar configurações.',
      });
    }
  } catch (err) {
    console.error("Erro ao salvar perfil:", err);
    Swal.fire({
      icon: 'error',
      title: 'Erro!',
      text: 'Erro de conexão com o servidor.',
    });
  }
}

// SAIR DA CONTA (LOGOUT)
function sairDaConta() {
  Swal.fire({
    title: 'Sair da conta?',
    text: 'Você será desconectado deste dispositivo.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-box-arrow-right"></i> Sair',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280'
  }).then(result => {
    if (result.isConfirmed) {
      // Fechar modal primeiro
      fecharModalSeguro('configModal');
      
      // Limpar dados
      localStorage.removeItem('usuarioLogado');
      localStorage.removeItem('usuarioId');
      localStorage.removeItem('token');
      
      // Redirecionar
      window.location.href = 'ProjetoIntegrador.html';
    }
  });
}

// ADICIONE esta função no seu JS (após a função salvarConfiguracao, por exemplo)
function previewFotoSelecionada() {
  const input = document.getElementById('novaFoto');
  const preview = document.getElementById('previewFoto');

  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        const maxDimension = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        preview.src = resizedDataUrl;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}
// ---------- VARIÁVEIS GLOBAIS ----------
let materiaAtualAuto = null;
let materiaAnterior = null;
let notificarMudanca = true;
let estudoAtual = null;
let segundosSessaoAtual = 0;
let modoEstudo = "auto";
let materias = [];  // APENAS UM ARRAY para todas as matérias
let cronogramaNovo = [];
let notas = [];
let anexosTemp = [];
let materiasCronograma = [];
let materiasRelogio = [];
let tempoEstudo = {};

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
  // Sincronizado diretamente no banco de dados via API
}

// ---------- SALVAR ----------
function salvarMaterias() {
  // Sincronizado diretamente no banco de dados via API
}
function salvarCronogramaNovo() {
  // Sincronizado diretamente no banco de dados via API
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

  apiFetch("materias", {
    method: "POST",
    body: JSON.stringify({ nome: nome, cor: cor })
  }).then(async res => {
    if (res.ok) {
      const respData = await res.json();
      const novaMateria = {
        id: respData.id_materia.toString(),
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
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Erro!',
        text: 'Não foi possível adicionar a matéria no servidor.',
        confirmButtonColor: '#9f042c'
      });
    }
  }).catch(err => {
    console.error("Erro ao adicionar matéria:", err);
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

    // Duplo clique para editar ou excluir
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
            apiFetch(`materias/${m.id}`, {
              method: "PUT",
              body: JSON.stringify({ nome: novoNome, cor: novaCor })
            }).then(res => {
              if (res.ok) {
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
                renderTabelaMaterias();
              } else {
                Swal.fire('Erro', 'Não foi possível atualizar a matéria no servidor.', 'error');
              }
            }).catch(err => {
              console.error("Erro ao atualizar matéria:", err);
            });
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
              apiFetch(`materias/${m.id}`, {
                method: "DELETE"
              }).then(res => {
                if (res.ok) {
                  // Remover também do cronograma no backend
                  const associatedBlocos = cronogramaNovo.filter(b => b.materia.id === m.id);
                  associatedBlocos.forEach(b => {
                    apiFetch(`cronogramas/${b.id}`, { method: "DELETE" }).catch(e => console.error(e));
                  });

                  materias = materias.filter(mat => mat.id !== m.id);
                  cronogramaNovo = cronogramaNovo.filter(b => b.materia.id !== m.id);
                  salvarMaterias();
                  salvarCronogramaNovo();
                  renderMaterias();
                  renderCronogramaNovo();
                  renderTabelaMaterias();
                  renderizarResumoHoje();
                } else {
                  Swal.fire('Erro', 'Não foi possível excluir a matéria no servidor.', 'error');
                }
              }).catch(err => {
                console.error("Erro ao deletar matéria:", err);
              });
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
              apiFetch(`cronogramas/${bloco.id}`, {
                method: "PUT",
                body: JSON.stringify({
                  id_materia: bloco.materia.id,
                  dia_semana: bloco.dia,
                  hora_inicio: inicio,
                  hora_final: fim
                })
              }).then(res => {
                if (res.ok) {
                  bloco.inicio = inicio;
                  bloco.fim = fim;
                  salvarCronogramaNovo();
                  renderCronogramaNovo();
                  renderizarResumoHoje();
                  atualizarMateriaAgora();
                } else {
                  Swal.fire('Erro', 'Não foi possível atualizar o cronograma no servidor.', 'error');
                }
              }).catch(err => {
                console.error("Erro ao atualizar cronograma:", err);
              });
            }
          } else if (result.isDenied) {
            apiFetch(`cronogramas/${bloco.id}`, {
              method: "DELETE"
            }).then(res => {
              if (res.ok) {
                cronogramaNovo = cronogramaNovo.filter(b => b.id !== bloco.id);
                salvarCronogramaNovo();
                renderCronogramaNovo();
                renderizarResumoHoje();
                atualizarMateriaAgora();
              } else {
                Swal.fire('Erro', 'Não foi possível excluir o cronograma no servidor.', 'error');
              }
            }).catch(err => {
              console.error("Erro ao deletar cronograma:", err);
            });
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
      apiFetch("cronogramas", {
        method: "POST",
        body: JSON.stringify({
          id_materia: materia.id,
          dia_semana: dia,
          hora_inicio: result.value.inicio,
          hora_final: result.value.fim
        })
      }).then(async res => {
        if (res.ok) {
          const respData = await res.json();
          cronogramaNovo.push({
            id: respData.id_cronograma,
            materia: materia,
            dia: dia,
            inicio: result.value.inicio,
            fim: result.value.fim
          });

          salvarCronogramaNovo();
          renderCronogramaNovo();
          renderizarResumoHoje();
          atualizarMateriaAgora();
        } else {
          Swal.fire('Erro', 'Não foi possível salvar o cronograma no servidor.', 'error');
        }
      }).catch(err => {
        console.error("Erro ao salvar cronograma:", err);
      });
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
  if (typeof materias === 'undefined' || !Array.isArray(materias)) {
    materias = [];
  }
  const el = document.getElementById("materiaAgoraInicio");
  if (!el) return;

  const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const hojeSemana = dias[new Date().getDay()];
  const agora = new Date();
  const horaAtual = String(agora.getHours()).padStart(2, '0') + ":" + String(agora.getMinutes()).padStart(2, '0');

  const cronogramaNovoLocal = (typeof cronogramaNovo !== 'undefined' && Array.isArray(cronogramaNovo)) ? cronogramaNovo : [];
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

function salvarHistoricoCronometro() {
  // Mantido em memória e sincronizado nas sessões do banco de dados
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
      <td style="text-align: left; padding-left: 20px;">
        <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${m.cor || '#9f042c'}; margin-right: 8px; vertical-align: middle; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></span>
        <span>${m.nome}</span>
        ${isEstudando ? ' <span style="color: #22c55e; font-size: 0.85rem; margin-left: 6px;">● Estudando</span>' : ''}
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
  segundosSessaoAtual = 0;
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
      segundosSessaoAtual++;
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
        salvarSessaoEstudoNoBackend(materia.id, tempoSegundos, "Foco Pomodoro (" + tempoMinutos + " min)");
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
  // Streak agora é calculado dinamicamente no banco a partir das sessões de estudo
  if (typeof carregarEstatisticas === 'function') {
    carregarEstatisticas();
  }
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
  const cronogramaLocal = (typeof cronogramaNovo !== 'undefined' && cronogramaNovo) ? cronogramaNovo : [];
  const blocoAtual = cronogramaLocal.find(b =>
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
  const { maiorStreak: streak } = (typeof calcularTotais === 'function') ? calcularTotais() : { maiorStreak: 0 };
  if (streakEl) {
    streakEl.textContent = streak + " dias";
  }
} function pausarEstudo() {
  if (intervaloEstudo) {
    clearInterval(intervaloEstudo);
    intervaloEstudo = null;
  }
  if (estudoAtual) {
    if (segundosSessaoAtual > 0) {
      salvarSessaoEstudoNoBackend(estudoAtual, segundosSessaoAtual, "Estudo Manual (Pausado)");
    }
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
  segundosSessaoAtual = 0;
  modoEstudo = "manual";
  notificarMudanca = false;
  renderTabelaMaterias();
  if (typeof atualizarRelogioInfo === 'function') {
    atualizarRelogioInfo();
  }
}
function adicionarMateriaRelogio() {
  const nomeInput = document.getElementById("novaMateriaRelogio");
  const corInput = document.getElementById("novaMateriaRelogioCor");
  const nome = nomeInput ? nomeInput.value.trim() : "";
  const cor = corInput ? corInput.value : "#9f042c";

  if (!nome) {
    Swal.fire({
      icon: "warning",
      title: "Nome obrigatório",
      text: "Por favor, digite o nome da matéria.",
      timer: 1800,
      showConfirmButton: false
    });
    return;
  }

  apiFetch("materias", {
    method: "POST",
    body: JSON.stringify({ nome: nome, cor: cor })
  }).then(async res => {
    if (res.ok) {
      const respData = await res.json();
      const novaMateria = {
        id: respData.id_materia.toString(),
        nome: nome,
        cor: cor
      };
      materias.push(novaMateria);
      if (nomeInput) nomeInput.value = "";
      renderTabelaMaterias();
      renderMaterias(); // atualiza o cronograma também
      if (typeof popularFiltroMaterias === 'function') popularFiltroMaterias();
      if (typeof carregarMateriasRevisao === 'function') carregarMateriasRevisao();
      if (typeof renderizarSelectMateriasVideos === 'function') renderizarSelectMateriasVideos();
      Swal.fire({ icon: "success", title: "Matéria adicionada!", timer: 1500, showConfirmButton: false });
    } else {
      Swal.fire({ icon: "error", title: "Erro ao adicionar matéria!", timer: 1500, showConfirmButton: false });
    }
  }).catch(err => {
    console.error("Erro ao adicionar matéria pelo relógio:", err);
  });
}
function finalizarEstudo() {
  const materia = estudoAtual ? materias.find(m => m.id == estudoAtual) : null;
  const nomeMateria = materia ? materia.nome : 'Desconhecida';
  const tempoSessao = segundosSessaoAtual;
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
      if (estudoAtual && segundosSessaoAtual > 0) {
        salvarSessaoEstudoNoBackend(estudoAtual, segundosSessaoAtual, "Estudo Manual");
      }
      estudoAtual = null;
      segundosSessaoAtual = 0;
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
  let cronogramaLocal = (typeof cronogramaNovo !== 'undefined' && cronogramaNovo) ? cronogramaNovo : [];
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

// ===== FECHAR SIDEBAR AO CLICAR EM LINKS =====
function closeSidebarOnLinkClick() {
  const links = document.querySelectorAll('#menuLateral .nav-link, .sidebar a, .sidebar button');

  links.forEach(link => {
    // Remove listener antigo para não duplicar
    link.removeEventListener('click', handleSidebarLinkClick);
    // Adiciona listener novo
    link.addEventListener('click', handleSidebarLinkClick);
  });
}

function handleSidebarLinkClick() {
  if (window.innerWidth <= 768) {
    closeSidebar();
  }
}

// ===== EVENT DELEGATION (MAIS ROBUSTO) =====
// Esta abordagem funciona mesmo se os links forem criados dinamicamente
document.addEventListener('click', function (e) {
  // Verifica se o clique foi em um link do menu lateral
  const sidebarLink = e.target.closest('#menuLateral .nav-link, .sidebar .nav-link, .sidebar a');

  if (sidebarLink && window.innerWidth <= 768) {
    // Pequeno delay para garantir que a navegação aconteça
    setTimeout(() => {
      closeSidebar();
    }, 100);
  }
});

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function () {
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.onclick = closeSidebar;
  }

  // Chama a função para configurar os links
  closeSidebarOnLinkClick();

  // Usa MutationObserver para detectar novos links adicionados
  const menuLateral = document.getElementById('menuLateral');
  if (menuLateral) {
    const observer = new MutationObserver(function () {
      closeSidebarOnLinkClick();
    });

    observer.observe(menuLateral, {
      childList: true,
      subtree: true
    });
  }
});

// ===== EXPORTAR FUNÇÕES GLOBALMENTE =====
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.closeSidebarOnLinkClick = closeSidebarOnLinkClick;

// ===== RESIZE =====
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
  
  // Calcular streak dinamicamente a partir dos dias estudados no banco
  let streakDinamico = 0;
  if (diasEstudados.size > 0) {
    const hojeStr = new Date().toISOString().split('T')[0];
    const ontemDate = new Date();
    ontemDate.setDate(ontemDate.getDate() - 1);
    const ontemStr = ontemDate.toISOString().split('T')[0];

    if (diasEstudados.has(hojeStr) || diasEstudados.has(ontemStr)) {
      let d = diasEstudados.has(hojeStr) ? new Date() : ontemDate;
      while (true) {
        const str = d.toISOString().split('T')[0];
        if (diasEstudados.has(str)) {
          streakDinamico++;
          d.setDate(d.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  const maiorStreak = streakDinamico;
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
    const { totalHoras, maiorStreak: streak } = calcularTotais();
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
    const { totalHoras, dias, maiorStreak: streak } = calcularTotais();
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
    const { maiorStreak: streakCalc } = calcularTotais();
    const dados = {
      versao: "1.0",
      dataExportacao: new Date().toISOString(),
      tarefas: tarefas || [],
      notas: notas || [],
      eventos: calendar ? calendar.getEvents().map(e => ({
        title: e.title,
        start: e.startStr,
        backgroundColor: e.backgroundColor,
        extendedProps: e.extendedProps
      })) : [],
      tempoEstudo: tempoEstudo || {},
      metas: metas || {},
      flashcards: flashcards || [],
      cronograma: cronogramaNovo || [],
      streak: streakCalc || 0
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
  
  console.log('🔍 Verificando acesso:', funcionalidade, '| Plano:', plano);
  
  if (!permissoes[funcionalidade]) {
    Swal.fire({
      icon: 'info',
      title: 'Recurso Premium',
      html: `
        <p>Esta funcionalidade está disponível nos planos <strong>Básico</strong> e <strong>Pro</strong>.</p>
        <p style="font-size: 0.8rem; color: #6b7280;">Seu plano atual: <strong>${plano.charAt(0).toUpperCase() + plano.slice(1)}</strong></p>
      `,
      confirmButtonText: '<i class="bi bi-star-fill me-1"></i> Ver Planos',
      confirmButtonColor: '#9f042c',
      showCancelButton: true,
      cancelButtonText: 'Fechar'
    }).then(result => {
      if (result.isConfirmed) {
        abrirModalConfiguracoes();
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
      const planoDb = tipo.charAt(0).toUpperCase() + tipo.slice(1); // "Gratuito", "Basico", "Pro"
      apiFetch("perfil", {
        method: "PUT",
        body: JSON.stringify({ plano: planoDb })
      }).then(response => {
        if (response.ok) {
          localStorage.setItem("planoUsuario", tipo);
          atualizarBotoesPlanos();
          atualizarBadgePlano();
          aplicarBloqueiosPlano();

          Swal.fire({
            icon: 'success',
            title: 'Plano atualizado!',
            text: `Agora voce esta no plano ${planoDb}.`,
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: 'Não foi possível atualizar o plano no servidor.',
            confirmButtonColor: '#9f042c'
          });
        }
      }).catch(err => {
        console.error("Erro ao atualizar plano:", err);
        Swal.fire({
          icon: 'error',
          title: 'Erro de conexão!',
          text: 'Não foi possível se conectar ao servidor.',
          confirmButtonColor: '#9f042c'
        });
      });
    }
  });
}

function atualizarBotoesPlanos() {
  const { plano } = verificarPlano();

  const planos = ['gratuito', 'basico', 'pro'];
  
  planos.forEach(p => {
    const nomeCap = p.charAt(0).toUpperCase() + p.slice(1);
    const card = document.getElementById(`cardPlano${nomeCap}`);
    const badge = document.getElementById(`badgePlano${nomeCap}`);
    const btn = document.getElementById(`btnPlano${nomeCap}`);

    if (card) {
      if (plano === p) {
        card.classList.add('ativo');
        card.style.border = '2px solid var(--cor-primaria)';
      } else {
        card.classList.remove('ativo');
        card.style.border = '1px solid #e5e7eb';
      }
    }

    if (badge) {
      badge.style.display = (plano === p) ? 'inline-block' : 'none';
    }

    if (btn) {
      if (plano === p) {
        btn.textContent = 'Plano Atual';
        btn.disabled = true;
        btn.style.opacity = '0.6';
      } else {
        btn.textContent = (p === 'gratuito') ? 'Mudar para Gratuito' : `Assinar ${nomeCap}`;
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    }
  });

  // Badge no topo
  const badgeTopo = document.getElementById('badgePlano');
  if (badgeTopo) {
    badgeTopo.textContent = 'Seu plano: ' + plano.charAt(0).toUpperCase() + plano.slice(1);
  }
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
  const { plano, permissoes } = verificarPlano();
  
  console.log('🔒 Aplicando bloqueios do plano:', plano);
  
  // Mapa de telas que precisam de permissão
  const mapaBloqueios = {
    'estatistica': 'estatisticas',
    'cronogramaNovo': 'cronograma'
  };
  
  document.querySelectorAll('#menuLateral .nav-link').forEach(link => {
    const onclick = link.getAttribute('onclick') || '';
    
    // Remover bloqueio anterior
    link.classList.remove('bloqueado');
    link.style.pointerEvents = 'auto';
    link.style.opacity = '1';
    
    // Verificar se precisa bloquear
    for (const [tela, permissao] of Object.entries(mapaBloqueios)) {
      if (onclick.includes(tela) && !permissoes[permissao]) {
        link.classList.add('bloqueado');
        link.style.pointerEvents = 'none';
        link.style.opacity = '0.5';
        console.log('🔒 Bloqueado:', tela);
      }
    }
  });
}

// Chamar na inicialização
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    if (typeof aplicarBloqueiosPlano === 'function') {
      aplicarBloqueiosPlano();
    }
  }, 500);
});

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

window.addEventListener("beforeunload", () => {
  if (estudoAtual && segundosSessaoAtual > 0) {
    salvarSessaoEstudoNoBackend(estudoAtual, segundosSessaoAtual, "Estudo Fechamento Janela");
  }
});


// ===== CORNELL - VERSÃO FOLHA DE PAPEL =====

// Estado do Cornell
let cornellDados = {
  titulo: '',
  perguntas: [], // [{id, texto}]
  respostas: [], // [{id, texto, perguntaId}]
  resumo: ''
};

let cornellEditandoId = null;
let cornellModoRevisao = false;

// ===== ABRIR CORNELL =====
function abrirCornell() {
  console.log('📝 Abrindo Cornell');
  if (typeof fecharMetodoModal === 'function') fecharMetodoModal();

  // Filtra apenas notas Cornell carregadas do banco de dados
  const notasCornell = (typeof notas !== 'undefined' && Array.isArray(notas)) ? notas.filter(nota => nota.tipo === 'cornell') : [];

  // Cria ou atualiza o modal
  let modal = document.getElementById('cornellModalOverlay');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'cornellModalOverlay';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 999999;
      display: flex; align-items: center; justify-content: center;
      padding: 20px; backdrop-filter: blur(4px);
      animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(modal);
  }

  modal.style.display = 'flex';
  modal.innerHTML = criarHtmlCornell(notasCornell);
  const cornellContent = modal.querySelector('.cornell-modal-content');
  if (cornellContent && cornellContent.style) {
    cornellContent.style.animation = 'slideUp 0.3s ease';
  }

  // Inicializa eventos
  inicializarEventosCornell(notasCornell);
}

function criarHtmlCornell(notasCornell) {
  let inteligencia = 'logico';
  if (window.usuarioLogadoPerfil && window.usuarioLogadoPerfil.tipo_dom) {
    inteligencia = normalizarInteligencia(window.usuarioLogadoPerfil.tipo_dom);
  }
  
  // Cores baseadas na inteligência do usuário
  const cores = {
    linguistica: '#9f042c',
    intrapessoal: '#5170ff',
    interpessoal: '#ff5f00',
    musical: '#8a03d2',
    logico: '#ffbd59',
    espacial: '#d203a4',
    corporal: '#00bf63',
  };
  
  const cor = cores[inteligencia] || cores.logico;

  // Lista de notas salvas
  let notasHtml = '';
  if (notasCornell.length === 0) {
    notasHtml = `
      <div style="text-align:center;padding:20px;color:#aaa;font-size:13px;">
        Nenhuma nota salva ainda
      </div>
    `;
  } else {
    notasHtml = notasCornell.map(nota => `
      <div style="
        background: white;
        border-radius: 6px;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border: 1px solid #eee;
        transition: all 0.2s;
        cursor: pointer;
      " onmouseover="this.style.borderColor='${cor}'; this.style.background='#fafafa'"
         onmouseout="this.style.borderColor='#eee'; this.style.background='white'">
        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;">
          <div style="font-size:13px;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${nota.titulo || 'Nota sem título'}
          </div>
          <span style="font-size:9px;color:#999;flex-shrink:0;">
            ${nota.dataCriacao || new Date().toLocaleDateString('pt-BR')}
          </span>
        </div>
        <div style="display:flex;gap:2px;flex-shrink:0;margin-left:6px;">
          <button onclick="event.stopPropagation(); abrirNotaCornell('${nota.id}')" style="
            background:none;border:none;color:#999;cursor:pointer;padding:2px 5px;border-radius:3px;font-size:12px;
          " onmouseover="this.style.background='#f0f0f0'"
             onmouseout="this.style.background='transparent'">
            <i class="bi bi-eye"></i>
          </button>
          <button onclick="event.stopPropagation(); excluirNotaCornell('${nota.id}')" style="
            background:none;border:none;color:#999;cursor:pointer;padding:2px 5px;border-radius:3px;font-size:12px;
          " onmouseover="this.style.background='#fee';this.style.color='#dc3545'"
             onmouseout="this.style.background='transparent';this.style.color='#999'">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  return `
    <div style="
      background: #f5f0ea;
      border-radius: 20px;
      width: 100%;
      max-width: 820px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      display: flex;
      flex-direction: column;
      position: relative;
    ">
      <!-- Header -->
      <div style="
        background: ${cor};
        padding: 12px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      ">
        <div style="display:flex;align-items:center;gap:8px;">
          <i class="bi bi-journal" style="color:white;font-size:16px;"></i>
          <span style="color:white;font-weight:600;font-size:14px;">Método Cornell</span>
          <span style="font-size:9px;color:rgba(255,255,255,0.5);background:rgba(255,255,255,0.1);padding:1px 8px;border-radius:8px;">
            ${inteligencia.charAt(0).toUpperCase() + inteligencia.slice(1)}
          </span>
        </div>
        <button onclick="fecharCornell()" style="
          background:rgba(255,255,255,0.08);color:white;border:none;
          padding:3px 10px;border-radius:4px;cursor:pointer;font-size:13px;
        " onmouseover="this.style.background='rgba(255,255,255,0.15)'"
           onmouseout="this.style.background='rgba(255,255,255,0.08)'">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- Corpo -->
      <div style="flex:1;overflow-y:auto;padding:20px 24px 24px;background:#f5f0ea;">
        <!-- Folha de caderno -->
        <div style="
          background: #fcf9f5;
          border-radius: 8px;
          padding: 24px 28px 20px;
          max-width: 740px;
          margin: 0 auto;
          position: relative;
          min-height: 380px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        ">
          <!-- Linhas do caderno -->
          <div style="
            position:absolute;top:0;left:0;right:0;bottom:0;
            pointer-events:none;opacity:0.05;
            background-image: repeating-linear-gradient(
              transparent,
              transparent 25px,
              ${cor} 25.5px
            );
            border-radius:8px;
          "></div>

          <!-- Linha da margem -->
          <div style="
            position:absolute;top:0;left:48px;bottom:0;
            width:1.5px;
            background:${cor}15;
            pointer-events:none;
          "></div>

          <!-- Conteúdo -->
          <div style="position:relative;z-index:1;">
            <!-- Título -->
            <div style="margin-bottom:16px;">
              <input id="cornellTituloInput" type="text" style="
                width:100%;padding:4px 0;
                border:none;border-bottom:1.5px solid #d0c8bc;
                font-size:17px;font-weight:600;
                color:${cor};
                background:transparent;
                outline:none;transition:border-color 0.3s;
                font-family:inherit;
              " placeholder="Título da anotação..."
              onfocus="this.style.borderColor='${cor}'"
              onblur="this.style.borderColor='#d0c8bc'">
            </div>

            <!-- Duas colunas -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:14px;">
              <!-- Esquerda -->
              <div>
                <div style="font-size:10px;font-weight:600;color:${cor};text-transform:uppercase;letter-spacing:0.3px;margin-bottom:4px;">
                  Perguntas
                </div>
                <textarea id="cornellPerguntaInput" style="
                  width:100%;min-height:160px;
                  padding:8px 10px;
                  border:1px solid #e0d8ce;
                  border-radius:4px;
                  font-family:inherit;font-size:13px;
                  resize:vertical;
                  transition:border-color 0.3s;
                  background:#faf8f5;
                  line-height:1.7;
                  color:#2c3e50;
                " placeholder="Escreva suas perguntas aqui..."
                onfocus="this.style.borderColor='${cor}';this.style.background='white'"
                onblur="this.style.borderColor='#e0d8ce';this.style.background='#faf8f5'"></textarea>
                <div style="margin-top:3px;font-size:9px;color:#b0a89c;text-align:right;">
                  <span id="cornellContadorPergunta">0</span>
                </div>
              </div>

              <!-- Direita -->
              <div>
                <div style="font-size:10px;font-weight:600;color:${cor};text-transform:uppercase;letter-spacing:0.3px;margin-bottom:4px;">
                  Respostas
                </div>
                <textarea id="cornellRespostaInput" style="
                  width:100%;min-height:160px;
                  padding:8px 10px;
                  border:1px solid #e0d8ce;
                  border-radius:4px;
                  font-family:inherit;font-size:13px;
                  resize:vertical;
                  transition:border-color 0.3s;
                  background:#faf8f5;
                  line-height:1.7;
                  color:#2c3e50;
                " placeholder="Escreva suas respostas aqui..."
                onfocus="this.style.borderColor='${cor}';this.style.background='white'"
                onblur="this.style.borderColor='#e0d8ce';this.style.background='#faf8f5'"></textarea>
                <div style="margin-top:3px;font-size:9px;color:#b0a89c;text-align:right;">
                  <span id="cornellContadorResposta">0</span>
                </div>
              </div>
            </div>

            <!-- Resumo -->
            <div style="margin-bottom:14px;">
              <div style="font-size:10px;font-weight:600;color:${cor};text-transform:uppercase;letter-spacing:0.3px;margin-bottom:3px;">
                Resumo (opcional)
              </div>
              <textarea id="cornellResumoInput" style="
                width:100%;min-height:40px;
                padding:6px 10px;
                border:1px solid #e0d8ce;
                border-radius:4px;
                font-family:inherit;font-size:13px;
                resize:vertical;
                transition:border-color 0.3s;
                background:#faf8f5;
                line-height:1.5;
                color:#2c3e50;
              " placeholder="Resuma o que aprendeu..."
              onfocus="this.style.borderColor='${cor}';this.style.background='white'"
              onblur="this.style.borderColor='#e0d8ce';this.style.background='#faf8f5'"></textarea>
            </div>

            <!-- Botões -->
            <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:12px;border-top:1.5px solid #e8e0d6;">
              <button onclick="salvarNotaCornell()" style="
                background:${cor};color:white;border:none;
                padding:7px 20px;border-radius:6px;
                font-weight:600;cursor:pointer;
                transition:all 0.2s;
                display:flex;align-items:center;gap:6px;
                font-size:13px;
              " onmouseover="this.style.opacity='0.85'"
                 onmouseout="this.style.opacity='1'">
                <i class="bi bi-save" style="font-size:13px;"></i> Salvar
              </button>
              <button onclick="limparCamposCornell()" style="
                background:#d0c8bc;color:#5a4a3a;border:none;
                padding:7px 16px;border-radius:6px;
                font-weight:500;cursor:pointer;
                transition:all 0.2s;
                display:flex;align-items:center;gap:6px;
                font-size:13px;
              " onmouseover="this.style.background='#c0b8ac'"
                 onmouseout="this.style.background='#d0c8bc'">
                <i class="bi bi-eraser" style="font-size:13px;"></i> Limpar
              </button>
            </div>
          </div>
        </div>

        <!-- Lista de notas -->
        <div style="max-width:740px;margin:16px auto 0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-size:12px;color:#5a6a7a;font-weight:500;display:flex;align-items:center;gap:6px;">
              <i class="bi bi-archive" style="color:${cor};font-size:14px;"></i>
              Minhas Notas
              <span id="cornellTotalNotas" style="font-size:10px;font-weight:normal;color:#b0a89c;">
                (${notasCornell.length})
              </span>
            </span>
          </div>

          <div id="cornellListaNotas" style="display:flex;flex-direction:column;gap:4px;max-height:160px;overflow-y:auto;padding-right:2px;">
            ${notasHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ===== INICIALIZAR EVENTOS =====
function inicializarEventosCornell(notasCornell) {
  // Contadores de caracteres
  const perguntaInput = document.getElementById('cornellPerguntaInput');
  const respostaInput = document.getElementById('cornellRespostaInput');
  const contPergunta = document.getElementById('cornellContadorPergunta');
  const contResposta = document.getElementById('cornellContadorResposta');

  if (perguntaInput && contPergunta) {
    perguntaInput.addEventListener('input', function() {
      contPergunta.textContent = this.value.length;
    });
  }

  if (respostaInput && contResposta) {
    respostaInput.addEventListener('input', function() {
      contResposta.textContent = this.value.length;
    });
  }

  // Fechar com ESC
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('cornellModalOverlay');
      if (modal && modal.style.display === 'flex') {
        fecharCornell();
      }
      document.removeEventListener('keydown', handler);
    }
  });

  // Fechar clicando fora
  const modal = document.getElementById('cornellModalOverlay');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) fecharCornell();
    });
  }
}

// ===== SALVAR NOTA CORNELL =====
async function salvarNotaCornell() {
  const tituloInput = document.getElementById('cornellTituloInput');
  const perguntaInput = document.getElementById('cornellPerguntaInput');
  const respostaInput = document.getElementById('cornellRespostaInput');
  const resumoInput = document.getElementById('cornellResumoInput');

  if (!perguntaInput || !respostaInput) return;

  const titulo = tituloInput ? tituloInput.value.trim() : 'Nota Cornell';
  const pergunta = perguntaInput.value.trim();
  const resposta = respostaInput.value.trim();
  const resumo = resumoInput ? resumoInput.value.trim() : '';

  if (!pergunta || !resposta) {
    Swal.fire({
      icon: 'warning',
      title: 'Campos incompletos!',
      text: 'Preencha tanto a pergunta quanto a resposta.'
    });
    return;
  }

  const textoHtml = `
<div style="padding: 20px; background: #fafafa; border-radius: 12px; border: 1px solid #e5e7eb;">
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
    <div style="border-right: 3px solid #dc3545; padding-right: 20px;">
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
        <strong style="color: #dc3545; font-size: 13px;">Pergunta</strong>
      </div>
      <p style="margin: 0; color: #dc3545; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${pergunta}</p>
    </div>
    <div>
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
        <strong style="color: #28a745; font-size: 13px;">Resposta</strong>
      </div>
      <p style="margin: 0; color: #28a745; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${resposta}</p>
    </div>
  </div>
  ${resumo ? `
  <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #e5e7eb;">
    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
      <strong style="color: #6c757d; font-size: 13px;">Resumo</strong>
    </div>
    <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${resumo}</p>
  </div>
  ` : ''}
  <div style="margin-top: 12px; padding: 6px 12px; background: #f0f0f0; border-radius: 6px; font-size: 11px; color: #666; display: inline-block;">
    <i class="bi bi-tag"></i> Método Cornell
  </div>
</div>
  `;

  const payload = {
    conteudo: JSON.stringify({
      titulo: titulo || `📝 Cornell: ${pergunta.substring(0, 30)}${pergunta.length > 30 ? '...' : ''}`,
      texto: textoHtml,
      corTexto: '#000000',
      checklist: [],
      anexos: [],
      favorito: false,
      dataCriacao: new Date().toLocaleString('pt-BR'),
      tipo: 'cornell',
      pergunta: pergunta,
      resposta: resposta,
      resumo: resumo
    }),
    cor_nota: '#ffffff'
  };

  try {
    const response = await apiFetch("blocos", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      await carregarNotasDoBackend();

      if (tituloInput) tituloInput.value = '';
      perguntaInput.value = '';
      respostaInput.value = '';
      if (resumoInput) resumoInput.value = '';
      const contP = document.getElementById('cornellContadorPergunta');
      const contR = document.getElementById('cornellContadorResposta');
      if (contP) contP.textContent = '0';
      if (contR) contR.textContent = '0';

      const notasCornell = notas.filter(n => n.tipo === 'cornell');
      const modal = document.getElementById('cornellModalOverlay');
      if (modal) {
        modal.innerHTML = criarHtmlCornell(notasCornell);
        inicializarEventosCornell(notasCornell);
      }

      if (typeof renderNotas === 'function') {
        renderNotas();
      }

      mostrarToast('✅ Nota salva!', '#22c55e');
    } else {
      mostrarToast('❌ Erro ao salvar nota', '#ef4444');
    }
  } catch (err) {
    console.error("Erro ao salvar nota Cornell:", err);
  }
}

// ===== ABRIR NOTA CORNELL =====
function abrirNotaCornell(id) {
  const nota = notas.find(n => n.id == id);
  if (!nota) return;

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: nota.titulo || 'Nota Cornell',
      html: nota.texto,
      confirmButtonText: 'Fechar',
      confirmButtonColor: 'var(--cor-primaria)',
      width: '700px',
      customClass: {
        content: 'text-left'
      }
    });
  }
}

// ===== EXCLUIR NOTA CORNELL =====
function excluirNotaCornell(id) {
  Swal.fire({
    title: 'Excluir anotação?',
    text: 'Essa ação não pode ser desfeita!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc3545'
  }).then(async result => {
    if (result.isConfirmed) {
      try {
        const response = await apiFetch(`blocos/${id}`, { method: "DELETE" });
        if (response.ok) {
          await carregarNotasDoBackend();
          const notasCornell = notas.filter(n => n.tipo === 'cornell');
          const modal = document.getElementById('cornellModalOverlay');
          if (modal) {
            modal.innerHTML = criarHtmlCornell(notasCornell);
            inicializarEventosCornell(notasCornell);
          }

          if (typeof renderNotas === 'function') {
            renderNotas();
          }

          mostrarToast('🗑️ Anotação excluída!', '#22c55e');
        } else {
          mostrarToast('❌ Erro ao excluir nota', '#ef4444');
        }
      } catch (err) {
        console.error("Erro ao excluir nota Cornell:", err);
      }
    }
  });
}

// ===== LIMPAR CAMPOS =====
function limparCamposCornell() {
  const pergunta = document.getElementById('cornellPerguntaInput');
  const resposta = document.getElementById('cornellRespostaInput');
  const resumo = document.getElementById('cornellResumoInput');

  if (pergunta) pergunta.value = '';
  if (resposta) resposta.value = '';
  if (resumo) resumo.value = '';
  document.getElementById('cornellContadorPergunta').textContent = '0';
  document.getElementById('cornellContadorResposta').textContent = '0';

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'info',
      title: 'Campos limpos!',
      timer: 800,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }
}

// ===== FECHAR CORNELL =====
function fecharCornell() {
  const modal = document.getElementById('cornellModalOverlay');
  if (modal) {
    modal.style.display = 'none';
  }
}

// ===== EXPORTAR FUNÇÕES =====
window.abrirCornell = abrirCornell;
window.fecharCornell = fecharCornell;
window.salvarNotaCornell = salvarNotaCornell;
window.limparCamposCornell = limparCamposCornell;
window.excluirNotaCornell = excluirNotaCornell;
window.abrirNotaCornell = abrirNotaCornell;

// =============================================
// ===== MAPA MENTAL - VERSÃO FINAL ===========
// =============================================

let mapaMentalNos = [];
let mapaMentalConexoes = [];
let mapaMentalIdCounter = 0;
let mapaMentalNoArrastando = null;
let mapaMentalConectando = null;
let mapaMentalOffsetX = 0;
let mapaMentalOffsetY = 0;
let mapaMentalCanvas = null;
let mapaMentalCtx = null;
let mapaMentalHistorico = [];
let mapasMentaisSalvos = [];
let mapaMentalZoom = 1;
let mapaMentalZoomMin = 0.1;
let mapaMentalZoomMax = 5;
let mapaMentalPanning = false;
let mapaMentalPanStartX = 0;
let mapaMentalPanStartY = 0;
let mapaMentalArrastandoFundo = false;

// ===== TOAST =====
function mostrarToast(mensagem, cor = '#22c55e') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    background: ${cor}; color: white; padding: 12px 20px; border-radius: 10px;
    font-weight: 600; font-size: 0.9rem; z-index: 9999999;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: slideDown 0.3s ease;
  `;
  toast.innerHTML = mensagem;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// ===== HISTÓRICO (CTRL+Z) =====
function salvarEstadoHistorico() {
  mapaMentalHistorico.push({
    nos: JSON.parse(JSON.stringify(mapaMentalNos)),
    conexoes: JSON.parse(JSON.stringify(mapaMentalConexoes))
  });
  if (mapaMentalHistorico.length > 50) mapaMentalHistorico.shift();
}

function desfazerUltimaAcao() {
  if (mapaMentalHistorico.length === 0) return;
  const estado = mapaMentalHistorico.pop();
  mapaMentalNos = estado.nos;
  mapaMentalConexoes = estado.conexoes;
  document.getElementById('mapaMentalNosContainer').innerHTML = '';
  mapaMentalNos.forEach(no => renderizarNo(no));
  desenharConexoes();
  mostrarToast('↩️ Ação desfeita!', '#6b7280');
}

// ===== ZOOM =====
function aplicarZoom(fator) {
  const container = document.getElementById('mapaMentalNosContainer');
  if (!container) return;

  const novoZoom = Math.max(mapaMentalZoomMin, Math.min(mapaMentalZoomMax, mapaMentalZoom * fator));
  if (novoZoom === mapaMentalZoom) return;

  mapaMentalZoom = novoZoom;
  container.style.transform = `scale(${mapaMentalZoom})`;
  container.style.transformOrigin = '0 0';

  const indicador = document.getElementById('mapaMentalZoomIndicador');
  if (indicador) indicador.textContent = Math.round(mapaMentalZoom * 100) + '%';

  desenharConexoes();
}

function zoomIn() { aplicarZoom(1.2); }
function zoomOut() { aplicarZoom(0.8); }

function resetZoom() {
  mapaMentalZoom = 1;
  const container = document.getElementById('mapaMentalNosContainer');
  if (container) {
    container.style.transform = 'scale(1)';
    container.style.transformOrigin = '0 0';
  }
  const indicador = document.getElementById('mapaMentalZoomIndicador');
  if (indicador) indicador.textContent = '100%';
  desenharConexoes();
}

function atualizarIndicadorZoom() {
  const indicador = document.getElementById('mapaMentalZoomIndicador');
  if (indicador) indicador.textContent = Math.round(mapaMentalZoom * 100) + '%';
}

// ===== EVENTOS DE ZOOM E PAN =====
function inicializarEventosZoomPan() {
  const container = document.getElementById('mapaMentalCanvasContainer');
  if (!container) return;

  // Zoom com roda do mouse
  container.addEventListener('wheel', function (e) {
    e.preventDefault();
    aplicarZoom(e.deltaY < 0 ? 1.1 : 0.9);
  }, { passive: false });

  // Pan - arrastar o fundo com botão esquerdo
  container.addEventListener('mousedown', function (e) {
    if (e.target === container || e.target.id === 'mapaMentalNosContainer' || e.target === document.getElementById('mapaMentalCanvas')) {
      mapaMentalArrastandoFundo = true;
      mapaMentalPanStartX = e.clientX;
      mapaMentalPanStartY = e.clientY;
      container.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });

  document.addEventListener('mousemove', function (e) {
    if (!mapaMentalArrastandoFundo) return;

    const dx = e.clientX - mapaMentalPanStartX;
    const dy = e.clientY - mapaMentalPanStartY;
    mapaMentalPanStartX = e.clientX;
    mapaMentalPanStartY = e.clientY;

    mapaMentalNos.forEach(no => {
      no.x += dx / mapaMentalZoom;
      no.y += dy / mapaMentalZoom;
      const div = document.getElementById(`mapa-no-${no.id}`);
      if (div) {
        div.style.left = no.x + 'px';
        div.style.top = no.y + 'px';
      }
    });
    desenharConexoes();
  });

  document.addEventListener('mouseup', function () {
    mapaMentalArrastandoFundo = false;
    container.style.cursor = 'crosshair';
  });

  // Pan alternativo - botão do meio ou direito
  container.addEventListener('mousedown', function (e) {
    if (e.button === 1 || e.button === 2) {
      e.preventDefault();
      mapaMentalPanning = true;
      mapaMentalPanStartX = e.clientX;
      mapaMentalPanStartY = e.clientY;
      container.style.cursor = 'grabbing';
    }
  });

  document.addEventListener('mousemove', function (e) {
    if (!mapaMentalPanning) return;
    const dx = e.clientX - mapaMentalPanStartX;
    const dy = e.clientY - mapaMentalPanStartY;
    mapaMentalPanStartX = e.clientX;
    mapaMentalPanStartY = e.clientY;

    mapaMentalNos.forEach(no => {
      no.x += dx / mapaMentalZoom;
      no.y += dy / mapaMentalZoom;
      const div = document.getElementById(`mapa-no-${no.id}`);
      if (div) {
        div.style.left = no.x + 'px';
        div.style.top = no.y + 'px';
      }
    });
    desenharConexoes();
  });

  document.addEventListener('mouseup', function () {
    mapaMentalPanning = false;
    container.style.cursor = 'crosshair';
  });

  // Ctrl+Z
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      const modalAberto = document.getElementById('mapaMentalModalOverlay');
      if (modalAberto && modalAberto.style.display === 'flex') {
        e.preventDefault();
        desfazerUltimaAcao();
      }
    }
  });

  // Previne menu de contexto
  container.addEventListener('contextmenu', function (e) { e.preventDefault(); });
}

// ===== CARREGAR DO SERVIDOR =====
async function carregarMapasMentaisServidor() {
  try {
    const response = await apiFetch("mapasmentais");
    if (response.ok) {
      mapasMentaisSalvos = await response.json();
      renderizarMapasSalvos();
    }
  } catch (err) {
    console.error("Erro ao carregar mapas mentais do servidor:", err);
  }
}

// ===== ABRIR MODAL =====
function abrirMapaMental() {
  console.log('🗺️ Abrindo Mapa Mental');
  if (typeof fecharMetodoModal === 'function') fecharMetodoModal();

  const modal = document.getElementById('mapaMentalModalOverlay');
  if (modal) {
    modal.style.display = 'flex';
    setTimeout(() => {
      inicializarMapaMental();
      carregarMapasMentaisServidor();
    }, 100);
  }
}

// ===== INICIALIZAR =====
function inicializarMapaMental() {
  const container = document.getElementById('mapaMentalCanvasContainer');
  const canvas = document.getElementById('mapaMentalCanvas');
  if (!container || !canvas) return;

  setTimeout(() => {
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  }, 200);

  mapaMentalCanvas = canvas;
  mapaMentalCtx = canvas.getContext('2d');
  mapaMentalZoom = 1;
  mapaMentalNos = [];
  mapaMentalConexoes = [];
  mapaMentalHistorico = [];

  const nosContainer = document.getElementById('mapaMentalNosContainer');
  if (nosContainer) {
    nosContainer.innerHTML = '';
    nosContainer.style.transform = 'scale(1)';
    nosContainer.style.transformOrigin = '0 0';
  }

  const tituloInput = document.getElementById('mapaMentalTitulo');
  if (tituloInput) tituloInput.value = '';

  atualizarIndicadorZoom();
  inicializarEventosZoomPan();

  container.onclick = function (e) {
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / mapaMentalZoom;
    const y = (e.clientY - rect.top) / mapaMentalZoom;

    if (e.target === container || e.target === canvas || e.target.id === 'mapaMentalNosContainer') {
      adicionarNo(x, y);
    }
  };
}

// ===== ADICIONAR NÓ =====
function adicionarNo(x, y, texto = '', cor = null, isCentral = false) {
  salvarEstadoHistorico();
  const corNo = cor || document.getElementById('mapaMentalCorNo').value;

  const no = {
    id: mapaMentalIdCounter++,
    x: x || 300,
    y: y || 300,
    titulo: texto || 'Novo tópico',
    anotacoes: '',
    cor: corNo,
    isCentral: isCentral,
    negrito: false,
    italico: false,
    alinhamento: 'center'
  };

  mapaMentalNos.push(no);
  renderizarNo(no);

  if (isCentral) {
    const tituloInput = document.getElementById('mapaMentalTitulo');
    if (tituloInput && !tituloInput.value) tituloInput.value = no.titulo;
  }
  return no;
}

// ===== ADICIONAR NÓ CENTRAL =====
function adicionarNoCentral() {
  const container = document.getElementById('mapaMentalCanvasContainer');
  const tituloInput = document.getElementById('mapaMentalTitulo');

  mapaMentalNos = mapaMentalNos.filter(no => !no.isCentral);
  document.getElementById('mapaMentalNosContainer').innerHTML = '';
  mapaMentalNos.forEach(no => renderizarNo(no));

  const x = (container.offsetWidth / 2 / mapaMentalZoom) - 60;
  const y = (container.offsetHeight / 2 / mapaMentalZoom) - 30;

  const no = adicionarNo(x, y, tituloInput.value || 'Tema Central', '#9f042c', true);
  if (tituloInput) tituloInput.value = no.titulo;
  setTimeout(() => editarNo(no.id), 300);
}

// ===== RENDERIZAR NÓ =====
function renderizarNo(no) {
  const container = document.getElementById('mapaMentalNosContainer');
  if (!container) return;

  const div = document.createElement('div');
  div.className = `mapa-mental-no ${no.isCentral ? 'central' : ''}`;
  div.id = `mapa-no-${no.id}`;
  div.style.left = no.x + 'px';
  div.style.top = no.y + 'px';
  div.style.background = no.cor;
  div.style.color = 'white';
  div.style.zIndex = 10;

  div.innerHTML = `
    <div style="font-size: ${no.isCentral ? '1rem' : '0.85rem'}; font-weight: ${no.negrito ? '700' : '600'}; font-style: ${no.italico ? 'italic' : 'normal'}; text-align: ${no.alinhamento}; word-wrap: break-word;">
      ${no.titulo}
    </div>
    ${no.anotacoes ? `<div style="font-size: 0.7rem; opacity: 0.8; margin-top: 5px;">${no.anotacoes}</div>` : ''}
  `;

  const btnEditar = document.createElement('button');
  btnEditar.innerHTML = '✏️';
  btnEditar.style.cssText = 'position:absolute;top:-10px;left:-10px;width:24px;height:24px;border-radius:50%;background:#3b82f6;color:white;border:2px solid white;cursor:pointer;display:none;align-items:center;justify-content:center;font-size:0.7rem;z-index:20;';
  btnEditar.onclick = function (e) { e.stopPropagation(); editarNo(no.id); };
  div.appendChild(btnEditar);

  const btnDeletar = document.createElement('button');
  btnDeletar.innerHTML = '×';
  btnDeletar.style.cssText = 'position:absolute;top:-10px;right:-10px;width:24px;height:24px;border-radius:50%;background:#ef4444;color:white;border:2px solid white;cursor:pointer;display:none;align-items:center;justify-content:center;font-size:0.9rem;font-weight:bold;z-index:20;';
  btnDeletar.onclick = function (e) { e.stopPropagation(); deletarNo(no.id); };
  div.appendChild(btnDeletar);

  div.onmouseenter = function () { btnEditar.style.display = 'flex'; btnDeletar.style.display = 'flex'; };
  div.onmouseleave = function () { btnEditar.style.display = 'none'; btnDeletar.style.display = 'none'; };
  div.onmousedown = function (e) { if (e.target !== btnEditar && e.target !== btnDeletar) iniciarArrastarNo(e, no.id); };
  div.ondblclick = function (e) { e.preventDefault(); e.stopPropagation(); editarNo(no.id); };
  div.onclick = function (e) { e.stopPropagation(); if (mapaMentalNoArrastando === null) selecionarNoParaConectar(no.id, div); };

  container.appendChild(div);
}

// ===== EDITAR NÓ =====
function editarNo(id) {
  const no = mapaMentalNos.find(n => n.id === id);
  if (!no) return;
  salvarEstadoHistorico();

  const modal = document.createElement('div');
  modal.id = 'modalEdicaoNo';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';

  modal.innerHTML = `
    <div style="background:white;border-radius:20px;padding:30px;width:100%;max-width:450px;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-height:90vh;overflow-y:auto;">
      <h3 style="text-align:center;margin-bottom:20px;color:#374151;">✏️ Editar Tópico</h3>
      
      <label style="font-weight:600;color:#4b5563;font-size:0.85rem;">Título:</label>
      <input type="text" id="inputEditarTitulo" value="${no.titulo}" style="width:100%;padding:10px;border:2px solid #e5e7eb;border-radius:10px;margin-bottom:15px;font-size:0.95rem;">
      
      <label style="font-weight:600;color:#4b5563;font-size:0.85rem;">Anotações:</label>
      <textarea id="inputEditarAnotacoes" rows="3" style="width:100%;padding:10px;border:2px solid #e5e7eb;border-radius:10px;margin-bottom:15px;font-size:0.85rem;">${no.anotacoes || ''}</textarea>
      
      <label style="font-weight:600;color:#4b5563;font-size:0.85rem;">Cor:</label>
      <input type="color" id="inputEditarCor" value="${no.cor}" style="width:100%;height:40px;border:2px solid #e5e7eb;border-radius:10px;margin-bottom:15px;cursor:pointer;">
      
      <div style="display:flex;gap:8px;margin-bottom:20px;">
        <button onclick="toggleNegritoModal()" id="btnModalNegrito" style="padding:8px 12px;border:2px solid #e5e7eb;border-radius:8px;background:white;cursor:pointer;font-weight:700;"><b>B</b></button>
        <button onclick="toggleItalicoModal()" id="btnModalItalico" style="padding:8px 12px;border:2px solid #e5e7eb;border-radius:8px;background:white;cursor:pointer;font-style:italic;"><i>I</i></button>
        <button onclick="toggleAlinhamentoModal()" id="btnModalAlinhamento" style="padding:8px 12px;border:2px solid #e5e7eb;border-radius:8px;background:white;cursor:pointer;font-size:0.8rem;">${no.alinhamento === 'center' ? 'Centro' : no.alinhamento === 'left' ? 'Esquerda' : 'Direita'}</button>
      </div>
      
      <div style="display:flex;gap:10px;">
        <button onclick="fecharModalEdicaoNo()" style="flex:1;padding:12px;border:2px solid #e5e7eb;border-radius:12px;background:white;color:#6b7280;font-weight:600;cursor:pointer;">Cancelar</button>
        <button onclick="confirmarEdicaoNo(${id})" style="flex:1;padding:12px;border:none;border-radius:12px;background:${no.cor};color:white;font-weight:600;cursor:pointer;">Salvar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => { const input = document.getElementById('inputEditarTitulo'); if (input) { input.focus(); input.select(); } }, 100);
}

// ===== TOGGLES =====
function obterIdNoEmEdicao() {
  const modal = document.getElementById('modalEdicaoNo');
  if (!modal) return null;
  const btnSalvar = modal.querySelector('button[onclick*="confirmarEdicaoNo"]');
  if (btnSalvar) {
    const match = btnSalvar.getAttribute('onclick').match(/confirmarEdicaoNo\((\d+)\)/);
    if (match) return parseInt(match[1]);
  }
  return null;
}

function toggleNegritoModal() {
  const no = mapaMentalNos.find(n => n.id === obterIdNoEmEdicao());
  if (no) no.negrito = !no.negrito;
}

function toggleItalicoModal() {
  const no = mapaMentalNos.find(n => n.id === obterIdNoEmEdicao());
  if (no) no.italico = !no.italico;
}

function toggleAlinhamentoModal() {
  const no = mapaMentalNos.find(n => n.id === obterIdNoEmEdicao());
  if (no) no.alinhamento = no.alinhamento === 'center' ? 'left' : no.alinhamento === 'left' ? 'right' : 'center';
}

// ===== CONFIRMAR EDIÇÃO =====
function confirmarEdicaoNo(id) {
  const titulo = document.getElementById('inputEditarTitulo').value.trim();
  const anotacoes = document.getElementById('inputEditarAnotacoes').value.trim();
  const cor = document.getElementById('inputEditarCor').value;

  if (!titulo) return;

  const no = mapaMentalNos.find(n => n.id === id);
  if (no) {
    no.titulo = titulo;
    no.anotacoes = anotacoes;
    no.cor = cor;

    const div = document.getElementById(`mapa-no-${id}`);
    if (div) {
      div.style.background = cor;
      div.innerHTML = `
        <div style="font-size: ${no.isCentral ? '1rem' : '0.85rem'}; font-weight: ${no.negrito ? '700' : '600'}; font-style: ${no.italico ? 'italic' : 'normal'}; text-align: ${no.alinhamento}; word-wrap: break-word;">${titulo}</div>
        ${anotacoes ? `<div style="font-size:0.7rem;opacity:0.8;margin-top:5px;">${anotacoes}</div>` : ''}
      `;
    }
    if (no.isCentral) { const ti = document.getElementById('mapaMentalTitulo'); if (ti) ti.value = titulo; }
    desenharConexoes();
  }
  fecharModalEdicaoNo();
  mostrarToast('✅ Tópico atualizado!', '#22c55e');
}

// ===== FECHAR MODAL EDIÇÃO =====
function fecharModalEdicaoNo() {
  const modal = document.getElementById('modalEdicaoNo');
  if (modal) modal.remove();
}

// ===== DELETAR NÓ =====
function deletarNo(id) {
  salvarEstadoHistorico();
  mapaMentalNos = mapaMentalNos.filter(no => no.id !== id);
  mapaMentalConexoes = mapaMentalConexoes.filter(con => con.de !== id && con.para !== id);
  const div = document.getElementById(`mapa-no-${id}`);
  if (div) div.remove();
  desenharConexoes();
}

// ===== ARRASTAR NÓ =====
function iniciarArrastarNo(e, id) {
  const div = document.getElementById(`mapa-no-${id}`);
  if (!div) return;
  e.preventDefault();
  e.stopPropagation();

  const container = document.getElementById('mapaMentalCanvasContainer');
  const rect = container.getBoundingClientRect();
  mapaMentalNoArrastando = id;
  mapaMentalOffsetX = e.clientX - rect.left - div.offsetLeft;
  mapaMentalOffsetY = e.clientY - rect.top - div.offsetTop;
  div.classList.add('dragging');

  document.onmousemove = function (e) {
    if (mapaMentalNoArrastando === null) return;
    const x = (e.clientX - rect.left - mapaMentalOffsetX) / mapaMentalZoom;
    const y = (e.clientY - rect.top - mapaMentalOffsetY) / mapaMentalZoom;
    const no = mapaMentalNos.find(n => n.id === mapaMentalNoArrastando);
    if (no) {
      no.x = x;
      no.y = y;
      div.style.left = x + 'px';
      div.style.top = y + 'px';
      requestAnimationFrame(desenharConexoes);
    }
  };

  document.onmouseup = function () {
    const div = document.getElementById(`mapa-no-${mapaMentalNoArrastando}`);
    if (div) div.classList.remove('dragging');
    mapaMentalNoArrastando = null;
    document.onmousemove = null;
    document.onmouseup = null;
    desenharConexoes();
  };
}

// ===== CONECTAR NÓS =====
function selecionarNoParaConectar(id, div) {
  salvarEstadoHistorico();
  document.querySelectorAll('.mapa-mental-no.selecionado').forEach(el => el.classList.remove('selecionado'));

  if (mapaMentalConectando === null) {
    mapaMentalConectando = id;
    div.classList.add('selecionado');
    mostrarToast('🔗 Clique em outro nó para conectar!', '#3b82f6');
  } else if (mapaMentalConectando === id) {
    mapaMentalConectando = null;
    div.classList.remove('selecionado');
  } else {
    const existe = mapaMentalConexoes.some(con => (con.de === mapaMentalConectando && con.para === id) || (con.de === id && con.para === mapaMentalConectando));
    if (!existe) {
      mapaMentalConexoes.push({ de: mapaMentalConectando, para: id });
      mostrarToast('✅ Conectado!', '#22c55e');
    }
    mapaMentalConectando = null;
    desenharConexoes();
  }
}

// ===== DESENHAR CONEXÕES =====
function desenharConexoes() {
  if (!mapaMentalCanvas || !mapaMentalCtx) return;
  const ctx = mapaMentalCtx;
  ctx.clearRect(0, 0, mapaMentalCanvas.width, mapaMentalCanvas.height);

  mapaMentalConexoes.forEach(conexao => {
    const de = mapaMentalNos.find(n => n.id === conexao.de);
    const para = mapaMentalNos.find(n => n.id === conexao.para);
    if (!de || !para) return;

    const x1 = de.x * mapaMentalZoom;
    const y1 = de.y * mapaMentalZoom;
    const x2 = para.x * mapaMentalZoom;
    const y2 = para.y * mapaMentalZoom;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const midX = (x1 + x2) / 2;
    ctx.bezierCurveTo(midX, y1, midX, y2, x2, y2);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  });
}

// ===== SALVAR / GALERIA =====
function salvarMapaMental() {
  const titulo = document.getElementById('mapaMentalTitulo').value.trim();
  if (!titulo) { mostrarToast('⚠️ Dê um nome!', '#f59e0b'); return; }
  if (mapaMentalNos.length === 0) { mostrarToast('⚠️ Adicione nós!', '#f59e0b'); return; }

  apiFetch("mapasmentais", {
    method: "POST",
    body: JSON.stringify({
      titulo: titulo,
      nos: mapaMentalNos.map(no => ({ ...no })),
      conexoes: mapaMentalConexoes
    })
  }).then(response => {
    if (response.ok) {
      carregarMapasMentaisServidor();
      mostrarToast('✅ Mapa salvo!', '#22c55e');
    } else {
      mostrarToast('❌ Erro ao salvar mapa', '#ef4444');
    }
  }).catch(err => {
    console.error(err);
    mostrarToast('❌ Erro ao salvar mapa', '#ef4444');
  });
}

function renderizarMapasSalvos() {
  const container = document.getElementById('listaMapasSalvos');
  if (!container) return;
  container.innerHTML = '';

  if (mapasMentaisSalvos.length === 0) {
    container.innerHTML = '<p style="color:#9ca3af;font-size:0.8rem;">Nenhum mapa salvo.</p>';
    return;
  }

  [...mapasMentaisSalvos].reverse().forEach(mapa => {
    const div = document.createElement('div');
    div.style.cssText = 'background:white;border-radius:10px;padding:10px;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;display:flex;align-items:center;gap:10px;min-width:150px;';
    const totalNos = mapa.nos ? mapa.nos.length : 0;
    div.innerHTML = `
      <i class="bi bi-diagram-3" style="color:var(--cor-primaria);"></i>
      <div style="flex:1;"><strong>${mapa.titulo}</strong><br><small>${totalNos} tópicos</small></div>
      <button onclick="event.stopPropagation();abrirMapaSalvo(${mapa.id_mapa})" style="background:#e0f2fe;color:#0284c7;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;">Abrir</button>
      <button onclick="event.stopPropagation();excluirMapaSalvo(${mapa.id_mapa})" style="background:#fee2e2;color:#dc2626;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;">🗑</button>
    `;
    div.onclick = () => abrirMapaSalvo(mapa.id_mapa);
    container.appendChild(div);
  });
}

function abrirMapaSalvo(id) {
  const mapa = mapasMentaisSalvos.find(m => m.id_mapa === id);
  if (!mapa) return;
  abrirMapaMental();
  setTimeout(() => {
    document.getElementById('mapaMentalTitulo').value = mapa.titulo;
    mapaMentalNos = [];
    mapaMentalConexoes = [];
    document.getElementById('mapaMentalNosContainer').innerHTML = '';
    const nosList = mapa.nos || [];
    nosList.forEach(no => { mapaMentalNos.push(no); renderizarNo(no); });
    mapaMentalConexoes = mapa.conexoes || [];
    desenharConexoes();
  }, 300);
}

function excluirMapaSalvo(id) {
  apiFetch(`mapasmentais/${id}`, {
    method: "DELETE"
  }).then(response => {
    if (response.ok) {
      carregarMapasMentaisServidor();
      mostrarToast('🗑️ Mapa excluído!', '#ef4444');
    } else {
      mostrarToast('❌ Erro ao excluir mapa', '#ef4444');
    }
  }).catch(err => {
    console.error(err);
    mostrarToast('❌ Erro ao excluir mapa', '#ef4444');
  });
}

// ===== LIMPAR / FECHAR =====
function limparMapa() {
  salvarEstadoHistorico();
  inicializarMapaMental();
  mostrarToast('🗑️ Mapa limpo!', '#ef4444');
}

function fecharMapaMental() {
  const modal = document.getElementById('mapaMentalModalOverlay');
  if (modal) modal.style.display = 'none';
}

// ===== EXPORTAR =====
window.abrirMapaMental = abrirMapaMental;
window.fecharMapaMental = fecharMapaMental;
window.adicionarNoCentral = adicionarNoCentral;
window.limparMapa = limparMapa;
window.salvarMapaMental = salvarMapaMental;
window.abrirMapaSalvo = abrirMapaSalvo;
window.excluirMapaSalvo = excluirMapaSalvo;
window.editarNo = editarNo;
window.confirmarEdicaoNo = confirmarEdicaoNo;
window.fecharModalEdicaoNo = fecharModalEdicaoNo;
window.toggleNegritoModal = toggleNegritoModal;
window.toggleItalicoModal = toggleItalicoModal;
window.toggleAlinhamentoModal = toggleAlinhamentoModal;
window.desfazerUltimaAcao = desfazerUltimaAcao;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.resetZoom = resetZoom;
window.mostrarToast = mostrarToast;

// =============================================
// ===== DIAGRAMA DE FLUXO - INDEPENDENTE =====
// =============================================

let diagramaFluxoNos = [];
let diagramaFluxoConexoes = [];
let diagramaFluxoIdCounter = 0;
let diagramaFluxoNoArrastando = null;
let diagramaFluxoConectando = null;
let diagramaFluxoOffsetX = 0;
let diagramaFluxoOffsetY = 0;
let diagramaFluxoCanvas = null;
let diagramaFluxoCtx = null;
let diagramaFluxoHistorico = [];
let diagramasFluxoSalvos = [];

// Cores automáticas por tipo
const coresFluxo = {
  inicio: '#22c55e',   // Verde
  processo: '#3b82f6', // Azul
  decisao: '#f59e0b',  // Amarelo
  fim: '#ef4444'       // Vermelho
};

// ===== CARREGAR DO SERVIDOR =====
async function carregarDiagramasFluxoServidor() {
  try {
    const response = await apiFetch("diagramasfluxo");
    if (response.ok) {
      diagramasFluxoSalvos = await response.json();
      renderizarDiagramasSalvos();
    }
  } catch (err) {
    console.error("Erro ao carregar diagramas de fluxo do servidor:", err);
  }
}

// ===== ABRIR DIAGRAMA DE FLUXO =====
function abrirDiagramaFluxo() {
  console.log('🔀 Abrindo Diagrama de Fluxo');
  if (typeof fecharMetodoModal === 'function') fecharMetodoModal();

  const modal = document.getElementById('diagramaFluxoModalOverlay');
  if (modal) {
    modal.style.display = 'flex';
    setTimeout(() => {
      inicializarDiagramaFluxo();
      carregarDiagramasFluxoServidor();
    }, 100);
  }
}

// ===== FECHAR DIAGRAMA DE FLUXO =====
function fecharDiagramaFluxo() {
  const modal = document.getElementById('diagramaFluxoModalOverlay');
  if (modal) modal.style.display = 'none';
}

// ===== INICIALIZAR =====
function inicializarDiagramaFluxo() {
  const container = document.getElementById('diagramaFluxoCanvasContainer');
  const canvas = document.getElementById('diagramaFluxoCanvas');
  if (!container || !canvas) return;

  setTimeout(() => {
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  }, 200);

  diagramaFluxoCanvas = canvas;
  diagramaFluxoCtx = canvas.getContext('2d');
  diagramaFluxoNos = [];
  diagramaFluxoConexoes = [];
  diagramaFluxoHistorico = [];

  const nosContainer = document.getElementById('diagramaFluxoNosContainer');
  if (nosContainer) nosContainer.innerHTML = '';

  const tituloInput = document.getElementById('diagramaFluxoTitulo');
  if (tituloInput) tituloInput.value = '';

  // Clique no canvas = adicionar processo
  container.onclick = function (e) {
    if (e.target === container || e.target === canvas || e.target.id === 'diagramaFluxoNosContainer') {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      adicionarNoFluxo('processo', x - 60, y - 25);
    }
  };
}

// ===== ADICIONAR NÓ =====
function adicionarNoFluxo(tipo, x, y) {
  const container = document.getElementById('diagramaFluxoCanvasContainer');
  const rect = container.getBoundingClientRect();

  // Posição padrão: centro do canvas com leve deslocamento
  const posX = x || (container.offsetWidth / 2) - 60 + (diagramaFluxoNos.length * 30);
  const posY = y || (container.offsetHeight / 2) - 25 + (diagramaFluxoNos.length * 20);

  const nomesPadrao = {
    inicio: 'Início',
    processo: 'Novo passo',
    decisao: 'Pergunta?',
    fim: 'Fim'
  };

  const no = {
    id: diagramaFluxoIdCounter++,
    x: posX,
    y: posY,
    titulo: nomesPadrao[tipo] || 'Passo',
    tipo: tipo,
    cor: coresFluxo[tipo] || '#3b82f6',
    labelSim: 'Sim',
    labelNao: 'Não'
  };

  diagramaFluxoNos.push(no);
  renderizarNoFluxo(no);
  return no;
}

// ===== RENDERIZAR NÓ =====
function renderizarNoFluxo(no) {
  const container = document.getElementById('diagramaFluxoNosContainer');
  if (!container) return;

  const div = document.createElement('div');
  div.id = `fluxo-no-${no.id}`;
  div.style.cssText = `
    position: absolute;
    left: ${no.x}px;
    top: ${no.y}px;
    background: ${no.cor};
    color: white;
    cursor: grab;
    user-select: none;
    font-weight: 600;
    font-size: 0.8rem;
    text-align: center;
    min-width: 80px;
    max-width: 160px;
    padding: 15px 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10;
    word-wrap: break-word;
    transition: box-shadow 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Formato baseado no tipo
  if (no.tipo === 'inicio' || no.tipo === 'fim') {
    div.style.borderRadius = '50%';
    div.style.padding = '25px 30px';
    div.style.minWidth = '100px';
    div.style.minHeight = '60px';
  } else if (no.tipo === 'decisao') {
    div.style.borderRadius = '0';
    div.style.transform = 'rotate(45deg)';
    div.style.padding = '20px';
    div.style.minWidth = '90px';
    div.style.minHeight = '90px';
  } else {
    div.style.borderRadius = '10px';
    div.style.padding = '15px 20px';
  }

  // Conteúdo (rotacionar de volta se for losango)
  const conteudo = document.createElement('span');
  conteudo.textContent = no.titulo;
  if (no.tipo === 'decisao') {
    conteudo.style.transform = 'rotate(-45deg)';
  }
  div.appendChild(conteudo);

  // Botão deletar
  const btnDeletar = document.createElement('button');
  btnDeletar.innerHTML = '×';
  btnDeletar.style.cssText = 'position:absolute;top:-10px;right:-10px;width:22px;height:22px;border-radius:50%;background:#ef4444;color:white;border:2px solid white;cursor:pointer;display:none;align-items:center;justify-content:center;font-size:0.8rem;font-weight:bold;z-index:20;';
  btnDeletar.onclick = function (e) { e.stopPropagation(); deletarNoFluxo(no.id); };
  div.appendChild(btnDeletar);

  div.onmouseenter = function () { btnDeletar.style.display = 'flex'; div.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'; };
  div.onmouseleave = function () { btnDeletar.style.display = 'none'; div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'; };

  // Eventos
  div.onmousedown = function (e) { if (e.target !== btnDeletar) iniciarArrastarNoFluxo(e, no.id); };
  div.ondblclick = function (e) { e.preventDefault(); e.stopPropagation(); editarNoFluxo(no.id); };
  div.onclick = function (e) { e.stopPropagation(); selecionarNoParaConectarFluxo(no.id, div); };

  container.appendChild(div);
}

// ===== EDITAR NÓ =====
function editarNoFluxo(id) {
  const no = diagramaFluxoNos.find(n => n.id === id);
  if (!no) return;

  const tipoLabel = {
    inicio: 'Início',
    processo: 'Processo',
    decisao: 'Decisão',
    fim: 'Fim'
  };

  Swal.fire({
    title: `Editar ${tipoLabel[no.tipo] || 'Nó'}`,
    html: `
      <label style="font-weight:600;display:block;margin-bottom:5px;text-align:left;">Título:</label>
      <input id="editFluxoTitulo" class="swal2-input" value="${no.titulo}">
      
      <label style="font-weight:600;display:block;margin:15px 0 5px;text-align:left;">Tipo:</label>
      <select id="editFluxoTipo" class="swal2-input">
        <option value="inicio" ${no.tipo === 'inicio' ? 'selected' : ''}>🟢 Início</option>
        <option value="processo" ${no.tipo === 'processo' ? 'selected' : ''}>🔵 Processo</option>
        <option value="decisao" ${no.tipo === 'decisao' ? 'selected' : ''}>🟡 Decisão</option>
        <option value="fim" ${no.tipo === 'fim' ? 'selected' : ''}>🔴 Fim</option>
      </select>
      
      ${no.tipo === 'decisao' ? `
        <label style="font-weight:600;display:block;margin:15px 0 5px;text-align:left;">Label "Sim":</label>
        <input id="editFluxoLabelSim" class="swal2-input" value="${no.labelSim || 'Sim'}">
        <label style="font-weight:600;display:block;margin:15px 0 5px;text-align:left;">Label "Não":</label>
        <input id="editFluxoLabelNao" class="swal2-input" value="${no.labelNao || 'Não'}">
      ` : ''}
    `,
    showCancelButton: true,
    confirmButtonText: 'Salvar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: no.cor,
    preConfirm: () => {
      const titulo = document.getElementById('editFluxoTitulo').value.trim();
      if (!titulo) {
        Swal.showValidationMessage('Digite um título!');
        return false;
      }
      return {
        titulo: titulo,
        tipo: document.getElementById('editFluxoTipo').value,
        labelSim: document.getElementById('editFluxoLabelSim')?.value || 'Sim',
        labelNao: document.getElementById('editFluxoLabelNao')?.value || 'Não'
      };
    }
  }).then(result => {
    if (result.isConfirmed) {
      no.titulo = result.value.titulo;
      no.tipo = result.value.tipo;
      no.labelSim = result.value.labelSim;
      no.labelNao = result.value.labelNao;
      no.cor = coresFluxo[no.tipo] || '#3b82f6';

      const div = document.getElementById(`fluxo-no-${no.id}`);
      if (div) div.remove();
      renderizarNoFluxo(no);
      desenharConexoesFluxo();
    }
  });
}

// ===== DELETAR NÓ =====
function deletarNoFluxo(id) {
  diagramaFluxoNos = diagramaFluxoNos.filter(no => no.id !== id);
  diagramaFluxoConexoes = diagramaFluxoConexoes.filter(con => con.de !== id && con.para !== id);
  const div = document.getElementById(`fluxo-no-${id}`);
  if (div) div.remove();
  desenharConexoesFluxo();
}

// ===== ARRASTAR NÓ =====
function iniciarArrastarNoFluxo(e, id) {
  const div = document.getElementById(`fluxo-no-${id}`);
  if (!div) return;
  e.preventDefault();
  e.stopPropagation();

  const container = document.getElementById('diagramaFluxoCanvasContainer');
  const rect = container.getBoundingClientRect();
  diagramaFluxoNoArrastando = id;
  diagramaFluxoOffsetX = e.clientX - rect.left - div.offsetLeft;
  diagramaFluxoOffsetY = e.clientY - rect.top - div.offsetTop;
  div.style.cursor = 'grabbing';

  document.onmousemove = function (e) {
    if (diagramaFluxoNoArrastando === null) return;
    const x = e.clientX - rect.left - diagramaFluxoOffsetX;
    const y = e.clientY - rect.top - diagramaFluxoOffsetY;
    const no = diagramaFluxoNos.find(n => n.id === diagramaFluxoNoArrastando);
    if (no) {
      no.x = x;
      no.y = y;
      div.style.left = x + 'px';
      div.style.top = y + 'px';
      requestAnimationFrame(desenharConexoesFluxo);
    }
  };

  document.onmouseup = function () {
    const div = document.getElementById(`fluxo-no-${diagramaFluxoNoArrastando}`);
    if (div) div.style.cursor = 'grab';
    diagramaFluxoNoArrastando = null;
    document.onmousemove = null;
    document.onmouseup = null;
    desenharConexoesFluxo();
  };
}

// ===== CONECTAR NÓS (com label) =====
function selecionarNoParaConectarFluxo(id, div) {
  document.querySelectorAll('#diagramaFluxoNosContainer > div.selecionado').forEach(el => el.style.outline = 'none');

  if (diagramaFluxoConectando === null) {
    diagramaFluxoConectando = id;
    div.style.outline = '3px solid #3b82f6';
    div.style.outlineOffset = '3px';
    mostrarToast('🔗 Clique em outro nó para conectar!', '#3b82f6');
  } else if (diagramaFluxoConectando === id) {
    diagramaFluxoConectando = null;
    div.style.outline = 'none';
  } else {
    const noOrigem = diagramaFluxoNos.find(n => n.id === diagramaFluxoConectando);
    const noDestino = diagramaFluxoNos.find(n => n.id === id);

    // Perguntar label da seta
    Swal.fire({
      title: 'Label da seta',
      text: `De "${noOrigem.titulo}" para "${noDestino.titulo}"`,
      input: 'text',
      inputValue: noOrigem.tipo === 'decisao' ? noOrigem.labelSim : '',
      inputPlaceholder: 'Ex: Sim, Não, Próximo passo...',
      showCancelButton: true,
      confirmButtonText: 'Conectar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3b82f6'
    }).then(result => {
      if (result.isConfirmed) {
        const existe = diagramaFluxoConexoes.some(con => con.de === diagramaFluxoConectando && con.para === id);
        if (!existe) {
          diagramaFluxoConexoes.push({
            de: diagramaFluxoConectando,
            para: id,
            label: result.value || ''
          });
          mostrarToast('✅ Conectado!', '#22c55e');
        }
        diagramaFluxoConectando = null;
        desenharConexoesFluxo();
      }
    });
  }
}

// ===== DESENHAR CONEXÕES COM SETAS E LABELS =====
function desenharConexoesFluxo() {
  if (!diagramaFluxoCanvas || !diagramaFluxoCtx) return;
  const ctx = diagramaFluxoCtx;
  ctx.clearRect(0, 0, diagramaFluxoCanvas.width, diagramaFluxoCanvas.height);

  diagramaFluxoConexoes.forEach(conexao => {
    const de = diagramaFluxoNos.find(n => n.id === conexao.de);
    const para = diagramaFluxoNos.find(n => n.id === conexao.para);
    if (!de || !para) return;

    const x1 = de.x + 60;
    const y1 = de.y + 30;
    const x2 = para.x + 60;
    const y2 = para.y + 30;

    // Linha
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Seta
    const angulo = Math.atan2(y2 - y1, x2 - x1);
    const tamanhoSeta = 12;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - tamanhoSeta * Math.cos(angulo - Math.PI / 6), y2 - tamanhoSeta * Math.sin(angulo - Math.PI / 6));
    ctx.lineTo(x2 - tamanhoSeta * Math.cos(angulo + Math.PI / 6), y2 - tamanhoSeta * Math.sin(angulo + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = '#232b36ff';
    ctx.fill();

    // Label
    if (conexao.label) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      ctx.font = 'bold 11px Poppins, sans-serif';
      ctx.fillStyle = '#1f2937';
      ctx.textAlign = 'center';

      // Fundo branco para o label
      const larguraTexto = ctx.measureText(conexao.label).width + 10;
      ctx.fillStyle = 'white';
      ctx.fillRect(midX - larguraTexto / 2, midY - 12, larguraTexto, 18);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.strokeRect(midX - larguraTexto / 2, midY - 12, larguraTexto, 18);

      // Texto
      ctx.fillStyle = '#1f2937';
      ctx.fillText(conexao.label, midX, midY + 1);
    }
  });
}

// ===== SALVAR DIAGRAMA =====
function salvarDiagramaFluxo() {
  const titulo = document.getElementById('diagramaFluxoTitulo').value.trim();
  if (!titulo) { mostrarToast('⚠️ Dê um nome!', '#f59e0b'); return; }
  if (diagramaFluxoNos.length === 0) { mostrarToast('⚠️ Adicione nós!', '#f59e0b'); return; }

  apiFetch("diagramasfluxo", {
    method: "POST",
    body: JSON.stringify({
      titulo: titulo,
      nos: diagramaFluxoNos.map(no => ({ ...no })),
      conexoes: diagramaFluxoConexoes
    })
  }).then(response => {
    if (response.ok) {
      carregarDiagramasFluxoServidor();
      mostrarToast('✅ Diagrama salvo!', '#22c55e');
    } else {
      mostrarToast('❌ Erro ao salvar diagrama', '#ef4444');
    }
  }).catch(err => {
    console.error(err);
    mostrarToast('❌ Erro ao salvar diagrama', '#ef4444');
  });
}

// ===== RENDERIZAR DIAGRAMAS SALVOS =====
function renderizarDiagramasSalvos() {
  const container = document.getElementById('listaDiagramasFluxoSalvos');
  if (!container) return;
  container.innerHTML = '';

  if (diagramasFluxoSalvos.length === 0) {
    container.innerHTML = '<p style="color:#9ca3af;font-size:0.8rem;">Nenhum diagrama salvo.</p>';
    return;
  }

  [...diagramasFluxoSalvos].reverse().forEach(diagrama => {
    const div = document.createElement('div');
    div.style.cssText = 'background:white;border-radius:10px;padding:10px;box-shadow:0 2px 8px rgba(0,0,0,0.08);cursor:pointer;display:flex;align-items:center;gap:10px;min-width:150px;';
    const totalNos = diagrama.nos ? diagrama.nos.length : 0;
    const totalConexoes = diagrama.conexoes ? diagrama.conexoes.length : 0;
    div.innerHTML = `
      <i class="bi bi-arrow-right-circle" style="color:#3b82f6;"></i>
      <div style="flex:1;">
        <strong>${diagrama.titulo}</strong><br>
        <small>${totalNos} nós • ${totalConexoes} conexões</small>
      </div>
      <button onclick="event.stopPropagation();abrirDiagramaSalvo(${diagrama.id_diagrama})" style="background:#e0f2fe;color:#0284c7;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;">Abrir</button>
      <button onclick="event.stopPropagation();excluirDiagramaSalvo(${diagrama.id_diagrama})" style="background:#fee2e2;color:#dc2626;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;">🗑</button>
    `;
    div.onclick = () => abrirDiagramaSalvo(diagrama.id_diagrama);
    container.appendChild(div);
  });
}

// ===== ABRIR DIAGRAMA SALVO =====
function abrirDiagramaSalvo(id) {
  const diagrama = diagramasFluxoSalvos.find(d => d.id_diagrama === id);
  if (!diagrama) return;

  abrirDiagramaFluxo();
  setTimeout(() => {
    document.getElementById('diagramaFluxoTitulo').value = diagrama.titulo;
    diagramaFluxoNos = [];
    diagramaFluxoConexoes = [];
    document.getElementById('diagramaFluxoNosContainer').innerHTML = '';
    const nosList = diagrama.nos || [];
    nosList.forEach(no => {
      diagramaFluxoNos.push(no);
      renderizarNoFluxo(no);
    });
    diagramaFluxoConexoes = diagrama.conexoes || [];
    desenharConexoesFluxo();
  }, 300);
}

// ===== EXCLUIR DIAGRAMA SALVO =====
function excluirDiagramaSalvo(id) {
  Swal.fire({
    title: 'Excluir diagrama?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444'
  }).then(result => {
    if (result.isConfirmed) {
      apiFetch(`diagramasfluxo/${id}`, {
        method: "DELETE"
      }).then(response => {
        if (response.ok) {
          carregarDiagramasFluxoServidor();
          mostrarToast('🗑️ Excluído!', '#ef4444');
        } else {
          mostrarToast('❌ Erro ao excluir diagrama', '#ef4444');
        }
      }).catch(err => {
        console.error(err);
        mostrarToast('❌ Erro ao excluir diagrama', '#ef4444');
      });
    }
  });
}

// ===== LIMPAR =====
function limparDiagramaFluxo() {
  Swal.fire({
    title: 'Limpar tudo?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, limpar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444'
  }).then(result => {
    if (result.isConfirmed) {
      inicializarDiagramaFluxo();
      mostrarToast('🗑️ Limpo!', '#ef4444');
    }
  });
}

// ===== EXPORTAR =====
window.abrirDiagramaFluxo = abrirDiagramaFluxo;
window.fecharDiagramaFluxo = fecharDiagramaFluxo;
window.adicionarNoFluxo = adicionarNoFluxo;
window.editarNoFluxo = editarNoFluxo;
window.deletarNoFluxo = deletarNoFluxo;
window.limparDiagramaFluxo = limparDiagramaFluxo;
window.salvarDiagramaFluxo = salvarDiagramaFluxo;
window.abrirDiagramaSalvo = abrirDiagramaSalvo;
window.excluirDiagramaSalvo = excluirDiagramaSalvo;

// ===== GRAVADOR DE ÁUDIO (Feynman + Podcast) - VERSÃO MODAL =====

let mediaRecorder = null;
let audioChunks = [];
let audioUrl = null;
let audioStream = null;
let gravando = false;
let pausado = false;
let segundosGravacao = 0;
let timerGravacao = null;

let gravacoesSalvas = [];

async function carregarGravacoesServidor() {
  try {
    const response = await apiFetch("gravacoesestudo");
    if (response.ok) {
      gravacoesSalvas = await response.json();
      gravacoesSalvas.forEach(g => g.id = g.id_gravacao);
      renderizarGravacoes();
    }
  } catch (err) {
    console.error("Erro ao carregar gravações do servidor:", err);
  }
}

// ===== FUNÇÃO GENÉRICA PARA ABRIR O GRAVADOR COMO MODAL =====
function abrirGravador(modo) {
  console.log('🎙️ Abrindo gravador modal no modo:', modo);

  // Salva o modo
  localStorage.setItem('modoGravadorAtivo', modo);

  // Fecha o modal de métodos (se estiver aberto)
  if (typeof fecharMetodoModal === 'function') {
    fecharMetodoModal();
  }

  // Mostra o modal do gravador
  const modal = document.getElementById('gravadorModalOverlay');
  if (modal) {
    modal.style.display = 'flex';

    // Atualiza o título
    const tituloGravador = document.getElementById('gravadorTitulo');
    if (tituloGravador) {
      if (modo === 'podcast') {
        tituloGravador.innerHTML = `
          <i class="bi bi-mic-fill" style="color: var(--cor-primaria);"></i>
          Gravação de Podcast
        `;
      } else {
        tituloGravador.innerHTML = `
          <i class="bi bi-mic-fill" style="color: var(--cor-primaria);"></i>
          Técnica Feynman - Grave sua Explicação
        `;
      }
    }

    // Limpa campos anteriores
    limparCamposGravador();

    // Renderiza as gravações salvas
    carregarGravacoesServidor();
  } else {
    console.error('❌ Modal do gravador não encontrado! Verifique o HTML.');
  }
}

// ===== FUNÇÃO PARA FECHAR O MODAL DO GRAVADOR =====
function fecharGravadorModal() {
  console.log('🔒 Fechando modal do gravador');

  // Para o timer imediatamente
  if (timerGravacao) {
    clearInterval(timerGravacao);
    timerGravacao = null;
  }

  // Para a gravação se estiver gravando
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      mediaRecorder.stop();
    } catch (e) {}
  }
  if (audioStream) {
    try {
      audioStream.getTracks().forEach(track => track.stop());
    } catch (e) {}
    audioStream = null;
  }

  gravando = false;
  pausado = false;

  // Reseta botões
  const btnGravar = document.getElementById('btnGravar');
  const btnPausar = document.getElementById('btnPausarAudio');
  const btnParar = document.getElementById('btnPararAudio');

  if (btnGravar) {
    btnGravar.disabled = false;
    btnGravar.style.opacity = '1';
  }
  if (btnPausar) {
    btnPausar.disabled = true;
    btnPausar.style.opacity = '0.5';
    btnPausar.innerHTML = '<i class="bi bi-pause-circle"></i> Pausar';
  }
  if (btnParar) {
    btnParar.disabled = true;
    btnParar.style.opacity = '0.5';
  }

  // Esconde o modal
  const modal = document.getElementById('gravadorModalOverlay');
  if (modal) {
    modal.style.display = 'none';
  }

  // Limpa campos
  limparCamposGravador();
}

// ===== FUNÇÃO PARA LIMPAR CAMPOS DO GRAVADOR =====
function limparCamposGravador() {
  if (timerGravacao) {
    clearInterval(timerGravacao);
    timerGravacao = null;
  }

  const checkPalavrasSimples = document.getElementById('checkPalavrasSimples');
  const checkAnalogias = document.getElementById('checkAnalogias');
  const checkLacunas = document.getElementById('checkLacunas');
  const checkSimplificado = document.getElementById('checkSimplificado');
  const anotacoesGravacao = document.getElementById('anotacoesGravacao');
  const tempoGravacao = document.getElementById('tempoGravacao');
  const audioGravadoArea = document.getElementById('audioGravadoArea');
  const nomeGravacao = document.getElementById('nomeGravacao');

  if (checkPalavrasSimples) checkPalavrasSimples.checked = false;
  if (checkAnalogias) checkAnalogias.checked = false;
  if (checkLacunas) checkLacunas.checked = false;
  if (checkSimplificado) checkSimplificado.checked = false;
  if (anotacoesGravacao) anotacoesGravacao.value = '';
  if (tempoGravacao) tempoGravacao.textContent = '00:00';
  if (audioGravadoArea) audioGravadoArea.style.display = 'none';
  if (nomeGravacao) nomeGravacao.value = '';

  const btnGravar = document.getElementById('btnGravar');
  const btnPausar = document.getElementById('btnPausarAudio');
  const btnParar = document.getElementById('btnPararAudio');

  if (btnGravar) {
    btnGravar.disabled = false;
    btnGravar.style.opacity = '1';
  }
  if (btnPausar) {
    btnPausar.disabled = true;
    btnPausar.style.opacity = '0.5';
    btnPausar.innerHTML = '<i class="bi bi-pause-circle"></i> Pausar';
  }
  if (btnParar) {
    btnParar.disabled = true;
    btnParar.style.opacity = '0.5';
  }

  audioUrl = null;
  segundosGravacao = 0;
  gravando = false;
  pausado = false;
}

// ===== FUNÇÕES ESPECÍFICAS =====
function abrirGravadorPodcast() {
  abrirGravador('podcast');
}

function abrirGravadorFeynman() {
  abrirGravador('feynman');
}

// ===== FUNÇÕES DE GRAVAÇÃO =====
async function iniciarGravacao() {
  console.log('🎤 Iniciando gravação...');

  if (timerGravacao) {
    clearInterval(timerGravacao);
    timerGravacao = null;
  }
  if (audioStream) {
    try {
      audioStream.getTracks().forEach(t => t.stop());
    } catch (e) {}
    audioStream = null;
  }

  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(audioStream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        audioChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      console.log('⏹️ Gravação parada (onstop)');

      if (timerGravacao) {
        clearInterval(timerGravacao);
        timerGravacao = null;
      }

      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        audioUrl = reader.result;

        const audioPlayer = document.getElementById('audioGravadoPlayer');
        const audioArea = document.getElementById('audioGravadoArea');
        if (audioPlayer && audioArea) {
          audioPlayer.src = audioUrl;
          audioArea.style.display = 'block';
        }
      };
      reader.readAsDataURL(audioBlob);

      const btnGravar = document.getElementById('btnGravar');
      const btnPausar = document.getElementById('btnPausarAudio');
      const btnParar = document.getElementById('btnPararAudio');

      if (btnGravar) {
        btnGravar.disabled = false;
        btnGravar.style.opacity = '1';
      }
      if (btnPausar) {
        btnPausar.disabled = true;
        btnPausar.style.opacity = '0.5';
        btnPausar.innerHTML = '<i class="bi bi-pause-circle"></i> Pausar';
      }
      if (btnParar) {
        btnParar.disabled = true;
        btnParar.style.opacity = '0.5';
      }

      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
      }
    };

    mediaRecorder.start(100);
    gravando = true;
    pausado = false;

    const btnGravar = document.getElementById('btnGravar');
    const btnPausar = document.getElementById('btnPausarAudio');
    const btnParar = document.getElementById('btnPararAudio');
    const tempoGravacao = document.getElementById('tempoGravacao');

    if (btnGravar) {
      btnGravar.disabled = true;
      btnGravar.style.opacity = '0.5';
    }
    if (btnPausar) {
      btnPausar.disabled = false;
      btnPausar.style.opacity = '1';
      btnPausar.innerHTML = '<i class="bi bi-pause-circle"></i> Pausar';
    }
    if (btnParar) {
      btnParar.disabled = false;
      btnParar.style.opacity = '1';
    }

    segundosGravacao = 0;
    if (tempoGravacao) tempoGravacao.textContent = '00:00';

    timerGravacao = setInterval(() => {
      segundosGravacao++;
      const min = String(Math.floor(segundosGravacao / 60)).padStart(2, '0');
      const seg = String(segundosGravacao % 60).padStart(2, '0');
      const tempoEl = document.getElementById('tempoGravacao');
      if (tempoEl) tempoEl.textContent = `${min}:${seg}`;
    }, 1000);

  } catch (err) {
    console.error('❌ Erro ao acessar microfone:', err);
    Swal.fire({
      icon: 'error',
      title: 'Erro!',
      text: 'Não foi possível acessar o microfone. Verifique as permissões do navegador.',
      confirmButtonColor: '#9f042c'
    });
  }
}

function pausarGravacao() {
  if (!mediaRecorder || !gravando) return;

  const btnPausar = document.getElementById('btnPausarAudio');

  if (!pausado) {
    try {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
      }
    } catch (e) {}
    pausado = true;
    if (timerGravacao) {
      clearInterval(timerGravacao);
      timerGravacao = null;
    }
    if (btnPausar) btnPausar.innerHTML = '<i class="bi bi-play-circle"></i> Continuar';
  } else {
    try {
      if (mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
      }
    } catch (e) {}
    pausado = false;
    if (timerGravacao) {
      clearInterval(timerGravacao);
      timerGravacao = null;
    }
    timerGravacao = setInterval(() => {
      segundosGravacao++;
      const min = String(Math.floor(segundosGravacao / 60)).padStart(2, '0');
      const seg = String(segundosGravacao % 60).padStart(2, '0');
      const tempoEl = document.getElementById('tempoGravacao');
      if (tempoEl) tempoEl.textContent = `${min}:${seg}`;
    }, 1000);
    if (btnPausar) btnPausar.innerHTML = '<i class="bi bi-pause-circle"></i> Pausar';
  }
}

function pararGravacao() {
  console.log('⏹️ Botão Parar clicado');

  // Para o timer imediatamente
  if (timerGravacao) {
    clearInterval(timerGravacao);
    timerGravacao = null;
  }

  gravando = false;
  pausado = false;

  const btnGravar = document.getElementById('btnGravar');
  const btnPausar = document.getElementById('btnPausarAudio');
  const btnParar = document.getElementById('btnPararAudio');

  if (btnGravar) {
    btnGravar.disabled = false;
    btnGravar.style.opacity = '1';
  }
  if (btnPausar) {
    btnPausar.disabled = true;
    btnPausar.style.opacity = '0.5';
    btnPausar.innerHTML = '<i class="bi bi-pause-circle"></i> Pausar';
  }
  if (btnParar) {
    btnParar.disabled = true;
    btnParar.style.opacity = '0.5';
  }

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      mediaRecorder.stop();
    } catch (e) {}
  }
}

function salvarGravacao() {
  if (!audioUrl) {
    Swal.fire({
      icon: 'warning',
      title: 'Atenção!',
      text: 'Grave um áudio primeiro!',
      timer: 1500,
      showConfirmButton: false
    });
    return;
  }

  const modoAtivo = localStorage.getItem('modoGravadorAtivo') || 'feynman';
  const nomeGravacao = document.getElementById('nomeGravacao').value.trim();

  apiFetch("gravacoesestudo", {
    method: "POST",
    body: JSON.stringify({
      data: new Date().toISOString(),
      url: audioUrl,
      modo: modoAtivo,
      nome: nomeGravacao || `Gravação ${modoAtivo === 'podcast' ? 'Podcast' : 'Feynman'} ${new Date().toLocaleDateString('pt-BR')}`,
      checkPalavrasSimples: document.getElementById('checkPalavrasSimples')?.checked ? 1 : 0,
      checkAnalogias: document.getElementById('checkAnalogias')?.checked ? 1 : 0,
      checkLacunas: document.getElementById('checkLacunas')?.checked ? 1 : 0,
      checkSimplificado: document.getElementById('checkSimplificado')?.checked ? 1 : 0,
      anotacoes: document.getElementById('anotacoesGravacao')?.value || '',
      duracao: segundosGravacao
    })
  }).then(response => {
    if (response.ok) {
      carregarGravacoesServidor();
      limparCamposGravador();
      Swal.fire({
        icon: 'success',
        title: 'Gravação salva!',
        text: 'Sua gravação foi salva com sucesso.',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      mostrarToast('❌ Erro ao salvar gravação', '#ef4444');
    }
  }).catch(err => {
    console.error(err);
    mostrarToast('❌ Erro ao salvar gravação', '#ef4444');
  });
}

function renderizarGravacoes() {
  const container = document.getElementById('listaGravacoes');
  if (!container) return;

  container.innerHTML = '';

  if (gravacoesSalvas.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #9ca3af;">Nenhuma gravação ainda.</p>';
    return;
  }

  const ordenadas = [...gravacoesSalvas].reverse();

  ordenadas.forEach(grav => {
    const data = new Date(grav.data);
    const dataFormatada = data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const modoIcone = grav.modo === 'podcast' ? '🎙️' : '📝';
    const modoNome = grav.modo === 'podcast' ? 'Podcast' : 'Feynman';
    const nomeExibicao = grav.nome || 'Gravação sem nome';

    // Formata a duração
    const minutos = Math.floor(grav.duracao / 60);
    const segundos = grav.duracao % 60;
    const duracaoFormatada = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

    const div = document.createElement('div');
    div.className = 'gravacao-item';

    const checkboxes = [];
    if (grav.checkPalavrasSimples) checkboxes.push('✅ Palavras simples');
    if (grav.checkAnalogias) checkboxes.push('✅ Analogias');
    if (grav.checkLacunas) checkboxes.push('✅ Lacunas');
    if (grav.checkSimplificado) checkboxes.push('✅ Simplificado');

    div.innerHTML = `
      <div class="gravacao-info">
        <div style="flex: 1;">
          <strong style="display: block; font-size: 0.95rem; color: #374151; margin-bottom: 4px;">
            ${nomeExibicao}
          </strong>
          <span class="gravacao-data">
            ${modoIcone} ${modoNome} | ${dataFormatada} | ⏱ ${duracaoFormatada}
          </span>
        </div>
        <div style="display: flex; gap: 5px;">
          <button class="btn-editar-gravacao" onclick="editarGravacao(${grav.id})" 
                  title="Editar">
            ✏️
          </button>
          <button class="btn-excluir-gravacao" onclick="excluirGravacao(${grav.id})" 
                  title="Excluir">
            🗑
          </button>
        </div>
      </div>
      <audio controls src="${grav.url}" style="width: 100%; margin: 10px 0;"></audio>
      ${checkboxes.length > 0 ? `<div class="gravacao-checkboxes">${checkboxes.join(' | ')}</div>` : ''}
      ${grav.anotacoes ? `
        <div class="gravacao-anotacoes" style="background: #f9fafb; padding: 10px; border-radius: 8px; margin-top: 8px;">
          <p style="font-size: 0.8rem; color: #6b7280; margin: 0;">
            <strong>📝 Anotações:</strong> ${grav.anotacoes}
          </p>
        </div>
      ` : ''}
    `;

    container.appendChild(div);
  });
}

function excluirGravacao(id) {
  apiFetch(`gravacoesestudo/${id}`, {
    method: "DELETE"
  }).then(response => {
    if (response.ok) {
      carregarGravacoesServidor();
      Swal.fire({
        icon: 'success',
        title: 'Excluída!',
        timer: 1000,
        showConfirmButton: false
      });
    } else {
      mostrarToast('❌ Erro ao excluir gravação', '#ef4444');
    }
  }).catch(err => {
    console.error(err);
    mostrarToast('❌ Erro ao excluir gravação', '#ef4444');
  });
}

// ===== EXPOR FUNÇÕES GLOBALMENTE =====
window.abrirGravador = abrirGravador;
window.abrirGravadorPodcast = abrirGravadorPodcast;
window.abrirGravadorFeynman = abrirGravadorFeynman;
window.fecharGravadorModal = fecharGravadorModal;
window.iniciarGravacao = iniciarGravacao;
window.pausarGravacao = pausarGravacao;
window.pararGravacao = pararGravacao;
window.salvarGravacao = salvarGravacao;
window.excluirGravacao = excluirGravacao;
window.editarGravacao = editarGravacao;

// ===== INICIALIZAR =====
document.addEventListener('DOMContentLoaded', function () {
  console.log('🎙️ Gravador modal inicializado!');
});

// =============================================
// ===== REDEFINIÇÃO FORÇADA DO GRAVADOR =====
// =============================================
console.log('🔄 Aplicando correção final do gravador...');

// Sobrescreve TODAS as funções anteriores
window.abrirGravador = function (modo) {
  console.log('🎙️ [FINAL] Abrindo gravador:', modo);

  // Salva o modo
  localStorage.setItem('modoGravadorAtivo', modo);

  // Fecha o modal de métodos
  const metodoModal = document.getElementById('metodoModalOverlay');
  if (metodoModal) {
    metodoModal.style.display = 'none';
  }

  // Mostra o modal do gravador
  const gravadorModal = document.getElementById('gravadorModalOverlay');
  if (gravadorModal) {
    gravadorModal.style.display = 'flex';

    // Atualiza título
    const titulo = document.getElementById('gravadorTitulo');
    if (titulo) {
      if (modo === 'podcast') {
        titulo.innerHTML = '<i class="bi bi-mic-fill" style="color: var(--cor-primaria);"></i> Gravação de Podcast';
      } else {
        titulo.innerHTML = '<i class="bi bi-mic-fill" style="color: var(--cor-primaria);"></i> Técnica Feynman - Grave sua Explicação';
      }
    }

    // Limpa campos
    const checkboxes = ['checkPalavrasSimples', 'checkAnalogias', 'checkLacunas', 'checkSimplificado'];
    checkboxes.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });

    const anotacoes = document.getElementById('anotacoesGravacao');
    if (anotacoes) anotacoes.value = '';

    const tempo = document.getElementById('tempoGravacao');
    if (tempo) tempo.textContent = '00:00';

    const audioArea = document.getElementById('audioGravadoArea');
    if (audioArea) audioArea.style.display = 'none';

    // Renderiza gravações
    if (typeof renderizarGravacoes === 'function') {
      renderizarGravacoes();
    }
  } else {
    console.error('❌ Modal do gravador NÃO encontrado no HTML!');
    alert('Erro: Modal do gravador não encontrado. Verifique se o HTML está correto.');
  }
};

window.abrirGravadorPodcast = function () {
  console.log('🎙️ [FINAL] Abrindo Podcast');
  window.abrirGravador('podcast');
};

window.abrirGravadorFeynman = function () {
  console.log('📝 [FINAL] Abrindo Feynman');
  window.abrirGravador('feynman');
};

window.fecharGravadorModal = function () {
  console.log('🔒 [FINAL] Fechando gravador');

  // Para gravação se estiver ativa
  if (typeof gravando !== 'undefined' && gravando && typeof mediaRecorder !== 'undefined' && mediaRecorder) {
    try {
      mediaRecorder.stop();
    } catch (e) { }
    gravando = false;
    pausado = false;
    clearInterval(timerGravacao);
  }

  // Esconde modal
  const modal = document.getElementById('gravadorModalOverlay');
  if (modal) {
    modal.style.display = 'none';
  }

  // Reseta botões
  const btnGravar = document.getElementById('btnGravar');
  const btnPausar = document.getElementById('btnPausarAudio');
  const btnParar = document.getElementById('btnPararAudio');

  if (btnGravar) btnGravar.disabled = false;
  if (btnPausar) {
    btnPausar.disabled = true;
    btnPausar.innerHTML = '<i class="bi bi-pause-circle"></i> Pausar';
  }
  if (btnParar) btnParar.disabled = true;
};

console.log('✅ Correção final aplicada!');

// =============================================
// ===== CORREÇÃO FINAL DOS MÉTODOS ============
// =============================================
console.log('🔄 Aplicando correção final dos métodos...');

// Verifica se metodosPorInteligencia existe
if (typeof metodosPorInteligencia === 'undefined') {
  console.error('❌ metodosPorInteligencia NÃO encontrado!');
} else {
  console.log('✅ metodosPorInteligencia encontrado com', Object.keys(metodosPorInteligencia).length, 'inteligências');
}

// Redefine a função renderizarMetodosEstudo
window.renderizarMetodosEstudo = function () {
  console.log('🎨 Renderizando métodos de estudo...');

  let tipoInteligencia = sessionStorage.getItem('inteligenciaUsuario') || localStorage.getItem('inteligenciaUsuario');
  console.log('📌 Inteligência salva:', tipoInteligencia);

  if (!tipoInteligencia || !metodosPorInteligencia[tipoInteligencia]) {
    const user = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}");
    if (user.tipo_dom) {
      tipoInteligencia = normalizarInteligencia(user.tipo_dom);
      console.log('📌 Inteligência do usuário:', tipoInteligencia);
    }
  }

  if (!tipoInteligencia || !metodosPorInteligencia[tipoInteligencia]) {
    tipoInteligencia = 'logico';
    console.log('📌 Usando inteligência padrão: logico');
  }

  const metodosData = metodosPorInteligencia[tipoInteligencia];
  console.log('📌 Dados da inteligência:', metodosData.nome, '| Cor:', metodosData.cor);

  document.documentElement.style.setProperty('--cor-primaria', metodosData.cor);

  const badgeNome = document.getElementById("inteligenciaBadgeNome");
  const badgeIcon = document.getElementById("inteligenciaBadgeIcon");
  const badgeDiv = document.getElementById("inteligenciaBadge");
  const badgeDescricao = document.getElementById("inteligenciaBadgeDescricao");

  if (badgeNome) badgeNome.textContent = `Inteligência ${metodosData.nome}`;
  if (badgeIcon) badgeIcon.src = iconesInteligencia[tipoInteligencia] || "Icones/logico.png";
  if (badgeDiv) badgeDiv.style.background = metodosData.cor;
  if (badgeDescricao) badgeDescricao.textContent = metodosData.descricao;

  const containerRecomendados = document.getElementById("listaMetodosRecomendados");
  if (containerRecomendados) {
    containerRecomendados.innerHTML = "";

    metodosData.metodos.forEach(metodo => {
      console.log('📌 Adicionando método:', metodo.titulo);

      containerRecomendados.innerHTML += `
        <div class="metodo-card" onclick="window.verDetalhesMetodo('${tipoInteligencia}', ${metodo.id})">
          <div class="metodo-card-header">
            <h3>${metodo.titulo}</h3>
            <div class="metodo-tags">
              <span class="tag-tempo">
                <i class="bi bi-clock"></i> ${metodo.tempo}
              </span>
              <span class="tag-dificuldade ${metodo.dificuldade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}">
                ${metodo.dificuldade}
              </span>
            </div>
          </div>
          <p class="metodo-descricao">${metodo.descricao}</p>
          <button class="btn-ver-mais" style="color: ${metodosData.cor}">
            Ver método completo <i class="bi bi-arrow-right"></i>
          </button>
        </div>
      `;
    });

    console.log('✅ Métodos renderizados:', metodosData.metodos.length);
  } else {
    console.error('❌ Container de métodos não encontrado!');
  }
};

// Chama a função imediatamente
setTimeout(() => {
  renderizarMetodosEstudo();
}, 500);

console.log('✅ Correção dos métodos aplicada!');

// ===== FUNÇÃO PARA EDITAR GRAVAÇÃO =====
function editarGravacao(id) {
  console.log('✏️ Editando gravação:', id);

  const gravacao = gravacoesSalvas.find(g => g.id === id);
  if (!gravacao) return;

  Swal.fire({
    title: 'Editar Gravação',
    html: `
      <div style="text-align: left;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #4b5563;">
          <i class="bi bi-tag"></i> Nome:
        </label>
        <input id="swalNomeGravacao" class="swal2-input" 
               value="${gravacao.nome || ''}" 
               placeholder="Nome da gravação">
        
        <label style="display: block; margin-bottom: 8px; margin-top: 15px; font-weight: 600; color: #4b5563;">
          <i class="bi bi-pencil"></i> Anotações:
        </label>
        <textarea id="swalAnotacoesGravacao" class="swal2-textarea" 
                  placeholder="Suas anotações..." 
                  style="height: 120px;">${gravacao.anotacoes || ''}</textarea>
        
        <div style="margin-top: 15px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #4b5563;">
            <i class="bi bi-clipboard-check"></i> Autoavaliação:
          </label>
          
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="swalCheckPalavras" ${gravacao.checkPalavrasSimples ? 'checked' : ''}>
              <span>Expliquei com palavras simples?</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="swalCheckAnalogias" ${gravacao.checkAnalogias ? 'checked' : ''}>
              <span>Usei analogias ou exemplos?</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="swalCheckLacunas" ${gravacao.checkLacunas ? 'checked' : ''}>
              <span>Identifiquei lacunas no entendimento?</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="swalCheckSimplificado" ${gravacao.checkSimplificado ? 'checked' : ''}>
              <span>Consegui simplificar o conceito?</span>
            </label>
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-save"></i> Salvar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#22c55e',
    cancelButtonColor: '#6b7280',
    preConfirm: () => {
      const nome = document.getElementById('swalNomeGravacao').value.trim();
      const anotacoes = document.getElementById('swalAnotacoesGravacao').value;
      const checkPalavras = document.getElementById('swalCheckPalavras').checked;
      const checkAnalogias = document.getElementById('swalCheckAnalogias').checked;
      const checkLacunas = document.getElementById('swalCheckLacunas').checked;
      const checkSimplificado = document.getElementById('swalCheckSimplificado').checked;

      if (!nome) {
        Swal.showValidationMessage('Dê um nome para a gravação!');
        return false;
      }

      return {
        nome: nome,
        anotacoes: anotacoes,
        checkPalavrasSimples: checkPalavras,
        checkAnalogias: checkAnalogias,
        checkLacunas: checkLacunas,
        checkSimplificado: checkSimplificado
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      apiFetch(`gravacoesestudo/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          nome: result.value.nome,
          anotacoes: result.value.anotacoes,
          checkPalavrasSimples: result.value.checkPalavrasSimples ? 1 : 0,
          checkAnalogias: result.value.checkAnalogias ? 1 : 0,
          checkLacunas: result.value.checkLacunas ? 1 : 0,
          checkSimplificado: result.value.checkSimplificado ? 1 : 0
        })
      }).then(response => {
        if (response.ok) {
          gravacao.nome = result.value.nome;
          gravacao.anotacoes = result.value.anotacoes;
          gravacao.checkPalavrasSimples = result.value.checkPalavrasSimples;
          gravacao.checkAnalogias = result.value.checkAnalogias;
          gravacao.checkLacunas = result.value.checkLacunas;
          gravacao.checkSimplificado = result.value.checkSimplificado;
          renderizarGravacoes();
          Swal.fire({
            icon: 'success',
            title: 'Atualizada!',
            text: 'Gravação atualizada com sucesso.',
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          mostrarToast('❌ Erro ao atualizar gravação', '#ef4444');
        }
      }).catch(err => {
        console.error(err);
        mostrarToast('❌ Erro ao atualizar gravação', '#ef4444');
      });
    }
  });
}

// =============================================
// ===== BIBLIOTECA DE VÍDEOS =================
// =============================================

let bibliotecaVideos = [];

async function carregarVideosServidor() {
  try {
    const response = await apiFetch("bibliotecavideos");
    if (response.ok) {
      bibliotecaVideos = await response.json();
      bibliotecaVideos.forEach(v => v.id = v.id_video);
      renderizarBibliotecaVideos();
    }
  } catch (err) {
    console.error("Erro ao carregar vídeos do servidor:", err);
  }
}

// ===== ABRIR BIBLIOTECA =====
function abrirBibliotecaVideos() {
  console.log('🎬 Abrindo Biblioteca de Vídeos');

  if (typeof fecharMetodoModal === 'function') {
    fecharMetodoModal();
  }

  const modal = document.getElementById('bibliotecaVideosModalOverlay');
  if (modal) {
    modal.style.display = 'flex';
    popularFiltroMateriasVideos();
    carregarVideosServidor();
  }
}

// ===== FECHAR BIBLIOTECA =====
function fecharBibliotecaVideos() {
  const modal = document.getElementById('bibliotecaVideosModalOverlay');
  if (modal) {
    modal.style.display = 'none';
  }
}

// ===== ABRIR MODAL ADICIONAR =====
function abrirModalAdicionarVideo() {
  const modal = document.getElementById('modalAdicionarVideoOverlay');
  if (modal) {
    modal.style.display = 'flex';
    popularSelectMateriasVideos();

    // Limpa campos
    document.getElementById('videoTitulo').value = '';
    document.getElementById('videoUrl').value = '';
    document.getElementById('videoTema').value = '';
    document.getElementById('videoAnotacoes').value = '';
    document.getElementById('videoThumbnailPreview').style.display = 'none';
    document.getElementById('novaMateriaVideo').value = '';
    document.getElementById('campoNovaMateriaVideo').style.display = 'none';
    document.getElementById('videoMateria').value = '';
  }
}

// ===== FECHAR MODAL ADICIONAR =====
function fecharModalAdicionarVideo() {
  const modal = document.getElementById('modalAdicionarVideoOverlay');
  if (modal) {
    modal.style.display = 'none';
  }
}

// ===== POPULAR FILTRO =====
function popularFiltroMateriasVideos() {
  const select = document.getElementById('filtroMateriaVideos');
  if (!select) return;
  const materiasUnicas = [...new Set(bibliotecaVideos.map(v => v.materia).filter(Boolean))];
  select.innerHTML = '<option value="todas">Todas as matérias</option>';
  materiasUnicas.forEach(materia => {
    select.innerHTML += `<option value="${materia}">${materia}</option>`;
  });
}

// ===== POPULAR SELECT DE MATÉRIAS (ADICIONAR) =====
function popularSelectMateriasVideos() {
  const select = document.getElementById('videoMateria');
  if (!select) return;

  const materiasSistema = (typeof materias !== 'undefined' && Array.isArray(materias)) ? materias : [];

  select.innerHTML = '<option value="">Selecione uma matéria</option>';

  materiasSistema.forEach(materia => {
    select.innerHTML += `<option value="${materia.nome}">${materia.nome}</option>`;
  });

  // Adiciona opção "Nova matéria"
  select.innerHTML += '<option value="__nova__">➕ Nova matéria...</option>';

  // Evento para mostrar campo de nova matéria
  select.onchange = function () {
    const campoNovaMateria = document.getElementById('campoNovaMateriaVideo');

    if (select.value === '__nova__') {
      if (campoNovaMateria) {
        campoNovaMateria.style.display = 'block';
      }
    } else {
      if (campoNovaMateria) {
        campoNovaMateria.style.display = 'none';
      }
    }
  };
}
// ===== EXTRAIR ID YOUTUBE =====
function extrairYouTubeId(url) {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// ===== CARREGAR THUMBNAIL =====
function carregarThumbnailPreview() {
  const url = document.getElementById('videoUrl').value;
  const videoId = extrairYouTubeId(url);
  if (videoId) {
    const preview = document.getElementById('videoThumbnailPreview');
    const img = document.getElementById('videoThumbnailImg');
    img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    preview.style.display = 'block';
  }
}

// ===== SALVAR VÍDEO =====
function salvarVideo() {
  let materia = document.getElementById('videoMateria').value;
  const titulo = document.getElementById('videoTitulo').value.trim();
  const url = document.getElementById('videoUrl').value.trim();
  const tema = document.getElementById('videoTema').value.trim();
  const anotacoes = document.getElementById('videoAnotacoes').value.trim();

  // Verifica se é nova matéria
  if (materia === '__nova__') {
    const novaMateriaNome = document.getElementById('novaMateriaVideo').value.trim();

    if (!novaMateriaNome) {
      mostrarToast('⚠️ Digite o nome da nova matéria!', '#f59e0b');
      return;
    }

    materia = novaMateriaNome;

    // Salva a nova matéria no sistema
    salvarNovaMateriaNoSistema(novaMateriaNome);
  }

  if (!materia) { mostrarToast('⚠️ Selecione a matéria!', '#f59e0b'); return; }
  if (!titulo) { mostrarToast('⚠️ Digite o título!', '#f59e0b'); return; }
  if (!url || !extrairYouTubeId(url)) { mostrarToast('⚠️ Link inválido!', '#ef4444'); return; }

  const videoId = extrairYouTubeId(url);

  apiFetch("bibliotecavideos", {
    method: "POST",
    body: JSON.stringify({
      materia: materia,
      titulo: titulo,
      url: url,
      videoId: videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      tema: tema || 'Geral',
      anotacoes: anotacoes,
      assistido: false,
      nota: 0,
      dataAdicionado: new Date().toISOString()
    })
  }).then(response => {
    if (response.ok) {
      fecharModalAdicionarVideo();
      carregarVideosServidor();
      mostrarToast('✅ Vídeo adicionado!', '#22c55e');
    } else {
      mostrarToast('❌ Erro ao adicionar vídeo', '#ef4444');
    }
  }).catch(err => {
    console.error(err);
    mostrarToast('❌ Erro ao adicionar vídeo', '#ef4444');
  });
}

// ===== SALVAR NOVA MATÉRIA NO SISTEMA =====
function salvarNovaMateriaNoSistema(nomeMateria) {
  const materiaExiste = (typeof materias !== 'undefined' && materias) ? materias.some(m => m.nome.toLowerCase() === nomeMateria.toLowerCase()) : false;

  if (!materiaExiste) {
    const corAleatoria = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    apiFetch('materias', {
      method: 'POST',
      body: JSON.stringify({
        nome: nomeMateria,
        cor: corAleatoria
      })
    }).then(async response => {
      if (response.ok) {
        const data = await response.json();
        const novaMat = {
          id: data.id_materia ? data.id_materia.toString() : Date.now().toString(),
          nome: nomeMateria,
          cor: corAleatoria
        };
        if (typeof materias !== 'undefined') materias.push(novaMat);
        popularSelectMateriasVideos();
        if (typeof renderMaterias === 'function') renderMaterias();
        if (typeof renderTabelaMaterias === 'function') renderTabelaMaterias();
      }
    }).catch(err => {
      console.error('Erro ao salvar nova matéria:', err);
    });
  }
}

// ===== RENDERIZAR =====
function renderizarBibliotecaVideos() {
  const container = document.getElementById('listaVideosEstudo');
  if (!container) return;

  const filtroMateria = document.getElementById('filtroMateriaVideos')?.value || 'todas';
  const filtroStatus = document.getElementById('filtroStatusVideos')?.value || 'todos';
  const busca = document.getElementById('buscaVideos')?.value.toLowerCase() || '';

  let videosFiltrados = [...bibliotecaVideos];

  if (filtroMateria !== 'todas') {
    videosFiltrados = videosFiltrados.filter(v => v.materia === filtroMateria);
  }
  if (filtroStatus === 'assistidos') {
    videosFiltrados = videosFiltrados.filter(v => v.assistido);
  } else if (filtroStatus === 'nao_assistidos') {
    videosFiltrados = videosFiltrados.filter(v => !v.assistido);
  }
  if (busca) {
    videosFiltrados = videosFiltrados.filter(v =>
      v.titulo.toLowerCase().includes(busca) ||
      v.tema.toLowerCase().includes(busca) ||
      v.anotacoes.toLowerCase().includes(busca)
    );
  }

  container.innerHTML = '';

  if (videosFiltrados.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #9ca3af;">
        <i class="bi bi-collection-play" style="font-size: 3rem; display: block; margin-bottom: 15px;"></i>
        <p>Nenhum vídeo encontrado.</p>
        <p style="font-size: 0.8rem;">Clique em "Adicionar Vídeo" para começar!</p>
      </div>
    `;
    return;
  }

  const grupos = {};
  videosFiltrados.forEach(video => {
    if (!grupos[video.materia]) grupos[video.materia] = [];
    grupos[video.materia].push(video);
  });

  Object.keys(grupos).forEach(materia => {
    const grupoDiv = document.createElement('div');
    grupoDiv.style.marginBottom = '30px';
    grupoDiv.innerHTML = `
      <h3 style="color: #374151; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
        <i class="bi bi-book" style="color: var(--cor-primaria);"></i>
        ${materia}
        <span style="font-size: 0.7rem; color: #9ca3af; font-weight: normal;">(${grupos[materia].length} vídeos)</span>
      </h3>
    `;

    const videosGrid = document.createElement('div');
    videosGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;';

    grupos[materia].forEach(video => {
      videosGrid.appendChild(criarCardVideo(video));
    });

    grupoDiv.appendChild(videosGrid);
    container.appendChild(grupoDiv);
  });
}

// ===== CARD DO VÍDEO =====
function criarCardVideo(video) {
  const card = document.createElement('div');
  card.style.cssText = 'background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08); transition: 0.2s; cursor: pointer;';
  card.onmouseover = () => { card.style.transform = 'translateY(-5px)'; card.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'; };
  card.onmouseout = () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)'; };

  const estrelas = '⭐'.repeat(video.nota) + '☆'.repeat(5 - video.nota);

  card.innerHTML = `
    <div style="position: relative;">
      <img src="${video.thumbnail}" alt="${video.titulo}" style="width: 100%; height: 160px; object-fit: cover; cursor: pointer;" onclick="abrirVideoEstudo('${video.url}')">
      ${video.assistido ? `<div style="position: absolute; top: 10px; right: 10px; background: #22c55e; color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600;">✓ Assistido</div>` : ''}
      <div style="position: absolute; top: 10px; left: 10px; background: #3b82f6; color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600;">${video.tema}</div>
    </div>
    <div style="padding: 15px;">
      <h4 style="margin: 0 0 8px; font-size: 0.9rem; color: #374151; cursor: pointer;" onclick="abrirVideoEstudo('${video.url}')">${video.titulo}</h4>
      <div style="font-size: 0.8rem; color: #f59e0b; margin-bottom: 8px;">${estrelas}</div>
      ${video.anotacoes ? `<p style="font-size: 0.75rem; color: #6b7280; margin: 0 0 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${video.anotacoes}</p>` : ''}
      <div style="display: flex; gap: 5px; flex-wrap: wrap;">
        <button onclick="event.stopPropagation(); abrirVideoEstudo('${video.url}')" style="flex: 1; padding: 8px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.75rem; font-weight: 600;">
          <i class="bi bi-play-fill"></i> Assistir
        </button>
        <button onclick="event.stopPropagation(); alternarAssistido(${video.id})" style="padding: 8px; background: ${video.assistido ? '#22c55e' : '#f3f4f6'}; color: ${video.assistido ? 'white' : '#6b7280'}; border: none; border-radius: 8px; cursor: pointer; font-size: 0.75rem;">✓</button>
        <button onclick="event.stopPropagation(); editarVideo(${video.id})" style="padding: 8px; background: #e0f2fe; color: #0284c7; border: none; border-radius: 8px; cursor: pointer; font-size: 0.75rem;">✏️</button>
        <button onclick="event.stopPropagation(); avaliarVideo(${video.id})" style="padding: 8px; background: #fef3c7; color: #d97706; border: none; border-radius: 8px; cursor: pointer; font-size: 0.75rem;">⭐</button>
        <button onclick="event.stopPropagation(); excluirVideo(${video.id})" style="padding: 8px; background: #fee2e2; color: #dc2626; border: none; border-radius: 8px; cursor: pointer; font-size: 0.75rem;">🗑</button>
      </div>
    </div>
  `;

  return card;
}

// ===== AÇÕES =====
function abrirVideoEstudo(url) { window.open(url, '_blank'); }

function alternarAssistido(id) {
  const video = bibliotecaVideos.find(v => v.id === id);
  if (video) {
    const novoStatus = !video.assistido;
    apiFetch(`bibliotecavideos/${id}`, {
      method: "PUT",
      body: JSON.stringify({ assistido: novoStatus ? 1 : 0 })
    }).then(response => {
      if (response.ok) {
        video.assistido = novoStatus;
        renderizarBibliotecaVideos();
        mostrarToast(video.assistido ? '✅ Marcado como assistido!' : '↩️ Desmarcado!', video.assistido ? '#22c55e' : '#6b7280');
      } else {
        mostrarToast('❌ Erro ao atualizar status', '#ef4444');
      }
    }).catch(err => {
      console.error(err);
      mostrarToast('❌ Erro ao atualizar status', '#ef4444');
    });
  }
}

function avaliarVideo(id) {
  const video = bibliotecaVideos.find(v => v.id === id);
  if (!video) return;

  Swal.fire({
    title: 'Avaliar vídeo',
    text: `Como você avalia "${video.titulo}"?`,
    input: 'range',
    inputAttributes: { min: '1', max: '5', step: '1' },
    inputValue: video.nota || 3,
    showCancelButton: true,
    confirmButtonText: 'Salvar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#f59e0b'
  }).then((result) => {
    if (result.isConfirmed) {
      const nota = parseInt(result.value);
      apiFetch(`bibliotecavideos/${id}`, {
        method: "PUT",
        body: JSON.stringify({ nota: nota })
      }).then(response => {
        if (response.ok) {
          video.nota = nota;
          renderizarBibliotecaVideos();
          mostrarToast(`${'⭐'.repeat(video.nota)} Avaliação salva!`, '#f59e0b');
        } else {
          mostrarToast('❌ Erro ao salvar avaliação', '#ef4444');
        }
      }).catch(err => {
        console.error(err);
        mostrarToast('❌ Erro ao salvar avaliação', '#ef4444');
      });
    }
  });
}

function editarVideo(id) {
  const video = bibliotecaVideos.find(v => v.id === id);
  if (!video) return;

  Swal.fire({
    title: 'Editar Vídeo',
    html: `
      <div style="text-align: left;">
        <label style="font-weight: 600; font-size: 0.85rem;">Título:</label>
        <input id="swalVideoTitulo" class="swal2-input" value="${video.titulo}">
        <label style="font-weight: 600; font-size: 0.85rem; margin-top: 10px;">Tema:</label>
        <input id="swalVideoTema" class="swal2-input" value="${video.tema}">
        <label style="font-weight: 600; font-size: 0.85rem; margin-top: 10px;">Anotações:</label>
        <textarea id="swalVideoAnotacoes" class="swal2-textarea" rows="4">${video.anotacoes || ''}</textarea>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Salvar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#22c55e',
    preConfirm: () => {
      const titulo = document.getElementById('swalVideoTitulo').value.trim();
      const tema = document.getElementById('swalVideoTema').value.trim();
      const anotacoes = document.getElementById('swalVideoAnotacoes').value.trim();
      if (!titulo) { Swal.showValidationMessage('Digite um título!'); return false; }
      return { titulo, tema, anotacoes };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      apiFetch(`bibliotecavideos/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          titulo: result.value.titulo,
          tema: result.value.tema,
          anotacoes: result.value.anotacoes
        })
      }).then(response => {
        if (response.ok) {
          video.titulo = result.value.titulo;
          video.tema = result.value.tema;
          video.anotacoes = result.value.anotacoes;
          renderizarBibliotecaVideos();
          mostrarToast('✅ Vídeo atualizado!', '#22c55e');
        } else {
          mostrarToast('❌ Erro ao atualizar vídeo', '#ef4444');
        }
      }).catch(err => {
        console.error(err);
        mostrarToast('❌ Erro ao atualizar vídeo', '#ef4444');
      });
    }
  });
}

function excluirVideo(id) {
  Swal.fire({
    title: 'Excluir vídeo?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444'
  }).then((result) => {
    if (result.isConfirmed) {
      apiFetch(`bibliotecavideos/${id}`, {
        method: "DELETE"
      }).then(response => {
        if (response.ok) {
          bibliotecaVideos = bibliotecaVideos.filter(v => v.id !== id);
          popularFiltroMateriasVideos();
          renderizarBibliotecaVideos();
          mostrarToast('🗑️ Vídeo excluído!', '#ef4444');
        } else {
          mostrarToast('❌ Erro ao excluir vídeo', '#ef4444');
        }
      }).catch(err => {
        console.error(err);
        mostrarToast('❌ Erro ao excluir vídeo', '#ef4444');
      });
    }
  });
}

// ===== EXPORTAR =====
window.abrirBibliotecaVideos = abrirBibliotecaVideos;
window.fecharBibliotecaVideos = fecharBibliotecaVideos;
window.abrirModalAdicionarVideo = abrirModalAdicionarVideo;
window.fecharModalAdicionarVideo = fecharModalAdicionarVideo;
window.carregarThumbnailPreview = carregarThumbnailPreview;
window.salvarVideo = salvarVideo;
window.renderizarBibliotecaVideos = renderizarBibliotecaVideos;
window.abrirVideoEstudo = abrirVideoEstudo;
window.alternarAssistido = alternarAssistido;
window.avaliarVideo = avaliarVideo;
window.editarVideo = editarVideo;
window.excluirVideo = excluirVideo;

// =============================================
// ===== FUNÇÃO verDetalhesMetodo FINAL ========
// =============================================

window.verDetalhesMetodo = function (tipoInteligencia, metodoId) {
  console.log('🔍 [FINAL] Abrindo método:', tipoInteligencia, metodoId);

  const metodosData = metodosPorInteligencia[tipoInteligencia];
  if (!metodosData) return;

  const metodo = metodosData.metodos.find(m => m.id === metodoId);
  if (!metodo) return;

  console.log('📌 [FINAL] Método:', metodo.titulo);

  const modalTitulo = document.getElementById("modalMetodoTitulo");
  const modalTempo = document.getElementById("modalMetodoTempo");
  const modalDificuldade = document.getElementById("modalMetodoDificuldade");
  const passosList = document.getElementById("modalMetodoPassos");
  const beneficiosContainer = document.getElementById("modalMetodoBeneficiosContainer");
  const beneficiosList = document.getElementById("modalMetodoBeneficios");
  const modalDica = document.getElementById("modalMetodoDica");
  const footer = document.getElementById("modalMetodoFooter");

  if (modalTitulo) modalTitulo.textContent = metodo.titulo;
  if (modalTempo) modalTempo.innerHTML = `<i class="bi bi-clock"></i> ${metodo.tempo}`;

  if (modalDificuldade) {
    modalDificuldade.textContent = metodo.dificuldade;
    modalDificuldade.className = `tag-dificuldade ${metodo.dificuldade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`;
  }

  if (passosList) {
    passosList.innerHTML = metodo.passos.map(passo => `<li>${passo}</li>`).join("");
  }

  if (beneficiosList && beneficiosContainer) {
    if (metodo.beneficios && metodo.beneficios.length > 0) {
      beneficiosContainer.style.display = "block";
      beneficiosList.innerHTML = metodo.beneficios.map(b => `<li>${b}</li>`).join("");
    } else {
      beneficiosContainer.style.display = "none";
    }
  }

  if (modalDica) {
    modalDica.textContent = "Dica: Adapte esse método ao seu estilo pessoal e combine com outras técnicas.";
  }

  if (footer) {
    footer.innerHTML = "";

    console.log('🔘 [FINAL] Botão para:', metodo.titulo);

    // 1. PODCAST
    if (metodo.titulo.includes("Podcast") || metodo.titulo.includes("podcast")) {
      console.log('✅ Podcast');
      const btn = document.createElement("button");
      btn.className = "btn-aplicar";
      btn.style.background = metodosData.cor;
      btn.innerHTML = `<i class="bi bi-mic-fill"></i> Gravar Podcast`;
      btn.onclick = function () { window.fecharMetodoModal(); window.abrirGravadorPodcast(); };
      footer.appendChild(btn);
    }
    // 2. FEYNMAN
    else if (metodo.titulo.includes("Feynman") || metodo.titulo.includes("feynman")) {
      console.log('✅ Feynman');
      const btn = document.createElement("button");
      btn.className = "btn-aplicar";
      btn.style.background = metodosData.cor;
      btn.innerHTML = `<i class="bi bi-mic-fill"></i> Gravar Explicação`;
      btn.onclick = function () { window.fecharMetodoModal(); window.abrirGravadorFeynman(); };
      footer.appendChild(btn);
    }
    // 3. POMODORO
    else if (metodo.titulo.includes("Pomodoro") || metodo.titulo.includes("pomodoro")) {
      console.log('✅ Pomodoro');
      const btn = document.createElement("button");
      btn.className = "btn-aplicar";
      btn.style.background = metodosData.cor;
      btn.innerHTML = `<i class="bi bi-play-circle-fill"></i> Usar Pomodoro`;
      btn.onclick = function () {
        window.fecharMetodoModal();
        if (typeof mostrarTela === 'function') mostrarTela('relogio');
        setTimeout(() => {
          const cardPomodoro = document.getElementById('cardPomodoro');
          if (cardPomodoro) {
            cardPomodoro.scrollIntoView({ behavior: 'smooth', block: 'center' });
            cardPomodoro.classList.add('destaque-pomodoro');
            setTimeout(() => cardPomodoro.classList.remove('destaque-pomodoro'), 3000);
          }
        }, 500);
      };
      footer.appendChild(btn);
    }
    // 4. MAPA MENTAL
    else if (metodo.titulo.includes("Mapa Mental") || metodo.titulo.includes("mapa mental")) {
      console.log('✅ Mapa Mental');
      const btn = document.createElement("button");
      btn.className = "btn-aplicar";
      btn.style.background = metodosData.cor;
      btn.innerHTML = `<i class="bi bi-diagram-3"></i> Criar Mapa Mental`;
      btn.onclick = function () { window.fecharMetodoModal(); window.abrirMapaMental(); };
      footer.appendChild(btn);
    }
    // 4. DIAGRAMA DE FLUXOS
    else if (metodo.titulo.includes("Diagrama de Fluxos") || metodo.titulo.includes("diagrama de fluxos") ||
      metodo.titulo.includes("Fluxos") || metodo.titulo.includes("fluxos")) {
      console.log('✅ Diagrama de Fluxos');
      const btn = document.createElement("button");
      btn.className = "btn-aplicar";
      btn.style.background = metodosData.cor;
      btn.innerHTML = `<i class="bi bi-arrow-right-circle"></i> Criar Diagrama de Fluxo`;
      btn.onclick = function () {
        window.fecharMetodoModal();
        window.abrirDiagramaFluxo();
      };
      footer.appendChild(btn);
    }
    // 5. ESTUDO COM VÍDEOS
    else if (metodo.titulo.includes("Vídeos") || metodo.titulo.includes("Videos") ||
      metodo.titulo.includes("vídeos") || metodo.titulo.includes("videos")) {
      console.log('✅ Biblioteca de Vídeos');
      const btn = document.createElement("button");
      btn.className = "btn-aplicar";
      btn.style.background = metodosData.cor;
      btn.innerHTML = `<i class="bi bi-collection-play"></i> Minha Biblioteca de Vídeos`;
      btn.onclick = function () { window.fecharMetodoModal(); window.abrirBibliotecaVideos(); };
      footer.appendChild(btn);
    }
    // 6. CORNELL
    else if (metodo.titulo.includes("Cornell") || metodo.titulo.includes("cornell")) {
      console.log('✅ Cornell');
      const btn = document.createElement("button");
      btn.className = "btn-aplicar";
      btn.style.background = metodosData.cor;
      btn.innerHTML = `<i class="bi bi-journal-text"></i> Usar Cornell com Notas`;
      btn.onclick = function () {
        window.fecharMetodoModal();
        if (typeof window.abrirCornell === 'function') window.abrirCornell();
      };
      footer.appendChild(btn);
    }
    // 7. TESTE PRÁTICO
    else if (metodo.titulo.includes("Teste Prático") || metodo.titulo.includes("Teste Pratico") ||
      metodo.titulo.includes("teste prático") || metodo.titulo.includes("teste pratico")) {
      console.log('✅ Teste Prático - Ir para Simulado');
      const btn = document.createElement("button");
      btn.className = "btn-aplicar";
      btn.style.background = metodosData.cor;
      btn.innerHTML = `<i class="bi bi-pencil-square"></i> Ir para Simulado`;
      btn.onclick = function () {
        window.irParaRevisao("simulado", metodo.titulo);
      };
      footer.appendChild(btn);
    }
    // 8. MNEMÔNICA
    else if (metodo.titulo.includes("Mnemônica") || metodo.titulo.includes("Mnemonica") ||
      metodo.titulo.includes("mnemônica") || metodo.titulo.includes("mnemonica")) {
      console.log('✅ Mnemônica - Entendi');
      const btn = document.createElement("button");
      btn.className = "btn-aplicar";
      btn.style.background = metodosData.cor;
      btn.innerHTML = `<i class="bi bi-check-circle-fill"></i> Entendi`;
      btn.onclick = function () { window.fecharMetodoModal(); };
      footer.appendChild(btn);
    }
    // 9. FLASHCARDS
    else if (metodo.titulo.includes("Flashcards") || metodo.titulo.includes("flashcards")) {
      console.log('✅ Flashcards');
      const btn = document.createElement("button");
      btn.className = "btn-aplicar";
      btn.style.background = metodosData.cor;
      btn.innerHTML = `<i class="bi bi-arrow-repeat"></i> Ir para Revisão (Criar Flashcards)`;
      btn.onclick = function () { window.irParaRevisao("flashcards", metodo.titulo); };
      footer.appendChild(btn);
    }
    // 10. LEITURA SAVORING
    else if (metodo.titulo.includes("Leitura Savoring") ||
      metodo.titulo.includes("leitura savoring") ||
      metodo.titulo.includes("Leitura") && metodo.titulo.includes("Savoring")) {
      console.log('✅ Leitura Savoring');
      const btn = document.createElement("button");
      btn.className = "btn-aplicar";
      btn.style.background = metodosData.cor;
      btn.innerHTML = `<i class="bi bi-book"></i> Iniciar Leitura Savoring`;
      btn.onclick = function () {
        window.fecharMetodoModal();
        window.abrirLeituraSavoring();
      };
      footer.appendChild(btn);
    }
    // 11. REVISÃO
    else if (metodo.irParaRevisao) {
      console.log('✅ Revisão');
      const btn = document.createElement("button");
      btn.className = "btn-aplicar";
      btn.style.background = metodosData.cor;
      btn.innerHTML = `<i class="bi bi-arrow-repeat"></i> Ir para Revisão`;
      btn.onclick = function () { window.irParaRevisao(metodo.tipoRevisao || "revisao_normal", metodo.titulo); };
      footer.appendChild(btn);
    }
    // 12. GRUPO DE ESTUDO
    else if (metodo.titulo.includes("Grupos de Estudo") || metodo.titulo.includes("grupos de estudo") ||
      metodo.titulo.includes("Grupo de Estudo") || metodo.titulo.includes("grupo de estudo")) {
      console.log('✅ Grupos de Estudo');
      const btn = document.createElement("button");
      btn.className = "btn-aplicar";
      btn.style.background = metodosData.cor;
      btn.innerHTML = `<i class="bi bi-people-fill"></i> Abrir Grupos de Estudo`;
      btn.onclick = function () {
        window.fecharMetodoModal();
        window.abrirGruposEstudo();
      };
      footer.appendChild(btn);
    }
    // 13. ENTENDI
    else {
      console.log('✅ Entendi');
      const btn = document.createElement("button");
      btn.className = "btn-aplicar";
      btn.style.background = metodosData.cor;
      btn.innerHTML = `<i class="bi bi-check-circle-fill"></i> Entendi`;
      btn.onclick = window.fecharMetodoModal;
      footer.appendChild(btn);
    }
  }

  const modalOverlay = document.getElementById("metodoModalOverlay");
  if (modalOverlay) {
    modalOverlay.style.display = "flex";
  }
};

console.log('✅ Função verDetalhesMetodo FINAL carregada!');

// ===== FORÇAR RENDERIZAÇÃO DOS MÉTODOS =====
console.log('🔄 Forçando renderização dos métodos...');

// Verifica se a função existe
if (typeof window.renderizarMetodosEstudo === 'function') {
  console.log('✅ Função renderizarMetodosEstudo encontrada');

  // Chama após 1 segundo
  setTimeout(() => {
    window.renderizarMetodosEstudo();
    console.log('✅ Renderização forçada executada');
  }, 1000);
} else {
  console.error('❌ Função renderizarMetodosEstudo NÃO encontrada!');
}

// Verifica se o container existe
const containerCheck = document.getElementById('listaMetodosRecomendados');
if (containerCheck) {
  console.log('✅ Container de métodos encontrado');
  console.log('📌 Número de cards:', containerCheck.children.length);
} else {
  console.error('❌ Container de métodos NÃO encontrado!');
}

// =============================================
// ===== REVISÃO INTELIGENTE - VERSÃO FINAL ====
// =============================================

let flashcards = [];
let revisoesEmAndamento = [];
let indiceAtualFoco = 0;

const intervalosRevisao = [1, 3, 7, 14, 30];

function hoje() {
  return new Date().toISOString().split("T")[0];
}

function formatarData(dataStr) {
  if (!dataStr) return 'Sem data';
  const data = new Date(dataStr + 'T12:00:00');
  return data.toLocaleDateString('pt-BR');
}

// ===== SALVAR =====
function salvarFlashcards() {
  // Sincronizado diretamente no banco de dados via API
}
// ===== CONFIGURAR ABAS =====
function configurarAbasRevisao() {
  document.querySelectorAll('.aba-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      trocarAbaRevisao(btn.dataset.aba);
    });
  });
}

// ===== CARREGAR FLASHCARDS (compatibilidade) =====
function carregarFlashcards() {
  carregarFlashcardsDoBackend();
}

// ===== CARREGAR FLASHCARDS =====
async function carregarFlashcardsDoBackend() {
  try {
    const response = await apiFetch("flashcards");

    if (response.ok) {
      const data = await response.json();

      if (Array.isArray(data)) {
        flashcards = data.map(f => {
          let parsedTema = {
            tema: "Geral",
            nivel: 0,
            dataProxima: new Date().toISOString().split("T")[0],
            acertos: 0,
            erros: 0
          };

          const rawTema = decodeHtmlEntities(f.tema || "");

          try {
            if (rawTema && rawTema.trim().startsWith('{')) {
              parsedTema = JSON.parse(rawTema);
            } else if (rawTema) {
              parsedTema.tema = rawTema;
            }
          } catch (e) {
            if (rawTema) parsedTema.tema = rawTema;
          }

          return {
            id: Number(f.id_flash),
            materiaId: Number(f.id_materia),
            materiaNome: decodeHtmlEntities(f.nome_materia || "Sem matéria"),
            tema: parsedTema.tema || "Geral",
            pergunta: decodeHtmlEntities(f.pergunta || ""),
            resposta: decodeHtmlEntities(f.resposta || ""),
            nivel: parsedTema.nivel !== undefined ? parsedTema.nivel : 0,
            dataProxima: parsedTema.dataProxima || new Date().toISOString().split("T")[0],
            acertos: parsedTema.acertos !== undefined ? parsedTema.acertos : 0,
            erros: parsedTema.erros !== undefined ? parsedTema.erros : 0,
            historico: parsedTema.historico || []
          };
        });
      }
    }
  } catch (err) {
    console.error("Erro ao carregar flashcards do servidor:", err);
  }

  // Renderiza tudo
  if (typeof popularFiltroMaterias === 'function') popularFiltroMaterias();
  if (typeof renderizarFlashcardsAgrupados === 'function') renderizarFlashcardsAgrupados();
  if (typeof atualizarEstatisticas === 'function') atualizarEstatisticas();
  if (typeof atualizarMensagemRevisar === 'function') atualizarMensagemRevisar();
  if (typeof verificarCardsAtrasados === 'function') verificarCardsAtrasados();
}

// ===== VERIFICAR CARDS ATRASADOS =====
function verificarCardsAtrasados() {
  const hojeData = hoje();
  const atrasados = flashcards.filter(f => f.dataProxima && f.dataProxima < hojeData);
  const aviso = document.getElementById('avisoCardsAtrasados');

  if (aviso) {
    if (atrasados.length > 0) {
      aviso.style.display = 'block';
      const detalhes = document.getElementById('detalhesAtrasados');
      if (detalhes) detalhes.textContent = atrasados.length + ' card(s) precisam de revisão!';
    } else {
      aviso.style.display = 'none';
    }
  }
}

// ===== VERIFICAR PROVAS =====
function verificarProvasProximas() {
  let eventos = [];
  if (typeof calendar !== 'undefined' && calendar && typeof calendar.getEvents === 'function') {
    eventos = calendar.getEvents();
  }

  const hojeDate = new Date();

  eventos.forEach(evento => {
    const tipo = evento.extendedProps?.tipo || '';
    const titulo = evento.title || '';

    if (tipo === 'prova' || titulo.toLowerCase().includes('prova')) {
      const dataEvento = new Date(evento.start);
      const dias = Math.ceil((dataEvento - hojeDate) / (1000 * 60 * 60 * 24));

      if (dias <= 7 && dias > 0) {
        const aviso = document.getElementById('avisoProva');
        const texto = document.getElementById('textoAvisoProva');
        if (aviso && texto) {
          texto.innerHTML = titulo + ' - Faltam ' + dias + ' dias!';
          aviso.style.display = 'block';
          window.provaAtual = { titulo, dias };
        }
      }
    }
  });
}

// ===== FECHAR AVISO =====
function fecharAviso(tipo) {
  const aviso = document.getElementById(tipo);
  if (aviso) {
    aviso.style.display = 'none';
    aviso.style.visibility = 'hidden';
    aviso.style.height = '0';
    aviso.style.padding = '0';
    aviso.style.margin = '0';
    aviso.style.overflow = 'hidden';
  }
  localStorage.setItem('aviso_' + tipo + '_fechado', 'true');
}

// ===== CRIAR REVISÃO POR PROVA =====
function criarRevisaoPorProva() {
  if (window.provaAtual) {
    abrirModalFlashcardComProva(window.provaAtual.titulo);
    const aviso = document.getElementById('avisoProva');
    if (aviso) aviso.style.display = 'none';
    localStorage.setItem('aviso_avisoProva_fechado', 'true');
  }
}

// ===== IR PARA ABA REVISAR =====
function irParaAbaRevisar() {
  document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector('[data-aba="revisar"]');
  if (btn) btn.classList.add('active');

  document.getElementById('abaMeusCards').style.display = 'none';
  document.getElementById('abaRevisar').style.display = 'block';
  document.getElementById('abaHistorico').style.display = 'none';

  atualizarMensagemRevisar();

  const aviso = document.getElementById('avisoCardsAtrasados');
  if (aviso) aviso.style.display = 'none';
  localStorage.setItem('aviso_avisoCardsAtrasados_fechado', 'true');
}

// ===== CONFIGURAR FILTRO =====
function configurarFiltroRevisao() {
  const filtro = document.getElementById('filtroMateriaRevisao');
  if (filtro) {
    filtro.addEventListener('change', () => {
      renderizarFlashcardsAgrupados();
      atualizarMensagemRevisar();
    });
  }
}

// ===== POPULAR FILTRO =====
// ===== POPULAR FILTRO DE MATÉRIAS (APENAS BACKEND) =====
async function popularFiltroMaterias() {
  console.log('📚 [FILTRO] Carregando matérias para os filtros...');

  // Garantir que materias está carregado
  if (!materias || materias.length === 0) {
    await carregarMateriasDoBackend();
  }

  const select = document.getElementById('filtroMateriaRevisao');
  if (!select) return;

  select.innerHTML = '<option value="todas">📚 Todas as matérias</option>';

  if (materias && materias.length > 0) {
    const nomesOrdenados = [...new Set(materias.map(m => m.nome))].sort();
    nomesOrdenados.forEach(materia => {
      if (materia && materia !== 'undefined') {
        select.innerHTML += `<option value="${materia}">${materia}</option>`;
      }
    });
  }

  // Atualizar filtro do modo de revisão
  const selectModo = document.getElementById('filtroMateriaRevisaoModo');
  if (selectModo) {
    selectModo.innerHTML = '<option value="todas">Todas as matérias</option>';

    if (materias && materias.length > 0) {
      const nomesOrdenados = [...new Set(materias.map(m => m.nome))].sort();
      nomesOrdenados.forEach(materia => {
        if (materia && materia !== 'undefined') {
          selectModo.innerHTML += `<option value="${materia}">${materia}</option>`;
        }
      });
    }
  }
}

// ===== RENDERIZAR FLASHCARDS =====
function renderizarFlashcardsAgrupados() {
  const container = document.getElementById('listaFlashcardsAgrupada');
  if (!container) return;

  const filtroMateria = document.getElementById('filtroMateriaRevisao')?.value || 'todas';

  let cardsFiltrados = [...flashcards];

  if (filtroMateria !== 'todas') {
    cardsFiltrados = cardsFiltrados.filter(f => f.materiaNome === filtroMateria);
  }

  if (cardsFiltrados.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:40px;">Nenhum flashcard encontrado!</p>';
    return;
  }

  const porMateria = {};
  cardsFiltrados.forEach(f => {
    if (!porMateria[f.materiaNome]) porMateria[f.materiaNome] = { temas: {}, count: 0 };
    if (!porMateria[f.materiaNome].temas[f.tema]) porMateria[f.materiaNome].temas[f.tema] = [];
    porMateria[f.materiaNome].temas[f.tema].push(f);
    porMateria[f.materiaNome].count++;
  });

  let html = '';
  let index = 0;

  for (const materia in porMateria) {
    const materiaData = porMateria[materia];
    const materiaId = 'materia-' + index;

    html += '<div class="materia-acordeon">' +
      '<div class="materia-header" onclick="toggleAcordeon(\'' + materiaId + '\')">' +
      '<div class="materia-titulo">' +
      '<i class="bi bi-journal-bookmark-fill"></i>' +
      '<h3>' + materia + '</h3>' +
      '<span class="materia-badge-count">' + materiaData.count + '</span>' +
      '</div>' +
      '<span class="materia-seta" id="' + materiaId + '-seta">▶</span>' +
      '</div>' +
      '<div class="materia-conteudo" id="' + materiaId + '-conteudo" style="display:none;">';

    for (const tema in materiaData.temas) {
      const cards = materiaData.temas[tema];

      html += '<div class="tema-grupo">' +
        '<div class="tema-header">' +
        '<i class="bi bi-folder2"></i>' +
        '<h4>' + tema + '</h4>' +
        '<span class="tema-badge-count">' + cards.length + '</span>' +
        '</div>';

      cards.forEach(f => {
        const isAtrasada = f.dataProxima < hoje();
        const isHoje = f.dataProxima === hoje();
        const classeDestaque = isAtrasada ? 'atrasada' : (isHoje ? 'hoje' : '');

        html += '<div class="card-flashcard ' + classeDestaque + '">' +
          '<div class="card-pergunta">' + f.pergunta + '</div>' +
          '<div class="card-data">📅 ' + formatarData(f.dataProxima) + ' | Nível: ' + (f.nivel || 0) + '</div>' +
          '<div class="card-acoes">' +
          '<button onclick="editarFlashcard(' + f.id + ')"><i class="bi bi-pencil"></i></button>' +
          '<button onclick="excluirFlashcard(' + f.id + ')"><i class="bi bi-trash"></i></button>' +
          '</div>' +
          '</div>';
      });

      html += '</div>';
    }

    html += '</div></div>';
    index++;
  }

  container.innerHTML = html;
}

// ===== TOGGLE ACORDEON =====
function toggleAcordeon(materiaId) {
  const conteudo = document.getElementById(materiaId + '-conteudo');
  const seta = document.getElementById(materiaId + '-seta');
  if (conteudo.style.display === 'block') {
    conteudo.style.display = 'none';
    seta.textContent = '▶';
  } else {
    conteudo.style.display = 'block';
    seta.textContent = '▼';
  }
}

// ===== ATUALIZAR ESTATÍSTICAS =====
function atualizarEstatisticas() {
  const hojeData = hoje();
  const revisoesHoje = flashcards.filter(f => f.dataProxima === hojeData).length;
  const atrasadas = flashcards.filter(f => f.dataProxima < hojeData).length;
  const concluidas = flashcards.filter(f => f.nivel > 0).length;
  const totalAcertos = flashcards.reduce((sum, f) => sum + (f.acertos || 0), 0);
  const totalRespostas = flashcards.reduce((sum, f) => sum + (f.acertos || 0) + (f.erros || 0), 0);
  const taxa = totalRespostas > 0 ? Math.round((totalAcertos / totalRespostas) * 100) : 0;

  const elHoje = document.getElementById("totalHoje");
  const elAtrasadas = document.getElementById("totalAtrasadas");
  const elConcluidas = document.getElementById("totalConcluidas");
  const elTaxa = document.getElementById("taxaAcertoGeral");

  if (elHoje) elHoje.textContent = revisoesHoje;
  if (elAtrasadas) elAtrasadas.textContent = atrasadas;
  if (elConcluidas) elConcluidas.textContent = concluidas;
  if (elTaxa) elTaxa.textContent = taxa + '%';
}

// ===== ABRIR MODAL FLASHCARD (APENAS BACKEND) =====
async function abrirModalFlashcard() {
  console.log('📝 [FLASHCARD] Abrindo modal...');

  // Garantir que materias está carregado
  if (!materias || materias.length === 0) {
    await carregarMateriasDoBackend();
  }

  const select = document.getElementById("revisaoMateria");
  if (!select) return;

  select.innerHTML = '<option value="">Selecione uma matéria</option>';

  if (materias && materias.length > 0) {
    materias.forEach(m => {
      if (m && m.id && m.nome && m.nome !== 'undefined') {
        select.innerHTML += `<option value="${m.id}">${m.nome}</option>`;
      }
    });
  }

  document.getElementById("revisaoTema").value = "";
  document.getElementById("revisaoPergunta").value = "";
  document.getElementById("revisaoResposta").value = "";

  const modal = new bootstrap.Modal(document.getElementById("modalRevisao"));
  modal.show();
}

// ===== ABRIR MODAL COM PROVA =====
function abrirModalFlashcardComProva(tituloProva) {
  abrirModalFlashcard();
  document.getElementById("revisaoTema").value = "Prova";
  document.getElementById("revisaoPergunta").value = 'Revisar conteúdo da prova: ' + tituloProva;
  document.getElementById("revisaoResposta").value = "Revisar todos os conteúdos relacionados";
}

// ===== SALVAR FLASHCARD =====
async function salvarFlashcard() {
  const materiaId = document.getElementById("revisaoMateria").value;
  const tema = document.getElementById("revisaoTema").value.trim();
  const pergunta = document.getElementById("revisaoPergunta").value.trim();
  const resposta = document.getElementById("revisaoResposta").value.trim();

  if (!materiaId) { mostrarToast('⚠️ Selecione uma matéria!', '#f59e0b'); return; }
  if (!pergunta || !resposta) { mostrarToast('⚠️ Preencha pergunta e resposta!', '#f59e0b'); return; }

  const materia = (typeof materias !== 'undefined' && materias) ? materias.find(m => m.id == materiaId) : null;

  const novoCard = {
    materiaId: Number(materiaId),
    materiaNome: materia ? materia.nome : "Sem matéria",
    tema: tema || "Geral",
    pergunta: pergunta,
    resposta: resposta,
    nivel: 0,
    dataProxima: hoje(),
    acertos: 0,
    erros: 0
  };

  try {
    const res = await apiFetch("flashcards", {
      method: "POST",
      body: JSON.stringify({
        id_materia: novoCard.materiaId,
        pergunta: novoCard.pergunta,
        resposta: novoCard.resposta,
        tema: JSON.stringify({
          tema: novoCard.tema,
          nivel: novoCard.nivel,
          dataProxima: novoCard.dataProxima,
          acertos: novoCard.acertos,
          erros: novoCard.erros
        })
      })
    });
    if (res.ok) {
      const data = await res.json();
      novoCard.id = Number(data.id_flash);
      flashcards.push(novoCard);
      popularFiltroMaterias();
      renderizarFlashcardsAgrupados();
      atualizarEstatisticas();

      const modal = bootstrap.Modal.getInstance(document.getElementById("modalRevisao"));
      if (modal) modal.hide();

      Swal.fire({ icon: 'success', title: 'Flashcard salvo!', timer: 1500, showConfirmButton: false });
    } else {
      mostrarToast('❌ Erro ao salvar flashcard', '#ef4444');
    }
  } catch (err) {
    console.error("Erro ao salvar flashcard:", err);
  }
}

// ===== MOSTRAR CARD FOCO =====
// ===== MOSTRAR CARD FOCO (CORRIGIDA) =====
function mostrarCardFoco() {
  console.log('📝 [REVISÃO] Mostrando card:', indiceAtualFoco);
  
  if (indiceAtualFoco >= revisoesEmAndamento.length) {
    finalizarRevisao();
    return;
  }
  
  const card = revisoesEmAndamento[indiceAtualFoco];
  console.log('📋 Card:', card);
  
  document.getElementById('focoMateria').textContent = card.materiaNome;
  document.getElementById('focoTema').textContent = '📂 ' + card.tema;
  document.getElementById('focoPergunta').textContent = card.pergunta;
  document.getElementById('focoResposta').innerHTML = card.resposta;
  document.getElementById('focoResposta').style.display = 'none';
  
  // RESETAR BOTÕES DE RESPOSTA
  const botoesResposta = document.getElementById('botoesResposta');
  botoesResposta.innerHTML = `
    <button class="btn-errei" onclick="responderContexto('errei')">❌ Errei</button>
    <button class="btn-acertei" onclick="responderContexto('acertei')">✅ Acertei</button>
    <button class="btn-facil" onclick="responderContexto('facil')">🚀 Muito Fácil!</button>
  `;
  botoesResposta.style.display = 'none';
  
  // Mostrar botão "Mostrar Resposta"
  document.getElementById('btnMostrarResposta').style.display = 'block';
  
  // Esconder timer do simulado
  document.getElementById('simuladoTimer').style.display = 'none';
  
  // Mostrar info do nível
  const nivelAtual = card.nivel || 0;
  const proximoIntervalo = intervalosRevisao[Math.min(nivelAtual + 1, intervalosRevisao.length - 1)];
  document.getElementById('focoNivelAtual').textContent = 'Nível: ' + nivelAtual;
  document.getElementById('focoSugestao').textContent = 'Sugestão: revise em ' + proximoIntervalo + ' dia(s)';
  document.getElementById('focoInfoNivel').style.display = 'block';
  
  document.getElementById('focoContador').textContent = 'Card ' + (indiceAtualFoco + 1) + ' de ' + revisoesEmAndamento.length;
  document.getElementById('focoProgressoBarra').style.width = (((indiceAtualFoco + 1) / revisoesEmAndamento.length) * 100) + '%';
  
  const container = document.getElementById('modoFocoContainer');
  if (container) {
    container.style.display = 'flex';
    container.style.visibility = 'visible';
    container.style.opacity = '1';
  }
}

// ===== MOSTRAR RESPOSTA =====
function mostrarRespostaFoco() {
  document.getElementById('focoResposta').style.display = 'block';
  document.getElementById('btnMostrarResposta').style.display = 'none';
  document.getElementById('botoesResposta').style.display = 'flex';
}

// ===== FINALIZAR REVISÃO =====
function finalizarRevisao() {
  const container = document.getElementById('modoFocoContainer');
  if (container) {
    container.style.display = 'none';
    container.style.visibility = 'hidden';
    container.style.opacity = '0';
  }
  document.body.style.overflow = 'auto';

  renderizarFlashcardsAgrupados();
  atualizarMensagemRevisar();
  verificarCardsAtrasados();

  Swal.fire({ icon: 'success', title: '🎉 Revisão concluída!', timer: 1500, showConfirmButton: false });
}

// ===== FECHAR MODO FOCO =====
function fecharModoFoco() {
  console.log('🚪 [FOCO] Fechando modo foco...');

  if (simuladoAtual.timer) {
    clearInterval(simuladoAtual.timer);
    simuladoAtual.timer = null;
  }

  if (window.timerRevisao) {
    clearInterval(window.timerRevisao);
    window.timerRevisao = null;
  }

  const container = document.getElementById('modoFocoContainer');
  if (container) {
    container.style.display = 'none';
    container.style.visibility = 'hidden';
    container.style.opacity = '0';
  }

  document.body.style.overflow = 'auto';

  simuladoAtual = {
    cards: [],
    indice: 0,
    acertos: 0,
    erros: 0,
    tempoPorQuestao: 60,
    timer: null,
    tempoRestante: 0,
    modo: 'treino',
    respondido: false
  };

  revisoesEmAndamento = [];
  indiceAtualFoco = 0;
}

function reiniciarSimulado() {
  simuladoAtual = {
    cards: [],
    indice: 0,
    acertos: 0,
    erros: 0,
    tempoPorQuestao: 60,
    timer: null,
    tempoRestante: 0,
    modo: 'treino',
    respondido: false
  };

  document.getElementById('simuladoResultado').style.display = 'none';
  document.getElementById('focoPergunta').style.display = 'block';
  document.getElementById('modoFocoContainer').style.display = 'none';

  trocarAbaRevisao('simulado');
  carregarOpcoesSimulado();
}

window.reiniciarSimulado = reiniciarSimulado;

// ===== EDITAR FLASHCARD =====
function editarFlashcard(id) {
  const flashcard = flashcards.find(f => f.id == id);
  if (!flashcard) return;

  Swal.fire({
    title: 'Editar Flashcard',
    html: '<input id="editPergunta" class="swal2-input" value="' + flashcard.pergunta.replace(/"/g, '&quot;') + '">' +
      '<textarea id="editResposta" class="swal2-textarea" rows="3">' + flashcard.resposta.replace(/"/g, '&quot;') + '</textarea>' +
      '<input id="editTema" class="swal2-input" value="' + flashcard.tema + '">',
    showCancelButton: true,
    confirmButtonText: 'Salvar',
    preConfirm: () => {
      const pergunta = document.getElementById('editPergunta').value;
      const resposta = document.getElementById('editResposta').value;
      const tema = document.getElementById('editTema').value;
      if (!pergunta || !resposta) { Swal.showValidationMessage('Preencha todos!'); return false; }
      return { pergunta, resposta, tema };
    }
  }).then(async result => {
    if (result.isConfirmed) {
      flashcard.pergunta = result.value.pergunta;
      flashcard.resposta = result.value.resposta;
      flashcard.tema = result.value.tema || "Geral";
      
      try {
        await apiFetch(`flashcards/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            pergunta: flashcard.pergunta,
            resposta: flashcard.resposta,
            tema: JSON.stringify({
              tema: flashcard.tema,
              nivel: flashcard.nivel || 0,
              dataProxima: flashcard.dataProxima || hoje(),
              acertos: flashcard.acertos || 0,
              erros: flashcard.erros || 0,
              historico: flashcard.historico || []
            })
          })
        });
        renderizarFlashcardsAgrupados();
        Swal.fire('Atualizado com sucesso!', '', 'success');
      } catch (err) {
        console.error("Erro ao atualizar flashcard:", err);
      }
    }
  });
}

// ===== EXCLUIR FLASHCARD =====
function excluirFlashcard(id) {
  Swal.fire({
    title: 'Excluir flashcard?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim',
    cancelButtonText: 'Cancelar'
  }).then(async result => {
    if (result.isConfirmed) {
      try {
        const res = await apiFetch(`flashcards/${id}`, { method: "DELETE" });
        if (res.ok) {
          flashcards = flashcards.filter(f => f.id != id);
          renderizarFlashcardsAgrupados();
          atualizarEstatisticas();
          Swal.fire('Excluído com sucesso!', '', 'success');
        } else {
          mostrarToast('Erro ao excluir', '#ef4444');
        }
      } catch (err) {
        console.error("Erro ao excluir flashcard:", err);
      }
    }
  });
}

// ===== EXPORTAR =====
window.iniciarRevisao = iniciarRevisao;
window.iniciarRevisaoLivre = iniciarRevisaoLivre;
window.mostrarRespostaFoco = mostrarRespostaFoco;
window.responderFlashcard = responderFlashcard;
window.fecharModoFoco = fecharModoFoco;
window.abrirModalFlashcard = abrirModalFlashcard;
window.salvarFlashcard = salvarFlashcard;
window.editarFlashcard = editarFlashcard;
window.excluirFlashcard = excluirFlashcard;
window.toggleAcordeon = toggleAcordeon;
window.irParaAbaRevisar = irParaAbaRevisar;
window.criarRevisaoPorProva = criarRevisaoPorProva;
window.fecharAviso = fecharAviso;
window.configurarFiltroRevisao = configurarFiltroRevisao;
window.renderizarFlashcardsAgrupados = renderizarFlashcardsAgrupados;
window.salvarFlashcards = function() {};
window.atualizarEstatisticas = atualizarEstatisticas;

console.log('✅ REVISÃO COMPLETA CARREGADA!');


// ===== SALVAR NO BACKEND TAMBÉM =====
function salvarFlashcardNoBackend(card) {
  return apiFetch("flashcards", {
    method: "POST",
    body: JSON.stringify({
      id_materia: card.materiaId,
      pergunta: card.pergunta,
      resposta: card.resposta,
      tema: JSON.stringify({
        tema: card.tema,
        nivel: card.nivel,
        dataProxima: card.dataProxima,
        acertos: card.acertos,
        erros: card.erros
      })
    })
  }).then(async res => {
    if (res.ok) {
      const data = await res.json();
      if (data && data.id_flash) {
        card.id = data.id_flash;
      }
      console.log('✅ Card salvo no backend!', data);
    }
  }).catch(err => {
    console.error('Erro ao salvar flashcard no backend:', err);
  });
}

// Exporta
window.salvarFlashcardNoBackend = salvarFlashcardNoBackend;

console.log('✅ INTEGRAÇÃO COM BACKEND PRONTA!');

// ===== NOVAS FUNÇÕES PARA A REFORMA =====
// Trocar de aba
function trocarAbaRevisao(aba) {
  document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-aba="${aba}"]`).classList.add('active');

  document.getElementById('abaMeusCards').style.display = aba === 'meusCards' ? 'block' : 'none';
  document.getElementById('abaRevisar').style.display = aba === 'revisar' ? 'block' : 'none';
  document.getElementById('abaSimulado').style.display = aba === 'simulado' ? 'block' : 'none';
  document.getElementById('abaHistorico').style.display = aba === 'historico' ? 'block' : 'none';

  if (aba === 'revisar') {
    atualizarContadoresRevisao();
  } else if (aba === 'simulado') {
    carregarOpcoesSimulado();
  } else if (aba === 'historico') {
    renderizarHistoricoCompleto();
  }
}

// Verificar se usuário tem método Teste Prático
function verificarAcessoSimulado() {
  const inteligenciaAtual = localStorage.getItem('inteligenciaAtiva') || 'linguistica';
  const metodosData = metodosPorInteligencia[inteligenciaAtual];

  if (!metodosData) return false;

  const temTestePratico = metodosData.metodos.some(m =>
    m.titulo.includes("Teste Prático") || m.titulo.includes("Teste Pratico")
  );

  const abaSimuladoBtn = document.getElementById('abaSimuladoBtn');
  if (abaSimuladoBtn) {
    abaSimuladoBtn.style.display = temTestePratico ? 'block' : 'none';
  }

  return temTestePratico;
}

// Atualizar contadores de revisão
function atualizarContadoresRevisao() {
  const hojeData = hoje();
  const filtroMateria = document.getElementById('filtroMateriaRevisaoModo')?.value || 'todas';

  let cardsPendentes = flashcards.filter(f => !f.dataProxima || f.dataProxima <= hojeData);
  if (filtroMateria !== 'todas') {
    cardsPendentes = cardsPendentes.filter(f => f.materiaNome === filtroMateria);
  }

  const countEl = document.getElementById('countPendentes');
  if (countEl) {
    countEl.textContent = cardsPendentes.length;
    countEl.style.color = cardsPendentes.length === 0 ? '#22c55e' : cardsPendentes.length > 10 ? '#ef4444' : '#f59e0b';
  }

  // Atualizar texto de próxima revisão
  const textoProxima = document.getElementById('textoProximaRevisao');
  if (textoProxima && cardsPendentes.length > 0) {
    const proximaData = cardsPendentes[0].dataProxima;
    if (proximaData < hojeData) {
      textoProxima.textContent = '⚠️ Você tem cards atrasados!';
    } else if (proximaData === hojeData) {
      textoProxima.textContent = '📅 Revisão de hoje!';
    }
  }
}

// ===== SIMULADO (TESTE PRÁTICO) =====
let simuladoAtual = {
  cards: [],
  indice: 0,
  acertos: 0,
  erros: 0,
  tempoPorQuestao: 60,
  timer: null,
  tempoRestante: 0,
  modo: 'treino',
  respondido: false
};

function carregarOpcoesSimulado() {
  const selectMateria = document.getElementById('simuladoMateria');

  if (selectMateria) {
    selectMateria.innerHTML = '<option value="todas">Todas as matérias</option>';
    const materiasUnicas = [...new Set(flashcards.map(f => f.materiaNome))].sort();
    materiasUnicas.forEach(m => {
      selectMateria.innerHTML += `<option value="${m}">${m}</option>`;
    });
  }
}

function selecionarNumQuestoes(btn) {
  document.querySelectorAll('[data-num]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function iniciarSimulado() {
  console.log('🎯 [SIMULADO] Iniciando simulado...');

  // Limpar timer anterior se existir
  if (simuladoAtual.timer) {
    clearInterval(simuladoAtual.timer);
    simuladoAtual.timer = null;
  }

  const materia = document.getElementById('simuladoMateria').value;
  // REMOVA ESTA LINHA - não existe mais o select de tema
  // const tema = document.getElementById('simuladoTema').value;

  const numBtn = document.querySelector('[data-num].active');
  const numQuestoes = numBtn ? numBtn.dataset.num : '10';
  const tempo = parseInt(document.getElementById('simuladoTempo').value);
  const modo = document.getElementById('modoTreino').checked ? 'treino' : 'prova';

  console.log('📊 Config:', { materia, numQuestoes, tempo, modo });

  let cardsSimulado = [...flashcards];

  if (materia !== 'todas') {
    cardsSimulado = cardsSimulado.filter(f => f.materiaNome === materia);
  }

  console.log('📚 Cards após filtro:', cardsSimulado.length);

  // Embaralhar
  cardsSimulado = cardsSimulado.sort(() => Math.random() - 0.5);

  // Limitar número
  if (numQuestoes !== 'todas') {
    cardsSimulado = cardsSimulado.slice(0, parseInt(numQuestoes));
  }

  console.log('📝 Cards selecionados:', cardsSimulado.length);

  if (cardsSimulado.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Sem cards!',
      text: 'Crie flashcards primeiro para fazer o simulado.'
    });
    return;
  }

  simuladoAtual = {
    cards: cardsSimulado,
    indice: 0,
    acertos: 0,
    erros: 0,
    tempoPorQuestao: tempo,
    timer: null,
    tempoRestante: tempo,
    modo: modo,
    respondido: false
  };

  // Esconder resultado anterior
  document.getElementById('simuladoResultado').style.display = 'none';
  document.getElementById('focoPergunta').style.display = 'block';
  document.getElementById('simuladoTimer').style.display = 'none';

  mostrarCardSimulado();
}


function mostrarCardSimulado() {
  console.log('📝 [SIMULADO] Mostrando questão:', simuladoAtual.indice + 1);

  if (simuladoAtual.indice >= simuladoAtual.cards.length) {
    finalizarSimulado();
    return;
  }

  const card = simuladoAtual.cards[simuladoAtual.indice];

  document.getElementById('focoMateria').textContent = card.materiaNome;
  document.getElementById('focoTema').textContent = '📂 ' + card.tema;
  document.getElementById('focoPergunta').textContent = card.pergunta;

  // MOSTRAR A RESPOSTA CORRETA (escondida)
  document.getElementById('focoResposta').innerHTML = card.resposta;
  document.getElementById('focoResposta').style.display = 'none';

  // MOSTRAR BOTÃO "MOSTRAR RESPOSTA"
  document.getElementById('btnMostrarResposta').style.display = 'block';

  // RESETAR OS BOTÕES DE RESPOSTA
  const botoesResposta = document.getElementById('botoesResposta');
  botoesResposta.innerHTML = `
    <button class="btn-errei" onclick="responderSimulado('errei')">❌ Errei</button>
    <button class="btn-acertei" onclick="responderSimulado('acertei')">✅ Acertei</button>
    <button class="btn-facil" onclick="responderSimulado('facil')">🚀 Muito Fácil!</button>
  `;
  botoesResposta.style.display = 'none';

  // RESETAR FLAG DE RESPONDIDO
  simuladoAtual.respondido = false;

  // Mostrar timer se houver limite
  if (simuladoAtual.tempoPorQuestao > 0) {
    document.getElementById('simuladoTimer').style.display = 'block';
    iniciarTimerSimulado();
  } else {
    document.getElementById('simuladoTimer').style.display = 'none';
  }

  document.getElementById('focoContador').textContent =
    `Questão ${simuladoAtual.indice + 1} de ${simuladoAtual.cards.length}`;

  document.getElementById('focoProgressoBarra').style.width =
    ((simuladoAtual.indice / simuladoAtual.cards.length) * 100) + '%';

  document.getElementById('modoFocoContainer').style.display = 'flex';

  console.log('✅ [SIMULADO] Questão mostrada, respondido =', simuladoAtual.respondido);
}


function iniciarTimerSimulado() {
  // Limpar timer anterior
  if (simuladoAtual.timer) {
    clearInterval(simuladoAtual.timer);
  }
  simuladoAtual.tempoRestante = simuladoAtual.tempoPorQuestao;
  atualizarTimerSimulado();

  simuladoAtual.timer = setInterval(() => {
    simuladoAtual.tempoRestante--;
    atualizarTimerSimulado();

    if (simuladoAtual.tempoRestante <= 0) {
      clearInterval(simuladoAtual.timer);
      simuladoAtual.timer = null;

      // Tempo esgotado, conta como erro automaticamente
      if (!simuladoAtual.respondido) {
        simuladoAtual.respondido = true;

        // Mostrar resposta correta
        document.getElementById('focoResposta').style.display = 'block';
        document.getElementById('btnMostrarResposta').style.display = 'none';

        // Contar como erro
        simuladoAtual.erros++;
        const card = simuladoAtual.cards[simuladoAtual.indice];
        const original = flashcards.find(f => f.id === card.id);
        if (original) {
          original.nivel = 0;
          original.erros = (original.erros || 0) + 1;
        }
        salvarFlashcards();

        // Mostrar botão para próxima
        setTimeout(() => {
          proximaQuestaoSimulado();
        }, 2000); // Espera 2 segundos para o usuário ver a resposta
      }
    }
  }, 1000);
}

function atualizarTimerSimulado() {
  const minutos = Math.floor(simuladoAtual.tempoRestante / 60);
  const segundos = simuladoAtual.tempoRestante % 60;
  document.getElementById('simuladoTempoRestante').textContent =
    `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
}



function responderSimulado(resultado) {
  console.log('🎯 [SIMULADO] Resposta:', resultado);

  // Verificar se já respondeu
  if (simuladoAtual.respondido) {
    console.log('⚠️ Já respondeu esta questão!');
    return;
  }

  // Marcar como respondido
  simuladoAtual.respondido = true;

  // LIMPAR O TIMER IMEDIATAMENTE
  if (simuladoAtual.timer) {
    clearInterval(simuladoAtual.timer);
    simuladoAtual.timer = null;
  }

  const card = simuladoAtual.cards[simuladoAtual.indice];
  const original = flashcards.find(f => f.id === card.id);

  // MOSTRAR A RESPOSTA
  document.getElementById('focoResposta').style.display = 'block';
  document.getElementById('btnMostrarResposta').style.display = 'none';

  // VARIÁVEIS PARA FEEDBACK
  let feedbackMsg = '';
  let feedbackCor = '';

  if (resultado === 'acertei') {
    simuladoAtual.acertos++;
    feedbackMsg = '✅ Acertou!';
    feedbackCor = '#22c55e';
    if (original) {
      original.nivel = Math.min((original.nivel || 0) + 1, 4);
      original.acertos = (original.acertos || 0) + 1;
    }
  } else if (resultado === 'errei') {
    simuladoAtual.erros++;
    feedbackMsg = '❌ Errou!';
    feedbackCor = '#ef4444';
    if (original) {
      original.nivel = 0;
      original.erros = (original.erros || 0) + 1;
    }
  } else if (resultado === 'facil') {
    simuladoAtual.acertos++;
    feedbackMsg = '🚀 Muito Fácil!';
    feedbackCor = '#3b82f6';
    if (original) {
      original.nivel = Math.min((original.nivel || 0) + 2, 4);
      original.acertos = (original.acertos || 0) + 1;
    }
  }

  salvarFlashcards();

  // Mostrar feedback visual
  mostrarToast(feedbackMsg, feedbackCor);

  // Substituir botões por botão "Próxima" COM CLASSE ESPECÍFICA
  const botoesContainer = document.getElementById('botoesResposta');
  botoesContainer.innerHTML = `
    <button class="btn-proxima-questao" onclick="proximaQuestaoSimulado()" 
            style="background: #3b82f6; color: white; border: none; padding: 15px 30px; 
                   border-radius: 50px; font-weight: 700; cursor: pointer; width: 100%;
                   font-size: 1.1rem; transition: all 0.3s; letter-spacing: 1px;
                   text-transform: uppercase;">
      ➡️ Próxima Questão
    </button>
  `;
  botoesContainer.style.display = 'block';

  console.log('✅ [SIMULADO] Resposta registrada:', feedbackMsg);
}

function proximaQuestaoSimulado() {
  console.log('➡️ [SIMULADO] Indo para próxima questão...');
  console.log('📊 Índice antes:', simuladoAtual.indice);

  // Limpar timer
  if (simuladoAtual.timer) {
    clearInterval(simuladoAtual.timer);
    simuladoAtual.timer = null;
  }

  simuladoAtual.indice++;

  console.log('📊 Índice depois:', simuladoAtual.indice);
  console.log('📊 Total de cards:', simuladoAtual.cards.length);

  if (simuladoAtual.indice >= simuladoAtual.cards.length) {
    console.log('🏁 [SIMULADO] Finalizando...');
    finalizarSimulado();
  } else {
    console.log('📝 [SIMULADO] Mostrando próxima questão...');
    // Resetar respondido ANTES de mostrar
    simuladoAtual.respondido = false;
    mostrarCardSimulado();
  }
}

// Exportar
window.proximaQuestaoSimulado = proximaQuestaoSimulado;


function finalizarSimulado() {
  console.log('🏁 [SIMULADO] Finalizando simulado...');

  // Limpar timer
  if (simuladoAtual.timer) {
    clearInterval(simuladoAtual.timer);
    simuladoAtual.timer = null;
  }

  const total = simuladoAtual.acertos + simuladoAtual.erros;
  const taxa = total > 0 ? Math.round((simuladoAtual.acertos / total) * 100) : 0;

  document.getElementById('simuladoAcertos').textContent = simuladoAtual.acertos;
  document.getElementById('simuladoErros').textContent = simuladoAtual.erros;
  document.getElementById('simuladoTaxa').textContent = taxa + '%';

  document.getElementById('simuladoTimer').style.display = 'none';
  document.getElementById('focoPergunta').style.display = 'none';
  document.getElementById('btnMostrarResposta').style.display = 'none';
  document.getElementById('botoesResposta').style.display = 'none';
  document.getElementById('simuladoResultado').style.display = 'block';

  // Salvar no histórico
  apiFetch("historicosimulados", {
    method: "POST",
    body: JSON.stringify({
      data: new Date().toISOString(),
      materia: document.getElementById('simuladoMateria').value,
      acertos: simuladoAtual.acertos,
      erros: simuladoAtual.erros,
      taxa: taxa,
      total: total
    })
  }).then(response => {
    if (response.ok) {
      console.log('✅ Resultado de simulado salvo no banco de dados!');
    } else {
      console.error('❌ Erro ao salvar resultado de simulado');
    }
  }).catch(err => {
    console.error(err);
  });

  // RESETAR O ESTADO DO SIMULADO
  setTimeout(() => {
    simuladoAtual = {
      cards: [],
      indice: 0,
      acertos: 0,
      erros: 0,
      tempoPorQuestao: 60,
      timer: null,
      tempoRestante: 0,
      modo: 'treino',
      respondido: false
    };
    console.log('✅ [SIMULADO] Estado resetado para novo simulado');
  }, 500);
}


// ===== MOSTRAR RESPOSTA (CORRIGIDA) =====
function mostrarRespostaFoco() {
  console.log('👁️ Mostrando resposta...');
  
  document.getElementById('focoResposta').style.display = 'block';
  document.getElementById('btnMostrarResposta').style.display = 'none';
  
  // Mostrar botões de resposta
  const botoesResposta = document.getElementById('botoesResposta');
  botoesResposta.innerHTML = `
    <button class="btn-errei" onclick="responderContexto('errei')">❌ Errei</button>
    <button class="btn-acertei" onclick="responderContexto('acertei')">✅ Acertei</button>
    <button class="btn-facil" onclick="responderContexto('facil')">🚀 Muito Fácil!</button>
  `;
  botoesResposta.style.display = 'flex';
}

// ===== INICIALIZAÇÃO =====
async function initRevisao() {
  console.log('🚀 Inicializando sistema de revisão...');

  // Carregar matérias primeiro (aguardar completar)
  await carregarMateriasDoBackend();
  console.log('✅ Matérias carregadas:', materias);

  // Depois carregar flashcards
  await carregarFlashcardsDoBackend();
  console.log('✅ Flashcards carregados:', flashcards);

  // Popular filtros
  await popularFiltroMaterias();

  // Renderizar cards
  renderizarFlashcardsAgrupados();

  // Atualizar estatísticas
  atualizarEstatisticas();

  // Configurar abas
  configurarAbasRevisao();

  // Verificações
  verificarAcessoSimulado();
  verificarProvasProximas();
  verificarCardsAtrasados();

  console.log('✅ Sistema de revisão inicializado com sucesso!');
}

// ===== RENDERIZAR HISTÓRICO COMPLETO =====
function renderizarHistoricoCompleto() {
  const container = document.getElementById('historicoRevisoes');
  if (!container) return;

  container.innerHTML = '';

  // Coletar todas as revisões
  let todasRevisoes = [];
  flashcards.forEach(f => {
    if (f.historico) {
      f.historico.forEach(h => {
        todasRevisoes.push({
          ...h,
          pergunta: f.pergunta,
          materia: f.materiaNome,
          tema: f.tema
        });
      });
    }
  });

  // Ordenar por data (mais recente primeiro)
  todasRevisoes.sort((a, b) => new Date(b.data) - new Date(a.data));

  if (todasRevisoes.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:20px;">Nenhuma revisão ainda.</p>';
    return;
  }

  // Agrupar por data
  const porData = {};
  todasRevisoes.forEach(rev => {
    const data = new Date(rev.data).toLocaleDateString('pt-BR');
    if (!porData[data]) porData[data] = [];
    porData[data].push(rev);
  });

  // Renderizar agrupado por data
  for (const data in porData) {
    const revisoes = porData[data];
    const acertos = revisoes.filter(r => r.resultado === 'acertei' || r.resultado === 'facil').length;
    const taxa = Math.round((acertos / revisoes.length) * 100);

    let html = `
      <div style="margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #f9fafb; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #374151;">
            <i class="bi bi-calendar3"></i> ${data}
          </strong>
          <span style="font-size: 0.85rem; color: ${taxa >= 70 ? '#22c55e' : taxa >= 50 ? '#f59e0b' : '#ef4444'};">
            ${acertos}/${revisoes.length} acertos (${taxa}%)
          </span>
        </div>
        <div style="padding: 10px 15px;">
    `;

    revisoes.forEach(rev => {
      const icone = rev.resultado === 'acertei' ? '✅' : rev.resultado === 'facil' ? '🚀' : '❌';
      const cor = rev.resultado === 'acertei' ? '#22c55e' : rev.resultado === 'facil' ? '#3b82f6' : '#ef4444';

      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
          <div style="flex: 1;">
            <p style="margin: 0; font-size: 0.85rem; color: #374151;">${rev.pergunta.substring(0, 60)}...</p>
            <small style="color: #9ca3af;">${rev.materia} | ${rev.tema}</small>
          </div>
          <span style="font-size: 1.2rem; margin-left: 10px;">${icone}</span>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    container.innerHTML += html;
  }
}
// ===== APLICAR FILTROS NOS CARDS =====
function aplicarFiltrosCards() {
  const busca = document.getElementById('buscaFlashcard')?.value.toLowerCase() || '';
  const filtroMateria = document.getElementById('filtroMateriaRevisao')?.value || 'todas';

  let cardsFiltrados = [...flashcards];

  // Filtrar por matéria
  if (filtroMateria !== 'todas') {
    cardsFiltrados = cardsFiltrados.filter(f => f.materiaNome === filtroMateria);
  }

  // Filtrar por busca
  if (busca) {
    cardsFiltrados = cardsFiltrados.filter(f =>
      f.pergunta.toLowerCase().includes(busca) ||
      f.resposta.toLowerCase().includes(busca) ||
      f.tema.toLowerCase().includes(busca)
    );
  }

  const container = document.getElementById('listaFlashcardsAgrupada');
  if (!container) return;

  if (cardsFiltrados.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:40px;">Nenhum flashcard encontrado!</p>';
    return;
  }

  // Agrupar por matéria
  const porMateria = {};
  cardsFiltrados.forEach(f => {
    if (!porMateria[f.materiaNome]) porMateria[f.materiaNome] = { temas: {}, count: 0 };
    if (!porMateria[f.materiaNome].temas[f.tema]) porMateria[f.materiaNome].temas[f.tema] = [];
    porMateria[f.materiaNome].temas[f.tema].push(f);
    porMateria[f.materiaNome].count++;
  });

  let html = '';
  let index = 0;

  for (const materia in porMateria) {
    const materiaData = porMateria[materia];
    const materiaId = 'materia-' + index;

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
        <div class="materia-conteudo" id="${materiaId}-conteudo" style="display:none;">
    `;

    for (const tema in materiaData.temas) {
      const cards = materiaData.temas[tema];

      html += `
        <div class="tema-grupo">
          <div class="tema-header">
            <i class="bi bi-folder2"></i>
            <h4>${tema}</h4>
            <span class="tema-badge-count">${cards.length}</span>
          </div>
      `;

      cards.forEach(f => {
        const isAtrasada = f.dataProxima < hoje();
        const isHoje = f.dataProxima === hoje();
        const classeDestaque = isAtrasada ? 'atrasada' : (isHoje ? 'hoje' : '');

        html += `
          <div class="card-flashcard ${classeDestaque}">
            <div class="card-pergunta">${f.pergunta}</div>
            <div class="card-data">📅 ${formatarData(f.dataProxima)} | Nível: ${f.nivel || 0}</div>
            <div class="card-acoes">
              <button onclick="editarFlashcard(${f.id})"><i class="bi bi-pencil"></i></button>
              <button onclick="excluirFlashcard(${f.id})"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        `;
      });

      html += '</div>';
    }

    html += '</div></div>';
    index++;
  }

  container.innerHTML = html;
}
// ===== ATUALIZAR MENSAGEM (VERSÃO ATUALIZADA) =====
function atualizarMensagemRevisar() {
  const hojeData = hoje();
  const filtroMateria = document.getElementById('filtroMateriaRevisaoModo')?.value || 'todas';

  let pendentes = flashcards.filter(f => f.dataProxima <= hojeData);
  if (filtroMateria !== 'todas') {
    pendentes = pendentes.filter(f => f.materiaNome === filtroMateria);
  }

  const countEl = document.getElementById('countPendentes');
  if (countEl) {
    countEl.textContent = pendentes.length;
    countEl.style.color = pendentes.length === 0 ? '#22c55e' : pendentes.length > 10 ? '#ef4444' : '#f59e0b';
  }

  // Atualizar texto de próxima revisão
  const textoProxima = document.getElementById('textoProximaRevisao');
  if (textoProxima) {
    if (pendentes.length === 0) {
      textoProxima.textContent = '✨ Tudo revisado por hoje!';
    } else {
      const atrasados = pendentes.filter(f => f.dataProxima < hojeData).length;
      if (atrasados > 0) {
        textoProxima.textContent = `⚠️ ${atrasados} card(s) atrasado(s)!`;
      } else {
        textoProxima.textContent = '📅 Revisão de hoje!';
      }
    }
  }
}
// ===== INICIAR REVISÃO (COM FILTRO) =====
function iniciarRevisao() {
  const hojeData = hoje();
  const filtroMateria = document.getElementById('filtroMateriaRevisaoModo')?.value || 'todas';

  let cardsPendentes = flashcards.filter(f => !f.dataProxima || f.dataProxima <= hojeData);
  if (filtroMateria !== 'todas') {
    cardsPendentes = cardsPendentes.filter(f => f.materiaNome === filtroMateria);
  }

  if (cardsPendentes.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'Nada para revisar!',
      text: 'Todos os cards foram revisados!'
    });
    return;
  }

  revisoesEmAndamento = cardsPendentes.sort(() => Math.random() - 0.5);
  indiceAtualFoco = 0;
  mostrarCardFoco();
}

// ===== INICIAR REVISÃO LIVRE (COM FILTRO) =====
function iniciarRevisaoLivre() {
  const filtroMateria = document.getElementById('filtroMateriaRevisaoModo')?.value || 'todas';

  let cardsLivres = [...flashcards];
  if (filtroMateria !== 'todas') {
    cardsLivres = cardsLivres.filter(f => f.materiaNome === filtroMateria);
  }

  revisoesEmAndamento = cardsLivres;
  indiceAtualFoco = 0;

  if (revisoesEmAndamento.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'Nenhum card!',
      text: 'Crie flashcards primeiro.'
    });
    return;
  }

  mostrarCardFoco();
}
// ===== RESPONDER FLASHCARD (COM AVISO DE PRÓXIMA REVISÃO) =====
// ===== RESPONDER FLASHCARD (CORRIGIDA) =====
function responderFlashcard(resultado) {
  console.log('🔄 [REVISÃO] Respondendo:', resultado);
  console.log('📊 Índice atual:', indiceAtualFoco);
  console.log('📊 Total cards:', revisoesEmAndamento.length);
  
  if (indiceAtualFoco >= revisoesEmAndamento.length) {
    console.log('⚠️ Índice fora do limite!');
    return;
  }
  
  const card = revisoesEmAndamento[indiceAtualFoco];
  console.log('📋 Card:', card);
  
  const original = flashcards.find(f => f.id === card.id);
  if (!original) {
    console.log('❌ Card original não encontrado!');
    return;
  }
  
  let dias = 1;
  
  if (resultado === 'acertei') {
    original.nivel = Math.min((original.nivel || 0) + 1, 4);
    original.acertos = (original.acertos || 0) + 1;
    dias = intervalosRevisao[original.nivel] || 1;
  } else if (resultado === 'errei') {
    original.nivel = 0;
    original.erros = (original.erros || 0) + 1;
    dias = 1;
  } else if (resultado === 'facil') {
    original.nivel = Math.min((original.nivel || 0) + 2, 4);
    original.acertos = (original.acertos || 0) + 1;
    dias = intervalosRevisao[original.nivel] || 1;
  }
  
  const novaData = new Date();
  novaData.setDate(novaData.getDate() + dias);
  original.dataProxima = novaData.toISOString().split('T')[0];
  
  if (!original.historico) original.historico = [];
  original.historico.push({
    data: new Date().toISOString(),
    resultado: resultado,
    intervalo: dias
  });

  // Salvar progresso diretamente no banco de dados
  apiFetch(`flashcards/${original.id}`, {
    method: "PUT",
    body: JSON.stringify({
      pergunta: original.pergunta,
      resposta: original.resposta,
      tema: JSON.stringify({
        tema: original.tema,
        nivel: original.nivel,
        dataProxima: original.dataProxima,
        acertos: original.acertos,
        erros: original.erros,
        historico: original.historico.slice(-20)
      })
    })
  }).catch(err => console.error("Erro ao sincronizar flashcard com banco:", err));

  atualizarEstatisticas();
  
  // Mostrar aviso
  if (resultado === 'acertei' || resultado === 'facil') {
    mostrarToast(`📅 Revise novamente em ${dias} dia(s)`, '#22c55e');
  } else {
    mostrarToast('🔄 Revise amanhã!', '#f59e0b');
  }
  
  // AVANÇAR PARA O PRÓXIMO CARD
  indiceAtualFoco++;
  
  if (indiceAtualFoco >= revisoesEmAndamento.length) {
    console.log('🏁 Finalizando revisão...');
    finalizarRevisao();
  } else {
    console.log('➡️ Mostrando próximo card...');
    mostrarCardFoco();
  }
}
// ===== MOSTRAR TOAST =====
function mostrarToast(mensagem, cor = '#22c55e') {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'info',
    title: mensagem,
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    background: '#fff',
    customClass: {
      popup: 'colored-toast'
    }
  });
}

// ===== EXPORTAR NOVAS FUNÇÕES =====
window.trocarAbaRevisao = trocarAbaRevisao;
window.verificarAcessoSimulado = verificarAcessoSimulado;
window.atualizarContadoresRevisao = atualizarContadoresRevisao;
window.carregarOpcoesSimulado = carregarOpcoesSimulado;
window.selecionarNumQuestoes = selecionarNumQuestoes;
window.iniciarSimulado = iniciarSimulado;
window.responderSimulado = responderSimulado;
window.finalizarSimulado = finalizarSimulado;
window.renderizarHistoricoCompleto = renderizarHistoricoCompleto;
window.aplicarFiltrosCards = aplicarFiltrosCards;
window.mostrarToast = mostrarToast;


// ===== ABRIR MODAL NOVA MATÉRIA =====
function abrirModalNovaMateria() {
  console.log('📚 [ABRIR] Abrindo modal de nova matéria...');

  // Fecha o modal de flashcard se estiver aberto
  const modalFlashcard = document.getElementById('modalRevisao');
  if (modalFlashcard) {
    const modalFlashcardInstance = bootstrap.Modal.getInstance(modalFlashcard);
    if (modalFlashcardInstance) modalFlashcardInstance.hide();
  }

  // Limpa os campos usando os IDs CORRETOS do HTML
  const nomeInput = document.getElementById('novaMateriaRevisaoNome');
  const corInput = document.getElementById('novaMateriaRevisaoCor');

  if (nomeInput) nomeInput.value = '';
  if (corInput) corInput.value = '#9f042c';

  // Abre o modal de nova matéria usando o ID CORRETO
  const modalNovaMateria = document.getElementById('modalNovaMateriaRevisao');
  if (modalNovaMateria) {
    const modalInstance = new bootstrap.Modal(modalNovaMateria);
    modalInstance.show();
    console.log('✅ Modal de nova matéria aberto!');
  } else {
    console.error('❌ Modal modalNovaMateriaRevisao não encontrado!');
  }
}

// ===== SALVAR NOVA MATÉRIA =====
async function salvarNovaMateriaRevisao() {
  console.log('💾 [SALVAR] Salvando nova matéria...');

  // Usando os IDs CORRETOS do HTML
  const nomeInput = document.getElementById('novaMateriaRevisaoNome');
  const corInput = document.getElementById('novaMateriaRevisaoCor');

  if (!nomeInput || !corInput) {
    console.error('❌ Campos não encontrados!');
    Swal.fire({
      icon: 'error',
      title: 'Erro!',
      text: 'Campos não encontrados!'
    });
    return;
  }

  const nome = nomeInput.value.trim();
  const cor = corInput.value;

  if (!nome) {
    Swal.fire({
      icon: 'warning',
      title: 'Digite um nome!',
      timer: 1500,
      showConfirmButton: false
    });
    nomeInput.focus();
    return;
  }

  // Verifica se já existe
  if (materias && materias.some(m => m.nome.toLowerCase() === nome.toLowerCase())) {
    Swal.fire({
      icon: 'warning',
      title: 'Matéria já existe!',
      timer: 1500,
      showConfirmButton: false
    });
    return;
  }

  try {
    // Tentar salvar no backend
    let novaMateria = null;

    if (typeof apiFetch === 'function') {
      const response = await apiFetch('materias', {
        method: 'POST',
        body: JSON.stringify({ nome: nome, cor: cor })
      });

      if (response.ok) {
        novaMateria = await response.json();
        console.log('✅ Matéria salva no backend:', novaMateria);
      }
    }

    // Se não salvou no backend, cria localmente
    if (!novaMateria) {
      novaMateria = {
        id: Date.now(),
        nome: nome,
        cor: cor
      };
      console.log('📦 Matéria criada localmente:', novaMateria);
    }

    // Adiciona na lista local
    if (!materias) materias = [];
    materias.push(novaMateria);

    // Fecha o modal usando o ID CORRETO
    const modalNovaMateria = document.getElementById('modalNovaMateriaRevisao');
    if (modalNovaMateria) {
      const modalInstance = bootstrap.Modal.getInstance(modalNovaMateria);
      if (modalInstance) {
        modalInstance.hide();
      }
    }

    // Atualiza os filtros e listas
    if (typeof popularFiltroMaterias === 'function') popularFiltroMaterias();
    if (typeof renderMaterias === 'function') renderMaterias();

    // Limpa os campos
    nomeInput.value = '';
    corInput.value = '#9f042c';

    Swal.fire({
      icon: 'success',
      title: 'Matéria criada!',
      timer: 1500,
      showConfirmButton: false
    });

  } catch (err) {
    console.error('❌ Erro ao criar matéria:', err);

    // Fallback local
    const novaMateria = {
      id: Date.now(),
      nome: nome,
      cor: cor
    };

    if (!materias) materias = [];
    materias.push(novaMateria);

    // Fecha o modal
    const modalNovaMateria = document.getElementById('modalNovaMateriaRevisao');
    if (modalNovaMateria) {
      const modalInstance = bootstrap.Modal.getInstance(modalNovaMateria);
      if (modalInstance) {
        modalInstance.hide();
      }
    }

    // Atualiza os filtros
    if (typeof popularFiltroMaterias === 'function') popularFiltroMaterias();
    if (typeof renderMaterias === 'function') renderMaterias();

    Swal.fire({
      icon: 'success',
      title: 'Matéria criada!',
      timer: 1500,
      showConfirmButton: false
    });
  }
}
// ===== INICIALIZAÇÃO DA REVISÃO =====
// Chama initRevisao quando a página carregar
document.addEventListener('DOMContentLoaded', function () {
  console.log('📄 Página carregada, iniciando sistema...');

  // Inicia a revisão apenas se a seção estiver visível
  const revisaoSection = document.getElementById('revisaoSection');
  if (revisaoSection && revisaoSection.style.display !== 'none') {
    initRevisao();
  }
});

// Função para mostrar a seção de revisão (chame quando navegar para revisão)
function mostrarSecaoRevisao() {
  const revisaoSection = document.getElementById('revisaoSection');
  if (revisaoSection) {
    revisaoSection.style.display = 'block';
    initRevisao(); // Inicializa a revisão
  }
}

// ===== FUNÇÃO UNIVERSAL DE RESPOSTA =====
// ===== FUNÇÃO UNIVERSAL DE RESPOSTA (CORRIGIDA) =====
function responderContexto(resultado) {
  console.log('🎯 [RESPOSTA] Resultado:', resultado);
  console.log('📊 Simulado cards:', simuladoAtual.cards.length);
  console.log('📊 Revisões em andamento:', revisoesEmAndamento.length);
  console.log('📊 Índice foco:', indiceAtualFoco);
  
  // Verifica se está em modo simulado
  const containerSimulado = document.getElementById('modoFocoContainer');
  const timerSimulado = document.getElementById('simuladoTimer');
  
  if (timerSimulado && timerSimulado.style.display === 'block') {
    // Está no simulado
    console.log('✅ Modo: Simulado');
    responderSimulado(resultado);
  } else if (revisoesEmAndamento.length > 0) {
    // Está na revisão normal
    console.log('✅ Modo: Revisão Normal');
    responderFlashcard(resultado);
  } else {
    console.log('⚠️ Nenhum modo ativo!');
  }
}
// ===== EXPORTAR =====
window.responderContexto = responderContexto;
window.abrirModalNovaMateria = abrirModalNovaMateria;
window.salvarNovaMateriaRevisao = salvarNovaMateriaRevisao;
window.mostrarSecaoRevisao = mostrarSecaoRevisao;

// =============================================
// ===== LEITURA SAVORING - VERSÃO FINAL =====
// =============================================

let leituraSavoringAtual = {
  titulo: '',
  texto: '',
  trechos: [],
  trechoAtual: 0,
  anotacoes: [],
  timer: null,
  tempoRestante: 0,
  tempoPorTrecho: 2,
  pausado: false,
  leituraSalva: false,
  idLeituraSalva: null
};

// ===== ABRIR MODAL =====
function abrirLeituraSavoring() {
  console.log('📖 [LEITURA] Abrindo Leitura Savoring...');
  
  // Resetar campos
  document.getElementById('leituraTitulo').value = '';
  document.getElementById('leituraTexto').value = '';
  document.getElementById('leituraTempoTrecho').value = '2';
  
  // Resetar estado
  leituraSavoringAtual = {
    titulo: '',
    texto: '',
    trechos: [],
    trechoAtual: 0,
    anotacoes: [],
    timer: null,
    tempoRestante: 0,
    tempoPorTrecho: 2,
    pausado: false,
    leituraSalva: false,
    idLeituraSalva: null
  };
  
  // Mostrar passo 1
  document.getElementById('leituraInicio').style.display = 'block';
  document.getElementById('leituraModo').style.display = 'none';
  document.getElementById('leituraReflexao').style.display = 'none';
  document.getElementById('leituraResumo').style.display = 'none';
  
  // Resetar histórico
  const listaHistorico = document.getElementById('leituraHistoricoLista');
  if (listaHistorico) listaHistorico.style.display = 'none';
  const setaHistorico = document.getElementById('leituraHistoricoSeta');
  if (setaHistorico) setaHistorico.style.transform = 'rotate(0deg)';
  carregarHistoricoLeituras();
  
  // Mostrar modal
  document.getElementById('leituraSavoringModalOverlay').style.display = 'flex';
}

// ===== FECHAR MODAL =====
function fecharLeituraSavoring() {
  console.log('📖 [LEITURA] Fechando Leitura Savoring...');
  
  if (leituraSavoringAtual.timer) {
    clearInterval(leituraSavoringAtual.timer);
    leituraSavoringAtual.timer = null;
  }
  
  document.getElementById('leituraSavoringModalOverlay').style.display = 'none';
}

// ===== INICIAR LEITURA =====
function iniciarLeituraSavoring() {
  const titulo = document.getElementById('leituraTitulo').value.trim();
  const texto = document.getElementById('leituraTexto').value.trim();
  const tempoPorTrecho = parseInt(document.getElementById('leituraTempoTrecho').value);
  
  console.log('⏱️ Tempo selecionado:', tempoPorTrecho, 'minutos');
  
  if (!titulo) {
    Swal.fire({ icon: 'warning', title: 'Digite um título!', timer: 1500, showConfirmButton: false });
    return;
  }
  
  if (!texto) {
    Swal.fire({ icon: 'warning', title: 'Cole o texto para leitura!', timer: 1500, showConfirmButton: false });
    return;
  }
  
  const trechos = dividirTextoEmTrechos(texto);
  
  leituraSavoringAtual = {
    titulo: titulo,
    texto: texto,
    trechos: trechos,
    trechoAtual: 0,
    anotacoes: [],
    timer: null,
    tempoRestante: tempoPorTrecho * 60, // ← USA O VALOR CORRETO
    tempoPorTrecho: tempoPorTrecho,
    pausado: false,
    leituraSalva: false,
    idLeituraSalva: null
  };
  
  // Mostrar modo leitura
  document.getElementById('leituraInicio').style.display = 'none';
  document.getElementById('leituraModo').style.display = 'block';
  document.getElementById('leituraReflexao').style.display = 'none';
  document.getElementById('leituraResumo').style.display = 'none';
  
  // Mostrar primeiro trecho
  mostrarTrechoLeitura();
}

// ===== MOSTRAR TRECHO ATUAL (CORRIGIDO) =====
function mostrarTrechoLeitura() {
  const { trechos, trechoAtual, titulo, tempoPorTrecho } = leituraSavoringAtual;
  
  if (trechoAtual >= trechos.length) {
    mostrarResumoLeitura();
    return;
  }
  
  document.getElementById('leituraTituloAtual').textContent = titulo;
  document.getElementById('leituraTrechoAtual').textContent = trechoAtual + 1;
  document.getElementById('leituraTrechoTotal').textContent = trechos.length;
  document.getElementById('leituraTrechoTexto').textContent = trechos[trechoAtual];
  
  // USAR O VALOR CORRETO DE tempoPorTrecho
  leituraSavoringAtual.tempoRestante = leituraSavoringAtual.tempoPorTrecho * 60;
  leituraSavoringAtual.pausado = false;
  
  console.log('⏱️ Timer iniciado com:', leituraSavoringAtual.tempoPorTrecho, 'minutos =', leituraSavoringAtual.tempoRestante, 'segundos');
  
  // ATUALIZAR O DISPLAY DO TIMER IMEDIATAMENTE
  atualizarTimerLeitura();
  
  document.getElementById('btnPausarLeitura').innerHTML = '<i class="bi bi-pause-fill"></i> Pausar';
  document.getElementById('btnPausarLeitura').style.background = '#f59e0b';
  
  iniciarTimerLeitura();
}

// ===== INICIAR TIMER (CORRIGIDO) =====
function iniciarTimerLeitura() {
  // LIMPAR TIMER ANTERIOR
  if (leituraSavoringAtual.timer) {
    clearInterval(leituraSavoringAtual.timer);
    leituraSavoringAtual.timer = null;
  }
  
  // ATUALIZAR DISPLAY ANTES DE INICIAR
  atualizarTimerLeitura();
  
  leituraSavoringAtual.timer = setInterval(() => {
    if (!leituraSavoringAtual.pausado) {
      leituraSavoringAtual.tempoRestante--;
      atualizarTimerLeitura();
      
      if (leituraSavoringAtual.tempoRestante <= 0) {
        clearInterval(leituraSavoringAtual.timer);
        leituraSavoringAtual.timer = null;
        
        Swal.fire({
          icon: 'info',
          title: 'Tempo esgotado!',
          text: 'Hora de refletir sobre o que leu.',
          timer: 2000,
          showConfirmButton: false
        });
        
        setTimeout(() => {
          mostrarReflexaoLeitura();
        }, 2000);
      }
    }
  }, 1000);
}

// ===== ATUALIZAR TIMER (CORRIGIDO) =====
function atualizarTimerLeitura() {
  const minutos = Math.floor(leituraSavoringAtual.tempoRestante / 60);
  const segundos = leituraSavoringAtual.tempoRestante % 60;
  const display = document.getElementById('leituraTimer');
  
  if (display) {
    display.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  }
}

// ===== DIVIDIR TEXTO EM TRECHOS =====
function dividirTextoEmTrechos(texto) {
  const paragrafos = texto.split('\n').filter(p => p.trim().length > 0);
  
  if (paragrafos.length <= 1) {
    const frases = texto.split(/(?<=[.!?])\s+/).filter(f => f.trim().length > 0);
    const trechos = [];
    for (let i = 0; i < frases.length; i += 3) {
      trechos.push(frases.slice(i, i + 3).join(' '));
    }
    return trechos.length > 0 ? trechos : [texto];
  }
  
  return paragrafos;
}

// ===== PAUSAR LEITURA =====
function pausarLeituraSavoring() {
  leituraSavoringAtual.pausado = !leituraSavoringAtual.pausado;
  
  const btn = document.getElementById('btnPausarLeitura');
  if (leituraSavoringAtual.pausado) {
    btn.innerHTML = '<i class="bi bi-play-fill"></i> Continuar';
    btn.style.background = '#22c55e';
  } else {
    btn.innerHTML = '<i class="bi bi-pause-fill"></i> Pausar';
    btn.style.background = '#f59e0b';
  }
}

// ===== PRÓXIMO TRECHO =====
function proximoTrechoLeitura() {
  if (leituraSavoringAtual.timer) {
    clearInterval(leituraSavoringAtual.timer);
    leituraSavoringAtual.timer = null;
  }
  
  mostrarReflexaoLeitura();
}

// ===== MOSTRAR REFLEXÃO =====
function mostrarReflexaoLeitura() {
  document.getElementById('leituraModo').style.display = 'none';
  document.getElementById('leituraReflexao').style.display = 'block';
  document.getElementById('leituraAnotacao').value = '';
  document.getElementById('leituraAnotacao').focus();
}

// ===== SALVAR REFLEXÃO =====
function salvarReflexaoLeitura() {
  const anotacao = document.getElementById('leituraAnotacao').value.trim();
  const { trechos, trechoAtual } = leituraSavoringAtual;
  
  if (anotacao) {
    leituraSavoringAtual.anotacoes.push({
      id: Date.now(),
      trecho: trechoAtual + 1,
      texto: anotacao,
      data: new Date().toISOString()
    });
  }
  
  leituraSavoringAtual.trechoAtual++;
  
  if (leituraSavoringAtual.trechoAtual >= trechos.length) {
    mostrarResumoLeitura();
  } else {
    document.getElementById('leituraReflexao').style.display = 'none';
    document.getElementById('leituraModo').style.display = 'block';
    mostrarTrechoLeitura();
  }
}

// ===== PULAR REFLEXÃO =====
function pularReflexaoLeitura() {
  leituraSavoringAtual.trechoAtual++;
  
  if (leituraSavoringAtual.trechoAtual >= leituraSavoringAtual.trechos.length) {
    mostrarResumoLeitura();
  } else {
    document.getElementById('leituraReflexao').style.display = 'none';
    document.getElementById('leituraModo').style.display = 'block';
    mostrarTrechoLeitura();
  }
}

// ===== MOSTRAR RESUMO (NÃO FECHA) =====
function mostrarResumoLeitura() {
  if (leituraSavoringAtual.timer) {
    clearInterval(leituraSavoringAtual.timer);
    leituraSavoringAtual.timer = null;
  }
  
  document.getElementById('leituraModo').style.display = 'none';
  document.getElementById('leituraReflexao').style.display = 'none';
  document.getElementById('leituraResumo').style.display = 'block';
  
  renderizarResumoAnotacoes();
  
  // Salvar no histórico APENAS UMA VEZ
  if (!leituraSavoringAtual.leituraSalva) {
    salvarLeituraNoHistorico();
    leituraSavoringAtual.leituraSalva = true;
  }
}

// ===== RENDERIZAR RESUMO COM ANOTAÇÕES (COM TEXTO DO TRECHO) =====
function renderizarResumoAnotacoes() {
  const container = document.getElementById('leituraResumoAnotacoes');
  
  if (leituraSavoringAtual.anotacoes.length === 0) {
    container.innerHTML = '<p style="color: #9ca3af; text-align: center;">Nenhuma anotação feita.</p>';
  } else {
    container.innerHTML = leituraSavoringAtual.anotacoes.map((a, index) => {
      // Buscar o texto do trecho correspondente
      const textoTrecho = leituraSavoringAtual.trechos[a.trecho - 1] || 'Texto não disponível';
      
      return `
        <div style="background: #f9fafb; border-radius: 12px; padding: 15px; margin-bottom: 10px; border-left: 4px solid var(--cor-primaria);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
            <strong style="color: #4b5563; font-size: 0.8rem;">📖 Trecho ${a.trecho}:</strong>
            <div style="display: flex; gap: 5px;">
              <button onclick="editarAnotacaoLeitura(${index})" 
                      style="background: #e0f2fe; color: #0284c7; border: none; padding: 4px 10px; border-radius: 15px; cursor: pointer; font-size: 0.7rem;">
                <i class="bi bi-pencil"></i> Editar
              </button>
              <button onclick="excluirAnotacaoLeitura(${index})" 
                      style="background: #fee2e2; color: #dc2626; border: none; padding: 4px 10px; border-radius: 15px; cursor: pointer; font-size: 0.7rem;">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
          
          <!-- TEXTO DO TRECHO -->
          <div style="background: white; border-radius: 8px; padding: 10px; margin: 10px 0; font-size: 0.8rem; color: #6b7280; border: 1px solid #e5e7eb; max-height: 80px; overflow-y: auto;">
            ${textoTrecho}
          </div>
          
          <!-- ANOTAÇÃO -->
          <div style="background: #f0fdf4; border-radius: 8px; padding: 10px; border: 1px solid #bbf7d0;">
            <strong style="color: #16a34a; font-size: 0.75rem;">✏️ Minha anotação:</strong>
            <p style="margin: 5px 0 0; color: #374151; font-size: 0.9rem;">${a.texto}</p>
          </div>
        </div>
      `;
    }).join('');
  }
}

// ===== SALVAR NO HISTÓRICO (COM TEXTO DOS TRECHOS) =====
function salvarLeituraNoHistorico() {
  apiFetch("historicoleituras", {
    method: "POST",
    body: JSON.stringify({
      titulo: leituraSavoringAtual.titulo,
      data: new Date().toISOString(),
      totalTrechos: leituraSavoringAtual.trechos.length,
      trechos: leituraSavoringAtual.trechos.map((texto, index) => ({
        numero: index + 1,
        texto: texto
      })),
      anotacoes: JSON.parse(JSON.stringify(leituraSavoringAtual.anotacoes)),
      textoCompleto: leituraSavoringAtual.texto
    })
  }).then(response => {
    if (response.ok) {
      response.json().then(res => {
        leituraSavoringAtual.idLeituraSalva = res.id_leitura;
        console.log('✅ [LEITURA] Salva no banco, ID:', res.id_leitura);
        carregarHistoricoLeituras().then(() => {
          renderizarHistoricoLeituras();
        });
        mostrarToast('✅ Leitura salva com sucesso!', '#22c55e');
      });
    } else {
      mostrarToast('❌ Erro ao salvar leitura', '#ef4444');
    }
  }).catch(err => {
    console.error(err);
    mostrarToast('❌ Erro ao salvar leitura', '#ef4444');
  });
}

// ===== RENDERIZAR LEITURA SALVA (COM TEXTO DO TRECHO) =====
function renderizarLeituraSalva(leitura) {
  let html = `
    <div style="margin-bottom: 20px; text-align: center;">
      <h4 style="color: #374151; margin-bottom: 5px;">${leitura.titulo}</h4>
      <small style="color: #9ca3af;">${new Date(leitura.data).toLocaleDateString('pt-BR')} • ${leitura.totalTrechos} trecho(s)</small>
    </div>
  `;
  
  if (leitura.anotacoes && leitura.anotacoes.length > 0) {
    html += leitura.anotacoes.map((a, index) => {
      // Encontrar o texto do trecho correspondente
      const trechoInfo = leitura.trechos ? leitura.trechos.find(t => t.numero === a.trecho) : null;
      const textoTrecho = trechoInfo ? trechoInfo.texto : 'Texto do trecho não disponível';
      
      return `
        <div style="background: #f9fafb; border-radius: 12px; padding: 15px; margin-bottom: 12px; border-left: 4px solid var(--cor-primaria);">
          <!-- CABEÇALHO COM NÚMERO DO TRECHO E BOTÃO EDITAR -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="color: #4b5563; font-size: 0.85rem;">
              📖 Trecho ${a.trecho}
            </strong>
            <button onclick="editarAnotacaoDoHistorico(${leitura.id}, ${index})" 
                    style="background: #e0f2fe; color: #0284c7; border: none; padding: 5px 10px; border-radius: 15px; cursor: pointer; font-size: 0.7rem;">
              <i class="bi bi-pencil"></i> Editar
            </button>
          </div>
          
          <!-- TEXTO DO TRECHO -->
          <div style="background: white; border-radius: 8px; padding: 10px; margin-bottom: 10px; font-size: 0.8rem; color: #6b7280; border: 1px solid #e5e7eb; max-height: 100px; overflow-y: auto;">
            ${textoTrecho}
          </div>
          
          <!-- ANOTAÇÃO DO USUÁRIO -->
          <div style="background: #f0fdf4; border-radius: 8px; padding: 10px; border: 1px solid #bbf7d0;">
            <strong style="color: #16a34a; font-size: 0.75rem;">✏️ Minha anotação:</strong>
            <p style="margin: 5px 0 0; color: #374151; font-size: 0.85rem;">${a.texto}</p>
          </div>
        </div>
      `;
    }).join('');
  } else {
    html += '<p style="color: #9ca3af; text-align: center;">Nenhuma anotação feita.</p>';
  }
  
  Swal.fire({
    title: '📖 Leitura Salva',
    html: html,
    showConfirmButton: true,
    confirmButtonText: 'Fechar',
    confirmButtonColor: '#9f042c',
    width: '650px',
    customClass: {
      htmlContainer: 'swal-texto-trecho'
    }
  });
}

// ===== EDITAR ANOTAÇÃO DO HISTÓRICO (MOSTRANDO O TRECHO) =====
function editarAnotacaoDoHistorico(leituraId, anotacaoIndex) {
  const leitura = historicoLeituras.find(l => l.id === leituraId);
  
  if (!leitura || !leitura.anotacoes[anotacaoIndex]) return;
  
  const anotacao = leitura.anotacoes[anotacaoIndex];
  
  // Encontrar o texto do trecho
  const trechoInfo = leitura.trechos ? leitura.trechos.find(t => t.numero === anotacao.trecho) : null;
  const textoTrecho = trechoInfo ? trechoInfo.texto : '';
  
  Swal.fire({
    title: `✏️ Editar - Trecho ${anotacao.trecho}`,
    html: `
      <div style="text-align: left; margin-bottom: 15px;">
        <strong style="color: #4b5563; font-size: 0.8rem;">📖 Texto do trecho:</strong>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; margin-top: 5px; max-height: 100px; overflow-y: auto; font-size: 0.8rem; color: #6b7280;">
          ${textoTrecho || 'Texto não disponível'}
        </div>
      </div>
      
      <div style="text-align: left;">
        <strong style="color: #16a34a; font-size: 0.8rem;">✏️ Sua anotação:</strong>
      </div>
    `,
    input: 'textarea',
    inputValue: anotacao.texto,
    inputPlaceholder: 'Edite sua reflexão...',
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-check-lg"></i> Salvar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#9f042c',
    cancelButtonColor: '#6b7280',
    width: '600px',
    inputValidator: (value) => {
      if (!value || !value.trim()) {
        return 'A anotação não pode ficar vazia!';
      }
      return null;
    }
  }).then(result => {
    if (result.isConfirmed) {
      leitura.anotacoes[anotacaoIndex].texto = result.value.trim();
      leitura.anotacoes[anotacaoIndex].data = new Date().toISOString();
      
      apiFetch(`historicoleituras/${leituraId}`, {
        method: "PUT",
        body: JSON.stringify({
          anotacoes: leitura.anotacoes
        })
      }).then(response => {
        if (response.ok) {
          renderizarLeituraSalva(leitura);
          carregarHistoricoLeituras().then(() => renderizarHistoricoLeituras());
          mostrarToast('✅ Anotação updated!', '#22c55e');
        } else {
          mostrarToast('❌ Erro ao atualizar anotação', '#ef4444');
        }
      });
    }
  });
}

// ===== ATUALIZAR NO HISTÓRICO =====
function atualizarLeituraNoHistorico() {
  if (leituraSavoringAtual.idLeituraSalva) {
    apiFetch(`historicoleituras/${leituraSavoringAtual.idLeituraSalva}`, {
      method: "PUT",
      body: JSON.stringify({
        anotacoes: JSON.parse(JSON.stringify(leituraSavoringAtual.anotacoes))
      })
    }).then(response => {
      if (response.ok) {
        carregarHistoricoLeituras().then(() => renderizarHistoricoLeituras());
      }
    });
  }
}

// ===== EDITAR ANOTAÇÃO (DO RESUMO) =====
function editarAnotacaoLeitura(index) {
  const anotacao = leituraSavoringAtual.anotacoes[index];
  if (!anotacao) return;
  
  Swal.fire({
    title: `✏️ Editar Anotação - Trecho ${anotacao.trecho}`,
    input: 'textarea',
    inputValue: anotacao.texto,
    inputPlaceholder: 'Edite sua reflexão...',
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-check-lg"></i> Salvar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#9f042c',
    cancelButtonColor: '#6b7280',
    inputValidator: (value) => {
      if (!value || !value.trim()) {
        return 'A anotação não pode ficar vazia!';
      }
      return null;
    }
  }).then(result => {
    if (result.isConfirmed) {
      leituraSavoringAtual.anotacoes[index].texto = result.value.trim();
      leituraSavoringAtual.anotacoes[index].data = new Date().toISOString();
      
      atualizarLeituraNoHistorico();
      renderizarResumoAnotacoes();
      
      mostrarToast('✅ Anotação atualizada!', '#22c55e');
    }
  });
}

// ===== EXCLUIR ANOTAÇÃO =====
function excluirAnotacaoLeitura(index) {
  Swal.fire({
    title: 'Excluir anotação?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444'
  }).then(result => {
    if (result.isConfirmed) {
      leituraSavoringAtual.anotacoes.splice(index, 1);
      atualizarLeituraNoHistorico();
      renderizarResumoAnotacoes();
      mostrarToast('🗑️ Anotação excluída!', '#ef4444');
    }
  });
}

let historicoLeituras = [];

// ===== CARREGAR HISTÓRICO =====
async function carregarHistoricoLeituras() {
  try {
    const response = await apiFetch("historicoleituras");
    if (response.ok) {
      historicoLeituras = await response.json();
      historicoLeituras.forEach(l => {
        l.id = l.id_leitura;
        if (typeof l.trechos === 'string') {
          try { l.trechos = JSON.parse(l.trechos); } catch (e) { l.trechos = []; }
        }
        if (typeof l.anotacoes === 'string') {
          try { l.anotacoes = JSON.parse(l.anotacoes); } catch (e) { l.anotacoes = []; }
        }
      });
      const count = document.getElementById('leituraHistoricoCount');
      if (count) count.textContent = historicoLeituras.length;
      return historicoLeituras;
    }
  } catch (err) {
    console.error("Erro ao carregar histórico de leituras:", err);
  }
  return [];
}

// ===== TOGGLE HISTÓRICO =====
function toggleHistoricoLeituras() {
  const lista = document.getElementById('leituraHistoricoLista');
  const seta = document.getElementById('leituraHistoricoSeta');
  
  if (lista.style.display === 'none') {
    lista.style.display = 'block';
    seta.style.transform = 'rotate(180deg)';
    carregarHistoricoLeituras().then(() => renderizarHistoricoLeituras());
  } else {
    lista.style.display = 'none';
    seta.style.transform = 'rotate(0deg)';
  }
}

// ===== RENDERIZAR HISTÓRICO =====
function renderizarHistoricoLeituras() {
  const container = document.getElementById('leituraHistoricoLista');
  if (!container) return;
  
  if (historicoLeituras.length === 0) {
    container.innerHTML = '<p style="color: #9ca3af; text-align: center; font-size: 0.8rem;">Nenhuma leitura salva ainda.</p>';
    return;
  }
  
  const histCopy = [...historicoLeituras];
  histCopy.sort((a, b) => new Date(b.data) - new Date(a.data));
  
  container.innerHTML = histCopy.map(leitura => `
    <div style="background: white; border-radius: 10px; padding: 12px; margin-bottom: 8px; border: 1px solid #e5e7eb; cursor: pointer; transition: 0.2s;"
         onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'"
         onmouseout="this.style.boxShadow='none'"
         onclick="verLeituraSalva(${leitura.id})">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
        <div style="flex: 1;">
          <strong style="font-size: 0.85rem; color: #374151; display: block;">${leitura.titulo}</strong>
          <small style="color: #9ca3af; font-size: 0.7rem;">
            ${new Date(leitura.data).toLocaleDateString('pt-BR')} • ${leitura.totalTrechos} trecho(s) • ${leitura.anotacoes ? leitura.anotacoes.length : 0} anotação(ões)
          </small>
        </div>
        <button onclick="event.stopPropagation(); excluirLeituraSalva(${leitura.id})"
                style="background: #fee2e2; color: #dc2626; border: none; padding: 5px 10px; border-radius: 20px; cursor: pointer; font-size: 0.7rem;">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// ===== VER LEITURA SALVA (COM EDIÇÃO) =====
function verLeituraSalva(id) {
  const leitura = historicoLeituras.find(l => l.id === id);
  if (!leitura) return;
  renderizarLeituraSalva(leitura);
}

// ===== EXCLUIR LEITURA SALVA =====
function excluirLeituraSalva(id) {
  Swal.fire({
    title: 'Excluir leitura?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444'
  }).then(result => {
    if (result.isConfirmed) {
      apiFetch(`historicoleituras/${id}`, {
        method: "DELETE"
      }).then(response => {
        if (response.ok) {
          carregarHistoricoLeituras().then(() => renderizarHistoricoLeituras());
          Swal.fire({
            icon: 'success',
            title: 'Excluída!',
            timer: 1000,
            showConfirmButton: false
          });
        } else {
          mostrarToast('❌ Erro ao excluir leitura', '#ef4444');
        }
      });
    }
  });
}
// ===== NOVA LEITURA (VOLTA AO INÍCIO SEM FECHAR) =====
function novaLeituraSavoring() {
  console.log('📖 [LEITURA] Iniciando nova leitura...');
  
  // Limpar timer
  if (leituraSavoringAtual.timer) {
    clearInterval(leituraSavoringAtual.timer);
    leituraSavoringAtual.timer = null;
  }
  
  // Resetar campos
  document.getElementById('leituraTitulo').value = '';
  document.getElementById('leituraTexto').value = '';
  document.getElementById('leituraTempoTrecho').value = '2';
  
  // Resetar estado
  leituraSavoringAtual = {
    titulo: '',
    texto: '',
    trechos: [],
    trechoAtual: 0,
    anotacoes: [],
    timer: null,
    tempoRestante: 0,
    tempoPorTrecho: 2,
    pausado: false,
    leituraSalva: false,
    idLeituraSalva: null
  };
  
  // Mostrar passo 1 (início)
  document.getElementById('leituraInicio').style.display = 'block';
  document.getElementById('leituraModo').style.display = 'none';
  document.getElementById('leituraReflexao').style.display = 'none';
  document.getElementById('leituraResumo').style.display = 'none';
  
  // Atualizar histórico
  carregarHistoricoLeituras();
  renderizarHistoricoLeituras();
  
  // Focar no campo de título
  setTimeout(() => {
    document.getElementById('leituraTitulo').focus();
  }, 300);
  
  mostrarToast('📖 Pronto para nova leitura!', '#3b82f6');
}

// ===== EXPORTAR =====
window.novaLeituraSavoring = novaLeituraSavoring;

// ===== EXPORTAR TODAS AS FUNÇÕES =====
window.abrirLeituraSavoring = abrirLeituraSavoring;
window.fecharLeituraSavoring = fecharLeituraSavoring;
window.iniciarLeituraSavoring = iniciarLeituraSavoring;
window.pausarLeituraSavoring = pausarLeituraSavoring;
window.proximoTrechoLeitura = proximoTrechoLeitura;
window.salvarReflexaoLeitura = salvarReflexaoLeitura;
window.pularReflexaoLeitura = pularReflexaoLeitura;
window.editarAnotacaoLeitura = editarAnotacaoLeitura;
window.excluirAnotacaoLeitura = excluirAnotacaoLeitura;
window.editarAnotacaoDoHistorico = editarAnotacaoDoHistorico;
window.toggleHistoricoLeituras = toggleHistoricoLeituras;
window.renderizarHistoricoLeituras = renderizarHistoricoLeituras;
window.verLeituraSalva = verLeituraSalva;
window.excluirLeituraSalva = excluirLeituraSalva;
window.carregarHistoricoLeituras = carregarHistoricoLeituras;
window.mostrarResumoLeitura = mostrarResumoLeitura;
// =============================================
// ===== GRUPOS DE ESTUDO - COMPLETO ==========
// =============================================

let gruposEstudo = [];
let grupoAtual = null;
let abaAtivaGrupoAtual = 'membros';
let cardsPraticaGrupo = [];
let indicePraticaGrupo = 0;

async function carregarGruposServidor() {
  try {
    const response = await apiFetch("gruposestudo");
    if (response.ok) {
      gruposEstudo = await response.json();
      gruposEstudo.forEach(g => {
        g.id = g.id_grupo || g.id;
        g.flashcardsCompartilhados = g.flashcardsCompartilhados || g.flashcards_compartilhados || [];
        g.membros = g.membros || [];
        g.temas = g.temas || [];
        g.duvidas = g.duvidas || [];
        g.reunioes = g.reunioes || [];
      });
      renderizarListaGrupos();
    }
  } catch (err) {
    console.error("Erro ao carregar grupos de estudo do servidor:", err);
  }
}

async function salvarGrupoServidor(grupo, manterAba = null) {
  try {
    const groupId = grupo.id_grupo || grupo.id;
    const payload = {
      nome: grupo.nome,
      materia: grupo.materia,
      linkMeet: grupo.linkMeet || grupo.link_meet || '',
      membros: grupo.membros || [],
      temas: grupo.temas || [],
      duvidas: grupo.duvidas || [],
      reunioes: grupo.reunioes || [],
      notas: grupo.notas || '',
      flashcardsCompartilhados: grupo.flashcardsCompartilhados || grupo.flashcards_compartilhados || []
    };

    const response = await apiFetch(`gruposestudo/${groupId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      await carregarGruposServidor();
      if (grupoAtual && (grupoAtual.id_grupo == groupId || grupoAtual.id == groupId)) {
        grupoAtual = gruposEstudo.find(g => (g.id_grupo == groupId || g.id == groupId)) || grupo;
        const abaParaRenderizar = manterAba || abaAtivaGrupoAtual || 'membros';
        renderizarDetalheGrupo(grupoAtual);
        trocarAbaGrupo(abaParaRenderizar);
      }
    } else {
      console.error("Erro ao atualizar grupo no servidor:", await response.text());
      mostrarToast('❌ Erro ao salvar grupo no servidor', '#ef4444');
    }
  } catch (err) {
    console.error("Erro ao salvar grupo no servidor:", err);
    mostrarToast('❌ Erro de conexão ao salvar grupo', '#ef4444');
  }
}

// ===== ABRIR MODAL =====
function abrirGruposEstudo() {
  console.log('👥 Abrindo Grupos de Estudo');
  if (typeof fecharMetodoModal === 'function') fecharMetodoModal();

  const modal = document.getElementById('gruposEstudoModalOverlay');
  if (modal) {
    modal.style.display = 'flex';
    carregarGruposServidor();
  }
}

// ===== FECHAR MODAL =====
function fecharGruposEstudo() {
  const modal = document.getElementById('gruposEstudoModalOverlay');
  if (modal) modal.style.display = 'none';
}

// ===== RENDERIZAR LISTA DE GRUPOS =====
function renderizarListaGrupos() {
  const container = document.getElementById('listaGruposEstudo');
  if (!container) return;

  const detalhe = document.getElementById('detalheGrupoEstudo');
  if (detalhe) detalhe.style.display = 'none';
  container.style.display = 'block';

  if (gruposEstudo.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 50px 20px;">
        <i class="bi bi-people" style="font-size: 4rem; color: #d1d5db;"></i>
        <h3 style="color: #6b7280; margin: 15px 0;">Nenhum grupo criado</h3>
        <p style="color: #9ca3af; margin-bottom: 20px;">Crie um grupo ou entre com um código de convite</p>
        <button onclick="abrirCriarGrupo()" style="background: var(--cor-primaria); color: white; border: none; padding: 12px 25px; border-radius: 40px; cursor: pointer; font-weight: 600;">
          <i class="bi bi-plus-lg"></i> Criar Grupo
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = gruposEstudo.map(grupo => {
    const groupId = grupo.id_grupo || grupo.id;
    const totalCards = grupo.flashcardsCompartilhados ? grupo.flashcardsCompartilhados.length : 0;
    return `
      <div style="background: white; border: 2px solid #e5e7eb; border-radius: 15px; padding: 20px; margin-bottom: 15px; cursor: pointer; transition: 0.3s;"
           onmouseover="this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)'; this.style.borderColor='var(--cor-primaria)'"
           onmouseout="this.style.boxShadow='none'; this.style.borderColor='#e5e7eb'"
           onclick="abrirDetalheGrupo(${groupId})">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="margin: 0; color: #1f2937;">${grupo.nome}</h3>
            <small style="color: #9ca3af;">Matéria: <strong>${grupo.materia || 'Geral'}</strong> | Código: <strong>${grupo.codigo}</strong></small>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="background: #f3f4f6; padding: 5px 12px; border-radius: 20px; font-size: 0.75rem;">
              <i class="bi bi-people"></i> ${grupo.membros ? grupo.membros.length : 0} membro(s)
            </span>
            <span style="background: #f3f4f6; padding: 5px 12px; border-radius: 20px; font-size: 0.75rem;">
              <i class="bi bi-chat-dots"></i> ${grupo.duvidas ? grupo.duvidas.length : 0} dúvida(s)
            </span>
            <span style="background: #e0e7ff; color: #3730a3; padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
              <i class="bi bi-collection"></i> ${totalCards} flashcard(s)
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== CRIAR GRUPO =====
function abrirCriarGrupo() {
  Swal.fire({
    title: '👥 Criar Grupo de Estudo',
    html: `
      <input id="inputNomeGrupo" class="swal2-input" placeholder="Nome do grupo" style="margin-bottom: 10px;">
      <input id="inputMateriaGrupo" class="swal2-input" placeholder="Matéria principal (opcional)">
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-check-lg"></i> Criar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#9f042c',
    cancelButtonColor: '#6b7280',
    preConfirm: () => {
      const nome = document.getElementById('inputNomeGrupo').value.trim();
      if (!nome) {
        Swal.showValidationMessage('Digite um nome!');
        return false;
      }
      return {
        nome: nome,
        materia: document.getElementById('inputMateriaGrupo').value.trim()
      };
    }
  }).then(result => {
    if (result.isConfirmed) {
      const codigo = gerarCodigoGrupo();
      
      let userEmail = '';
      let userName = 'Criador';
      try {
        const userObj = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
        if (userObj.email) userEmail = userObj.email;
        if (userObj.nome) userName = userObj.nome;
      } catch (e) {}
      
      apiFetch("gruposestudo", {
        method: "POST",
        body: JSON.stringify({
          nome: result.value.nome,
          materia: result.value.materia || 'Geral',
          codigo: codigo,
          linkMeet: '',
          membros: [{ nome: userName, email: userEmail, papel: 'Líder' }],
          temas: [],
          duvidas: [],
          reunioes: [],
          notas: '',
          flashcardsCompartilhados: [],
          dataCriacao: new Date().toISOString()
        })
      }).then(response => {
        if (response.ok) {
          carregarGruposServidor();
          Swal.fire({
            icon: 'success',
            title: 'Grupo criado!',
            html: `
              <p>Código do grupo: <strong style="font-size: 1.5rem; letter-spacing: 2px;">${codigo}</strong></p>
              <p>Compartilhe este código com seus colegas para eles entrarem no grupo!</p>
              <button onclick="copiarCodigo('${codigo}')" class="swal2-confirm swal2-styled" style="background: #3b82f6;">
                <i class="bi bi-clipboard"></i> Copiar Código
              </button>
            `,
            confirmButtonText: 'OK'
          });
        } else {
          mostrarToast('❌ Erro ao criar grupo', '#ef4444');
        }
      }).catch(err => {
        console.error(err);
        mostrarToast('❌ Erro ao criar grupo', '#ef4444');
      });
    }
  });
}

// ===== ENTRAR COM CÓDIGO =====
function abrirEntrarGrupo() {
  Swal.fire({
    title: '🔑 Entrar no Grupo',
    input: 'text',
    inputPlaceholder: 'Digite o código do grupo (6 dígitos)',
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-box-arrow-in-right"></i> Entrar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#6b7280',
    inputValidator: (value) => {
      if (!value || !value.trim()) {
        return 'Digite o código!';
      }
      return null;
    }
  }).then(result => {
    if (result.isConfirmed) {
      const codigo = result.value.trim().toUpperCase();
      
      apiFetch(`gruposestudo/${codigo}`).then(response => {
        if (!response.ok) {
          Swal.fire({
            icon: 'error',
            title: 'Grupo não encontrado!',
            text: 'Verifique o código digitado e tente novamente.'
          });
          return;
        }
        
        response.json().then(grupo => {
          let userName = '';
          let userEmail = '';
          try {
            const userObj = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
            if (userObj.nome) userName = userObj.nome;
            if (userObj.email) userEmail = userObj.email;
          } catch (e) {}

          Swal.fire({
            title: 'Confirmar Entrada',
            text: `Deseja entrar no grupo "${grupo.nome}"?`,
            input: userName ? undefined : 'text',
            inputPlaceholder: 'Seu nome',
            showCancelButton: true,
            confirmButtonText: 'Entrar no Grupo',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#22c55e',
            preConfirm: (inputNome) => {
              const nomeFinal = userName || (inputNome && inputNome.trim());
              if (!nomeFinal) {
                Swal.showValidationMessage('Digite seu nome!');
                return false;
              }
              return nomeFinal;
            }
          }).then(res => {
            if (res.isConfirmed) {
              const nomeFinal = res.value || userName || 'Membro';
              const membros = grupo.membros || [];
              
              const jaEsta = membros.some(m => (m.email && m.email === userEmail) || (m.nome && m.nome.toLowerCase() === nomeFinal.toLowerCase()));
              if (!jaEsta) {
                membros.push({ nome: nomeFinal, email: userEmail, papel: 'Membro' });
              }
              
              const groupId = grupo.id_grupo || grupo.id;
              apiFetch(`gruposestudo/${groupId}`, {
                method: "PUT",
                body: JSON.stringify({ membros: membros })
              }).then(resPut => {
                if (resPut.ok) {
                  carregarGruposServidor();
                  Swal.fire({
                    icon: 'success',
                    title: `Bem-vindo ao grupo ${grupo.nome}!`,
                    timer: 1800,
                    showConfirmButton: false
                  });
                } else {
                  mostrarToast('❌ Erro ao entrar no grupo', '#ef4444');
                }
              });
            }
          });
        });
      }).catch(err => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Erro de conexão!',
          text: 'Não foi possível buscar as informações do grupo.'
        });
      });
    }
  });
}

// ===== GERAR CÓDIGO =====
function gerarCodigoGrupo() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    codigo += letras[Math.floor(Math.random() * letras.length)];
  }
  return codigo;
}

// ===== COPIAR CÓDIGO =====
function copiarCodigo(codigo) {
  navigator.clipboard.writeText(codigo).then(() => {
    mostrarToast('📋 Código copiado!', '#22c55e');
  });
}

// ===== ABRIR DETALHE DO GRUPO =====
function abrirDetalheGrupo(id) {
  const grupo = gruposEstudo.find(g => (g.id == id || g.id_grupo == id));
  if (!grupo) return;

  grupoAtual = grupo;

  const lista = document.getElementById('listaGruposEstudo');
  if (lista) lista.style.display = 'none';

  const detalhe = document.getElementById('detalheGrupoEstudo');
  if (detalhe) detalhe.style.display = 'block';

  renderizarDetalheGrupo(grupo);
}

// ===== RENDERIZAR DETALHE DO GRUPO =====
function renderizarDetalheGrupo(grupo) {
  const container = document.getElementById('detalheGrupoEstudo');
  if (!container) return;

  const groupId = grupo.id_grupo || grupo.id;
  const totalCards = grupo.flashcardsCompartilhados ? grupo.flashcardsCompartilhados.length : (grupo.flashcards_compartilhados ? grupo.flashcards_compartilhados.length : 0);

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
      <div>
        <button onclick="voltarListaGrupos()" style="background: none; border: none; cursor: pointer; color: #6b7280; font-size: 0.9rem; font-weight: 500;">
          <i class="bi bi-arrow-left"></i> Voltar para Lista
        </button>
        <h2 style="margin: 5px 0 0; color: #1f2937;">${grupo.nome}</h2>
        <small style="color: #9ca3af;">📚 Matéria: <strong>${grupo.materia || 'Geral'}</strong> | Código: <strong>${grupo.codigo}</strong></small>
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button onclick="iniciarChamadaVideo(${groupId})"
          style="background: #22c55e; color: white; border: none; padding: 10px 18px; border-radius: 30px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px;">
          <i class="bi bi-camera-video"></i> Chamada de Vídeo
        </button>
        <button onclick="copiarCodigo('${grupo.codigo}')"
          style="background: #3b82f6; color: white; border: none; padding: 10px 18px; border-radius: 30px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px;">
          <i class="bi bi-clipboard"></i> Copiar Código
        </button>
      </div>
    </div>

    <!-- ABAS DO GRUPO -->
    <div style="display: flex; gap: 5px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; overflow-x: auto;">
      <button onclick="trocarAbaGrupo('membros')" class="aba-grupo-btn active" id="abaMembros"
        style="background: none; border: none; padding: 10px 18px; cursor: pointer; font-weight: 600; color: var(--cor-primaria); border-bottom: 3px solid var(--cor-primaria); white-space: nowrap;">
        <i class="bi bi-people"></i> Membros (${grupo.membros ? grupo.membros.length : 0})
      </button>
      <button onclick="trocarAbaGrupo('temas')" class="aba-grupo-btn" id="abaTemas"
        style="background: none; border: none; padding: 10px 18px; cursor: pointer; font-weight: 600; color: #6b7280; white-space: nowrap;">
        <i class="bi bi-journal-bookmark"></i> Temas (${grupo.temas ? grupo.temas.length : 0})
      </button>
      <button onclick="trocarAbaGrupo('duvidas')" class="aba-grupo-btn" id="abaDuvidas"
        style="background: none; border: none; padding: 10px 18px; cursor: pointer; font-weight: 600; color: #6b7280; white-space: nowrap;">
        <i class="bi bi-question-circle"></i> Dúvidas (${grupo.duvidas ? grupo.duvidas.length : 0})
      </button>
      <button onclick="trocarAbaGrupo('notas')" class="aba-grupo-btn" id="abaNotas"
        style="background: none; border: none; padding: 10px 18px; cursor: pointer; font-weight: 600; color: #6b7280; white-space: nowrap;">
        <i class="bi bi-journal-text"></i> Notas
      </button>
      <button onclick="trocarAbaGrupo('reunioes')" class="aba-grupo-btn" id="abaReunioes"
        style="background: none; border: none; padding: 10px 18px; cursor: pointer; font-weight: 600; color: #6b7280; white-space: nowrap;">
        <i class="bi bi-calendar-event"></i> Reuniões (${grupo.reunioes ? grupo.reunioes.length : 0})
      </button>
      <button onclick="trocarAbaGrupo('flashcards')" class="aba-grupo-btn" id="abaFlashcards"
        style="background: none; border: none; padding: 10px 18px; cursor: pointer; font-weight: 600; color: #6b7280; white-space: nowrap;">
        <i class="bi bi-collection"></i> Flashcards (${totalCards})
      </button>
    </div>

    <div id="conteudoAbaGrupo">
      ${renderizarAbaMembros(grupo)}
    </div>
  `;
}

// ===== TROCAR ABA =====
function trocarAbaGrupo(aba) {
  abaAtivaGrupoAtual = aba;
  document.querySelectorAll('.aba-grupo-btn').forEach(btn => {
    btn.style.color = '#6b7280';
    btn.style.borderBottom = 'none';
  });

  const btnAtivo = document.getElementById('aba' + aba.charAt(0).toUpperCase() + aba.slice(1));
  if (btnAtivo) {
    btnAtivo.style.color = 'var(--cor-primaria)';
    btnAtivo.style.borderBottom = '3px solid var(--cor-primaria)';
  }

  const grupo = grupoAtual;
  if (!grupo) return;

  const conteudo = document.getElementById('conteudoAbaGrupo');
  if (!conteudo) return;

  switch (aba) {
    case 'membros':
      conteudo.innerHTML = renderizarAbaMembros(grupo);
      break;
    case 'temas':
      conteudo.innerHTML = renderizarAbaTemas(grupo);
      break;
    case 'duvidas':
      conteudo.innerHTML = renderizarAbaDuvidas(grupo);
      break;
    case 'notas':
      conteudo.innerHTML = renderizarAbaNotas(grupo);
      break;
    case 'reunioes':
      conteudo.innerHTML = renderizarAbaReunioes(grupo);
      break;
    case 'flashcards':
      conteudo.innerHTML = renderizarAbaFlashcards(grupo);
      break;
  }
}

// ===== ABA MEMBROS =====
function renderizarAbaMembros(grupo) {
  let currentUserEmail = '';
  try {
    const userObj = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
    if (userObj && userObj.email) {
      currentUserEmail = userObj.email;
    }
  } catch (e) {}
  
  const groupId = grupo.id_grupo || grupo.id;
  const membros = grupo.membros || [];

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <h3 style="margin: 0;">Membros do Grupo (${membros.length})</h3>
      <div style="display: flex; gap: 8px;">
        <button onclick="adicionarMembro(${groupId})"
          style="background: #22c55e; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: 600;">
          <i class="bi bi-plus"></i> Adicionar
        </button>
        <button onclick="sairDoGrupo(${groupId})"
          style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: 600;">
          <i class="bi bi-box-arrow-left"></i> Sair do Grupo
        </button>
      </div>
    </div>
    ${membros.map((m, i) => {
      const isMe = (m.email && m.email === currentUserEmail);
      const labelNome = isMe ? `${m.nome} (Você)` : m.nome;
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f9fafb; border-radius: 10px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${i === 0 ? '#9f042c' : '#3b82f6'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;">
              ${m.nome ? m.nome.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <strong>${labelNome}</strong>
              <br><small style="color: #9ca3af;">${m.papel || 'Membro'}</small>
            </div>
          </div>
          ${i !== 0 ? `<button onclick="removerMembro(${groupId}, ${i})" style="background: none; border: none; color: #ef4444; cursor: pointer;"><i class="bi bi-trash"></i></button>` : ''}
        </div>
      `;
    }).join('')}
  `;
}

// ===== ABA TEMAS =====
function renderizarAbaTemas(grupo) {
  const groupId = grupo.id_grupo || grupo.id;
  const temas = grupo.temas || [];

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <h3 style="margin: 0;">Divisão de Temas</h3>
      <button onclick="adicionarTema(${groupId})"
        style="background: #22c55e; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: 600;">
        <i class="bi bi-plus"></i> Adicionar Tema
      </button>
    </div>
    ${temas.length > 0 ? temas.map((tema, i) => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f9fafb; border-radius: 10px; margin-bottom: 8px;">
        <div>
          <strong>${tema.titulo}</strong>
          <br><small style="color: #9ca3af;">Responsável: ${tema.responsavel || 'Não definido'}</small>
        </div>
        <button onclick="removerTema(${groupId}, ${i})" style="background: none; border: none; color: #ef4444; cursor: pointer;"><i class="bi bi-trash"></i></button>
      </div>
    `).join('') : '<p style="color: #9ca3af;">Nenhum tema definido ainda.</p>'}
  `;
}

// ===== ABA DÚVIDAS =====
function renderizarAbaDuvidas(grupo) {
  const groupId = grupo.id_grupo || grupo.id;
  const duvidas = grupo.duvidas || [];

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <h3 style="margin: 0;">Quadro de Dúvidas</h3>
      <button onclick="adicionarDuvida(${groupId})"
        style="background: #f59e0b; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: 600;">
        <i class="bi bi-plus"></i> Nova Dúvida
      </button>
    </div>
    ${duvidas.length > 0 ? duvidas.map((d, i) => `
      <div style="padding: 15px; background: ${d.resposta ? '#f0fdf4' : '#fef3c7'}; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid ${d.resposta ? '#22c55e' : '#f59e0b'};">
        <strong>${d.pergunta}</strong>
        <br><small style="color: #9ca3af;">Por: ${d.autor || 'Membro'}</small>
        ${d.resposta ? `<br><span style="color: #16a34a; font-weight: 500;">✅ Respondido: ${d.resposta}</span>` : ''}
        ${!d.resposta ? `<br><button onclick="responderDuvida(${groupId}, ${i})" style="margin-top: 8px; background: #22c55e; color: white; border: none; padding: 5px 12px; border-radius: 15px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">Responder</button>` : ''}
        <button onclick="removerDuvida(${groupId}, ${i})" style="background: none; border: none; color: #ef4444; cursor: pointer; float: right;"><i class="bi bi-trash"></i></button>
      </div>
    `).join('') : '<p style="color: #9ca3af;">Nenhuma dúvida cadastrada ainda.</p>'}
  `;
}

// ===== ABA NOTAS =====
function renderizarAbaNotas(grupo) {
  const groupId = grupo.id_grupo || grupo.id;

  return `
    <h3 style="margin-bottom: 15px;">Notas Coletivas do Grupo</h3>
    <textarea id="notasGrupoTexto" rows="8" placeholder="Escreva notas, resumos ou anotações compartilhadas aqui..."
      style="width: 100%; padding: 15px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 0.9rem; resize: vertical; font-family: 'Poppins', sans-serif;">${grupo.notas || ''}</textarea>
    <button onclick="salvarNotasGrupo(${groupId})"
      style="margin-top: 10px; background: #22c55e; color: white; border: none; padding: 10px 20px; border-radius: 30px; cursor: pointer; font-weight: 600;">
      <i class="bi bi-save"></i> Salvar Notas
    </button>
  `;
}

// ===== ABA REUNIÕES =====
function renderizarAbaReunioes(grupo) {
  const groupId = grupo.id_grupo || grupo.id;
  const reunioes = grupo.reunioes || [];

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <h3 style="margin: 0;">Reuniões Agendadas</h3>
      <button onclick="agendarReuniao(${groupId})"
        style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: 600;">
        <i class="bi bi-calendar-plus"></i> Agendar
      </button>
    </div>
    ${reunioes.length > 0 ? reunioes.map((r, i) => `
      <div style="padding: 12px; background: #f9fafb; border-radius: 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${r.titulo}</strong>
          <br><small style="color: #9ca3af;">📅 ${r.data ? new Date(r.data).toLocaleDateString('pt-BR') : 'Sem data'} às ${r.hora || 'Horário a definir'}</small>
        </div>
        <button onclick="removerReuniao(${groupId}, ${i})" style="background: none; border: none; color: #ef4444; cursor: pointer;"><i class="bi bi-trash"></i></button>
      </div>
    `).join('') : '<p style="color: #9ca3af;">Nenhuma reunião agendada.</p>'}
  `;
}

// ===== ABA FLASHCARDS =====
function renderizarAbaFlashcards(grupo) {
  const cards = grupo.flashcardsCompartilhados || grupo.flashcards_compartilhados || [];
  const groupId = grupo.id_grupo || grupo.id;

  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button onclick="exportarFlashcardsGrupo(${groupId})"
          style="background: #3b82f6; color: white; border: none; padding: 10px 18px; border-radius: 20px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 5px rgba(59,130,246,0.2);">
          <i class="bi bi-cloud-arrow-up-fill"></i> Compartilhar Meus Flashcards
        </button>
        <button onclick="importarFlashcardsGrupo(${groupId})"
          style="background: #22c55e; color: white; border: none; padding: 10px 18px; border-radius: 20px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 5px rgba(34,197,94,0.2);">
          <i class="bi bi-cloud-arrow-down-fill"></i> Importar Todos para Minha Conta
        </button>
        ${cards.length > 0 ? `
          <button onclick="praticarFlashcardsGrupo(${groupId})"
            style="background: #8b5cf6; color: white; border: none; padding: 10px 18px; border-radius: 20px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 5px rgba(139,92,246,0.2);">
            <i class="bi bi-play-circle-fill"></i> Praticar com o Grupo
          </button>
        ` : ''}
      </div>
      <span style="font-size: 0.85rem; color: #6b7280; font-weight: 500;">
        Total: <strong>${cards.length}</strong> card(s)
      </span>
    </div>
  `;

  if (cards.length === 0) {
    html += `
      <div style="text-align: center; padding: 40px 20px; background: #f9fafb; border-radius: 12px; border: 2px dashed #e5e7eb;">
        <i class="bi bi-collection" style="font-size: 2.5rem; color: #d1d5db;"></i>
        <h4 style="color: #4b5563; margin: 10px 0 5px;">Nenhum flashcard compartilhado</h4>
        <p style="color: #9ca3af; font-size: 0.9rem; margin-bottom: 15px;">Compartilhe flashcards do seu sistema para estudar junto com seus colegas!</p>
        <button onclick="exportarFlashcardsGrupo(${groupId})"
          style="background: #3b82f6; color: white; border: none; padding: 8px 18px; border-radius: 20px; cursor: pointer; font-weight: 600; font-size: 0.85rem;">
          <i class="bi bi-plus-lg"></i> Compartilhar Flashcards
        </button>
      </div>
    `;
    return html;
  }

  html += `<div style="display: grid; gap: 12px;">`;

  cards.forEach((f, index) => {
    const cardId = `grupoCard_${index}`;
    const materia = f.materiaNome || grupo.materia || 'Geral';
    const tema = f.tema || 'Geral';
    const autor = f.compartilhadoPor || 'Membro';

    html += `
      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: 0.2s;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 8px;">
          <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
            <span style="background: #e0e7ff; color: #3730a3; font-size: 0.75rem; font-weight: 600; padding: 3px 8px; border-radius: 6px;">
              ${materia}
            </span>
            ${tema !== 'Geral' ? `
              <span style="background: #f3f4f6; color: #4b5563; font-size: 0.75rem; font-weight: 500; padding: 3px 8px; border-radius: 6px;">
                📂 ${tema}
              </span>
            ` : ''}
            <small style="color: #9ca3af; font-size: 0.75rem;">👤 ${autor}</small>
          </div>
          <div style="display: flex; gap: 6px;">
            <button onclick="importarFlashcardIndividual(${groupId}, ${index})" title="Importar este flashcard para meu sistema"
              style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; border-radius: 6px; padding: 4px 8px; cursor: pointer; font-size: 0.8rem; font-weight: 500;">
              <i class="bi bi-download"></i> Salvar
            </button>
            <button onclick="removerFlashcardGrupo(${groupId}, ${index})" title="Remover do grupo"
              style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 6px; padding: 4px 8px; cursor: pointer; font-size: 0.8rem;">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <div style="margin: 10px 0 6px; font-weight: 600; color: #1f2937; font-size: 0.95rem;">
          ❓ ${f.pergunta}
        </div>

        <div id="${cardId}_resposta" style="display: none; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e5e7eb; color: #059669; font-size: 0.9rem; font-weight: 500;">
          💡 <strong>Resposta:</strong> ${f.resposta}
        </div>

        <button onclick="
          const resp = document.getElementById('${cardId}_resposta');
          if (resp.style.display === 'none') {
            resp.style.display = 'block';
            this.innerHTML = '<i class=\\'bi bi-eye-slash\\'></i> Ocultar Resposta';
          } else {
            resp.style.display = 'none';
            this.innerHTML = '<i class=\\'bi bi-eye\\'></i> Ver Resposta';
          }
        " style="background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 0.8rem; padding: 0; margin-top: 4px; font-weight: 500;">
          <i class="bi bi-eye"></i> Ver Resposta
        </button>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

// ===== EXPORTAR FLASHCARDS PARA O GRUPO =====
async function exportarFlashcardsGrupo(id) {
  // Garantir que os flashcards estão carregados
  if (!flashcards || flashcards.length === 0) {
    try {
      await carregarFlashcardsDoBackend();
    } catch (e) {}
  }

  if (!flashcards || flashcards.length === 0) {
    Swal.fire({
      title: 'Nenhum Flashcard Encontrado',
      text: 'Você não possui flashcards cadastrados no seu sistema pessoal. Crie alguns flashcards na aba de Revisão para poder compartilhá-los com seu grupo!',
      icon: 'info',
      confirmButtonColor: '#3b82f6'
    });
    return;
  }

  const grupo = gruposEstudo.find(g => (g.id_grupo == id || g.id == id)) || grupoAtual;
  if (!grupo) {
    mostrarToast('❌ Grupo não encontrado', '#ef4444');
    return;
  }

  const materiasMap = new Map();
  flashcards.forEach(f => {
    const matNome = f.materiaNome || 'Geral';
    materiasMap.set(matNome, (materiasMap.get(matNome) || 0) + 1);
  });

  let optionsHtml = `<option value="todos">🌟 Todos os flashcards (${flashcards.length} cards)</option>`;
  materiasMap.forEach((qtd, matNome) => {
    optionsHtml += `<option value="${matNome}">📚 ${matNome} (${qtd} card${qtd > 1 ? 's' : ''})</option>`;
  });

  Swal.fire({
    title: '📤 Compartilhar com o Grupo',
    html: `
      <p style="font-size: 0.9rem; color: #6b7280; margin-bottom: 12px; text-align: left;">
        Escolha quais flashcards do seu acervo pessoal você deseja enviar para o grupo <strong>${grupo.nome}</strong>:
      </p>
      <select id="selectExportMateria" class="swal2-input" style="width: 100%; box-sizing: border-box; margin: 0 0 15px 0;">
        ${optionsHtml}
      </select>
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-cloud-arrow-up"></i> Compartilhar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#6b7280',
    preConfirm: () => {
      return document.getElementById('selectExportMateria').value;
    }
  }).then(async result => {
    if (result.isConfirmed) {
      const materiaSelecionada = result.value;
      
      let cardsFiltrados = flashcards;
      if (materiaSelecionada !== 'todos') {
        cardsFiltrados = flashcards.filter(f => 
          (f.materiaNome && f.materiaNome.trim().toLowerCase() === materiaSelecionada.trim().toLowerCase()) ||
          f.materiaNome === materiaSelecionada
        );
      }

      if (cardsFiltrados.length === 0) {
        Swal.fire('Nenhum flashcard', `Nenhum flashcard encontrado na matéria "${materiaSelecionada}".`, 'warning');
        return;
      }

      if (!grupo.flashcardsCompartilhados) grupo.flashcardsCompartilhados = [];

      let userObj = {};
      try {
        userObj = window.usuarioLogadoPerfil || JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
      } catch (e) {}
      const autorNome = userObj.nome || 'Você';

      let adicionados = 0;
      cardsFiltrados.forEach(cf => {
        const jaExiste = grupo.flashcardsCompartilhados.some(gf => 
          (gf.pergunta || '').trim().toLowerCase() === (cf.pergunta || '').trim().toLowerCase()
        );
        if (!jaExiste) {
          grupo.flashcardsCompartilhados.push({
            id: cf.id || Date.now() + Math.random(),
            materiaNome: cf.materiaNome || 'Geral',
            tema: cf.tema || 'Geral',
            pergunta: cf.pergunta,
            resposta: cf.resposta,
            autor: autorNome,
            dataEnvio: new Date().toISOString()
          });
          adicionados++;
        }
      });

      // Sincronizar grupo com o backend
      try {
        await salvarGrupoServidor(grupo, 'flashcards');
        Swal.fire({
          title: 'Compartilhamento Concluído!',
          text: `${adicionados} novos flashcards foram enviados para o grupo "${grupo.nome}".`,
          icon: 'success',
          confirmButtonColor: '#3b82f6'
        });
      } catch (e) {
        console.error('Erro ao enviar flashcards para o grupo:', e);
      }
    }
  });
}

// ===== IMPORTAR TODOS OS FLASHCARDS DO GRUPO =====
function importarFlashcardsGrupo(id) {
  const grupo = gruposEstudo.find(g => (g.id == id || g.id_grupo == id)) || grupoAtual;
  if (!grupo || !grupo.flashcardsCompartilhados || grupo.flashcardsCompartilhados.length === 0) {
    Swal.fire({
      title: 'Lista Vazia',
      text: 'Este grupo não possui flashcards compartilhados para importar.',
      icon: 'info'
    });
    return;
  }

  const materiasLista = (typeof materias !== 'undefined' && materias.length > 0) ? materias : [];
  if (materiasLista.length === 0) {
    Swal.fire({
      title: 'Nenhuma Matéria',
      text: 'Você precisa criar pelo menos uma matéria no seu cronograma para importar flashcards.',
      icon: 'warning'
    });
    return;
  }

  let optionsHtml = '';
  materiasLista.forEach(mat => {
    optionsHtml += `<option value="${mat.id}">${mat.nome}</option>`;
  });

  Swal.fire({
    title: '📥 Importar para meu Sistema',
    html: `
      <p style="font-size: 0.9rem; color: #6b7280; margin-bottom: 15px; text-align: left;">
        Selecione em qual das suas matérias os <strong>${grupo.flashcardsCompartilhados.length}</strong> flashcards deste grupo serão salvos:
      </p>
      <select id="selectImportMateria" class="swal2-input" style="width: 100%; box-sizing: border-box; margin: 0 auto 15px;">
        ${optionsHtml}
      </select>
    `,
    showCancelButton: true,
    confirmButtonText: 'Importar Todos',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#22c55e',
    cancelButtonColor: '#6b7280',
    preConfirm: () => {
      const select = document.getElementById('selectImportMateria');
      return {
        id: select.value,
        nome: select.options[select.selectedIndex].text
      };
    }
  }).then(result => {
    if (result.isConfirmed) {
      const materiaDestino = result.value;
      
      let adicionadosCount = 0;
      grupo.flashcardsCompartilhados.forEach(f => {
        const perguntaNorm = (f.pergunta || '').trim().toLowerCase();
        const existe = flashcards.some(pf => (pf.pergunta || '').trim().toLowerCase() === perguntaNorm);
        if (!existe) {
          const novoCard = {
            id: Date.now() + Math.random(),
            materiaId: Number(materiaDestino.id),
            materiaNome: materiaDestino.nome,
            tema: f.tema || "Importado do Grupo",
            pergunta: f.pergunta,
            resposta: f.resposta,
            nivel: 0,
            dataProxima: new Date().toISOString().split("T")[0],
            acertos: 0,
            erros: 0
          };
          
          flashcards.push(novoCard);
          if (typeof salvarFlashcardNoBackend === 'function') {
            salvarFlashcardNoBackend(novoCard);
          }
          adicionadosCount++;
        }
      });

      if (typeof renderizarFlashcardsAgrupados === 'function') {
        renderizarFlashcardsAgrupados();
      }

      Swal.fire({
        title: 'Importação Concluída!',
        text: `${adicionadosCount} novos flashcards foram importados para a matéria "${materiaDestino.nome}".`,
        icon: 'success'
      });
    }
  });
}

// ===== IMPORTAR FLASHCARD INDIVIDUAL =====
function importarFlashcardIndividual(id, index) {
  const grupo = gruposEstudo.find(g => (g.id_grupo == id || g.id == id)) || grupoAtual;
  if (!grupo || !grupo.flashcardsCompartilhados || !grupo.flashcardsCompartilhados[index]) {
    mostrarToast('❌ Flashcard não encontrado', '#ef4444');
    return;
  }

  const card = grupo.flashcardsCompartilhados[index];
  const materiasLista = (typeof materias !== 'undefined' && materias.length > 0) ? materias : [];

  let optionsHtml = '';
  if (materiasLista.length > 0) {
    materiasLista.forEach(mat => {
      const selected = (card.materiaNome && mat.nome.toLowerCase() === card.materiaNome.toLowerCase()) ? 'selected' : '';
      optionsHtml += `<option value="${mat.id}" ${selected}>${mat.nome}</option>`;
    });
  } else {
    optionsHtml = '<option value="1">Geral</option>';
  }

  Swal.fire({
    title: '📥 Salvar Flashcard',
    html: `
      <p style="font-size: 0.9rem; color: #4b5563; text-align: left; margin-bottom: 8px;">
        <strong>Pergunta:</strong> ${card.pergunta}
      </p>
      <p style="font-size: 0.85rem; color: #6b7280; text-align: left; margin-bottom: 15px;">
        Selecione a matéria de destino para salvar na sua conta:
      </p>
      <select id="selectImportMatIndiv" class="swal2-input" style="width: 100%; box-sizing: border-box; margin: 0;">
        ${optionsHtml}
      </select>
    `,
    showCancelButton: true,
    confirmButtonText: 'Salvar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#22c55e',
    preConfirm: () => {
      const sel = document.getElementById('selectImportMatIndiv');
      return {
        id: sel.value,
        nome: sel.options[sel.selectedIndex].text
      };
    }
  }).then(result => {
    if (result.isConfirmed) {
      const matDestino = result.value;
      const perguntaNorm = (card.pergunta || '').trim().toLowerCase();
      const existe = flashcards.some(pf => (pf.pergunta || '').trim().toLowerCase() === perguntaNorm);

      if (existe) {
        mostrarToast('⚠️ Você já possui este flashcard no seu sistema!', '#f59e0b');
        return;
      }

      const novoCard = {
        id: Date.now(),
        materiaId: Number(matDestino.id),
        materiaNome: matDestino.nome,
        tema: card.tema || "Importado do Grupo",
        pergunta: card.pergunta,
        resposta: card.resposta,
        nivel: 0,
        dataProxima: new Date().toISOString().split("T")[0],
        acertos: 0,
        erros: 0
      };

      flashcards.push(novoCard);
      if (typeof salvarFlashcardNoBackend === 'function') {
        salvarFlashcardNoBackend(novoCard);
      }
      if (typeof renderizarFlashcardsAgrupados === 'function') {
        renderizarFlashcardsAgrupados();
      }

      mostrarToast('✅ Flashcard importado para sua conta!', '#22c55e');
    }
  });
}

// ===== REMOVER FLASHCARD DO GRUPO =====
function removerFlashcardGrupo(id, index) {
  const grupo = gruposEstudo.find(g => (g.id_grupo == id || g.id == id)) || grupoAtual;
  if (!grupo || !grupo.flashcardsCompartilhados) return;

  Swal.fire({
    title: 'Remover Flashcard',
    text: 'Deseja remover este flashcard compartilhado do grupo?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Remover',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280'
  }).then(async result => {
    if (result.isConfirmed) {
      grupo.flashcardsCompartilhados.splice(index, 1);
      await salvarGrupoServidor(grupo, 'flashcards');
      mostrarToast('🗑️ Flashcard removido do grupo!', '#22c55e');
    }
  });
}

// ===== PRATICAR FLASHCARDS COM O GRUPO =====
function praticarFlashcardsGrupo(id) {
  const grupo = gruposEstudo.find(g => (g.id_grupo == id || g.id == id)) || grupoAtual;
  if (!grupo || !grupo.flashcardsCompartilhados || grupo.flashcardsCompartilhados.length === 0) {
    mostrarToast('Nenhum flashcard para praticar', '#f59e0b');
    return;
  }

  cardsPraticaGrupo = [...grupo.flashcardsCompartilhados];
  indicePraticaGrupo = 0;
  abrirModalPraticaGrupo(grupo.nome);
}

function abrirModalPraticaGrupo(nomeGrupo) {
  if (cardsPraticaGrupo.length === 0) return;
  const total = cardsPraticaGrupo.length;
  const card = cardsPraticaGrupo[indicePraticaGrupo];

  Swal.fire({
    title: `🎴 Estudo em Grupo - ${nomeGrupo}`,
    html: `
      <div style="text-align: left; padding: 10px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #6b7280; margin-bottom: 12px;">
          <span>Card <strong>${indicePraticaGrupo + 1}</strong> de <strong>${total}</strong></span>
          <span style="background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${card.materiaNome || 'Geral'}</span>
        </div>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 15px; margin-bottom: 12px;">
          <small style="color: #9ca3af; text-transform: uppercase; font-weight: 700; font-size: 0.7rem;">Pergunta</small>
          <p style="font-size: 1.05rem; font-weight: 600; color: #1f2937; margin: 5px 0 0;">${card.pergunta}</p>
        </div>
        <div id="praticaRespostaContainer" style="display: none; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 15px; margin-bottom: 12px;">
          <small style="color: #059669; text-transform: uppercase; font-weight: 700; font-size: 0.7rem;">Resposta</small>
          <p style="font-size: 1rem; font-weight: 500; color: #065f46; margin: 5px 0 0;">${card.resposta}</p>
        </div>
        <button id="btnRevelarPratica" onclick="
          document.getElementById('praticaRespostaContainer').style.display='block';
          this.style.display='none';
        " style="width: 100%; background: #3b82f6; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer;">
          <i class="bi bi-eye"></i> Revelar Resposta
        </button>
      </div>
    `,
    showDenyButton: indicePraticaGrupo > 0,
    showCancelButton: true,
    confirmButtonText: (indicePraticaGrupo + 1 < total) ? 'Próximo Card ➔' : 'Concluir Estudo 🏁',
    denyButtonText: '⬅ Anterior',
    cancelButtonText: 'Sair',
    confirmButtonColor: '#22c55e',
    denyButtonColor: '#6b7280',
    cancelButtonColor: '#ef4444',
    allowOutsideClick: false
  }).then(result => {
    if (result.isConfirmed) {
      if (indicePraticaGrupo + 1 < total) {
        indicePraticaGrupo++;
        abrirModalPraticaGrupo(nomeGrupo);
      } else {
        Swal.fire({
          icon: 'success',
          title: '🎉 Parabéns!',
          text: `Vocês completaram a revisão de todos os ${total} flashcards do grupo!`,
          confirmButtonColor: '#22c55e'
        });
      }
    } else if (result.isDenied) {
      if (indicePraticaGrupo > 0) {
        indicePraticaGrupo--;
        abrirModalPraticaGrupo(nomeGrupo);
      }
    }
  });
}

// ===== AÇÕES DO GRUPO =====
function iniciarChamadaVideo(id) {
  const grupo = gruposEstudo.find(g => (g.id == id || g.id_grupo == id));
  if (!grupo) return;

  Swal.fire({
    title: '📹 Chamada de Vídeo',
    text: 'Deseja abrir o Google Meet?',
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-camera-video"></i> Abrir Meet',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#22c55e',
    cancelButtonColor: '#6b7280'
  }).then(result => {
    if (result.isConfirmed) {
      if (!grupo.reunioes) grupo.reunioes = [];
      grupo.reunioes.push({
        titulo: `Chamada - ${grupo.nome}`,
        data: new Date().toISOString(),
        hora: new Date().toLocaleTimeString('pt-BR')
      });
      salvarGrupoServidor(grupo, 'reunioes');

      window.open('https://meet.google.com/new', '_blank');
      mostrarToast('📹 Abrindo Google Meet...', '#22c55e');
    }
  });
}

function adicionarMembro(id) {
  Swal.fire({
    title: 'Adicionar Membro',
    input: 'text',
    inputPlaceholder: 'Nome do membro',
    showCancelButton: true,
    confirmButtonText: 'Adicionar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#22c55e'
  }).then(result => {
    if (result.isConfirmed && result.value.trim()) {
      const grupo = gruposEstudo.find(g => (g.id == id || g.id_grupo == id));
      if (grupo) {
        if (!grupo.membros) grupo.membros = [];
        grupo.membros.push({ nome: result.value.trim(), email: '', papel: 'Membro' });
        salvarGrupoServidor(grupo, 'membros');
        mostrarToast('✅ Membro adicionado!', '#22c55e');
      }
    }
  });
}

function adicionarTema(id) {
  Swal.fire({
    title: 'Adicionar Tema',
    html: `
      <input id="inputTemaTitulo" class="swal2-input" placeholder="Tema (ex: Citologia)">
      <input id="inputTemaResponsavel" class="swal2-input" placeholder="Responsável (nome)">
    `,
    showCancelButton: true,
    confirmButtonText: 'Adicionar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#22c55e',
    preConfirm: () => {
      const titulo = document.getElementById('inputTemaTitulo').value.trim();
      if (!titulo) {
        Swal.showValidationMessage('Digite o tema!');
        return false;
      }
      return {
        titulo: titulo,
        responsavel: document.getElementById('inputTemaResponsavel').value.trim()
      };
    }
  }).then(result => {
    if (result.isConfirmed) {
      const grupo = gruposEstudo.find(g => (g.id == id || g.id_grupo == id));
      if (grupo) {
        if (!grupo.temas) grupo.temas = [];
        grupo.temas.push(result.value);
        salvarGrupoServidor(grupo, 'temas');
        mostrarToast('✅ Tema adicionado!', '#22c55e');
      }
    }
  });
}

function adicionarDuvida(id) {
  Swal.fire({
    title: 'Nova Dúvida',
    input: 'text',
    inputPlaceholder: 'Digite sua dúvida...',
    showCancelButton: true,
    confirmButtonText: 'Perguntar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#f59e0b',
    inputValidator: (value) => {
      if (!value || !value.trim()) return 'Digite sua dúvida!';
      return null;
    }
  }).then(result => {
    if (result.isConfirmed) {
      const grupo = gruposEstudo.find(g => (g.id == id || g.id_grupo == id));
      if (grupo) {
        if (!grupo.duvidas) grupo.duvidas = [];
        let userName = 'Você';
        try {
          const userObj = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
          if (userObj.nome) userName = userObj.nome;
        } catch (e) {}
        grupo.duvidas.push({
          pergunta: result.value.trim(),
          autor: userName,
          resposta: ''
        });
        salvarGrupoServidor(grupo, 'duvidas');
        mostrarToast('✅ Dúvida enviada!', '#f59e0b');
      }
    }
  });
}

function responderDuvida(id, index) {
  Swal.fire({
    title: 'Responder Dúvida',
    input: 'text',
    inputPlaceholder: 'Digite a resposta...',
    showCancelButton: true,
    confirmButtonText: 'Responder',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#22c55e'
  }).then(result => {
    if (result.isConfirmed && result.value.trim()) {
      const grupo = gruposEstudo.find(g => (g.id == id || g.id_grupo == id));
      if (grupo && grupo.duvidas && grupo.duvidas[index]) {
        grupo.duvidas[index].resposta = result.value.trim();
        salvarGrupoServidor(grupo, 'duvidas');
        mostrarToast('✅ Dúvida respondida!', '#22c55e');
      }
    }
  });
}

function agendarReuniao(id) {
  Swal.fire({
    title: 'Agendar Reunião',
    html: `
      <input id="inputReuniaoTitulo" class="swal2-input" placeholder="Título da reunião">
      <input id="inputReuniaoData" type="date" class="swal2-input">
      <input id="inputReuniaoHora" type="time" class="swal2-input">
    `,
    showCancelButton: true,
    confirmButtonText: 'Agendar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#3b82f6'
  }).then(result => {
    if (result.isConfirmed) {
      const grupo = gruposEstudo.find(g => (g.id == id || g.id_grupo == id));
      if (grupo) {
        if (!grupo.reunioes) grupo.reunioes = [];
        grupo.reunioes.push({
          titulo: document.getElementById('inputReuniaoTitulo').value || 'Reunião',
          data: document.getElementById('inputReuniaoData').value,
          hora: document.getElementById('inputReuniaoHora').value
        });
        salvarGrupoServidor(grupo, 'reunioes');
        mostrarToast('✅ Reunião agendada!', '#3b82f6');
      }
    }
  });
}

function salvarNotasGrupo(id) {
  const notas = document.getElementById('notasGrupoTexto') ? document.getElementById('notasGrupoTexto').value : '';
  const grupo = gruposEstudo.find(g => (g.id == id || g.id_grupo == id));
  if (grupo) {
    grupo.notas = notas;
    salvarGrupoServidor(grupo, 'notas');
    mostrarToast('✅ Notas salvas!', '#22c55e');
  }
}

function removerMembro(id, index) {
  Swal.fire({
    title: 'Remover Membro',
    text: 'Deseja realmente remover este membro do grupo?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Remover',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280'
  }).then(result => {
    if (result.isConfirmed) {
      const grupo = gruposEstudo.find(g => (g.id == id || g.id_grupo == id));
      if (grupo && grupo.membros) {
        grupo.membros.splice(index, 1);
        salvarGrupoServidor(grupo, 'membros');
        mostrarToast('✅ Membro removido!', '#22c55e');
      }
    }
  });
}

function removerTema(id, index) {
  Swal.fire({
    title: 'Remover Tema',
    text: 'Deseja realmente remover este tema?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Remover',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280'
  }).then(result => {
    if (result.isConfirmed) {
      const grupo = gruposEstudo.find(g => (g.id == id || g.id_grupo == id));
      if (grupo && grupo.temas) {
        grupo.temas.splice(index, 1);
        salvarGrupoServidor(grupo, 'temas');
        mostrarToast('✅ Tema removido!', '#22c55e');
      }
    }
  });
}

function removerDuvida(id, index) {
  Swal.fire({
    title: 'Remover Dúvida',
    text: 'Deseja realmente remover esta dúvida?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Remover',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280'
  }).then(result => {
    if (result.isConfirmed) {
      const grupo = gruposEstudo.find(g => (g.id == id || g.id_grupo == id));
      if (grupo && grupo.duvidas) {
        grupo.duvidas.splice(index, 1);
        salvarGrupoServidor(grupo, 'duvidas');
        mostrarToast('✅ Dúvida removida!', '#22c55e');
      }
    }
  });
}

function removerReuniao(id, index) {
  Swal.fire({
    title: 'Remover Reunião',
    text: 'Deseja realmente remover esta reunião?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Remover',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280'
  }).then(result => {
    if (result.isConfirmed) {
      const grupo = gruposEstudo.find(g => (g.id == id || g.id_grupo == id));
      if (grupo && grupo.reunioes) {
        grupo.reunioes.splice(index, 1);
        salvarGrupoServidor(grupo, 'reunioes');
        mostrarToast('✅ Reunião removida!', '#22c55e');
      }
    }
  });
}

function sairDoGrupo(id) {
  Swal.fire({
    title: 'Sair do Grupo',
    text: 'Deseja realmente sair deste grupo de estudos?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sair',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280'
  }).then(result => {
    if (result.isConfirmed) {
      const grupo = gruposEstudo.find(g => (g.id == id || g.id_grupo == id));
      if (grupo && grupo.membros) {
        let email = '';
        try {
          const userObj = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
          email = userObj.email;
        } catch (e) {}

        const idx = grupo.membros.findIndex(m => m.email === email);
        if (idx !== -1) {
          grupo.membros.splice(idx, 1);
          
          const groupId = grupo.id_grupo || grupo.id;
          apiFetch(`gruposestudo/${groupId}`, {
            method: "PUT",
            body: JSON.stringify({ membros: grupo.membros })
          }).then(resPut => {
            if (resPut.ok) {
              voltarListaGrupos();
              carregarGruposServidor();
              mostrarToast('Você saiu do grupo', '#3b82f6');
            } else {
              mostrarToast('❌ Erro ao sair do grupo', '#ef4444');
            }
          });
        }
      }
    }
  });
}

function voltarListaGrupos() {
  renderizarListaGrupos();
}

// ===== EXPORTAR FUNÇÕES GLOBALMENTE =====
window.abrirGruposEstudo = abrirGruposEstudo;
window.fecharGruposEstudo = fecharGruposEstudo;
window.abrirCriarGrupo = abrirCriarGrupo;
window.abrirEntrarGrupo = abrirEntrarGrupo;
window.copiarCodigo = copiarCodigo;
window.abrirDetalheGrupo = abrirDetalheGrupo;
window.trocarAbaGrupo = trocarAbaGrupo;
window.iniciarChamadaVideo = iniciarChamadaVideo;
window.adicionarMembro = adicionarMembro;
window.adicionarTema = adicionarTema;
window.adicionarDuvida = adicionarDuvida;
window.responderDuvida = responderDuvida;
window.agendarReuniao = agendarReuniao;
window.salvarNotasGrupo = salvarNotasGrupo;
window.exportarFlashcardsGrupo = exportarFlashcardsGrupo;
window.importarFlashcardsGrupo = importarFlashcardsGrupo;
window.importarFlashcardIndividual = importarFlashcardIndividual;
window.removerFlashcardGrupo = removerFlashcardGrupo;
window.praticarFlashcardsGrupo = praticarFlashcardsGrupo;
window.abrirModalPraticaGrupo = abrirModalPraticaGrupo;
window.carregarGruposServidor = carregarGruposServidor;
window.removerMembro = removerMembro;
window.removerTema = removerTema;
window.removerDuvida = removerDuvida;
window.removerReuniao = removerReuniao;
window.sairDoGrupo = sairDoGrupo;
window.voltarListaGrupos = voltarListaGrupos;

function abrirModalConfiguracoes() {
  console.log('⚙️ Abrindo configurações...');
  limparBackdropModal();

  if (typeof atualizarBotoesPlanos === 'function') {
    atualizarBotoesPlanos();
  }
  if (typeof atualizarSwitchModoEscuro === 'function') {
    atualizarSwitchModoEscuro();
  }
  
  const userData = window.usuarioLogadoPerfil || JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
  if (userData.nome && document.getElementById('novoNome')) document.getElementById('novoNome').value = userData.nome;
  if (userData.email && document.getElementById('novoEmail')) document.getElementById('novoEmail').value = userData.email;
  
  const modal = new bootstrap.Modal(document.getElementById('configModal'));
  modal.show();
}
window.abrirModalConfiguracoes = abrirModalConfiguracoes;

function fecharConfigModal() {
  const modalElement = document.getElementById('configModal');
  const modal = bootstrap.Modal.getInstance(modalElement);
  if (modal) {
    modal.hide();
  }
  setTimeout(() => {
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '';
  }, 300);
}
window.fecharConfigModal = fecharConfigModal;

function limparBackdropModal() {
  document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
  document.body.classList.remove('modal-open');
  document.body.style.overflow = 'auto';
  document.body.style.paddingRight = '';
}

function fecharModalSeguro(modalId) {
  const modalElement = document.getElementById(modalId);
  if (!modalElement) return;
  
  const modal = bootstrap.Modal.getInstance(modalElement);
  if (modal) {
    modal.hide();
  }
  setTimeout(() => {
    limparBackdropModal();
  }, 300);
}

// ===== MODO ESCURO =====
function alternarModoEscuroUsuario() {
  const isDark = document.body.classList.toggle('modo-escuro');
  localStorage.setItem('modoEscuro', isDark ? 'true' : 'false');
  atualizarSwitchModoEscuro();
}

function carregarModoEscuro() {
  const salvo = localStorage.getItem('modoEscuro');
  if (salvo === 'true') {
    document.body.classList.add('modo-escuro');
  } else {
    document.body.classList.remove('modo-escuro');
  }
  atualizarSwitchModoEscuro();
}

function atualizarSwitchModoEscuro() {
  const isDark = document.body.classList.contains('modo-escuro');
  const toggleThumb = document.querySelector('.theme-toggle-thumb');
  const toggleTrack = document.querySelector('.theme-toggle-track');
  
  if (toggleThumb && toggleTrack) {
    if (isDark) {
      toggleTrack.style.background = '#22c55e';
      toggleThumb.style.left = '25px';
    } else {
      toggleTrack.style.background = '#e5e7eb';
      toggleThumb.style.left = '3px';
    }
  }
}

// Aplicar imediatamente para evitar flash de tela clara
carregarModoEscuro();
document.addEventListener('DOMContentLoaded', carregarModoEscuro);

window.alternarModoEscuroUsuario = alternarModoEscuroUsuario;
window.carregarModoEscuro = carregarModoEscuro;
window.atualizarSwitchModoEscuro = atualizarSwitchModoEscuro;
window.limparBackdropModal = limparBackdropModal;
window.fecharModalSeguro = fecharModalSeguro;

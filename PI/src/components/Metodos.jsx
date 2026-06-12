import React, { useState, useEffect } from 'react';
import './Metodos.css';

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
    descricao: "Voce aprende melhor com palavras, leitura, escrita e comunicacao. Os metodos abaixo foram selecionados para seu perfil.",
    metodos: [
      {
        id: 1, titulo: "Pomodoro", tempo: "25 min", dificuldade: "Facil",
        descricao: "Estude em blocos de 25 minutos com pausas de 5 minutos. A cada ciclo, mude o conteudo.",
        passos: ["Escolha o conteudo", "Estude por 25 minutos", "Descanse 5 minutos", "Repita o ciclo", "A cada 4 ciclos, faça uma pausa longa de 15-30 minutos"],
        beneficios: ["Mantem o foco", "Evita cansaco mental", "Aumenta a produtividade"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Tecnica Feynman", tempo: "30 min", dificuldade: "Medio",
        descricao: "Aprenda explicando o conceito em voz alta com suas proprias palavras, como se estivesse ensinando alguem.",
        passos: ["Escolha um conceito", "Explique em voz alta com palavras simples", "Identifique as lacunas na sua explicacao", "Volte ao material original e estude novamente", "Reveja e simplifique"],
        beneficios: ["Desenvolve a comunicacao", "Identifica pontos fracos", "Fixa o conteudo"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 3, titulo: "Leitura Savoring", tempo: "40 min", dificuldade: "Facil",
        descricao: "Leia devagar, intercalando com pausas para reflexao e resumos pessoais.",
        passos: ["Escolha um texto relevante", "Leia um trecho por vez", "Pause e reflita sobre o que leu", "Anote suas reflexoes", "Faca um resumo com suas palavras"],
        beneficios: ["Aumenta a compreensao", "Melhora o vocabulario", "Desenvolve pensamento critico"],
        irParaRevisao: false
      },
      {
        id: 4, titulo: "Grupos de Estudo", tempo: "50 min", dificuldade: "Medio",
        descricao: "Estude em grupo para trocar conhecimento, esclarecer duvidas e reforcar conceitos ao ensinar colegas.",
        passos: ["Forme um grupo de 3-5 pessoas", "Divida os temas entre os membros", "Cada um prepara sua parte", "Revezem as explicacoes", "Tirem duvidas coletivamente"],
        beneficios: ["Troca de conhecimento", "Desenvolve habilidades sociais", "Aprendizado colaborativo"],
        irParaRevisao: false
      },
      {
        id: 5, titulo: "Flashcards", tempo: "25 min", dificuldade: "Facil",
        descricao: "Crie cartoes com perguntas de um lado e respostas do outro para revisar conceitos.",
        passos: ["Escreva uma pergunta na frente do cartao", "Escreva a resposta no verso", "Teste-se diariamente", "Separe o que acertou do que errou", "Revise mais os que errou"],
        beneficios: ["Memorizacao ativa", "Revisao eficiente", "Portabilidade"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 6, titulo: "Mnemonica com Palavras, Poemas ou Musicas", tempo: "20 min", dificuldade: "Facil",
        descricao: "Crie associacoes usando rimas, siglas, poemas ou musicas para memorizar conteudo.",
        passos: ["Liste as informacoes a memorizar", "Crie uma sigla ou frase conectando os conceitos", "Ou transforme em uma musica/parodia", "Repita varias vezes ate fixar"],
        beneficios: ["Memorizacao divertida", "Criacao de associacoes unicas", "Retencao de longo prazo"],
        irParaRevisao: true, tipoRevisao: "revisao_normal"
      },
      {
        id: 7, titulo: "Repeticao Espacada", tempo: "15 min/dia", dificuldade: "Medio",
        descricao: "Sistema de revisao que aumenta os intervalos conforme voce acerta as respostas.",
        passos: ["Dia 1: Estude o conteudo", "Dia 2: Revise rapidamente", "Dia 4: Revise os pontos dificeis", "Dia 7: Teste seus conhecimentos", "Dia 15: Revisao final"],
        beneficios: ["Revisao eficiente", "Memorizacao duradoura", "Otimizacao do tempo"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      }
    ]
  },

  // ==================== INTRAPESSOAL ====================
  intrapessoal: {
    nome: "Intrapessoal",
    cor: "#5170ff",
    descricao: "Voce aprende melhor sozinho, com reflexao, autoanalise e estudos individuais.",
    metodos: [
      {
        id: 1, titulo: "Pomodoro", tempo: "25 min", dificuldade: "Facil",
        descricao: "Estude em blocos de 25 minutos com pausas de 5 minutos. A cada ciclo, mude o conteudo.",
        passos: ["Escolha o conteudo", "Estude por 25 minutos", "Descanse 5 minutos", "Repita o ciclo", "A cada 4 ciclos, faca uma pausa longa"],
        beneficios: ["Mantem o foco", "Evita cansaco mental", "Aumenta a produtividade"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Tecnica Feynman", tempo: "30 min", dificuldade: "Medio",
        descricao: "Aprenda explicando o conceito em voz alta com suas proprias palavras.",
        passos: ["Escolha um conceito", "Explique em voz alta", "Identifique lacunas", "Volte ao material", "Simplifique a explicacao"],
        beneficios: ["Desenvolve autoconhecimento", "Identifica pontos fracos", "Fixa o conteudo"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 3, titulo: "Metodo Cornell", tempo: "35 min", dificuldade: "Medio",
        descricao: "Divida a pagina em duas colunas: esquerda para perguntas, direita para respostas e informacoes.",
        passos: ["Divida a pagina em duas colunas", "Lado esquerdo: escreva perguntas", "Lado direito: anote respostas e informacoes", "Revise cobrindo o lado direito e respondendo as perguntas"],
        beneficios: ["Organizacao visual", "Facilita autoavaliacao", "Material de revisao eficiente"],
        irParaRevisao: false
      },
      {
        id: 4, titulo: "Leitura Savoring", tempo: "40 min", dificuldade: "Facil",
        descricao: "Leia devagar, intercalando com pausas para reflexao e resumos pessoais.",
        passos: ["Escolha um local tranquilo", "Leia um trecho por vez", "Pause e reflita", "Anote suas reflexoes", "Faca um resumo pessoal"],
        beneficios: ["Conexao pessoal com o conteudo", "Desenvolvimento de empatia", "Aprendizado significativo"],
        irParaRevisao: false
      },
      {
        id: 5, titulo: "Repeticao Espacada", tempo: "15 min/dia", dificuldade: "Medio",
        descricao: "Sistema personalizado de revisao que voce gerencia conforme seu ritmo.",
        passos: ["Dia 1: Estude o conteudo", "Dia 2: Revise rapidamente", "Dia 4: Reveja pontos dificeis", "Dia 7: Autoavaliacao", "Dia 15: Revisao final"],
        beneficios: ["Autonomia no aprendizado", "Revisao personalizada", "Memorizacao duradoura"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      },
      {
        id: 6, titulo: "Flashcards", tempo: "20 min", dificuldade: "Facil",
        descricao: "Crie seus proprios cartoes para testar seus conhecimentos sozinho.",
        passos: ["Crie perguntas para si mesmo", "Escreva pergunta de um lado e resposta do outro", "Teste-se sem olhar a resposta", "Separe por nivel de dificuldade"],
        beneficios: ["Material personalizado", "Autoavaliacao honesta", "Estudo independente"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      }
    ]
  },

  // ==================== INTERPESSOAL ====================
  interpessoal: {
    nome: "Interpessoal",
    cor: "#ff5f00",
    descricao: "Voce aprende melhor com outras pessoas, em grupo, discutindo e colaborando.",
    metodos: [
      {
        id: 1, titulo: "Pomodoro", tempo: "25 min", dificuldade: "Facil",
        descricao: "Estude em blocos de 25 minutos com pausas de 5 minutos. Pode ser feito em grupo.",
        passos: ["Escolha o conteudo", "Estude por 25 minutos", "Descanse 5 minutos", "Repita o ciclo"],
        beneficios: ["Mantem o foco", "Pode ser feito em grupo", "Aumenta a produtividade"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Tecnica Feynman", tempo: "40 min", dificuldade: "Medio",
        descricao: "Aprenda explicando conceitos para seus colegas como se estivessem aprendendo pela primeira vez.",
        passos: ["Cada membro escolhe um conceito", "Explique para o grupo", "Use analogias e exemplos simples", "Peca perguntas e feedback", "Troque de papeis"],
        beneficios: ["Desenvolve lideranca", "Aprendizado colaborativo", "Feedback em tempo real"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 3, titulo: "Teste Pratico", tempo: "30 min", dificuldade: "Medio",
        descricao: "Resolva provas anteriores e exercicios. Pode ser feito em dupla para correcao conjunta.",
        passos: ["Escolha provas ou exercicios", "Responda individualmente", "Corrija com um colega", "Discutam os erros", "Criem um banco de questoes"],
        beneficios: ["Avaliacao colaborativa", "Discussao enriquecedora", "Identificacao de pontos fracos"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 4, titulo: "Mnemonica com Poemas ou Musicas", tempo: "25 min", dificuldade: "Facil",
        descricao: "Criem juntos musicas, parodias ou poemas para memorizar conteudo de forma divertida.",
        passos: ["Reunam o grupo", "Escolham um conteudo", "Selecionem uma melodia conhecida", "Criem a letra juntos", "Ensaie e apresentem"],
        beneficios: ["Aprendizado ludico", "Criacao coletiva", "Fixacao por musica"],
        irParaRevisao: true, tipoRevisao: "revisao_normal"
      },
      {
        id: 5, titulo: "Estudo com Videos Educativos", tempo: "30 min", dificuldade: "Facil",
        descricao: "Assistam videos educativos juntos e depois discutam os pontos principais.",
        passos: ["Escolham um video educativo", "Assistam juntos", "Pausem para discutir", "Cada um anota um ponto principal", "Criem um resumo coletivo"],
        beneficios: ["Aprendizado colaborativo", "Discussao enriquecedora", "Diferentes pontos de vista"],
        irParaRevisao: false
      },
      {
        id: 6, titulo: "Repeticao Espacada", tempo: "20 min/sessao", dificuldade: "Medio",
        descricao: "Sistema de revisao em grupo onde cada um testa o outro em intervalos programados.",
        passos: ["Formem um grupo de compromisso", "Dia 1: Estudo inicial", "Dia 2: Revisao rapida em duplas", "Dia 4: Testem uns aos outros", "Dia 7: Sessao de duvidas", "Dia 15: Revisao final"],
        beneficios: ["Compromisso coletivo", "Aprendizado colaborativo", "Responsabilidade compartilhada"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      },
      {
        id: 7, titulo: "Grupos de Estudo", tempo: "60 min", dificuldade: "Medio",
        descricao: "Estrategia para trocar conhecimento, esclarecer duvidas e reforcar conceitos ao ensinar colegas.",
        passos: ["Definam um grupo de 3-5 pessoas", "Dividam o conteudo em partes", "Cada um prepara sua parte", "Revezem explicacoes", "Tirem duvidas coletivamente"],
        beneficios: ["Desenvolvimento social", "Aprendizado diversificado", "Rede de apoio mutuo"],
        irParaRevisao: false
      }
    ]
  },

  // ==================== MUSICAL ====================
  musical: {
    nome: "Musical",
    cor: "#8a03d2",
    descricao: "Voce aprende melhor com ritmo, melodia, sons e musicas.",
    metodos: [
      {
        id: 1, titulo: "Pomodoro", tempo: "25 min", dificuldade: "Facil",
        descricao: "Estude em blocos de 25 minutos com musicas instrumentais para manter o foco e ritmo.",
        passos: ["Escolha uma playlist instrumental", "Configure um timer de 25 minutos", "Estude ate o timer tocar", "Descanse 5 minutos", "Repita o ciclo"],
        beneficios: ["Ritmo constante", "Associacao musica-produtividade", "Experiencia prazerosa"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Mnemonica com Poemas ou Musicas", tempo: "30 min", dificuldade: "Facil",
        descricao: "Crie musicas, parodias ou rimas para memorizar conteudo de forma divertida e melodica.",
        passos: ["Escolha uma melodia conhecida", "Adapte o conteudo para a letra", "Mantenha o ritmo e a rima", "Ensaiote cantando", "Grave sua parodia"],
        beneficios: ["Memorizacao natural", "Desenvolvimento criativo", "Aprendizado leve"],
        irParaRevisao: true, tipoRevisao: "revisao_normal"
      },
      {
        id: 3, titulo: "Gravacao de Podcast", tempo: "40 min", dificuldade: "Medio",
        descricao: "Grave audio da sua propria explicacao para enfatizar a memorizacao da materia.",
        passos: ["Escolha um tema", "Escreva um roteiro simples", "Configure o gravador", "Grave explicando o conteudo", "Ouca e identifique pontos a melhorar"],
        beneficios: ["Material de revisao auditiva", "Desenvolvimento de comunicacao", "Criacao de portfolio"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      },
      {
        id: 4, titulo: "Estudo com Videos Educativos", tempo: "25 min", dificuldade: "Facil",
        descricao: "Assista videos educativos e crie trilhas sonoras ou resumos em formato de musica.",
        passos: ["Selecione um video educativo", "Assista prestando atencao aos sons", "Pause e crie um jingle para cada topico", "Anote o conteudo", "Produza uma parodia"],
        beneficios: ["Aprendizado multimodal", "Associacoes musicais", "Engajamento auditivo"],
        irParaRevisao: false
      },
      {
        id: 5, titulo: "Repeticao Espacada", tempo: "15 min/dia", dificuldade: "Medio",
        descricao: "Sistema de revisao onde voce usa batidas e ritmos para marcar os intervalos.",
        passos: ["Crie uma playlist com musicas para cada dia", "Dia 1: Estudo inicial", "Dia 2: Revisao rapida", "Dia 4: Teste cantando", "Dia 7: Crie um beatbox do conteudo", "Dia 15: Revisao final"],
        beneficios: ["Revisao no seu ritmo", "Associacoes ritmicas", "Consistencia musical"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      }
    ]
  },

  // ==================== LÓGICO-MATEMÁTICA ====================
  logico: {
    nome: "Logico-Matematica",
    cor: "#ffbd59",
    descricao: "Voce tem facilidade com numeros, padroes e raciocinio abstrato.",
    metodos: [
      {
        id: 1, titulo: "Pomodoro", tempo: "25 min", dificuldade: "Facil",
        descricao: "Estude em blocos de 25 minutos com pausas de 5 minutos. Ideal para manter o foco em calculos e problemas.",
        passos: ["Escolha o conteudo", "Estude por 25 minutos", "Descanse 5 minutos", "Repita o ciclo"],
        beneficios: ["Mantem o foco", "Evita cansaco mental", "Aumenta a produtividade"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Metodo Cornell", tempo: "35 min", dificuldade: "Medio",
        descricao: "Divida a pagina em duas colunas: esquerda para perguntas, direita para respostas e formulas.",
        passos: ["Divida a pagina em duas colunas", "Lado esquerdo: escreva perguntas e formulas", "Lado direito: anote respostas e explicacoes", "Revise cobrindo o lado direito"],
        beneficios: ["Organizacao logica", "Facilita autoavaliacao", "Material de revisao"],
        irParaRevisao: false
      },
      {
        id: 3, titulo: "Mapa Mental", tempo: "30 min", dificuldade: "Medio",
        descricao: "Organize o conteudo de forma grafica com foco no tema central e topicos relacionados.",
        passos: ["Escreva o tema central no meio", "Puxe ramos para cada subtopico", "Adicione palavras-chave em cada ramo", "Use cores para diferenciar categorias", "Conecte ideias relacionadas"],
        beneficios: ["Visualizacao geral", "Conexao entre conceitos", "Organizacao hierarquica"],
        irParaRevisao: false
      },
      {
        id: 4, titulo: "Teste Pratico", tempo: "35 min", dificuldade: "Medio",
        descricao: "Resolver provas anteriores e exercicios e uma forma eficiente para fixar o conteudo.",
        passos: ["Escolha provas ou exercicios", "Resolva sem consulta", "Corrija seus erros", "Refaca os exercicios que errou", "Anote o que precisa revisar"],
        beneficios: ["Fixacao por pratica", "Identificacao de dificuldades", "Preparacao para provas"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 5, titulo: "Mnemonica com Numeros ou Listas Ordenadas", tempo: "20 min", dificuldade: "Facil",
        descricao: "Crie associacoes usando numeros, sequencias ou listas ordenadas para memorizar.",
        passos: ["Liste as informacoes em ordem", "Crie uma sequencia logica ou numerica", "Associe cada item a um numero", "Repita a sequencia varias vezes"],
        beneficios: ["Memorizacao estruturada", "Associacoes logicas", "Retencao de sequencias"],
        irParaRevisao: true, tipoRevisao: "revisao_normal"
      },
      {
        id: 6, titulo: "Diagrama de Fluxos", tempo: "30 min", dificuldade: "Medio",
        descricao: "Representacao grafica dos passos de um processo, ideal para visualizar etapas logicas.",
        passos: ["Identifique o processo a mapear", "Liste as etapas em ordem", "Desenhe caixas para cada etapa", "Conecte com setas indicando o fluxo", "Revise a logica do diagrama"],
        beneficios: ["Visualizacao de processos", "Clareza nas etapas", "Identificacao de falhas"],
        irParaRevisao: false
      },
      {
        id: 7, titulo: "Repeticao Espacada", tempo: "15 min/dia", dificuldade: "Medio",
        descricao: "Sistema de revisao que aumenta os intervalos conforme voce acerta.",
        passos: ["Dia 1: Estude o conteudo", "Dia 2: Revise rapidamente", "Dia 4: Revise pontos dificeis", "Dia 7: Teste seus conhecimentos", "Dia 15: Revisao final"],
        beneficios: ["Revisao eficiente", "Memorizacao duradoura", "Otimizacao do tempo"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      }
    ]
  },

  // ==================== ESPACIAL ====================
  espacial: {
    nome: "Espacial",
    cor: "#d203a4",
    descricao: "Voce pensa em imagens e visualiza o mundo tridimensionalmente.",
    metodos: [
      {
        id: 1, titulo: "Pomodoro", tempo: "25 min", dificuldade: "Facil",
        descricao: "Estude em blocos de 25 minutos com pausas de 5 minutos.",
        passos: ["Escolha o conteudo", "Estude por 25 minutos", "Descanse 5 minutos", "Repita o ciclo"],
        beneficios: ["Mantem o foco", "Evita cansaco mental", "Aumenta a produtividade"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Metodo Cornell", tempo: "35 min", dificuldade: "Medio",
        descricao: "Divida a pagina em duas colunas para organizar perguntas e respostas visualmente.",
        passos: ["Divida a pagina em duas colunas", "Lado esquerdo: perguntas", "Lado direito: respostas", "Use cores e desenhos para destacar"],
        beneficios: ["Organizacao visual", "Facilita revisao", "Material personalizado"],
        irParaRevisao: false
      },
      {
        id: 3, titulo: "Mapa Mental", tempo: "30 min", dificuldade: "Medio",
        descricao: "Organize o conteudo de forma grafica e visual com foco no tema central.",
        passos: ["Escreva o tema central no meio", "Puxe ramos para cada subtopico", "Use imagens e cores", "Conecte ideias relacionadas", "Crie uma hierarquia visual"],
        beneficios: ["Visualizacao geral", "Conexao entre conceitos", "Estimulo visual"],
        irParaRevisao: false
      },
      {
        id: 4, titulo: "Flashcards", tempo: "25 min", dificuldade: "Facil",
        descricao: "Crie cartoes visuais com perguntas de um lado e respostas do outro.",
        passos: ["Crie cartoes com elementos visuais", "Frente: pergunta ou imagem", "Verso: resposta ou explicacao", "Teste-se diariamente"],
        beneficios: ["Memorizacao visual", "Revisao eficiente", "Portabilidade"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 5, titulo: "Mnemonica com Imagens e Objetos", tempo: "20 min", dificuldade: "Facil",
        descricao: "Crie associacoes visuais usando imagens, desenhos ou objetos para memorizar.",
        passos: ["Liste as informacoes a memorizar", "Crie uma imagem mental para cada item", "Associe as imagens entre si", "Desenhe se preferir", "Revise visualizando as imagens"],
        beneficios: ["Memorizacao visual", "Criacao de associacoes", "Retencao duradoura"],
        irParaRevisao: true, tipoRevisao: "revisao_normal"
      },
      {
        id: 6, titulo: "Diagrama de Fluxos", tempo: "30 min", dificuldade: "Medio",
        descricao: "Representacao grafica dos passos de um processo para visualizar etapas.",
        passos: ["Identifique o processo", "Liste as etapas em ordem", "Desenhe o fluxo com setas", "Use cores para cada etapa", "Revise a logica visual"],
        beneficios: ["Visualizacao de processos", "Clareza nas etapas", "Organizacao grafica"],
        irParaRevisao: false
      },
      {
        id: 7, titulo: "Repeticao Espacada", tempo: "15 min/dia", dificuldade: "Medio",
        descricao: "Sistema de revisao que aumenta os intervalos conforme voce acerta.",
        passos: ["Dia 1: Estude o conteudo", "Dia 2: Revise rapidamente", "Dia 4: Revise pontos dificeis", "Dia 7: Teste seus conhecimentos", "Dia 15: Revisao final"],
        beneficios: ["Revisao eficiente", "Memorizacao duradoura", "Otimizacao do tempo"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      }
    ]
  },

  // ==================== CORPORAL-CINESTÉSICA ====================
  corporal: {
    nome: "Corporal-Cinestesica",
    cor: "#00bf63",
    descricao: "Voce aprende melhor com movimento, pratica e experiencias hands-on.",
    metodos: [
      {
        id: 1, titulo: "Pomodoro com Descanso Ativo", tempo: "25 min", dificuldade: "Facil",
        descricao: "Estude em blocos de 25 minutos. Nos intervalos, faca caminhadas curtas ou alongamentos.",
        passos: ["Escolha o conteudo", "Estude por 25 minutos", "Descanse 5 minutos com caminhada ou alongamento", "Repita o ciclo"],
        beneficios: ["Mantem o foco", "Movimento no descanso", "Aumenta a produtividade"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Teste Pratico", tempo: "35 min", dificuldade: "Medio",
        descricao: "Resolver provas anteriores e exercicios praticos e uma forma eficiente para fixar o conteudo.",
        passos: ["Escolha provas ou exercicios", "Resolva sem consulta", "Corrija seus erros", "Refaca os exercicios que errou"],
        beneficios: ["Fixacao por pratica", "Identificacao de dificuldades", "Preparacao para provas"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 3, titulo: "Grupos de Estudo", tempo: "50 min", dificuldade: "Medio",
        descricao: "Estude em grupo para trocar conhecimento e reforcar conceitos ao ensinar colegas.",
        passos: ["Forme um grupo de 3-5 pessoas", "Divida os temas", "Cada um prepara sua parte", "Revezem as explicacoes", "Tirem duvidas coletivamente"],
        beneficios: ["Troca de conhecimento", "Desenvolvimento social", "Aprendizado colaborativo"],
        irParaRevisao: false
      },
      {
        id: 4, titulo: "Mnemonica com Movimentos", tempo: "20 min", dificuldade: "Facil",
        descricao: "Crie associacoes usando gestos, movimentos ou dancas para memorizar conteudo.",
        passos: ["Liste as informacoes a memorizar", "Crie um gesto ou movimento para cada item", "Repita os movimentos em sequencia", "Associe o movimento ao conteudo"],
        beneficios: ["Memorizacao cinestesica", "Associacao movimento-conteudo", "Aprendizado ativo"],
        irParaRevisao: true, tipoRevisao: "revisao_normal"
      },
      {
        id: 5, titulo: "Estudo com Videos Educativos", tempo: "30 min", dificuldade: "Facil",
        descricao: "Assista videos educativos para visualizar e compreender conceitos dificeis no papel.",
        passos: ["Escolha um video educativo", "Assista fazendo anotacoes", "Pause para praticar o que aprendeu", "Reveja os trechos dificeis"],
        beneficios: ["Visualizacao de conceitos", "Aprendizado dinamico", "Complemento ao estudo"],
        irParaRevisao: false
      },
      {
        id: 6, titulo: "Repeticao Espacada", tempo: "15 min/dia", dificuldade: "Medio",
        descricao: "Sistema de revisao que aumenta os intervalos conforme voce acerta.",
        passos: ["Dia 1: Estude o conteudo", "Dia 2: Revise rapidamente", "Dia 4: Revise pontos dificeis", "Dia 7: Teste seus conhecimentos", "Dia 15: Revisao final"],
        beneficios: ["Revisao eficiente", "Memorizacao duradoura", "Otimizacao do tempo"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      },
      {
        id: 7, titulo: "Flashcards", tempo: "20 min", dificuldade: "Facil",
        descricao: "Crie cartoes com perguntas de um lado e respostas do outro para revisar.",
        passos: ["Crie cartoes de estudo", "Frente: pergunta", "Verso: resposta", "Teste-se caminhando enquanto revisa"],
        beneficios: ["Memorizacao ativa", "Revisao em movimento", "Portabilidade"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      }
    ]
  }
};

const Metodos = () => {
  const [tipoInteligencia, setTipoInteligencia] = useState(null);
  const [metodos, setMetodos] = useState(null);
  const [metodoSelecionado, setMetodoSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tipoSalvo = localStorage.getItem('inteligenciaUsuario');
    
    if (tipoSalvo && metodosPorInteligencia[tipoSalvo]) {
      setTipoInteligencia(tipoSalvo);
      setMetodos(metodosPorInteligencia[tipoSalvo]);
      const cor = metodosPorInteligencia[tipoSalvo].cor;
      document.documentElement.style.setProperty('--cor-primaria', cor);
    } else {
      setTipoInteligencia('logico');
      setMetodos(metodosPorInteligencia.logico);
    }
    
    setLoading(false);
  }, []);

  const irParaRevisao = (tipoRevisao, metodoTitulo) => {
    localStorage.setItem('revisaoTipoAtivo', tipoRevisao);
    localStorage.setItem('metodoSelecionado', metodoTitulo);
    
    if (window.mostrarTela) {
      window.mostrarTela('revisao');
    }
    
    setMetodoSelecionado(null);
  };

  if (loading) {
    return (
      <div className="metodos-loading">
        <div className="spinner"></div>
        <p>Carregando metodos personalizados...</p>
      </div>
    );
  }

  return (
    <section id="metodosSection" className="metodos-container">
      <div className="metodos-header">
        <div className="inteligencia-badge" style={{ background: metodos.cor }}>
          <img 
            src={iconesInteligencia[tipoInteligencia]} 
            alt={metodos.nome}
            style={{ width: 28, height: 28, objectFit: 'contain' }}
          />
          <span>Inteligencia {metodos.nome}</span>
        </div>
        
        <h1>Metodos de Estudo para voce</h1>
        <p className="metodos-descricao">{metodos.descricao}</p>
      </div>

      <div className="metodos-grid">
        {metodos.metodos.map((metodo) => (
          <div 
            key={metodo.id} 
            className="metodo-card"
            onClick={() => setMetodoSelecionado(metodo)}
          >
            <div className="metodo-card-header">
              <h3>{metodo.titulo}</h3>
              <div className="metodo-tags">
                <span className="tag-tempo">
                  <i className="bi bi-clock"></i> {metodo.tempo}
                </span>
                <span className={`tag-dificuldade ${metodo.dificuldade.toLowerCase()}`}>
                  {metodo.dificuldade}
                </span>
              </div>
            </div>
            <p className="metodo-descricao">{metodo.descricao}</p>
            <button className="btn-ver-mais" style={{ color: metodos.cor }}>
              Ver metodo completo <i className="bi bi-arrow-right"></i>
            </button>
          </div>
        ))}
      </div>

      {metodoSelecionado && (
        <div className="modal-overlay" onClick={() => setMetodoSelecionado(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setMetodoSelecionado(null)}>
              <i className="bi bi-x-lg"></i>
            </button>
            
            <div className="modal-header">
              <h2>{metodoSelecionado.titulo}</h2>
              <div className="modal-tags">
                <span className="tag-tempo">
                  <i className="bi bi-clock"></i> {metodoSelecionado.tempo}
                </span>
                <span className={`tag-dificuldade ${metodoSelecionado.dificuldade.toLowerCase()}`}>
                  {metodoSelecionado.dificuldade}
                </span>
              </div>
            </div>

            <div className="modal-body">
              <h4>Passo a Passo:</h4>
              <ol className="modal-passos">
                {metodoSelecionado.passos.map((passo, index) => (
                  <li key={index}>{passo}</li>
                ))}
              </ol>

              {metodoSelecionado.beneficios && (
                <div className="modal-beneficios">
                  <strong>Beneficios:</strong>
                  <ul>
                    {metodoSelecionado.beneficios.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="modal-dica">
                <i className="bi bi-lightbulb-fill"></i>
                <span>Dica: Adapte esse metodo ao seu estilo pessoal e combine com outras tecnicas.</span>
              </div>
            </div>

            <div className="modal-footer">
  {metodoSelecionado.titulo === 'Flashcards' ? (
    <button 
      className="btn-aplicar"
      style={{ background: metodos.cor }}
      onClick={() => {
        localStorage.setItem('metodoSelecionado', metodoSelecionado.titulo);
        setMetodoSelecionado(null);
        window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'revisao' }));
      }}
    >
      <i className="bi bi-arrow-repeat"></i> Ir para Revisao (Criar Flashcards)
    </button>
  ) : (
    <button 
      className="btn-aplicar"
      style={{ background: metodos.cor }}
      onClick={() => setMetodoSelecionado(null)}
    >
      <i className="bi bi-check-circle-fill"></i> Entendi
    </button>
  )}
</div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Metodos;
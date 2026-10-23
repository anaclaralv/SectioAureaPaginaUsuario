import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
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
    descricao: "Você aprende melhor com palavras, leitura, escrita e comunicação. Os métodos abaixo foram selecionados para potencializar seu perfil.",
    metodos: [
      {
        id: 1, titulo: "Pomodoro", tempo: "25 min", dificuldade: "Fácil",
        descricao: "Estude em blocos de 25 minutos com pausas de 5 minutos. A cada ciclo, alterne os tópicos para manter o foco máximo.",
        passos: ["Escolha o conteúdo a ser estudado", "Estude focado por 25 minutos", "Descanse 5 minutos", "Repita o ciclo", "A cada 4 ciclos, faça uma pausa longa de 15 a 30 minutos"],
        beneficios: ["Mantém o foco elevado", "Evita cansaço mental e procrastinação", "Aumenta o rendimento diário"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Técnica Feynman", tempo: "30 min", dificuldade: "Médio",
        descricao: "Aprenda explicando o conceito em voz alta com suas próprias palavras, como se estivesse ensinando alguém leigo.",
        passos: ["Escolha um conceito que acabou de estudar", "Grave ou explique em voz alta com termos simples", "Identifique as lacunas na sua explicação", "Volte ao material de apoio para sanar dúvidas", "Simplifique e crie analogias claras"],
        beneficios: ["Desenvolve a articulação e oratória", "Identifica lacunas de aprendizado", "Fixação profunda de conceitos difíceis"],
        irParaRevisao: false
      },
      {
        id: 3, titulo: "Leitura Savoring", tempo: "40 min", dificuldade: "Fácil",
        descricao: "Leia pausadamente, intercalando com reflexões pessoais e registros sintéticos com suas palavras.",
        passos: ["Escolha um texto relevante", "Leia um parágrafo por vez com atenção plena", "Pause e reflita sobre a ideia central", "Anote suas reflexões no caderno digital", "Faça um resumo final com suas palavras"],
        beneficios: ["Aumenta a absorção textual", "Amplia o vocabulário e repertório", "Desenvolve o pensamento crítico reflexivo"],
        irParaRevisao: false
      },
      {
        id: 4, titulo: "Grupos de Estudo", tempo: "50 min", dificuldade: "Médio",
        descricao: "Estude em grupo para trocar conhecimento, debater dúvidas e consolidar a matéria ao ensinar colegas.",
        passos: ["Reúna seu grupo de estudos", "Defina a pauta da sessão colaborativa", "Compartilhe resumos e flashcards", "Expliquem pontos complexos mutuamente", "Pratiquem exercícios e tirem dúvidas"],
        beneficios: ["Troca rica de perspectivas", "Desenvolve liderança e oratória", "Aprendizado ativo e colaborativo"],
        irParaRevisao: false
      },
      {
        id: 5, titulo: "Flashcards", tempo: "25 min", dificuldade: "Fácil",
        descricao: "Crie cartões com perguntas de um lado e respostas do outro para testar sua recuperação ativa de memória.",
        passos: ["Crie cartões concisos com perguntas-chave", "Tente responder mentalmente antes de virar", "Classifique a dificuldade da resposta", "Revise com frequência os cartões difíceis", "Automatize a revisão periódica"],
        beneficios: ["Recuperação ativa da memória", "Revisão rápida e objetiva", "Excelente portabilidade para rotina"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 6, titulo: "Mnemônica com Palavras ou Músicas", tempo: "20 min", dificuldade: "Fácil",
        descricao: "Crie associações mnemônicas usando acrônimos, rimas ou paródias para reter listas e conceitos complexos.",
        passos: ["Selecione as informações ou listas a reter", "Crie uma palavra ou frase com as iniciais", "Ou componha uma rima associativa", "Repita a mnemônica em momentos aleatórios"],
        beneficios: ["Memorização ágil e divertida", "Cria âncoras mentais resistentes ao esquecimento", "Ideal para provas e exames"],
        irParaRevisao: true, tipoRevisao: "revisao_normal"
      },
      {
        id: 7, titulo: "Repetição Espaçada", tempo: "15 min/dia", dificuldade: "Médio",
        descricao: "Sistema científico que programa revisões com intervalos calculados para combater a Curva do Esquecimento de Ebbinghaus.",
        passos: ["Estude o conteúdo no Dia 1", "Faça a 1ª revisão no Dia 2", "Faça a 2ª revisão no Dia 4", "Faça a 3ª revisão no Dia 7", "Consolide no Dia 15 e Dia 30"],
        beneficios: ["Retenção garantida a longo prazo", "Otimiza horas de estudo eliminando revisões inúteis", "Prepara para grandes vestibulares"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      }
    ]
  },

  // ==================== INTRAPESSOAL ====================
  intrapessoal: {
    nome: "Intrapessoal",
    cor: "#5170ff",
    descricao: "Você aprende melhor sozinho, com reflexão profunda, autoavaliação e cadernos individuais de anotações.",
    metodos: [
      {
        id: 1, titulo: "Pomodoro", tempo: "25 min", dificuldade: "Fácil",
        descricao: "Estude em blocos de 25 minutos com pausas de 5 minutos, estabelecendo metas próprias para cada bloco.",
        passos: ["Defina uma meta pessoal para o bloco", "Mantenha o ambiente silencioso por 25 minutos", "Faça 5 minutos de respiração e relaxamento", "Repita o ciclo mantendo seu ritmo"],
        beneficios: ["Autonomia nos estudos", "Respeito ao próprio ritmo biológico", "Alta produtividade sem distrações"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Técnica Feynman", tempo: "30 min", dificuldade: "Médio",
        descricao: "Grave suas explicações em áudio e escute com espírito crítico para identificar pontos a aprimorar.",
        passos: ["Escolha o conceito a ser dominado", "Grave sua explicação na plataforma", "Escute o áudio com espírito de autoanálise", "Sublinhe os trechos com hesitação", "Aprofunde as lacunas e regrave"],
        beneficios: ["Autoconhecimento refinado", "Identificação precisa de fraquezas", "Domínio independente da matéria"],
        irParaRevisao: false
      },
      {
        id: 3, titulo: "Método Cornell", tempo: "35 min", dificuldade: "Médio",
        descricao: "Divida a página: notas principais, palavras-chave à esquerda e um sumário reflexivo abaixo.",
        passos: ["Divida a página em três zonas estruturadas", "Tome notas durante os estudos na área maior", "Extraia palavras-chave e perguntas à esquerda", "Elabore um sumário com suas reflexões", "Revise cobrindo as notas e respondendo às perguntas"],
        beneficios: ["Organização visual impecável", "Facilita autoavaliação autônoma", "Material de revisão de altíssimo valor"],
        irParaRevisao: false
      },
      {
        id: 4, titulo: "Leitura Savoring", tempo: "40 min", dificuldade: "Fácil",
        descricao: "Leitura silenciosa reflexiva com pausas deliberadas para digerir ideias e criar notas pessoais.",
        passos: ["Escolha um capítulo ou texto denso", "Leia com atenção plena sem pressa", "Conecte as ideias com suas experiências", "Registre suas conclusões no bloco de notas"],
        beneficios: ["Conexão íntima com o conteúdo", "Desenvolve foco e contemplação", "Fixação duradoura de ideias"],
        irParaRevisao: false
      },
      {
        id: 5, titulo: "Flashcards", tempo: "20 min", dificuldade: "Fácil",
        descricao: "Treine autoavaliação com cartões de pergunta e resposta gerados a partir de suas anotações.",
        passos: ["Elabore perguntas desafiadoras", "Teste-se individualmente", "Monitore sua taxa de acertos", "Ajuste os intervalos para os cartões difíceis"],
        beneficios: ["Avaliação sincera e sem pressão externa", "Melhora contínua", "Flexibilidade total de horário"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 6, titulo: "Repetição Espaçada", tempo: "15 min/dia", dificuldade: "Médio",
        descricao: "Acompanhe seu próprio progresso no cronômetro da Curva de Ebbinghaus.",
        passos: ["Distribua seus tópicos no calendário", "Revise nos marcos de espaçamento", "Avalie a facilidade de cada resposta", "Reforce tópicos com maior taxa de erro"],
        beneficios: ["Disciplina pessoal consistente", "Monitoramento transparente", "Consolidação na memória duradoura"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      }
    ]
  },

  // ==================== INTERPESSOAL ====================
  interpessoal: {
    nome: "Interpessoal",
    cor: "#ff5f00",
    descricao: "Você aprende melhor interagindo, dialogando, debatendo com colegas e ensinando o que aprendeu.",
    metodos: [
      {
        id: 1, titulo: "Grupos de Estudo", tempo: "60 min", dificuldade: "Médio",
        descricao: "Sessões dinâmicas de estudo coletivo com divisão de tópicos e debates orientados.",
        passos: ["Organize um grupo com metas claras", "Distribua os subtópicos entre os membros", "Cada membro apresenta sua pesquisa", "Debatam os pontos divergentes e aplicações práticas", "Resolvam exercícios desafiadores em conjunto"],
        beneficios: ["Intercâmbio de perspectivas", "Desenvolve empatia e comunicação", "Motivação mútua para manter a rotina"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Técnica Feynman para Amigos", tempo: "30 min", dificuldade: "Médio",
        descricao: "Explique a matéria para um colega que não domina o assunto e receba dúvidas reais.",
        passos: ["Convide um colega para ouvir", "Apresente o assunto em 5 a 10 minutos de forma fluida", "Peça que o colega faça perguntas e aponte dúvidas", "Reestruture o raciocínio até o conceito ficar claro"],
        beneficios: ["Didática lapidada na prática", "Feedbacks em tempo real", "Certeza absoluta de domínio do tema"],
        irParaRevisao: false
      },
      {
        id: 3, titulo: "Gravação de Podcast", tempo: "35 min", dificuldade: "Médio",
        descricao: "Grave episódios curtos em formato de conversa ou programa de rádio compartilhável.",
        passos: ["Crie uma pauta de podcast sobre a matéria", "Grave uma conversa ou monólogo informativo", "Compartilhe o áudio com seus colegas de classe", "Escute episódios de outros estudantes"],
        beneficios: ["Desenvolve clareza de transmissão", "Estudo dinâmico e criativo", "Compartilhamento colaborativo"],
        irParaRevisao: false
      },
      {
        id: 4, titulo: "Teste Prático em Dupla", tempo: "45 min", dificuldade: "Médio",
        descricao: "Resolva simulados com um parceiro, justificando cada alternativa escolhida.",
        passos: ["Definam uma lista de exercícios", "Resolvam a questão individualmente em 3 minutos", "Comparam o gabarito e justifiquem a lógica", "Identifiquem pegadinhas de banca em conjunto"],
        beneficios: ["Argumentação lógica fortalecida", "Menos desatenção em enunciados", "Fixação de estratégias de prova"],
        irParaRevisao: false
      },
      {
        id: 5, titulo: "Pomodoro Social", tempo: "50 min", dificuldade: "Fácil",
        descricao: "Estudem no mesmo ambiente com ciclos de foco e compartilhem o progresso nos intervalos.",
        passos: ["Iniciem o cronômetro sincronizados", "Foco total silencioso durante 25 minutos", "Nos 5 minutos de pausa, compartilhem um insight", "Repitam os blocos estimulando uns aos outros"],
        beneficios: ["Comprometimento mútuo", "Redução de distrações individuais", "Sensação gostosa de time"],
        irParaRevisao: false
      }
    ]
  },

  // ==================== MUSICAL ====================
  musical: {
    nome: "Musical",
    cor: "#8a03d2",
    descricao: "Você tem facilidade com ritmo, sonoridade, melodias e assimilação por meio de padrões sonoros.",
    metodos: [
      {
        id: 1, titulo: "Gravação de Podcast", tempo: "30 min", dificuldade: "Médio",
        descricao: "Transforme resumos de matéria em episódios de áudio dinâmicos com entonação expressiva.",
        passos: ["Roteirize os tópicos com ritmo e cadência", "Grave no estúdio com clareza vocal", "Escute seus próprios áudios durante deslocamentos", "Aproveite a modulação vocal para fixar pontos-chave"],
        beneficios: ["Excelente retenção auditiva", "Estudo em qualquer lugar com fones", "Facilidade de assimilação de termos"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Mnemônica com Palavras ou Músicas", tempo: "25 min", dificuldade: "Fácil",
        descricao: "Componha rimas e paródias musicais associando fórmulas, datas e tabelas à métrica melódica.",
        passos: ["Escolha uma música conhecida de ritmo marcante", "Adapte a letra para incluir o conteúdo", "Cante a melodia repetidas vezes", "Grave um áudio de referência para revisões"],
        beneficios: ["Fixação imediata de fórmulas e listas", "Associação mnemônica instantânea", "Estudo leve e memorável"],
        irParaRevisao: true, tipoRevisao: "revisao_normal"
      },
      {
        id: 3, titulo: "Estudo com Vídeos Educativos", tempo: "35 min", dificuldade: "Fácil",
        descricao: "Estude assistindo videoaulas de professores com boa didática auditiva, gravando resumos em áudio.",
        passos: ["Suba o link do vídeo educativo no módulo", "Ouça as explicações com atenção ao tom e ênfase", "Grave um áudio resumindo a lição principal", "Salve suas anotações com timestamps"],
        beneficios: ["Combinação rica de som e explicação", "Captação de nuances orais dos professores", "Fixação por repetição auditiva"],
        irParaRevisao: false
      },
      {
        id: 4, titulo: "Pomodoro com Trilha Sonora Binaural", tempo: "25 min", dificuldade: "Fácil",
        descricao: "Utilize ruído marrom, sons da natureza ou batidas binaurais durante blocos de foco.",
        passos: ["Escolha uma playlist de foco ou ruído marrom", "Inicie o Pomodoro de 25 minutos", "Mantenha o volume agradável sem vocais", "Descanse 5 minutos em silêncio absoluto"],
        beneficios: ["Isolamento de ruídos externos", "Acelera entrada no estado de fluxo (flow)", "Relaxamento cognitivo"],
        irParaRevisao: false
      }
    ]
  },

  // ==================== LÓGICO-MATEMÁTICA ====================
  logico: {
    nome: "Lógico-Matemática",
    cor: "#ffbd59",
    descricao: "Você aprende melhor por raciocínio dedutivo, padrões estruturados, diagramas, listas e testes práticos.",
    metodos: [
      {
        id: 1, titulo: "Teste Prático & Simulados", tempo: "45 min", dificuldade: "Médio",
        descricao: "Aprenda por meio de resolução de problemas, análise de dados e exercícios de banca.",
        passos: ["Selecione blocos de 10 a 15 exercícios", "Cronometre o tempo médio por questão", "Resolva sem consultar respostas previamente", "Analise as razões exatas dos erros", "Documente os padrões de pegadinha"],
        beneficios: ["Preparação para o modelo real de prova", "Raciocínio lógico aguçado", "Identificação precisa de tópicos fracos"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Diagrama de Fluxo / Fluxograma", tempo: "35 min", dificuldade: "Médio",
        descricao: "Mapeie processos, condições lógicas ('se/então') e sequências passo a passo.",
        passos: ["Identifique o processo central do assunto", "Defina o ponto de partida e o objetivo final", "Crie blocos de decisões lógicas ('se sim / se não')", "Conecte com setas direcionais coerentes", "Teste o fluxo com um caso prático"],
        beneficios: ["Visão sistêmica impecável", "Clareza em matérias com regras e etapas", "Facilita raciocínio condicional"],
        irParaRevisao: false
      },
      {
        id: 3, titulo: "Método Cornell", tempo: "30 min", dificuldade: "Fácil",
        descricao: "Estruture suas notas em formato de problemas, hipóteses e respostas dedutivas.",
        passos: ["Coluna esquerda: teoremas, regras e fórmulas", "Coluna direita: deduções e exemplos de resolução", "Área inferior: síntese da regra geral", "Revise deduzindo a resposta a partir da premissa"],
        beneficios: ["Organização algorítmica de ideias", "Ideal para exatas, economia e direito", "Consulta rápida de fórmulas e teses"],
        irParaRevisao: false
      },
      {
        id: 4, titulo: "Pomodoro", tempo: "25 min", dificuldade: "Fácil",
        descricao: "Quantifique sua produtividade em métricas exatas de blocos cumpridos e taxas de acerto.",
        passos: ["Estipule número exato de questões para o bloco", "Trabalhe no ritmo máximo por 25 minutos", "Pause 5 minutos para oxigenação", "Registre as estatísticas no gráfico"],
        beneficios: ["Métricas quantificáveis de avanço", "Gestão precisa do tempo por questão", "Foco cirúrgico"],
        irParaRevisao: false
      },
      {
        id: 5, titulo: "Repetição Espaçada", tempo: "15 min/dia", dificuldade: "Médio",
        descricao: "Aproveite a precisão algorítmica da Curva de Ebbinghaus para calcular intervalos exatos.",
        passos: ["Cadastre cartões com cálculos e propriedades", "Classifique os resultados com notas objetivas", "O sistema recalcula a data da próxima sessão", "Mantenha a rotina matemática de revisões"],
        beneficios: ["Eficiência matemática de retenção", "Tempo investido com retorno mensurável", "Domínio de fórmulas complexas"],
        irParaRevisao: true, tipoRevisao: "revisao_espacada"
      }
    ]
  },

  // ==================== ESPACIAL / VISUAL ====================
  espacial: {
    nome: "Espacial",
    cor: "#d203a4",
    descricao: "Você pensa em imagens, cores, mapas mentais, diagramas e representações visuais estruturadas.",
    metodos: [
      {
        id: 1, titulo: "Mapa Mental", tempo: "40 min", dificuldade: "Médio",
        descricao: "Organize tópicos a partir de um núcleo central com ramificações coloridas, ícones e hierarquia.",
        passos: ["Defina o tema central no meio da tela", "Crie ramos primários com as grandes categorias", "Abra sub-ramos com detalhes e exemplos", "Utilize cores contrastantes e ícones representativos", "Revise repassando a geografia do mapa"],
        beneficios: ["Visão panorâmica imediata da matéria", "Associação espacial resistente ao esquecimento", "Excelente para matérias extensas"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Diagrama de Fluxo / Fluxograma", tempo: "35 min", dificuldade: "Médio",
        descricao: "Construa fluxogramas ilustrados com caixas, setas e formas geométricas intuitivas.",
        passos: ["Desenhe a sequência do início ao fim", "Destaque pontos de decisão com cores distintas", "Agrupe fases afins em zonas visuais", "Revise acompanhando o caminho visualmente"],
        beneficios: ["Compreensão visual instantânea", "Fixação de processos cronológicos", "Organização limpa e intuitiva"],
        irParaRevisao: false
      },
      {
        id: 3, titulo: "Flashcards com Imagens", tempo: "25 min", dificuldade: "Fácil",
        descricao: "Crie cartões visuais combinando fotos, esquemas anatômicos, gráficos e mapas.",
        passos: ["Anexe ilustrações na frente do flashcard", "Coloque a legenda ou explicação no verso", "Treine identificar a estrutura pela imagem", "Revise com foco na memória visual"],
        beneficios: ["Ativa a memória fotográfica", "Ideal para anatomia, geografia e biologia", "Revisão visual estimulante"],
        irParaRevisao: true, tipoRevisao: "flashcards"
      },
      {
        id: 4, titulo: "Estudo com Vídeos Educativos", tempo: "30 min", dificuldade: "Fácil",
        descricao: "Aproveite animações 3D, gráficos dinâmicos e ilustrações em aulas audiovisuais.",
        passos: ["Selecione vídeos com suporte gráfico e animações", "Faça capturas de telas de diagramas importantes", "Grave um resumo no campo dedicado", "Guarde os registros visuais no seu caderno"],
        beneficios: ["Estímulo visual contínuo", "Fixação de conceitos abstratos por modelos visuais", "Facilidade de compreensão"],
        irParaRevisao: false
      }
    ]
  },

  // ==================== CORPORAL-CINESTÉSICA ====================
  corporal: {
    nome: "Corporal-Cinestésica",
    cor: "#00bf63",
    descricao: "Você aprende fazendo, escrevendo fisicamente, gesticulando, resolvendo problemas práticos e se movimentando.",
    metodos: [
      {
        id: 1, titulo: "Pomodoro com Descanso Ativo", tempo: "30 min", dificuldade: "Fácil",
        descricao: "Sessões de 25 minutos intercaladas com pausas ativas de alongamento e caminhada leve.",
        passos: ["Foco intenso na tarefa por 25 minutos", "Ao tocar o alarme, levante-se imediatamente", "Caminhe, faça alongamentos ou beba água por 5 minutos", "Retorne revigorado para o próximo ciclo"],
        beneficios: ["Evita tensão muscular e fadiga", "Mantém a circulação sanguínea ativa", "Aumenta a oxigenação cerebral"],
        irParaRevisao: false
      },
      {
        id: 2, titulo: "Teste Prático & Exercícios", tempo: "45 min", dificuldade: "Médio",
        descricao: "Coloque a mão na massa imediatamente resolvendo questões, experimentos e simulados práticos.",
        passos: ["Vá direto para a resolução de casos práticos", "Escreva as resoluções e contas em rascunho", "Consulte a teoria apenas quando travar", "Repita os exercícios errados na prática"],
        beneficios: ["Aprendizado pela ação e experiência", "Fixação mecânica e conceitual", "Alta retenção pela vivência real"],
        irParaRevisao: false
      },
      {
        id: 3, titulo: "Técnica Feynman com Gesticulação", tempo: "30 min", dificuldade: "Médio",
        descricao: "Explique a matéria caminhando pelo quarto e gesticulando como um professor em sala.",
        passos: ["Fique em pé com espaço para se movimentar", "Gesticule e use o espaço físico para explicar", "Grave o áudio da sua aula ativa", "Revise ouvindo o que você produziu"],
        beneficios: ["Libera energia corporal produtiva", "Conexão motora com o aprendizado", "Dinamismo que afasta o sono"],
        irParaRevisao: false
      },
      {
        id: 4, titulo: "Gravação de Podcast em Movimento", tempo: "30 min", dificuldade: "Médio",
        descricao: "Grave suas conclusões e resumos falados enquanto se exercita ou passeia.",
        passos: ["Defina mentalmente os tópicos a abordar", "Grave notas de voz durante uma caminhada", "Sintetize no app ao retornar à mesa", "Revise seus áudios sempre em movimento"],
        beneficios: ["Combina atividade física com aprendizado", "Estimula a criatividade e fluidez mental", "Estudo prazeroso e revigorante"],
        irParaRevisao: false
      }
    ]
  }
};

const obterIconeMetodo = (titulo = '') => {
  const t = titulo.toLowerCase();
  if (t.includes('pomodoro')) return 'bi bi-stopwatch-fill';
  if (t.includes('feynman')) return 'bi bi-mic-fill';
  if (t.includes('cornell')) return 'bi bi-layout-split';
  if (t.includes('podcast')) return 'bi bi-broadcast';
  if (t.includes('mapa mental')) return 'bi bi-diagram-3-fill';
  if (t.includes('fluxograma') || t.includes('diagrama')) return 'bi bi-diagram-2-fill';
  if (t.includes('mnem')) return 'bi bi-sort-numeric-down';
  if (t.includes('flashcard') || t.includes('cart')) return 'bi bi-card-text';
  if (t.includes('repeti') || t.includes('espa')) return 'bi bi-arrow-repeat';
  if (t.includes('grupo')) return 'bi bi-people-fill';
  if (t.includes('savoring') || t.includes('leitura')) return 'bi bi-book-half';
  if (t.includes('teste') || t.includes('simulado')) return 'bi bi-ui-checks';
  if (t.includes('video') || t.includes('vídeo')) return 'bi bi-youtube';
  return 'bi bi-lightbulb-fill';
};

const isCorClara = (hex = '') => {
  if (!hex || typeof hex !== 'string') return false;
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 155;
};

export default function Metodos() {
  const [tipoInteligencia, setTipoInteligencia] = useState('logico');
  const [metodos, setMetodos] = useState(metodosPorInteligencia.logico);
  const [metodoSelecionado, setMetodoSelecionado] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroDificuldade, setFiltroDificuldade] = useState('todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tipoSalvo = (localStorage.getItem('inteligenciaUsuario') || sessionStorage.getItem('inteligenciaUsuario') || '').toLowerCase().trim();
    const corSalva = localStorage.getItem('corPrimaria') || sessionStorage.getItem('corPrimaria');

    if (tipoSalvo && metodosPorInteligencia[tipoSalvo]) {
      const dados = { ...metodosPorInteligencia[tipoSalvo] };
      if (corSalva && corSalva.startsWith('#')) {
        dados.cor = corSalva;
      }
      setTipoInteligencia(tipoSalvo);
      setMetodos(dados);
      document.documentElement.style.setProperty('--cor-primaria', dados.cor);
      setLoading(false);
    } else {
      apiFetch('perfil')
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          const intel = (data?.inteligencia || data?.tipo_dom || 'logico').toLowerCase().trim();
          const tipoFinal = metodosPorInteligencia[intel] ? intel : 'logico';
          const dados = { ...metodosPorInteligencia[tipoFinal] };
          const corApi = data?.cor_dominante || data?.cor || corSalva;
          if (corApi && corApi.startsWith('#')) {
            dados.cor = corApi;
          }
          setTipoInteligencia(tipoFinal);
          setMetodos(dados);
          localStorage.setItem('inteligenciaUsuario', tipoFinal);
          if (dados.cor) {
            localStorage.setItem('corPrimaria', dados.cor);
            document.documentElement.style.setProperty('--cor-primaria', dados.cor);
          }
        })
        .catch(() => {
          setTipoInteligencia('logico');
          setMetodos(metodosPorInteligencia.logico);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  // ===== FUNÇÕES DE NAVEGAÇÃO DOS MÉTODOS =====
  const irParaRevisao = (tipoRevisao, metodoTitulo) => {
    localStorage.setItem('revisaoTipoAtivo', tipoRevisao);
    localStorage.setItem('metodoSelecionado', metodoTitulo);
    setMetodoSelecionado(null);
    if (typeof window.mostrarTela === 'function') {
      window.mostrarTela('revisao');
    }
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'revisao' }));
  };

  const irParaPomodoro = () => {
    setMetodoSelecionado(null);
    if (typeof window.mostrarTela === 'function') {
      window.mostrarTela('relogio');
    }
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'relogio' }));
    setTimeout(() => {
      const cardPomodoro = document.getElementById('cardPomodoro');
      if (cardPomodoro) {
        cardPomodoro.scrollIntoView({ behavior: 'smooth', block: 'center' });
        cardPomodoro.classList.add('destaque-pomodoro');
        setTimeout(() => {
          cardPomodoro.classList.remove('destaque-pomodoro');
        }, 3000);
      }
    }, 500);
  };

  const abrirGravadorPodcast = () => {
    setMetodoSelecionado(null);
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'podcast' }));
  };

  const abrirGravadorFeynman = () => {
    setMetodoSelecionado(null);
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'feynman' }));
  };

  const abrirCornell = () => {
    setMetodoSelecionado(null);
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'cornell' }));
  };

  const abrirMnemonica = () => {
    setMetodoSelecionado(null);
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'mnemonica' }));
  };

  const abrirMapaMental = () => {
    setMetodoSelecionado(null);
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'mapamental' }));
  };

  const abrirFluxograma = () => {
    setMetodoSelecionado(null);
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'fluxograma' }));
  };

  const abrirGruposEstudo = () => {
    setMetodoSelecionado(null);
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'grupos' }));
  };

  const abrirLeituraSavoring = () => {
    setMetodoSelecionado(null);
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'leitura' }));
  };

  const abrirTestePratico = () => {
    setMetodoSelecionado(null);
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'testePratico' }));
  };

  const abrirVideoEducativo = () => {
    setMetodoSelecionado(null);
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'videoEducativo' }));
  };

  // Botão de ação inteligente para cada método
  const renderizarBotaoModal = () => {
    if (!metodoSelecionado) return null;
    const titulo = metodoSelecionado.titulo;
    const cor = metodos.cor || '#ffbd59';
    const corTexto = isCorClara(cor) ? '#0f172a' : '#ffffff';

    if (titulo.includes("Mnemônica") || titulo.includes("Mnemonica") || titulo.includes("Listas Ordenadas")) {
      return (
        <button className="btn-metodo-modal-action" style={{ background: cor, color: corTexto, boxShadow: `0 4px 16px ${cor}45` }} onClick={abrirMnemonica}>
          <i className="bi bi-sort-numeric-down"></i> Usar Sequências Mnemônicas
        </button>
      );
    }
    if (titulo.includes("Mapa Mental") || titulo.includes("mapa mental")) {
      return (
        <button className="btn-metodo-modal-action" style={{ background: cor, color: corTexto, boxShadow: `0 4px 16px ${cor}45` }} onClick={abrirMapaMental}>
          <i className="bi bi-diagram-3-fill"></i> Criar / Abrir Mapa Mental
        </button>
      );
    }
    if (titulo.includes("Diagrama de Fluxo") || titulo.includes("diagrama de fluxo") || titulo.includes("Fluxograma") || titulo.includes("fluxograma")) {
      return (
        <button className="btn-metodo-modal-action" style={{ background: cor, color: corTexto, boxShadow: `0 4px 16px ${cor}45` }} onClick={abrirFluxograma}>
          <i className="bi bi-diagram-2-fill"></i> Criar / Abrir Fluxograma
        </button>
      );
    }
    if (titulo === "Metodo Cornell" || titulo === "Método Cornell" || titulo.includes("Cornell")) {
      return (
        <button className="btn-metodo-modal-action" style={{ background: cor, color: corTexto, boxShadow: `0 4px 16px ${cor}45` }} onClick={abrirCornell}>
          <i className="bi bi-layout-split"></i> Abrir Notas Cornell
        </button>
      );
    }
    if (titulo.toLowerCase().includes("pomodoro")) {
      return (
        <button className="btn-metodo-modal-action" style={{ background: cor, color: corTexto, boxShadow: `0 4px 16px ${cor}45` }} onClick={irParaPomodoro}>
          <i className="bi bi-stopwatch-fill"></i> Iniciar Cronômetro Pomodoro
        </button>
      );
    }
    if (titulo.toLowerCase().includes("podcast")) {
      return (
        <button className="btn-metodo-modal-action" style={{ background: cor, color: corTexto, boxShadow: `0 4px 16px ${cor}45` }} onClick={abrirGravadorPodcast}>
          <i className="bi bi-mic-fill"></i> Gravar Episódio de Podcast
        </button>
      );
    }
    if (titulo.includes("Feynman") || titulo.includes("feynman")) {
      return (
        <button className="btn-metodo-modal-action" style={{ background: cor, color: corTexto, boxShadow: `0 4px 16px ${cor}45` }} onClick={abrirGravadorFeynman}>
          <i className="bi bi-megaphone-fill"></i> Praticar Técnica Feynman
        </button>
      );
    }
    if (titulo.includes("Grupo") || titulo.includes("grupo")) {
      return (
        <button className="btn-metodo-modal-action" style={{ background: cor, color: corTexto, boxShadow: `0 4px 16px ${cor}45` }} onClick={abrirGruposEstudo}>
          <i className="bi bi-people-fill"></i> Acessar Grupos de Estudo
        </button>
      );
    }
    if (titulo.includes("Savoring") || titulo.includes("savoring") || (titulo.includes("Leitura") && titulo.includes("Savoring"))) {
      return (
        <button className="btn-metodo-modal-action" style={{ background: cor, color: corTexto, boxShadow: `0 4px 16px ${cor}45` }} onClick={abrirLeituraSavoring}>
          <i className="bi bi-book-half"></i> Praticar Leitura Savoring
        </button>
      );
    }
    if (titulo.includes("Teste Pratico") || titulo.includes("Teste Prático") || titulo.includes("teste pratico")) {
      return (
        <button className="btn-metodo-modal-action" style={{ background: cor, color: corTexto, boxShadow: `0 4px 16px ${cor}45` }} onClick={abrirTestePratico}>
          <i className="bi bi-ui-checks"></i> Realizar Teste Prático
        </button>
      );
    }
    if (titulo.includes("Video") || titulo.includes("Vídeo") || titulo.includes("Videos Educativos") || titulo.includes("Vídeos Educativos")) {
      return (
        <button className="btn-metodo-modal-action" style={{ background: cor, color: corTexto, boxShadow: `0 4px 16px ${cor}45` }} onClick={abrirVideoEducativo}>
          <i className="bi bi-youtube"></i> Estudar com Vídeos Educativos
        </button>
      );
    }
    if (titulo.toLowerCase().includes("flashcard")) {
      return (
        <button className="btn-metodo-modal-action" style={{ background: cor, color: corTexto, boxShadow: `0 4px 16px ${cor}45` }} onClick={() => irParaRevisao("flashcards", titulo)}>
          <i className="bi bi-card-text"></i> Abrir Meus Flashcards
        </button>
      );
    }
    if (metodoSelecionado.irParaRevisao) {
      return (
        <button className="btn-metodo-modal-action" style={{ background: cor, color: corTexto, boxShadow: `0 4px 16px ${cor}45` }} onClick={() => irParaRevisao(metodoSelecionado.tipoRevisao || "revisao_normal", titulo)}>
          <i className="bi bi-arrow-repeat"></i> Praticar na Revisão
        </button>
      );
    }
    return (
      <button className="btn-metodo-modal-action" style={{ background: cor, color: corTexto, boxShadow: `0 4px 16px ${cor}45` }} onClick={() => setMetodoSelecionado(null)}>
        <i className="bi bi-check2"></i> Entendi o Método
      </button>
    );
  };

  const listaFiltrada = (metodos?.metodos || []).filter(m => {
    const termo = busca.toLowerCase();
    const matchBusca =
      (m.titulo || '').toLowerCase().includes(termo) ||
      (m.descricao || '').toLowerCase().includes(termo) ||
      (m.beneficios || []).some(b => b.toLowerCase().includes(termo));

    if (filtroDificuldade === 'facil') return matchBusca && m.dificuldade.toLowerCase() === 'fácil';
    if (filtroDificuldade === 'medio') return matchBusca && m.dificuldade.toLowerCase() === 'médio';
    return matchBusca;
  });

  if (loading) {
    return (
      <div className="metodos-loading">
        <div className="spinner"></div>
        <p>Carregando seus métodos de estudo personalizados...</p>
      </div>
    );
  }

  return (
    <section id="metodosSection">
      <div className="metodos-container-main">
        {/* Cabeçalho com Destaque Forte da Cor da Inteligência */}
        <div className="metodos-header-bar">
          <div className="metodos-header-titles">
            <h1>
              <i className="bi bi-lightbulb-fill" style={{ color: isCorClara(metodos.cor) ? '#d97706' : metodos.cor }}></i> Métodos de Estudo
            </h1>
            <p className="metodos-subtitle">
              Metodologias práticas e científicas recomendadas para o seu perfil cognitivo
            </p>
          </div>

          <div className="metodos-header-actions">
            {/* Badge de Destaque Fixo da Inteligência (sem função de alterar) */}
            <div
              className="metodo-perfil-badge-destaque"
              style={{
                background: metodos.cor,
                color: isCorClara(metodos.cor) ? '#0f172a' : '#ffffff',
                boxShadow: `0 4px 16px ${metodos.cor}45`
              }}
            >
              <img
                src={iconesInteligencia[tipoInteligencia] || "Icones/logico.png"}
                alt={metodos.nome}
                className="metodo-badge-icone-img"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="metodo-badge-text-group">
                <small style={{ color: isCorClara(metodos.cor) ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)' }}>Seu Perfil Cognitivo</small>
                <strong style={{ color: isCorClara(metodos.cor) ? '#0f172a' : '#ffffff' }}>Inteligência {metodos.nome}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Cards de Métricas com Destaque da Cor */}
        <div className="metodos-metricas-grid">
          <div
            className="met-metric-card destaque-inteligencia"
            style={{
              background: isCorClara(metodos.cor)
                ? `linear-gradient(135deg, ${metodos.cor} 0%, #f59e0b 100%)`
                : `linear-gradient(135deg, ${metodos.cor} 0%, ${metodos.cor}dd 100%)`,
              color: isCorClara(metodos.cor) ? '#0f172a' : '#ffffff',
              border: `1.5px solid ${metodos.cor}`,
              boxShadow: `0 6px 20px ${metodos.cor}35`
            }}
          >
            <div
              className="met-metric-icon"
              style={{
                background: isCorClara(metodos.cor) ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.22)',
                color: isCorClara(metodos.cor) ? '#0f172a' : '#ffffff'
              }}
            >
              <i className="bi bi-person-fill-check"></i>
            </div>
            <div className="met-metric-info">
              <span className="met-metric-num" style={{ color: isCorClara(metodos.cor) ? '#0f172a' : '#ffffff' }}>{metodos.nome}</span>
              <span className="met-metric-label" style={{ color: isCorClara(metodos.cor) ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.85)' }}>Seu Perfil Ativo</span>
            </div>
          </div>

          <div className="met-metric-card" style={{ borderTop: `3px solid ${metodos.cor}` }}>
            <div className="met-metric-icon metodos-qtd">
              <i className="bi bi-journal-check"></i>
            </div>
            <div className="met-metric-info">
              <span className="met-metric-num">{metodos.metodos.length} Técnicas</span>
              <span className="met-metric-label">Métodos Recomendados</span>
            </div>
          </div>

          <div className="met-metric-card" style={{ borderTop: `3px solid ${metodos.cor}` }}>
            <div className="met-metric-icon nivel">
              <i className="bi bi-bar-chart-fill"></i>
            </div>
            <div className="met-metric-info">
              <span className="met-metric-num">Fácil a Médio</span>
              <span className="met-metric-label">Dificuldade</span>
            </div>
          </div>

          <div className="met-metric-card" style={{ borderTop: `3px solid ${metodos.cor}` }}>
            <div className="met-metric-icon tempo">
              <i className="bi bi-stopwatch-fill"></i>
            </div>
            <div className="met-metric-info">
              <span className="met-metric-num">20 - 50 min</span>
              <span className="met-metric-label">Bloco Médio</span>
            </div>
          </div>
        </div>

        {/* Banner do Perfil com Forte Destaque Visual */}
        <div
          className="metodo-banner-perfil"
          style={{
            borderLeft: `6px solid ${metodos.cor}`,
            borderTop: `1px solid ${metodos.cor}30`,
            borderRight: `1px solid ${metodos.cor}20`,
            borderBottom: `1px solid ${metodos.cor}20`,
            backgroundImage: `linear-gradient(135deg, ${metodos.cor}15 0%, transparent 75%)`
          }}
        >
          <div
            className="metodo-banner-icone"
            style={{
              background: metodos.cor,
              color: isCorClara(metodos.cor) ? '#0f172a' : '#ffffff',
              boxShadow: `0 4px 14px ${metodos.cor}50`
            }}
          >
            <img
              src={iconesInteligencia[tipoInteligencia] || "Icones/logico.png"}
              alt={metodos.nome}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <i className="bi bi-stars"></i>
          </div>
          <div className="metodo-banner-conteudo">
            <h3 style={{ color: isCorClara(metodos.cor) ? '#b45309' : metodos.cor }}>Inteligência Predominante: {metodos.nome}</h3>
            <p>{metodos.descricao}</p>
          </div>
        </div>

        {/* Barra de Filtros e Busca Padronizada */}
        <div className="metodos-toolbar-bar">
          <div className="metodos-filtros-nav">
            <button
              className={`btn-met-filtro ${filtroDificuldade === 'todos' ? 'ativo' : ''}`}
              style={filtroDificuldade === 'todos' ? {
                background: metodos.cor,
                color: isCorClara(metodos.cor) ? '#0f172a' : '#ffffff',
                boxShadow: `0 3px 10px ${metodos.cor}40`
              } : {}}
              onClick={() => setFiltroDificuldade('todos')}
            >
              Todos ({metodos.metodos.length})
            </button>
            <button
              className={`btn-met-filtro ${filtroDificuldade === 'facil' ? 'ativo' : ''}`}
              style={filtroDificuldade === 'facil' ? {
                background: metodos.cor,
                color: isCorClara(metodos.cor) ? '#0f172a' : '#ffffff',
                boxShadow: `0 3px 10px ${metodos.cor}40`
              } : {}}
              onClick={() => setFiltroDificuldade('facil')}
            >
              Fáceis
            </button>
            <button
              className={`btn-met-filtro ${filtroDificuldade === 'medio' ? 'ativo' : ''}`}
              style={filtroDificuldade === 'medio' ? {
                background: metodos.cor,
                color: isCorClara(metodos.cor) ? '#0f172a' : '#ffffff',
                boxShadow: `0 3px 10px ${metodos.cor}40`
              } : {}}
              onClick={() => setFiltroDificuldade('medio')}
            >
              Médios
            </button>
          </div>

          <div className="metodos-search-box">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Buscar por método ou benefício..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            {busca && (
              <button className="btn-limpar-busca-met" onClick={() => setBusca('')}>
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>
        </div>

        {/* Grade de Cards de Métodos com Destaque Temático */}
        {listaFiltrada.length === 0 ? (
          <div className="metodos-vazio-card">
            <i className="bi bi-search"></i>
            <h4>Nenhum método encontrado</h4>
            <p>Tente buscar por outro termo ou selecione outro nível de dificuldade.</p>
          </div>
        ) : (
          <div className="metodos-grid">
            {listaFiltrada.map((metodo) => {
              const iconeClasse = obterIconeMetodo(metodo.titulo);
              return (
                <div
                  key={metodo.id}
                  className="metodo-card-item"
                  style={{ borderTop: `4px solid ${metodos.cor}` }}
                  onClick={() => setMetodoSelecionado(metodo)}
                >
                  <div className="metodo-card-top">
                    <div
                      className="metodo-card-icon-badge"
                      style={{
                        background: `${metodos.cor}25`,
                        color: isCorClara(metodos.cor) ? '#b45309' : metodos.cor,
                        border: `1.5px solid ${metodos.cor}45`
                      }}
                    >
                      <i className={iconeClasse}></i>
                    </div>
                    <div className="metodo-tags">
                      <span className="tag-tempo">
                        <i className="bi bi-clock"></i> {metodo.tempo}
                      </span>
                      <span className={`tag-dificuldade ${metodo.dificuldade.toLowerCase()}`}>
                        {metodo.dificuldade}
                      </span>
                    </div>
                  </div>

                  <div className="metodo-card-content">
                    <h3 className="metodo-card-title">{metodo.titulo}</h3>
                    <p className="metodo-card-descricao">{metodo.descricao}</p>
                  </div>

                  <div className="metodo-card-footer">
                    <button
                      className="btn-acessar-metodo"
                      style={{
                        background: `${metodos.cor}18`,
                        color: isCorClara(metodos.cor) ? '#b45309' : metodos.cor,
                        border: `1px solid ${metodos.cor}55`
                      }}
                    >
                      <span>Ver método completo</span>
                      <i className="bi bi-arrow-right-circle-fill"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Moderno de Detalhes do Método com Destaque de Cor */}
      {metodoSelecionado && (
        <div className="metodo-modal-backdrop" onClick={() => setMetodoSelecionado(null)}>
          <div className="metodo-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="metodo-modal-header" style={{ borderTop: `5px solid ${metodos.cor}` }}>
              <div className="metodo-modal-header-titles">
                <div
                  className="metodo-modal-header-icon"
                  style={{
                    background: metodos.cor,
                    color: isCorClara(metodos.cor) ? '#0f172a' : '#ffffff',
                    boxShadow: `0 4px 12px ${metodos.cor}40`
                  }}
                >
                  <i className={obterIconeMetodo(metodoSelecionado.titulo)}></i>
                </div>
                <div>
                  <h2>{metodoSelecionado.titulo}</h2>
                  <div className="metodo-tags mt-1">
                    <span className="tag-tempo">
                      <i className="bi bi-clock"></i> {metodoSelecionado.tempo}
                    </span>
                    <span className={`tag-dificuldade ${metodoSelecionado.dificuldade.toLowerCase()}`}>
                      {metodoSelecionado.dificuldade}
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="btn-metodo-modal-close"
                onClick={() => setMetodoSelecionado(null)}
                title="Fechar"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="metodo-modal-body">
              {/* Descrição Sintética */}
              <p
                className="metodo-modal-resumo"
                style={{ borderLeft: `4px solid ${metodos.cor}`, background: `${metodos.cor}08` }}
              >
                {metodoSelecionado.descricao}
              </p>

              {/* Passo a Passo com Números na Cor da Inteligência */}
              <div className="metodo-secao-modal">
                <h4 className="metodo-secao-titulo">
                  <i className="bi bi-list-ol" style={{ color: isCorClara(metodos.cor) ? '#d97706' : metodos.cor }}></i> Passo a Passo da Aplicação:
                </h4>
                <ol className="metodo-passos-list">
                  {metodoSelecionado.passos.map((passo, index) => (
                    <li key={index}>
                      <span
                        className="passo-numero"
                        style={{
                          background: metodos.cor,
                          color: isCorClara(metodos.cor) ? '#0f172a' : '#ffffff',
                          boxShadow: `0 2px 6px ${metodos.cor}40`
                        }}
                      >
                        {index + 1}
                      </span>
                      <span className="passo-texto">{passo}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Benefícios */}
              {metodoSelecionado.beneficios && (
                <div className="metodo-beneficios-box">
                  <strong className="beneficios-header">
                    <i className="bi bi-check-circle-fill"></i> Principais Benefícios:
                  </strong>
                  <ul>
                    {metodoSelecionado.beneficios.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Dica de Especialista */}
              <div className="metodo-dica-box">
                <div className="dica-icon">
                  <i className="bi bi-lightbulb-fill"></i>
                </div>
                <div>
                  <strong>Dica de Especialista:</strong>
                  <p>Adapte o método ao seu ritmo de estudo e combine com testes práticos semanais para máxima fixação.</p>
                </div>
              </div>
            </div>

            <div className="metodo-modal-footer">
              <button
                type="button"
                className="btn-metodo-modal-cancel"
                onClick={() => setMetodoSelecionado(null)}
              >
                Fechar
              </button>
              {renderizarBotaoModal()}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

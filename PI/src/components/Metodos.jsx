import React, { useState, useEffect } from 'react';
import './Metodos.css';

// Banco de dados dos métodos por inteligência
const metodosPorInteligencia = {
  // ==================== INTELIGÊNCIA LINGUÍSTICA ====================
  linguistica: {
    nome: "Linguística",
    icone: "📝",
    cor: "#9f042c",
    descricao: "Você aprende melhor com palavras, leitura, escrita e comunicação! Os métodos abaixo foram selecionados especialmente para seu perfil.",
    metodos: [
      {
        id: 1,
        titulo: "📖 Técnica Feynman",
        tempo: "30 min",
        dificuldade: "Médio",
        descricao: "Aprenda explicando com suas próprias palavras como se estivesse ensinando alguém.",
        explicacao: "🎯 Por que este método é bom para você?\n\nComo você tem inteligência Linguística, sua habilidade com palavras e explicações é seu superpoder! A Técnica Feynman aproveita sua capacidade de simplificar ideias complexas usando sua própria linguagem.\n\n✅ Você aprende melhor porque:\n• Usa suas habilidades de comunicação\n• Transforma conceitos abstratos em palavras claras\n• Identifica lacunas no seu entendimento\n• Fixa o conteúdo através da verbalização",
        beneficios: [
          "Desenvolve sua capacidade de síntese",
          "Melhora sua comunicação",
          "Identifica pontos fracos no aprendizado"
        ],
        passos: [
          "Escolha um conceito que quer aprender",
          "Explique como se estivesse ensinando uma criança (use palavras simples)",
          "Identifique onde sua explicação falhou",
          "Volte ao material original e estude novamente",
          "Refine sua explicação até ficar clara e simples"
        ],
        irParaRevisao: true,
        tipoRevisao: "flashcards"
      },
      {
        id: 2,
        titulo: "📚 Leitura Savoring (Leitura Saboreada)",
        tempo: "40 min",
        dificuldade: "Fácil",
        descricao: "Leia devagar, apreciando cada palavra e fazendo anotações reflexivas.",
        explicacao: "🎯 Por que este método é bom para você?\n\nSua inteligência Linguística torna a leitura uma experiência rica e prazerosa! O método Savoring potencializa sua conexão com o texto.\n\n✅ Você aprende melhor porque:\n• Ativa sua sensibilidade para palavras e significados\n• Cria conexões emocionais com o conteúdo\n• Desenvolve análise crítica do texto\n• Melhora retenção através da imersão",
        beneficios: [
          "Aumenta compreensão profunda",
          "Melhora vocabulário",
          "Desenvolve pensamento crítico"
        ],
        passos: [
          "Escolha um texto relevante",
          "Leia devagar, pausando a cada parágrafo",
          "Destaque palavras e frases importantes",
          "Anote suas reflexões e conexões",
          "Releia pontos que geraram dúvidas",
          "Faça um resumo com suas palavras"
        ],
        irParaRevisao: false
      },
      {
        id: 3,
        titulo: "👥 Grupos de Estudo",
        tempo: "50 min",
        dificuldade: "Médio",
        descricao: "Estude em grupo discutindo e explicando os temas entre vocês.",
        explicacao: "🎯 Por que este método é bom para você?\n\nSua habilidade Linguística brilha na interação com outras pessoas! Grupos de estudo permitem que você use sua capacidade de argumentação e explicação.\n\n✅ Você aprende melhor porque:\n• Exercita sua comunicação verbal\n• Aprende com diferentes perspectivas\n• Desenvolve argumentação e debate\n• Fixa conteúdo ao ensinar colegas",
        beneficios: [
          "Desenvolve habilidades sociais",
          "Exposição a diferentes pontos de vista",
          "Aprendizado colaborativo"
        ],
        passos: [
          "Forme um grupo de 3-5 pessoas",
          "Divida os temas entre os membros",
          "Cada um prepara sua parte para explicar",
          "Revezem as apresentações",
          "Tirem dúvidas coletivamente",
          "Façam exercícios juntos"
        ],
        irParaRevisao: false
      },
      {
        id: 4,
        titulo: "🎴 Flashcards Inteligentes",
        tempo: "25 min",
        dificuldade: "Fácil",
        descricao: "Crie flashcards com perguntas e respostas para revisar conceitos importantes.",
        explicacao: "🎯 Por que este método é bom para você?\n\nFlashcards são perfeitos para sua inteligência Linguística porque trabalham diretamente com associações de palavras e significados!\n\n✅ Você aprende melhor porque:\n• Cria conexões verbais entre conceitos\n• Desenvolve associações semânticas\n• Estimula memorização ativa\n• Permite revisão personalizada",
        beneficios: [
          "Memorização ativa",
          "Revisão eficiente",
          "Portabilidade (estude em qualquer lugar)"
        ],
        passos: [
          "Frente: escreva uma pergunta ou conceito",
          "Verso: escreva a resposta ou explicação",
          "Teste-se diariamente",
          "Separe o que acertou do que errou",
          "Revise mais os que errou"
        ],
        irParaRevisao: true,
        tipoRevisao: "flashcards"
      },
      {
        id: 5,
        titulo: "🎵 Mnemônica com Palavras, Poemas ou Músicas",
        tempo: "20 min",
        dificuldade: "Fácil",
        descricao: "Crie associações criativas usando rimas, siglas, poemas ou músicas.",
        explicacao: "🎯 Por que este método é bom para você?\n\nSua sensibilidade para palavras e ritmo torna os mnemônicos uma ferramenta poderosa! Você cria associações que outros achariam difíceis.\n\n✅ Você aprende melhor porque:\n• Usa sua criatividade linguística\n• Cria conexões sonoras e rítmicas\n• Transforma informação chata em algo divertido\n• Facilita memorização de listas e sequências",
        beneficios: [
          "Memorização divertida",
          "Criação de associações únicas",
          "Retenção de longo prazo"
        ],
        passos: [
          "Liste as informações que precisa memorizar",
          "Crie uma sigla com a primeira letra de cada item",
          "Ou crie uma frase engraçada conectando os conceitos",
          "Ou transforme em uma música/paródia",
          "Repita várias vezes até fixar",
          "Exemplo: Para decorar planetas: 'Meu Velho Tio Moço Jantou Sopa Úmida Na Ultima Sexta'"
        ],
        irParaRevisao: true,
        tipoRevisao: "revisao_normal"
      },
      {
        id: 6,
        titulo: "🔄 Repetição Espaçada (Revisão Inteligente)",
        tempo: "15 min/dia",
        dificuldade: "Médio",
        descricao: "Sistema de revisão que aumenta os intervalos conforme você acerta as respostas.",
        explicacao: "🎯 Por que este método é bom para você?\n\nSua inteligência Linguística se beneficia enormemente da repetição espaçada porque você fixa padrões linguísticos e vocabulário de forma natural!\n\n✅ Você aprende melhor porque:\n• Revisa no momento ideal (antes de esquecer)\n• Foca mais no que tem dificuldade\n• Cria memória de longo prazo\n• Otimiza seu tempo de estudo",
        beneficios: [
          "Revisão eficiente",
          "Memorização duradoura",
          "Menos tempo estudando o que já sabe"
        ],
        passos: [
          "Dia 1: Estude o conteúdo normalmente",
          "Dia 2: Revise rapidamente",
          "Dia 4: Revisite os pontos difíceis",
          "Dia 7: Teste seus conhecimentos",
          "Dia 15: Revisão final",
          "Configure no sistema de revisão do app"
        ],
        irParaRevisao: true,
        tipoRevisao: "revisao_espacada"
      }
    ]
  },

    // ==================== INTELIGÊNCIA INTRAPESSOAL ====================
  intrapessoal: {
    nome: "Intrapessoal",
    icone: "🧘",
    cor: "#5170ff",
    descricao: "Você aprende melhor sozinho, com reflexão, autoanálise e estudos individuais! Os métodos abaixo foram selecionados especialmente para seu perfil autodidata.",
    metodos: [
      {
        id: 1,
        titulo: "📖 Técnica Feynman (Versão Solo)",
        tempo: "30 min",
        dificuldade: "Médio",
        descricao: "Aprenda explicando com suas próprias palavras como se estivesse ensinando a si mesmo.",
        explicacao: "🎯 Por que este método é bom para você?\n\nComo você tem inteligência Intrapessoal, sua capacidade de refletir e autoavaliar é seu superpoder! A Técnica Feynman versão solo aproveita sua habilidade de diálogo interno e autoexplicação.\n\n✅ Você aprende melhor porque:\n• Usa seu pensamento reflexivo natural\n• Identifica sozinho suas lacunas de conhecimento\n• Cria conexões pessoais com o conteúdo\n• Fixa através da verbalização interna\n• Desenvolve autoconfiança no aprendizado",
        beneficios: [
          "Desenvolve autoconhecimento",
          "Identifica pontos fracos sozinho",
          "Reforça aprendizado através da autoexplicação"
        ],
        passos: [
          "Escolha um conceito que quer aprender",
          "Explique para si mesmo em voz alta (grave se quiser)",
          "Escreva a explicação no papel com suas palavras",
          "Identifique onde sua explicação falhou",
          "Volte ao material e estude novamente",
          "Refine sua explicação até ficar clara",
          "Reflita: 'O que aprendi sobre mim neste processo?'"
        ],
        irParaRevisao: true,
        tipoRevisao: "flashcards"
      },
      {
        id: 2,
        titulo: "📓 Método Cornell (Anotações Refletivas)",
        tempo: "35 min",
        dificuldade: "Médio",
        descricao: "Sistema de anotações que organiza ideias principais, perguntas e resumos para revisão.",
        explicacao: "🎯 Por que este método é bom para você?\n\nSua inteligência Intrapessoal adora estrutura e organização interna! O Método Cornell permite que você crie um sistema de anotações personalizado que facilita sua reflexão e revisão.\n\n✅ Você aprende melhor porque:\n• Organiza informações de forma lógica\n• Cria perguntas para autoavaliação\n• Desenvolve resumos com suas próprias palavras\n• Facilita revisões futuras\n• Estimula pensamento crítico",
        beneficios: [
          "Organização visual do conhecimento",
          "Facilita autoavaliação",
          "Material de revisão eficiente"
        ],
        passos: [
          "Divida a página em 3 seções: Cabeçalho, Conteúdo Principal, Resumo",
          "Seção ESQUERDA (coluna de 7cm): escreva palavras-chave e perguntas",
          "Seção DIREITA (maior): anote as ideias principais",
          "Seção INFERIOR: faça um resumo com suas palavras",
          "Revise cobrindo a coluna direita e respondendo as perguntas",
          "Reflita: 'O que mais me marcou nesta matéria?'"
        ],
        irParaRevisao: false
      },
      {
        id: 3,
        titulo: "📚 Leitura Savoring (Reflexiva)",
        tempo: "40 min",
        dificuldade: "Fácil",
        descricao: "Leia devagar, pausando para refletir e fazer conexões pessoais com o texto.",
        explicacao: "🎯 Por que este método é bom para você?\n\nSua inteligência Intrapessoal transforma a leitura em uma experiência íntima e profunda! Você não apenas lê, mas dialoga com o texto e consigo mesmo.\n\n✅ Você aprende melhor porque:\n• Conecta o conteúdo com experiências pessoais\n• Desenvolve pensamento crítico individual\n• Cria significado pessoal para o que lê\n• Aumenta retenção através da reflexão\n• Respeita seu ritmo interno de aprendizado",
        beneficios: [
          "Conexão pessoal com o conteúdo",
          "Desenvolvimento de empatia e compreensão",
          "Aprendizado significativo e duradouro"
        ],
        passos: [
          "Escolha um local tranquilo e confortável",
          "Leia um parágrafo ou página por vez",
          "Pause e reflita: 'O que isso significa para mim?'",
          "Anote suas reflexões e conexões pessoais",
          "Marque frases que te impactaram",
          "Leia em voz alta se te ajudar a concentrar",
          "Faça um diário de leitura com seus pensamentos"
        ],
        irParaRevisao: false
      },
      {
        id: 4,
        titulo: "🔄 Repetição Espaçada (Auto-planejada)",
        tempo: "15 min/dia",
        dificuldade: "Médio",
        descricao: "Sistema personalizado de revisão que você mesmo gerencia conforme seu ritmo.",
        explicacao: "🎯 Por que este método é bom para você?\n\nSua inteligência Intrapessoal se beneficia da repetição espaçada porque você pode planejar suas revisões de acordo com seu próprio ritmo e autoconhecimento!\n\n✅ Você aprende melhor porque:\n• Controla seu próprio cronograma de revisão\n• Identifica seu momento ideal de estudo\n• Constrói disciplina e autonomia\n• Cria memória de longo prazo no seu tempo\n• Desenvolve consciência sobre seu aprendizado",
        beneficios: [
          "Autonomia no aprendizado",
          "Revisão personalizada",
          "Memorização duradoura e independente"
        ],
        passos: [
          "Dia 1: Estude o conteúdo e faça anotações",
          "Dia 2: Revise e teste seus conhecimentos",
          "Dia 4: Reveja os pontos que errou",
          "Dia 7: Faça uma autoavaliação completa",
          "Dia 15: Revisão final e reflexão",
          "Ajuste os intervalos conforme seu ritmo",
          "Mantenha um diário de progresso"
        ],
        irParaRevisao: true,
        tipoRevisao: "revisao_espacada"
      },
      {
        id: 5,
        titulo: "🎴 Flashcards (Autoavaliação)",
        tempo: "20 min",
        dificuldade: "Fácil",
        descricao: "Crie seus próprios flashcards para testar seus conhecimentos sozinho.",
        explicacao: "🎯 Por que este método é bom para você?\n\nFlashcards são perfeitos para sua inteligência Intrapessoal porque permitem que você se teste em privado, no seu ritmo, e identifique exatamente o que precisa melhorar!\n\n✅ Você aprende melhor porque:\n• Cria seu próprio material personalizado\n• Autoavalia seu progresso honestamente\n• Estuda no seu próprio ritmo\n• Identifica padrões de erro\n• Desenvolve autoconfiança",
        beneficios: [
          "Material personalizado por você",
          "Autoavaliação honesta",
          "Estudo independente e flexível"
        ],
        passos: [
          "Crie perguntas que você faria para si mesmo",
          "Escreva a pergunta de um lado, resposta do outro",
          "Teste-se sem olhar a resposta",
          "Se acertou, coloque na pilha 'revisar depois'",
          "Se errou, coloque na pilha 'revisar amanhã'",
          "Reflita: 'Por que errei? O que posso melhorar?'",
          "Adapte os cards conforme seu entendimento"
        ],
        irParaRevisao: true,
        tipoRevisao: "flashcards"
      }
    ]
  },

    // ==================== INTELIGÊNCIA INTERPESSOAL ====================
  interpessoal: {
    nome: "Interpessoal",
    icone: "👥",
    cor: "#ff5f00",
    descricao: "Você aprende melhor com outras pessoas, em grupo, discutindo, ensinando e colaborando! Os métodos abaixo foram selecionados especialmente para seu perfil social.",
    metodos: [
      {
        id: 1,
        titulo: "⏰ Técnica Pomodoro (Em Grupo)",
        tempo: "25 min/sessão",
        dificuldade: "Fácil",
        descricao: "Estude em blocos de 25 minutos com pausas, podendo ser feito em grupo para manter responsabilidade mútua.",
        explicacao: "🎯 Por que este método é bom para você?\n\nComo você tem inteligência Interpessoal, o Pomodoro em grupo é perfeito! Vocês podem estudar juntos, manter um ao outro focados e compartilhar o progresso.\n\n✅ Você aprende melhor porque:\n• Cria compromisso com o grupo\n• Compartilha metas e conquistas\n• Mantém foco com apoio mútuo\n• Transforma estudo em atividade social\n• Aumenta produtividade coletiva",
        beneficios: [
          "Responsabilidade compartilhada",
          "Apoio e motivação do grupo",
          "Produtividade coletiva"
        ],
        passos: [
          "Forme um grupo de estudo (2-5 pessoas)",
          "Definam um tema para cada Pomodoro",
          "Estudem juntos por 25 minutos em silêncio",
          "Façam uma pausa de 5 minutos para conversar",
          "Compartilhem o que aprenderam",
          "Após 4 Pomodoros, façam uma pausa longa (15-30 min)",
          "Celebrem as conquistas juntos"
        ],
        irParaRevisao: false
      },
      {
        id: 2,
        titulo: "📖 Técnica Feynman (Explicando para o Grupo)",
        tempo: "40 min",
        dificuldade: "Médio",
        descricao: "Aprenda explicando conceitos para seus colegas como se estivessem aprendendo pela primeira vez.",
        explicacao: "🎯 Por que este método é bom para você?\n\nSua inteligência Interpessoal brilha quando você ensina e explica para outras pessoas! A Técnica Feynman em grupo aproveita sua habilidade natural de comunicação.\n\n✅ Você aprende melhor porque:\n• Ensina e aprende simultaneamente\n• Recebe feedback imediato do grupo\n• Desenvolve habilidades de comunicação\n• Fixa conteúdo através da explicação\n• Aprende com as dúvidas dos colegas",
        beneficios: [
          "Desenvolve liderança e comunicação",
          "Aprendizado colaborativo",
          "Feedback em tempo real"
        ],
        passos: [
          "Cada membro escolhe um conceito para explicar",
          "Explique como se a plateia nunca tivesse visto o assunto",
          "Use analogias e exemplos simples",
          "Peça perguntas e feedback",
          "Anote os pontos que não conseguiu explicar bem",
          "Estude novamente e refine sua explicação",
          "Troque de papéis com os colegas"
        ],
        irParaRevisao: true,
        tipoRevisao: "flashcards"
      },
      {
        id: 3,
        titulo: "📝 Teste Prático (Em Dupla)",
        tempo: "30 min",
        dificuldade: "Médio",
        descricao: "Criem testes um para o outro e corrijam juntos, discutindo os erros e acertos.",
        explicacao: "🎯 Por que este método é bom para você?\n\nTestes práticos com parceiros são uma forma social e interativa de avaliar seu conhecimento! Você aprende ensinando e sendo ensinado.\n\n✅ Você aprende melhor porque:\n• Cria compromisso com o parceiro\n• Discute diferentes perspectivas\n• Identifica pontos cegos coletivamente\n• Desenvolve pensamento crítico em conjunto\n• Transforma avaliação em momento de aprendizado",
        beneficios: [
          "Avaliação colaborativa",
          "Discussão enriquecedora",
          "Identificação conjunta de pontos fracos"
        ],
        passos: [
          "Forme duplas de estudo",
          "Cada um cria 5-10 perguntas sobre o tema",
          "Troquem os testes e respondam individualmente",
          "Corrijam juntos as respostas",
          "Discutam onde cada um errou e por quê",
          "Expliquem um para o outro as respostas certas",
          "Criem um banco de questões juntos"
        ],
        irParaRevisao: true,
        tipoRevisao: "flashcards"
      },
      {
        id: 4,
        titulo: "🎵 Mnemônica com Poemas ou Músicas (em Grupo)",
        tempo: "25 min",
        dificuldade: "Fácil",
        descricao: "Criem juntos músicas, paródias ou poemas para memorizar conteúdo de forma divertida.",
        explicacao: "🎯 Por que este método é bom para você?\n\nCriar mnemônicos em grupo é uma atividade social divertida que ativa sua criatividade coletiva! Você aprende rindo e cantando com os colegas.\n\n✅ Você aprende melhor porque:\n• Atividades sociais e criativas\n• Colaboração na criação de conteúdo\n• Fixação através de música e ritmo\n• Ambiente descontraído de aprendizado\n• Memorização divertida e eficaz",
        beneficios: [
          "Aprendizado lúdico e divertido",
          "Criação coletiva",
          "Fixação por repetição musical"
        ],
        passos: [
          "Reúnam o grupo para uma sessão criativa",
          "Escolham um conteúdo para memorizar",
          "Selecionem uma melodia conhecida (paródia)",
          "Criem a letra juntos (rimas são ótimas!)",
          "Ensaie a música em grupo",
          "Grave e compartilhem com outros grupos",
          "Apresentem para a turma"
        ],
        irParaRevisao: true,
        tipoRevisao: "revisao_normal"
      },
      {
        id: 5,
        titulo: "📺 Estudo com Vídeos Educativos (Watch Together)",
        tempo: "30 min",
        dificuldade: "Fácil",
        descricao: "Assistam vídeos educativos juntos e depois discutam os pontos principais.",
        explicacao: "🎯 Por que este método é bom para você?\n\nAssistir e discutir vídeos em grupo transforma uma atividade passiva em uma experiência social rica! Você aprende vendo e compartilhando.\n\n✅ Você aprende melhor porque:\n• Discute perspectivas diferentes\n• Compartilha dúvidas imediatamente\n• Aprende com a interpretação dos colegas\n• Mantém engajamento coletivo\n• Transforma vídeo em conteúdo interativo",
        beneficios: [
          "Aprendizado colaborativo",
          "Discussão enriquecedora",
          "Diferentes pontos de vista"
        ],
        passos: [
          "Escolham um vídeo educativo relevante (YouTube, Khan Academy, etc.)",
          "Assistam juntos (presencial ou compartilhando tela)",
          "Pausem a cada 5-7 minutos para discutir",
          "Cada um anota um ponto principal",
          "Ao final, discutam o que mais impactou",
          "Criem um resumo coletivo",
          "Compartilhem com quem não pode assistir"
        ],
        irParaRevisao: false
      },
      {
        id: 6,
        titulo: "🔄 Repetição Espaçada (Revisão em Grupo)",
        tempo: "20 min/sessão",
        dificuldade: "Médio",
        descricao: "Sistema de revisão em grupo onde cada um testa o outro em intervalos programados.",
        explicacao: "🎯 Por que este método é bom para você?\n\nA repetição espaçada em grupo combina a eficiência científica da revisão com o poder social do aprendizado coletivo! Vocês se apoiam mutuamente.\n\n✅ Você aprende melhor porque:\n• Tem parceiros de revisão comprometidos\n• Testa e é testado pelos colegas\n• Compartilha dicas de memorização\n• Mantém consistência com apoio do grupo\n• Transforma revisão em atividade social",
        beneficios: [
          "Compromisso coletivo com revisão",
          "Aprendizado colaborativo de longo prazo",
          "Responsabilidade compartilhada"
        ],
        passos: [
          "Formem um grupo de compromisso de revisão",
          "Dia 1: Estudo inicial em grupo",
          "Dia 2: Revisão rápida (15 min) em duplas",
          "Dia 4: Testem uns aos outros (20 min)",
          "Dia 7: Sessão de dúvidas em grupo",
          "Dia 15: Revisão final com quiz coletivo",
          "Celebrem o progresso juntos"
        ],
        irParaRevisao: true,
        tipoRevisao: "revisao_espacada"
      },
      {
        id: 7,
        titulo: "👥 Grupos de Estudo (Estruturado)",
        tempo: "60 min",
        dificuldade: "Médio",
        descricao: "Método clássico de grupo de estudo com rodízio de papéis e responsabilidades.",
        explicacao: "🎯 Por que este método é bom para você?\n\nGrupos de estudo são onde sua inteligência Interpessoal mais brilha! Você aprende melhor quando interage, discute e colabora ativamente.\n\n✅ Você aprende melhor porque:\n• Ativa suas habilidades sociais\n• Aprende com diferentes perspectivas\n• Ensina e aprende simultaneamente\n• Desenvolve comunicação e liderança\n• Cria rede de apoio acadêmico",
        beneficios: [
          "Desenvolvimento de habilidades sociais",
          "Aprendizado diversificado",
          "Rede de apoio mútuo"
        ],
        passos: [
          "Definam um grupo de 3-5 pessoas",
          "Dividam o conteúdo em partes",
          "Cada um prepara sua parte para ensinar",
          "Revezem explicações (15 min cada)",
          "Tirem dúvidas coletivamente",
          "Façam exercícios em grupo",
          "Ao final, cada um explica o que aprendeu de novo",
          "Definam o tema da próxima sessão"
        ],
        irParaRevisao: false
      }
    ]
  },

    // ==================== INTELIGÊNCIA MUSICAL ====================
  musical: {
    nome: "Musical",
    icone: "🎵",
    cor: "#8a03d2",
    descricao: "Você aprende melhor com ritmo, melodia, sons e músicas! Sua sensibilidade auditiva é seu superpoder. Os métodos abaixo foram selecionados especialmente para seu perfil musical.",
    metodos: [
      {
        id: 1,
        titulo: "⏰ Técnica Pomodoro (Com Trilha Sonora)",
        tempo: "25 min/sessão",
        dificuldade: "Fácil",
        descricao: "Estude em blocos de 25 minutos com músicas instrumentais para manter o foco e ritmo.",
        explicacao: "🎯 Por que este método é bom para você?\n\nComo você tem inteligência Musical, sua conexão com ritmo e som é natural! O Pomodoro com música transforma o estudo em uma experiência prazerosa e ritmada.\n\n✅ Você aprende melhor porque:\n• Usa música para marcar blocos de tempo\n• Mantém ritmo constante de estudo\n• Associa sons à produtividade\n• Transforma estudo em momento agradável\n• Cria gatilhos sonoros para foco",
        beneficios: [
          "Ritmo constante de estudo",
          "Associação música-produtividade",
          "Experiência prazerosa"
        ],
        passos: [
          "Escolha uma playlist instrumental (lofi, clássica, ambiente)",
          "Configure um timer de 25 minutos",
          "Estude até o timer tocar",
          "Descanse 5 minutos (troque de música)",
          "Após 4 ciclos, descanse 15 minutos",
          "Use músicas diferentes para cada matéria",
          "Crie uma playlist 'modo estudo'"
        ],
        irParaRevisao: false
      },
      {
        id: 2,
        titulo: "🎤 Mnemônica com Músicas e Paródias",
        tempo: "30 min",
        dificuldade: "Fácil",
        descricao: "Crie músicas, paródias ou rimas para memorizar conteúdo de forma divertida e melódica.",
        explicacao: "🎯 Por que este método é bom para você?\n\nSua inteligência Musical transforma memorização em criação artística! Você fixa conteúdo cantando, ritmando e rimando de forma natural.\n\n✅ Você aprende melhor porque:\n• Usa sua habilidade musical natural\n• Cria associações melódicas duradouras\n• Transforma estudo em atividade criativa\n• Memoriza sem esforço (a música gruda!)\n• Desenvolve seu talento artístico",
        beneficios: [
          "Memorização natural através da música",
          "Desenvolvimento criativo",
          "Aprendizado leve e divertido"
        ],
        passos: [
          "Escolha uma melodia conhecida (seu hit favorito)",
          "Adapte o conteúdo para a letra da música",
          "Mantenha o ritmo e a rima",
          "Ensaiote cantando em voz alta",
          "Grave sua paródia (opcional)",
          "Cante para fixar antes das provas",
          "Crie versos para tópicos diferentes"
        ],
        irParaRevisao: true,
        tipoRevisao: "revisao_normal"
      },
      {
        id: 3,
        titulo: "🎙️ Gravação de Podcast (Seu próprio programa)",
        tempo: "40 min",
        dificuldade: "Médio",
        descricao: "Grave episódios de podcast explicando o conteúdo como se fosse um programa de rádio.",
        explicacao: "🎯 Por que este método é bom para você?\n\nSua habilidade com som e voz é perfeita para criar conteúdo em áudio! Gravar podcasts transforma seu estudo em produção artística.\n\n✅ Você aprende melhor porque:\n• Usa sua voz e dicção naturalmente\n• Cria conteúdo auditivo para revisar depois\n• Organiza pensamentos como roteiro\n• Desenvolve comunicação oral\n• Produz material personalizado de estudo",
        beneficios: [
          "Material de revisão auditiva",
          "Desenvolvimento de comunicação",
          "Criação de portfólio de conhecimento"
        ],
        passos: [
          "Escolha um tema para seu episódio",
          "Escreva um roteiro simples (tópicos principais)",
          "Configure gravador no celular ou computador",
          "Grave explicando como se fosse para ouvintes",
          "Use sua voz com entusiasmo e ritmo",
          "Ouça sua gravação e identifique pontos a melhorar",
          "Re-grave para fixar ainda mais",
          "Ouça seus podcasts revisando antes das provas"
        ],
        irParaRevisao: true,
        tipoRevisao: "revisao_espacada"
      },
      {
        id: 4,
        titulo: "📺 Estudo com Vídeos Educativos (Versão Musical)",
        tempo: "25 min",
        dificuldade: "Fácil",
        descricao: "Assista vídeos educativos e crie trilhas sonoras ou resumos em formato de música.",
        explicacao: "🎯 Por que este método é bom para você?\n\nVídeos educativos com elementos musicais ativam sua inteligência auditiva! Você aprende vendo, ouvindo e criando conexões sonoras.\n\n✅ Você aprende melhor porque:\n• Associa informação a estímulos sonoros\n• Cria memória musical do conteúdo\n• Conecta áudio e imagem reforçando aprendizado\n• Identifica padrões rítmicos nas informações\n• Transforma conteúdo passivo em ativo",
        beneficios: [
          "Aprendizado multimodal (áudio + vídeo)",
          "Associações musicais duradouras",
          "Engajamento auditivo"
        ],
        passos: [
          "Selecione um vídeo educativo sobre o tema",
          "Assista prestando atenção em sons e músicas de fundo",
          "Pause e crie um 'jingle' para cada tópico principal",
          "Anote o conteúdo que daria para musicar",
          "Após o vídeo, produza uma paródia rápida",
          "Compartilhe sua criação musical com outros"
        ],
        irParaRevisao: false
      },
      {
        id: 5,
        titulo: "🔄 Repetição Espaçada (Com Ritmo)",
        tempo: "15 min/dia",
        dificuldade: "Médio",
        descricao: "Sistema de revisão onde você usa batidas e ritmos para marcar os intervalos e o conteúdo.",
        explicacao: "🎯 Por que este método é bom para você?\n\nRepetição espaçada com ritmo combina ciência da memória com sua sensibilidade musical! Você revisa no tempo certo e no seu ritmo.\n\n✅ Você aprende melhor porque:\n• Usa batidas como marcadores de tempo\n• Associa conteúdo a padrões rítmicos\n• Mantém consistência através da música\n• Transforma revisão em exercício musical\n• Cria memória de longo prazo ritmada",
        beneficios: [
          "Revisão no ritmo do seu aprendizado",
          "Associações rítmicas duradouras",
          "Consistência através da música"
        ],
        passos: [
          "Crie uma playlist com 7 músicas (uma para cada dia)",
          "Dia 1: Estudo inicial (música tema)",
          "Dia 2: Revisão rápida (remix da música tema)",
          "Dia 4: Teste cantando o conteúdo",
          "Dia 7: Crie um beatbox do conteúdo",
          "Dia 15: Revisão final (performance completa)",
          "Crie uma 'coletânea musical' do seu progresso"
        ],
        irParaRevisao: true,
        tipoRevisao: "revisao_espacada"
      }
    ]
  },




};

const Metodos = () => {
  const [tipoInteligencia, setTipoInteligencia] = useState(null);
  const [metodos, setMetodos] = useState(null);
  const [metodoSelecionado, setMetodoSelecionado] = useState(null);
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carregar a inteligência do localStorage
  useEffect(() => {
    const tipoSalvo = localStorage.getItem('inteligenciaUsuario');
    console.log("Inteligência carregada:", tipoSalvo);
    
    if (tipoSalvo && metodosPorInteligencia[tipoSalvo]) {
      setTipoInteligencia(tipoSalvo);
      setMetodos(metodosPorInteligencia[tipoSalvo]);
      // Aplicar cor específica da inteligência
      const cor = metodosPorInteligencia[tipoSalvo].cor;
      document.documentElement.style.setProperty('--cor-primaria', cor);
    } else {
      // Fallback
      setTipoInteligencia('logico');
      setMetodos(metodosPorInteligencia.logico);
    }
    
    setLoading(false);
  }, []);

  // Função para ir para a página de revisão com o tipo específico
  const irParaRevisao = (tipoRevisao, metodoTitulo) => {
    // Salvar no localStorage qual tipo de revisão ativar
    localStorage.setItem('revisaoTipoAtivo', tipoRevisao);
    localStorage.setItem('metodoSelecionado', metodoTitulo);
    
    // Chamar a função global de navegação
    if (window.mostrarTela) {
      window.mostrarTela('revisao');
    } else {
      alert(`Vamos para a revisão!\nMétodo: ${metodoTitulo}\nTipo: ${tipoRevisao}`);
    }
    
    setMetodoSelecionado(null);
  };

  if (loading) {
    return (
      <div className="metodos-loading">
        <div className="spinner"></div>
        <p>Carregando métodos personalizados...</p>
      </div>
    );
  }

  return (
    <section id="metodosSection" className="metodos-container">
      {/* Cabeçalho */}
      <div className="metodos-header">
        <div className="inteligencia-badge" style={{ background: metodos.cor }}>
          <span className="inteligencia-icone-grande">{metodos.icone}</span>
          <span>Inteligência {metodos.nome}</span>
        </div>
        
        <h1>
          Métodos de Estudo para você
        </h1>
        
        <p className="metodos-descricao">{metodos.descricao}</p>
      </div>

      {/* Lista de métodos */}
      <div className="metodos-grid">
        {metodos.metodos.map((metodo) => (
          <div 
            key={metodo.id} 
            className="metodo-card"
            onClick={() => {
              setMetodoSelecionado(metodo);
              setMostrarExplicacao(false);
            }}
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
              Ver método completo <i className="bi bi-arrow-right"></i>
            </button>
          </div>
        ))}
      </div>

      {/* Modal com detalhes do método */}
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
              {/* Botão para mostrar explicação do método */}
              {metodoSelecionado.explicacao && (
                <button 
                  className="btn-explicacao"
                  onClick={() => setMostrarExplicacao(!mostrarExplicacao)}
                  style={{ background: metodos.cor }}
                >
                  <i className="bi bi-question-circle-fill"></i>
                  {mostrarExplicacao ? "Ocultar explicação" : "Por que este método é bom para você?"}
                </button>
              )}

              {/* Explicação detalhada */}
              {mostrarExplicacao && metodoSelecionado.explicacao && (
                <div className="explicacao-box" style={{ borderLeftColor: metodos.cor }}>
                  <div className="explicacao-content">
                    {metodoSelecionado.explicacao.split('\n').map((paragrafo, idx) => (
                      <p key={idx}>{paragrafo}</p>
                    ))}
                  </div>
                  {metodoSelecionado.beneficios && (
                    <div className="beneficios-box">
                      <strong>✨ Benefícios para você:</strong>
                      <ul>
                        {metodoSelecionado.beneficios.map((beneficio, idx) => (
                          <li key={idx}>{beneficio}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <h4>📋 Passo a Passo:</h4>
              <ol className="modal-passos">
                {metodoSelecionado.passos.map((passo, index) => (
                  <li key={index}>{passo}</li>
                ))}
              </ol>

              <div className="modal-dica">
                <i className="bi bi-lightbulb-fill"></i>
                <span>Dica: Adapte esse método ao seu estilo pessoal e combine com outras técnicas!</span>
              </div>
            </div>

            <div className="modal-footer">
              {metodoSelecionado.irParaRevisao ? (
                <button 
                  className="btn-aplicar"
                  style={{ background: metodos.cor }}
                  onClick={() => irParaRevisao(metodoSelecionado.tipoRevisao, metodoSelecionado.titulo)}
                >
                  <i className="bi bi-arrow-repeat"></i> 
                  Ir para Revisão ({metodoSelecionado.tipoRevisao === 'flashcards' ? 'Flashcards' : metodoSelecionado.tipoRevisao === 'revisao_espacada' ? 'Repetição Espaçada' : 'Revisão'})
                </button>
              ) : (
                <button 
                  className="btn-aplicar"
                  style={{ background: metodos.cor }}
                  onClick={() => {
                    alert(`Vamos aplicar o método: ${metodoSelecionado.titulo}!\n\n${metodoSelecionado.passos.join('\n')}`);
                    setMetodoSelecionado(null);
                  }}
                >
                  <i className="bi bi-play-fill"></i> Começar Agora
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
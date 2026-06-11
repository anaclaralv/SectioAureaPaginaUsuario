import React, { useState, useEffect } from 'react';
import './Metodos.css';

// Banco de dados dos métodos por inteligência
const metodosPorInteligencia = {
  logico: {
    nome: "Lógico-Matemática",
    icone: "🔢",
    descricao: "Você aprende melhor com lógica, padrões, números e resolução de problemas!",
    metodos: [
      {
        id: 1,
        titulo: "Mapas Mentais Estruturados",
        descricao: "Crie diagramas hierárquicos com fórmulas e conceitos interligados",
        tempo: "30 min",
        dificuldade: "Médio",
        passos: [
          "Coloque o tema principal no centro",
          "Adicione ramos com conceitos-chave",
          "Use cores diferentes para categorias",
          "Conecte ideias relacionadas com setas"
        ]
      },
      {
        id: 2,
        titulo: "Resolução de Problemas Passo a Passo",
        descricao: "Exercite com problemas reais e acompanhe a solução",
        tempo: "45 min",
        dificuldade: "Difícil",
        passos: [
          "Leia o problema e identifique os dados",
          "Crie hipóteses de solução",
          "Teste cada hipótese",
          "Documente a solução encontrada"
        ]
      },
      {
        id: 3,
        titulo: "Flashcards com Cálculos",
        descricao: "Crie flashcards com problemas e soluções no verso",
        tempo: "20 min",
        dificuldade: "Fácil",
        passos: [
          "Crie perguntas de um lado",
          "Coloque a resolução do outro",
          "Teste-se diariamente",
          "Separe os que acertou dos que errou"
        ]
      }
    ]
  },
  linguistica: {
    nome: "Linguística",
    icone: "📝",
    descricao: "Você aprende melhor com palavras, leitura, escrita e comunicação!",
    metodos: [
      {
        id: 1,
        titulo: "Resumos e Sínteses",
        descricao: "Escreva resumos com suas próprias palavras",
        tempo: "40 min",
        dificuldade: "Médio",
        passos: [
          "Leia o conteúdo original",
          "Destaque as ideias principais",
          "Escreva um resumo conciso",
          "Revise e refine o texto"
        ]
      },
      {
        id: 2,
        titulo: "Debate e Discussão",
        descricao: "Discuta os temas com colegas ou grave seus argumentos",
        tempo: "30 min",
        dificuldade: "Médio",
        passos: [
          "Escolha um tema para debater",
          "Prepare seus argumentos",
          "Discuta com alguém",
          "Anote os contra-argumentos"
        ]
      },
      {
        id: 3,
        titulo: "Associação de Palavras",
        descricao: "Crie histórias ou mnemônicos para lembrar conceitos",
        tempo: "15 min",
        dificuldade: "Fácil",
        passos: [
          "Liste as palavras-chave",
          "Crie uma história conectando-as",
          "Use rimas ou siglas",
          "Repita a história em voz alta"
        ]
      }
    ]
  },
  espacial: {
    nome: "Espacial",
    icone: "🎨",
    descricao: "Você aprende melhor com imagens, diagramas, mapas e visualização!",
    metodos: [
      {
        id: 1,
        titulo: "Mapas Mentais Visuais",
        descricao: "Use cores, desenhos e símbolos para representar ideias",
        tempo: "35 min",
        dificuldade: "Médio",
        passos: [
          "Desenhe o conceito central",
          "Use ícones para representar ideias",
          "Conecte com linhas coloridas",
          "Adicione imagens que representem os conceitos"
        ]
      },
      {
        id: 2,
        titulo: "Linha do Tempo Ilustrada",
        descricao: "Crie linhas do tempo com desenhos para eventos históricos",
        tempo: "30 min",
        dificuldade: "Médio",
        passos: [
          "Defina os eventos principais",
          "Organize em ordem cronológica",
          "Desenhe um ícone para cada evento",
          "Conecte com setas temporais"
        ]
      },
      {
        id: 3,
        titulo: "Desenho Esquemático",
        descricao: "Transforme conceitos abstratos em desenhos simples",
        tempo: "25 min",
        dificuldade: "Fácil",
        passos: [
          "Leia o conceito",
          "Pense em uma imagem que represente",
          "Desenhe de forma simples",
          "Adicione legendas explicativas"
        ]
      }
    ]
  },
  corporal: {
    nome: "Corporal-Cinestésica",
    icone: "🏃",
    descricao: "Você aprende melhor com movimento, prática e experiência física!",
    metodos: [
      {
        id: 1,
        titulo: "Role-Play e Simulação",
        descricao: "Encene situações para aprender na prática",
        tempo: "40 min",
        dificuldade: "Difícil",
        passos: [
          "Defina o cenário simulado",
          "Atribua papéis",
          "Execute a simulação",
          "Discuta o aprendizado"
        ]
      },
      {
        id: 2,
        titulo: "Caminhada Reflexiva",
        descricao: "Estude enquanto caminha e faz anotações",
        tempo: "30 min",
        dificuldade: "Fácil",
        passos: [
          "Prepare áudios ou resumos",
          "Caminhe em um local calmo",
          "Pare para fazer anotações",
          "Repita o conteúdo em voz alta"
        ]
      },
      {
        id: 3,
        titulo: "Construção de Modelos",
        descricao: "Crie modelos físicos de conceitos abstratos",
        tempo: "50 min",
        dificuldade: "Difícil",
        passos: [
          "Escolha um conceito",
          "Pense em como representá-lo",
          "Use materiais simples (massinha, papelão)",
          "Explique o modelo para alguém"
        ]
      }
    ]
  },
  musical: {
    nome: "Musical",
    icone: "🎵",
    descricao: "Você aprende melhor com ritmo, melodia, sons e músicas!",
    metodos: [
      {
        id: 1,
        titulo: "Músicas Didáticas",
        descricao: "Crie músicas ou paródias para memorizar conteúdo",
        tempo: "35 min",
        dificuldade: "Médio",
        passos: [
          "Escolha uma melodia conhecida",
          "Adapte o conteúdo para a letra",
          "Ensaiote a música",
          "Grave e ouça depois"
        ]
      },
      {
        id: 2,
        titulo: "Ritmo e Batida",
        descricao: "Use batidas para marcar pontos importantes",
        tempo: "20 min",
        dificuldade: "Fácil",
        passos: [
          "Separe o conteúdo em partes",
          "Crie uma batida para cada parte",
          "Associe batida ao conceito",
          "Repita o ritmo para lembrar"
        ]
      },
      {
        id: 3,
        titulo: "Podcast de Estudo",
        descricao: "Grave explicações e ouça como podcast",
        tempo: "40 min",
        dificuldade: "Médio",
        passos: [
          "Escreva um roteiro simples",
          "Grave sua explicação",
          "Adicione efeitos sonoros",
          "Ouça em momentos livres (caminhando, no ônibus)"
        ]
      }
    ]
  },
  interpessoal: {
    nome: "Interpessoal",
    icone: "👥",
    descricao: "Você aprende melhor com outras pessoas, em grupo e discutindo!",
    metodos: [
      {
        id: 1,
        titulo: "Grupo de Estudo",
        descricao: "Estude em grupo com rodízio de explicações",
        tempo: "50 min",
        dificuldade: "Médio",
        passos: [
          "Divida os temas entre os membros",
          "Cada um prepara sua parte",
          "Revezem as explicações",
          "Tirem dúvidas coletivamente"
        ]
      },
      {
        id: 2,
        titulo: "Ensine o Colega",
        descricao: "Explique o conteúdo para outra pessoa",
        tempo: "30 min",
        dificuldade: "Difícil",
        passos: [
          "Escolha o tema",
          "Prepare uma explicação simples",
          "Ensine para um colega",
          "Peça feedback"
        ]
      },
      {
        id: 3,
        titulo: "Debate Estruturado",
        descricao: "Organize debates sobre os temas estudados",
        tempo: "45 min",
        dificuldade: "Difícil",
        passos: [
          "Divida o grupo em times",
          "Defina o tema central",
          "Prepare argumentos",
          "Realize o debate"
        ]
      }
    ]
  },
  intrapessoal: {
    nome: "Intrapessoal",
    icone: "🧘",
    descricao: "Você aprende melhor sozinho, com reflexão e autoanálise!",
    metodos: [
      {
        id: 1,
        titulo: "Diário de Estudo",
        descricao: "Registre seu progresso e reflexões diárias",
        tempo: "20 min",
        dificuldade: "Fácil",
        passos: [
          "Escreva o que aprendeu hoje",
          "Anote suas dúvidas",
          "Registre o que funcionou",
          "Planeje o próximo estudo"
        ]
      },
      {
        id: 2,
        titulo: "Autoavaliação Guiada",
        descricao: "Faça perguntas a si mesmo sobre o conteúdo",
        tempo: "25 min",
        dificuldade: "Médio",
        passos: [
          "Liste perguntas sobre o tema",
          "Tente responder sem consultar",
          "Verifique as respostas",
          "Identifique pontos fracos"
        ]
      },
      {
        id: 3,
        titulo: "Meditação Focada",
        descricao: "Use meditação para fixar conceitos importantes",
        tempo: "20 min",
        dificuldade: "Médio",
        passos: [
          "Escolha um conceito-chave",
          "Feche os olhos e respire profundamente",
          "Visualize o conceito mentalmente",
          "Repita em voz baixa para fixar"
        ]
      }
    ]
  }
};

const Metodos = () => {
  const [tipoInteligencia, setTipoInteligencia] = useState(null);
  const [metodos, setMetodos] = useState(null);
  const [metodoSelecionado, setMetodoSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carregar a inteligência do localStorage (igual seu sistema)
  useEffect(() => {
    const tipoSalvo = localStorage.getItem('inteligenciaUsuario');
    console.log("Inteligência carregada:", tipoSalvo);
    
    if (tipoSalvo && metodosPorInteligencia[tipoSalvo]) {
      setTipoInteligencia(tipoSalvo);
      setMetodos(metodosPorInteligencia[tipoSalvo]);
    } else {
      // Fallback padrão
      setTipoInteligencia('logico');
      setMetodos(metodosPorInteligencia.logico);
    }
    
    setLoading(false);
  }, []);

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
      {/* Cabeçalho com a inteligência do usuário */}
      <div className="metodos-header">
        <div className="inteligencia-badge" style={{ background: `var(--cor-primaria)` }}>
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
            <button className="btn-ver-mais" style={{ color: `var(--cor-primaria)` }}>
              Ver método completo <i className="bi bi-arrow-right"></i>
            </button>
          </div>
        ))}
      </div>

      {/* Modal com detalhes */}
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
              <p className="modal-descricao">{metodoSelecionado.descricao}</p>
              
              <h4> Passo a Passo:</h4>
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
              <button 
                className="btn-aplicar"
                style={{ background: `var(--cor-primaria)` }}
                onClick={() => {
                  alert(`Vamos aplicar o método: ${metodoSelecionado.titulo}!\n\n${metodoSelecionado.passos.join('\n')}`);
                  setMetodoSelecionado(null);
                }}
              >
                <i className="bi bi-play-fill"></i> Começar Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Metodos;
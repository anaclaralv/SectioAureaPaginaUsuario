import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { apiFetch } from '../api';
import './Revisao.css';

export default function Revisao() {
  const [flashcards, setFlashcards] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [expandedDecks, setExpandedDecks] = useState({});
  const [modoFocoAberto, setModoFocoAberto] = useState(false);
  const [revisoesEmAndamento, setRevisoesEmAndamento] = useState([]);
  const [indiceAtualFoco, setIndiceAtualFoco] = useState(0);
  const [respostaVisivel, setRespostaVisivel] = useState(false);
  const [revisaoInfo, setRevisaoInfo] = useState({ deckNome: '', subdeckNome: '', totalCards: 0 });

  // Aba ativa: 'baralhos' (Baralhos por matéria - padrão) ou 'espacada' (Repetição Espaçada)
  const [abaAtiva, setAbaAtiva] = useState(() => {
    const tipo = localStorage.getItem('revisaoTipoAtivo');
    return tipo === 'revisao_espacada' ? 'espacada' : 'baralhos';
  });
  const [filtroMateriaFila, setFiltroMateriaFila] = useState('todas');
  
  // Criação de flashcard
  const [novoFlashcard, setNovoFlashcard] = useState({
    materiaId: '',
    tema: '',
    pergunta: '',
    resposta: ''
  });

  // Criação inline de nova matéria
  const [mostrarNovaMateria, setMostrarNovaMateria] = useState(false);
  const [novaMateriaNome, setNovaMateriaNome] = useState('');
  const [novaMateriaCor, setNovaMateriaCor] = useState('#9f042c');
  const [salvandoMateria, setSalvandoMateria] = useState(false);

  const hoje = () => new Date().toISOString().split('T')[0];

  const formatColor = (cor) => {
    if (!cor) return 'var(--cor-primaria)';
    if (cor.startsWith('0x') || cor.startsWith('0X')) {
      return '#' + cor.slice(-6);
    }
    return cor;
  };

  // Carregar matérias da API
  const carregarMaterias = async () => {
    try {
      const res = await apiFetch('materias');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMaterias(data);
          localStorage.setItem('materias', JSON.stringify(data));
          return;
        }
      }
    } catch (err) {
      console.error('Erro ao buscar matérias da API:', err);
    }

    const materiasSalvas = localStorage.getItem('materias');
    if (materiasSalvas) {
      try {
        setMaterias(JSON.parse(materiasSalvas));
      } catch (e) {}
    }
  };

  // Carregar flashcards da API e sincronizar com progresso local
  const carregarFlashcards = async () => {
    let localCards = [];
    const flashcardsSalvos = localStorage.getItem('flashcards_sistema');
    if (flashcardsSalvos) {
      try {
        const parsed = JSON.parse(flashcardsSalvos);
        if (Array.isArray(parsed)) {
          localCards = parsed;
          setFlashcards(parsed);
        }
      } catch (e) {}
    }

    try {
      const res = await apiFetch('flashcards');
      if (res.ok) {
        const apiCards = await res.json();
        if (Array.isArray(apiCards)) {
          const merged = apiCards.map(ac => {
            const existing = localCards.find(
              lc => String(lc.id) === String(ac.id_flash) || String(lc.id_flash) === String(ac.id_flash)
            );

            let temaNome = ac.tema || 'Geral';
            let extraMeta = {};
            if (typeof ac.tema === 'string' && ac.tema.startsWith('{')) {
              try {
                const parsedJson = JSON.parse(ac.tema);
                temaNome = parsedJson.tema || 'Geral';
                extraMeta = parsedJson;
              } catch (e) {}
            }

            let dataUltima = existing?.dataUltimaRevisao ?? extraMeta.dataUltimaRevisao ?? null;
            if (!dataUltima && Array.isArray(extraMeta.historico) && extraMeta.historico.length > 0) {
              dataUltima = extraMeta.historico[extraMeta.historico.length - 1].data;
            }

            return {
              id: ac.id_flash,
              id_flash: ac.id_flash,
              materiaId: String(ac.id_materia),
              id_materia: ac.id_materia,
              materiaNome: ac.nome_materia || existing?.materiaNome || 'Sem matéria',
              materiaCor: ac.cor_materia || existing?.materiaCor || null,
              tema: temaNome,
              pergunta: ac.pergunta,
              resposta: ac.resposta,
              nivel: existing?.nivel ?? extraMeta.nivel ?? 0,
              dataProxima: existing?.dataProxima ?? extraMeta.dataProxima ?? hoje(),
              dataUltimaRevisao: dataUltima,
              acertos: existing?.acertos ?? extraMeta.acertos ?? 0,
              erros: existing?.erros ?? extraMeta.erros ?? 0,
            };
          });

          const apiIds = new Set(merged.map(m => String(m.id)));
          const onlyLocal = localCards.filter(lc => lc.id && !apiIds.has(String(lc.id)) && !lc.id_flash);

          const finalCards = [...merged, ...onlyLocal];
          setFlashcards(finalCards);
          localStorage.setItem('flashcards_sistema', JSON.stringify(finalCards));
        }
      }
    } catch (err) {
      console.error('Erro ao buscar flashcards da API:', err);
    }
  };

  useEffect(() => {
    carregarMaterias();
    carregarFlashcards();

    const handleNavegarRevisao = () => {
      const tipo = localStorage.getItem('revisaoTipoAtivo');
      if (tipo === 'revisao_espacada') {
        setAbaAtiva('espacada');
      } else {
        setAbaAtiva('baralhos');
      }
    };
    window.addEventListener('navegarPara', handleNavegarRevisao);
    return () => window.removeEventListener('navegarPara', handleNavegarRevisao);
  }, []);

  useEffect(() => {
    localStorage.setItem('flashcards_sistema', JSON.stringify(flashcards));
  }, [flashcards]);

  const organizarBaralhos = useCallback(() => {
    const decks = [];
    const hojeData = hoje();
    const materiasProcessadas = new Set();

    materias.forEach(materia => {
      const matId = String(materia.id_materia || materia.id);
      materiasProcessadas.add(matId);

      const cardsDaMateria = flashcards.filter(f => String(f.materiaId || f.id_materia) === matId);
      
      const temas = {};
      cardsDaMateria.forEach(card => {
        const tema = card.tema || 'Geral';
        if (!temas[tema]) temas[tema] = [];
        temas[tema].push(card);
      });
      
      let novo = 0, aprender = 0, revisar = 0;
      cardsDaMateria.forEach(card => {
        if (card.nivel === 0) novo++;
        else if (card.dataProxima <= hojeData) revisar++;
        else if (card.dataProxima > hojeData) aprender++;
      });
      
      decks.push({
        id: matId,
        nome: materia.nome,
        cor: formatColor(materia.cor),
        novo, aprender, revisar,
        total: cardsDaMateria.length,
        cards: cardsDaMateria,
        subtemas: Object.entries(temas).map(([nomeTema, cards]) => ({
          nome: nomeTema,
          cards,
          novo: cards.filter(c => c.nivel === 0).length,
          aprender: cards.filter(c => c.dataProxima > hojeData && c.nivel > 0).length,
          revisar: cards.filter(c => c.dataProxima <= hojeData && c.nivel > 0).length
        }))
      });
    });

    // Cards sem matéria ou com matéria não listada
    const cardsSemMateria = flashcards.filter(f => {
      const mId = String(f.materiaId || f.id_materia || '');
      return !mId || !materiasProcessadas.has(mId);
    });

    if (cardsSemMateria.length > 0) {
      const temas = {};
      cardsSemMateria.forEach(card => {
        const tema = card.tema || 'Geral';
        if (!temas[tema]) temas[tema] = [];
        temas[tema].push(card);
      });

      let novo = 0, aprender = 0, revisar = 0;
      cardsSemMateria.forEach(card => {
        if (card.nivel === 0) novo++;
        else if (card.dataProxima <= hojeData) revisar++;
        else if (card.dataProxima > hojeData) aprender++;
      });

      decks.push({
        id: 'sem_materia',
        nome: 'Geral / Outros',
        cor: '#64748b',
        novo, aprender, revisar,
        total: cardsSemMateria.length,
        cards: cardsSemMateria,
        subtemas: Object.entries(temas).map(([nomeTema, cards]) => ({
          nome: nomeTema,
          cards,
          novo: cards.filter(c => c.nivel === 0).length,
          aprender: cards.filter(c => c.dataProxima > hojeData && c.nivel > 0).length,
          revisar: cards.filter(c => c.dataProxima <= hojeData && c.nivel > 0).length
        }))
      });
    }
    
    return decks.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [materias, flashcards]);

  const formatarUltimaRevisao = (dataIso) => {
    if (!dataIso) return 'Nunca revisado';
    try {
      const d = new Date(dataIso);
      if (isNaN(d.getTime())) return 'Nunca revisado';
      const agora = new Date();
      const diffMs = agora - d;
      const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffHoras < 1) return 'Há poucos minutos';
      if (diffHoras < 24) return `Hoje às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      if (diffDias === 1) return 'Ontem';
      if (diffDias < 30) return `Há ${diffDias} dias`;
      return d.toLocaleDateString('pt-BR');
    } catch (e) {
      return 'Nunca revisado';
    }
  };

  // Cálculo da Fila Ordenada de Repetição Espaçada (Curva do Esquecimento / Ebbinghaus)
  const calcularFilaEspacada = useCallback(() => {
    const hojeData = hoje();
    const agoraMs = new Date(hojeData).getTime();

    const fila = flashcards.map(card => {
      const dataProx = card.dataProxima || hojeData;
      const dataProxMs = new Date(dataProx).getTime();
      const diffDias = Math.round((agoraMs - dataProxMs) / (1000 * 60 * 60 * 24));

      let status = 'futuro';
      let prioridade = 4;
      let textoStatus = '';

      if (card.nivel === 0 && !card.dataUltimaRevisao) {
        status = 'novo';
        prioridade = 3;
        textoStatus = 'Novo conceito';
      } else if (diffDias > 0) {
        status = 'atrasado';
        prioridade = 1;
        textoStatus = `Atrasado há ${diffDias} ${diffDias === 1 ? 'dia' : 'dias'}`;
      } else if (diffDias === 0) {
        status = 'hoje';
        prioridade = 2;
        textoStatus = 'Relembrar hoje';
      } else {
        const diasFaltam = Math.abs(diffDias);
        status = 'futuro';
        prioridade = 4;
        textoStatus = `Em ${diasFaltam} ${diasFaltam === 1 ? 'dia' : 'dias'}`;
      }

      let diasSemRevisao = 99999;
      if (card.dataUltimaRevisao) {
        const ultimaMs = new Date(card.dataUltimaRevisao).getTime();
        diasSemRevisao = Math.max(0, Math.floor((Date.now() - ultimaMs) / (1000 * 60 * 60 * 24)));
      }

      return {
        ...card,
        diffDias,
        status,
        prioridade,
        textoStatus,
        diasSemRevisao
      };
    });

    // Ordenação da fila por ordem de urgência:
    // 1º Atrasados: maior atraso primeiro
    // 2º Para Hoje: maior tempo desde a última revisão primeiro
    // 3º Novos: por id
    // 4º Futuros: menor data próxima primeiro
    fila.sort((a, b) => {
      if (a.prioridade !== b.prioridade) {
        return a.prioridade - b.prioridade;
      }
      if (a.prioridade === 1) {
        return b.diffDias - a.diffDias;
      }
      if (a.prioridade === 2) {
        return b.diasSemRevisao - a.diasSemRevisao;
      }
      if (a.prioridade === 4) {
        return (a.dataProxima || '').localeCompare(b.dataProxima || '');
      }
      return 0;
    });

    return fila;
  }, [flashcards]);

  const toggleDeck = (deckId) => {
    setExpandedDecks(prev => ({ ...prev, [deckId]: !prev[deckId] }));
  };

  const iniciarRevisao = (cards, deckNome, subdeckNome = null) => {
    if (!cards || cards.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Nada para revisar!',
        text: 'Nenhum conceito pendente no momento.',
        confirmButtonColor: 'var(--cor-primaria)'
      });
      return;
    }
    
    // Se vier da fila ordenada, mantém a ordem prioritária! Se não, embaralha.
    const ordenados = deckNome.includes("Fila") ? [...cards] : [...cards].sort(() => Math.random() - 0.5);
    setRevisoesEmAndamento(ordenados);
    setIndiceAtualFoco(0);
    setRespostaVisivel(false);
    setModoFocoAberto(true);
    setRevisaoInfo({
      deckNome,
      subdeckNome: subdeckNome || 'Conceitos Prioritários',
      totalCards: cards.length
    });
  };

  const responderFlashcard = async (resultado) => {
    if (!cardAtual) return;
    
    const acertou = resultado === 'acertei';
    const intervalos = {0:1, 1:3, 2:7, 3:14, 4:30};
    const novoNivel = acertou ? Math.min(cardAtual.nivel + 1, 4) : Math.max(cardAtual.nivel - 1, 0);
    const dias = intervalos[novoNivel];
    const novaData = new Date();
    novaData.setDate(novaData.getDate() + dias);
    const dataProximaStr = novaData.toISOString().split('T')[0];
    const agoraIso = new Date().toISOString();

    const novosAcertos = (cardAtual.acertos || 0) + (acertou ? 1 : 0);
    const novosErros = (cardAtual.erros || 0) + (acertou ? 0 : 1);
    
    setFlashcards(prev => prev.map(f => {
      if (f.id === cardAtual.id || (f.id_flash && f.id_flash === cardAtual.id_flash)) {
        return {
          ...f,
          nivel: novoNivel,
          dataProxima: dataProximaStr,
          dataUltimaRevisao: agoraIso,
          acertos: novosAcertos,
          erros: novosErros
        };
      }
      return f;
    }));

    // Sincroniza atualização com o backend via PUT
    const flashId = cardAtual.id_flash || cardAtual.id;
    if (flashId) {
      try {
        const metaTema = {
          tema: cardAtual.tema || 'Geral',
          nivel: novoNivel,
          dataProxima: dataProximaStr,
          dataUltimaRevisao: agoraIso,
          acertos: novosAcertos,
          erros: novosErros
        };
        apiFetch(`flashcards/${flashId}`, {
          method: 'PUT',
          body: JSON.stringify({
            pergunta: cardAtual.pergunta,
            resposta: cardAtual.resposta,
            tema: JSON.stringify(metaTema)
          })
        }).catch(err => console.error("Erro ao sincronizar flashcard:", err));
      } catch (e) {
        console.error("Erro na requisição PUT de flashcard:", e);
      }
    }
    
    if (indiceAtualFoco + 1 >= revisoesEmAndamento.length) {
      setModoFocoAberto(false);
      Swal.fire({
        icon: 'success',
        title: 'Revisão concluída!',
        text: `Você relembrou ${revisoesEmAndamento.length} conceitos com sucesso!`,
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      setIndiceAtualFoco(prev => prev + 1);
      setRespostaVisivel(false);
    }
  };

  const fecharModoFoco = () => {
    setModoFocoAberto(false);
    setRespostaVisivel(false);
  };

  const cardAtual = revisoesEmAndamento[indiceAtualFoco];
  const baralhos = organizarBaralhos();

  const abrirModalFlashcard = (materiaId = '', tema = '') => {
    setMostrarNovaMateria(false);
    setNovaMateriaNome('');
    setNovoFlashcard({
      materiaId: materiaId ? String(materiaId) : (materias.length > 0 ? String(materias[0].id_materia || materias[0].id) : ''),
      tema: tema || '',
      pergunta: '',
      resposta: ''
    });
    const modalElement = document.getElementById('modalRevisao');
    if (!modalElement) return;
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
  };

  // Criar nova matéria via formulário inline
  const handleCriarMateria = async () => {
    if (!novaMateriaNome.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Digite o nome da matéria!',
        confirmButtonColor: 'var(--cor-primaria)'
      });
      return;
    }

    setSalvandoMateria(true);
    try {
      const res = await apiFetch('materias', {
        method: 'POST',
        body: JSON.stringify({
          nome: novaMateriaNome.trim(),
          cor: novaMateriaCor
        })
      });

      if (res.ok) {
        const data = await res.json();
        const novoId = data.id_materia || data.id;
        const novaObj = {
          id_materia: novoId,
          id: novoId,
          nome: novaMateriaNome.trim(),
          cor: novaMateriaCor
        };
        setMaterias(prev => [...prev, novaObj]);
        setNovoFlashcard(prev => ({ ...prev, materiaId: String(novoId) }));
        setNovaMateriaNome('');
        setMostrarNovaMateria(false);
        Swal.fire({
          icon: 'success',
          title: 'Matéria adicionada!',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        Swal.fire('Erro', 'Não foi possível cadastrar a matéria.', 'error');
      }
    } catch (err) {
      console.error('Erro ao criar matéria:', err);
      Swal.fire('Erro', 'Erro ao salvar matéria no servidor.', 'error');
    } finally {
      setSalvandoMateria(false);
    }
  };

  const salvarFlashcard = async () => {
    if (!novoFlashcard.materiaId || novoFlashcard.materiaId === '__NOVA__') {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Selecione uma matéria válida!', confirmButtonColor: 'var(--cor-primaria)' });
      return;
    }
    if (!novoFlashcard.pergunta.trim() || !novoFlashcard.resposta.trim()) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Preencha a pergunta e a resposta!', confirmButtonColor: 'var(--cor-primaria)' });
      return;
    }

    const materia = materias.find(m => String(m.id_materia || m.id) === String(novoFlashcard.materiaId));
    const matNome = materia ? materia.nome : 'Sem matéria';
    const temaNome = novoFlashcard.tema.trim() || 'Geral';

    let idFinal = Date.now();
    let idFlashApi = null;

    try {
      const res = await apiFetch('flashcards', {
        method: 'POST',
        body: JSON.stringify({
          id_materia: Number(novoFlashcard.materiaId),
          tema: temaNome,
          pergunta: novoFlashcard.pergunta.trim(),
          resposta: novoFlashcard.resposta.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id_flash) {
          idFinal = data.id_flash;
          idFlashApi = data.id_flash;
        }
      }
    } catch (err) {
      console.error('Erro ao salvar flashcard na API:', err);
    }
    
    const novo = {
      id: idFinal,
      id_flash: idFlashApi,
      materiaId: String(novoFlashcard.materiaId),
      id_materia: Number(novoFlashcard.materiaId),
      materiaNome: matNome,
      tema: temaNome,
      pergunta: novoFlashcard.pergunta.trim(),
      resposta: novoFlashcard.resposta.trim(),
      nivel: 0,
      dataProxima: hoje(),
      acertos: 0,
      erros: 0
    };
    
    setFlashcards(prev => [novo, ...prev]);
    
    const modalElement = document.getElementById('modalRevisao');
    if (modalElement) {
      const modal = window.bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();
    }
    
    Swal.fire({
      icon: 'success',
      title: 'Flashcard criado!',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  const filaOrdenada = calcularFilaEspacada();
  const totalAtrasados = filaOrdenada.filter(c => c.prioridade === 1).length;
  const totalHoje = filaOrdenada.filter(c => c.prioridade === 2).length;
  const totalNovos = filaOrdenada.filter(c => c.prioridade === 3).length;
  const totalFuturos = filaOrdenada.filter(c => c.prioridade === 4).length;
  const totalAtrasadosHoje = totalAtrasados + totalHoje;

  const filaExibida = filtroMateriaFila === 'todas'
    ? filaOrdenada
    : filaOrdenada.filter(c => String(c.materiaId || c.id_materia) === String(filtroMateriaFila));

  return (
    <section id="revisaoSection">
      {/* Abas Superiores de Navegação */}
      <div className="revisao-abas-nav">
        <button
          className={`btn-aba ${abaAtiva === 'baralhos' ? 'ativo' : ''}`}
          onClick={() => {
            setAbaAtiva('baralhos');
            localStorage.setItem('revisaoTipoAtivo', 'baralhos');
          }}
        >
          <i className="bi bi-collection-fill"></i> Baralhos por Matéria
        </button>
        <button
          className={`btn-aba ${abaAtiva === 'espacada' ? 'ativo' : ''}`}
          onClick={() => {
            setAbaAtiva('espacada');
            localStorage.setItem('revisaoTipoAtivo', 'revisao_espacada');
          }}
        >
          <i className="bi bi-hourglass-split"></i> Fila de Repetição Espaçada
          {totalAtrasadosHoje > 0 && (
            <span className="badge-urgencia-header">{totalAtrasadosHoje}</span>
          )}
        </button>
      </div>

      {/* ==================== VISTA 1: BARALHOS POR MATÉRIA ==================== */}
      {abaAtiva === 'baralhos' && (
        <>
          <div className="revisao-header">
            <div>
              <h1>Meus Baralhos</h1>
              <p className="revisao-subtitle">Organize seus flashcards por matéria e tema</p>
            </div>
            <button className="btn-add-revisao" onClick={() => abrirModalFlashcard()}>
              <i className="bi bi-plus-lg"></i> Novo Flashcard
            </button>
          </div>

          {/* Botão de Revisão Geral */}
          <div style={{ 
            marginBottom: '30px',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <button 
              onClick={() => {
                if (flashcards.length === 0) {
                  Swal.fire({
                    icon: 'warning',
                    title: 'Nenhum card!',
                    text: 'Crie alguns flashcards primeiro!',
                    confirmButtonColor: 'var(--cor-primaria)'
                  });
                  return;
                }
                iniciarRevisao([...flashcards], "Revisão Geral", `${flashcards.length} cards`);
              }}
              className="btn-revisao-principal"
              style={{
                background: 'var(--cor-primaria)',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                padding: '12px 28px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.95rem',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              <i className="bi bi-play-fill" style={{ fontSize: '1.1rem' }}></i>
              Iniciar Revisão Geral
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '30px',
                padding: '2px 10px',
                fontSize: '0.75rem',
                fontWeight: '500'
              }}>
                {flashcards.length} cards
              </span>
            </button>
          </div>

          {/* Tabela de baralhos */}
          <div className="anki-table-container">
            <table className="anki-table">
              <thead>
                <tr>
                  <th>Baralho</th>
                  <th> Novo</th>
                  <th> Aprender</th>
                  <th> Revisar</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {baralhos.map(deck => {
                  const isExpanded = expandedDecks[deck.id] || false;
                  return (
                    <React.Fragment key={deck.id}>
                      <tr className="deck-row" onClick={() => toggleDeck(deck.id)} style={{ cursor: 'pointer' }}>
                        <td style={{ padding: '12px 20px' }}>
                          <div className="deck-info">
                            <span className={`deck-expand-icon ${isExpanded ? 'expanded' : ''}`}>
                              <i className="bi bi-chevron-right"></i>
                            </span>
                            <span className="deck-name" style={{ borderLeftColor: deck.cor }}>{deck.nome}</span>
                            <span className="deck-total">{deck.total} cards</span>
                          </div>
                        </td>
                        <td className="count-novo">{deck.novo > 0 ? deck.novo : '—'}</td>
                        <td className="count-aprender">{deck.aprender > 0 ? deck.aprender : '—'}</td>
                        <td className="count-revisar">{deck.revisar > 0 ? deck.revisar : '—'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            {deck.total > 0 && (
                              <button 
                                className="btn-revisar-mini" 
                                onClick={(e) => { e.stopPropagation(); iniciarRevisao(deck.cards, deck.nome); }}
                                title="Revisar este baralho"
                              >
                                <i className="bi bi-play-fill"></i>
                              </button>
                            )}
                            <button 
                              className="btn-add-card-mini" 
                              onClick={(e) => { e.stopPropagation(); abrirModalFlashcard(deck.id); }}
                              title="Adicionar flashcard neste baralho"
                            >
                              <i className="bi bi-plus"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && deck.subtemas.map(subdeck => (
                        <tr key={`${deck.id}-${subdeck.nome}`} className="subdeck-row">
                          <td className="subdeck-cell">
                            <div className="subdeck-info">
                              <i className="bi bi-folder"></i>
                              <span className="subdeck-name">{subdeck.nome}</span>
                              <span className="subdeck-total">{subdeck.cards.length} cards</span>
                            </div>
                          </td>
                          <td className="count-novo">{subdeck.novo > 0 ? subdeck.novo : '—'}</td>
                          <td className="count-aprender">{subdeck.aprender > 0 ? subdeck.aprender : '—'}</td>
                          <td className="count-revisar">{subdeck.revisar > 0 ? subdeck.revisar : '—'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                              {subdeck.cards.length > 0 && (
                                <button 
                                  className="btn-revisar-mini" 
                                  onClick={(e) => { e.stopPropagation(); iniciarRevisao(subdeck.cards, deck.nome, subdeck.nome); }}
                                  title="Revisar este tema"
                                >
                                  <i className="bi bi-play-fill"></i>
                                </button>
                              )}
                              <button 
                                className="btn-add-card-mini" 
                                onClick={(e) => { e.stopPropagation(); abrirModalFlashcard(deck.id, subdeck.nome); }}
                                title="Adicionar flashcard neste tema"
                              >
                                <i className="bi bi-plus"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {baralhos.length === 0 && (
            <div className="empty-state">
              <i className="bi bi-journal-bookmark-fill"></i>
              <p>Nenhum baralho criado ainda</p>
              <button className="btn-add-revisao" onClick={() => abrirModalFlashcard()}>
                Criar meu primeiro flashcard
              </button>
            </div>
          )}
        </>
      )}

      {/* ==================== VISTA 2: FILA DE REPETIÇÃO ESPAÇADA ==================== */}
      {abaAtiva === 'espacada' && (
        <>
          <div className="revisao-header">
            <div>
              <h1>
                <i className="bi bi-hourglass-split text-primary me-2"></i>
                Fila de Repetição Espaçada
              </h1>
              <p className="revisao-subtitle">
                Ordem inteligente de conceitos para relembrar de acordo com sua última revisão (Curva de Ebbinghaus)
              </p>
            </div>
            <button className="btn-add-revisao" onClick={() => abrirModalFlashcard()}>
              <i className="bi bi-plus-lg"></i> Novo Conceito
            </button>
          </div>

          <div className="espacada-banner-info">
            <i className="bi bi-info-circle-fill"></i>
            <span>
              <strong>Como funciona a ordem:</strong> O sistema prioriza conceitos com <em>risco imediato de esquecimento</em> (atrasados há mais tempo), depois os que vencem <em>hoje</em>, seguidos por <em>novos conceitos</em> e agendamentos futuros.
            </span>
          </div>

          {/* Cards de Métricas */}
          <div className="espacada-metricas-grid">
            <div className="espacada-metric-card">
              <div className="espacada-metric-icon atrasado">
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>
              <div>
                <h4>{totalAtrasados}</h4>
                <span>Atrasados (Urgentes)</span>
              </div>
            </div>

            <div className="espacada-metric-card">
              <div className="espacada-metric-icon hoje">
                <i className="bi bi-alarm-fill"></i>
              </div>
              <div>
                <h4>{totalHoje}</h4>
                <span>Relembrar Hoje</span>
              </div>
            </div>

            <div className="espacada-metric-card">
              <div className="espacada-metric-icon novo">
                <i className="bi bi-stars"></i>
              </div>
              <div>
                <h4>{totalNovos}</h4>
                <span>Novos Conceitos</span>
              </div>
            </div>

            <div className="espacada-metric-card">
              <div className="espacada-metric-icon futuro">
                <i className="bi bi-shield-check"></i>
              </div>
              <div>
                <h4>{totalFuturos}</h4>
                <span>Em Memória</span>
              </div>
            </div>
          </div>

          {/* Ações da Fila */}
          <div className="espacada-actions-bar">
            <div className="d-flex align-items-center gap-2">
              <button
                className={`btn-iniciar-fila ${totalAtrasadosHoje > 0 ? '' : 'sucesso'}`}
                onClick={() => {
                  if (filaOrdenada.length === 0) {
                    Swal.fire('Nenhum conceito', 'Crie alguns flashcards primeiro!', 'info');
                    return;
                  }
                  const cardsParaRevisar = totalAtrasadosHoje > 0
                    ? filaOrdenada.filter(c => c.prioridade === 1 || c.prioridade === 2)
                    : filaOrdenada;

                  iniciarRevisao(cardsParaRevisar, "Fila de Repetição Espaçada", `${cardsParaRevisar.length} conceitos`);
                }}
              >
                <i className="bi bi-play-circle-fill"></i>
                {totalAtrasadosHoje > 0
                  ? `Iniciar Revisão Prioritária (${totalAtrasadosHoje} conceitos)`
                  : `Revisar Fila Completa (${filaOrdenada.length} conceitos)`}
              </button>

              {totalAtrasadosHoje === 0 && filaOrdenada.length > 0 && (
                <span className="badge bg-success p-2" style={{ fontSize: '0.85rem' }}>
                  <i className="bi bi-check-circle-fill me-1"></i> Memória em dia!
                </span>
              )}
            </div>

            <div className="d-flex align-items-center gap-2">
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto', minWidth: '170px' }}
                value={filtroMateriaFila}
                onChange={e => setFiltroMateriaFila(e.target.value)}
              >
                <option value="todas">Todas as matérias</option>
                {materias.map(m => (
                  <option key={m.id_materia || m.id} value={String(m.id_materia || m.id)}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabela da Fila de Repetição Espaçada */}
          {filaExibida.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-hourglass-split"></i>
              <p>Nenhum conceito encontrado na fila.</p>
              <button className="btn-add-revisao" onClick={() => abrirModalFlashcard()}>
                Criar primeiro conceito
              </button>
            </div>
          ) : (
            <div className="fila-table-container">
              <table className="fila-table">
                <thead>
                  <tr>
                    <th style={{ width: '55px', textAlign: 'center' }}>#</th>
                    <th style={{ width: '190px' }}>Status / Prazo</th>
                    <th>Conceito / Pergunta</th>
                    <th style={{ width: '160px' }}>Matéria</th>
                    <th style={{ width: '180px' }}>Última Revisão</th>
                    <th style={{ width: '150px' }}>Nível de Retenção</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filaExibida.map((card, idx) => {
                    const materiaObj = materias.find(m => String(m.id_materia || m.id) === String(card.materiaId || card.id_materia));
                    const matCor = formatColor(card.materiaCor || materiaObj?.cor);
                    const nomesNivel = ['1 dia', '3 dias', '7 dias', '14 dias', '30 dias'];
                    const nivelAtual = Math.min(Math.max(card.nivel || 0, 0), 4);

                    return (
                      <tr key={card.id || card.id_flash || idx}>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`fila-pos-badge ${idx < 3 && (card.prioridade === 1 || card.prioridade === 2) ? 'top' : ''}`}>
                            {idx + 1}º
                          </span>
                        </td>
                        <td>
                          <span className={`status-urgencia-pill ${card.status}`}>
                            <i className={
                              card.status === 'atrasado'
                                ? 'bi bi-exclamation-circle-fill'
                                : card.status === 'hoje'
                                ? 'bi bi-alarm-fill'
                                : card.status === 'novo'
                                ? 'bi bi-stars'
                                : 'bi bi-calendar-check'
                            }></i>
                            {card.textoStatus}
                          </span>
                        </td>
                        <td>
                          <strong style={{ display: 'block', color: '#1e293b', marginBottom: 2 }}>
                            {card.pergunta}
                          </strong>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Tema: {card.tema || 'Geral'}
                          </span>
                        </td>
                        <td>
                          <span
                            className="badge-materia"
                            style={{
                              background: `${matCor}15`,
                              color: matCor,
                              border: `1px solid ${matCor}30`
                            }}
                          >
                            <i className="bi bi-bookmark-fill"></i>
                            {card.materiaNome || 'Geral'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
                            <i className="bi bi-clock-history me-1 text-muted"></i>
                            {formatarUltimaRevisao(card.dataUltimaRevisao)}
                          </span>
                        </td>
                        <td>
                          <div className="memory-level-wrapper">
                            <div className="memory-bars-row">
                              {[0, 1, 2, 3, 4].map(step => (
                                <div
                                  key={step}
                                  className={`memory-bar-segment ${step <= nivelAtual ? 'filled' : ''}`}
                                />
                              ))}
                            </div>
                            <span className="memory-level-text">
                              Nível {nivelAtual + 1} ({nomesNivel[nivelAtual]})
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn-relembrar-single"
                            onClick={() => iniciarRevisao([card], "Revisão Específica", card.pergunta)}
                            title="Relembrar este conceito agora"
                          >
                            <i className="bi bi-play-fill"></i> Relembrar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal Flashcard */}
      <div className="modal fade" id="modalRevisao" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header" style={{ background: 'var(--cor-primaria)', color: 'white' }}>
              <h5 className="modal-title"><i className="bi bi-plus-lg"></i> Novo Flashcard</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              {/* Seleção e Adição de Matéria */}
              <div className="mb-3">
                <label className="form-label fw-bold"> Matéria</label>
                <div className="d-flex gap-2">
                  <select 
                    className="form-select" 
                    value={novoFlashcard.materiaId} 
                    onChange={(e) => {
                      if (e.target.value === '__NOVA__') {
                        setMostrarNovaMateria(true);
                        setNovoFlashcard({ ...novoFlashcard, materiaId: '' });
                      } else {
                        setNovoFlashcard({ ...novoFlashcard, materiaId: e.target.value });
                      }
                    }}
                  >
                    <option value="">Selecione uma matéria</option>
                    {materias.map(m => (
                      <option key={m.id_materia || m.id} value={m.id_materia || m.id}>
                        {m.nome}
                      </option>
                    ))}
                    <option value="__NOVA__">+ Nova matéria...</option>
                  </select>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    title="Adicionar nova matéria"
                    onClick={() => setMostrarNovaMateria(!mostrarNovaMateria)}
                  >
                    <i className="bi bi-plus-lg"></i>
                  </button>
                </div>

                {/* Formulário inline para nova matéria */}
                {mostrarNovaMateria && (
                  <div className="card p-3 mt-2 border-primary-subtle" style={{ backgroundColor: '#f8f9fa' }}>
                    <h6 className="fw-bold mb-2 text-primary">Adicionar Nova Matéria</h6>
                    <div className="d-flex gap-2 mb-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nome da matéria (ex: História)"
                        value={novaMateriaNome}
                        onChange={(e) => setNovaMateriaNome(e.target.value)}
                        autoFocus
                      />
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={novaMateriaCor}
                        onChange={(e) => setNovaMateriaCor(e.target.value)}
                        title="Escolha a cor da matéria"
                        style={{ minWidth: '45px' }}
                      />
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setMostrarNovaMateria(false);
                          setNovaMateriaNome('');
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        style={{ background: 'var(--cor-primaria)', borderColor: 'var(--cor-primaria)' }}
                        onClick={handleCriarMateria}
                        disabled={salvandoMateria}
                      >
                        {salvandoMateria ? 'Salvando...' : 'Salvar Matéria'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold"> Tema / Tópico</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ex: Geometria Analítica, Citologia, etc." 
                  value={novoFlashcard.tema} 
                  onChange={(e) => setNovoFlashcard({...novoFlashcard, tema: e.target.value})} 
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold"> Pergunta (Frente do Card)</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="Digite a pergunta ou conceito a lembrar..." 
                  value={novoFlashcard.pergunta} 
                  onChange={(e) => setNovoFlashcard({...novoFlashcard, pergunta: e.target.value})} 
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold"> Resposta (Verso do Card)</label>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  placeholder="Digite a resposta ou explicação detalhada..." 
                  value={novoFlashcard.resposta} 
                  onChange={(e) => setNovoFlashcard({...novoFlashcard, resposta: e.target.value})} 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={salvarFlashcard} style={{ background: 'var(--cor-primaria)', border: 'none' }}>Salvar Flashcard</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modo Revisão */}
      {modoFocoAberto && cardAtual && (
        <div className="revisao-foco-container">
          <div className="foco-card">
            <div className="foco-header">
              <div>
                <span className="foco-materia">{revisaoInfo.deckNome}</span>
                <span className="foco-tema"> › {revisaoInfo.subdeckNome}</span>
              </div>
              <button className="foco-fechar" onClick={fecharModoFoco}>✕</button>
            </div>
            <div className="foco-pergunta">{cardAtual.pergunta}</div>
            {respostaVisivel && <div className="foco-resposta">{cardAtual.resposta}</div>}
            <div className="foco-botoes">
              {!respostaVisivel ? (
                <button className="btn-mostrar-resposta" onClick={() => setRespostaVisivel(true)}>Mostrar Resposta</button>
              ) : (
                <div className="botoes-resposta">
                  <button className="btn-errei" onClick={() => responderFlashcard('errei')}>❌ Errei</button>
                  <button className="btn-acertei" onClick={() => responderFlashcard('acertei')}>✅ Acertei</button>
                </div>
              )}
            </div>
            <div className="foco-progresso">
              <span>{indiceAtualFoco + 1} / {revisoesEmAndamento.length}</span>
              <div className="progresso-barra"><div className="progresso-fill" style={{ width: `${((indiceAtualFoco + 1) / revisoesEmAndamento.length) * 100}%` }}></div></div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
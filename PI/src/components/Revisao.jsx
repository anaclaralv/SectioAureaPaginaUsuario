import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
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
  const [novoFlashcard, setNovoFlashcard] = useState({
    materiaId: '',
    tema: '',
    pergunta: '',
    resposta: ''
  });

  const hoje = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    const flashcardsSalvos = localStorage.getItem('flashcards_sistema');
    if (flashcardsSalvos) {
      try {
        setFlashcards(JSON.parse(flashcardsSalvos));
      } catch(e) {}
    }

    const materiasSalvas = localStorage.getItem('materias');
    if (materiasSalvas) {
      try {
        setMaterias(JSON.parse(materiasSalvas));
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('flashcards_sistema', JSON.stringify(flashcards));
  }, [flashcards]);

  const organizarBaralhos = useCallback(() => {
    const decks = [];
    
    materias.forEach(materia => {
      const cardsDaMateria = flashcards.filter(f => f.materiaId === String(materia.id));
      
      const temas = {};
      cardsDaMateria.forEach(card => {
        const tema = card.tema || 'Geral';
        if (!temas[tema]) temas[tema] = [];
        temas[tema].push(card);
      });
      
      const hojeData = hoje();
      let novo = 0, aprender = 0, revisar = 0;
      
      cardsDaMateria.forEach(card => {
        if (card.nivel === 0) novo++;
        else if (card.dataProxima <= hojeData) revisar++;
        else if (card.dataProxima > hojeData) aprender++;
      });
      
      decks.push({
        id: materia.id,
        nome: materia.nome,
        cor: materia.cor || 'var(--cor-primaria)',
        novo, aprender, revisar,
        total: cardsDaMateria.length,
        subtemas: Object.entries(temas).map(([nomeTema, cards]) => ({
          nome: nomeTema,
          cards,
          novo: cards.filter(c => c.nivel === 0).length,
          aprender: cards.filter(c => c.dataProxima > hojeData && c.nivel > 0).length,
          revisar: cards.filter(c => c.dataProxima <= hojeData && c.nivel > 0).length
        }))
      });
    });
    
    return decks.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [materias, flashcards]);

  const toggleDeck = (deckId) => {
    setExpandedDecks(prev => ({ ...prev, [deckId]: !prev[deckId] }));
  };

  const iniciarRevisao = (cards, deckNome, subdeckNome = null) => {
    if (!cards || cards.length === 0) {
      Swal.fire({
        icon: 'info',
        title: ' Nada para revisar!',
        text: 'Crie alguns flashcards primeiro!',
        confirmButtonColor: 'var(--cor-primaria)'
      });
      return;
    }
    
    const embaralhados = [...cards].sort(() => Math.random() - 0.5);
    setRevisoesEmAndamento(embaralhados);
    setIndiceAtualFoco(0);
    setRespostaVisivel(false);
    setModoFocoAberto(true);
    setRevisaoInfo({
      deckNome,
      subdeckNome: subdeckNome || 'Todos os cards',
      totalCards: cards.length
    });
  };

  const responderFlashcard = (resultado) => {
    if (!cardAtual) return;
    
    const acertou = resultado === 'acertei';
    const intervalos = {0:1, 1:3, 2:7, 3:14, 4:30};
    const novoNivel = acertou ? Math.min(cardAtual.nivel + 1, 4) : Math.max(cardAtual.nivel - 1, 0);
    const dias = intervalos[novoNivel];
    const novaData = new Date();
    novaData.setDate(novaData.getDate() + dias);
    
    setFlashcards(prev => prev.map(f => {
      if (f.id === cardAtual.id) {
        return {
          ...f,
          nivel: novoNivel,
          dataProxima: novaData.toISOString().split('T')[0],
          acertos: (f.acertos || 0) + (acertou ? 1 : 0),
          erros: (f.erros || 0) + (acertou ? 0 : 1)
        };
      }
      return f;
    }));
    
    if (indiceAtualFoco + 1 >= revisoesEmAndamento.length) {
      setModoFocoAberto(false);
      Swal.fire({
        icon: 'success',
        title: ' Revisão concluída!',
        text: `Você revisou ${revisoesEmAndamento.length} cards!`,
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

  const abrirModalFlashcard = () => {
    const modalElement = document.getElementById('modalRevisao');
    if (!modalElement) return;
    const modal = new window.bootstrap.Modal(modalElement);
    setNovoFlashcard({ materiaId: '', tema: '', pergunta: '', resposta: '' });
    modal.show();
  };

  const salvarFlashcard = () => {
    if (!novoFlashcard.materiaId) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Selecione uma matéria!', confirmButtonColor: 'var(--cor-primaria)' });
      return;
    }
    if (!novoFlashcard.pergunta || !novoFlashcard.resposta) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Preencha a pergunta e a resposta!', confirmButtonColor: 'var(--cor-primaria)' });
      return;
    }

    const materia = materias.find(m => String(m.id) === String(novoFlashcard.materiaId));
    
    const novo = {
      id: Date.now(),
      materiaId: String(novoFlashcard.materiaId),
      materiaNome: materia ? materia.nome : 'Sem matéria',
      tema: novoFlashcard.tema || 'Geral',
      pergunta: novoFlashcard.pergunta,
      resposta: novoFlashcard.resposta,
      nivel: 0,
      dataProxima: hoje(),
      acertos: 0,
      erros: 0
    };
    
    setFlashcards(prev => [...prev, novo]);
    
    const modal = window.bootstrap.Modal.getInstance(document.getElementById('modalRevisao'));
    if (modal) modal.hide();
    
    Swal.fire({ icon: 'success', title: ' Flashcard criado!', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
  };

  return (
    <section id="revisaoSection">
      <div className="revisao-header">
        <div>
          <h1>Meus Baralhos</h1>
          <p className="revisao-subtitle">Organize seus flashcards por matéria e tema</p>
        </div>
        <button className="btn-add-revisao" onClick={abrirModalFlashcard}>
          <i className="bi bi-plus-lg"></i> Novo Flashcard
        </button>
      </div>

      {/* Botão de Revisão - Design elegante */}
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
            iniciarRevisao([...flashcards], " Revisão Geral", `${flashcards.length} cards`);
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
          Iniciar Revisão
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
            <tr><th>Baralho</th><th> Novo</th><th> Aprender</th><th> Revisar</th><th></th></tr>
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
                    <td><button className="btn-add-card-mini" onClick={(e) => { e.stopPropagation(); abrirModalFlashcard(); }}><i className="bi bi-plus"></i></button></td>
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
                      <td><button className="btn-add-card-mini" onClick={() => abrirModalFlashcard()}><i className="bi bi-plus"></i></button></td>
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
          <button className="btn-add-revisao" onClick={abrirModalFlashcard}>Criar meu primeiro flashcard</button>
        </div>
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
              <div className="mb-3">
                <label className="form-label fw-bold"> Matéria</label>
                <select className="form-select" value={novoFlashcard.materiaId} onChange={(e) => setNovoFlashcard({...novoFlashcard, materiaId: e.target.value})}>
                  <option value="">Selecione uma matéria</option>
                  {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold"> Tema</label>
                <input type="text" className="form-control" placeholder="Ex: Geometria Analítica" value={novoFlashcard.tema} onChange={(e) => setNovoFlashcard({...novoFlashcard, tema: e.target.value})} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold"> Pergunta</label>
                <textarea className="form-control" rows="3" placeholder="Digite a pergunta..." value={novoFlashcard.pergunta} onChange={(e) => setNovoFlashcard({...novoFlashcard, pergunta: e.target.value})} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold"> Resposta</label>
                <textarea className="form-control" rows="4" placeholder="Digite a resposta..." value={novoFlashcard.resposta} onChange={(e) => setNovoFlashcard({...novoFlashcard, resposta: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={salvarFlashcard} style={{ background: 'var(--cor-primaria)', border: 'none' }}>Salvar</button>
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
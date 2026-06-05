import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import './Revisao.css';

export default function Revisao() {
  const [flashcards, setFlashcards] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('meusCards');
  const [filtroMateria, setFiltroMateria] = useState('todas');
  const [revisoesEmAndamento, setRevisoesEmAndamento] = useState([]);
  const [indiceAtualFoco, setIndiceAtualFoco] = useState(0);
  const [modoFocoAberto, setModoFocoAberto] = useState(false);
  const [acordeonsAbertos, setAcordeonsAbertos] = useState({});
  const [novoFlashcard, setNovoFlashcard] = useState({
    materiaId: '',
    tema: '',
    pergunta: '',
    resposta: ''
  });

  // Carregar dados
  useEffect(() => {
    const flashcardsSalvos = localStorage.getItem('flashcards_sistema');
    if (flashcardsSalvos) {
      setFlashcards(JSON.parse(flashcardsSalvos));
    }

    const materiasSalvas = localStorage.getItem('materias');
    if (materiasSalvas) {
      setMaterias(JSON.parse(materiasSalvas));
    }
  }, []);

  // Salvar flashcards
  useEffect(() => {
    localStorage.setItem('flashcards_sistema', JSON.stringify(flashcards));
  }, [flashcards]);

  // Funções auxiliares
  const hoje = () => new Date().toISOString().split('T')[0];

  const formatarData = (dataStr) => {
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR');
  };

  // Estatísticas
  const getEstatisticas = useCallback(() => {
    const hojeData = hoje();
    const totalHoje = flashcards.filter(f => f.dataProxima === hojeData).length;
    const totalAtrasadas = flashcards.filter(f => f.dataProxima < hojeData).length;
    const totalConcluidas = flashcards.filter(f => f.nivel >= 4).length;
    const totalAcertos = flashcards.reduce((sum, f) => sum + (f.acertos || 0), 0);
    const totalErros = flashcards.reduce((sum, f) => sum + (f.erros || 0), 0);
    const taxaAcerto = totalAcertos + totalErros > 0 ? Math.round((totalAcertos / (totalAcertos + totalErros)) * 100) : 0;
    
    return { totalHoje, totalAtrasadas, totalConcluidas, taxaAcerto };
  }, [flashcards]);

  // Renderizar flashcards agrupados
  const renderizarFlashcardsAgrupados = useCallback(() => {
    let cardsFiltrados = [...flashcards];
    
    if (filtroMateria !== 'todas') {
      cardsFiltrados = cardsFiltrados.filter(f => f.materiaNome === filtroMateria);
    }

    if (cardsFiltrados.length === 0) {
      return <p className="vazio">Nenhum flashcard encontrado!</p>;
    }

    // Agrupar por matéria e tema
    const porMateria = {};
    cardsFiltrados.forEach(f => {
      if (!porMateria[f.materiaNome]) {
        porMateria[f.materiaNome] = { temas: {}, count: 0 };
      }
      if (!porMateria[f.materiaNome].temas[f.tema]) {
        porMateria[f.materiaNome].temas[f.tema] = [];
      }
      porMateria[f.materiaNome].temas[f.tema].push(f);
      porMateria[f.materiaNome].count++;
    });

    const hojeData = hoje();
    const ordenarCards = (cards) => {
      return [...cards].sort((a, b) => {
        const aAtrasado = a.dataProxima < hojeData;
        const bAtrasado = b.dataProxima < hojeData;
        if (aAtrasado && !bAtrasado) return -1;
        if (!aAtrasado && bAtrasado) return 1;
        return a.dataProxima.localeCompare(b.dataProxima);
      });
    };

    return (
      <div className="flashcards-acordeon">
        {Object.entries(porMateria).map(([materiaNome, materiaData]) => {
          const materiaId = materiaNome.replace(/\s/g, '_');
          const isAberto = acordeonsAbertos[materiaId] || false;
          
          return (
            <div key={materiaNome} className="materia-acordeon">
              <div className="materia-header" onClick={() => toggleAcordeon(materiaId)}>
                <div className="materia-titulo">
                  <i className="bi bi-journal-bookmark-fill"></i>
                  <h3>{materiaNome}</h3>
                  <span className="materia-badge-count">{materiaData.count}</span>
                </div>
                <span className={`materia-seta ${isAberto ? 'aberto' : ''}`}>{isAberto ? '▼' : '▶'}</span>
              </div>
              {isAberto && (
                <div className="materia-conteudo show">
                  {Object.entries(materiaData.temas).map(([tema, cards]) => (
                    <div key={tema} className="tema-grupo">
                      <div className="tema-header">
                        <i className="bi bi-folder2"></i>
                        <h4>{tema}</h4>
                        <span className="tema-badge-count">{cards.length}</span>
                      </div>
                      {ordenarCards(cards).map(card => {
                        const isAtrasada = card.dataProxima < hojeData;
                        const isHoje = card.dataProxima === hojeData;
                        const classeDestaque = isAtrasada ? 'atrasada' : (isHoje ? 'hoje' : '');
                        
                        return (
                          <div key={card.id} className={`card-flashcard ${classeDestaque}`}>
                            <div className="card-pergunta">{card.pergunta}</div>
                            <div className="card-data">📅 {formatarData(card.dataProxima)}</div>
                            <div className="card-acoes">
                              <button onClick={() => editarFlashcard(card)} title="Editar">
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button onClick={() => excluirFlashcard(card.id)} title="Excluir">
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }, [flashcards, filtroMateria, acordeonsAbertos]);

  const toggleAcordeon = (materiaId) => {
    setAcordeonsAbertos(prev => ({ ...prev, [materiaId]: !prev[materiaId] }));
  };

  // Adicionar/Editar Flashcard
  const abrirModalFlashcard = (flashcard = null) => {
    const modalElement = document.getElementById('modalRevisao');
    if (!modalElement) return;
    
    const modal = new window.bootstrap.Modal(modalElement);
    
    if (flashcard) {
      setNovoFlashcard({
        id: flashcard.id,
        materiaId: flashcard.materiaId,
        tema: flashcard.tema,
        pergunta: flashcard.pergunta,
        resposta: flashcard.resposta
      });
    } else {
      setNovoFlashcard({
        materiaId: '',
        tema: '',
        pergunta: '',
        resposta: ''
      });
    }
    
    modal.show();
  };

  const salvarFlashcard = () => {
    if (!novoFlashcard.materiaId) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Selecione uma matéria!', confirmButtonColor: '#9f042c' });
      return;
    }
    if (!novoFlashcard.pergunta || !novoFlashcard.resposta) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Preencha a pergunta e a resposta!', confirmButtonColor: '#9f042c' });
      return;
    }

    const materia = materias.find(m => m.id == novoFlashcard.materiaId);
    
    if (novoFlashcard.id) {
      // Editar
      setFlashcards(prev => prev.map(f => 
        f.id === novoFlashcard.id ? {
          ...f,
          materiaId: novoFlashcard.materiaId,
          materiaNome: materia ? materia.nome : 'Sem matéria',
          tema: novoFlashcard.tema || 'Geral',
          pergunta: novoFlashcard.pergunta,
          resposta: novoFlashcard.resposta
        } : f
      ));
    } else {
      // Novo
      const novo = {
        id: Date.now(),
        materiaId: novoFlashcard.materiaId,
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
    }

    const modal = window.bootstrap.Modal.getInstance(document.getElementById('modalRevisao'));
    if (modal) modal.hide();
    
    Swal.fire({
      icon: 'success',
      title: 'Flashcard salvo!',
      timer: 2000,
      showConfirmButton: false,
      position: 'top-end',
      toast: true
    });
  };

  const editarFlashcard = (flashcard) => {
    abrirModalFlashcard(flashcard);
  };

  const excluirFlashcard = (id) => {
    Swal.fire({
      title: 'Excluir flashcard?',
      text: 'Esta ação não pode ser desfeita!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then(result => {
      if (result.isConfirmed) {
        setFlashcards(prev => prev.filter(f => f.id !== id));
        Swal.fire({ icon: 'success', title: 'Excluído!', timer: 1500, showConfirmButton: false });
      }
    });
  };

  // Iniciar revisão
  const iniciarRevisao = () => {
    const hojeData = hoje();
    let cardsPendentes = flashcards.filter(f => f.dataProxima <= hojeData);
    
    if (filtroMateria !== 'todas') {
      cardsPendentes = cardsPendentes.filter(f => f.materiaNome === filtroMateria);
    }
    
    if (cardsPendentes.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Nada para revisar!',
        text: filtroMateria !== 'todas' ? 'Não há cards pendentes para esta matéria.' : 'Todos os cards foram revisados!',
        confirmButtonColor: '#9f042c'
      });
      return;
    }
    
    // Embaralhar
    const embaralhados = [...cardsPendentes].sort(() => Math.random() - 0.5);
    setRevisoesEmAndamento(embaralhados);
    setIndiceAtualFoco(0);
    setModoFocoAberto(true);
    
    Swal.fire({
      icon: 'success',
      title: 'Boa revisão!',
      text: `${cardsPendentes.length} cards para revisar.`,
      timer: 1500,
      showConfirmButton: false,
      position: 'top-end',
      toast: true
    });
  };

  const cardAtual = revisoesEmAndamento[indiceAtualFoco];
  const [respostaVisivel, setRespostaVisivel] = useState(false);

  const mostrarResposta = () => {
    setRespostaVisivel(true);
  };

  const responderFlashcard = (resultado) => {
    if (!cardAtual) return;
    
    setFlashcards(prev => prev.map(f => {
      if (f.id === cardAtual.id) {
        const novoNivel = resultado === 'acertei' ? Math.min(f.nivel + 1, 4) : Math.max(f.nivel - 1, 0);
        const intervalos = [1, 3, 7, 14, 30];
        const dias = intervalos[novoNivel] || 1;
        const novaData = new Date();
        novaData.setDate(novaData.getDate() + dias);
        
        return {
          ...f,
          nivel: novoNivel,
          dataProxima: novaData.toISOString().split('T')[0],
          acertos: (f.acertos || 0) + (resultado === 'acertei' ? 1 : 0),
          erros: (f.erros || 0) + (resultado === 'errei' ? 1 : 0)
        };
      }
      return f;
    }));
    
    if (indiceAtualFoco + 1 >= revisoesEmAndamento.length) {
      // Finalizar revisão
      setModoFocoAberto(false);
      setRespostaVisivel(false);
      Swal.fire({
        icon: 'success',
        title: '🎉 Revisão concluída!',
        text: 'Parabéns! Você revisou tudo por hoje.',
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

  const estatisticas = getEstatisticas();

  // Popular filtro de matérias
  const materiasUnicas = [...new Set(flashcards.map(f => f.materiaNome))];

  return (
    <section id="revisaoSection">
      {/* Cabeçalho */}
      <div className="revisao-header">
        <h1>Revisão Inteligente</h1>
        <button className="btn-add-revisao" onClick={() => abrirModalFlashcard()}>
          <i className="bi bi-plus-lg"></i> Novo Flashcard
        </button>
      </div>

      {/* Estatísticas Fixas */}
      <div className="revisao-stats-fixas">
        <div className="stat-box">
          <span>Hoje</span>
          <strong>{estatisticas.totalHoje}</strong>
        </div>
        <div className="stat-box">
          <span>Atrasadas</span>
          <strong>{estatisticas.totalAtrasadas}</strong>
        </div>
        <div className="stat-box">
          <span>Concluídas</span>
          <strong>{estatisticas.totalConcluidas}</strong>
        </div>
        <div className="stat-box">
          <span>Taxa Acerto</span>
          <strong>{estatisticas.taxaAcerto}%</strong>
        </div>
      </div>

      {/* Regras */}
      <div className="revisao-regras">
        💡 Acertei = próximo nível | Errei = revisar amanhã
      </div>

      {/* Abas */}
      <div className="revisao-abas">
        <button className={`aba-btn ${abaAtiva === 'meusCards' ? 'active' : ''}`} onClick={() => setAbaAtiva('meusCards')}>
          Meus Cards
        </button>
        <button className={`aba-btn ${abaAtiva === 'revisar' ? 'active' : ''}`} onClick={() => setAbaAtiva('revisar')}>
          Revisar
        </button>
      </div>

      {/* Filtro por Matéria */}
      <div className="revisao-filtro">
        <select className="filtro-materia-select" value={filtroMateria} onChange={(e) => setFiltroMateria(e.target.value)}>
          <option value="todas">Todas as matérias</option>
          {materiasUnicas.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Conteúdo Aba: Meus Cards */}
      {abaAtiva === 'meusCards' && (
        <div id="abaMeusCards" className="aba-conteudo">
          {renderizarFlashcardsAgrupados()}
        </div>
      )}

      {/* Conteúdo Aba: Revisar */}
      {abaAtiva === 'revisar' && (
        <div id="abaRevisar" className="aba-conteudo">
          <div className="revisar-centro" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <i className="bi bi-arrow-repeat" style={{ fontSize: '4rem', color: 'var(--cor-primaria)', display: 'block', marginBottom: '20px' }}></i>
            <p style={{ fontSize: '1.2rem', color: '#4b5563', marginBottom: '10px' }}>
              Você tem <strong style={{ color: 'var(--cor-primaria)', fontSize: '1.5rem' }}>{estatisticas.totalHoje + estatisticas.totalAtrasadas}</strong> cards para revisar!
            </p>
            <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '0.9rem' }}>
              A revisão espaçada ajuda a fixar o conteúdo na memória de longo prazo.
            </p>
            <button className="btn-iniciar-revisao" onClick={iniciarRevisao}>
              <i className="bi bi-play-fill"></i> Iniciar Revisão
            </button>
          </div>
        </div>
      )}

      {/* Modo Foco (Revisão) */}
      {modoFocoAberto && cardAtual && (
        <div id="modoFocoContainer" className="revisao-foco-container" style={{ display: 'flex' }}>
          <div className="foco-card">
            <div className="foco-header">
              <div>
                <span className="materia-badge" style={{ background: '#9f042c', color: 'white', padding: '5px 12px', borderRadius: '20px' }}>{cardAtual.materiaNome}</span>
                <span className="tema-badge" style={{ background: '#e5e7eb', color: '#374151', padding: '5px 12px', borderRadius: '20px', marginLeft: '8px' }}>{cardAtual.tema}</span>
              </div>
              <button className="foco-fechar" onClick={fecharModoFoco}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="foco-pergunta" id="focoPergunta">{cardAtual.pergunta}</div>
            {respostaVisivel && (
              <div className="foco-resposta" id="focoResposta">{cardAtual.resposta}</div>
            )}
            <div className="foco-botoes">
              {!respostaVisivel ? (
                <button className="btn-mostrar-resposta" onClick={mostrarResposta}>
                  <i className="bi bi-eye"></i> Mostrar Resposta
                </button>
              ) : (
                <div className="botoes-resposta" style={{ display: 'flex', gap: '15px' }}>
                  <button className="btn-errei" onClick={() => responderFlashcard('errei')} style={{ background: '#ef4444', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: '600' }}>❌ Errei</button>
                  <button className="btn-acertei" onClick={() => responderFlashcard('acertei')} style={{ background: '#22c55e', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: '600' }}>✅ Acertei</button>
                </div>
              )}
            </div>
            <div className="foco-progresso">
              <span id="focoContador">Card {indiceAtualFoco + 1} de {revisoesEmAndamento.length}</span>
              <div className="progresso-barra">
                <div id="focoProgressoBarra" className="progresso-fill" style={{ width: `${((indiceAtualFoco + 1) / revisoesEmAndamento.length) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Flashcard */}
      <div className="modal fade modal-flashcard" id="modalRevisao" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header" style={{ background: 'var(--cor-primaria)', color: 'white' }}>
              <h5 className="modal-title"><i className="bi bi-brain"></i> {novoFlashcard.id ? 'Editar Flashcard' : 'Novo Flashcard'}</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-bold"><i className="bi bi-book"></i> Matéria</label>
                <select className="form-select" value={novoFlashcard.materiaId} onChange={(e) => setNovoFlashcard({ ...novoFlashcard, materiaId: e.target.value })}>
                  <option value="">Selecione uma matéria</option>
                  {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold"><i className="bi bi-folder"></i> Tema</label>
                <input type="text" className="form-control" placeholder="Ex: Citologia, Funções..." value={novoFlashcard.tema} onChange={(e) => setNovoFlashcard({ ...novoFlashcard, tema: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold"><i className="bi bi-question-circle"></i> Pergunta</label>
                <textarea className="form-control" rows="2" placeholder="Digite a pergunta..." value={novoFlashcard.pergunta} onChange={(e) => setNovoFlashcard({ ...novoFlashcard, pergunta: e.target.value })}></textarea>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold"><i className="bi bi-check-circle"></i> Resposta</label>
                <textarea className="form-control" rows="3" placeholder="Digite a resposta..." value={novoFlashcard.resposta} onChange={(e) => setNovoFlashcard({ ...novoFlashcard, resposta: e.target.value })}></textarea>
              </div>
              <div className="alert alert-info" style={{ fontSize: '0.85rem' }}>
                <i className="bi bi-lightbulb"></i> Dica: Use perguntas objetivas para revisões mais eficientes!
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" className="btn btn-danger" onClick={salvarFlashcard}>
                <i className="bi bi-save"></i> Salvar Flashcard
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
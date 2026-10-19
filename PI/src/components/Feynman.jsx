import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { apiFetch } from '../api';
import './Feynman.css';

export default function Feynman() {
  const [sessoes, setSessoes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [materiaFiltro, setMateriaFiltro] = useState('todas');
  const [carregando, setCarregando] = useState(true);

  // Modo Galeria vs Estúdio
  const [modoEstudio, setModoEstudio] = useState(false);
  const [passoAtual, setPassoAtual] = useState(1);

  // Dados da Sessão Feynman Atual
  const [idSessaoAtual, setIdSessaoAtual] = useState(null);
  const [nomeConceito, setNomeConceito] = useState('');
  const [materiaId, setMateriaId] = useState('');
  const [anotacoes, setAnotacoes] = useState('');
  const [lacunasAnotacoes, setLacunasAnotacoes] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [duracaoSegundos, setDuracaoSegundos] = useState(0);

  // Critérios Feynman (Checklist)
  const [checkPalavrasSimples, setCheckPalavrasSimples] = useState(false);
  const [checkAnalogias, setCheckAnalogias] = useState(false);
  const [checkLacunas, setCheckLacunas] = useState(false);
  const [checkSimplificado, setCheckSimplificado] = useState(false);

  // Gravador de Voz (MediaRecorder)
  const [gravando, setGravando] = useState(false);
  const [tempoGravacao, setTempoGravacao] = useState(0);
  const mediaRecorderRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Nova Matéria Inline
  const [mostrarNovaMateria, setMostrarNovaMateria] = useState(false);
  const [novaMateriaNome, setNovaMateriaNome] = useState('');
  const [novaMateriaCor, setNovaMateriaCor] = useState('#9f042c');
  const [salvandoMateria, setSalvandoMateria] = useState(false);

  const formatColor = (cor) => {
    if (!cor) return '#9f042c';
    if (cor.startsWith('0x') || cor.startsWith('0X')) {
      return '#' + cor.slice(-6);
    }
    return cor;
  };

  // Carregar Matérias e Sessões
  const carregarMaterias = async () => {
    try {
      const res = await apiFetch('materias');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMaterias(data);
      }
    } catch (err) {
      console.error('Erro ao buscar matérias:', err);
    }
  };

  const carregarSessoes = async () => {
    setCarregando(true);
    try {
      const res = await apiFetch('feynman');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSessoes(data);
      }
    } catch (err) {
      console.error('Erro ao buscar sessões Feynman:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarMaterias();
    carregarSessoes();
    return () => {
      // Limpeza de streams de áudio
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const voltarParaMetodos = () => {
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'metodos' }));
  };

  // ==================== GRAVADOR DE ÁUDIO ====================

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioUrl(reader.result);
        };
      };

      mediaRecorder.start();
      setGravando(true);
      setTempoGravacao(0);

      timerIntervalRef.current = setInterval(() => {
        setTempoGravacao(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      Swal.fire({
        icon: 'error',
        title: 'Microfone não disponível',
        text: 'Permita o acesso ao microfone no seu navegador para gravar sua explicação.'
      });
    }
  };

  const pararGravacao = () => {
    if (mediaRecorderRef.current && gravando) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      clearInterval(timerIntervalRef.current);
      setGravando(false);
      setDuracaoSegundos(tempoGravacao);
    }
  };

  const formatTempo = (segundos) => {
    const min = Math.floor(segundos / 60).toString().padStart(2, '0');
    const sec = (segundos % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  // ==================== ESTÚDIO FEYNMAN ACTIONS ====================

  const abrirEstudioNovo = () => {
    setIdSessaoAtual(null);
    setNomeConceito('');
    setMateriaId(materias.length > 0 ? String(materias[0].id_materia || materias[0].id) : '');
    setAnotacoes('');
    setLacunasAnotacoes('');
    setAudioUrl('');
    setDuracaoSegundos(0);
    setCheckPalavrasSimples(false);
    setCheckAnalogias(false);
    setCheckLacunas(false);
    setCheckSimplificado(false);
    setPassoAtual(1);
    setModoEstudio(true);
  };

  const carregarSessaoParaEditar = (sessao) => {
    setIdSessaoAtual(sessao.id_gravacao);
    setNomeConceito(sessao.nome || '');
    setMateriaId(sessao.id_materia ? String(sessao.id_materia) : '');
    
    // Divide anotações e lacunas se houver separador
    const rawAnotacoes = sessao.anotacoes || '';
    if (rawAnotacoes.includes('--- LACUNAS A REVISAR ---')) {
      const parts = rawAnotacoes.split('--- LACUNAS A REVISAR ---');
      setAnotacoes(parts[0].trim());
      setLacunasAnotacoes(parts[1].trim());
    } else {
      setAnotacoes(rawAnotacoes);
      setLacunasAnotacoes('');
    }

    setAudioUrl(sessao.url || '');
    setDuracaoSegundos(sessao.duracao || 0);
    setCheckPalavrasSimples(Boolean(sessao.check_palavras_simples));
    setCheckAnalogias(Boolean(sessao.check_analogias));
    setCheckLacunas(Boolean(sessao.check_lacunas));
    setCheckSimplificado(Boolean(sessao.check_simplificado));
    setPassoAtual(1);
    setModoEstudio(true);
  };

  // Salvar no Banco
  const salvarSessao = async () => {
    if (!nomeConceito.trim()) {
      Swal.fire('Atenção', 'Informe o nome do conceito ou tema.', 'warning');
      setPassoAtual(1);
      return;
    }

    const fullAnotacoes = lacunasAnotacoes.trim()
      ? `${anotacoes.trim()}\n\n--- LACUNAS A REVISAR ---\n${lacunasAnotacoes.trim()}`
      : anotacoes.trim();

    const payload = {
      nome: nomeConceito.trim(),
      id_materia: materiaId ? parseInt(materiaId) : null,
      url: audioUrl,
      duracao: duracaoSegundos,
      anotacoes: fullAnotacoes,
      check_palavras_simples: checkPalavrasSimples ? 1 : 0,
      check_analogias: checkAnalogias ? 1 : 0,
      check_lacunas: checkLacunas ? 1 : 0,
      check_simplificado: checkSimplificado ? 1 : 0
    };

    try {
      let res;
      if (idSessaoAtual) {
        res = await apiFetch(`feynman/${idSessaoAtual}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch('feynman', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Sessão Feynman Salva!',
          text: 'Sua explicação e autoavaliação foram registradas.',
          timer: 1600,
          showConfirmButton: false
        });
        carregarSessoes();
        setModoEstudio(false);
      } else {
        Swal.fire('Erro', 'Não foi possível salvar a sessão Feynman.', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Erro', 'Falha na conexão com o servidor.', 'error');
    }
  };

  // Excluir Sessão
  const excluirSessao = async (id, nome) => {
    const confirm = await Swal.fire({
      title: 'Excluir Explicação?',
      text: `Deseja remover a sessão "${nome}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await apiFetch(`feynman/${id}`, { method: 'DELETE' });
        if (res.ok) {
          Swal.fire('Excluído!', 'A sessão Feynman foi removida.', 'success');
          carregarSessoes();
        }
      } catch (err) {
        Swal.fire('Erro', 'Falha ao excluir sessão.', 'error');
      }
    }
  };

  // Salvar Nova Matéria Inline
  const salvarNovaMateria = async () => {
    if (!novaMateriaNome.trim()) {
      Swal.fire('Atenção', 'Digite o nome da matéria.', 'warning');
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
        await carregarMaterias();
        if (data.id_materia || data.id) {
          setMateriaId(String(data.id_materia || data.id));
        }
        setMostrarNovaMateria(false);
        setNovaMateriaNome('');
        Swal.fire({
          icon: 'success',
          title: 'Matéria Criada!',
          timer: 1300,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Erro', 'Falha ao criar matéria.', 'error');
    } finally {
      setSalvandoMateria(false);
    }
  };

  // Cálculo de Domínio
  const criteriosAtendidos = [checkPalavrasSimples, checkAnalogias, checkLacunas, checkSimplificado].filter(Boolean).length;
  const porcentagemDominio = criteriosAtendidos * 25;

  const sessoesFiltradas = materiaFiltro === 'todas'
    ? sessoes
    : sessoes.filter(s => String(s.id_materia) === String(materiaFiltro));

  return (
    <div className="feynman-container">
      {/* ==================== VISTA 1: GALERIA FEYNMAN ==================== */}
      {!modoEstudio && (
        <>
          <div className="feynman-header">
            <div className="feynman-title-group">
              <h1>
                <i className="bi bi-mic-fill"></i> Técnica Feynman
              </h1>
              <p>Aprenda ensinando: explique conceitos difíceis em linguagem simples</p>
            </div>

            <div className="feynman-header-actions">
              <button className="btn-voltar-metodos" onClick={voltarParaMetodos}>
                <i className="bi bi-arrow-left"></i> Voltar para Métodos
              </button>
              <button className="btn-novo-feynman" onClick={abrirEstudioNovo}>
                <i className="bi bi-plus-lg"></i> Nova Sessão Feynman
              </button>
            </div>
          </div>

          <div className="feynman-quote-banner">
            <i className="bi bi-quote"></i>
            <span>
              "Se você não consegue explicar um conceito para uma criança de 10 anos, você ainda não o entendeu completamente."
              — <strong>Richard Feynman</strong>
            </span>
          </div>

          {/* Filtros por Matéria */}
          <div className="feynman-filters">
            <button
              className={`filtro-pilula ${materiaFiltro === 'todas' ? 'ativo' : ''}`}
              onClick={() => setMateriaFiltro('todas')}
            >
              <span>Todas as Matérias</span>
              <span className="badge-contagem">{sessoes.length}</span>
            </button>
            {materias.map(mat => {
              const qtd = sessoes.filter(s => String(s.id_materia) === String(mat.id_materia || mat.id)).length;
              const cor = formatColor(mat.cor);
              return (
                <button
                  key={mat.id_materia || mat.id}
                  className={`filtro-pilula ${String(materiaFiltro) === String(mat.id_materia || mat.id) ? 'ativo' : ''}`}
                  onClick={() => setMateriaFiltro(String(mat.id_materia || mat.id))}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: cor,
                      display: 'inline-block'
                    }}
                  />
                  <span>{mat.nome}</span>
                  <span className="badge-contagem">{qtd}</span>
                </button>
              );
            })}
          </div>

          {/* Grid de Sessões */}
          {carregando ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="mt-3 text-muted">Carregando suas sessões Feynman...</p>
            </div>
          ) : sessoesFiltradas.length === 0 ? (
            <div className="fluxo-empty">
              <i className="bi bi-mic"></i>
              <h3>Nenhuma explicação gravada</h3>
              <p>Escolha um tema que você está estudando, grave sua explicação e encontre as lacunas!</p>
              <button className="btn-novo-feynman" onClick={abrirEstudioNovo}>
                <i className="bi bi-plus-lg"></i> Iniciar Primeira Sessão
              </button>
            </div>
          ) : (
            <div className="feynman-grid">
              {sessoesFiltradas.map(sessao => {
                const matCor = formatColor(sessao.cor_materia);
                const score = [
                  sessao.check_palavras_simples,
                  sessao.check_analogias,
                  sessao.check_lacunas,
                  sessao.check_simplificado
                ].filter(Boolean).length;

                return (
                  <div
                    key={sessao.id_gravacao}
                    className="feynman-card"
                    onClick={() => carregarSessaoParaEditar(sessao)}
                  >
                    <div>
                      <div className="card-top-bar">
                        <span
                          className="badge-materia"
                          style={{
                            background: `${matCor}15`,
                            color: matCor,
                            border: `1px solid ${matCor}30`
                          }}
                        >
                          <i className="bi bi-bookmark-fill"></i>
                          {sessao.nome_materia || 'Geral'}
                        </span>

                        <span className={`feynman-score-pill ${score === 4 ? 'master' : 'learning'}`}>
                          <i className={score === 4 ? 'bi bi-award-fill' : 'bi bi-lightning-charge-fill'}></i>
                          {score}/4 critérios
                        </span>
                      </div>

                      <h3 style={{ marginTop: 8 }}>{sessao.nome}</h3>

                      {/* Badges de critérios atendidos */}
                      <div className="feynman-card-badges">
                        <span className={`badge-feynman-criterion ${sessao.check_palavras_simples ? 'active' : ''}`}>
                          <i className="bi bi-chat-heart"></i> Palavras Simples
                        </span>
                        <span className={`badge-feynman-criterion ${sessao.check_analogias ? 'active' : ''}`}>
                          <i className="bi bi-lightbulb"></i> Analogias
                        </span>
                        <span className={`badge-feynman-criterion ${sessao.check_lacunas ? 'active' : ''}`}>
                          <i className="bi bi-search"></i> Lacunas
                        </span>
                        <span className={`badge-feynman-criterion ${sessao.check_simplificado ? 'active' : ''}`}>
                          <i className="bi bi-check2-all"></i> Simplificado
                        </span>
                      </div>

                      {sessao.anotacoes && (
                        <p className="feynman-card-notes">
                          {sessao.anotacoes.replace('--- LACUNAS A REVISAR ---', '🔍 Lacunas:')}
                        </p>
                      )}

                      {/* Player de Áudio */}
                      {sessao.url && (
                        <div onClick={e => e.stopPropagation()} style={{ marginTop: 8 }}>
                          <audio controls src={sessao.url} style={{ width: '100%', height: 36 }} />
                        </div>
                      )}
                    </div>

                    <div className="fluxo-card-meta">
                      <span>
                        <i className="bi bi-clock"></i>{' '}
                        {sessao.duracao ? `${sessao.duracao}s` : 'Sem áudio'} •{' '}
                        {sessao.data ? new Date(sessao.data).toLocaleDateString('pt-BR') : ''}
                      </span>
                      <button
                        className="btn-icon-card delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          excluirSessao(sessao.id_gravacao, sessao.nome);
                        }}
                        title="Excluir sessão"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ==================== VISTA 2: ESTÚDIO FEYNMAN (OS 4 PASSOS) ==================== */}
      {modoEstudio && (
        <div className="feynman-studio">
          {/* Top Bar do Estúdio */}
          <div className="studio-top-bar">
            <div>
              <button
                className="btn-voltar-metodos"
                onClick={() => setModoEstudio(false)}
                title="Voltar para a galeria"
              >
                <i className="bi bi-arrow-left"></i> Galeria
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge bg-danger p-2" style={{ fontSize: '0.85rem' }}>
                Domínio: {porcentagemDominio}% ({criteriosAtendidos}/4)
              </span>
              <button
                className="btn btn-sm btn-danger text-white fw-bold px-3 py-2"
                onClick={salvarSessao}
              >
                <i className="bi bi-cloud-arrow-up-fill me-1"></i> Salvar Sessão
              </button>
            </div>
          </div>

          {/* Navegação dos 4 Passos */}
          <div className="steps-nav-bar">
            <div
              className={`step-nav-item ${passoAtual === 1 ? 'active' : ''}`}
              onClick={() => setPassoAtual(1)}
            >
              <span className="step-number-circle">1</span>
              <span>O Conceito</span>
            </div>

            <div
              className={`step-nav-item ${passoAtual === 2 ? 'active' : ''}`}
              onClick={() => setPassoAtual(2)}
            >
              <span className="step-number-circle">2</span>
              <span>Ensine & Grave</span>
            </div>

            <div
              className={`step-nav-item ${passoAtual === 3 ? 'active' : ''}`}
              onClick={() => setPassoAtual(3)}
            >
              <span className="step-number-circle">3</span>
              <span>Identifique Lacunas</span>
            </div>

            <div
              className={`step-nav-item ${passoAtual === 4 ? 'active' : ''}`}
              onClick={() => setPassoAtual(4)}
            >
              <span className="step-number-circle">4</span>
              <span>Revise & Domine</span>
            </div>
          </div>

          {/* Corpo do Passo Atual */}
          <div className="studio-content-body">
            {/* ===== PASSO 1: O CONCEITO ===== */}
            {passoAtual === 1 && (
              <div>
                <h3 className="fw-bold mb-2">Passo 1: Escolha o Conceito</h3>
                <p className="text-muted">
                  Defina claramente qual assunto, teoria ou problema você deseja dominar e ensinar.
                </p>

                <div className="mb-4 mt-3">
                  <label className="form-label fw-bold">Tema ou Conceito:</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Ex: Teorema de Pitágoras, Fotossíntese, Revolução Francesa..."
                    value={nomeConceito}
                    onChange={e => setNomeConceito(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold">Matéria Associada:</label>
                  <div className="d-flex align-items-center gap-2">
                    <select
                      className="form-select"
                      value={materiaId}
                      onChange={e => {
                        if (e.target.value === '__NOVA__') {
                          setMostrarNovaMateria(true);
                        } else {
                          setMateriaId(e.target.value);
                        }
                      }}
                    >
                      <option value="">Sem matéria / Geral</option>
                      {materias.map(m => (
                        <option key={m.id_materia || m.id} value={m.id_materia || m.id}>
                          {m.nome}
                        </option>
                      ))}
                      <option value="__NOVA__">+ Nova matéria...</option>
                    </select>
                  </div>
                </div>

                {mostrarNovaMateria && (
                  <div className="p-3 bg-light rounded border d-flex align-items-center gap-2 mb-4">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Nome da matéria..."
                      value={novaMateriaNome}
                      onChange={e => setNovaMateriaNome(e.target.value)}
                    />
                    <input
                      type="color"
                      className="form-control form-control-color form-control-sm"
                      value={novaMateriaCor}
                      onChange={e => setNovaMateriaCor(e.target.value)}
                    />
                    <button
                      className="btn btn-sm btn-danger fw-bold"
                      onClick={salvarNovaMateria}
                      disabled={salvandoMateria}
                    >
                      Criar
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setMostrarNovaMateria(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ===== PASSO 2: ENSINE & GRAVE ===== */}
            {passoAtual === 2 && (
              <div>
                <h3 className="fw-bold mb-2">Passo 2: Explique com Simplicidade</h3>
                <p className="text-muted">
                  Finja que está ensinando uma criança de 10 anos. Evite vocabulário difícil e use analogias práticas!
                </p>

                {/* Gravador de Voz */}
                <div className={`recorder-box ${gravando ? 'recording' : ''}`}>
                  <button
                    className={`btn-record-main ${gravando ? 'stop' : ''}`}
                    onClick={gravando ? pararGravacao : iniciarGravacao}
                    title={gravando ? 'Parar gravação' : 'Iniciar gravação de voz'}
                  >
                    <i className={gravando ? 'bi bi-stop-fill' : 'bi bi-mic-fill'}></i>
                  </button>

                  <div className={`recording-timer ${gravando ? 'live' : ''}`}>
                    {gravando ? formatTempo(tempoGravacao) : audioUrl ? `${formatTempo(duracaoSegundos)} gravados` : '00:00'}
                  </div>

                  <p className="text-muted small m-0">
                    {gravando
                      ? 'Gravando... Fale com suas próprias palavras e sem olhar para o livro!'
                      : audioUrl
                      ? 'Gravação concluída! Você pode ouvi-la abaixo ou gravar novamente.'
                      : 'Clique no microfone para gravar sua explicação em voz alta.'}
                  </p>

                  {audioUrl && !gravando && (
                    <div className="audio-preview-player">
                      <audio controls src={audioUrl} style={{ width: '100%' }} />
                    </div>
                  )}
                </div>

                {/* Roteiro e Anotações */}
                <div className="mt-4">
                  <label className="form-label fw-bold">
                    <i className="bi bi-pencil-fill text-danger me-1"></i>
                    Roteiro / Explicação Escrita & Analogias:
                  </label>
                  <textarea
                    rows={5}
                    className="form-control"
                    placeholder="Escreva como você explicaria esse conceito de forma simples... (Ex: 'Imagine que a corrente elétrica é como a água fluindo por um cano...')"
                    value={anotacoes}
                    onChange={e => setAnotacoes(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* ===== PASSO 3: IDENTIFIQUE LACUNAS ===== */}
            {passoAtual === 3 && (
              <div>
                <h3 className="fw-bold mb-2">Passo 3: Identificação de Lacunas</h3>
                <p className="text-muted">
                  Ouça sua gravação ou releia suas anotações com olhar crítico. Onde você hesitou ou usou termos complexos?
                </p>

                {/* Checklist dos 4 Critérios de Feynman */}
                <div className="feynman-checklist-grid">
                  <div
                    className={`feynman-check-card ${checkPalavrasSimples ? 'checked' : ''}`}
                    onClick={() => setCheckPalavrasSimples(prev => !prev)}
                  >
                    <div className="check-custom-circle">
                      <i className="bi bi-check-lg"></i>
                    </div>
                    <div className="check-card-info">
                      <h4>Palavras Simples</h4>
                      <p>Evitei termos técnicos rebuscados e expliquei com palavras do cotidiano.</p>
                    </div>
                  </div>

                  <div
                    className={`feynman-check-card ${checkAnalogias ? 'checked' : ''}`}
                    onClick={() => setCheckAnalogias(prev => !prev)}
                  >
                    <div className="check-custom-circle">
                      <i className="bi bi-check-lg"></i>
                    </div>
                    <div className="check-card-info">
                      <h4>Analogias Claras</h4>
                      <p>Criei comparações ou histórias que facilitam visualizar a ideia.</p>
                    </div>
                  </div>

                  <div
                    className={`feynman-check-card ${checkLacunas ? 'checked' : ''}`}
                    onClick={() => setCheckLacunas(prev => !prev)}
                  >
                    <div className="check-custom-circle">
                      <i className="bi bi-check-lg"></i>
                    </div>
                    <div className="check-card-info">
                      <h4>Lacunas Identificadas</h4>
                      <p>Percebi exatamente onde me perdi, gaguejei ou precisei consultar.</p>
                    </div>
                  </div>

                  <div
                    className={`feynman-check-card ${checkSimplificado ? 'checked' : ''}`}
                    onClick={() => setCheckSimplificado(prev => !prev)}
                  >
                    <div className="check-custom-circle">
                      <i className="bi bi-check-lg"></i>
                    </div>
                    <div className="check-card-info">
                      <h4>Simplificação Máxima</h4>
                      <p>Qualquer iniciante ou criança compreenderia a essência do conceito.</p>
                    </div>
                  </div>
                </div>

                {/* Caixa de Lacunas para Revisão */}
                <div className="mt-4">
                  <label className="form-label fw-bold text-danger">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i>
                    O que preciso revisar no material original?
                  </label>
                  <textarea
                    rows={4}
                    className="form-control"
                    placeholder="Anote suas lacunas: 'Preciso entender melhor a fórmula do cateto...', 'Não sei explicar de onde vem a energia...', etc."
                    value={lacunasAnotacoes}
                    onChange={e => setLacunasAnotacoes(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* ===== PASSO 4: REVISE & DOMINE ===== */}
            {passoAtual === 4 && (
              <div>
                <h3 className="fw-bold mb-2">Passo 4: Revise, Simplifique & Domine</h3>
                <p className="text-muted">
                  Veja seu progresso geral e consolide o aprendizado com o selo de domínio Feynman.
                </p>

                <div className="mastery-progress-box">
                  <div className="d-flex justify-content-between align-items-center">
                    <strong className="fs-5">Nível de Domínio do Conceito:</strong>
                    <span className="fs-4 fw-bold text-danger">{porcentagemDominio}%</span>
                  </div>
                  <div className="mastery-bar-container">
                    <div className="mastery-bar-fill" style={{ width: `${porcentagemDominio}%` }}></div>
                  </div>
                  <p className="small text-muted mt-2 mb-0">
                    {criteriosAtendidos === 4
                      ? '🏆 Excelente! Você atingiu todos os 4 critérios de Richard Feynman. O conceito está consolidado!'
                      : `Você atingiu ${criteriosAtendidos} de 4 critérios. Revise o material original nas lacunas identificadas e tente simplificar ainda mais.`}
                  </p>
                </div>

                <div className="card p-3 mb-4 bg-light border-0">
                  <h5 className="fw-bold text-dark">Resumo da sua Sessão:</h5>
                  <p className="mb-1"><strong>Tema:</strong> {nomeConceito || 'Não informado'}</p>
                  <p className="mb-1"><strong>Áudio:</strong> {duracaoSegundos ? `${duracaoSegundos} segundos de gravação` : 'Sem gravação de áudio'}</p>
                  <p className="mb-1"><strong>Analogias e Roteiro:</strong> {anotacoes ? `${anotacoes.slice(0, 120)}...` : 'Vazio'}</p>
                  {lacunasAnotacoes && (
                    <p className="mb-0 text-danger"><strong>Lacunas a Revisar:</strong> {lacunasAnotacoes}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navegação de Rodapé (Avançar / Voltar) */}
          <div className="studio-footer-nav">
            <button
              className="btn btn-outline-secondary"
              disabled={passoAtual === 1}
              onClick={() => setPassoAtual(prev => Math.max(1, prev - 1))}
            >
              <i className="bi bi-chevron-left"></i> Passo Anterior
            </button>

            {passoAtual < 4 ? (
              <button
                className="btn btn-danger px-4"
                onClick={() => setPassoAtual(prev => Math.min(4, prev + 1))}
              >
                Próximo Passo <i className="bi bi-chevron-right"></i>
              </button>
            ) : (
              <button className="btn btn-success px-4 fw-bold" onClick={salvarSessao}>
                <i className="bi bi-check2-circle me-1"></i> Concluir & Salvar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

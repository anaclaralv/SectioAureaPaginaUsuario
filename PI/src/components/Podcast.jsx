import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { apiFetch } from '../api';
import './Podcast.css';

export default function Podcast() {
  // Lista de episódios de podcast e matérias
  const [episodios, setEpisodios] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Filtros da Galeria
  const [filtroMateria, setFiltroMateria] = useState('todas');
  const [termoBusca, setTermoBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState('recentes');

  // Modos de exibição: 'dashboard' ou 'estudio'
  const [modo, setModo] = useState('dashboard');
  const [episodioEditandoId, setEpisodioEditandoId] = useState(null);

  // Estados do Episódio no Estúdio
  const [titulo, setTitulo] = useState('');
  const [materiaId, setMateriaId] = useState('');
  const [roteiro, setRoteiro] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [duracaoSegundos, setDuracaoSegundos] = useState(0);

  // Estados do Gravador de Microfone
  const [gravando, setGravando] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [tempoGravacao, setTempoGravacao] = useState(0);

  // Nova Matéria Inline
  const [mostrarNovaMateria, setMostrarNovaMateria] = useState(false);
  const [novaMateriaNome, setNovaMateriaNome] = useState('');
  const [novaMateriaCor, setNovaMateriaCor] = useState('#9f042c');
  const [salvandoMateria, setSalvandoMateria] = useState(false);

  // Refs de gravação
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const textareaRef = useRef(null);

  const formatColor = (cor) => {
    if (!cor) return '#9f042c';
    if (cor.startsWith('0x') || cor.startsWith('0X')) {
      return '#' + cor.slice(-6);
    }
    return cor;
  };

  const formatTempo = (segundos) => {
    const s = parseInt(segundos, 10) || 0;
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  // ==================== CARREGAMENTO DE DADOS ====================

  const carregarMaterias = useCallback(async () => {
    try {
      const res = await apiFetch('materias');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMaterias(data);
          localStorage.setItem('materias', JSON.stringify(data));
        }
      }
    } catch (e) {
      const salvos = localStorage.getItem('materias');
      if (salvos) {
        try { setMaterias(JSON.parse(salvos)); } catch (err) {}
      }
    }
  }, []);

  const carregarEpisodios = useCallback(async () => {
    setCarregando(true);
    // Tenta carregar do localStorage primeiro para feedback imediato
    const salvos = localStorage.getItem('podcasts_usuario');
    if (salvos) {
      try {
        const parsed = JSON.parse(salvos);
        if (Array.isArray(parsed)) setEpisodios(parsed);
      } catch (e) {}
    }

    try {
      const res = await apiFetch('podcasts');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEpisodios(data);
          localStorage.setItem('podcasts_usuario', JSON.stringify(data));
        }
      }
    } catch (err) {
      console.error('Erro ao buscar podcasts da API:', err);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarMaterias();
    carregarEpisodios();

    return () => {
      // Limpeza de microfone e timers
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [carregarMaterias, carregarEpisodios]);

  const voltarParaMetodos = () => {
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'metodos' }));
  };

  // ==================== GRAVAÇÃO DE ÁUDIO ====================

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          setAudioUrl(reader.result);
        };
      };

      mediaRecorder.start();
      setGravando(true);
      setPausado(false);
      setTempoGravacao(0);

      timerIntervalRef.current = setInterval(() => {
        setTempoGravacao(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      Swal.fire({
        icon: 'error',
        title: 'Microfone Bloqueado ou Não Encontrado',
        text: 'Por favor, conceda permissão de microfone no navegador para gravar seu episódio de podcast.'
      });
    }
  };

  const pausarGravacao = () => {
    if (mediaRecorderRef.current && gravando && !pausado) {
      mediaRecorderRef.current.pause();
      clearInterval(timerIntervalRef.current);
      setPausado(true);
    }
  };

  const retomarGravacao = () => {
    if (mediaRecorderRef.current && gravando && pausado) {
      mediaRecorderRef.current.resume();
      setPausado(false);
      timerIntervalRef.current = setInterval(() => {
        setTempoGravacao(prev => prev + 1);
      }, 1000);
    }
  };

  const pararGravacao = () => {
    if (mediaRecorderRef.current && gravando) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      clearInterval(timerIntervalRef.current);
      setGravando(false);
      setPausado(false);
      setDuracaoSegundos(tempoGravacao);
    }
  };

  const descartarAudio = () => {
    Swal.fire({
      title: 'Descartar áudio gravado?',
      text: 'O áudio gravado será removido para que você possa gravar novamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#9f042c',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, regravar',
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (res.isConfirmed) {
        setAudioUrl('');
        setDuracaoSegundos(0);
        setTempoGravacao(0);
      }
    });
  };

  // Inserir trechos rápidos no Roteiro
  const inserirNoRoteiro = (bloco) => {
    const separador = roteiro.trim() ? '\n\n' : '';
    setRoteiro(prev => prev + separador + bloco);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // ==================== CRIAÇÃO DE MATÉRIA INLINE ====================

  const handleCriarMateria = async () => {
    if (!novaMateriaNome.trim()) {
      Swal.fire('Nome Obrigatório', 'Informe o nome da matéria.', 'warning');
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
        const nova = {
          id_materia: data.id_materia || Date.now(),
          nome: novaMateriaNome.trim(),
          cor: novaMateriaCor
        };
        const listaAtualizada = [...materias, nova];
        setMaterias(listaAtualizada);
        setMateriaId(String(nova.id_materia));
        setNovaMateriaNome('');
        setMostrarNovaMateria(false);
        Swal.fire({
          icon: 'success',
          title: 'Matéria criada!',
          timer: 1200,
          showConfirmButton: false
        });
      } else {
        Swal.fire('Erro', 'Não foi possível cadastrar a matéria.', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Erro', 'Falha na comunicação com o servidor.', 'error');
    } finally {
      setSalvandoMateria(false);
    }
  };

  // ==================== AÇÕES DO ESTÚDIO ====================

  const abrirNovoEpisodio = () => {
    setEpisodioEditandoId(null);
    setTitulo('');
    setMateriaId(materias.length > 0 ? String(materias[0].id_materia || materias[0].id) : '');
    setRoteiro('');
    setAudioUrl('');
    setDuracaoSegundos(0);
    setTempoGravacao(0);
    setModo('estudio');
  };

  const abrirEpisodioParaEditar = (ep) => {
    setEpisodioEditandoId(ep.id_gravacao);
    setTitulo(ep.nome || '');
    setMateriaId(ep.id_materia ? String(ep.id_materia) : '');
    setRoteiro(ep.anotacoes || '');
    setAudioUrl(ep.url || '');
    setDuracaoSegundos(ep.duracao || 0);
    setTempoGravacao(ep.duracao || 0);
    setModo('estudio');
  };

  const salvarEpisodio = async () => {
    if (!titulo.trim()) {
      Swal.fire('Atenção', 'Dê um título ao episódio do seu Podcast.', 'warning');
      return;
    }

    if (gravando) {
      pararGravacao();
    }

    const payload = {
      nome: titulo.trim(),
      id_materia: materiaId ? parseInt(materiaId, 10) : null,
      anotacoes: roteiro.trim(),
      url: audioUrl,
      duracao: duracaoSegundos || tempoGravacao || 0,
      modo: 'podcast'
    };

    try {
      let res;
      if (episodioEditandoId) {
        res = await apiFetch(`podcasts/${episodioEditandoId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch('podcasts', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: episodioEditandoId ? 'Episódio Atualizado!' : 'Episódio Gravado!',
          text: 'Seu podcast está salvo e pronto para você ouvir e revisar.',
          timer: 1600,
          showConfirmButton: false
        });
        carregarEpisodios();
        setModo('dashboard');
      } else {
        // Fallback local se a API retornar erro
        const novoLocal = {
          id_gravacao: episodioEditandoId || Date.now(),
          ...payload,
          data: new Date().toISOString()
        };
        const filtrados = episodios.filter(e => e.id_gravacao !== novoLocal.id_gravacao);
        const atualizados = [novoLocal, ...filtrados];
        setEpisodios(atualizados);
        localStorage.setItem('podcasts_usuario', JSON.stringify(atualizados));

        Swal.fire({
          icon: 'success',
          title: 'Episódio Salvo Localmente!',
          text: 'Seu podcast foi guardado no seu navegador.',
          timer: 1600,
          showConfirmButton: false
        });
        setModo('dashboard');
      }
    } catch (err) {
      console.error('Erro ao salvar podcast:', err);
      Swal.fire('Erro', 'Não foi possível salvar o episódio.', 'error');
    }
  };

  const excluirEpisodio = (id, nomeEp) => {
    Swal.fire({
      title: 'Excluir Episódio?',
      text: `Tem certeza que deseja apagar "${nomeEp || 'este episódio'}"? Essa ação não pode ser desfeita.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiFetch(`podcasts/${id}`, { method: 'DELETE' });
        } catch (e) {}

        const atualizados = episodios.filter(e => e.id_gravacao !== id);
        setEpisodios(atualizados);
        localStorage.setItem('podcasts_usuario', JSON.stringify(atualizados));

        Swal.fire({
          icon: 'success',
          title: 'Excluído!',
          text: 'Episódio removido com sucesso.',
          timer: 1400,
          showConfirmButton: false
        });
      }
    });
  };

  // ==================== CÁLCULOS & FILTROS ====================

  const metricas = useMemo(() => {
    const total = episodios.length;
    const duracaoTotalSeg = episodios.reduce((acc, curr) => acc + (parseInt(curr.duracao, 10) || 0), 0);
    const materiasDistintas = new Set(episodios.map(e => e.id_materia).filter(Boolean)).size;

    const horas = Math.floor(duracaoTotalSeg / 3600);
    const minutos = Math.floor((duracaoTotalSeg % 3600) / 60);

    let tempoFormatado = '0 min';
    if (horas > 0) {
      tempoFormatado = `${horas}h ${minutos}m`;
    } else {
      tempoFormatado = `${minutos} min`;
    }

    return { total, tempoFormatado, materiasDistintas };
  }, [episodios]);

  const episodiosFiltrados = useMemo(() => {
    return episodios.filter(ep => {
      // Filtro matéria
      if (filtroMateria !== 'todas') {
        if (String(ep.id_materia) !== String(filtroMateria)) return false;
      }
      // Filtro busca
      if (termoBusca.trim()) {
        const termo = termoBusca.toLowerCase();
        const nomeMatch = (ep.nome || '').toLowerCase().includes(termo);
        const anotsMatch = (ep.anotacoes || '').toLowerCase().includes(termo);
        const matMatch = (ep.nome_materia || '').toLowerCase().includes(termo);
        if (!nomeMatch && !anotsMatch && !matMatch) return false;
      }
      return true;
    }).sort((a, b) => {
      if (ordenacao === 'recentes') {
        return new Date(b.data || 0) - new Date(a.data || 0);
      }
      if (ordenacao === 'antigos') {
        return new Date(a.data || 0) - new Date(b.data || 0);
      }
      if (ordenacao === 'duracao') {
        return (b.duracao || 0) - (a.duracao || 0);
      }
      return 0;
    });
  }, [episodios, filtroMateria, termoBusca, ordenacao]);

  // ==================== RENDERIZAÇÃO: ESTÚDIO ====================

  if (modo === 'estudio') {
    return (
      <div className="podcast-container fade-in">
        {/* Header do Estúdio */}
        <div className="podcast-studio-header">
          <div className="studio-header-left">
            <button
              className="btn-voltar-dashboard"
              onClick={() => {
                if (gravando) pararGravacao();
                setModo('dashboard');
              }}
            >
              <i className="bi bi-arrow-left"></i> Voltar aos Episódios
            </button>
            <div className="studio-titles">
              <h2>
                <i className="bi bi-broadcast-pin text-primary-accent"></i>
                {episodioEditandoId ? 'Editando Episódio' : 'Novo Episódio de Podcast'}
              </h2>
              <p>Estruture seu roteiro e grave áudio ensinando o conteúdo com clareza.</p>
            </div>
          </div>

          <div className="studio-header-actions">
            <button className="btn-salvar-podcast" onClick={salvarEpisodio}>
              <i className="bi bi-cloud-check-fill"></i> Salvar Episódio
            </button>
          </div>
        </div>

        {/* Layout do Estúdio */}
        <div className="podcast-studio-grid">
          {/* Coluna 1: Informações e Roteiro */}
          <div className="studio-card studio-script-card">
            <div className="studio-card-header">
              <h3><i className="bi bi-file-earmark-text-fill"></i> Roteiro & Informações</h3>
              <span className="badge-dica">Passo 1 & 2 do Método</span>
            </div>

            <div className="form-group-podcast">
              <label htmlFor="pod-titulo">Título do Episódio *</label>
              <input
                id="pod-titulo"
                type="text"
                className="input-podcast"
                placeholder="Ex: Ep. 01 - Revolução Francesa em 5 Minutos"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div className="form-group-podcast">
              <label htmlFor="pod-materia">Matéria / Disciplina</label>
              <div className="materia-select-wrapper">
                <select
                  id="pod-materia"
                  className="select-podcast"
                  value={materiaId}
                  onChange={(e) => setMateriaId(e.target.value)}
                >
                  <option value="">Geral / Sem matéria específica</option>
                  {materias.map(m => (
                    <option key={m.id_materia || m.id} value={m.id_materia || m.id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-nova-materia-inline"
                  onClick={() => setMostrarNovaMateria(!mostrarNovaMateria)}
                  title="Criar nova matéria"
                >
                  <i className={`bi ${mostrarNovaMateria ? 'bi-x' : 'bi-plus-lg'}`}></i>
                  {mostrarNovaMateria ? 'Fechar' : 'Nova'}
                </button>
              </div>

              {mostrarNovaMateria && (
                <div className="nova-materia-box fade-in">
                  <input
                    type="text"
                    className="input-podcast"
                    placeholder="Nome da nova matéria..."
                    value={novaMateriaNome}
                    onChange={(e) => setNovaMateriaNome(e.target.value)}
                  />
                  <div className="cor-seletor-box">
                    <label>Cor:</label>
                    <input
                      type="color"
                      value={novaMateriaCor}
                      onChange={(e) => setNovaMateriaCor(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-confirmar-materia"
                      onClick={handleCriarMateria}
                      disabled={salvandoMateria}
                    >
                      {salvandoMateria ? 'Criando...' : 'Salvar Matéria'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Roteiro do Podcast */}
            <div className="form-group-podcast flex-grow-roteiro">
              <div className="roteiro-header-chips">
                <label htmlFor="pod-roteiro">Roteiro / Notas de Gravação</label>
                <div className="chips-container">
                  <button
                    type="button"
                    className="chip-tag"
                    onClick={() => inserirNoRoteiro('🎙️ [Introdução]: Apresente o tema de forma rápida e instigante. Diga por que isso cai na prova ou é útil.')}
                  >
                    + 🎙️ Introdução
                  </button>
                  <button
                    type="button"
                    className="chip-tag"
                    onClick={() => inserirNoRoteiro('📌 [Ponto Principal]: Explique o conceito chave sem jargões desnecessários.')}
                  >
                    + 📌 Ponto Principal
                  </button>
                  <button
                    type="button"
                    className="chip-tag"
                    onClick={() => inserirNoRoteiro('🔍 [Exemplo Prático]: Uma analogia ou caso do cotidiano para fixar na memória.')}
                  >
                    + 🔍 Exemplo Real
                  </button>
                  <button
                    type="button"
                    className="chip-tag"
                    onClick={() => inserirNoRoteiro('💡 [Conclusão & Takeaway]: Resuma o episódio em 2 frases para gravação de memória.')}
                  >
                    + 💡 Conclusão
                  </button>
                </div>
              </div>

              <textarea
                id="pod-roteiro"
                ref={textareaRef}
                className="textarea-roteiro"
                placeholder="Escreva aqui os pontos que você vai falar no microfone... Use os botões acima para estruturar seu episódio!"
                value={roteiro}
                onChange={(e) => setRoteiro(e.target.value)}
              />
              <span className="caracteres-info">{roteiro.length} caracteres digitados</span>
            </div>
          </div>

          {/* Coluna 2: Microfone e Gravador */}
          <div className="studio-card studio-mic-card">
            <div className="studio-card-header">
              <h3><i className="bi bi-mic-fill"></i> Gravador do Episódio</h3>
              <span className="badge-dica">Passo 3 & 4 do Método</span>
            </div>

            <div className="gravador-box">
              {/* Círculo do Microfone com Animação */}
              <div className={`mic-circle ${gravando ? 'gravando-pulsar' : ''} ${audioUrl ? 'audio-pronto' : ''}`}>
                <i className={`bi ${gravando ? 'bi-mic-fill' : audioUrl ? 'bi-check-lg' : 'bi-mic'}`}></i>
              </div>

              {/* Status e Live Timer */}
              <div className="gravador-timer">
                {gravando ? formatTempo(tempoGravacao) : audioUrl ? formatTempo(duracaoSegundos || tempoGravacao) : '00:00'}
              </div>

              <p className="gravador-status-text">
                {gravando && !pausado && '🎙️ Gravando áudio em alta fidelidade...'}
                {gravando && pausado && '⏸️ Gravação pausada.'}
                {!gravando && audioUrl && '✅ Áudio gravado e pronto para reprodução!'}
                {!gravando && !audioUrl && 'Pressione Iniciar Gravação para começar seu episódio.'}
              </p>

              {/* Ondas Sonoras Animadas */}
              {gravando && !pausado && (
                <div className="soundwave-bars">
                  <span className="bar bar-1"></span>
                  <span className="bar bar-2"></span>
                  <span className="bar bar-3"></span>
                  <span className="bar bar-4"></span>
                  <span className="bar bar-5"></span>
                  <span className="bar bar-6"></span>
                  <span className="bar bar-7"></span>
                  <span className="bar bar-8"></span>
                </div>
              )}

              {/* Controles de Gravação */}
              <div className="gravador-botoes-container">
                {!gravando && !audioUrl && (
                  <button className="btn-mic-action btn-iniciar-rec" onClick={iniciarGravacao}>
                    <i className="bi bi-record-circle-fill"></i> Iniciar Gravação
                  </button>
                )}

                {gravando && (
                  <div className="grupo-botoes-gravando">
                    {!pausado ? (
                      <button className="btn-mic-action btn-pausar-rec" onClick={pausarGravacao}>
                        <i className="bi bi-pause-fill"></i> Pausar
                      </button>
                    ) : (
                      <button className="btn-mic-action btn-retomar-rec" onClick={retomarGravacao}>
                        <i className="bi bi-play-fill"></i> Retomar
                      </button>
                    )}
                    <button className="btn-mic-action btn-parar-rec" onClick={pararGravacao}>
                      <i className="bi bi-stop-circle-fill"></i> Finalizar Gravação
                    </button>
                  </div>
                )}

                {!gravando && audioUrl && (
                  <div className="player-preview-wrapper">
                    <audio controls src={audioUrl} className="audio-player-custom" />
                    <button className="btn-descartar-audio" onClick={descartarAudio} title="Gravar novamente">
                      <i className="bi bi-arrow-counterclockwise"></i> Regravar Episódio
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Banner de Dicas de Áudio */}
            <div className="dicas-podcast-card">
              <h4><i className="bi bi-headphones"></i> Dicas para um Podcast Impecável</h4>
              <ul>
                <li><strong>Fale como um apresentador:</strong> Explique para alguém imaginário, com tom leve e descontraído.</li>
                <li><strong>Evite ler o roteiro como robô:</strong> Olhe os tópicos e fale com suas próprias palavras.</li>
                <li><strong>Ouça depois:</strong> Identifique se você hesitou em algum ponto — ali está uma lacuna para reforçar!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDERIZAÇÃO: DASHBOARD / GALERIA ====================

  return (
    <div className="podcast-container fade-in">
      {/* Header Geral */}
      <div className="podcast-header">
        <div className="podcast-title-group">
          <h1>
            <i className="bi bi-mic-fill text-primary-accent"></i>
            Gravação de Podcast
          </h1>
          <p>Grave áudios da sua própria explicação para enfatizar a memorização da matéria e criar seu acervo de estudos auditivos.</p>
        </div>

        <div className="podcast-header-actions">
          <button className="btn-voltar-metodos" onClick={voltarParaMetodos}>
            <i className="bi bi-arrow-left"></i> Voltar aos Métodos
          </button>
          <button className="btn-novo-podcast" onClick={abrirNovoEpisodio}>
            <i className="bi bi-plus-lg"></i> Gravar Novo Episódio
          </button>
        </div>
      </div>

      {/* Banner de Metodologia Auditiva */}
      <div className="podcast-quote-banner">
        <i className="bi bi-soundwave"></i>
        <div>
          <strong>Método Auditivo & Ensino Ativo:</strong>
          <span> "Ao gravar sua própria voz ensinando um tema, você ativa centros de linguagem, audição e síntese mental. Quando você escuta suas gravações nas horas vagas (no ônibus, na caminhada), a revisão se torna prazerosa e de alto rendimento."</span>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="podcast-metricas-grid">
        <div className="metrica-card">
          <div className="metrica-icon icon-episodes">
            <i className="bi bi-broadcast"></i>
          </div>
          <div className="metrica-info">
            <span className="metrica-valor">{metricas.total}</span>
            <span className="metrica-label">Episódios Gravados</span>
          </div>
        </div>

        <div className="metrica-card">
          <div className="metrica-icon icon-hours">
            <i className="bi bi-clock-history"></i>
          </div>
          <div className="metrica-info">
            <span className="metrica-valor">{metricas.tempoFormatado}</span>
            <span className="metrica-label">Tempo Total em Áudio</span>
          </div>
        </div>

        <div className="metrica-card">
          <div className="metrica-icon icon-subjects">
            <i className="bi bi-journals"></i>
          </div>
          <div className="metrica-info">
            <span className="metrica-valor">{metricas.materiasDistintas}</span>
            <span className="metrica-label">Matérias Abordadas</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtro e Busca */}
      <div className="podcast-toolbar">
        <div className="toolbar-busca">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Buscar episódios por título, roteiro ou matéria..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
          {termoBusca && (
            <button className="btn-limpar-busca" onClick={() => setTermoBusca('')}>
              <i className="bi bi-x-circle-fill"></i>
            </button>
          )}
        </div>

        <div className="toolbar-filtros">
          {/* Filtro por Matéria */}
          <select
            className="select-filtro-materia"
            value={filtroMateria}
            onChange={(e) => setFiltroMateria(e.target.value)}
          >
            <option value="todas">📚 Todas as Matérias</option>
            {materias.map(m => (
              <option key={m.id_materia || m.id} value={m.id_materia || m.id}>
                {m.nome}
              </option>
            ))}
          </select>

          {/* Ordenação */}
          <select
            className="select-filtro-ordem"
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value)}
          >
            <option value="recentes">Mais recentes</option>
            <option value="antigos">Mais antigos</option>
            <option value="duracao">Maior duração</option>
          </select>
        </div>
      </div>

      {/* Grid de Episódios */}
      {carregando ? (
        <div className="loading-state-podcasts">
          <div className="spinner-border text-danger" role="status"></div>
          <span>Carregando seus episódios de podcast...</span>
        </div>
      ) : episodiosFiltrados.length === 0 ? (
        <div className="empty-state-podcasts">
          <div className="empty-icon-circle">
            <i className="bi bi-mic"></i>
          </div>
          <h3>Nenhum episódio encontrado</h3>
          <p>
            {episodios.length === 0
              ? 'Você ainda não gravou nenhum episódio de podcast. Clique no botão abaixo para começar a gravar suas explicações!'
              : 'Nenhum episódio corresponde aos filtros de busca selecionados.'}
          </p>
          {episodios.length === 0 ? (
            <button className="btn-novo-podcast mt-3" onClick={abrirNovoEpisodio}>
              <i className="bi bi-mic-fill"></i> Gravar Meu Primeiro Podcast
            </button>
          ) : (
            <button
              className="btn-limpar-filtros mt-2"
              onClick={() => {
                setFiltroMateria('todas');
                setTermoBusca('');
              }}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="podcast-cards-grid">
          {episodiosFiltrados.map((ep) => {
            const dataFmt = ep.data
              ? new Date(ep.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
              : 'Data não informada';

            return (
              <div key={ep.id_gravacao} className="podcast-card">
                <div className="podcast-card-top">
                  <div className="card-materia-tag" style={{ backgroundColor: formatColor(ep.cor_materia) }}>
                    <i className="bi bi-tag-fill"></i>
                    {ep.nome_materia || 'Geral'}
                  </div>
                  <span className="card-data"><i className="bi bi-calendar3"></i> {dataFmt}</span>
                </div>

                <h3 className="podcast-card-title">{ep.nome || 'Episódio sem título'}</h3>

                {/* Duração */}
                <div className="podcast-card-duracao">
                  <i className="bi bi-stopwatch"></i> Duração: <strong>{formatTempo(ep.duracao)}</strong>
                </div>

                {/* Player de Áudio Embutido */}
                {ep.url ? (
                  <div className="card-audio-player-box">
                    <audio controls src={ep.url} className="w-100 card-audio-player" />
                  </div>
                ) : (
                  <div className="card-sem-audio">
                    <i className="bi bi-mic-mute"></i> Áudio não gravado (apenas roteiro)
                  </div>
                )}

                {/* Prévia do Roteiro */}
                {ep.anotacoes && (
                  <div className="podcast-card-roteiro-preview">
                    <strong><i className="bi bi-card-text"></i> Notas / Roteiro:</strong>
                    <p>{ep.anotacoes}</p>
                  </div>
                )}

                {/* Rodapé do Card com Ações */}
                <div className="podcast-card-footer">
                  <button
                    className="btn-card-acao btn-editar-pod"
                    onClick={() => abrirEpisodioParaEditar(ep)}
                    title="Editar roteiro ou regravar áudio"
                  >
                    <i className="bi bi-pencil-square"></i> Editar / Estúdio
                  </button>

                  <button
                    className="btn-card-acao btn-excluir-pod"
                    onClick={() => excluirEpisodio(ep.id_gravacao, ep.nome)}
                    title="Excluir episódio"
                  >
                    <i className="bi bi-trash3-fill"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

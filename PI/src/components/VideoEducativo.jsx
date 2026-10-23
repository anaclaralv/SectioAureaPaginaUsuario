import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { apiFetch } from '../api';
import './VideoEducativo.css';

// Utilitário para extrair ID de URLs do YouTube (inclui formatos shorts, watch, share e embed)
export const extrairYouTubeId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
  const match = url.trim().match(regExp);
  return match ? match[1] : null;
};

// Sugestões de canais educativos para inspiração
const CANAIS_EDUCATIVOS = [
  { nome: 'Khan Academy Brasil', desc: 'Matemática, Ciências e Economia', cor: '#14b8a6' },
  { nome: 'Ciência Todo Dia', desc: 'Física, Astronomia e Tecnologia', cor: '#3b82f6' },
  { nome: 'Nerdologia', desc: 'História, Biologia e Cultura Científica', cor: '#ef4444' },
  { nome: 'Curso em Vídeo', desc: 'Programação, TI e Algoritmos', cor: '#8b5cf6' }
];

export default function VideoEducativo() {
  // Lista de vídeos e matérias
  const [videos, setVideos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroMateria, setFiltroMateria] = useState('todas');
  const [termoBusca, setTermoBusca] = useState('');

  // Modos de Visualização: 'dashboard' ou 'estudio'
  const [modo, setModo] = useState('dashboard');
  const [videoEditandoId, setVideoEditandoId] = useState(null);

  // Estados do Vídeo Atual no Estúdio
  const [urlInput, setUrlInput] = useState('');
  const [videoId, setVideoId] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [materiaNome, setMateriaNome] = useState('Geral');
  const [tema, setTema] = useState('');
  const [resumoTexto, setResumoTexto] = useState('');
  const [assistido, setAssistido] = useState(false);
  const [nota, setNota] = useState(0);

  // Estados de Gravação de Áudio
  const [gravando, setGravando] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [tempoGravacao, setTempoGravacao] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioDuracao, setAudioDuracao] = useState('00:00');
  const [audioBlob, setAudioBlob] = useState(null);

  // Aba ativa do bloco lateral no estúdio ('ambos', 'resumo' ou 'audio')
  const [abaCaderno, setAbaCaderno] = useState('ambos');
  const [quickUrl, setQuickUrl] = useState('');

  // Nova Matéria Inline
  const [mostrarNovaMateria, setMostrarNovaMateria] = useState(false);
  const [novaMateriaNome, setNovaMateriaNome] = useState('');

  // Refs de gravação
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const textareaRef = useRef(null);

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

  const carregarVideos = useCallback(async () => {
    setCarregando(true);
    // Cache local imediato
    const salvos = localStorage.getItem('videos_educativos_sistema');
    if (salvos) {
      try {
        const parsed = JSON.parse(salvos);
        if (Array.isArray(parsed)) setVideos(parsed);
      } catch (err) {}
    }

    try {
      const res = await apiFetch('videos');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setVideos(data);
          localStorage.setItem('videos_educativos_sistema', JSON.stringify(data));
        }
      }
    } catch (err) {
      console.error('Erro ao buscar vídeos da API:', err);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarMaterias();
    carregarVideos();

    return () => {
      // Limpeza de stream de gravação de áudio ao desmontar
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [carregarMaterias, carregarVideos]);

  const voltarParaMetodos = () => {
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'metodos' }));
  };

  // ==================== GRAVADOR DE ÁUDIO ====================

  const formatTempo = (segundos) => {
    const min = Math.floor(segundos / 60).toString().padStart(2, '0');
    const sec = (segundos % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);

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
        title: 'Microfone não acessível',
        text: 'Permita o acesso ao microfone nas configurações do navegador para gravar seu áudio de resumo.',
        confirmButtonColor: 'var(--cor-primaria)'
      });
    }
  };

  const pausarGravacao = () => {
    if (mediaRecorderRef.current && gravando) {
      if (pausado) {
        mediaRecorderRef.current.resume();
        setPausado(false);
        timerIntervalRef.current = setInterval(() => {
          setTempoGravacao(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setPausado(true);
        clearInterval(timerIntervalRef.current);
      }
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
      setPausado(false);
      setAudioDuracao(formatTempo(tempoGravacao));

      Swal.fire({
        icon: 'success',
        title: 'Áudio gravado!',
        text: `Resumo em áudio de ${formatTempo(tempoGravacao)} capturado com sucesso.`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  };

  const descartarAudio = () => {
    Swal.fire({
      title: 'Descartar áudio?',
      text: 'Você terá que regravar seu resumo se excluir este áudio.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, descartar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        setAudioUrl('');
        setAudioBlob(null);
        setAudioDuracao('00:00');
        setTempoGravacao(0);
      }
    });
  };

  // ==================== PROCESSAMENTO DE URL DO YOUTUBE ====================

  const carregarLinkYouTube = (urlParaCarregar) => {
    const url = urlParaCarregar || urlInput;
    const extraido = extrairYouTubeId(url);
    if (!extraido) {
      Swal.fire({
        icon: 'warning',
        title: 'Link inválido',
        text: 'Insira um link válido do YouTube (ex: https://www.youtube.com/watch?v=... ou https://youtu.be/...)',
        confirmButtonColor: 'var(--cor-primaria)'
      });
      return false;
    }

    setVideoId(extraido);
    setUrlInput(url.trim());
    if (!titulo.trim()) {
      setTitulo(`Estudo com Vídeo (${extraido})`);
    }
    return true;
  };

  // Inserir Marcadores Rápidos no Resumo
  const inserirMarcador = (marcador) => {
    setResumoTexto(prev => {
      const quebra = prev.length > 0 && !prev.endsWith('\n') ? '\n' : '';
      return `${prev}${quebra}${marcador} `;
    });
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Iniciar estudo rápido direto pelo link
  const handleIniciarEstudoRapido = (urlOpcional) => {
    const url = (typeof urlOpcional === 'string' ? urlOpcional : quickUrl).trim();
    if (!url) {
      Swal.fire({
        icon: 'info',
        title: 'Cole um link do YouTube',
        text: 'Insira a URL de uma videoaula para começar seu estudo.',
        confirmButtonColor: 'var(--cor-primaria)'
      });
      return;
    }

    const id = extrairYouTubeId(url);
    if (!id) {
      Swal.fire({
        icon: 'warning',
        title: 'Link inválido',
        text: 'Não foi possível reconhecer o link do YouTube. Cole um link como https://www.youtube.com/watch?v=... ou https://youtu.be/...',
        confirmButtonColor: 'var(--cor-primaria)'
      });
      return;
    }

    abrirEstudioNovo();
    setUrlInput(url);
    setVideoId(id);
    setTitulo(`Estudo com Vídeo (${id})`);
    setQuickUrl('');
    setAbaCaderno('ambos');
  };

  // ==================== ESTÚDIO: NOVO & EDIÇÃO ====================

  const abrirEstudioNovo = () => {
    setVideoEditandoId(null);
    setUrlInput('');
    setVideoId(null);
    setTitulo('');
    setMateriaNome(materias.length > 0 ? materias[0].nome : 'Geral');
    setTema('');
    setResumoTexto('');
    setAudioUrl('');
    setAudioBlob(null);
    setAudioDuracao('00:00');
    setTempoGravacao(0);
    setAssistido(false);
    setNota(0);
    setAbaCaderno('ambos');
    setModo('estudio');
  };

  const abrirEstudioEdicao = (v) => {
    setVideoEditandoId(v.id_video || v.id);
    setUrlInput(v.url || '');
    setVideoId(v.videoId || v.video_id || extrairYouTubeId(v.url));
    setTitulo(v.titulo || '');
    setMateriaNome(v.materia || 'Geral');
    setTema(v.tema || '');
    setResumoTexto(v.anotacoes || '');
    setAudioUrl(v.audioUrl || v.audio_url || '');
    setAudioDuracao(v.audioDuracao || v.audio_duracao || '00:00');
    setAudioBlob(null);
    setTempoGravacao(0);
    setAssistido(Boolean(v.assistido));
    setNota(v.nota || 0);
    setAbaCaderno('ambos');
    setModo('estudio');
  };

  // Criar Matéria Inline
  const handleCriarMateria = async () => {
    if (!novaMateriaNome.trim()) return;
    try {
      const res = await apiFetch('materias', {
        method: 'POST',
        body: JSON.stringify({ nome: novaMateriaNome.trim(), cor: '#9f042c' })
      });
      if (res.ok) {
        const nova = { id: Date.now(), nome: novaMateriaNome.trim(), cor: '#9f042c' };
        setMaterias(prev => [...prev, nova]);
        setMateriaNome(nova.nome);
        setNovaMateriaNome('');
        setMostrarNovaMateria(false);
      }
    } catch (e) {
      setMaterias(prev => [...prev, { id: Date.now(), nome: novaMateriaNome.trim(), cor: '#9f042c' }]);
      setMateriaNome(novaMateriaNome.trim());
      setNovaMateriaNome('');
      setMostrarNovaMateria(false);
    }
  };

  // ==================== SALVAMENTO DO ESTUDO ====================

  const salvarEstudo = async () => {
    let idFinal = videoId;
    if (!idFinal && urlInput.trim()) {
      idFinal = extrairYouTubeId(urlInput.trim());
      if (idFinal) setVideoId(idFinal);
    }

    if (!idFinal) {
      Swal.fire({
        icon: 'warning',
        title: 'Vídeo não inserido',
        text: 'Insira um link válido do YouTube antes de salvar.',
        confirmButtonColor: 'var(--cor-primaria)'
      });
      return;
    }

    const tituloFinal = titulo.trim() || `Vídeo ${idFinal}`;
    const thumbFinal = `https://img.youtube.com/vi/${idFinal}/hqdefault.jpg`;

    let finalAudioUrl = audioUrl;

    // Se temos um novo blob gravado nesta sessão, tenta fazer upload via multipart
    if (audioBlob) {
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, `audio_${videoId}.webm`);
        const resUpload = await apiFetch('videos/audio', {
          method: 'POST',
          body: formData
        });
        if (resUpload.ok) {
          const dataUpload = await resUpload.json();
          if (dataUpload.audio_url) {
            finalAudioUrl = dataUpload.audio_url;
          }
        }
      } catch (err) {
        console.warn('Upload de áudio via arquivo falhou, mantendo Data URL base64:', err);
      }
    }

    const payload = {
      titulo: tituloFinal,
      url: urlInput || `https://www.youtube.com/watch?v=${videoId}`,
      videoId: videoId,
      video_id: videoId,
      thumbnail: thumbFinal,
      materia: materiaNome || 'Geral',
      tema: tema.trim() || 'Geral',
      anotacoes: resumoTexto,
      audioUrl: finalAudioUrl,
      audio_url: finalAudioUrl,
      audioDuracao: audioDuracao,
      audio_duracao: audioDuracao,
      assistido: assistido ? 1 : 0,
      nota: nota
    };

    try {
      let idSalvo = videoEditandoId;
      if (videoEditandoId) {
        // Atualização via PUT
        await apiFetch(`videos/${videoEditandoId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        // Criação via POST
        const res = await apiFetch('videos', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.id_video) idSalvo = data.id_video;
        }
      }

      const objetoAtualizado = {
        ...payload,
        id_video: idSalvo || Date.now(),
        id: idSalvo || Date.now(),
        data_adicionado: new Date().toISOString()
      };

      setVideos(prev => {
        const filtrado = prev.filter(v => String(v.id_video || v.id) !== String(idSalvo));
        const lista = [objetoAtualizado, ...filtrado];
        localStorage.setItem('videos_educativos_sistema', JSON.stringify(lista));
        return lista;
      });

      Swal.fire({
        icon: 'success',
        title: 'Estudo salvo com sucesso!',
        text: 'Seu resumo escrito e áudio foram armazenados na sua biblioteca.',
        timer: 1600,
        showConfirmButton: false
      });

      setModo('dashboard');
    } catch (err) {
      console.error('Erro ao salvar vídeo:', err);
      // Fallback localstorage
      const novoId = videoEditandoId || Date.now();
      const objLocal = {
        ...payload,
        id_video: novoId,
        id: novoId,
        data_adicionado: new Date().toISOString()
      };
      setVideos(prev => {
        const filtrado = prev.filter(v => String(v.id_video || v.id) !== String(novoId));
        const lista = [objLocal, ...filtrado];
        localStorage.setItem('videos_educativos_sistema', JSON.stringify(lista));
        return lista;
      });

      Swal.fire({
        icon: 'success',
        title: 'Estudo salvo localmente!',
        timer: 1500,
        showConfirmButton: false
      });
      setModo('dashboard');
    }
  };

  // Excluir estudo
  const excluirVideo = (id, e) => {
    if (e) e.stopPropagation();
    Swal.fire({
      title: 'Excluir estudo com vídeo?',
      text: 'Esta ação removerá o vídeo, o resumo e o áudio gravado.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiFetch(`videos/${id}`, { method: 'DELETE' });
        } catch (err) {}

        setVideos(prev => {
          const lista = prev.filter(v => String(v.id_video || v.id) !== String(id));
          localStorage.setItem('videos_educativos_sistema', JSON.stringify(lista));
          return lista;
        });

        Swal.fire({
          icon: 'success',
          title: 'Excluído!',
          timer: 1200,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  };

  // ==================== MÉTRICAS E FILTROS ====================

  const videosFiltrados = useMemo(() => {
    return videos.filter(v => {
      const matchMateria = filtroMateria === 'todas' || (v.materia && v.materia.toLowerCase() === filtroMateria.toLowerCase());
      const termo = termoBusca.trim().toLowerCase();
      const matchBusca = !termo ||
        (v.titulo && v.titulo.toLowerCase().includes(termo)) ||
        (v.tema && v.tema.toLowerCase().includes(termo)) ||
        (v.anotacoes && v.anotacoes.toLowerCase().includes(termo));
      return matchMateria && matchBusca;
    });
  }, [videos, filtroMateria, termoBusca]);

  const metricas = useMemo(() => {
    const total = videos.length;
    const comResumo = videos.filter(v => v.anotacoes && v.anotacoes.trim().length > 0).length;
    const comAudio = videos.filter(v => (v.audioUrl && v.audioUrl.trim().length > 0) || (v.audio_url && v.audio_url.trim().length > 0)).length;
    const assistidos = videos.filter(v => v.assistido).length;
    return { total, comResumo, comAudio, assistidos };
  }, [videos]);

  const contagemPalavras = useMemo(() => {
    if (!resumoTexto.trim()) return { palavras: 0, caracteres: 0 };
    const palavras = resumoTexto.trim().split(/\s+/).length;
    const caracteres = resumoTexto.length;
    return { palavras, caracteres };
  }, [resumoTexto]);

  return (
    <section id="videoEducativoSection">
      <div className="video-educativo-container">

        {/* ====================================================================
            VISTA 1: DASHBOARD / REPOSITÓRIO DE VÍDEOS
            ==================================================================== */}
        {modo === 'dashboard' && (
          <>
            {/* Topo do Dashboard */}
            <div className="video-header-bar">
              <div>
                <button className="btn-voltar-metodos" onClick={voltarParaMetodos}>
                  <i className="bi bi-arrow-left"></i> Voltar para Métodos
                </button>
                <h1 className="video-header-title">
                  <i className="bi bi-youtube text-danger"></i> Estudo com Vídeos Educativos
                </h1>
                <p className="video-header-subtitle">
                  Cole links de videoaulas do YouTube, elabore resumos em tópicos e grave sua própria voz explicando o conteúdo.
                </p>
              </div>

              <div className="video-header-actions">
                <button className="btn-video-primary" onClick={abrirEstudioNovo}>
                  <i className="bi bi-plus-lg"></i> Novo Estudo com Vídeo
                </button>
              </div>
            </div>

            {/* Painel de Métricas */}
            <div className="video-metricas-grid">
              <div className="video-metric-card">
                <div className="video-metric-icon total">
                  <i className="bi bi-collection-play-fill"></i>
                </div>
                <div className="video-metric-info">
                  <span className="video-metric-num">{metricas.total}</span>
                  <span className="video-metric-label">Vídeos Estudados</span>
                </div>
              </div>

              <div className="video-metric-card">
                <div className="video-metric-icon resumo">
                  <i className="bi bi-card-text"></i>
                </div>
                <div className="video-metric-info">
                  <span className="video-metric-num">{metricas.comResumo}</span>
                  <span className="video-metric-label">Resumos Escritos</span>
                </div>
              </div>

              <div className="video-metric-card">
                <div className="video-metric-icon audio">
                  <i className="bi bi-mic-fill"></i>
                </div>
                <div className="video-metric-info">
                  <span className="video-metric-num">{metricas.comAudio}</span>
                  <span className="video-metric-label">Áudios Gravados</span>
                </div>
              </div>

              <div className="video-metric-card">
                <div className="video-metric-icon assistidos">
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <div className="video-metric-info">
                  <span className="video-metric-num">{metricas.assistidos}</span>
                  <span className="video-metric-label">Concluídos</span>
                </div>
              </div>
            </div>

            {/* Caixa Rápida: Cole e Comece Imediatamente */}
            <div className="video-quick-start-card">
              <div className="video-quick-start-info">
                <div className="video-quick-start-badge">
                  <i className="bi bi-lightning-charge-fill"></i> Início Rápido
                </div>
                <h3>Cole o link do YouTube e comece a estudar</h3>
                <p>Abra o player com tela de resumo e gravador de áudio em um clique.</p>
              </div>

              <div className="video-quick-start-form">
                <div className="video-quick-start-input-box">
                  <i className="bi bi-youtube text-danger"></i>
                  <input
                    type="text"
                    placeholder="Cole aqui o link do YouTube (ex: https://www.youtube.com/watch?v=...)"
                    value={quickUrl}
                    onChange={e => setQuickUrl(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleIniciarEstudoRapido();
                    }}
                  />
                  {quickUrl && (
                    <button type="button" className="btn-limpar-quick" onClick={() => setQuickUrl('')}>
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-video-primary"
                  onClick={handleIniciarEstudoRapido}
                >
                  <i className="bi bi-play-circle-fill"></i> Iniciar Estudo
                </button>
              </div>
            </div>

            {/* Barra de Filtros */}
            <div className="video-filtros-bar">
              <div className="video-search-box">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  placeholder="Pesquisar por título, matéria, resumo..."
                  value={termoBusca}
                  onChange={e => setTermoBusca(e.target.value)}
                />
                {termoBusca && (
                  <button onClick={() => setTermoBusca('')}><i className="bi bi-x"></i></button>
                )}
              </div>

              <div className="video-materia-select-wrapper">
                <select
                  value={filtroMateria}
                  onChange={e => setFiltroMateria(e.target.value)}
                >
                  <option value="todas">Todas as Matérias</option>
                  {materias.map(m => (
                    <option key={m.id_materia || m.id} value={m.nome}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Listagem / Cards */}
            {carregando ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                <div className="spinner-border text-danger" role="status"></div>
                <p style={{ marginTop: '12px' }}>Carregando seus vídeos educativos...</p>
              </div>
            ) : videos.length === 0 ? (
              <div className="video-empty-state">
                <i className="bi bi-youtube" style={{ fontSize: '3.8rem', color: '#ef4444' }}></i>
                <h3>Nenhum vídeo educativo cadastrado</h3>
                <p>Cole o link de uma videoaula do YouTube para começar seu estudo ativo com resumo e áudio explicativo.</p>
                <button className="btn-video-primary" onClick={abrirEstudioNovo}>
                  <i className="bi bi-play-circle-fill"></i> Iniciar Primeiro Estudo com Vídeo
                </button>

                <div className="video-sugestoes-box">
                  <h4><i className="bi bi-lightbulb-fill text-warning"></i> Canais Recomendados para Praticar:</h4>
                  <div className="video-sugestoes-grid">
                    {CANAIS_EDUCATIVOS.map((c, idx) => (
                      <div key={idx} className="video-sugestao-pill">
                        <strong style={{ color: c.cor }}>{c.nome}</strong>
                        <span>{c.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : videosFiltrados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                <i className="bi bi-funnel" style={{ fontSize: '2.5rem', color: '#94a3b8' }}></i>
                <p style={{ marginTop: '10px' }}>Nenhum vídeo corresponde aos filtros selecionados.</p>
              </div>
            ) : (
              <div className="video-cards-grid">
                {videosFiltrados.map(v => {
                  const vidId = v.videoId || v.video_id || extrairYouTubeId(v.url);
                  const thumb = v.thumbnail || (vidId ? `https://img.youtube.com/vi/${vidId}/hqdefault.jpg` : '');
                  const audioPresente = Boolean(v.audioUrl || v.audio_url);
                  const audioSrc = v.audioUrl || v.audio_url;

                  return (
                    <div key={v.id_video || v.id} className="video-card-item" onClick={() => abrirEstudioEdicao(v)}>
                      <div className="video-card-thumb-container">
                        {thumb ? (
                          <img src={thumb} alt={v.titulo} className="video-card-thumb-img" />
                        ) : (
                          <div className="video-card-thumb-placeholder">
                            <i className="bi bi-play-btn-fill"></i>
                          </div>
                        )}
                        <div className="video-card-play-overlay">
                          <i className="bi bi-play-circle-fill"></i>
                        </div>
                        {v.assistido && (
                          <span className="video-card-badge-assistido">
                            <i className="bi bi-check-circle-fill"></i> Concluído
                          </span>
                        )}
                      </div>

                      <div className="video-card-body">
                        <div className="video-card-meta">
                          <span className="video-card-badge-materia">
                            <i className="bi bi-book"></i> {v.materia || 'Geral'}
                          </span>
                          {v.tema && v.tema !== 'Geral' && (
                            <span className="video-card-badge-tema">
                              {v.tema}
                            </span>
                          )}
                        </div>

                        <h3 className="video-card-title">{v.titulo}</h3>

                        {v.anotacoes ? (
                          <p className="video-card-resumo-preview">
                            {v.anotacoes}
                          </p>
                        ) : (
                          <p className="video-card-resumo-vazio">
                            Nenhum resumo escrito registrado ainda.
                          </p>
                        )}

                        {/* Player de áudio no próprio card */}
                        {audioPresente && (
                          <div className="video-card-audio-preview" onClick={e => e.stopPropagation()}>
                            <div className="video-card-audio-header">
                              <span><i className="bi bi-mic-fill text-danger"></i> Resumo em Áudio</span>
                              <span className="video-card-audio-duracao">{v.audioDuracao || v.audio_duracao || '00:00'}</span>
                            </div>
                            <audio controls src={audioSrc} className="video-audio-player-mini" />
                          </div>
                        )}
                      </div>

                      <div className="video-card-footer" onClick={e => e.stopPropagation()}>
                        <button className="btn-video-card-estudar" onClick={() => abrirEstudioEdicao(v)}>
                          <i className="bi bi-pencil-square"></i> Revisar / Estudo
                        </button>
                        <button
                          className="btn-video-card-delete"
                          title="Excluir estudo"
                          onClick={(e) => excluirVideo(v.id_video || v.id, e)}
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

        {/* ====================================================================
            VISTA 2: ESTÚDIO DE ESTUDO ATIVO COM VÍDEO
            ==================================================================== */}
        {modo === 'estudio' && (
          <div className="video-estudio-wrapper">

            {/* Barra Superior do Estúdio */}
            <div className="video-estudio-topbar">
              <div className="video-estudio-topbar-left">
                <button className="btn-voltar-dashboard" onClick={() => setModo('dashboard')}>
                  <i className="bi bi-arrow-left"></i> Meus Vídeos
                </button>
                <div className="video-estudio-title-group">
                  <input
                    type="text"
                    className="video-estudio-title-input"
                    placeholder="Título do Estudo (Ex: Teoria da Relatividade, Genética Mendeliana...)"
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                  />
                  <div className="video-estudio-meta-row">
                    <span className="video-card-badge-materia">
                      <i className="bi bi-book"></i> {materiaNome}
                    </span>
                    {videoId && (
                      <span className="video-estudio-id-pill">
                        <i className="bi bi-youtube text-danger"></i> ID: {videoId}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="video-estudio-topbar-actions">
                <button
                  className={`btn-toggle-assistido ${assistido ? 'ativo' : ''}`}
                  onClick={() => setAssistido(prev => !prev)}
                >
                  <i className={`bi ${assistido ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                  {assistido ? 'Concluído' : 'Marcar como Assistido'}
                </button>

                <button className="btn-video-primary" onClick={salvarEstudo}>
                  <i className="bi bi-check-lg"></i> Salvar Estudo
                </button>
              </div>
            </div>

            {/* Barra de Configuração do Link e Matéria */}
            <div className="video-estudio-config-card">
              <div className="video-url-input-container">
                <i className="bi bi-link-45deg video-url-icon"></i>
                <input
                  type="text"
                  placeholder="Cole aqui o link do vídeo do YouTube (ex: https://www.youtube.com/watch?v=... ou https://youtu.be/...)"
                  value={urlInput}
                  onChange={e => {
                    const val = e.target.value;
                    setUrlInput(val);
                    const id = extrairYouTubeId(val);
                    if (id) {
                      setVideoId(id);
                      if (!titulo.trim() || titulo.startsWith('Estudo com Vídeo (')) {
                        setTitulo(`Estudo com Vídeo (${id})`);
                      }
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') carregarLinkYouTube();
                  }}
                />
                <button
                  type="button"
                  className="btn-carregar-video"
                  onClick={() => carregarLinkYouTube()}
                >
                  <i className="bi bi-play-circle-fill"></i> Carregar Vídeo
                </button>
              </div>

              <div className="video-metadados-form-row">
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label>Matéria</label>
                  {!mostrarNovaMateria ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <select
                        className="cal-form-input"
                        style={{ flex: 1, height: '38px', fontSize: '0.88rem' }}
                        value={materiaNome}
                        onChange={e => setMateriaNome(e.target.value)}
                      >
                        <option value="Geral">Geral</option>
                        {materias.map(m => (
                          <option key={m.id_materia || m.id} value={m.nome}>{m.nome}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn-add-materia-inline"
                        title="Nova matéria"
                        onClick={() => setMostrarNovaMateria(true)}
                      >
                        <i className="bi bi-plus-lg"></i>
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        className="cal-form-input"
                        style={{ flex: 1, height: '38px', fontSize: '0.88rem' }}
                        placeholder="Nome da matéria"
                        value={novaMateriaNome}
                        onChange={e => setNovaMateriaNome(e.target.value)}
                      />
                      <button type="button" className="btn-add-materia-inline salvar" onClick={handleCriarMateria}>
                        <i className="bi bi-check"></i>
                      </button>
                      <button type="button" className="btn-add-materia-inline cancelar" onClick={() => setMostrarNovaMateria(false)}>
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label>Tema / Tópico</label>
                  <input
                    type="text"
                    className="cal-form-input"
                    style={{ height: '38px', fontSize: '0.88rem' }}
                    placeholder="Ex: Termodinâmica, Revolução Francesa..."
                    value={tema}
                    onChange={e => setTema(e.target.value)}
                  />
                </div>

                <div style={{ width: '150px' }}>
                  <label>Avaliação do Conteúdo</label>
                  <div className="video-rating-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <i
                        key={star}
                        className={`bi ${star <= nota ? 'bi-star-fill active' : 'bi-star'}`}
                        onClick={() => setNota(star === nota ? 0 : star)}
                        title={`${star} estrelas`}
                      ></i>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Layout Lado a Lado (Player à Esquerda + Caderno à Direita) */}
            <div className="video-estudio-grid">

              {/* Coluna 1: Player do YouTube */}
              <div className="video-player-column">
                <div className="video-player-frame-wrapper">
                  {videoId ? (
                    <iframe
                      className="video-youtube-iframe"
                      src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0`}
                      title="Vídeo Educativo"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="video-player-empty-placeholder">
                      <i className="bi bi-youtube" style={{ fontSize: '4.5rem', color: '#ef4444' }}></i>
                      <h3>Nenhum vídeo carregado no momento</h3>
                      <p>Insira a URL do vídeo do YouTube no campo acima e clique em "Carregar Vídeo" para iniciar a reprodução.</p>
                      <div className="video-dica-links">
                        <span>Exemplos válidos:</span>
                        <code>https://www.youtube.com/watch?v=...</code>
                        <code>https://youtu.be/...</code>
                      </div>
                    </div>
                  )}
                </div>

                {/* Banner de apoio cognitivo */}
                <div className="video-cognitivo-banner">
                  <div className="video-cognitivo-icon">
                    <i className="bi bi-lightning-charge-fill"></i>
                  </div>
                  <div className="video-cognitivo-text">
                    <strong>Técnica de Aprendizagem Ativa:</strong>
                    <span>Pause o vídeo a cada 3 a 5 minutos para registrar as ideias principais no caderno ou gravar uma explicação verbal com suas palavras.</span>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Caderno de Resumo & Estúdio de Áudio */}
              <div className="video-caderno-column">
                {/* Abas do Caderno */}
                <div className="video-caderno-tabs">
                  <button
                    className={`video-caderno-tab ${abaCaderno === 'ambos' ? 'ativo' : ''}`}
                    onClick={() => setAbaCaderno('ambos')}
                  >
                    <i className="bi bi-layout-split"></i> Resumo + Áudio
                  </button>
                  <button
                    className={`video-caderno-tab ${abaCaderno === 'resumo' ? 'ativo' : ''}`}
                    onClick={() => setAbaCaderno('resumo')}
                  >
                    <i className="bi bi-pencil-fill"></i> Apenas Resumo
                    {resumoTexto.trim().length > 0 && <span className="tab-badge-ok">✓</span>}
                  </button>
                  <button
                    className={`video-caderno-tab ${abaCaderno === 'audio' ? 'ativo' : ''}`}
                    onClick={() => setAbaCaderno('audio')}
                  >
                    <i className="bi bi-mic-fill"></i> Apenas Áudio
                    {(audioUrl || gravando) && <span className="tab-badge-audio-rec">●</span>}
                  </button>
                </div>

                {/* VISTA 1: AMBOS INTEGRADOS (Resumo Escrito + Gravador de Áudio Juntos) */}
                {abaCaderno === 'ambos' && (
                  <div className="video-ambos-tab-body">
                    {/* Gravador Compacto no Topo */}
                    <div className="video-audio-compact-box">
                      <div className="video-audio-compact-header">
                        <div className="d-flex align-items-center gap-2">
                          <i className="bi bi-mic-fill text-danger"></i>
                          <strong>Gravar Resumo em Voz</strong>
                          {gravando && <span className="tab-badge-audio-rec">Gravando...</span>}
                        </div>
                        <span className="video-gravador-timer-mini">{formatTempo(tempoGravacao)}</span>
                      </div>

                      {!gravando && !audioUrl && (
                        <div className="d-flex align-items-center justify-content-between gap-3 mt-2">
                          <small className="text-muted">Explique a aula com suas próprias palavras para fixar o aprendizado.</small>
                          <button
                            type="button"
                            className="btn-gravador-action gravar"
                            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                            onClick={iniciarGravacao}
                          >
                            <i className="bi bi-record-circle-fill"></i> Iniciar Gravação
                          </button>
                        </div>
                      )}

                      {gravando && (
                        <div className="d-flex align-items-center justify-content-between gap-2 mt-2">
                          <div className="video-ondas-container">
                            <span className="onda o1"></span>
                            <span className="onda o2"></span>
                            <span className="onda o3"></span>
                            <span className="onda o4"></span>
                            <span className="onda o5"></span>
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn-gravador-action pausar"
                              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                              onClick={pausarGravacao}
                            >
                              <i className={`bi ${pausado ? 'bi-play-fill' : 'bi-pause-fill'}`}></i>
                              {pausado ? 'Continuar' : 'Pausar'}
                            </button>
                            <button
                              type="button"
                              className="btn-gravador-action parar"
                              style={{ padding: '6px 16px', fontSize: '0.82rem' }}
                              onClick={pararGravacao}
                            >
                              <i className="bi bi-stop-circle-fill"></i> Concluir Áudio
                            </button>
                          </div>
                        </div>
                      )}

                      {audioUrl && !gravando && (
                        <div className="d-flex align-items-center justify-content-between gap-2 mt-2 flex-wrap">
                          <audio controls src={audioUrl} className="video-audio-player-mini" style={{ flex: 1, minWidth: '220px' }} />
                          <button
                            type="button"
                            className="btn-descartar-audio"
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            onClick={descartarAudio}
                          >
                            <i className="bi bi-trash"></i> Regravar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Resumo Escrito logo abaixo */}
                    <div className="video-resumo-tab-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div className="video-resumo-toolbar">
                        <span className="video-toolbar-label">Inserir rápido:</span>
                        <button
                          type="button"
                          className="btn-toolbar-chip"
                          onClick={() => inserirMarcador('💡 Ponto Chave:')}
                        >
                          💡 Ponto Chave
                        </button>
                        <button
                          type="button"
                          className="btn-toolbar-chip"
                          onClick={() => inserirMarcador('❓ Dúvida:')}
                        >
                          ❓ Dúvida
                        </button>
                        <button
                          type="button"
                          className="btn-toolbar-chip"
                          onClick={() => inserirMarcador('📌 Conclusão:')}
                        >
                          📌 Conclusão
                        </button>
                        <button
                          type="button"
                          className="btn-toolbar-chip"
                          onClick={() => inserirMarcador('•')}
                        >
                          • Tópico
                        </button>
                      </div>

                      <textarea
                        ref={textareaRef}
                        className="video-resumo-textarea"
                        placeholder="Escreva aqui seu resumo e anotações ativas enquanto assiste ao vídeo..."
                        value={resumoTexto}
                        onChange={e => setResumoTexto(e.target.value)}
                        style={{ minHeight: '220px' }}
                      />

                      <div className="video-resumo-footer">
                        <span className="video-char-counter">
                          <strong>{contagemPalavras.palavras}</strong> palavras • <strong>{contagemPalavras.caracteres}</strong> caracteres
                        </span>
                        {resumoTexto.length > 0 && (
                          <button
                            type="button"
                            className="btn-limpar-resumo"
                            onClick={() => setResumoTexto('')}
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* VISTA 2: APENAS RESUMO ESCRITO */}
                {abaCaderno === 'resumo' && (
                  <div className="video-resumo-tab-body">
                    <div className="video-resumo-toolbar">
                      <span className="video-toolbar-label">Inserir rápido:</span>
                      <button
                        type="button"
                        className="btn-toolbar-chip"
                        onClick={() => inserirMarcador('💡 Ponto Chave:')}
                      >
                        💡 Ponto Chave
                      </button>
                      <button
                        type="button"
                        className="btn-toolbar-chip"
                        onClick={() => inserirMarcador('❓ Dúvida:')}
                      >
                        ❓ Dúvida
                      </button>
                      <button
                        type="button"
                        className="btn-toolbar-chip"
                        onClick={() => inserirMarcador('📌 Conclusão:')}
                      >
                        📌 Conclusão
                      </button>
                      <button
                        type="button"
                        className="btn-toolbar-chip"
                        onClick={() => inserirMarcador('•')}
                      >
                        • Tópico
                      </button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      className="video-resumo-textarea"
                      placeholder="Escreva aqui seu resumo e anotações ativas enquanto assiste ao vídeo..."
                      value={resumoTexto}
                      onChange={e => setResumoTexto(e.target.value)}
                    />

                    <div className="video-resumo-footer">
                      <span className="video-char-counter">
                        <strong>{contagemPalavras.palavras}</strong> palavras • <strong>{contagemPalavras.caracteres}</strong> caracteres
                      </span>
                      {resumoTexto.length > 0 && (
                        <button
                          type="button"
                          className="btn-limpar-resumo"
                          onClick={() => setResumoTexto('')}
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* VISTA 3: APENAS RESUMO EM ÁUDIO */}
                {abaCaderno === 'audio' && (
                  <div className="video-audio-tab-body">
                    <div className="video-audio-card-box">
                      <div className="video-audio-header-status">
                        <h4><i className="bi bi-mic-fill text-danger"></i> Gravar Explicação em Áudio</h4>
                        <p>Explique com sua própria voz os conceitos aprendidos no vídeo (Técnica do Autoteste Verbal).</p>
                      </div>

                      {/* Display do Timer e Ondas */}
                      <div className={`video-gravador-display ${gravando ? 'em-gravacao' : ''}`}>
                        <div className="video-gravador-timer">
                          {formatTempo(tempoGravacao)}
                        </div>
                        {gravando && (
                          <div className="video-ondas-container">
                            <span className="onda o1"></span>
                            <span className="onda o2"></span>
                            <span className="onda o3"></span>
                            <span className="onda o4"></span>
                            <span className="onda o5"></span>
                          </div>
                        )}
                        <span className="video-gravador-status-text">
                          {gravando
                            ? (pausado ? 'Gravação pausada' : 'Gravando áudio pelo microfone...')
                            : audioUrl
                            ? 'Áudio pronto para reprodução'
                            : 'Pressione "Iniciar Gravação" para falar'}
                        </span>
                      </div>

                      {/* Botões do Gravador */}
                      <div className="video-gravador-controles">
                        {!gravando ? (
                          <button
                            type="button"
                            className="btn-gravador-action gravar"
                            onClick={iniciarGravacao}
                          >
                            <i className="bi bi-record-circle-fill"></i> Iniciar Gravação
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn-gravador-action pausar"
                              onClick={pausarGravacao}
                            >
                              <i className={`bi ${pausado ? 'bi-play-fill' : 'bi-pause-fill'}`}></i>
                              {pausado ? 'Continuar' : 'Pausar'}
                            </button>
                            <button
                              type="button"
                              className="btn-gravador-action parar"
                              onClick={pararGravacao}
                            >
                              <i className="bi bi-stop-circle-fill"></i> Concluir Áudio
                            </button>
                          </>
                        )}
                      </div>

                      {/* Player de Prévia do Áudio Gravado */}
                      {audioUrl && !gravando && (
                        <div className="video-audio-player-wrapper">
                          <div className="video-audio-player-meta">
                            <strong><i className="bi bi-soundwave"></i> Áudio Resumo:</strong>
                            <span>{audioDuracao}</span>
                          </div>
                          <audio controls src={audioUrl} className="video-audio-player-element" />

                          <div className="video-audio-player-acoes">
                            <button
                              type="button"
                              className="btn-descartar-audio"
                              onClick={descartarAudio}
                            >
                              <i className="bi bi-trash"></i> Descartar e Regravar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}

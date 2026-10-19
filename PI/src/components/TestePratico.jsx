import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { apiFetch } from '../api';
import './TestePratico.css';


export default function TestePratico() {
  const [simulados, setSimulados] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [materiaFiltro, setMateriaFiltro] = useState('todas');
  const [busca, setBusca] = useState('');

  // Modos de Visualização
  const [modoEstudio, setModoEstudio] = useState(false);
  const [simuladoAtivo, setSimuladoAtivo] = useState(null);
  const [simuladoVisualizando, setSimuladoVisualizando] = useState(null);
  const [mostrarModalUpload, setMostrarModalUpload] = useState(false);

  // Estado do Estúdio de Resolução
  const [respostasAtuais, setRespostasAtuais] = useState({});
  const [tempoSegundos, setTempoSegundos] = useState(0);
  const [cronometroAtivo, setCronometroAtivo] = useState(false);
  const [anotacoesResolucao, setAnotacoesResolucao] = useState('');
  const [abaMobile, setAbaMobile] = useState('pdf'); // 'pdf' ou 'cartao'
  const timerIntervalRef = useRef(null);

  // Estado do Modal de Upload / Cadastro
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaMateria, setNovaMateria] = useState('');
  const [novoTotalQuestoes, setNovoTotalQuestoes] = useState(10);
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [arquivoNome, setArquivoNome] = useState('');
  const [arquivoPreviewUrl, setArquivoPreviewUrl] = useState('');
  const [gabaritoCadastro, setGabaritoCadastro] = useState({});
  const [habilitarGabaritoPrevi, setHabilitarGabaritoPrevi] = useState(false);
  const [enviandoUpload, setEnviandoUpload] = useState(false);
  const fileInputRef = useRef(null);

  // Carregar Matérias e Simulados
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

  const carregarSimulados = async () => {
    setCarregando(true);
    try {
      const res = await apiFetch('simulados');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSimulados(data);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar simulados:', err);
      setSimulados([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarMaterias();
    carregarSimulados();
  }, []);

  // Cronômetro do Estúdio
  useEffect(() => {
    if (cronometroAtivo) {
      timerIntervalRef.current = setInterval(() => {
        setTempoSegundos(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [cronometroAtivo]);

  const formatarTempo = (totalSeg) => {
    const horas = Math.floor(totalSeg / 3600);
    const minutos = Math.floor((totalSeg % 3600) / 60);
    const seg = totalSeg % 60;
    if (horas > 0) {
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
    }
    return `${minutos.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  };

  // Iniciar Resolução de um Simulado
  const iniciarResolucao = (simulado) => {
    setSimuladoAtivo(simulado);
    setRespostasAtuais(simulado.respostas_usuario || {});
    setAnotacoesResolucao(simulado.anotacoes || '');
    setTempoSegundos(simulado.tempo_gasto || 0);
    setCronometroAtivo(true);
    setModoEstudio(true);
    setAbaMobile('pdf');
  };

  // Marcar opção no Cartão-Resposta
  const selecionarOpcao = (numQuestao, letra) => {
    setRespostasAtuais(prev => {
      // Se clicou na mesma, desmarca
      if (prev[numQuestao] === letra) {
        const novo = { ...prev };
        delete novo[numQuestao];
        return novo;
      }
      return { ...prev, [numQuestao]: letra };
    });
  };

  // Finalizar e Corrigir Simulado
  const finalizarSimulado = async () => {
    setCronometroAtivo(false);

    const totalQuestoes = simuladoAtivo.total || Object.keys(simuladoAtivo.gabarito || {}).length || 10;
    const gabarito = simuladoAtivo.gabarito || {};
    const temGabarito = Object.keys(gabarito).length > 0;

    let acertos = 0;
    let erros = 0;

    if (temGabarito) {
      for (let i = 1; i <= totalQuestoes; i++) {
        if (respostasAtuais[i] && gabarito[i]) {
          if (respostasAtuais[i].toUpperCase() === gabarito[i].toUpperCase()) {
            acertos++;
          } else {
            erros++;
          }
        } else {
          erros++;
        }
      }
    } else {
      // Se não há gabarito oficial cadastrado, pergunta quantos o aluno acertou
      const { value: acertosInformados } = await Swal.fire({
        title: 'Conferência de Gabarito',
        text: `Esta prova não possui gabarito automático. De ${totalQuestoes} questões, quantas você acertou?`,
        input: 'number',
        inputAttributes: { min: 0, max: totalQuestoes },
        inputValue: Object.keys(respostasAtuais).length,
        showCancelButton: true,
        confirmButtonText: 'Confirmar Nota',
        confirmButtonColor: '#9f042c',
        cancelButtonText: 'Cancelar'
      });

      if (acertosInformados === undefined) {
        setCronometroAtivo(true);
        return;
      }

      acertos = parseInt(acertosInformados) || 0;
      erros = Math.max(0, totalQuestoes - acertos);
    }

    const taxa = totalQuestoes > 0 ? parseFloat(((acertos / totalQuestoes) * 100).toFixed(2)) : 0;

    const payload = {
      titulo: simuladoAtivo.titulo,
      materia: simuladoAtivo.materia,
      arquivo_url: simuladoAtivo.arquivo_url,
      arquivo_nome: simuladoAtivo.arquivo_nome,
      gabarito: simuladoAtivo.gabarito,
      respostas_usuario: respostasAtuais,
      acertos: acertos,
      erros: erros,
      total: totalQuestoes,
      taxa: taxa,
      tempo_gasto: tempoSegundos,
      anotacoes: anotacoesResolucao
    };

    try {
      if (simuladoAtivo.id && typeof simuladoAtivo.id === 'number') {
        await apiFetch(`simulados/${simuladoAtivo.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('simulados', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      Swal.fire({
        title: taxa >= 70 ? '🎉 Excelente Desempenho!' : '💪 Bom Treino!',
        html: `
          <div style="font-size: 1.1rem; margin-top: 10px;">
            <p>Você acertou <strong>${acertos}</strong> de <strong>${totalQuestoes}</strong> questões.</p>
            <div style="font-size: 2.2rem; font-weight: 800; color: ${taxa >= 70 ? '#16a34a' : '#d97706'}; margin: 15px 0;">
              ${taxa}%
            </div>
            <p style="color: #6b7280; font-size: 0.9rem;">Tempo total: ${formatarTempo(tempoSegundos)}</p>
          </div>
        `,
        icon: taxa >= 70 ? 'success' : 'info',
        confirmButtonColor: '#9f042c',
        confirmButtonText: 'Ver Resultados no Histórico'
      });

      setModoEstudio(false);
      carregarSimulados();
    } catch (err) {
      console.error('Erro ao salvar resultado:', err);
    }
  };

  // Upload de Arquivo PDF
  const lidarSelecaoArquivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArquivoSelecionado(file);
      setArquivoNome(file.name);
      setArquivoPreviewUrl(URL.createObjectURL(file));
      if (!novoTitulo) {
        // Sugere título a partir do nome do arquivo (sem extensão)
        const sugestao = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setNovoTitulo(sugestao.charAt(0).toUpperCase() + sugestao.slice(1));
      }
    }
  };

  // Salvar Novo Simulado / Prova
  const salvarNovoSimulado = async () => {
    if (!novoTitulo.trim()) {
      Swal.fire({ icon: 'warning', title: 'Título Obrigatório', text: 'Informe um título para a prova ou simulado.', confirmButtonColor: '#9f042c' });
      return;
    }

    setEnviandoUpload(true);
    let urlFinal = arquivoPreviewUrl;

    // Se selecionou um arquivo local, faz o upload para a API
    if (arquivoSelecionado) {
      try {
        const formData = new FormData();
        formData.append('arquivo', arquivoSelecionado);

        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const resUpload = await fetch('http://localhost/api_sectio_aurea-main/simulados/upload', {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: formData
        });

        if (resUpload.ok) {
          const dadosUpload = await resUpload.json();
          urlFinal = dadosUpload.arquivo_url;
        }
      } catch (err) {
        console.warn('Falha no upload para o servidor, usando URL local blob:', err);
      }
    }

    const payload = {
      titulo: novoTitulo.trim(),
      materia: novaMateria.trim() || 'Geral',
      arquivo_url: urlFinal,
      arquivo_nome: arquivoNome || 'prova.pdf',
      total: novoTotalQuestoes,
      acertos: 0,
      erros: 0,
      taxa: 0,
      tempo_gasto: 0,
      gabarito: habilitarGabaritoPrevi ? gabaritoCadastro : {},
      respostas_usuario: {},
      anotacoes: ''
    };

    try {
      const res = await apiFetch('simulados', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Prova Cadastrada!',
          text: 'O arquivo PDF e a prova foram salvos com sucesso.',
          timer: 1800,
          showConfirmButton: false
        });
        setMostrarModalUpload(false);
        resetarFormUpload();
        carregarSimulados();
      }
    } catch (err) {
      console.error('Erro ao cadastrar simulado:', err);
      Swal.fire({ icon: 'error', title: 'Erro ao cadastrar', text: 'Tente novamente.', confirmButtonColor: '#9f042c' });
    } finally {
      setEnviandoUpload(false);
    }
  };

  const resetarFormUpload = () => {
    setNovoTitulo('');
    setNovaMateria('');
    setNovoTotalQuestoes(10);
    setArquivoSelecionado(null);
    setArquivoNome('');
    setArquivoPreviewUrl('');
    setGabaritoCadastro({});
    setHabilitarGabaritoPrevi(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Excluir Prova
  const excluirSimulado = (id) => {
    Swal.fire({
      title: 'Excluir Prova / Simulado?',
      text: 'O histórico, respostas e arquivos desta prova serão excluídos.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280'
    }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          if (typeof id === 'number') {
            await apiFetch(`simulados/${id}`, { method: 'DELETE' });
          } else {
            setSimulados(prev => prev.filter(s => s.id !== id));
          }
          carregarSimulados();
          Swal.fire({ icon: 'success', title: 'Excluído!', timer: 1200, showConfirmButton: false });
        } catch (err) {
          console.error('Erro ao excluir:', err);
        }
      }
    });
  };

  // Filtros
  const simuladosFiltrados = simulados.filter(s => {
    const matchBusca = s.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
                       s.arquivo_nome?.toLowerCase().includes(busca.toLowerCase());
    const matchMateria = materiaFiltro === 'todas' || s.materia === materiaFiltro;
    return matchBusca && matchMateria;
  });

  // Métricas Globais
  const totalProvas = simulados.length;
  const totalQuestoesResolvidas = simulados.reduce((acc, s) => acc + (s.total || 0), 0);
  const mediaTaxa = simulados.length > 0 
    ? Math.round(simulados.reduce((acc, s) => acc + (parseFloat(s.taxa) || 0), 0) / simulados.length) 
    : 0;
  const tempoTotalPratica = simulados.reduce((acc, s) => acc + (s.tempo_gasto || 0), 0);

  return (
    <div className="pratico-container">
      {/* ================= CABEÇALHO ================= */}
      <header className="pratico-header">
        <div className="pratico-header-left">
          <button 
            className="pratico-btn-voltar"
            onClick={() => {
              if (modoEstudio) {
                Swal.fire({
                  title: 'Sair do Modo Simulado?',
                  text: 'Deseja pausar e voltar ao repositório de provas?',
                  icon: 'question',
                  showCancelButton: true,
                  confirmButtonText: 'Sim, sair',
                  cancelButtonText: 'Continuar no Simulado',
                  confirmButtonColor: '#9f042c'
                }).then(r => {
                  if (r.isConfirmed) {
                    setCronometroAtivo(false);
                    setModoEstudio(false);
                  }
                });
              } else {
                window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'metodos' }));
              }
            }}
          >
            <i className="bi bi-arrow-left"></i> {modoEstudio ? 'Voltar às Provas' : 'Voltar aos Métodos'}
          </button>

          <div className="pratico-title-group">
            <span className="pratico-badge">
              <i className="bi bi-file-earmark-check-fill"></i> Teste Prático & Provas
            </span>
            <h1>Testes Práticos & Simulados</h1>
            <p className="pratico-subtitle">
              Suba arquivos PDF de vestibulares, provas anteriores e listas de exercícios. Resolva com cartão de respostas integrado e monitore seu aproveitamento real.
            </p>
          </div>
        </div>

        {!modoEstudio && (
          <button 
            className="pratico-btn-novo" 
            onClick={() => {
              resetarFormUpload();
              setMostrarModalUpload(true);
            }}
          >
            <i className="bi bi-cloud-arrow-up-fill"></i> Subir Nova Prova (PDF)
          </button>
        )}
      </header>

      {/* ============================================================== */}
      {/* MODO ESTÚDIO DE RESOLUÇÃO (VISUALIZADOR PDF + CARTÃO RESPOSTA) */}
      {/* ============================================================== */}
      {modoEstudio && simuladoAtivo ? (
        <div className="pratico-estudio-wrapper">
          {/* Barra Superior do Simulado */}
          <div className="estudio-top-bar">
            <div className="estudio-info-prova">
              <span className="materia-badge">{simuladoAtivo.materia || 'Geral'}</span>
              <h3>{simuladoAtivo.titulo}</h3>
            </div>

            <div className="estudio-cronometro-box">
              <div className="cronometro-display">
                <i className="bi bi-stopwatch"></i> {formatarTempo(tempoSegundos)}
              </div>
              <button 
                className={`btn-cronometro-toggle ${cronometroAtivo ? 'pause' : 'play'}`}
                onClick={() => setCronometroAtivo(!cronometroAtivo)}
              >
                {cronometroAtivo ? <><i className="bi bi-pause-fill"></i> Pausar</> : <><i className="bi bi-play-fill"></i> Retomar</>}
              </button>
            </div>

            <div className="estudio-progresso-pill">
              <span>Respondidas:</span>
              <strong>{Object.keys(respostasAtuais).length} / {simuladoAtivo.total || 10}</strong>
            </div>

            <button className="btn-finalizar-prova" onClick={finalizarSimulado}>
              <i className="bi bi-check2-circle"></i> Finalizar & Corrigir
            </button>
          </div>

          {/* Alternador de Abas Mobile */}
          <div className="mobile-view-tabs">
            <button 
              className={abaMobile === 'pdf' ? 'active' : ''} 
              onClick={() => setAbaMobile('pdf')}
            >
              <i className="bi bi-file-earmark-pdf"></i> Visualizar Prova
            </button>
            <button 
              className={abaMobile === 'cartao' ? 'active' : ''} 
              onClick={() => setAbaMobile('cartao')}
            >
              <i className="bi bi-grid-3x3-gap-fill"></i> Cartão de Respostas ({Object.keys(respostasAtuais).length})
            </button>
          </div>

          {/* Painel Duplo Lado a Lado */}
          <div className="estudio-split-grid">
            {/* LADO ESQUERDO: VISUALIZADOR DE PDF / ARQUIVO */}
            <div className={`estudio-pdf-panel ${abaMobile === 'pdf' ? 'show-mobile' : 'hide-mobile'}`}>
              <div className="pdf-panel-header">
                <span>
                  <i className="bi bi-file-earmark-pdf-fill"></i> {simuladoAtivo.arquivo_nome || 'Arquivo da Prova'}
                </span>
                {simuladoAtivo.arquivo_url && (
                  <a 
                    href={simuladoAtivo.arquivo_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn-link-externo"
                    title="Abrir PDF em nova aba em tela cheia"
                  >
                    <i className="bi bi-box-arrow-up-right"></i> Tela Cheia
                  </a>
                )}
              </div>

              <div className="pdf-viewer-frame">
                {simuladoAtivo.arquivo_url ? (
                  <iframe
                    src={simuladoAtivo.arquivo_url}
                    title="Visualizador de Prova PDF"
                    width="100%"
                    height="100%"
                    style={{ border: 'none', borderRadius: '0 0 16px 16px' }}
                  />
                ) : (
                  <div className="pdf-sem-arquivo">
                    <i className="bi bi-file-earmark-text"></i>
                    <h4>Nenhum PDF Vinculado</h4>
                    <p>Esta prova não possui arquivo PDF anexado. Você pode utilizar o cartão de respostas ao lado enquanto consulta seu material impresso.</p>
                  </div>
                )}
              </div>
            </div>

            {/* LADO DIREITO: CARTÃO DE RESPOSTAS INTERATIVO */}
            <div className={`estudio-cartao-panel ${abaMobile === 'cartao' ? 'show-mobile' : 'hide-mobile'}`}>
              <div className="cartao-header">
                <h4><i className="bi bi-check2-square"></i> Cartão de Respostas</h4>
                <small>Clique na letra correspondente à sua resposta:</small>
              </div>

              <div className="questoes-grid-lista">
                {Array.from({ length: simuladoAtivo.total || 10 }, (_, i) => i + 1).map(num => {
                  const respostaSelecionada = respostasAtuais[num];
                  const gabaritoLetra = simuladoAtivo.gabarito ? simuladoAtivo.gabarito[num] : null;

                  return (
                    <div key={num} className={`questao-row ${respostaSelecionada ? 'respondida' : ''}`}>
                      <div className="questao-num">
                        #{num.toString().padStart(2, '0')}
                      </div>

                      <div className="opcoes-botoes">
                        {['A', 'B', 'C', 'D', 'E'].map(letra => {
                          const isSelected = respostaSelecionada === letra;
                          return (
                            <button
                              key={letra}
                              type="button"
                              className={`btn-opcao ${isSelected ? 'selected' : ''}`}
                              onClick={() => selecionarOpcao(num, letra)}
                            >
                              {letra}
                            </button>
                          );
                        })}
                      </div>

                      {respostaSelecionada && (
                        <span className="check-icon"><i className="bi bi-check"></i></span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Anotações da Resolução */}
              <div className="cartao-anotacoes-box">
                <label><i className="bi bi-pencil-fill"></i> Anotações / Dúvidas durante a prova:</label>
                <textarea
                  rows={3}
                  placeholder="Anote números de questões que ficou com dúvida para revisar depois..."
                  value={anotacoesResolucao}
                  onChange={(e) => setAnotacoesResolucao(e.target.value)}
                />
              </div>

              <div className="cartao-footer-action">
                <button className="btn-finalizar-prova w-100" onClick={finalizarSimulado}>
                  <i className="bi bi-check2-circle"></i> Concluir & Gerar Relatório
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* MODO DASHBOARD / REPOSITÓRIO DE PROVAS                         */
        /* ============================================================== */
        <div className="pratico-dashboard">
          {/* Métricas do Aluno */}
          <div className="pratico-metrics-grid">
            <div className="metric-card">
              <div className="metric-icon"><i className="bi bi-file-earmark-text-fill"></i></div>
              <div className="metric-data">
                <span className="metric-number">{totalProvas}</span>
                <span className="metric-label">Provas Cadastradas</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><i className="bi bi-bullseye"></i></div>
              <div className="metric-data">
                <span className="metric-number">{mediaTaxa}%</span>
                <span className="metric-label">Aproveitamento Médio</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><i className="bi bi-check2-circle"></i></div>
              <div className="metric-data">
                <span className="metric-number">{totalQuestoesResolvidas}</span>
                <span className="metric-label">Questões Praticadas</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><i className="bi bi-clock-history"></i></div>
              <div className="metric-data">
                <span className="metric-number">{Math.round(tempoTotalPratica / 60)} min</span>
                <span className="metric-label">Tempo em Simulados</span>
              </div>
            </div>
          </div>

          {/* Barra de Filtros e Busca */}
          <div className="pratico-filter-bar">
            <div className="filter-search-box">
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="Buscar por nome da prova, vestibular ou arquivo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              {busca && (
                <button className="btn-clear-search" onClick={() => setBusca('')}>
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>

            <div className="filter-select-group">
              <label>Matéria:</label>
              <select 
                value={materiaFiltro} 
                onChange={(e) => setMateriaFiltro(e.target.value)}
              >
                <option value="todas">Todas as Disciplinas</option>
                {materias.map(m => (
                  <option key={m.id_materia} value={m.nome}>{m.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de Provas */}
          {carregando ? (
            <div className="pratico-loading">
              <div className="spinner"></div>
              <p>Carregando repositório de provas...</p>
            </div>
          ) : simuladosFiltrados.length === 0 ? (
            <div className="pratico-empty-state">
              <div className="empty-icon"><i className="bi bi-file-earmark-pdf"></i></div>
              <h3>Nenhuma Prova ou Simulado Encontrado</h3>
              <p>
                {busca || materiaFiltro !== 'todas'
                  ? 'Nenhum arquivo corresponde aos filtros selecionados. Tente limpar os filtros.'
                  : 'Você ainda não cadastrou nenhuma prova. Clique no botão abaixo para subir seu primeiro arquivo PDF de prova ou vestibular!'}
              </p>
              <button 
                className="pratico-btn-novo"
                onClick={() => {
                  resetarFormUpload();
                  setMostrarModalUpload(true);
                }}
              >
                <i className="bi bi-cloud-arrow-up-fill"></i> Subir Minha Primeira Prova
              </button>
            </div>
          ) : (
            <div className="pratico-cards-grid">
              {simuladosFiltrados.map((item) => {
                const taxa = parseFloat(item.taxa) || 0;
                const foiResolvido = item.acertos > 0 || item.erros > 0;

                return (
                  <div key={item.id || item.id_simulado} className="prova-card">
                    <div className="prova-card-header">
                      <span className="prova-materia-tag">{item.materia || 'Geral'}</span>
                      <span className="prova-data">
                        <i className="bi bi-calendar3"></i> {new Date(item.data).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <h3 className="prova-titulo">{item.titulo}</h3>

                    {/* Arquivo Anexo */}
                    <div className="prova-arquivo-pill">
                      <i className="bi bi-file-earmark-pdf-fill"></i>
                      <span className="nome-arquivo" title={item.arquivo_nome}>
                        {item.arquivo_nome || 'prova.pdf'}
                      </span>
                      {item.arquivo_url && (
                        <a 
                          href={item.arquivo_url} 
                          download={item.arquivo_nome || 'prova.pdf'} 
                          target="_blank" 
                          rel="noreferrer"
                          title="Baixar ou abrir arquivo"
                        >
                          <i className="bi bi-download"></i>
                        </a>
                      )}
                    </div>

                    {/* Desempenho / Nota */}
                    <div className="prova-stats-box">
                      {foiResolvido ? (
                        <>
                          <div className="taxa-display">
                            <span className="taxa-val" style={{ color: taxa >= 70 ? '#16a34a' : '#d97706' }}>
                              {taxa}%
                            </span>
                            <span className="taxa-label">de acertos</span>
                          </div>
                          <div className="acertos-detalhe">
                            <span><strong>{item.acertos}</strong> acertos</span>
                            <span><strong>{item.total || 0}</strong> questões</span>
                          </div>
                        </>
                      ) : (
                        <div className="prova-pendente-msg">
                          <i className="bi bi-clock"></i> Pendente de resolução
                        </div>
                      )}
                    </div>

                    {/* Ações do Card */}
                    <div className="prova-card-footer">
                      <button 
                        className="btn-resolver-card"
                        onClick={() => iniciarResolucao(item)}
                      >
                        <i className="bi bi-play-fill"></i> {foiResolvido ? 'Refazer Simulado' : 'Resolver Simulado'}
                      </button>

                      <button 
                        className="btn-ver-gabarito"
                        onClick={() => setSimuladoVisualizando(item)}
                        title="Ver Gabarito e Anotações"
                      >
                        <i className="bi bi-eye"></i>
                      </button>

                      <button 
                        className="btn-excluir-prova"
                        onClick={() => excluirSimulado(item.id || item.id_simulado)}
                        title="Excluir prova"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL DE UPLOAD / CADASTRO DE PROVA (PDF)                      */}
      {/* ============================================================== */}
      {mostrarModalUpload && (
        <div className="pratico-modal-overlay" onClick={() => setMostrarModalUpload(false)}>
          <div className="pratico-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div>
                <h2><i className="bi bi-cloud-arrow-up-fill"></i> Subir Prova ou Simulado</h2>
                <p>Anexe o arquivo PDF da prova, lista ou simulado para praticar no Sectio Aurea.</p>
              </div>
              <button className="btn-close-modal" onClick={() => setMostrarModalUpload(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="modal-body-custom">
              <div className="form-group">
                <label><i className="bi bi-bookmark-fill"></i> Título da Prova ou Simulado:</label>
                <input
                  type="text"
                  className="pratico-input"
                  placeholder="Ex: ENEM 2024 - 1º Dia, FUVEST 1ª Fase, Lista de Exercícios..."
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                />
              </div>

              <div className="form-row-dupla">
                <div className="form-group flex-1">
                  <label><i className="bi bi-journal-bookmark"></i> Matéria / Disciplina:</label>
                  <input
                    type="text"
                    list="materias-sugestoes"
                    className="pratico-input"
                    placeholder="Ex: Matemática, Física, Português..."
                    value={novaMateria}
                    onChange={(e) => setNovaMateria(e.target.value)}
                  />
                  <datalist id="materias-sugestoes">
                    {materias.map(m => (
                      <option key={m.id_materia} value={m.nome} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group w-140">
                  <label><i className="bi bi-123"></i> Qtd. Questões:</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    className="pratico-input"
                    value={novoTotalQuestoes}
                    onChange={(e) => setNovoTotalQuestoes(parseInt(e.target.value) || 10)}
                  />
                </div>
              </div>

              {/* Área de Upload de Arquivo */}
              <div className="form-group">
                <label><i className="bi bi-file-earmark-pdf"></i> Arquivo da Prova (PDF, Doc ou Imagem):</label>
                <div 
                  className={`dropzone-box ${arquivoSelecionado ? 'com-arquivo' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={lidarSelecaoArquivo}
                  />
                  {arquivoSelecionado ? (
                    <div className="dropzone-sucesso">
                      <i className="bi bi-file-earmark-check-fill"></i>
                      <strong>{arquivoNome}</strong>
                      <small>Clique para trocar de arquivo</small>
                    </div>
                  ) : (
                    <div className="dropzone-instrucao">
                      <i className="bi bi-cloud-upload"></i>
                      <strong>Clique ou arraste o arquivo PDF da prova aqui</strong>
                      <small>Formatos aceitos: PDF, DOC, Imagens (até 25 MB)</small>
                    </div>
                  )}
                </div>
              </div>

              {/* Toggle de Gabarito Oficial Opcional */}
              <div className="gabarito-toggle-box">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={habilitarGabaritoPrevi}
                    onChange={(e) => setHabilitarGabaritoPrevi(e.target.checked)}
                  />
                  <span>Cadastrar Gabarito Oficial para correção automática</span>
                </label>
              </div>

              {habilitarGabaritoPrevi && (
                <div className="gabarito-cadastro-grid">
                  <small className="d-block mb-2">Marque a alternativa correta de cada questão:</small>
                  <div className="gabarito-mini-lista">
                    {Array.from({ length: novoTotalQuestoes }, (_, i) => i + 1).map(num => (
                      <div key={num} className="mini-gabarito-item">
                        <span>#{num}:</span>
                        <div className="mini-opcoes">
                          {['A', 'B', 'C', 'D', 'E'].map(letra => (
                            <button
                              key={letra}
                              type="button"
                              className={`mini-btn ${gabaritoCadastro[num] === letra ? 'active' : ''}`}
                              onClick={() => {
                                setGabaritoCadastro(prev => ({ ...prev, [num]: letra }));
                              }}
                            >
                              {letra}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer-custom">
              <button 
                className="btn-cancelar"
                onClick={() => setMostrarModalUpload(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-salvar-modal"
                disabled={enviandoUpload}
                onClick={salvarNovoSimulado}
              >
                {enviandoUpload ? (
                  <><i className="bi bi-hourglass-split"></i> Enviando...</>
                ) : (
                  <><i className="bi bi-check-lg"></i> Cadastrar Prova</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL DE REVISÃO DE GABARITO & ANOTAÇÕES                       */}
      {/* ============================================================== */}
      {simuladoVisualizando && (
        <div className="pratico-modal-overlay" onClick={() => setSimuladoVisualizando(null)}>
          <div className="pratico-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div>
                <h2>{simuladoVisualizando.titulo}</h2>
                <span className="modal-meta">
                  <i className="bi bi-bookmark"></i> {simuladoVisualizando.materia} • {new Date(simuladoVisualizando.data).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <button className="btn-close-modal" onClick={() => setSimuladoVisualizando(null)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="modal-body-custom">
              {/* Placar */}
              <div className="placar-resumo-card">
                <div className="placar-item">
                  <span className="placar-val">{simuladoVisualizando.taxa}%</span>
                  <span className="placar-sub">Aproveitamento</span>
                </div>
                <div className="placar-item">
                  <span className="placar-val text-success">{simuladoVisualizando.acertos}</span>
                  <span className="placar-sub">Acertos</span>
                </div>
                <div className="placar-item">
                  <span className="placar-val text-danger">{simuladoVisualizando.erros}</span>
                  <span className="placar-sub">Erros</span>
                </div>
                <div className="placar-item">
                  <span className="placar-val">{formatarTempo(simuladoVisualizando.tempo_gasto || 0)}</span>
                  <span className="placar-sub">Tempo Gasto</span>
                </div>
              </div>

              {/* Tabela Comparativa de Respostas */}
              <h4><i className="bi bi-card-checklist"></i> Comparativo do Cartão-Resposta:</h4>
              <div className="comparativo-tabela-box">
                <table className="tabela-comparativo">
                  <thead>
                    <tr>
                      <th>Questão</th>
                      <th>Sua Resposta</th>
                      <th>Gabarito Oficial</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: simuladoVisualizando.total || 10 }, (_, i) => i + 1).map(num => {
                      const resp = simuladoVisualizando.respostas_usuario ? simuladoVisualizando.respostas_usuario[num] : '-';
                      const gab = simuladoVisualizando.gabarito ? simuladoVisualizando.gabarito[num] : '-';
                      const isCorrect = resp && gab && resp === gab;

                      return (
                        <tr key={num} className={isCorrect ? 'row-acerto' : (resp !== '-' ? 'row-erro' : '')}>
                          <td><strong>Questão {num}</strong></td>
                          <td><span className="badge-resp">{resp || '-'}</span></td>
                          <td><span className="badge-gab">{gab || '-'}</span></td>
                          <td>
                            {gab !== '-' ? (
                              isCorrect ? (
                                <span className="status-badge acerto"><i className="bi bi-check-circle-fill"></i> Correta</span>
                              ) : (
                                <span className="status-badge erro"><i className="bi bi-x-circle-fill"></i> Incorreta</span>
                              )
                            ) : (
                              <span className="status-badge neutro">Sem gabarito</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {simuladoVisualizando.anotacoes && (
                <div className="anotacoes-revisao-box">
                  <h4><i className="bi bi-pencil-fill"></i> Suas Anotações:</h4>
                  <p>{simuladoVisualizando.anotacoes}</p>
                </div>
              )}
            </div>

            <div className="modal-footer-custom">
              <button 
                className="btn-resolver-card"
                onClick={() => {
                  setSimuladoVisualizando(null);
                  iniciarResolucao(simuladoVisualizando);
                }}
              >
                <i className="bi bi-play-circle-fill"></i> Refazer Esta Prova
              </button>
              <button className="btn-cancelar" onClick={() => setSimuladoVisualizando(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

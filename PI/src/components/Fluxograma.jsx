import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { apiFetch } from '../api';
import './Fluxograma.css';

const CORES_PALETA = [
  '#10b981', // Verde
  '#3b82f6', // Azul
  '#f59e0b', // Âmbar / Laranja
  '#ef4444', // Vermelho
  '#8b5cf6', // Roxo
  '#06b6d4', // Ciano
  '#ec4899', // Rosa
  '#64748b'  // Grafite
];

const FORMAS_CONFIG = {
  inicio_fim: {
    nome: 'Início / Fim',
    largura: 200,
    altura: 60,
    corPadrao: '#10b981',
    icone: 'bi-play-circle-fill'
  },
  processo: {
    nome: 'Processo',
    largura: 220,
    altura: 70,
    corPadrao: '#3b82f6',
    icone: 'bi-square-fill'
  },
  decisao: {
    nome: 'Decisão',
    largura: 170,
    altura: 170,
    corPadrao: '#f59e0b',
    icone: 'bi-diamond-fill'
  },
  entrada_saida: {
    nome: 'Entrada / Saída',
    largura: 220,
    altura: 65,
    corPadrao: '#8b5cf6',
    icone: 'bi-box-arrow-in-right'
  }
};

export default function Fluxograma() {
  const [diagramas, setDiagramas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [materiaFiltro, setMateriaFiltro] = useState('todas');
  const [carregando, setCarregando] = useState(true);

  // Modo Galeria vs Editor
  const [modoEditor, setModoEditor] = useState(false);

  // Estado do Diagrama Atual
  const [idDiagramaAtual, setIdDiagramaAtual] = useState(null);
  const [tituloDiagrama, setTituloDiagrama] = useState('');
  const [materiaIdDiagrama, setMateriaIdDiagrama] = useState('');
  const [nos, setNos] = useState([]);
  const [conexoes, setConexoes] = useState([]);

  // Canvas
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [noSelecionadoId, setNoSelecionadoId] = useState(null);
  const [modoConectar, setModoConectar] = useState(false);
  const [noOrigemConexao, setNoOrigemConexao] = useState(null);

  // Arrastar
  const [arrastandoNoId, setArrastandoNoId] = useState(null);
  const [arrastandoFundo, setArrastandoFundo] = useState(false);
  const dragPosRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef(null);

  // Nova Matéria Inline
  const [mostrarNovaMateria, setMostrarNovaMateria] = useState(false);
  const [novaMateriaNome, setNovaMateriaNome] = useState('');
  const [novaMateriaCor, setNovaMateriaCor] = useState('#ffbd59');
  const [salvandoMateria, setSalvandoMateria] = useState(false);

  const formatColor = (cor) => {
    if (!cor) return '#ffbd59';
    if (cor.startsWith('0x') || cor.startsWith('0X')) {
      return '#' + cor.slice(-6);
    }
    return cor;
  };

  // Carregar Matérias e Diagramas
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

  const carregarDiagramas = async () => {
    setCarregando(true);
    try {
      const res = await apiFetch('diagramasfluxo');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setDiagramas(data);
      }
    } catch (err) {
      console.error('Erro ao buscar diagramas de fluxo:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarMaterias();
    carregarDiagramas();
  }, []);

  const voltarParaMetodos = () => {
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'metodos' }));
  };

  // ==================== EDITOR ACTIONS ====================

  const abrirEditorNovo = () => {
    setIdDiagramaAtual(null);
    setTituloDiagrama('Novo Fluxograma de Processo');
    setMateriaIdDiagrama(materias.length > 0 ? String(materias[0].id_materia || materias[0].id) : '');
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setNoSelecionadoId(1);
    setModoConectar(false);
    setNoOrigemConexao(null);

    // Estrutura inicial padrão de um fluxograma: Início -> Processo -> Decisão
    const noInicio = {
      id: 1,
      tipo: 'inicio_fim',
      texto: 'Início do Processo',
      x: 400,
      y: 100,
      cor: '#10b981'
    };
    const noProcesso = {
      id: 2,
      tipo: 'processo',
      texto: 'Etapa 1: Executar Ação',
      x: 390,
      y: 220,
      cor: '#3b82f6'
    };
    const noDecisao = {
      id: 3,
      tipo: 'decisao',
      texto: 'Condição atendida?',
      x: 415,
      y: 350,
      cor: '#f59e0b'
    };

    setNos([noInicio, noProcesso, noDecisao]);
    setConexoes([
      { id: 'c1', de: 1, para: 2, rotulo: '' },
      { id: 'c2', de: 2, para: 3, rotulo: '' }
    ]);
    setModoEditor(true);
  };

  const carregarDiagramaParaEditar = (diag) => {
    setIdDiagramaAtual(diag.id_diagrama);
    setTituloDiagrama(diag.titulo || 'Sem título');
    setMateriaIdDiagrama(diag.id_materia ? String(diag.id_materia) : '');
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setNoSelecionadoId(null);
    setModoConectar(false);
    setNoOrigemConexao(null);

    const nosCarregados = Array.isArray(diag.nos) ? diag.nos : [];
    const conexoesCarregadas = Array.isArray(diag.conexoes) ? diag.conexoes : [];

    setNos(nosCarregados);
    setConexoes(conexoesCarregadas);
    setModoEditor(true);
  };

  // Adicionar Forma
  const adicionarForma = (tipo = 'processo') => {
    const config = FORMAS_CONFIG[tipo] || FORMAS_CONFIG.processo;
    const novoId = Date.now();

    let posX = 400;
    let posY = 200;

    // Se houver um nó selecionado, posiciona logo abaixo dele
    if (noSelecionadoId !== null) {
      const selecionado = nos.find(n => n.id === noSelecionadoId);
      if (selecionado) {
        posX = selecionado.x;
        posY = selecionado.y + 130;
      }
    } else if (nos.length > 0) {
      const ultimo = nos[nos.length - 1];
      posX = ultimo.x;
      posY = ultimo.y + 130;
    }

    const novoNo = {
      id: novoId,
      tipo,
      texto: tipo === 'decisao' ? 'Decisão?' : tipo === 'inicio_fim' ? 'Fim' : 'Nova Etapa',
      x: posX,
      y: posY,
      cor: config.corPadrao
    };

    setNos(prev => [...prev, novoNo]);
    setNoSelecionadoId(novoId);

    // Auto conecta se houver nó selecionado
    if (noSelecionadoId !== null) {
      const novaConexao = {
        id: `c_${Date.now()}`,
        de: noSelecionadoId,
        para: novoId,
        rotulo: ''
      };
      setConexoes(prev => [...prev, novaConexao]);
    }
  };

  // Excluir Nó
  const excluirNo = (idParaRemover) => {
    setNos(prev => prev.filter(n => n.id !== idParaRemover));
    setConexoes(prev => prev.filter(c => c.de !== idParaRemover && c.para !== idParaRemover));
    if (noSelecionadoId === idParaRemover) setNoSelecionadoId(null);
  };

  // Alterar Cor do Nó
  const alterarCorNo = (id, cor) => {
    setNos(prev => prev.map(n => (n.id === id ? { ...n, cor } : n)));
  };

  // Alterar Tipo do Nó
  const alterarTipoNo = (id, tipo) => {
    const config = FORMAS_CONFIG[tipo];
    setNos(prev => prev.map(n => (n.id === id ? { ...n, tipo, cor: config ? config.corPadrao : n.cor } : n)));
  };

  // Alterar Texto do Nó
  const alterarTextoNo = (id, texto) => {
    setNos(prev => prev.map(n => (n.id === id ? { ...n, texto } : n)));
  };

  // Gerenciamento de Conexões
  const iniciarOuCompletarConexao = (noId) => {
    if (!modoConectar) {
      setNoSelecionadoId(noId);
      return;
    }

    if (noOrigemConexao === null) {
      setNoOrigemConexao(noId);
    } else if (noOrigemConexao === noId) {
      setNoOrigemConexao(null);
    } else {
      // Cria a nova conexão direcionada
      const conexaoExistente = conexoes.some(c => c.de === noOrigemConexao && c.para === noId);
      if (!conexaoExistente) {
        const noOrigem = nos.find(n => n.id === noOrigemConexao);
        const rotuloPadrao = noOrigem && noOrigem.tipo === 'decisao' ? 'Sim' : '';
        const novaConexao = {
          id: `c_${Date.now()}`,
          de: noOrigemConexao,
          para: noId,
          rotulo: rotuloPadrao
        };
        setConexoes(prev => [...prev, novaConexao]);
      }
      setNoOrigemConexao(null);
      setModoConectar(false);
    }
  };

  const removerConexao = (conexaoId) => {
    setConexoes(prev => prev.filter(c => c.id !== conexaoId));
  };

  const alternarRotuloConexao = (conexaoId) => {
    setConexoes(prev =>
      prev.map(c => {
        if (c.id !== conexaoId) return c;
        if (!c.rotulo) return { ...c, rotulo: 'Sim' };
        if (c.rotulo === 'Sim') return { ...c, rotulo: 'Não' };
        if (c.rotulo === 'Não') return { ...c, rotulo: '' };
        return { ...c, rotulo: '' };
      })
    );
  };

  // Drag & Drop no Canvas
  const handleMouseDownNo = (e, noId) => {
    e.stopPropagation();
    if (modoConectar) {
      iniciarOuCompletarConexao(noId);
      return;
    }

    setNoSelecionadoId(noId);
    setArrastandoNoId(noId);
    dragPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseDownViewport = (e) => {
    if (e.target.closest('.fluxo-node-wrapper') || e.target.closest('.fluxo-toolbar-floating') || e.target.closest('.fluxo-zoom-controls')) {
      return;
    }
    setArrastandoFundo(true);
    dragPosRef.current = { x: e.clientX, y: e.clientY };
    setNoSelecionadoId(null);
    if (modoConectar) {
      setModoConectar(false);
      setNoOrigemConexao(null);
    }
  };

  const handleMouseMoveViewport = (e) => {
    if (arrastandoNoId !== null) {
      const deltaX = (e.clientX - dragPosRef.current.x) / zoom;
      const deltaY = (e.clientY - dragPosRef.current.y) / zoom;
      dragPosRef.current = { x: e.clientX, y: e.clientY };

      setNos(prev =>
        prev.map(n => {
          if (n.id === arrastandoNoId) {
            return {
              ...n,
              x: Math.round(n.x + deltaX),
              y: Math.round(n.y + deltaY)
            };
          }
          return n;
        })
      );
    } else if (arrastandoFundo) {
      const deltaX = e.clientX - dragPosRef.current.x;
      const deltaY = e.clientY - dragPosRef.current.y;
      dragPosRef.current = { x: e.clientX, y: e.clientY };
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
    }
  };

  const handleMouseUpViewport = () => {
    setArrastandoNoId(null);
    setArrastandoFundo(false);
  };

  // Zoom
  const aplicarZoom = (delta) => {
    setZoom(prev => {
      const novo = Math.min(Math.max(0.4, prev + delta), 2.2);
      return parseFloat(novo.toFixed(2));
    });
  };

  const resetarZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Salvar no Banco de Dados
  const salvarDiagrama = async () => {
    if (!tituloDiagrama.trim()) {
      Swal.fire('Atenção', 'Informe um título para o fluxograma.', 'warning');
      return;
    }

    const payload = {
      titulo: tituloDiagrama.trim(),
      id_materia: materiaIdDiagrama ? parseInt(materiaIdDiagrama) : null,
      nos,
      conexoes
    };

    try {
      let res;
      if (idDiagramaAtual) {
        res = await apiFetch(`diagramasfluxo/${idDiagramaAtual}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch('diagramasfluxo', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (data.id_diagrama) setIdDiagramaAtual(data.id_diagrama);

        Swal.fire({
          icon: 'success',
          title: 'Fluxograma Salvo!',
          text: 'Suas etapas e conexões foram salvas com sucesso.',
          timer: 1600,
          showConfirmButton: false
        });
        carregarDiagramas();
      } else {
        Swal.fire('Erro', 'Não foi possível salvar o fluxograma.', 'error');
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      Swal.fire('Erro', 'Falha na conexão com o servidor.', 'error');
    }
  };

  // Excluir Diagrama
  const excluirDiagrama = async (id, titulo) => {
    const confirm = await Swal.fire({
      title: 'Excluir Fluxograma?',
      text: `Tem certeza que deseja apagar "${titulo}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await apiFetch(`diagramasfluxo/${id}`, { method: 'DELETE' });
        if (res.ok) {
          Swal.fire('Excluído!', 'O fluxograma foi removido.', 'success');
          carregarDiagramas();
        }
      } catch (err) {
        Swal.fire('Erro', 'Falha ao excluir o fluxograma.', 'error');
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
          setMateriaIdDiagrama(String(data.id_materia || data.id));
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

  // Geometria de Nós e Setas
  const getCentroNo = (no) => {
    const config = FORMAS_CONFIG[no.tipo] || FORMAS_CONFIG.processo;
    return {
      x: no.x + config.largura / 2,
      y: no.y + config.altura / 2
    };
  };

  // Filtro
  const diagramasFiltrados = materiaFiltro === 'todas'
    ? diagramas
    : diagramas.filter(d => String(d.id_materia) === String(materiaFiltro));

  return (
    <div className="fluxo-container">
      {/* ==================== VISTA 1: GALERIA DE FLUXOGRAMAS ==================== */}
      {!modoEditor && (
        <>
          <div className="fluxo-header">
            <div className="fluxo-title-group">
              <h1>
                <i className="bi bi-diagram-2"></i> Diagramas de Fluxo (Fluxogramas)
              </h1>
              <p>Mapeie algoritmos, etapas lógicas e árvores de decisão passo a passo</p>
            </div>

            <div className="fluxo-header-actions">
              <button className="btn-voltar-metodos" onClick={voltarParaMetodos}>
                <i className="bi bi-arrow-left"></i> Voltar para Métodos
              </button>
              <button className="btn-novo-fluxo" onClick={abrirEditorNovo}>
                <i className="bi bi-plus-lg"></i> Novo Fluxograma
              </button>
            </div>
          </div>

          {/* Filtros por Matéria */}
          <div className="fluxo-filters">
            <button
              className={`filtro-pilula ${materiaFiltro === 'todas' ? 'ativo' : ''}`}
              onClick={() => setMateriaFiltro('todas')}
            >
              <span>Todas as Matérias</span>
              <span className="badge-contagem">{diagramas.length}</span>
            </button>
            {materias.map(mat => {
              const qtd = diagramas.filter(d => String(d.id_materia) === String(mat.id_materia || mat.id)).length;
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

          {/* Grid de Diagramas */}
          {carregando ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status"></div>
              <p className="mt-3 text-muted">Carregando fluxogramas...</p>
            </div>
          ) : diagramasFiltrados.length === 0 ? (
            <div className="fluxo-empty">
              <i className="bi bi-diagram-2"></i>
              <h3>Nenhum fluxograma encontrado</h3>
              <p>Crie um fluxograma para desenhar processos, regras condicionais e fluxos de estudo!</p>
              <button className="btn-novo-fluxo" onClick={abrirEditorNovo}>
                <i className="bi bi-plus-lg"></i> Criar Primeiro Fluxograma
              </button>
            </div>
          ) : (
            <div className="fluxo-grid">
              {diagramasFiltrados.map(diag => {
                const totalEtapas = Array.isArray(diag.nos) ? diag.nos.length : 0;
                const matCor = formatColor(diag.cor_materia);
                return (
                  <div
                    key={diag.id_diagrama}
                    className="fluxo-card"
                    onClick={() => carregarDiagramaParaEditar(diag)}
                  >
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
                        {diag.nome_materia || 'Geral'}
                      </span>
                      <span className="card-step-count">
                        <i className="bi bi-check2-circle"></i> {totalEtapas} etapas
                      </span>
                    </div>

                    <h3>{diag.titulo}</h3>

                    <div className="fluxo-card-meta">
                      <span>
                        <i className="bi bi-calendar3"></i>{' '}
                        {diag.data ? new Date(diag.data).toLocaleDateString('pt-BR') : 'Sem data'}
                      </span>
                      <button
                        className="btn-icon-card delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          excluirDiagrama(diag.id_diagrama, diag.titulo);
                        }}
                        title="Excluir fluxograma"
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

      {/* ==================== VISTA 2: EDITOR / CANVAS DO FLUXOGRAMA ==================== */}
      {modoEditor && (
        <div className="fluxo-editor-wrapper">
          {/* Top Bar do Editor */}
          <div className="editor-top-nav">
            <div className="editor-title-group">
              <button
                className="btn-voltar-metodos"
                onClick={() => setModoEditor(false)}
                title="Voltar para a lista"
              >
                <i className="bi bi-arrow-left"></i> Galeria
              </button>
              <input
                type="text"
                className="input-fluxo-titulo"
                placeholder="Título do Fluxograma..."
                value={tituloDiagrama}
                onChange={e => setTituloDiagrama(e.target.value)}
              />
            </div>

            <div className="editor-actions-group">
              {/* Seleção de Matéria */}
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto', minWidth: '150px' }}
                value={materiaIdDiagrama}
                onChange={e => {
                  if (e.target.value === '__NOVA__') {
                    setMostrarNovaMateria(true);
                  } else {
                    setMateriaIdDiagrama(e.target.value);
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

              <button
                className="btn btn-sm btn-warning text-white fw-bold"
                style={{ background: 'linear-gradient(135deg, #ffbd59, #f59e0b)', border: 'none', padding: '6px 18px' }}
                onClick={salvarDiagrama}
              >
                <i className="bi bi-cloud-arrow-up-fill me-1"></i> Salvar
              </button>
            </div>
          </div>

          {/* Modal Inline Nova Matéria */}
          {mostrarNovaMateria && (
            <div className="p-3 bg-light border-bottom d-flex align-items-center gap-2 justify-content-center">
              <strong className="text-warning small">Nova Matéria:</strong>
              <input
                type="text"
                className="form-control form-control-sm"
                style={{ maxWidth: 220 }}
                placeholder="Nome da Matéria..."
                value={novaMateriaNome}
                onChange={e => setNovaMateriaNome(e.target.value)}
              />
              <input
                type="color"
                className="form-control form-control-color form-control-sm"
                value={novaMateriaCor}
                onChange={e => setNovaMateriaCor(e.target.value)}
                title="Escolha a cor da matéria"
              />
              <button
                className="btn btn-sm btn-warning text-white fw-bold"
                onClick={salvarNovaMateria}
                disabled={salvandoMateria}
              >
                {salvandoMateria ? 'Criando...' : 'Adicionar'}
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setMostrarNovaMateria(false)}
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Barra Flutuante de Formas & Conexão */}
          <div className="fluxo-toolbar-floating">
            <button
              className="toolbar-btn-shape"
              onClick={() => adicionarForma('inicio_fim')}
              title="Adicionar nó Início / Fim (Terminador)"
            >
              <i className="bi bi-play-circle-fill text-success"></i> Início/Fim
            </button>

            <button
              className="toolbar-btn-shape"
              onClick={() => adicionarForma('processo')}
              title="Adicionar nó de Ação / Processo"
            >
              <i className="bi bi-square-fill text-primary"></i> Processo
            </button>

            <button
              className="toolbar-btn-shape"
              onClick={() => adicionarForma('decisao')}
              title="Adicionar nó de Decisão / Condição (Losango)"
            >
              <i className="bi bi-diamond-fill text-warning"></i> Decisão
            </button>

            <button
              className="toolbar-btn-shape"
              onClick={() => adicionarForma('entrada_saida')}
              title="Adicionar nó de Entrada / Saída de Dados"
            >
              <i className="bi bi-box-arrow-in-right text-purple" style={{ color: '#8b5cf6' }}></i> Dados
            </button>

            <div className="toolbar-divider" />

            <button
              className={`toolbar-btn-action ${modoConectar ? 'active' : ''}`}
              onClick={() => {
                setModoConectar(prev => !prev);
                setNoOrigemConexao(null);
              }}
              title="Clique para ligar duas etapas com seta direcionada"
            >
              <i className="bi bi-arrow-down-right"></i>
              {modoConectar ? 'Clique no Destino...' : 'Ligar Etapas'}
            </button>
          </div>

          {/* Canvas Interativo */}
          <div
            ref={viewportRef}
            className="fluxo-canvas-viewport"
            onMouseDown={handleMouseDownViewport}
            onMouseMove={handleMouseMoveViewport}
            onMouseUp={handleMouseUpViewport}
          >
            <div
              className="fluxo-canvas-world"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`
              }}
            >
              {/* Camada SVG de Conexões Direcionadas */}
              <svg className="fluxo-svg-layer">
                <defs>
                  <marker
                    id="seta-fluxo"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L7,3 z" fill="#64748b" />
                  </marker>
                  <marker
                    id="seta-fluxo-hover"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L7,3 z" fill="#ef4444" />
                  </marker>
                </defs>

                {conexoes.map(conexao => {
                  const noOrigem = nos.find(n => n.id === conexao.de);
                  const noDestino = nos.find(n => n.id === conexao.para);
                  if (!noOrigem || !noDestino) return null;

                  const c1 = getCentroNo(noOrigem);
                  const c2 = getCentroNo(noDestino);

                  // Vetor de direção e ajuste de offset na ponta para a seta não ficar escondida
                  const dx = c2.x - c1.x;
                  const dy = c2.y - c1.y;
                  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                  const ux = dx / dist;
                  const uy = dy / dist;

                  const raioOrigem = 30;
                  const raioDestino = 42;

                  const startX = c1.x + ux * raioOrigem;
                  const startY = c1.y + uy * raioOrigem;
                  const endX = c2.x - ux * raioDestino;
                  const endY = c2.y - uy * raioDestino;

                  const midX = (startX + endX) / 2;
                  const midY = (startY + endY) / 2;

                  return (
                    <g key={conexao.id}>
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        className="fluxo-arrow-line"
                        markerEnd="url(#seta-fluxo)"
                        onClick={() => removerConexao(conexao.id)}
                        title="Clique na linha para remover conexão"
                      />

                      {/* Rótulo da conexão (Sim / Não / Personalizado) */}
                      <foreignObject
                        x={midX - 35}
                        y={midY - 14}
                        width="70"
                        height="28"
                        className="fluxo-arrow-label-container"
                        onClick={(e) => {
                          e.stopPropagation();
                          alternarRotuloConexao(conexao.id);
                        }}
                      >
                        <div
                          className={`fluxo-arrow-label ${
                            conexao.rotulo === 'Sim' ? 'sim' : conexao.rotulo === 'Não' ? 'nao' : ''
                          }`}
                          title="Clique para alternar rótulo (Sim / Não / Vazio)"
                        >
                          <span>{conexao.rotulo || '...'}</span>
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </svg>

              {/* Nós do Fluxograma */}
              {nos.map(no => {
                const isSelected = noSelecionadoId === no.id;
                const isSource = noOrigemConexao === no.id;
                const config = FORMAS_CONFIG[no.tipo] || FORMAS_CONFIG.processo;

                return (
                  <div
                    key={no.id}
                    className={`fluxo-node-wrapper ${isSelected ? 'selected' : ''} ${
                      isSource ? 'connecting-source' : ''
                    }`}
                    style={{
                      left: no.x,
                      top: no.y
                    }}
                    onMouseDown={(e) => handleMouseDownNo(e, no.id)}
                  >
                    {/* Barra Rápida de Ferramentas ao Selecionar o Nó */}
                    {isSelected && (
                      <div className="node-quick-bar" onMouseDown={e => e.stopPropagation()}>
                        <div className="mini-palette">
                          {CORES_PALETA.map(cor => (
                            <span
                              key={cor}
                              className="mini-color-dot"
                              style={{ backgroundColor: cor }}
                              onClick={() => alterarCorNo(no.id, cor)}
                            />
                          ))}
                        </div>

                        {/* Mudar tipo de forma */}
                        <button
                          className="btn-node-tool"
                          onClick={() => {
                            const tipos = ['inicio_fim', 'processo', 'decisao', 'entrada_saida'];
                            const proxTipo = tipos[(tipos.indexOf(no.tipo) + 1) % tipos.length];
                            alterarTipoNo(no.id, proxTipo);
                          }}
                          title="Mudar forma geométrica"
                        >
                          <i className="bi bi-arrow-repeat"></i>
                        </button>

                        {/* Próxima etapa conectada */}
                        <button
                          className="btn-node-tool"
                          onClick={() => adicionarForma('processo')}
                          title="Adicionar próxima etapa conectada"
                        >
                          <i className="bi bi-plus-circle-fill text-warning"></i>
                        </button>

                        {/* Excluir nó */}
                        <button
                          className="btn-node-tool delete"
                          onClick={() => excluirNo(no.id)}
                          title="Excluir nó"
                        >
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      </div>
                    )}

                    {/* RENDERIZAÇÃO GEOMÉTRICA CONFORME O TIPO */}
                    {no.tipo === 'inicio_fim' && (
                      <div
                        className="node-shape-inicio_fim"
                        style={{ borderColor: no.cor, boxShadow: `0 6px 15px ${no.cor}25` }}
                      >
                        <span className="node-type-indicator" style={{ color: no.cor }}>
                          {config.nome}
                        </span>
                        <input
                          type="text"
                          className="node-title-input"
                          value={no.texto}
                          onChange={e => alterarTextoNo(no.id, e.target.value)}
                          placeholder="Início / Fim..."
                        />
                      </div>
                    )}

                    {no.tipo === 'processo' && (
                      <div
                        className="node-shape-processo"
                        style={{ borderColor: no.cor, boxShadow: `0 6px 15px ${no.cor}25` }}
                      >
                        <span className="node-type-indicator" style={{ color: no.cor }}>
                          {config.nome}
                        </span>
                        <input
                          type="text"
                          className="node-title-input"
                          value={no.texto}
                          onChange={e => alterarTextoNo(no.id, e.target.value)}
                          placeholder="Ação / Processo..."
                        />
                      </div>
                    )}

                    {no.tipo === 'decisao' && (
                      <div className="node-shape-decisao">
                        <div
                          className="diamond-bg"
                          style={{ borderColor: no.cor, boxShadow: `0 6px 15px ${no.cor}25` }}
                        />
                        <div className="diamond-content">
                          <span className="node-type-indicator" style={{ color: no.cor }}>
                            Decisão
                          </span>
                          <input
                            type="text"
                            className="node-title-input"
                            value={no.texto}
                            onChange={e => alterarTextoNo(no.id, e.target.value)}
                            placeholder="Condição?"
                          />
                        </div>
                      </div>
                    )}

                    {no.tipo === 'entrada_saida' && (
                      <div
                        className="node-shape-entrada_saida"
                        style={{ borderColor: no.cor, boxShadow: `0 6px 15px ${no.cor}25` }}
                      >
                        <div className="parallelogram-content">
                          <span className="node-type-indicator" style={{ color: no.cor }}>
                            Entrada/Saída
                          </span>
                          <input
                            type="text"
                            className="node-title-input"
                            value={no.texto}
                            onChange={e => alterarTextoNo(no.id, e.target.value)}
                            placeholder="Dados / Variáveis..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Controles de Zoom Flutuantes */}
            <div className="fluxo-zoom-controls">
              <button className="btn-zoom" onClick={() => aplicarZoom(0.15)} title="Aproximar zoom">
                <i className="bi bi-zoom-in"></i>
              </button>
              <span className="zoom-level-text">{Math.round(zoom * 100)}%</span>
              <button className="btn-zoom" onClick={() => aplicarZoom(-0.15)} title="Afastar zoom">
                <i className="bi bi-zoom-out"></i>
              </button>
              <button className="btn-zoom" onClick={resetarZoom} title="Resetar zoom 100%">
                <i className="bi bi-arrows-fullscreen"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

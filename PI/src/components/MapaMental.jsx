import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { apiFetch } from '../api';
import './MapaMental.css';

const CORES_PALETA = [
  '#3b82f6', // Azul
  '#10b981', // Verde
  '#f59e0b', // Âmbar / Laranja
  '#ef4444', // Vermelho
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#06b6d4', // Ciano
  '#64748b'  // Grafite
];

export default function MapaMental() {
  const [mapas, setMapas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [materiaFiltro, setMateriaFiltro] = useState('todas');
  const [carregando, setCarregando] = useState(true);

  // Controle de Visualização (Galeria vs Editor)
  const [modoEditor, setModoEditor] = useState(false);

  // Estado do Mapa Atual no Editor
  const [idMapaAtual, setIdMapaAtual] = useState(null);
  const [tituloMapa, setTituloMapa] = useState('');
  const [materiaIdMapa, setMateriaIdMapa] = useState('');
  const [nos, setNos] = useState([]);
  const [conexoes, setConexoes] = useState([]);

  // Interações no Canvas
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [noSelecionadoId, setNoSelecionadoId] = useState(null);
  const [modoConectar, setModoConectar] = useState(false);
  const [noOrigemConexao, setNoOrigemConexao] = useState(null);
  const [editandoTextoNoId, setEditandoTextoNoId] = useState(null);

  // Arrastar
  const [arrastandoNoId, setArrastandoNoId] = useState(null);
  const [arrastandoFundo, setArrastandoFundo] = useState(false);
  const dragPosRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef(null);

  // Nova Matéria Inline
  const [mostrarNovaMateria, setMostrarNovaMateria] = useState(false);
  const [novaMateriaNome, setNovaMateriaNome] = useState('');
  const [novaMateriaCor, setNovaMateriaCor] = useState('#9f042c');
  const [salvandoMateria, setSalvandoMateria] = useState(false);

  const formatColor = (cor) => {
    if (!cor) return 'var(--cor-primaria, #3b82f6)';
    if (cor.startsWith('0x') || cor.startsWith('0X')) {
      return '#' + cor.slice(-6);
    }
    return cor;
  };

  // Carregar Matérias e Mapas
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

  const carregarMapas = async () => {
    setCarregando(true);
    try {
      const res = await apiFetch('mapasmentais');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMapas(data);
      }
    } catch (err) {
      console.error('Erro ao buscar mapas mentais:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarMaterias();
    carregarMapas();
  }, []);

  const voltarParaMetodos = () => {
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'metodos' }));
  };

  // ==================== OPERAÇÕES DO EDITOR ====================

  const abrirEditorNovo = () => {
    setIdMapaAtual(null);
    setTituloMapa('Meu Mapa Mental');
    setMateriaIdMapa(materias.length > 0 ? String(materias[0].id_materia || materias[0].id) : '');
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setNoSelecionadoId(0);
    setModoConectar(false);
    setNoOrigemConexao(null);
    setEditandoTextoNoId(null);

    // Cria o nó central inicial no centro do canvas
    const noCentral = {
      id: 0,
      x: 450,
      y: 260,
      titulo: 'Tema Central',
      anotacoes: '',
      cor: 'var(--cor-primaria, #3b82f6)',
      isCentral: true
    };
    setNos([noCentral]);
    setConexoes([]);
    setModoEditor(true);
  };

  const carregarMapaParaEditar = (mapa) => {
    setIdMapaAtual(mapa.id_mapa);
    setTituloMapa(mapa.titulo || 'Sem título');
    setMateriaIdMapa(mapa.id_materia ? String(mapa.id_materia) : '');
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setNoSelecionadoId(null);
    setModoConectar(false);
    setNoOrigemConexao(null);
    setEditandoTextoNoId(null);

    const nosCarregados = Array.isArray(mapa.nos) ? mapa.nos : [];
    const conexoesCarregadas = Array.isArray(mapa.conexoes) ? mapa.conexoes : [];

    setNos(nosCarregados);
    setConexoes(conexoesCarregadas);
    setModoEditor(true);
  };

  // Adicionar Nó
  const adicionarNo = (isSubtopico = false) => {
    const novoId = Date.now();
    let posX = 450;
    let posY = 260;
    let corDoPai = '#3b82f6';
    let conectarAoId = null;

    if (isSubtopico && noSelecionadoId !== null) {
      const pai = nos.find(n => n.id === noSelecionadoId);
      if (pai) {
        // Posiciona ao lado do pai
        const offsetAngulo = Math.random() * Math.PI * 2;
        posX = pai.x + Math.cos(offsetAngulo) * 160;
        posY = pai.y + Math.sin(offsetAngulo) * 140;
        corDoPai = pai.cor || '#3b82f6';
        conectarAoId = pai.id;
      }
    } else {
      // Se não for subtópico, adiciona ao redor do centro
      posX += (Math.random() - 0.5) * 300;
      posY += (Math.random() - 0.5) * 200;
      // Conecta ao nó central se houver
      const central = nos.find(n => n.isCentral);
      if (central) conectarAoId = central.id;
    }

    const novo = {
      id: novoId,
      x: posX,
      y: posY,
      titulo: 'Novo Tópico',
      anotacoes: '',
      cor: corDoPai,
      isCentral: false
    };

    setNos(prev => [...prev, novo]);
    if (conectarAoId !== null) {
      setConexoes(prev => [...prev, { de: conectarAoId, para: novoId }]);
    }
    setNoSelecionadoId(novoId);
    setEditandoTextoNoId(novoId);
  };

  // Excluir Nó Selecionado
  const excluirNoSelecionado = () => {
    if (noSelecionadoId === null) return;
    setNos(prev => prev.filter(n => n.id !== noSelecionadoId));
    setConexoes(prev => prev.filter(c => c.de !== noSelecionadoId && c.para !== noSelecionadoId));
    setNoSelecionadoId(null);
  };

  // Conectar / Desconectar Nós
  const handleCliqueNo = (e, noId) => {
    e.stopPropagation();

    if (modoConectar) {
      if (noOrigemConexao === null) {
        setNoOrigemConexao(noId);
      } else if (noOrigemConexao === noId) {
        // Clicou no mesmo, cancela origem
        setNoOrigemConexao(null);
      } else {
        // Criar ou remover conexão entre noOrigemConexao e noId
        const jaConectado = conexoes.some(
          c => (c.de === noOrigemConexao && c.para === noId) || (c.de === noId && c.para === noOrigemConexao)
        );

        if (jaConectado) {
          setConexoes(prev => prev.filter(
            c => !((c.de === noOrigemConexao && c.para === noId) || (c.de === noId && c.para === noOrigemConexao))
          ));
        } else {
          setConexoes(prev => [...prev, { de: noOrigemConexao, para: noId }]);
        }

        setNoOrigemConexao(null);
        setModoConectar(false);
      }
      return;
    }

    setNoSelecionadoId(noId);
  };

  // Alterar cor do nó selecionado
  const alterarCorSelecionado = (cor) => {
    if (noSelecionadoId === null) return;
    setNos(prev => prev.map(n => n.id === noSelecionadoId ? { ...n, cor } : n));
  };

  // Salvar Mapa Mental
  const salvarMapa = async () => {
    if (!tituloMapa.trim()) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Informe um título para o mapa!' });
      return;
    }

    const payload = {
      titulo: tituloMapa.trim(),
      id_materia: materiaIdMapa ? Number(materiaIdMapa) : null,
      nos,
      conexoes
    };

    try {
      const url = idMapaAtual ? `mapasmentais/${idMapaAtual}` : 'mapasmentais';
      const method = idMapaAtual ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.id_mapa) setIdMapaAtual(data.id_mapa);
        carregarMapas();
        Swal.fire({
          icon: 'success',
          title: 'Mapa Mental salvo!',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        Swal.fire('Erro', 'Não foi possível salvar o mapa mental.', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Erro', 'Erro de conexão.', 'error');
    }
  };

  // Excluir Mapa Mental
  const excluirMapa = async (id, titulo) => {
    const confirm = await Swal.fire({
      title: `Excluir "${titulo}"?`,
      text: 'Essa ação não pode ser desfeita.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await apiFetch(`mapasmentais/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setMapas(prev => prev.filter(m => m.id_mapa !== id));
          if (idMapaAtual === id) setModoEditor(false);
          Swal.fire({ icon: 'success', title: 'Excluído!', timer: 1200, showConfirmButton: false, toast: true, position: 'top-end' });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Criar Matéria Inline
  const handleCriarMateria = async () => {
    if (!novaMateriaNome.trim()) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Digite o nome da matéria!' });
      return;
    }
    setSalvandoMateria(true);
    try {
      const res = await apiFetch('materias', {
        method: 'POST',
        body: JSON.stringify({ nome: novaMateriaNome.trim(), cor: novaMateriaCor })
      });
      if (res.ok) {
        const data = await res.json();
        const novoId = data.id_materia || data.id;
        const nova = { id_materia: novoId, id: novoId, nome: novaMateriaNome.trim(), cor: novaMateriaCor };
        setMaterias(prev => [...prev, nova]);
        setMateriaIdMapa(String(novoId));
        setMostrarNovaMateria(false);
        setNovaMateriaNome('');
        Swal.fire({ icon: 'success', title: 'Matéria cadastrada!', timer: 1200, showConfirmButton: false, toast: true, position: 'top-end' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSalvandoMateria(false);
    }
  };

  // ==================== EVENTOS DE ARRASTAR (MOUSE & PAN) ====================

  const handleMouseDownViewport = (e) => {
    if (e.target === viewportRef.current || e.target.tagName === 'svg' || e.target.classList.contains('mapa-nodes-container')) {
      setArrastandoFundo(true);
      dragPosRef.current = { x: e.clientX, y: e.clientY };
      setNoSelecionadoId(null);
      setEditandoTextoNoId(null);
    }
  };

  const handleMouseDownNo = (e, noId) => {
    if (modoConectar) return;
    e.stopPropagation();
    setArrastandoNoId(noId);
    setNoSelecionadoId(noId);
    dragPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    const dx = (e.clientX - dragPosRef.current.x) / zoom;
    const dy = (e.clientY - dragPosRef.current.y) / zoom;
    dragPosRef.current = { x: e.clientX, y: e.clientY };

    if (arrastandoNoId !== null) {
      setNos(prev => prev.map(n => {
        if (n.id === arrastandoNoId) {
          return { ...n, x: n.x + dx, y: n.y + dy };
        }
        return n;
      }));
    } else if (arrastandoFundo) {
      setPanOffset(prev => ({ x: prev.x + dx * zoom, y: prev.y + dy * zoom }));
    }
  };

  const handleMouseUp = () => {
    setArrastandoNoId(null);
    setArrastandoFundo(false);
  };

  // Cálculo das curvas Bezier entre nós
  const gerarLinhaConexao = (con) => {
    const de = nos.find(n => n.id === con.de);
    const para = nos.find(n => n.id === con.para);
    if (!de || !para) return null;

    // Centro dos nós
    const x1 = de.x + 70;
    const y1 = de.y + 25;
    const x2 = para.x + 70;
    const y2 = para.y + 25;

    // Ponto de controle para curvatura suave
    const dx = Math.abs(x2 - x1) * 0.5;
    const cx1 = x1 > x2 ? x1 - dx : x1 + dx;
    const cy1 = y1;
    const cx2 = x1 > x2 ? x2 + dx : x2 - dx;
    const cy2 = y2;

    const path = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
    const corLinha = de.cor || 'var(--cor-primaria, #3b82f6)';

    return (
      <path
        key={`${con.de}-${con.para}`}
        d={path}
        className="mapa-connection-line"
        style={{ stroke: corLinha }}
      />
    );
  };

  // Filtro
  const mapasFiltrados = mapas.filter(m => {
    if (materiaFiltro === 'todas') return true;
    return String(m.id_materia) === String(materiaFiltro);
  });

  return (
    <div className="mapamental-container">
      {/* ==================== VISTA 1: GALERIA DE MAPAS ==================== */}
      {!modoEditor && (
        <>
          <div className="mapamental-header">
            <div className="mapamental-title-area">
              <h1>
                <i className="bi bi-diagram-3-fill text-primary"></i> 
                Meus Mapas Mentais
              </h1>
              <p>Organize conceitos, resumos visuais e conexões entre ideias</p>
            </div>
            <div className="mapamental-actions">
              <button className="btn-voltar-metodos" onClick={voltarParaMetodos}>
                <i className="bi bi-arrow-left"></i> Métodos
              </button>
              <button className="btn-novo-mapa" onClick={abrirEditorNovo}>
                <i className="bi bi-plus-lg"></i> Novo Mapa Mental
              </button>
            </div>
          </div>

          {/* Filtro por Matéria */}
          <div className="mapamental-filtros">
            <button
              className={`filtro-pill ${materiaFiltro === 'todas' ? 'ativo' : ''}`}
              onClick={() => setMateriaFiltro('todas')}
            >
              <i className="bi bi-grid-fill"></i> Todos ({mapas.length})
            </button>
            {materias.map(m => {
              const mId = String(m.id_materia || m.id);
              const count = mapas.filter(mp => String(mp.id_materia) === mId).length;
              return (
                <button
                  key={mId}
                  className={`filtro-pill ${materiaFiltro === mId ? 'ativo' : ''}`}
                  onClick={() => setMateriaFiltro(mId)}
                >
                  <span
                    style={{
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      background: formatColor(m.cor)
                    }}
                  ></span>
                  {m.nome} ({count})
                </button>
              );
            })}
          </div>

          {/* Grid de Mapas */}
          {carregando ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-3 text-muted">Carregando seus mapas mentais...</p>
            </div>
          ) : mapasFiltrados.length === 0 ? (
            <div className="mnemonica-empty">
              <i className="bi bi-diagram-3"></i>
              <h3>Nenhum mapa mental encontrado</h3>
              <p>Crie um mapa mental para conectar conceitos e acelerar sua retenção visual!</p>
              <button className="btn-novo-mapa" onClick={abrirEditorNovo}>
                <i className="bi bi-plus-lg"></i> Criar Primeiro Mapa
              </button>
            </div>
          ) : (
            <div className="mapamental-grid">
              {mapasFiltrados.map(mapa => {
                const totalNos = Array.isArray(mapa.nos) ? mapa.nos.length : 0;
                const matCor = formatColor(mapa.cor_materia);
                return (
                  <div
                    key={mapa.id_mapa}
                    className="mapamental-card"
                    onClick={() => carregarMapaParaEditar(mapa)}
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
                        {mapa.nome_materia || 'Geral'}
                      </span>
                      <span className="card-step-count">
                        <i className="bi bi-circle-fill" style={{ fontSize: '0.6rem' }}></i> {totalNos} tópicos
                      </span>
                    </div>

                    <h3>{mapa.titulo}</h3>

                    <div className="mapa-card-meta">
                      <span>
                        <i className="bi bi-calendar3"></i>{' '}
                        {mapa.data ? new Date(mapa.data).toLocaleDateString('pt-BR') : 'Sem data'}
                      </span>
                      <button
                        className="btn-icon-card delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          excluirMapa(mapa.id_mapa, mapa.titulo);
                        }}
                        title="Excluir mapa mental"
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

      {/* ==================== VISTA 2: EDITOR / CANVAS DO MAPA ==================== */}
      {modoEditor && (
        <div className="mapa-editor-wrapper">
          {/* Top Bar do Editor */}
          <div className="editor-top-nav">
            <div className="editor-title-group">
              <button
                className="btn-voltar-metodos"
                onClick={() => setModoEditor(false)}
                title="Voltar para a lista de mapas"
              >
                <i className="bi bi-arrow-left"></i> Voltar
              </button>
              <input
                type="text"
                className="input-mapa-titulo"
                placeholder="Título do Mapa Mental..."
                value={tituloMapa}
                onChange={e => setTituloMapa(e.target.value)}
              />
            </div>

            <div className="editor-actions-group">
              {/* Seleção de Matéria */}
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto', minWidth: '150px' }}
                value={materiaIdMapa}
                onChange={e => {
                  if (e.target.value === '__NOVA__') {
                    setMostrarNovaMateria(true);
                  } else {
                    setMateriaIdMapa(e.target.value);
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
                className="btn btn-sm btn-primary"
                style={{ background: 'var(--cor-primaria, #3b82f6)', border: 'none', padding: '6px 16px', fontWeight: 'bold' }}
                onClick={salvarMapa}
              >
                <i className="bi bi-cloud-arrow-up-fill me-1"></i> Salvar
              </button>
            </div>
          </div>

          {/* Modal Inline Nova Matéria */}
          {mostrarNovaMateria && (
            <div className="p-3 bg-light border-bottom d-flex align-items-center gap-2 justify-content-center">
              <strong className="text-primary small">Nova Matéria:</strong>
              <input
                type="text"
                className="form-control form-control-sm"
                style={{ maxWidth: '180px' }}
                placeholder="Nome da matéria"
                value={novaMateriaNome}
                onChange={e => setNovaMateriaNome(e.target.value)}
                autoFocus
              />
              <input
                type="color"
                className="form-control form-control-color form-control-sm"
                value={novaMateriaCor}
                onChange={e => setNovaMateriaCor(e.target.value)}
                style={{ width: '36px' }}
              />
              <button className="btn btn-sm btn-primary" onClick={handleCriarMateria} disabled={salvandoMateria}>
                Salvar
              </button>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setMostrarNovaMateria(false)}>
                Cancelar
              </button>
            </div>
          )}

          {/* Barra de Ferramentas Flutuante */}
          <div className="canvas-floating-toolbar">
            <button
              className="btn-tool"
              onClick={() => adicionarNo(false)}
              title="Criar novo tópico"
            >
              <i className="bi bi-plus-circle-fill text-primary"></i> + Tópico
            </button>
            <button
              className="btn-tool"
              onClick={() => adicionarNo(true)}
              disabled={noSelecionadoId === null}
              title="Adicionar ramo filho conectado ao nó selecionado"
            >
              <i className="bi bi-diagram-2 text-success"></i> + Subtópico
            </button>
            <button
              className={`btn-tool ${modoConectar ? 'active' : ''}`}
              onClick={() => {
                setModoConectar(!modoConectar);
                setNoOrigemConexao(null);
              }}
              title="Clique para ligar dois nós com uma linha curva"
            >
              <i className="bi bi-bezier2"></i>{' '}
              {modoConectar ? (noOrigemConexao !== null ? 'Selecione o destino' : 'Selecione a origem') : 'Conectar Nós'}
            </button>
            <button
              className="btn-tool danger"
              onClick={excluirNoSelecionado}
              disabled={noSelecionadoId === null}
              title="Remover nó selecionado"
            >
              <i className="bi bi-trash"></i> Excluir
            </button>

            <div className="toolbar-separator"></div>

            {/* Paleta de Cores */}
            <div className="color-picker-row" title="Mudar cor do nó selecionado">
              {CORES_PALETA.map(cor => (
                <div
                  key={cor}
                  className="color-dot"
                  style={{ background: cor }}
                  onClick={() => alterarCorSelecionado(cor)}
                ></div>
              ))}
            </div>
          </div>

          {/* Área Interativa do Canvas */}
          <div
            ref={viewportRef}
            className={`mapa-canvas-viewport ${arrastandoFundo ? 'panning' : ''}`}
            onMouseDown={handleMouseDownViewport}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <div
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                width: '100%',
                height: '100%',
                position: 'relative'
              }}
            >
              {/* Camada SVG para as conexões */}
              <svg className="mapa-svg-layer">
                {conexoes.map(con => gerarLinhaConexao(con))}
              </svg>

              {/* Camada de Nós */}
              <div className="mapa-nodes-container">
                {nos.map(no => {
                  const isSelected = no.id === noSelecionadoId;
                  const isSource = modoConectar && noOrigemConexao === no.id;
                  const noCor = no.cor || 'var(--cor-primaria, #3b82f6)';

                  return (
                    <div
                      key={no.id}
                      className={`mapa-node ${no.isCentral ? 'is-central' : ''} ${isSelected ? 'selected' : ''} ${isSource ? 'connecting-source' : ''}`}
                      style={{
                        left: `${no.x}px`,
                        top: `${no.y}px`,
                        borderColor: noCor,
                        borderLeftWidth: no.isCentral ? '4px' : '4px'
                      }}
                      onMouseDown={e => handleMouseDownNo(e, no.id)}
                      onClick={e => handleCliqueNo(e, no.id)}
                      onDoubleClick={e => {
                        e.stopPropagation();
                        setEditandoTextoNoId(no.id);
                      }}
                    >
                      {/* Botão de rápido subtópico ao passar o mouse */}
                      <button
                        className="node-quick-btn"
                        style={{ background: noCor }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoSelecionadoId(no.id);
                          adicionarNo(true);
                        }}
                        title="Puxar subtópico filho"
                      >
                        +
                      </button>

                      {editandoTextoNoId === no.id ? (
                        <input
                          type="text"
                          className="input-node-inline"
                          value={no.titulo}
                          autoFocus
                          onChange={e => {
                            const val = e.target.value;
                            setNos(prev => prev.map(n => n.id === no.id ? { ...n, titulo: val } : n));
                          }}
                          onBlur={() => setEditandoTextoNoId(null)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') setEditandoTextoNoId(null);
                          }}
                        />
                      ) : (
                        <div className="node-title-text" style={{ color: no.isCentral ? noCor : '#1e293b' }}>
                          {no.titulo}
                        </div>
                      )}

                      {no.anotacoes && (
                        <div className="node-notes-text">{no.anotacoes}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Controles de Zoom Flutuantes no Canto Inferior */}
            <div className="canvas-bottom-controls">
              <button
                className="btn-zoom"
                onClick={() => setZoom(prev => Math.max(0.4, prev - 0.15))}
                title="Diminuir Zoom"
              >
                <i className="bi bi-dash"></i>
              </button>
              <span className="zoom-indicator-text">{Math.round(zoom * 100)}%</span>
              <button
                className="btn-zoom"
                onClick={() => setZoom(prev => Math.min(2.5, prev + 0.15))}
                title="Aumentar Zoom"
              >
                <i className="bi bi-plus"></i>
              </button>
              <button
                className="btn-zoom"
                onClick={() => {
                  setZoom(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                title="Resetar Zoom e Centralizar"
              >
                <i className="bi bi-aspect-ratio"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

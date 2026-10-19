import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { apiFetch } from '../api';
import './Mnemonica.css';

export default function Mnemonica() {
  const [mnemonicas, setMnemonicas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [materiaFiltro, setMateriaFiltro] = useState('todas');
  const [carregando, setCarregando] = useState(true);

  // Modal de Criação / Edição
  const [modalCriacaoAberto, setModalCriacaoAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formMateriaId, setFormMateriaId] = useState('');
  const [formItens, setFormItens] = useState([
    { ordem: 1, termo: '', ancora: '', descricao: '' },
    { ordem: 2, termo: '', ancora: '', descricao: '' }
  ]);

  // Criação inline de matéria no modal
  const [mostrarNovaMateria, setMostrarNovaMateria] = useState(false);
  const [novaMateriaNome, setNovaMateriaNome] = useState('');
  const [novaMateriaCor, setNovaMateriaCor] = useState('#9f042c');
  const [salvandoMateria, setSalvandoMateria] = useState(false);

  // Modo Estudo (Ocultar / Revelar)
  const [modoEstudoAberto, setModoEstudoAberto] = useState(false);
  const [sequenciaEstudo, setSequenciaEstudo] = useState(null);
  const [passoIndice, setPassoIndice] = useState(0);
  const [termoBorrado, setTermoBorrado] = useState(true);

  // Modo Desafio (Jogo de Ordenação)
  const [modoJogoAberto, setModoJogoAberto] = useState(false);
  const [sequenciaJogo, setSequenciaJogo] = useState(null);
  const [itensJogo, setItensJogo] = useState([]);
  const [jogoVerificado, setJogoVerificado] = useState(false);
  const [jogoPontuacao, setJogoPontuacao] = useState(null);

  // Formatar cor
  const formatColor = (cor) => {
    if (!cor) return 'var(--cor-primaria, #3b82f6)';
    if (cor.startsWith('0x') || cor.startsWith('0X')) {
      return '#' + cor.slice(-6);
    }
    return cor;
  };

  // Carregar dados
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

  const carregarMnemonicas = async () => {
    setCarregando(true);
    try {
      const res = await apiFetch('mnemonicas');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMnemonicas(data);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar mnemônicas:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarMaterias();
    carregarMnemonicas();
  }, []);

  const voltarParaMetodos = () => {
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'metodos' }));
  };

  // Manipulação de Passos no Form
  const adicionarPasso = () => {
    setFormItens(prev => [
      ...prev,
      { ordem: prev.length + 1, termo: '', ancora: '', descricao: '' }
    ]);
  };

  const removerPasso = (index) => {
    if (formItens.length <= 2) {
      Swal.fire({
        icon: 'warning',
        title: 'Mínimo de 2 passos',
        text: 'Uma sequência deve ter pelo menos 2 passos!',
        confirmButtonColor: 'var(--cor-primaria)'
      });
      return;
    }
    setFormItens(prev => {
      const nova = prev.filter((_, i) => i !== index);
      return nova.map((item, i) => ({ ...item, ordem: i + 1 }));
    });
  };

  const moverPasso = (index, direcao) => {
    const novoIndex = index + direcao;
    if (novoIndex < 0 || novoIndex >= formItens.length) return;

    setFormItens(prev => {
      const copia = [...prev];
      const temp = copia[index];
      copia[index] = copia[novoIndex];
      copia[novoIndex] = temp;
      return copia.map((item, i) => ({ ...item, ordem: i + 1 }));
    });
  };

  const atualizarItemForm = (index, campo, valor) => {
    setFormItens(prev => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
  };

  // Abrir Modal de Criação ou Edição
  const abrirModalForm = (seq = null) => {
    setMostrarNovaMateria(false);
    setNovaMateriaNome('');
    if (seq) {
      setEditandoId(seq.id_mnemonica);
      setFormTitulo(seq.titulo);
      setFormDescricao(seq.descricao || '');
      setFormMateriaId(seq.id_materia ? String(seq.id_materia) : '');
      const itensCarregados = Array.isArray(seq.itens) ? seq.itens : [];
      setFormItens(itensCarregados.length > 0 ? itensCarregados : [
        { ordem: 1, termo: '', ancora: '', descricao: '' },
        { ordem: 2, termo: '', ancora: '', descricao: '' }
      ]);
    } else {
      setEditandoId(null);
      setFormTitulo('');
      setFormDescricao('');
      setFormMateriaId(materias.length > 0 ? String(materias[0].id_materia || materias[0].id) : '');
      setFormItens([
        { ordem: 1, termo: '', ancora: '', descricao: '' },
        { ordem: 2, termo: '', ancora: '', descricao: '' }
      ]);
    }
    setModalCriacaoAberto(true);
  };

  // Criar nova matéria inline
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
        setFormMateriaId(String(novoId));
        setMostrarNovaMateria(false);
        setNovaMateriaNome('');
        Swal.fire({ icon: 'success', title: 'Matéria criada!', timer: 1200, showConfirmButton: false, toast: true, position: 'top-end' });
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Erro', 'Não foi possível salvar a matéria.', 'error');
    } finally {
      setSalvandoMateria(false);
    }
  };

  // Salvar Sequência
  const salvarSequencia = async () => {
    if (!formTitulo.trim()) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Informe o título da sequência!' });
      return;
    }

    const passosValidos = formItens.filter(it => it.termo && it.termo.trim() !== '');
    if (passosValidos.length < 2) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Preencha pelo menos 2 passos com termos válidos!' });
      return;
    }

    const payload = {
      id_materia: formMateriaId ? Number(formMateriaId) : null,
      titulo: formTitulo.trim(),
      descricao: formDescricao.trim() || null,
      itens: passosValidos.map((it, i) => ({
        ordem: i + 1,
        termo: it.termo.trim(),
        ancora: (it.ancora || '').trim(),
        descricao: (it.descricao || '').trim()
      }))
    };

    try {
      const url = editandoId ? `mnemonicas/${editandoId}` : 'mnemonicas';
      const method = editandoId ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setModalCriacaoAberto(false);
        carregarMnemonicas();
        Swal.fire({
          icon: 'success',
          title: editandoId ? 'Sequência atualizada!' : 'Sequência criada com sucesso!',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        Swal.fire('Erro', 'Erro ao salvar sequência.', 'error');
      }
    } catch (err) {
      console.error('Erro ao salvar sequência:', err);
      Swal.fire('Erro', 'Erro de conexão com o servidor.', 'error');
    }
  };

  // Excluir Sequência
  const excluirSequencia = async (id, titulo) => {
    const confirm = await Swal.fire({
      title: `Excluir "${titulo}"?`,
      text: 'Esta sequência mnemônica será removida permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await apiFetch(`mnemonicas/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setMnemonicas(prev => prev.filter(m => m.id_mnemonica !== id));
          Swal.fire({ icon: 'success', title: 'Excluído!', timer: 1200, showConfirmButton: false, toast: true, position: 'top-end' });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // ==================== MODO ESTUDO SEQUENCIAL ====================
  const iniciarEstudo = (seq) => {
    setSequenciaEstudo(seq);
    setPassoIndice(0);
    setTermoBorrado(true);
    setModoEstudoAberto(true);
  };

  const proximoPasso = () => {
    if (sequenciaEstudo && passoIndice + 1 < sequenciaEstudo.itens.length) {
      setPassoIndice(prev => prev + 1);
      setTermoBorrado(true);
    }
  };

  const passoAnterior = () => {
    if (passoIndice > 0) {
      setPassoIndice(prev => prev - 1);
      setTermoBorrado(true);
    }
  };

  // ==================== MODO DESAFIO (JOGO DE ORDENAÇÃO) ====================
  const iniciarJogo = (seq) => {
    setSequenciaJogo(seq);
    const itensOriginais = Array.isArray(seq.itens) ? seq.itens : [];
    // Embaralhar itens
    const embaralhados = [...itensOriginais]
      .sort(() => Math.random() - 0.5)
      .map((it) => ({ ...it, idOriginal: it.ordem }));

    setItensJogo(embaralhados);
    setJogoVerificado(false);
    setJogoPontuacao(null);
    setModoJogoAberto(true);
  };

  const moverItemJogo = (index, direcao) => {
    const target = index + direcao;
    if (target < 0 || target >= itensJogo.length) return;

    setItensJogo(prev => {
      const copia = [...prev];
      const temp = copia[index];
      copia[index] = copia[target];
      copia[target] = temp;
      return copia;
    });
    setJogoVerificado(false);
  };

  const verificarOrdemJogo = () => {
    let acertos = 0;
    itensJogo.forEach((item, index) => {
      const ordemCorreta = index + 1;
      if (item.ordem === ordemCorreta) {
        acertos++;
      }
    });

    setJogoVerificado(true);
    setJogoPontuacao(acertos);

    if (acertos === itensJogo.length) {
      Swal.fire({
        icon: 'success',
        title: '🎉 Perfeito! Sequência Memorizada!',
        text: `Você acertou todos os ${itensJogo.length} passos na ordem exata!`,
        confirmButtonColor: 'var(--cor-primaria)'
      });
    } else {
      Swal.fire({
        icon: 'info',
        title: `${acertos} de ${itensJogo.length} corretos`,
        text: 'Ajuste os itens destacados em laranja e tente novamente!',
        confirmButtonColor: 'var(--cor-primaria)'
      });
    }
  };

  // Filtro
  const sequenciasFiltradas = mnemonicas.filter(seq => {
    if (materiaFiltro === 'todas') return true;
    return String(seq.id_materia) === String(materiaFiltro);
  });

  return (
    <div className="mnemonica-container">
      {/* Header */}
      <div className="mnemonica-header">
        <div className="mnemonica-title-area">
          <h1>
            <i className="bi bi-sort-numeric-down text-primary"></i> 
            Sequências & Listas Mnemônicas
          </h1>
          <p>Técnica dos Ganchos Numéricos e Encadeamento Lógico para memorização em ordem</p>
        </div>
        <div className="mnemonica-actions">
          <button className="btn-voltar-metodos" onClick={voltarParaMetodos}>
            <i className="bi bi-arrow-left"></i> Métodos
          </button>
          <button className="btn-nova-mnemonica" onClick={() => abrirModalForm()}>
            <i className="bi bi-plus-lg"></i> Nova Sequência
          </button>
        </div>
      </div>

      {/* Pílulas de Filtro por Matéria */}
      <div className="mnemonica-filtros">
        <button
          className={`filtro-pill ${materiaFiltro === 'todas' ? 'ativo' : ''}`}
          onClick={() => setMateriaFiltro('todas')}
        >
          <i className="bi bi-grid-fill"></i> Todas ({mnemonicas.length})
        </button>
        {materias.map(m => {
          const mId = String(m.id_materia || m.id);
          const count = mnemonicas.filter(s => String(s.id_materia) === mId).length;
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

      {/* Grid de Sequências */}
      {carregando ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3 text-muted">Carregando sequências mnemônicas...</p>
        </div>
      ) : sequenciasFiltradas.length === 0 ? (
        <div className="mnemonica-empty">
          <i className="bi bi-list-ol"></i>
          <h3>Nenhuma sequência mnemônica cadastrada</h3>
          <p>Crie sua primeira lista de passos ou processo ordenado para memorizar com facilidade!</p>
          <button className="btn-nova-mnemonica" onClick={() => abrirModalForm()}>
            <i className="bi bi-plus-lg"></i> Criar Sequência
          </button>
        </div>
      ) : (
        <div className="mnemonica-grid">
          {sequenciasFiltradas.map(seq => {
            const passos = Array.isArray(seq.itens) ? seq.itens : [];
            const matCor = formatColor(seq.cor_materia);
            return (
              <div key={seq.id_mnemonica} className="mnemonica-card">
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
                    {seq.nome_materia || 'Geral'}
                  </span>
                  <span className="card-step-count">
                    <i className="bi bi-list-check"></i> {passos.length} passos
                  </span>
                </div>

                <h3>{seq.titulo}</h3>
                {seq.descricao && <p className="card-desc">{seq.descricao}</p>}

                {/* Pré-visualização rápida dos primeiros passos */}
                <div className="card-steps-preview">
                  {passos.slice(0, 3).map(p => (
                    <div key={p.ordem} className="preview-step-item">
                      <span className="preview-step-num">{p.ordem}º</span>
                      <span className="preview-step-termo">{p.termo}</span>
                      {p.ancora && <span className="preview-step-ancora">({p.ancora})</span>}
                    </div>
                  ))}
                  {passos.length > 3 && (
                    <small className="text-muted">+ mais {passos.length - 3} passos...</small>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="card-actions-main">
                  <button
                    className="btn-estudo-card"
                    onClick={() => iniciarEstudo(seq)}
                    title="Estudar passo a passo revelando o conteúdo"
                  >
                    <i className="bi bi-eye"></i> Estudo
                  </button>
                  <button
                    className="btn-desafio-card"
                    style={{ background: matCor }}
                    onClick={() => iniciarJogo(seq)}
                    title="Treinar colocando os passos na ordem certa"
                  >
                    <i className="bi bi-controller"></i> Desafio
                  </button>
                </div>

                <div className="card-actions-sub">
                  <button
                    className="btn-icon-card"
                    onClick={() => abrirModalForm(seq)}
                    title="Editar sequência"
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button
                    className="btn-icon-card delete"
                    onClick={() => excluirSequencia(seq.id_mnemonica, seq.titulo)}
                    title="Excluir sequência"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          MODAL DE CRIAÇÃO / EDIÇÃO DE SEQUÊNCIA
      ======================================================== */}
      {modalCriacaoAberto && (
        <div className="mnemonica-modal-overlay" onClick={() => setModalCriacaoAberto(false)}>
          <div className="mnemonica-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header-styled">
              <h3>
                <i className="bi bi-sort-numeric-down text-primary"></i>
                {editandoId ? 'Editar Sequência Mnemônica' : 'Nova Sequência Mnemônica'}
              </h3>
              <button className="btn-modal-close" onClick={() => setModalCriacaoAberto(false)}>✕</button>
            </div>

            <div className="modal-body-scroll">
              {/* Seleção de Matéria */}
              <div className="mb-3">
                <label className="form-label fw-bold">Matéria</label>
                <div className="d-flex gap-2">
                  <select
                    className="form-select"
                    value={formMateriaId}
                    onChange={e => {
                      if (e.target.value === '__NOVA__') {
                        setMostrarNovaMateria(true);
                      } else {
                        setFormMateriaId(e.target.value);
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
                    type="button"
                    className="btn btn-outline-secondary"
                    title="Nova Matéria"
                    onClick={() => setMostrarNovaMateria(!mostrarNovaMateria)}
                  >
                    <i className="bi bi-plus-lg"></i>
                  </button>
                </div>

                {/* Formulário inline para nova matéria */}
                {mostrarNovaMateria && (
                  <div className="card p-3 mt-2 border-primary-subtle" style={{ backgroundColor: '#f8f9fa' }}>
                    <h6 className="fw-bold mb-2 text-primary">Cadastrar Nova Matéria</h6>
                    <div className="d-flex gap-2 mb-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nome da matéria"
                        value={novaMateriaNome}
                        onChange={e => setNovaMateriaNome(e.target.value)}
                        autoFocus
                      />
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={novaMateriaCor}
                        onChange={e => setNovaMateriaCor(e.target.value)}
                        style={{ minWidth: '45px' }}
                      />
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setMostrarNovaMateria(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={handleCriarMateria}
                        disabled={salvandoMateria}
                      >
                        {salvandoMateria ? 'Salvando...' : 'Salvar Matéria'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Título e Descrição */}
              <div className="mb-3">
                <label className="form-label fw-bold">Título do Processo / Lista</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Fases da Mitose, Leis de Kepler, etc."
                  value={formTitulo}
                  onChange={e => setFormTitulo(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Contexto / Dica Geral (opcional)</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Ex: Divisão celular com 4 etapas sequenciais."
                  value={formDescricao}
                  onChange={e => setFormDescricao(e.target.value)}
                ></textarea>
              </div>

              {/* Construtor de Passos Ordenados */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label fw-bold mb-0">
                    <i className="bi bi-list-ol text-primary"></i> Passos Ordenados
                  </label>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={adicionarPasso}
                  >
                    <i className="bi bi-plus-lg"></i> Adicionar Passo
                  </button>
                </div>

                <div className="steps-builder-container">
                  {formItens.map((item, idx) => (
                    <div key={idx} className="step-builder-row">
                      <span className="step-num-badge">{idx + 1}º</span>
                      <div className="step-inputs">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Termo / Conceito (ex: Prófase)"
                          value={item.termo}
                          onChange={e => atualizarItemForm(idx, 'termo', e.target.value)}
                        />
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Gancho mnemônico (ex: 1 = Vela / Início)"
                          value={item.ancora}
                          onChange={e => atualizarItemForm(idx, 'ancora', e.target.value)}
                        />
                      </div>
                      <div className="step-btn-actions">
                        <button
                          type="button"
                          className="btn-step-move"
                          onClick={() => moverPasso(idx, -1)}
                          disabled={idx === 0}
                          title="Subir passo"
                        >
                          <i className="bi bi-arrow-up"></i>
                        </button>
                        <button
                          type="button"
                          className="btn-step-move"
                          onClick={() => moverPasso(idx, 1)}
                          disabled={idx === formItens.length - 1}
                          title="Descer passo"
                        >
                          <i className="bi bi-arrow-down"></i>
                        </button>
                        <button
                          type="button"
                          className="btn-step-delete"
                          onClick={() => removerPasso(idx)}
                          title="Remover passo"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer p-3 border-top d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalCriacaoAberto(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={salvarSequencia}
                style={{ background: 'var(--cor-primaria, #3b82f6)', border: 'none' }}
              >
                {editandoId ? 'Atualizar Sequência' : 'Salvar Sequência'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DE ESTUDO SEQUENCIAL (OCULTAR / REVELAR)
      ======================================================== */}
      {modoEstudoAberto && sequenciaEstudo && (
        <div className="mnemonica-modal-overlay" onClick={() => setModoEstudoAberto(false)}>
          <div className="mnemonica-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header-styled">
              <div>
                <small className="text-muted text-uppercase fw-bold">Estudo Sequencial</small>
                <h3>{sequenciaEstudo.titulo}</h3>
              </div>
              <button className="btn-modal-close" onClick={() => setModoEstudoAberto(false)}>✕</button>
            </div>

            <div className="modal-body-scroll">
              {(() => {
                const passos = Array.isArray(sequenciaEstudo.itens) ? sequenciaEstudo.itens : [];
                const passoAtual = passos[passoIndice] || {};
                const matCor = formatColor(sequenciaEstudo.cor_materia);

                return (
                  <div>
                    {/* Barra de Progresso */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="fw-bold text-muted small">
                        Passo {passoIndice + 1} de {passos.length}
                      </span>
                      <span className="badge bg-light text-dark">
                        {Math.round(((passoIndice + 1) / passos.length) * 100)}% concluído
                      </span>
                    </div>

                    <div className="progress mb-4" style={{ height: '6px' }}>
                      <div
                        className="progress-bar"
                        style={{
                          width: `${((passoIndice + 1) / passos.length) * 100}%`,
                          background: matCor
                        }}
                      ></div>
                    </div>

                    {/* Card Hero do Passo */}
                    <div className="study-card-hero">
                      <div className="study-step-circle" style={{ background: matCor }}>
                        {passoIndice + 1}º
                      </div>

                      {passoAtual.ancora && (
                        <div className="study-ancora-box">
                          <i className="bi bi-lightbulb-fill me-1"></i> Gancho Mnemônico: <strong>{passoAtual.ancora}</strong>
                        </div>
                      )}

                      <div
                        className={`study-termo-title ${termoBorrado ? 'is-blurred' : ''}`}
                        onClick={() => setTermoBorrado(false)}
                        title={termoBorrado ? 'Clique para desborrar' : ''}
                      >
                        {passoAtual.termo}
                      </div>

                      {passoAtual.descricao && (
                        <p
                          className={`study-desc-text ${termoBorrado ? 'is-blurred' : ''}`}
                          onClick={() => setTermoBorrado(false)}
                        >
                          {passoAtual.descricao}
                        </p>
                      )}

                      {termoBorrado && (
                        <span className="hint-click-unblur" onClick={() => setTermoBorrado(false)}>
                          <i className="bi bi-eye-fill"></i> Clique para desborrar a resposta
                        </span>
                      )}
                    </div>

                    {/* Controles de Navegação */}
                    <div className="study-nav-controls">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={passoAnterior}
                        disabled={passoIndice === 0}
                      >
                        <i className="bi bi-chevron-left"></i> Anterior
                      </button>

                      <button
                        className="btn btn-outline-primary"
                        onClick={() => setTermoBorrado(!termoBorrado)}
                      >
                        <i className={`bi ${termoBorrado ? 'bi-eye' : 'bi-eye-slash'}`}></i>{' '}
                        {termoBorrado ? 'Revelar' : 'Borrar'}
                      </button>

                      <button
                        className="btn btn-primary"
                        style={{ background: matCor, borderColor: matCor }}
                        onClick={proximoPasso}
                        disabled={passoIndice === passos.length - 1}
                      >
                        Próximo <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DE DESAFIO / JOGO DE ORDENAÇÃO
      ======================================================== */}
      {modoJogoAberto && sequenciaJogo && (
        <div className="mnemonica-modal-overlay" onClick={() => setModoJogoAberto(false)}>
          <div className="mnemonica-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header-styled">
              <div>
                <small className="text-muted text-uppercase fw-bold">🎮 Desafio de Ordenação</small>
                <h3>{sequenciaJogo.titulo}</h3>
              </div>
              <button className="btn-modal-close" onClick={() => setModoJogoAberto(false)}>✕</button>
            </div>

            <div className="modal-body-scroll">
              <p className="text-muted small mb-3">
                <i className="bi bi-info-circle-fill text-primary me-1"></i>
                Os passos foram embaralhados! Use os botões <strong>▲</strong> e <strong>▼</strong> para organizar a sequência na ordem numérica correta de 1 a {itensJogo.length}.
              </p>

              <div>
                {itensJogo.map((item, idx) => {
                  const ordemCorreta = item.ordem === idx + 1;
                  let classeFeedback = '';
                  if (jogoVerificado) {
                    classeFeedback = ordemCorreta ? 'correto' : 'incorreto';
                  }

                  return (
                    <div key={item.ordem} className={`game-step-item ${classeFeedback}`}>
                      <div className="game-step-content">
                        <div className={`game-order-slot ${jogoVerificado && ordemCorreta ? 'correct-slot' : ''}`}>
                          {idx + 1}º
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{item.termo}</div>
                          {item.ancora && <small className="text-muted">{item.ancora}</small>}
                        </div>
                      </div>

                      <div className="d-flex gap-1">
                        <button
                          type="button"
                          className="btn-step-move"
                          onClick={() => moverItemJogo(idx, -1)}
                          disabled={idx === 0}
                          title="Subir"
                        >
                          <i className="bi bi-arrow-up"></i>
                        </button>
                        <button
                          type="button"
                          className="btn-step-move"
                          onClick={() => moverItemJogo(idx, 1)}
                          disabled={idx === itensJogo.length - 1}
                          title="Descer"
                        >
                          <i className="bi bi-arrow-down"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-footer p-3 border-top d-flex justify-content-between align-items-center">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => iniciarJogo(sequenciaJogo)}
                title="Embaralhar novamente"
              >
                <i className="bi bi-shuffle"></i> Reembaralhar
              </button>

              <button
                type="button"
                className="btn btn-success"
                onClick={verificarOrdemJogo}
                style={{ padding: '8px 24px', fontWeight: 'bold' }}
              >
                <i className="bi bi-check2-circle"></i> Verificar Ordem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

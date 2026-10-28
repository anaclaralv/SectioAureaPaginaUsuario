import { useState, useEffect, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';
import './notas.css';
import { apiFetch } from '../api';

export default function Notas() {
  const [notas, setNotas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroAba, setFiltroAba] = useState('todas');


  const [modalAberto, setModalAberto] = useState(false);
  const [notaEditando, setNotaEditando] = useState(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formCor, setFormCor] = useState('#ffffff');
  const [formCorTexto, setFormCorTexto] = useState('#1e293b');
  const [formTexto, setFormTexto] = useState('');
  const [checklistItems, setChecklistItems] = useState([]);
  const [anexosTemp, setAnexosTemp] = useState([]);

  const textoDivRef = useRef(null);
  const anexoInputRef = useRef(null);

  const carregarNotas = useCallback(async () => {
    try {
      const response = await apiFetch('blocos');
      if (response.ok) {
        const data = await response.json();
        const notasFormatadas = (Array.isArray(data) ? data : []).map(n => {
          let parsed = {};
          try {
            let str = n.conteudo || '';
            if (typeof str === 'string' && str.includes('&quot;')) {
              const txt = document.createElement('textarea');
              txt.innerHTML = str;
              str = txt.value;
            }
            parsed = typeof str === 'string' ? JSON.parse(str) : (str || {});
          } catch (e) {
            parsed = { texto: n.conteudo || '' };
          }
          return {
            id: n.id_anotacao,
            titulo: parsed.titulo || parsed.title || 'Sem título',
            texto: parsed.texto || parsed.description || '',
            cor: n.cor_nota && String(n.cor_nota).startsWith('#') ? n.cor_nota : '#ffffff',
            corTexto: parsed.corTexto || '#1e293b',
            checklist: Array.isArray(parsed.checklist) ? parsed.checklist : [],
            anexos: Array.isArray(parsed.anexos) ? parsed.anexos : [],
            favorito: Boolean(parsed.favorito || parsed.favorite),
            dataCriacao: parsed.dataCriacao || ''
          };
        });
        setNotas(notasFormatadas);
      }
    } catch (err) {
      console.error('Erro ao carregar notas:', err);
    }
  }, []);

  useEffect(() => {
    carregarNotas();
  }, [carregarNotas]);


  useEffect(() => {
    if (modalAberto && textoDivRef.current) {
      textoDivRef.current.innerHTML = formTexto || '';
    }
  }, [modalAberto]);

  const formatText = (command) => {
    document.execCommand(command, false, null);
    if (textoDivRef.current) {
      textoDivRef.current.focus();
      setFormTexto(textoDivRef.current.innerHTML);
    }
  };

  const handleTextoInput = () => {
    if (textoDivRef.current) {
      setFormTexto(textoDivRef.current.innerHTML);
    }
  };

  const adicionarChecklistItem = () => {
    setChecklistItems(prev => [...prev, { texto: '', checked: false }]);
  };

  const atualizarItemChecklistModal = (index, campo, valor) => {
    setChecklistItems(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, [campo]: valor } : item))
    );
  };

  const removerItemChecklistModal = (index) => {
    setChecklistItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const processarImagens = useCallback((files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire('Aviso', `A imagem "${file.name}" excede o limite de 5MB.`, 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setAnexosTemp(prev => [...prev, { nome: file.name, data: e.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const abrirLightbox = (src) => {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.onclick = (e) => {
      if (e.target === lightbox || e.target.classList.contains('btn-fechar-lightbox')) {
        lightbox.remove();
      }
    };
    lightbox.innerHTML = `<button class="btn-fechar-lightbox">✕</button><img src="${src}">`;
    document.body.appendChild(lightbox);
  };

  const abrirModal = (nota = null) => {
    setNotaEditando(nota);
    setFormTitulo(nota?.titulo && nota.titulo !== 'Sem título' ? nota.titulo : '');
    setFormCor(nota?.cor || '#ffffff');
    setFormCorTexto(nota?.corTexto || '#1e293b');
    const txt = nota?.texto || '';
    setFormTexto(txt);
    setChecklistItems(nota?.checklist ? nota.checklist.map(c => ({ ...c })) : []);
    setAnexosTemp(nota?.anexos ? [...nota.anexos] : []);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setNotaEditando(null);
    setAnexosTemp([]);
    setChecklistItems([]);
    setFormTitulo('');
    setFormTexto('');
  };

  const salvarNota = async () => {
    const titulo = formTitulo.trim();
    const textoHtml = textoDivRef.current ? textoDivRef.current.innerHTML : formTexto;
    const textoPuro = textoHtml.replace(/<[^>]+>/g, '').trim();

    if (!titulo && !textoPuro && checklistItems.length === 0 && anexosTemp.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Nota vazia',
        text: 'Preencha pelo menos o título, o texto, um item da checklist ou um anexo.'
      });
      return;
    }

    const payload = {
      conteudo: JSON.stringify({
        titulo: titulo || 'Sem título',
        texto: textoHtml,
        corTexto: formCorTexto,
        checklist: checklistItems,
        favorito: notaEditando ? Boolean(notaEditando.favorito) : false,
        dataCriacao: notaEditando?.dataCriacao || new Date().toLocaleString('pt-BR'),
        anexos: [...anexosTemp]
      }),
      cor_nota: formCor
    };

    try {
      let response;
      if (notaEditando && notaEditando.id) {
        response = await apiFetch(`blocos/${notaEditando.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        response = await apiFetch('blocos', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        Swal.fire('Erro', errData.message || 'Não foi possível salvar a nota.', 'error');
        return;
      }

      fecharModal();
      await carregarNotas();
      Swal.fire({ icon: 'success', title: 'Nota salva!', timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error('Erro ao salvar nota:', err);
      Swal.fire('Erro', 'Não foi possível salvar a nota.', 'error');
    }
  };

  const excluirNota = (id) => {
    Swal.fire({
      title: 'Excluir nota?',
      text: 'Tem certeza que deseja apagar esta anotação?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await apiFetch(`blocos/${id}`, { method: 'DELETE' });
        carregarNotas();
      }
    });
  };

  const toggleFavorito = async (id) => {
    const nota = notas.find(n => n.id === id);
    if (!nota) return;
    const payload = {
      conteudo: JSON.stringify({
        titulo: nota.titulo,
        texto: nota.texto,
        corTexto: nota.corTexto,
        checklist: nota.checklist,
        favorito: !nota.favorito,
        dataCriacao: nota.dataCriacao,
        anexos: nota.anexos
      }),
      cor_nota: nota.cor
    };
    await apiFetch(`blocos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    carregarNotas();
  };

  const toggleChecklistItem = async (notaId, checkIndex) => {
    const nota = notas.find(n => n.id === notaId);
    if (!nota) return;
    const novoChecklist = nota.checklist.map((item, idx) =>
      idx === checkIndex ? { ...item, checked: !item.checked } : item
    );
    const payload = {
      conteudo: JSON.stringify({
        titulo: nota.titulo,
        texto: nota.texto,
        corTexto: nota.corTexto,
        checklist: novoChecklist,
        favorito: nota.favorito,
        dataCriacao: nota.dataCriacao,
        anexos: nota.anexos
      }),
      cor_nota: nota.cor
    };
    await apiFetch(`blocos/${notaId}`, { method: 'PUT', body: JSON.stringify(payload) });
    carregarNotas();
  };

  const notasFiltradas = notas
    .filter(n => {
      const matchSearch =
        (n.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.texto || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (filtroAba === 'favoritas') return matchSearch && n.favorito;
      return matchSearch;
    })
    .sort((a, b) => (b.favorito === a.favorito ? (a.titulo || '').localeCompare(b.titulo || '') : b.favorito ? 1 : -1));

  const totalChecklistGeral = notas.reduce((acc, n) => acc + (n.checklist?.length || 0), 0);
  const totalAnexosGeral = notas.reduce((acc, n) => acc + (n.anexos?.length || 0), 0);

  return (
    <section id="notasSection">
      <div className="notas-container-main">
        {}
        <div className="notas-header-bar">
          <div className="notas-header-titles">
            <h1><i className="bi bi-journal-bookmark-fill"></i> Minhas Notas</h1>
            <p className="notas-subtitle">Caderno digital inteligente, anotações rápidas e checklists organizados</p>
          </div>
          <button className="btn-novo-nota-main" onClick={() => abrirModal(null)}>
            <i className="bi bi-plus-lg"></i> Nova Nota
          </button>
        </div>

        {/* Painel de Métricas Padronizado (estilo Calendário) */}
        <div className="notas-metricas-grid">
          <div className="nota-metric-card">
            <div className="nota-metric-icon total">
              <i className="bi bi-journal-text"></i>
            </div>
            <div className="nota-metric-info">
              <span className="nota-metric-num">{notas.length}</span>
              <span className="nota-metric-label">Total de Notas</span>
            </div>
          </div>

          <div className="nota-metric-card">
            <div className="nota-metric-icon favoritas">
              <i className="bi bi-star-fill"></i>
            </div>
            <div className="nota-metric-info">
              <span className="nota-metric-num">{notas.filter(n => n.favorito).length}</span>
              <span className="nota-metric-label">Favoritas</span>
            </div>
          </div>

          <div className="nota-metric-card">
            <div className="nota-metric-icon checklist">
              <i className="bi bi-check2-square"></i>
            </div>
            <div className="nota-metric-info">
              <span className="nota-metric-num">{totalChecklistGeral}</span>
              <span className="nota-metric-label">Itens de Check</span>
            </div>
          </div>

          <div className="nota-metric-card">
            <div className="nota-metric-icon anexos">
              <i className="bi bi-paperclip"></i>
            </div>
            <div className="nota-metric-info">
              <span className="nota-metric-num">{totalAnexosGeral}</span>
              <span className="nota-metric-label">Anexos / Imagens</span>
            </div>
          </div>
        </div>

        {/* Barra de Filtro e Busca */}
        <div className="notas-card-main mb-4">
          <div className="notas-toolbar-bar">
            <div className="notas-filtros-nav">
              <button
                className={`btn-nota-filtro ${filtroAba === 'todas' ? 'ativo' : ''}`}
                onClick={() => setFiltroAba('todas')}
              >
                Todas ({notas.length})
              </button>
              <button
                className={`btn-nota-filtro ${filtroAba === 'favoritas' ? 'ativo' : ''}`}
                onClick={() => setFiltroAba('favoritas')}
              >
                <i className="bi bi-star-fill me-1" style={{ color: '#f59e0b' }}></i> Favoritas ({notas.filter(n => n.favorito).length})
              </button>
            </div>

            <div className="notas-search-box">
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="Pesquisar por título ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="btn-limpar-busca" onClick={() => setSearchTerm('')}>
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Grade de Notas */}
        {notasFiltradas.length === 0 ? (
          <div className="notas-card-main text-center py-5">
            <div style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '12px' }}>
              <i className="bi bi-journal-x"></i>
            </div>
            <h4 style={{ fontWeight: 700, color: '#1e293b' }}>Nenhuma nota encontrada</h4>
            <p style={{ color: '#64748b' }}>
              {searchTerm ? 'Tente buscar com outros termos.' : 'Crie sua primeira nota clicando em "Nova Nota" acima!'}
            </p>
          </div>
        ) : (
          <div id="notasContainer" className="row g-4">
            {notasFiltradas.map((nota) => {
              const totalItens = nota.checklist?.length || 0;
              const itensConcluidos = nota.checklist?.filter(c => c.checked).length || 0;
              return (
                <div key={nota.id} className="col-lg-4 col-md-6 col-12">
                  <div className="card-nota" style={{ backgroundColor: nota.cor, color: nota.corTexto }}>
                    <i
                      className={`bi bi-star-fill estrela ${nota.favorito ? 'favorito' : ''}`}
                      onClick={() => toggleFavorito(nota.id)}
                    />
                    <h5>{nota.titulo}</h5>
                    <small className="nota-data-badge">{nota.dataCriacao || 'Recente'}</small>
                    {totalItens > 0 && (
                      <div className={`checklist-stats ${itensConcluidos === totalItens ? 'concluido' : 'pendente'}`}>
                        <i className="bi bi-check2"></i> {itensConcluidos}/{totalItens} concluídos
                      </div>
                    )}
                    <div className="card-conteudo">
                      {(nota.texto || '').replace(/<[^>]+>/g, '').slice(0, 120)}
                      <div className="checklist-card">
                        {nota.checklist?.map((c, i) => (
                          <div key={i} className={`check-item ${c.checked ? 'completed' : ''}`}>
                            <input
                              type="checkbox"
                              checked={Boolean(c.checked)}
                              onChange={() => toggleChecklistItem(nota.id, i)}
                            />
                            <span>{c.texto}</span>
                          </div>
                        ))}
                      </div>
                      {nota.anexos && nota.anexos.length > 0 && (
                        <div className="anexos-card">
                          {nota.anexos.map((anexo, idx) => (
                            <div
                              key={idx}
                              className="anexo-mini"
                              onClick={() => abrirLightbox(anexo.data)}
                            >
                              <img src={anexo.data} alt={anexo.nome || 'Anexo'} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="nota-card-acoes mt-3 pt-2 border-top">
                      <button
                        className="btn-nota-acao edit"
                        onClick={() => abrirModal(nota)}
                      >
                        <i className="bi bi-pencil-square"></i> Editar
                      </button>
                      <button
                        className="btn-nota-acao delete"
                        onClick={() => excluirNota(nota.id)}
                      >
                        <i className="bi bi-trash"></i> Excluir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Moderno de Nova / Editar Nota (Padrão Calendário Acadêmico) */}
      {modalAberto && (
        <div className="nota-modal-backdrop" onClick={fecharModal}>
          <div className="nota-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="nota-modal-header">
              <h3>
                <i className="bi bi-journal-plus"></i>
                {notaEditando ? 'Editar Nota' : 'Nova Nota'}
              </h3>
              <button
                type="button"
                className="btn-nota-modal-close"
                onClick={fecharModal}
                title="Fechar"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="nota-modal-body">
              {/* Título da Nota */}
              <div className="nota-form-group">
                <label>Título da Nota</label>
                <input
                  type="text"
                  className="nota-form-input"
                  placeholder="Ex: Resumo de Cálculo I, Ideias para o TCC..."
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                />
              </div>

              {/* Cores: Nota e Texto */}
              <div className="nota-cores-row">
                <div className="nota-form-group">
                  <label>Cor de Fundo da Nota</label>
                  <div className="nota-palette-chips">
                    {[
                      { hex: '#ffffff', label: 'Branco' },
                      { hex: '#fef3c7', label: 'Amarelo' },
                      { hex: '#dcfce7', label: 'Menta' },
                      { hex: '#e0f2fe', label: 'Céu' },
                      { hex: '#f3e8ff', label: 'Lavanda' },
                      { hex: '#ffe4e6', label: 'Rosa' },
                      { hex: '#ffedd5', label: 'Pêssego' },
                      { hex: '#f1f5f9', label: 'Cinza' },
                    ].map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        className={`nota-color-chip ${formCor === c.hex ? 'active' : ''}`}
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                        onClick={() => setFormCor(c.hex)}
                      >
                        {formCor === c.hex && <i className="bi bi-check2"></i>}
                      </button>
                    ))}
                    <div className="nota-custom-color-wrapper" title="Cor personalizada">
                      <input
                        type="color"
                        value={formCor}
                        onChange={(e) => setFormCor(e.target.value)}
                        className="nota-custom-color-input"
                      />
                      <i className="bi bi-palette"></i>
                    </div>
                  </div>
                </div>

                <div className="nota-form-group">
                  <label>Cor do Texto</label>
                  <div className="nota-palette-chips">
                    {[
                      { hex: '#1e293b', label: 'Escuro' },
                      { hex: '#0f172a', label: 'Preto Profundo' },
                      { hex: '#475569', label: 'Cinza Grafite' },
                      { hex: '#9f042c', label: 'Bordô' },
                      { hex: '#2563eb', label: 'Azul' },
                    ].map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        className={`nota-color-chip text-chip ${formCorTexto === c.hex ? 'active' : ''}`}
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                        onClick={() => setFormCorTexto(c.hex)}
                      >
                        {formCorTexto === c.hex && <i className="bi bi-check2" style={{ color: '#fff' }}></i>}
                      </button>
                    ))}
                    <div className="nota-custom-color-wrapper" title="Cor de texto personalizada">
                      <input
                        type="color"
                        value={formCorTexto}
                        onChange={(e) => setFormCorTexto(e.target.value)}
                        className="nota-custom-color-input"
                      />
                      <i className="bi bi-eyedropper"></i>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor de Texto com Barra de Ferramentas */}
              <div className="nota-form-group">
                <div className="nota-editor-header">
                  <label>Conteúdo da Nota</label>
                  <div className="nota-text-toolbar">
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      title="Negrito"
                      onClick={() => formatText('bold')}
                    >
                      <i className="bi bi-type-bold"></i>
                    </button>
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      title="Itálico"
                      onClick={() => formatText('italic')}
                    >
                      <i className="bi bi-type-italic"></i>
                    </button>
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      title="Sublinhado"
                      onClick={() => formatText('underline')}
                    >
                      <i className="bi bi-type-underline"></i>
                    </button>
                    <span className="toolbar-divider"></span>
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      title="Lista com marcadores"
                      onClick={() => formatText('insertUnorderedList')}
                    >
                      <i className="bi bi-list-ul"></i>
                    </button>
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      title="Lista numerada"
                      onClick={() => formatText('insertOrderedList')}
                    >
                      <i className="bi bi-list-ol"></i>
                    </button>
                  </div>
                </div>

                <div
                  ref={textoDivRef}
                  className="nota-editor-content"
                  contentEditable="true"
                  onInput={handleTextoInput}
                  placeholder="Digite suas anotações, resumos ou tópicos aqui..."
                  style={{
                    backgroundColor: formCor,
                    color: formCorTexto
                  }}
                />
                <div className="nota-editor-footer">
                  <small className="nota-caracteres-count">
                    {formTexto.replace(/<[^>]+>/g, '').length} caracteres
                  </small>
                </div>
              </div>

              {/* Seção Checklist */}
              <div className="nota-form-group">
                <div className="nota-section-title-row">
                  <label>
                    <i className="bi bi-check2-square me-1"></i> Lista de Tarefas (Checklist)
                  </label>
                  <button
                    type="button"
                    className="btn-nota-add-item"
                    onClick={adicionarChecklistItem}
                  >
                    <i className="bi bi-plus-circle me-1"></i> Adicionar Item
                  </button>
                </div>

                {checklistItems.length > 0 ? (
                  <div className="nota-checklist-list">
                    {checklistItems.map((item, i) => (
                      <div key={i} className={`nota-modal-check-item ${item.checked ? 'completed' : ''}`}>
                        <input
                          type="checkbox"
                          className="nota-modal-checkbox"
                          checked={Boolean(item.checked)}
                          onChange={(e) => atualizarItemChecklistModal(i, 'checked', e.target.checked)}
                        />
                        <input
                          type="text"
                          className="nota-modal-check-input"
                          placeholder="Digite o item da lista..."
                          value={item.texto || ''}
                          onChange={(e) => atualizarItemChecklistModal(i, 'texto', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              adicionarChecklistItem();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="btn-nota-check-remover"
                          title="Excluir item"
                          onClick={() => removerItemChecklistModal(i)}
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="nota-checklist-empty-hint" onClick={adicionarChecklistItem}>
                    <i className="bi bi-list-check"></i>
                    <span>Nenhum item na checklist. Clique para adicionar um item.</span>
                  </div>
                )}
              </div>

              {/* Seção Anexos */}
              <div className="nota-form-group">
                <label>
                  <i className="bi bi-paperclip me-1"></i> Imagens e Anexos
                </label>
                <div
                  className="nota-anexos-dropzone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    processarImagens(e.dataTransfer.files);
                  }}
                  onClick={() => anexoInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    ref={anexoInputRef}
                    onChange={(e) => processarImagens(e.target.files)}
                  />
                  <div className="nota-dropzone-content">
                    <div className="nota-dropzone-icon">
                      <i className="bi bi-cloud-arrow-up-fill"></i>
                    </div>
                    <div>
                      <strong>Clique ou arraste imagens aqui</strong>
                      <p>Suporta PNG, JPG e GIF (até 5MB por imagem)</p>
                    </div>
                  </div>
                </div>

                {anexosTemp.length > 0 && (
                  <div className="nota-anexos-preview-grid">
                    {anexosTemp.map((anexo, index) => (
                      <div key={index} className="nota-preview-item">
                        <img
                          src={anexo.data}
                          alt={anexo.nome || 'Preview'}
                          onClick={() => abrirLightbox(anexo.data)}
                        />
                        <button
                          type="button"
                          className="btn-nota-remover-anexo"
                          title="Remover anexo"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnexosTemp(prev => prev.filter((_, idx) => idx !== index));
                          }}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="nota-modal-footer">
              <button type="button" className="btn-nota-cancel" onClick={fecharModal}>
                Cancelar
              </button>
              <button type="button" className="btn-nota-save" onClick={salvarNota}>
                <i className="bi bi-check-lg"></i>
                {notaEditando ? 'Salvar Alterações' : 'Criar Nota'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

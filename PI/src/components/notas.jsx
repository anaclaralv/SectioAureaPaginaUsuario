import { useState, useEffect, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';
import './notas.css';

export default function Notas() {
  const [notas, setNotas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notaEditando, setNotaEditando] = useState(null);
  const [notaEditandoIndex, setNotaEditandoIndex] = useState(null);
  const [anexosTemp, setAnexosTemp] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  
  // Refs para o modal Bootstrap
  const modalRef = useRef(null);
  const modalInstanceRef = useRef(null);
  
  // Refs para elementos do formulário
  const tituloInputRef = useRef(null);
  const textoDivRef = useRef(null);
  const corInputRef = useRef(null);
  const corTextoInputRef = useRef(null);
  const anexoInputRef = useRef(null);

  // Carregar notas do localStorage
  useEffect(() => {
    const notasSalvas = localStorage.getItem('notas');
    if (notasSalvas) {
      try {
        let loadedNotas = JSON.parse(notasSalvas);
        // Garantir que todas as notas tenham ID
        loadedNotas = loadedNotas.map(nota => {
          if (!nota.id) {
            nota.id = 'nota_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          }
          return nota;
        });
        setNotas(loadedNotas);
      } catch (e) {
        console.error('Erro ao carregar notas:', e);
        setNotas([]);
      }
    }
  }, []);

  // Salvar notas no localStorage
  useEffect(() => {
    localStorage.setItem('notas', JSON.stringify(notas));
  }, [notas]);

  // Inicializar modal Bootstrap
  useEffect(() => {
    if (window.bootstrap && modalRef.current) {
      modalInstanceRef.current = new window.bootstrap.Modal(modalRef.current);
    }
  }, []);

  // Atualizar contador de caracteres
  const atualizarContadorCaracteres = useCallback(() => {
    const textoDiv = textoDivRef.current;
    if (!textoDiv) return;
    const texto = textoDiv.innerText || textoDiv.textContent || '';
    const caracteres = texto.length;
    const contadorSpan = document.getElementById('contadorTexto');
    if (contadorSpan) {
      contadorSpan.textContent = caracteres;
      const contadorDiv = document.querySelector('.contador-caracteres');
      if (caracteres > 5000) {
        contadorDiv?.classList.add('alerta');
      } else {
        contadorDiv?.classList.remove('alerta');
      }
    }
  }, []);

  // Monitorar texto para contador
  useEffect(() => {
    const textoDiv = textoDivRef.current;
    if (textoDiv) {
      textoDiv.addEventListener('input', atualizarContadorCaracteres);
      textoDiv.addEventListener('keyup', atualizarContadorCaracteres);
      const observer = new MutationObserver(() => atualizarContadorCaracteres());
      observer.observe(textoDiv, { childList: true, subtree: true, characterData: true });
      
      return () => {
        textoDiv.removeEventListener('input', atualizarContadorCaracteres);
        textoDiv.removeEventListener('keyup', atualizarContadorCaracteres);
        observer.disconnect();
      };
    }
  }, [atualizarContadorCaracteres]);

  // Funções de formatação de texto
  const formatText = (command) => {
    document.execCommand(command, false, null);
    textoDivRef.current?.focus();
  };

  // Renderizar checklist no modal
  const renderizarChecklistModal = useCallback((items) => {
    const container = document.getElementById('checklistContainer');
    if (!container) return;
    
    container.innerHTML = '';
    if (!Array.isArray(items)) items = [];
    
    items.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = `check-item ${item.checked ? 'completed' : ''}`;
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.marginBottom = '5px';
      div.innerHTML = `
        <input type="checkbox" ${item.checked ? 'checked' : ''} style="margin-right:5px;">
        <input type="text" class="form-control form-control-sm" value="${item.texto || ''}" style="flex:1; margin-right:5px;">
        <button class="btn-excluir-check" style="border:none; background:none; cursor:pointer;" type="button">✕</button>
      `;
      
      const checkbox = div.querySelector('input[type="checkbox"]');
      const textoInput = div.querySelector('input[type="text"]');
      const btnExcluir = div.querySelector('.btn-excluir-check');
      
      checkbox.addEventListener('change', () => {
        item.checked = checkbox.checked;
        div.classList.toggle('completed', item.checked);
        const newItems = [...checklistItems];
        newItems[i] = item;
        setChecklistItems(newItems);
      });
      
      textoInput.addEventListener('input', () => {
        item.texto = textoInput.value;
        const newItems = [...checklistItems];
        newItems[i] = item;
        setChecklistItems(newItems);
      });
      
      btnExcluir.addEventListener('click', () => {
        const newItems = checklistItems.filter((_, idx) => idx !== i);
        setChecklistItems(newItems);
        renderizarChecklistModal(newItems);
      });
      
      container.appendChild(div);
    });
  }, [checklistItems]);

  // Adicionar item ao checklist
  const adicionarChecklistItem = () => {
    const novosItens = [...checklistItems, { texto: '', checked: false }];
    setChecklistItems(novosItens);
    renderizarChecklistModal(novosItens);
  };

  // Processar imagens
  const processarImagens = useCallback((files) => {
    if (!files || files.length === 0) return;
    let processadas = 0;
    const total = files.length;
    
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        processadas++;
        if (processadas === total && total > 0) {
          Swal.fire({ icon: 'warning', title: 'Apenas imagens são permitidas!', timer: 1500 });
        }
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: 'warning', title: 'Imagem muito grande!', text: 'Máximo 5MB por imagem.', timer: 2000 });
        processadas++;
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setAnexosTemp(prev => [...prev, {
          nome: file.name,
          data: e.target.result,
          tipo: file.type,
          tamanho: file.size
        }]);
        processadas++;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // Renderizar previews dos anexos
  const renderizarPreviews = useCallback(() => {
    const container = document.getElementById('previewAnexos');
    if (!container) return;
    
    if (anexosTemp.length === 0) {
      container.innerHTML = '<p style="color: #9ca3af; font-size: 0.85rem; width: 100%;">Nenhuma imagem anexada</p>';
      return;
    }
    
    container.innerHTML = anexosTemp.map((anexo, index) => `
      <div class="anexo-thumb" onclick="window.abrirLightbox && window.abrirLightbox('${anexo.data}')">
        <img src="${anexo.data}" alt="Anexo ${index + 1}">
        <button class="btn-remover-anexo" onclick="event.stopPropagation(); window.removerAnexo && window.removerAnexo(${index})">✕</button>
      </div>
    `).join('');
  }, [anexosTemp]);

  // Remover anexo
  const removerAnexo = useCallback((index) => {
    setAnexosTemp(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Abrir lightbox
  const abrirLightbox = useCallback((src) => {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.onclick = (e) => {
      if (e.target === lightbox || e.target.classList.contains('btn-fechar-lightbox')) {
        lightbox.remove();
      }
    };
    lightbox.innerHTML = `
      <button class="btn-fechar-lightbox" onclick="this.closest('.lightbox').remove()">✕</button>
      <img src="${src}" alt="Visualização">
    `;
    document.body.appendChild(lightbox);
  }, []);

  // Tornar funções globais
  useEffect(() => {
    window.removerAnexo = removerAnexo;
    window.abrirLightbox = abrirLightbox;
    return () => {
      delete window.removerAnexo;
      delete window.abrirLightbox;
    };
  }, [removerAnexo, abrirLightbox]);

  useEffect(() => {
    renderizarPreviews();
  }, [anexosTemp, renderizarPreviews]);

  // Abrir modal para editar/criar nota
  const abrirModal = useCallback((nota = null, index = null) => {
    setNotaEditandoIndex(index);
    setNotaEditando(nota);
    
    if (tituloInputRef.current) {
      tituloInputRef.current.value = nota?.titulo || '';
    }
    if (textoDivRef.current) {
      textoDivRef.current.innerHTML = nota?.texto || '';
    }
    if (corInputRef.current) {
      corInputRef.current.value = nota?.cor || '#ffffff';
    }
    if (corTextoInputRef.current) {
      corTextoInputRef.current.value = nota?.corTexto || '#000000';
    }
    
    const checklist = nota?.checklist ? [...nota.checklist] : [];
    setChecklistItems(checklist);
    setAnexosTemp(nota?.anexos ? [...nota.anexos] : []);
    
    setTimeout(() => {
      renderizarChecklistModal(checklist);
      atualizarContadorCaracteres();
    }, 100);
    
    modalInstanceRef.current?.show();
  }, [renderizarChecklistModal, atualizarContadorCaracteres]);

  // Salvar nota
  const salvarNota = useCallback(() => {
    const titulo = tituloInputRef.current?.value || '';
    const texto = textoDivRef.current?.innerHTML || '';
    const cor = corInputRef.current?.value || '#ffffff';
    const corTexto = corTextoInputRef.current?.value || '#000000';
    
    const checklist = checklistItems.map(item => ({
      texto: item.texto || '',
      checked: item.checked || false
    }));
    
    const novoId = 'nota_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const novaNota = {
      id: (notaEditandoIndex !== null && notas[notaEditandoIndex]) ? notas[notaEditandoIndex].id : novoId,
      titulo,
      texto,
      cor,
      corTexto,
      checklist: checklist,
      anexos: [...anexosTemp],
      favorito: notaEditandoIndex !== null && notas[notaEditandoIndex] ? notas[notaEditandoIndex].favorito : false,
      dataCriacao: notaEditandoIndex !== null && notas[notaEditandoIndex]
        ? notas[notaEditandoIndex].dataCriacao
        : new Date().toLocaleString()
    };
    
    if (notaEditandoIndex !== null && notas[notaEditandoIndex]) {
      const novasNotas = [...notas];
      novasNotas[notaEditandoIndex] = novaNota;
      setNotas(novasNotas);
    } else {
      setNotas([...notas, novaNota]);
    }
    
    setAnexosTemp([]);
    setChecklistItems([]);
    modalInstanceRef.current?.hide();
    
    Swal.fire({ icon: 'success', title: 'Nota salva!', timer: 1500, showConfirmButton: false });
  }, [notas, notaEditandoIndex, checklistItems, anexosTemp]);

  // Excluir nota
  const excluirNota = useCallback((id) => {
    Swal.fire({
      title: 'Excluir nota?',
      text: "Essa ação não pode ser desfeita!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir'
    }).then(result => {
      if (result.isConfirmed) {
        setNotas(notas.filter(n => n.id !== id));
        Swal.fire('Excluída!', '', 'success');
      }
    });
  }, [notas]);

  // Alternar favorito
  const toggleFavorito = useCallback((id) => {
    setNotas(notas.map(nota =>
      nota.id === id ? { ...nota, favorito: !nota.favorito } : nota
    ));
  }, [notas]);

  // Alternar checklist na visualização
  const toggleChecklistItem = useCallback((notaId, checkIndex) => {
    setNotas(notas.map(nota => {
      if (nota.id === notaId && nota.checklist && nota.checklist[checkIndex]) {
        const novoChecklist = [...nota.checklist];
        novoChecklist[checkIndex].checked = !novoChecklist[checkIndex].checked;
        return { ...nota, checklist: novoChecklist };
      }
      return nota;
    }));
  }, [notas]);

  // Excluir item do checklist na visualização
  const excluirChecklistItem = useCallback((notaId, checkIndex) => {
    setNotas(notas.map(nota => {
      if (nota.id === notaId && nota.checklist) {
        const novoChecklist = nota.checklist.filter((_, idx) => idx !== checkIndex);
        return { ...nota, checklist: novoChecklist };
      }
      return nota;
    }));
  }, [notas]);

  // Renderizar anexos na nota
  const renderizarAnexosCard = useCallback((anexos) => {
    if (!anexos || anexos.length === 0) return null;
    
    if (anexos.length === 1) {
      return (
        <div className="anexos-card">
          <div className="anexo-mini" onClick={() => abrirLightbox(anexos[0].data)}>
            <img src={anexos[0].data} alt="Anexo" />
          </div>
        </div>
      );
    }
    
    const extras = anexos.length > 3 ? `+${anexos.length - 3}` : '';
    return (
      <div className="anexos-card">
        {anexos.slice(0, 3).map((a, i) => (
          <div key={i} className="anexo-mini" onClick={() => abrirLightbox(a.data)}>
            <img src={a.data} alt={`Anexo ${i + 1}`} />
          </div>
        ))}
        {extras && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{extras}</span>}
      </div>
    );
  }, [abrirLightbox]);

  // Renderizar indicador de anexos
  const renderizarIndicadorAnexos = useCallback((anexos) => {
    if (!anexos || anexos.length === 0) return null;
    return (
      <div className="anexo-indicador">
        <i className="bi bi-image"></i>
        <span>{anexos.length} anexo{anexos.length > 1 ? 's' : ''}</span>
      </div>
    );
  }, []);

  // Filtrar e ordenar notas
  const notasFiltradas = notas
    .filter(n =>
      n.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.texto.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (b.favorito !== a.favorito) return b.favorito - a.favorito;
      return a.titulo.localeCompare(b.titulo);
    });

  return (
    <section id="notasSection">
      <h1 className="mb-3">Minhas Notas</h1>
      
      <div className="d-flex mb-3 justify-content-between">
        <input
          type="text"
          className="form-control me-2"
          placeholder="Pesquisar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn btn-primary" id="btnNova" onClick={() => abrirModal()}>
          <i className="fa fa-plus"></i> Nova
        </button>
      </div>

      <div id="notasContainer" className="row g-3">
        {notasFiltradas.map((nota, idx) => {
          const totalItens = nota.checklist?.length || 0;
          const itensConcluidos = nota.checklist?.filter(c => c.checked).length || 0;
          const pendentes = totalItens - itensConcluidos;
          
          return (
            <div key={nota.id} className="col-md-4">
              <div className="card-nota" style={{ backgroundColor: nota.cor, color: nota.corTexto || '#000000' }}>
                <i
                  className={`bi bi-star-fill estrela ${nota.favorito ? 'favorito' : ''}`}
                  onClick={() => toggleFavorito(nota.id)}
                />
                <h5>{nota.titulo}</h5>
                <small>{nota.dataCriacao || ""}</small>
                
                {totalItens > 0 && (
                  <div className={`checklist-stats ${pendentes === 0 ? 'concluido' : 'pendente'}`}>
                    {pendentes === 0 ? '✅' : '📋'} {itensConcluidos}/{totalItens} itens {pendentes === 0 ? 'concluídos' : 'pendentes'}
                  </div>
                )}
                
                <div className="card-conteudo">
                  {nota.texto.replace(/<[^>]+>/g, "").slice(0, 100)}
                  
                  <div className="checklist-card">
                    {nota.checklist?.map((c, i) => (
                      <div key={i} className={`check-item ${c.checked ? 'completed' : ''}`}>
                        <input
                          type="checkbox"
                          checked={c.checked}
                          onChange={() => toggleChecklistItem(nota.id, i)}
                        />
                        <span>{c.texto}</span>
                        <button
                          className="btn-excluir-check"
                          onClick={() => excluirChecklistItem(nota.id, i)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {renderizarIndicadorAnexos(nota.anexos)}
                {renderizarAnexosCard(nota.anexos)}
                
                <div className="mt-2">
                  <button
                    className="btn btn-sm btn-warning btn-editar"
                    onClick={() => abrirModal(nota, notas.findIndex(n => n.id === nota.id))}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-sm btn-danger btn-excluir"
                    onClick={() => excluirNota(nota.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <div className="modal fade" id="notaModal" ref={modalRef} tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Nova Nota</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <label>Título</label>
              <input type="text" ref={tituloInputRef} className="form-control mb-2" />

              <label>Cor da nota</label>
              <input type="color" ref={corInputRef} className="form-control form-control-color mb-2" defaultValue="#ffffff" />

              <label>Cor do texto</label>
              <input type="color" ref={corTextoInputRef} className="form-control form-control-color mb-2" defaultValue="#000000" />

              <label>Texto <small style={{ color: 'gray' }}>(Selecione o texto antes de clicar em B/I/U)</small></label>
              <div className="mb-1">
                <button type="button" className="btn btn-sm btn-light" onClick={() => formatText('bold')}>
                  <strong>B</strong>
                </button>
                <button type="button" className="btn btn-sm btn-light" onClick={() => formatText('italic')}>
                  <em>I</em>
                </button>
                <button type="button" className="btn btn-sm btn-light" onClick={() => formatText('underline')}>
                  <u>U</u>
                </button>
              </div>
              <div
                ref={textoDivRef}
                className="form-control mb-2"
                contentEditable="true"
                style={{ height: '150px', overflow: 'auto' }}
              />
              <div className="contador-caracteres" style={{ textAlign: 'right', fontSize: '0.75rem', color: '#6c757d', marginTop: '5px' }}>
                <span id="contadorTexto">0</span> caracteres
              </div>

              <label>Checklist</label>
              <div id="checklistContainer" className="mb-2"></div>
              <button className="btn btn-success btn-sm" onClick={adicionarChecklistItem}>
                Adicionar Item
              </button>

              <br />
              <label className="mt-3">Anexos</label>
              <div
                className="anexos-area"
                style={{ border: '2px dashed #ccc', borderRadius: '10px', padding: '15px', textAlign: 'center', background: '#fafafa' }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = 'var(--cor-primaria)'; }}
                onDragLeave={(e) => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = '#ccc'; }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.style.background = '#fafafa';
                  e.currentTarget.style.borderColor = '#ccc';
                  processarImagens(e.dataTransfer.files);
                }}
              >
                <i className="bi bi-cloud-upload" style={{ fontSize: '2rem', color: 'var(--cor-primaria)' }}></i>
                <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>Arraste imagens ou clique para anexar</p>
                <input
                  type="file"
                  id="notaAnexos"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  ref={anexoInputRef}
                  onChange={(e) => processarImagens(e.target.files)}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => anexoInputRef.current?.click()}
                >
                  📁 Selecionar imagens
                </button>
              </div>
              <div id="previewAnexos" className="d-flex flex-wrap gap-2 mt-3"></div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={salvarNota}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
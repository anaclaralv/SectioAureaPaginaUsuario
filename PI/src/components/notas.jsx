import { useState, useEffect, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';
import './notas.css';
import { apiFetch } from '../api';

export default function Notas() {
  const [notas, setNotas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notaEditando, setNotaEditando] = useState(null);
  const [anexosTemp, setAnexosTemp] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);

  const modalRef = useRef(null);
  const modalInstanceRef = useRef(null);
  const tituloInputRef = useRef(null);
  const textoDivRef = useRef(null);
  const corInputRef = useRef(null);
  const corTextoInputRef = useRef(null);
  const anexoInputRef = useRef(null);

  const getModalInstance = () => {
    if (!modalRef.current || !window.bootstrap) return null;
    if (!modalInstanceRef.current) {
      modalInstanceRef.current = window.bootstrap.Modal.getOrCreateInstance(modalRef.current);
    }
    return modalInstanceRef.current;
  };

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
            corTexto: parsed.corTexto || '#000000',
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
    if (window.bootstrap && modalRef.current) {
      modalInstanceRef.current = window.bootstrap.Modal.getOrCreateInstance(modalRef.current);
    }
  }, [carregarNotas]);

  const atualizarContadorCaracteres = useCallback(() => {
    const textoDiv = textoDivRef.current;
    if (!textoDiv) return;
    const texto = textoDiv.innerText || textoDiv.textContent || '';
    const caracteres = texto.length;
    const contadorSpan = document.getElementById('contadorTexto');
    if (contadorSpan) {
      contadorSpan.textContent = caracteres;
      document.querySelector('.contador-caracteres')?.classList.toggle('alerta', caracteres > 5000);
    }
  }, []);

  const formatText = (command) => {
    document.execCommand(command, false, null);
    textoDivRef.current?.focus();
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

  const abrirModal = useCallback((nota = null) => {
    setNotaEditando(nota);
    if (tituloInputRef.current) tituloInputRef.current.value = nota?.titulo && nota.titulo !== 'Sem título' ? nota.titulo : (nota?.titulo || '');
    if (textoDivRef.current) textoDivRef.current.innerHTML = nota?.texto || '';
    if (corInputRef.current) corInputRef.current.value = nota?.cor || '#ffffff';
    if (corTextoInputRef.current) corTextoInputRef.current.value = nota?.corTexto || '#000000';
    setChecklistItems(nota?.checklist ? nota.checklist.map(c => ({ ...c })) : []);
    setAnexosTemp(nota?.anexos ? [...nota.anexos] : []);
    setTimeout(() => {
      atualizarContadorCaracteres();
    }, 50);
    getModalInstance()?.show();
  }, [atualizarContadorCaracteres]);

  const salvarNota = async () => {
    const titulo = (tituloInputRef.current?.value || '').trim();
    const textoHtml = textoDivRef.current?.innerHTML || '';
    const textoPuro = (textoDivRef.current?.innerText || '').trim();
    const cor = corInputRef.current?.value || '#ffffff';
    const corTexto = corTextoInputRef.current?.value || '#000000';

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
        corTexto,
        checklist: checklistItems,
        favorito: notaEditando ? Boolean(notaEditando.favorito) : false,
        dataCriacao: notaEditando?.dataCriacao || new Date().toLocaleString('pt-BR'),
        anexos: [...anexosTemp]
      }),
      cor_nota: cor
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

      setAnexosTemp([]);
      setChecklistItems([]);
      setNotaEditando(null);
      getModalInstance()?.hide();
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
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim',
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
    .filter(n =>
      (n.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.texto || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (b.favorito === a.favorito ? (a.titulo || '').localeCompare(b.titulo || '') : b.favorito ? 1 : -1));

  return (
    <section id="notasSection">
      <h1 className="mb-3"><i className="bi bi-journal"></i> Minhas Notas</h1>

      <div className="d-flex mb-3 justify-content-between">
        <input
          type="text"
          className="form-control me-2"
          placeholder="Pesquisar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn btn-primary" id="btnNova" onClick={() => abrirModal(null)}>
          <i className="bi bi-plus-lg me-1"></i> Nova
        </button>
      </div>

      <div id="notasContainer" className="row g-3">
        {notasFiltradas.map((nota) => {
          const totalItens = nota.checklist?.length || 0;
          const itensConcluidos = nota.checklist?.filter(c => c.checked).length || 0;
          return (
            <div key={nota.id} className="col-md-4">
              <div className="card-nota" style={{ backgroundColor: nota.cor, color: nota.corTexto }}>
                <i
                  className={`bi bi-star-fill estrela ${nota.favorito ? 'favorito' : ''}`}
                  onClick={() => toggleFavorito(nota.id)}
                />
                <h5>{nota.titulo}</h5>
                <small>{nota.dataCriacao}</small>
                {totalItens > 0 && (
                  <div className={`checklist-stats ${itensConcluidos === totalItens ? 'concluido' : 'pendente'}`}>
                    {itensConcluidos}/{totalItens} itens
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
                <div className="mt-2">
                  <button
                    className="btn btn-sm btn-warning btn-editar"
                    onClick={() => abrirModal(nota)}
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

      <div className="modal fade" id="notaModal" ref={modalRef} tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{notaEditando ? 'Editar Nota' : 'Nova Nota'}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <label>Título</label>
              <input type="text" ref={tituloInputRef} className="form-control mb-2" placeholder="Digite o título da nota" />
              <label>Cor da nota</label>
              <input type="color" ref={corInputRef} className="form-control form-control-color mb-2" defaultValue="#ffffff" />
              <label>Cor do texto</label>
              <input type="color" ref={corTextoInputRef} className="form-control form-control-color mb-2" defaultValue="#000000" />
              <label>Texto</label>
              <div className="mb-1">
                <button type="button" className="btn btn-sm btn-light me-1" onClick={() => formatText('bold')}><strong>B</strong></button>
                <button type="button" className="btn btn-sm btn-light" onClick={() => formatText('italic')}><em>I</em></button>
              </div>
              <div
                ref={textoDivRef}
                className="form-control mb-2"
                contentEditable="true"
                onInput={atualizarContadorCaracteres}
                style={{ height: '150px', overflowY: 'auto' }}
              />
              <label>Checklist</label>
              <div id="checklistContainer" className="mb-2">
                {checklistItems.map((item, i) => (
                  <div
                    key={i}
                    className={`check-item ${item.checked ? 'completed' : ''}`}
                    style={{ display: 'flex', marginBottom: '5px' }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(item.checked)}
                      onChange={(e) => atualizarItemChecklistModal(i, 'checked', e.target.checked)}
                      style={{ marginRight: '5px' }}
                    />
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={item.texto || ''}
                      onChange={(e) => atualizarItemChecklistModal(i, 'texto', e.target.value)}
                      style={{ flex: 1, marginRight: '5px' }}
                    />
                    <button
                      className="btn-excluir-check"
                      type="button"
                      onClick={() => removerItemChecklistModal(i)}
                      style={{ border: 'none', background: 'none' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-success btn-sm" onClick={adicionarChecklistItem}>
                Adicionar Item
              </button>
              <br />
              <label className="mt-3">Anexos</label>
              <div
                className="anexos-area"
                style={{ border: '2px dashed #ccc', padding: '15px', textAlign: 'center' }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  processarImagens(e.dataTransfer.files);
                }}
              >
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
              <div id="previewAnexos" className="d-flex flex-wrap gap-2 mt-3">
                {anexosTemp.map((anexo, index) => (
                  <div
                    key={index}
                    className="anexo-thumb"
                    onClick={() => abrirLightbox(anexo.data)}
                  >
                    <img src={anexo.data} alt={anexo.nome || 'Preview'} />
                    <button
                      type="button"
                      className="btn-remover-anexo"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnexosTemp(prev => prev.filter((_, idx) => idx !== index));
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
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
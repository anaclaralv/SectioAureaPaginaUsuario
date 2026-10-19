import { useState, useEffect, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';
import './notas.css';
import { apiFetch } from '../api';

export default function Notas() {
  const [notas, setNotas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notaEditandoIndex, setNotaEditandoIndex] = useState(null);
  const [anexosTemp, setAnexosTemp] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  
  const modalRef = useRef(null);
  const modalInstanceRef = useRef(null);
  const tituloInputRef = useRef(null);
  const textoDivRef = useRef(null);
  const corInputRef = useRef(null);
  const corTextoInputRef = useRef(null);
  const anexoInputRef = useRef(null);

  const carregarNotas = async () => {
    try {
      const response = await apiFetch('blocos');
      if (response.ok) {
        const data = await response.json();
        const notasFormatadas = data.map(n => {
          let parsed = {};
          try {
            let str = n.conteudo;
            if (str.includes('&quot;')) {
              const txt = document.createElement('textarea');
              txt.innerHTML = str;
              str = txt.value;
            }
            parsed = JSON.parse(str);
          } catch (e) {
            parsed = { texto: n.conteudo };
          }
          return {
            id: n.id_anotacao,
            titulo: parsed.titulo || "Sem título",
            texto: parsed.texto || "",
            cor: n.cor_nota || "#ffffff",
            corTexto: parsed.corTexto || "#000000",
            checklist: parsed.checklist || [],
            anexos: parsed.anexos || [],
            favorito: parsed.favorito || false,
            dataCriacao: parsed.dataCriacao || ""
          };
        });
        setNotas(notasFormatadas);
      }
    } catch (err) {
      console.error("Erro ao carregar notas:", err);
    }
  };

  useEffect(() => {
    carregarNotas();
    if (window.bootstrap && modalRef.current) {
      modalInstanceRef.current = new window.bootstrap.Modal(modalRef.current);
    }
  }, []);

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

  const renderizarChecklistModal = (items) => {
    const container = document.getElementById('checklistContainer');
    if (!container) return;
    container.innerHTML = '';
    items.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = `check-item ${item.checked ? 'completed' : ''}`;
      div.style.display = 'flex';
      div.style.marginBottom = '5px';
      div.innerHTML = `
        <input type="checkbox" ${item.checked ? 'checked' : ''} style="margin-right:5px;">
        <input type="text" class="form-control form-control-sm" value="${item.texto || ''}" style="flex:1; margin-right:5px;">
        <button class="btn-excluir-check" type="button" style="border:none; background:none;">✕</button>
      `;
      const checkbox = div.querySelector('input[type="checkbox"]');
      const textoInput = div.querySelector('input[type="text"]');
      checkbox.addEventListener('change', () => { item.checked = checkbox.checked; });
      textoInput.addEventListener('input', () => { item.texto = textoInput.value; });
      div.querySelector('.btn-excluir-check').addEventListener('click', () => {
        const newItems = items.filter((_, idx) => idx !== i);
        renderizarChecklistModal(newItems); setChecklistItems(newItems);
      });
      container.appendChild(div);
    });
  };

  const adicionarChecklistItem = () => {
    const novosItens = [...checklistItems, { texto: '', checked: false }];
    setChecklistItems(novosItens);
    renderizarChecklistModal(novosItens);
  };

  const processarImagens = useCallback((files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = (e) => setAnexosTemp(prev => [...prev, { nome: file.name, data: e.target.result }]);
      reader.readAsDataURL(file);
    });
  }, []);

  const renderizarPreviews = useCallback(() => {
    const container = document.getElementById('previewAnexos');
    if (!container) return;
    container.innerHTML = anexosTemp.map((anexo, index) => `
      <div class="anexo-thumb" onclick="window.abrirLightbox && window.abrirLightbox('${anexo.data}')">
        <img src="${anexo.data}"><button class="btn-remover-anexo" onclick="event.stopPropagation(); window.removerAnexo(${index})">✕</button>
      </div>
    `).join('');
  }, [anexosTemp]);

  const abrirLightbox = (src) => {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.onclick = (e) => { if (e.target === lightbox) lightbox.remove(); };
    lightbox.innerHTML = `<button class="btn-fechar-lightbox">✕</button><img src="${src}">`;
    document.body.appendChild(lightbox);
  };

  useEffect(() => {
    window.removerAnexo = (i) => setAnexosTemp(prev => prev.filter((_, idx) => idx !== i));
    window.abrirLightbox = abrirLightbox;
    renderizarPreviews();
  }, [anexosTemp, renderizarPreviews]);

  const abrirModal = useCallback((nota = null, index = null) => {
    setNotaEditandoIndex(index);
    if (tituloInputRef.current) tituloInputRef.current.value = nota?.titulo || '';
    if (textoDivRef.current) textoDivRef.current.innerHTML = nota?.texto || '';
    if (corInputRef.current) corInputRef.current.value = nota?.cor || '#ffffff';
    if (corTextoInputRef.current) corTextoInputRef.current.value = nota?.corTexto || '#000000';
    const checklist = nota?.checklist ? [...nota.checklist] : [];
    setChecklistItems(checklist);
    setAnexosTemp(nota?.anexos ? [...nota.anexos] : []);
    setTimeout(() => { renderizarChecklistModal(checklist); atualizarContadorCaracteres(); }, 100);
    modalInstanceRef.current?.show();
  }, []);

  const salvarNota = async () => {
    const titulo = tituloInputRef.current?.value || '';
    const texto = textoDivRef.current?.innerHTML || '';
    const cor = corInputRef.current?.value || '#ffffff';
    const corTexto = corTextoInputRef.current?.value || '#000000';
    const payload = {
      conteudo: JSON.stringify({
        titulo, texto, corTexto, checklist: checklistItems,
        favorito: notaEditandoIndex !== null ? notas[notaEditandoIndex].favorito : false,
        dataCriacao: notaEditandoIndex !== null ? notas[notaEditandoIndex].dataCriacao : new Date().toLocaleString(),
        anexos: [...anexosTemp]
      }),
      cor_nota: cor
    };
    try {
      if (notaEditandoIndex !== null) await apiFetch(`blocos/${notas[notaEditandoIndex].id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await apiFetch('blocos', { method: 'POST', body: JSON.stringify(payload) });
      setAnexosTemp([]); setChecklistItems([]);
      modalInstanceRef.current?.hide(); carregarNotas();
      Swal.fire({ icon: 'success', title: 'Nota salva!', timer: 1500, showConfirmButton: false });
    } catch (err) { Swal.fire('Erro', 'Não foi possível salvar.', 'error'); }
  };

  const excluirNota = (id) => {
    Swal.fire({ title: 'Excluir nota?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sim' }).then(async (result) => {
      if (result.isConfirmed) { await apiFetch(`blocos/${id}`, { method: 'DELETE' }); carregarNotas(); }
    });
  };

  const toggleFavorito = async (id) => {
    const nota = notas.find(n => n.id === id);
    const payload = {
      conteudo: JSON.stringify({ titulo: nota.titulo, texto: nota.texto, corTexto: nota.corTexto, checklist: nota.checklist, favorito: !nota.favorito, dataCriacao: nota.dataCriacao, anexos: nota.anexos }),
      cor_nota: nota.cor
    };
    await apiFetch(`blocos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    carregarNotas();
  };

  const toggleChecklistItem = async (notaId, checkIndex) => {
    const nota = notas.find(n => n.id === notaId);
    const novoChecklist = [...nota.checklist];
    novoChecklist[checkIndex].checked = !novoChecklist[checkIndex].checked;
    const payload = {
      conteudo: JSON.stringify({ titulo: nota.titulo, texto: nota.texto, corTexto: nota.corTexto, checklist: novoChecklist, favorito: nota.favorito, dataCriacao: nota.dataCriacao, anexos: nota.anexos }),
      cor_nota: nota.cor
    };
    await apiFetch(`blocos/${notaId}`, { method: 'PUT', body: JSON.stringify(payload) });
    carregarNotas();
  };

  const notasFiltradas = notas
    .filter(n => n.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || n.texto.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (b.favorito === a.favorito ? a.titulo.localeCompare(b.titulo) : b.favorito ? 1 : -1));

  return (
    <section id="notasSection">
      <h1 className="mb-3"><i className="bi bi-journal"></i> Minhas Notas</h1>
      
      <div className="d-flex mb-3 justify-content-between">
        <input type="text" className="form-control me-2" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <button className="btn btn-primary" id="btnNova" onClick={() => abrirModal()}><i className="fa fa-plus"></i> Nova</button>
      </div>

      <div id="notasContainer" className="row g-3">
        {notasFiltradas.map((nota) => {
          const totalItens = nota.checklist?.length || 0;
          const itensConcluidos = nota.checklist?.filter(c => c.checked).length || 0;
          return (
            <div key={nota.id} className="col-md-4">
              <div className="card-nota" style={{ backgroundColor: nota.cor, color: nota.corTexto }}>
                <i className={`bi bi-star-fill estrela ${nota.favorito ? 'favorito' : ''}`} onClick={() => toggleFavorito(nota.id)} />
                <h5>{nota.titulo}</h5>
                <small>{nota.dataCriacao}</small>
                {totalItens > 0 && <div className={`checklist-stats ${itensConcluidos === totalItens ? 'concluido' : 'pendente'}`}>{itensConcluidos}/{totalItens} itens</div>}
                <div className="card-conteudo">
                  {nota.texto.replace(/<[^>]+>/g, "").slice(0, 100)}
                  <div className="checklist-card">
                    {nota.checklist?.map((c, i) => (
                      <div key={i} className={`check-item ${c.checked ? 'completed' : ''}`}>
                        <input type="checkbox" checked={c.checked} onChange={() => toggleChecklistItem(nota.id, i)} />
                        <span>{c.texto}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-2">
                  <button className="btn btn-sm btn-warning btn-editar" onClick={() => abrirModal(nota, notas.findIndex(n => n.id === nota.id))}>Editar</button>
                  <button className="btn btn-sm btn-danger btn-excluir" onClick={() => excluirNota(nota.id)}>Excluir</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Bootstrap mantido igual */}
      <div className="modal fade" id="notaModal" ref={modalRef} tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">Nova Nota</h5><button type="button" className="btn-close" data-bs-dismiss="modal"></button></div>
            <div className="modal-body">
              <label>Título</label><input type="text" ref={tituloInputRef} className="form-control mb-2" />
              <label>Cor da nota</label><input type="color" ref={corInputRef} className="form-control form-control-color mb-2" defaultValue="#ffffff" />
              <label>Cor do texto</label><input type="color" ref={corTextoInputRef} className="form-control form-control-color mb-2" defaultValue="#000000" />
              <label>Texto</label>
              <div className="mb-1">
                <button type="button" className="btn btn-sm btn-light" onClick={() => formatText('bold')}><strong>B</strong></button>
                <button type="button" className="btn btn-sm btn-light" onClick={() => formatText('italic')}><em>I</em></button>
              </div>
              <div ref={textoDivRef} className="form-control mb-2" contentEditable="true" style={{ height: '150px' }} />
              <label>Checklist</label><div id="checklistContainer" className="mb-2"></div><button className="btn btn-success btn-sm" onClick={adicionarChecklistItem}>Adicionar Item</button>
              <br /><label className="mt-3">Anexos</label>
              <div className="anexos-area" style={{ border: '2px dashed #ccc', padding: '15px', textAlign: 'center' }} onDrop={(e) => { e.preventDefault(); processarImagens(e.dataTransfer.files); }}>
                <input type="file" id="notaAnexos" accept="image/*" multiple style={{ display: 'none' }} ref={anexoInputRef} onChange={(e) => processarImagens(e.target.files)} />
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => anexoInputRef.current?.click()}>📁 Selecionar imagens</button>
              </div>
              <div id="previewAnexos" className="d-flex flex-wrap gap-2 mt-3"></div>
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-primary" onClick={salvarNota}>Salvar</button></div>
          </div>
        </div>
      </div>
    </section>
  );
}
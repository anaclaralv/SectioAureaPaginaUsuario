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
  
  // === NOVOS STATES PARA O MODO CORNELL ===
  const [modoCornell, setModoCornell] = useState(false);
  const [modoRevisao, setModoRevisao] = useState(false);
  const [inteligenciaAtual, setInteligenciaAtual] = useState('');
  const [perguntaAtual, setPerguntaAtual] = useState('');
  const [respostaAtual, setRespostaAtual] = useState('');
  const [notasCornell, setNotasCornell] = useState([]);
  
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
    // Verifica se está no modo Cornell
    const modoAtivo = localStorage.getItem('modoCornellAtivo') === 'true';
    setModoCornell(modoAtivo);
    
    // Pega a inteligência atual
    const inteligencia = localStorage.getItem('inteligenciaUsuario') || 'logico';
    setInteligenciaAtual(inteligencia);
    
    const notasSalvas = localStorage.getItem('notas');
    if (notasSalvas) {
      try {
        let loadedNotas = JSON.parse(notasSalvas);
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
    
    // Carrega notas Cornell específicas para a inteligência
    const chaveCornell = `notasCornell_${inteligencia}`;
    const notasCornellSalvas = localStorage.getItem(chaveCornell);
    if (notasCornellSalvas) {
      try {
        setNotasCornell(JSON.parse(notasCornellSalvas));
      } catch (e) {
        setNotasCornell([]);
      }
    }

    // Listener para ativar modo Cornell
    const handleAtivarCornell = (e) => {
      setModoCornell(e.detail.ativo);
      if (e.detail.ativo) {
        setModoRevisao(false);
      }
    };

    window.addEventListener('ativarModoCornell', handleAtivarCornell);
    
    return () => {
      window.removeEventListener('ativarModoCornell', handleAtivarCornell);
    };
  }, []);

  // Salvar notas normais
  useEffect(() => {
    localStorage.setItem('notas', JSON.stringify(notas));
  }, [notas]);

  // Salvar notas Cornell
  useEffect(() => {
    if (notasCornell.length > 0 && inteligenciaAtual) {
      const chaveCornell = `notasCornell_${inteligenciaAtual}`;
      localStorage.setItem(chaveCornell, JSON.stringify(notasCornell));
    }
  }, [notasCornell, inteligenciaAtual]);

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
      });
      
      textoInput.addEventListener('input', () => {
        item.texto = textoInput.value;
      });
      
      btnExcluir.addEventListener('click', () => {
        const updatedItems = items.filter((_, idx) => idx !== i);
        renderizarChecklistModal(updatedItems);
        setChecklistItems(updatedItems);
      });
      
      container.appendChild(div);
    });
  }, []);

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

  // === NOVAS FUNÇÕES PARA O MODO CORNELL ===
  
  // Alternar modo revisão
  const alternarModoRevisao = () => {
    setModoRevisao(!modoRevisao);
  };

  // Adicionar nota Cornell
  const adicionarNotaCornell = () => {
    if (perguntaAtual.trim() && respostaAtual.trim()) {
      const novaNotaCornell = {
        id: 'cornell_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        pergunta: perguntaAtual,
        resposta: respostaAtual,
        data: new Date().toLocaleString()
      };
      setNotasCornell([...notasCornell, novaNotaCornell]);
      setPerguntaAtual('');
      setRespostaAtual('');
      
      // Feedback visual
      const btn = document.querySelector('.btn-adicionar-cornell');
      if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ Adicionado!';
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 1500);
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Preencha tanto a pergunta quanto a resposta!',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  // Excluir nota Cornell
  const excluirNotaCornell = (id) => {
    Swal.fire({
      title: 'Excluir anotação Cornell?',
      text: "Essa ação não pode ser desfeita!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir'
    }).then(result => {
      if (result.isConfirmed) {
        setNotasCornell(notasCornell.filter(n => n.id !== id));
        Swal.fire('Excluída!', '', 'success');
      }
    });
  };

  // Revelar resposta individual no modo revisão
  const revelarResposta = (pergunta, resposta) => {
    Swal.fire({
      title: '📝 Pergunta',
      html: `<div style="text-align: left; padding: 10px;">
        <p><strong>Pergunta:</strong></p>
        <p style="background: #f8f9fa; padding: 10px; border-radius: 8px;">${pergunta}</p>
        <p><strong>💡 Resposta:</strong></p>
        <p style="background: #e8f5e9; padding: 10px; border-radius: 8px;">${resposta}</p>
      </div>`,
      icon: 'info',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Entendi!'
    });
  };

  // Obter dicas específicas por inteligência
  const getDicaInteligencia = () => {
    const dicas = {
      logico: "Use o lado esquerdo para fórmulas matemáticas e o direito para aplicações práticas.",
      intrapessoal: "Use perguntas reflexivas à esquerda e suas reflexões pessoais à direita.",
      espacial: "Use o lado esquerdo para diagramas mentais e o direito para descrições detalhadas."
    };
    return dicas[inteligenciaAtual] || "Organize suas perguntas à esquerda e respostas à direita.";
  };

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
    if (anexoInputRef.current) {
      anexoInputRef.current.value = '';
    }
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

  // Obter cores por inteligência
  const getCoresInteligencia = () => {
    const cores = {
      logico: { primaria: '#ffbd59', secundaria: '#ffa726' },
      intrapessoal: { primaria: '#5170ff', secundaria: '#3d5cbf' },
      espacial: { primaria: '#d203a4', secundaria: '#a80283' }
    };
    return cores[inteligenciaAtual] || cores.logico;
  };

  const cores = getCoresInteligencia();

  return (
    <section id="notasSection">
      <h1 className="mb-3">
        {modoCornell ? (
          <>
            <i className="bi bi-journal-text" style={{ color: cores.primaria }}></i>
            Método Cornell
            <span className="inteligencia-badge-cornell" style={{ 
              background: cores.primaria,
              marginLeft: '12px',
              fontSize: '14px',
              padding: '4px 12px',
              borderRadius: '20px',
              color: '#fff',
              display: 'inline-block'
            }}>
              {inteligenciaAtual === 'logico' ? '🧮 Lógico-Matemática' :
               inteligenciaAtual === 'intrapessoal' ? '🧠 Intrapessoal' : '🌌 Espacial'}
            </span>
          </>
        ) : (
          <>
            <i className="bi bi-journal"></i>
            Minhas Notas
          </>
        )}
      </h1>
      
      {modoCornell ? (
        // ===== MODO CORNELL =====
        <div className="cornell-container">
          <div className="cornell-info" style={{ 
            background: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '20px',
            borderLeft: `4px solid ${cores.primaria}`
          }}>
            <div className="cornell-explicacao">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0 }}><strong>📝 Método Cornell:</strong> Divida a página em duas colunas:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '12px' }}>
                    <div style={{ padding: '10px', background: '#fff3f3', borderRadius: '8px', borderLeft: '4px solid #dc3545' }}>
                      <strong style={{ color: '#dc3545' }}>❓ Esquerda:</strong>
                      <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                        Perguntas e Fórmulas
                      </p>
                      <small style={{ color: '#999', fontSize: '12px' }}>{getDicaInteligencia()}</small>
                    </div>
                    <div style={{ padding: '10px', background: '#f0fff4', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
                      <strong style={{ color: '#28a745' }}>💡 Direita:</strong>
                      <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                        Respostas e Explicações
                      </p>
                      <small style={{ color: '#999', fontSize: '12px' }}>Anote as respostas de forma clara e completa.</small>
                    </div>
                  </div>
                </div>
                <button 
                  className={`btn-revisao ${modoRevisao ? 'ativo' : ''}`}
                  onClick={alternarModoRevisao}
                  style={{
                    background: modoRevisao ? cores.primaria : 'transparent',
                    color: modoRevisao ? '#fff' : cores.primaria,
                    border: `2px solid ${cores.primaria}`,
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.3s',
                    marginTop: '10px'
                  }}
                >
                  <i className={`bi ${modoRevisao ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  {modoRevisao ? ' Desativar Revisão' : ' Ativar Revisão'}
                </button>
              </div>
            </div>
          </div>

          <div className="cornell-input" style={{ marginBottom: '30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="coluna-esquerda">
                <label style={{ display: 'block', fontWeight: 'bold', color: '#dc3545', marginBottom: '5px' }}>
                  <span>❓</span> Perguntas e Fórmulas
                </label>
                <textarea
                  value={perguntaAtual}
                  onChange={(e) => setPerguntaAtual(e.target.value)}
                  placeholder={inteligenciaAtual === 'logico' ? 
                    "Ex: Qual a fórmula de Bhaskara?" :
                    inteligenciaAtual === 'intrapessoal' ?
                    "Ex: Como me sinto em relação a este tema?" :
                    "Ex: Como visualizo este conceito espacialmente?"
                  }
                  rows="3"
                  className="form-control"
                  style={{ borderColor: '#dc3545' }}
                />
                <small style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#666' }}>
                  {inteligenciaAtual === 'logico' ? '🔢 Use fórmulas e equações' :
                   inteligenciaAtual === 'intrapessoal' ? '🧠 Use perguntas reflexivas' :
                   '🌌 Use perguntas sobre visualização'}
                </small>
              </div>
              <div className="coluna-direita">
                <label style={{ display: 'block', fontWeight: 'bold', color: '#28a745', marginBottom: '5px' }}>
                  <span>💡</span> Respostas e Explicações
                </label>
                <textarea
                  value={respostaAtual}
                  onChange={(e) => setRespostaAtual(e.target.value)}
                  placeholder="Ex: x = (-b ± √(b²-4ac)) / 2a"
                  rows="3"
                  className="form-control"
                  style={{ borderColor: '#28a745' }}
                />
                <small style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#666' }}>
                  📝 Escreva a resposta de forma clara e detalhada
                </small>
              </div>
            </div>
            <button 
              className="btn-adicionar-cornell"
              onClick={adicionarNotaCornell}
              style={{
                background: cores.primaria,
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                marginTop: '15px',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <i className="bi bi-plus-lg"></i>
              Adicionar ao Caderno Cornell
            </button>
          </div>

          <div className="notas-lista">
            <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📒 Caderno Cornell</span>
              <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#999' }}>
                {notasCornell.length} anotações
              </span>
            </h3>
            
            {notasCornell.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                background: '#f8f9fa', 
                borderRadius: '12px' 
              }}>
                <i className="bi bi-journal-text" style={{ fontSize: '48px', color: '#ccc' }}></i>
                <p style={{ margin: '10px 0 0 0', color: '#666' }}>Nenhuma anotação Cornell ainda.</p>
                <p style={{ fontSize: '14px', color: '#999' }}>Adicione perguntas e respostas para começar!</p>
              </div>
            ) : (
              <div className={`row g-3 ${modoRevisao ? 'modo-revisao' : ''}`}>
                {notasCornell.map((nota) => (
                  <div key={nota.id} className="col-md-6">
                    <div className="card-nota" style={{ 
                      background: '#fff', 
                      border: `2px solid ${cores.primaria}`,
                      borderRadius: '12px',
                      padding: '15px',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div style={{ borderRight: '2px solid #e0e0e0', paddingRight: '15px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc3545', textTransform: 'uppercase' }}>
                            ❓ Pergunta:
                          </span>
                          <p className={`texto-pergunta ${modoRevisao ? 'revisao-oculta' : ''}`} style={{ 
                            color: '#dc3545', 
                            fontWeight: '500',
                            marginTop: '5px',
                            filter: modoRevisao ? 'blur(8px)' : 'none',
                            cursor: modoRevisao ? 'pointer' : 'default',
                            transition: 'filter 0.3s'
                          }}>
                            {nota.pergunta}
                          </p>
                          {modoRevisao && (
                            <button 
                              className="btn-revelar-resposta"
                              onClick={() => revelarResposta(nota.pergunta, nota.resposta)}
                              style={{
                                background: cores.primaria,
                                color: '#fff',
                                border: 'none',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                marginTop: '8px'
                              }}
                            >
                              <i className="bi bi-eye"></i> Ver Resposta
                            </button>
                          )}
                        </div>
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#28a745', textTransform: 'uppercase' }}>
                            💡 Resposta:
                          </span>
                          <p className={`texto-resposta ${modoRevisao ? 'revisao-oculta' : ''}`} style={{ 
                            color: '#28a745', 
                            fontWeight: '500',
                            marginTop: '5px',
                            filter: modoRevisao ? 'blur(8px)' : 'none',
                            transition: 'filter 0.3s'
                          }}>
                            {nota.resposta}
                          </p>
                        </div>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #f0f0f0'
                      }}>
                        <span style={{ fontSize: '12px', color: '#999' }}>📅 {nota.data}</span>
                        <button 
                          className="btn-excluir"
                          onClick={() => excluirNotaCornell(nota.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc3545',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // ===== MODO NORMAL DE NOTAS =====
        <>
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
        </>
      )}

      {/* Modal - Mantido igual */}
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

      <style>{`
        /* Estilos específicos para o modo revisão */
        .modo-revisao .revisao-oculta {
          filter: blur(8px);
          cursor: pointer;
          transition: filter 0.3s;
        }
        
        .modo-revisao .revisao-oculta:hover {
          filter: blur(2px);
        }
        
        .btn-revisao {
          transition: all 0.3s;
        }
        
        .btn-revisao:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .inteligencia-badge-cornell {
          animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Responsividade */
        @media (max-width: 768px) {
          .cornell-info > div {
            flex-direction: column;
          }
          
          .cornell-info > div > div:first-child {
            width: 100%;
          }
          
          .cornell-info > div > div:last-child {
            margin-top: 10px;
          }
        }
      `}</style>
    </section>
  );
}
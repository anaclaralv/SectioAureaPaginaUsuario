import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './cronograma.css';

export default function Cronograma() {
  const [materias, setMaterias] = useState([]);
  const [cronograma, setCronograma] = useState([]);
  const [novaMateria, setNovaMateria] = useState({ nome: '', cor: '#9f042c' });
  const [draggedMateria, setDraggedMateria] = useState(null);

  const diasSemana = [
    { id: 'segunda', nome: 'Segunda' },
    { id: 'terca', nome: 'Terça' },
    { id: 'quarta', nome: 'Quarta' },
    { id: 'quinta', nome: 'Quinta' },
    { id: 'sexta', nome: 'Sexta' },
    { id: 'sabado', nome: 'Sábado' },
    { id: 'domingo', nome: 'Domingo' }
  ];

  // ==================== FUNÇÕES PARA SALVAR ====================
  const salvarMaterias = (novasMaterias) => {
  localStorage.setItem('materias', JSON.stringify(novasMaterias));
  console.log("💾 Matérias salvas:", novasMaterias);
  
  // FORÇAR sincronização com todas as abas
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('materiasAtualizadas', { detail: novasMaterias }));
  
  // Verificar se salvou
  const verificacao = localStorage.getItem('materias');
  console.log("✅ Verificação - localStorage agora tem:", verificacao);
};

  const salvarCronograma = (novoCronograma) => {
    localStorage.setItem('cronogramaNovo', JSON.stringify(novoCronograma));
    console.log("💾 Cronograma salvo:", novoCronograma);
    window.dispatchEvent(new Event('cronogramaAtualizado'));
    window.dispatchEvent(new Event('storage'));
  };

  // ==================== CARREGAR DADOS ====================
useEffect(() => {
  console.log("🔄 Cronograma - Carregando dados...");
  
  // Carregar matérias - IMPORTANTE: verificar também dentro do cronograma
  let materiasCarregadas = [];
  
  const materiasSalvas = localStorage.getItem('materias');
  console.log("📥 Matérias salvas no localStorage:", materiasSalvas);
  
  if (materiasSalvas) {
    try {
      materiasCarregadas = JSON.parse(materiasSalvas);
      setMaterias(materiasCarregadas);
      console.log("📥 Matérias carregadas:", materiasCarregadas);
    } catch(e) {
      console.error("Erro ao carregar matérias:", e);
      materiasCarregadas = [];
    }
  }

  // Carregar cronograma
  const cronogramaSalvo = localStorage.getItem('cronogramaNovo');
  if (cronogramaSalvo) {
    try {
      const cronogramaCarregado = JSON.parse(cronogramaSalvo);
      setCronograma(cronogramaCarregado);
      console.log("📥 Cronograma carregado:", cronogramaCarregado);
      
      // 🔥 IMPORTANTE: Extrair matérias do cronograma se a lista de matérias estiver vazia
      if (materiasCarregadas.length === 0 && cronogramaCarregado.length > 0) {
        const materiasDoCronograma = [];
        cronogramaCarregado.forEach(bloco => {
          if (bloco.materia && !materiasDoCronograma.some(m => m.id === bloco.materia.id)) {
            materiasDoCronograma.push(bloco.materia);
          }
        });
        
        if (materiasDoCronograma.length > 0) {
          console.log("📥 Extraindo matérias do cronograma:", materiasDoCronograma);
          setMaterias(materiasDoCronograma);
          localStorage.setItem('materias', JSON.stringify(materiasDoCronograma));
        }
      }
    } catch(e) {
      console.error("Erro ao carregar cronograma:", e);
    }
  }
}, []);

// Sincronizar matérias com o cronograma (garantir consistência)
const sincronizarMateriasComCronograma = () => {
  // Extrair todas as matérias únicas do cronograma
  const materiasDoCronograma = [];
  cronograma.forEach(bloco => {
    if (bloco.materia && !materiasDoCronograma.some(m => m.id === bloco.materia.id)) {
      materiasDoCronograma.push(bloco.materia);
    }
  });
  
  // Verificar se há matérias no cronograma que não estão na lista
  if (materiasDoCronograma.length > materias.length) {
    console.log("🔄 Sincronizando matérias com o cronograma...");
    setMaterias(materiasDoCronograma);
    localStorage.setItem('materias', JSON.stringify(materiasDoCronograma));
  }
};

// Chamar essa função sempre que o cronograma mudar
useEffect(() => {
  sincronizarMateriasComCronograma();
}, [cronograma]);

  // Sincronizar com outras abas/páginas
  useEffect(() => {
    const handleExternalUpdate = () => {
      const materiasSalvas = localStorage.getItem('materias');
      if (materiasSalvas) {
        try {
          setMaterias(JSON.parse(materiasSalvas));
        } catch(e) {}
      }
      const cronogramaSalvo = localStorage.getItem('cronogramaNovo');
      if (cronogramaSalvo) {
        try {
          setCronograma(JSON.parse(cronogramaSalvo));
        } catch(e) {}
      }
    };
    
    window.addEventListener('storage', handleExternalUpdate);
    window.addEventListener('materiasAtualizadas', handleExternalUpdate);
    
    return () => {
      window.removeEventListener('storage', handleExternalUpdate);
      window.removeEventListener('materiasAtualizadas', handleExternalUpdate);
    };
  }, []);

  // ==================== ADICIONAR MATÉRIA ====================
  const adicionarMateria = () => {
    if (!novaMateria.nome.trim()) {
      Swal.fire({ icon: 'warning', title: 'Ops!', text: 'Digite o nome da matéria!', timer: 2000 });
      return;
    }

    const existe = materias.some(m => m.nome.toLowerCase() === novaMateria.nome.toLowerCase());
    if (existe) {
      Swal.fire({ icon: 'error', title: 'Já existe!', text: `A matéria "${novaMateria.nome}" já foi cadastrada.`, timer: 2000 });
      return;
    }

    const nova = {
      id: Date.now().toString(),
      nome: novaMateria.nome,
      cor: novaMateria.cor
    };

    const novasMaterias = [...materias, nova];
    
    setMaterias(novasMaterias);
    salvarMaterias(novasMaterias);
    setNovaMateria({ nome: '', cor: '#9f042c' });

    Swal.fire({ 
      icon: 'success', 
      title: 'Pronto!', 
      text: `Matéria "${nova.nome}" adicionada!`, 
      timer: 1500, 
      showConfirmButton: false
    });
  };

  // ==================== EDITAR MATÉRIA ====================
  const editarMateria = (materia) => {
    Swal.fire({
      title: `Opções para "${materia.nome}"`,
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">✏️ Nome da matéria:</label>
            <input type="text" id="editNome" class="swal2-input" value="${materia.nome}" style="width: 100%;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">🎨 Cor da matéria:</label>
            <input type="color" id="editCor" class="swal2-input" value="${materia.cor}" style="width: 100%;">
          </div>
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            <p style="color: #ef4444; font-size: 0.8rem; margin-bottom: 10px;">⚠️ Cuidado: Excluir a matéria também remove todos os horários dela no cronograma!</p>
          </div>
        </div>
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '💾 Salvar Alterações',
      denyButtonText: '🗑️ Excluir Matéria',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#22c55e',
      denyButtonColor: '#ef4444',
      preConfirm: () => {
        const novoNome = document.getElementById('editNome').value.trim();
        if (!novoNome) {
          Swal.showValidationMessage('O nome da matéria não pode ficar vazio!');
          return false;
        }
        return { novoNome, novaCor: document.getElementById('editCor').value };
      }
    }).then(result => {
      if (result.isConfirmed) {
        const { novoNome, novaCor } = result.value;
        
        const novasMaterias = materias.map(m =>
          m.id === materia.id ? { ...m, nome: novoNome, cor: novaCor } : m
        );
        setMaterias(novasMaterias);
        salvarMaterias(novasMaterias);

        const novoCronograma = cronograma.map(bloco =>
          bloco.materia.id === materia.id ? { ...bloco, materia: { ...bloco.materia, nome: novoNome, cor: novaCor } } : bloco
        );
        setCronograma(novoCronograma);
        salvarCronograma(novoCronograma);
        
        Swal.fire({ 
          icon: 'success', 
          title: 'Matéria atualizada!', 
          text: `"${materia.nome}" agora é "${novoNome}"`,
          timer: 1500, 
          showConfirmButton: false 
        });
        
      } else if (result.isDenied) {
        Swal.fire({
          title: `Excluir "${materia.nome}"?`,
          html: `
            <p>Esta ação:</p>
            <ul style="text-align: left; color: #ef4444;">
              <li>❌ Remove a matéria permanentemente</li>
              <li>❌ Remove todos os horários desta matéria no cronograma</li>
              <li>❌ Não pode ser desfeita</li>
            </ul>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sim, excluir tudo!',
          confirmButtonColor: '#dc3545',
          cancelButtonText: 'Cancelar'
        }).then(confirmResult => {
          if (confirmResult.isConfirmed) {
            const novasMaterias = materias.filter(m => m.id !== materia.id);
            setMaterias(novasMaterias);
            salvarMaterias(novasMaterias);
            
            const novoCronograma = cronograma.filter(b => b.materia.id !== materia.id);
            setCronograma(novoCronograma);
            salvarCronograma(novoCronograma);
            
            Swal.fire({ 
              icon: 'success', 
              title: 'Matéria excluída!', 
              text: `"${materia.nome}" foi removida do sistema.`,
              timer: 1500, 
              showConfirmButton: false 
            });
          }
        });
      }
    });
  };

  // ==================== ADICIONAR BLOCO ====================
  const adicionarBloco = (materia, dia) => {
    Swal.fire({
      title: `Horário de ${materia.nome}`,
      html: `
        <div style="display: flex; gap: 10px; justify-content: center;">
          <div>
            <label>Início</label>
            <input type="time" id="inicio" class="swal2-input" value="08:00">
          </div>
          <div>
            <label>Fim</label>
            <input type="time" id="fim" class="swal2-input" value="09:00">
          </div>
        </div>
      `,
      confirmButtonText: 'Salvar',
      showCancelButton: true,
      preConfirm: () => {
        const inicio = document.getElementById('inicio').value;
        const fim = document.getElementById('fim').value;
        
        if (!inicio || !fim) {
          Swal.showValidationMessage('Preencha os dois horários!');
          return false;
        }
        
        if (fim <= inicio) {
          Swal.showValidationMessage('Horário final deve ser maior que o inicial!');
          return false;
        }

        const blocosDoDia = cronograma.filter(b => b.dia === dia);
        const temConflito = blocosDoDia.some(b => {
          return (inicio >= b.inicio && inicio < b.fim) ||
                 (fim > b.inicio && fim <= b.fim) ||
                 (inicio <= b.inicio && fim >= b.fim);
        });

        if (temConflito) {
          Swal.showValidationMessage('Já existe uma matéria nesse horário!');
          return false;
        }

        return { inicio, fim };
      }
    }).then(result => {
      if (result.isConfirmed) {
        const novoBloco = {
          id: Date.now(),
          materia: { ...materia },
          dia: dia,
          inicio: result.value.inicio,
          fim: result.value.fim
        };
        const novoCronograma = [...cronograma, novoBloco];
        setCronograma(novoCronograma);
        salvarCronograma(novoCronograma);
        Swal.fire({ icon: 'success', title: 'Horário adicionado!', timer: 1500, showConfirmButton: false });
      }
    });
  };

  // ==================== EDITAR BLOCO ====================
  const editarBloco = (bloco) => {
    Swal.fire({
      title: 'Editar Horário',
      html: `
        <input type="time" id="editInicio" class="swal2-input" value="${bloco.inicio}">
        <input type="time" id="editFim" class="swal2-input" value="${bloco.fim}">
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Salvar',
      denyButtonText: 'Excluir',
      preConfirm: () => {
        const inicio = document.getElementById('editInicio').value;
        const fim = document.getElementById('editFim').value;
        
        if (!inicio || !fim) {
          Swal.showValidationMessage('Preencha os dois horários!');
          return false;
        }
        
        if (fim <= inicio) {
          Swal.showValidationMessage('Horário final deve ser maior que o inicial!');
          return false;
        }

        const blocosDoDia = cronograma.filter(b => b.dia === bloco.dia && b.id !== bloco.id);
        const temConflito = blocosDoDia.some(b => {
          return (inicio >= b.inicio && inicio < b.fim) ||
                 (fim > b.inicio && fim <= b.fim) ||
                 (inicio <= b.inicio && fim >= b.fim);
        });

        if (temConflito) {
          Swal.showValidationMessage('Já existe uma matéria nesse horário!');
          return false;
        }

        return { inicio, fim };
      }
    }).then(result => {
      if (result.isConfirmed) {
        const novoCronograma = cronograma.map(b =>
          b.id === bloco.id ? { ...b, inicio: result.value.inicio, fim: result.value.fim } : b
        );
        setCronograma(novoCronograma);
        salvarCronograma(novoCronograma);
        Swal.fire({ icon: 'success', title: 'Horário atualizado!', timer: 1500, showConfirmButton: false });
      } else if (result.isDenied) {
        const novoCronograma = cronograma.filter(b => b.id !== bloco.id);
        setCronograma(novoCronograma);
        salvarCronograma(novoCronograma);
        Swal.fire({ icon: 'success', title: 'Horário removido!', timer: 1500, showConfirmButton: false });
      }
    });
  };

  // ==================== DRAG & DROP ====================
  const onDragStart = (e, materia) => {
    setDraggedMateria(materia);
    e.dataTransfer.setData('text/plain', materia.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    e.currentTarget.classList.add('drag-over');
  };

  const onDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const onDrop = (e, dia) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const materiaId = e.dataTransfer.getData('text/plain');
    const materia = materias.find(m => m.id === materiaId);
    if (materia) {
      adicionarBloco(materia, dia);
    }
    setDraggedMateria(null);
  };

  const getBlocosPorDia = (dia) => {
    return cronograma
      .filter(b => b.dia === dia)
      .sort((a, b) => a.inicio.localeCompare(b.inicio));
  };

  // ==================== RENDER ====================
  return (
    <section id="cronogramaNovoSection">
      <div className="layout-container">
        <h1>Cronograma Inteligente</h1>

        <div className="form-cronogramaNovo">
          <input
            type="text"
            placeholder="Nome da matéria"
            value={novaMateria.nome}
            onChange={(e) => setNovaMateria({ ...novaMateria, nome: e.target.value })}
          />
          <input
            type="color"
            value={novaMateria.cor}
            onChange={(e) => setNovaMateria({ ...novaMateria, cor: e.target.value })}
          />
          <button onClick={adicionarMateria}>Adicionar Matéria</button>
        </div>

        <h4>Matérias</h4>
        <div className="materias-area">
          {materias.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', width: '100%' }}>Nenhuma matéria cadastrada. Adicione acima!</p>
          ) : (
            materias.map(materia => (
              <div
                key={materia.id}
                className="materia-bloco"
                style={{ background: materia.cor }}
                draggable
                onDragStart={(e) => onDragStart(e, materia)}
                onDoubleClick={() => editarMateria(materia)}
              >
                {materia.nome}
              </div>
            ))
          )}
        </div>

        <p className="drag-text">Arraste a matéria para um dia da semana</p>
        <p className="drag-text mb-5">
          Dica: <span>duplo clique no nome da matéria</span> para editar ou
          <span> duplo clique no horário</span> para alterar.
        </p>

        <div className="cronogramaNovo-grid">
          {diasSemana.map(dia => (
            <div
              key={dia.id}
              className="dia"
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, dia.id)}
            >
              <h5>{dia.nome}</h5>
              <div className="dia-drop">
                {getBlocosPorDia(dia.id).map(bloco => (
                  <div
                    key={bloco.id}
                    className="bloco-materia"
                    style={{ background: bloco.materia.cor }}
                    onDoubleClick={() => editarBloco(bloco)}
                  >
                    {bloco.materia.nome} ({bloco.inicio} - {bloco.fim})
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Botão de debug para ver o que está no localStorage (adicione no return)
<button onClick={() => {
  console.log("=== DEBUG ===");
  console.log("materias:", materias);
  console.log("cronograma:", cronograma);
  console.log("localStorage materias:", localStorage.getItem('materias'));
  console.log("localStorage cronograma:", localStorage.getItem('cronogramaNovo'));
}} style={{ position: 'fixed', bottom: 10, right: 10, zIndex: 9999 }}>
  🔍 Debug
</button>
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

  // Carregar dados do localStorage
  useEffect(() => {
    const materiasSalvas = localStorage.getItem('materias');
    if (materiasSalvas) {
      setMaterias(JSON.parse(materiasSalvas));
    } else {
      const materiasPadrao = [
        { id: 'm1', nome: 'Matemática', cor: '#ef4444' },
        { id: 'm2', nome: 'Português', cor: '#3b82f6' },
        { id: 'm3', nome: 'História', cor: '#22c55e' }
      ];
      setMaterias(materiasPadrao);
      localStorage.setItem('materias', JSON.stringify(materiasPadrao));
    }

    const cronogramaSalvo = localStorage.getItem('cronogramaNovo');
    if (cronogramaSalvo) {
      setCronograma(JSON.parse(cronogramaSalvo));
    }
  }, []);

  // Salvar dados
  useEffect(() => {
    localStorage.setItem('materias', JSON.stringify(materias));
  }, [materias]);

  useEffect(() => {
    localStorage.setItem('cronogramaNovo', JSON.stringify(cronograma));
    window.dispatchEvent(new Event('cronogramaAtualizado'));
  }, [cronograma]);

  // Adicionar matéria
  const adicionarMateria = () => {
    if (!novaMateria.nome.trim()) {
      Swal.fire({ icon: 'warning', title: 'Ops!', text: 'Digite o nome da matéria!', timer: 2000, showConfirmButton: false });
      return;
    }

    const existe = materias.some(m => m.nome.toLowerCase() === novaMateria.nome.toLowerCase());
    if (existe) {
      Swal.fire({ icon: 'error', title: 'Já existe!', text: `A matéria "${novaMateria.nome}" já foi cadastrada.`, timer: 2000, showConfirmButton: false });
      return;
    }

    const nova = {
      id: Date.now().toString(),
      nome: novaMateria.nome,
      cor: novaMateria.cor
    };

    setMaterias([...materias, nova]);
    setNovaMateria({ nome: '', cor: '#9f042c' });

    Swal.fire({ icon: 'success', title: 'Pronto!', text: `Matéria "${nova.nome}" adicionada!`, timer: 1500, showConfirmButton: false, position: 'top-end', toast: true });
  };

  // Editar matéria
  const editarMateria = (materia) => {
    Swal.fire({
      title: 'Editar Matéria',
      html: `
        <input type="text" id="editNome" class="swal2-input" value="${materia.nome}">
        <input type="color" id="editCor" class="swal2-input" value="${materia.cor}">
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Salvar',
      denyButtonText: 'Excluir'
    }).then(result => {
      if (result.isConfirmed) {
        const novoNome = document.getElementById('editNome').value.trim();
        const novaCor = document.getElementById('editCor').value;
        if (novoNome) {
          const novasMaterias = materias.map(m =>
            m.id === materia.id ? { ...m, nome: novoNome, cor: novaCor } : m
          );
          setMaterias(novasMaterias);

          const novoCronograma = cronograma.map(bloco =>
            bloco.materia.id === materia.id ? { ...bloco, materia: { ...bloco.materia, nome: novoNome, cor: novaCor } } : bloco
          );
          setCronograma(novoCronograma);
        }
      } else if (result.isDenied) {
        Swal.fire({
          title: `Excluir ${materia.nome}?`,
          text: 'Também será removida do cronograma!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sim, excluir',
          confirmButtonColor: '#dc3545'
        }).then(confirmResult => {
          if (confirmResult.isConfirmed) {
            setMaterias(materias.filter(m => m.id !== materia.id));
            setCronograma(cronograma.filter(b => b.materia.id !== materia.id));
          }
        });
      }
    });
  };

  // Adicionar bloco ao cronograma
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
        if (!inicio || !fim || fim <= inicio) {
          Swal.showValidationMessage('Horário inválido!');
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
        setCronograma([...cronograma, novoBloco]);
      }
    });
  };

  // Editar bloco
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
      denyButtonText: 'Excluir'
    }).then(result => {
      if (result.isConfirmed) {
        const inicio = document.getElementById('editInicio').value;
        const fim = document.getElementById('editFim').value;
        if (inicio && fim && fim > inicio) {
          const novoCronograma = cronograma.map(b =>
            b.id === bloco.id ? { ...b, inicio, fim } : b
          );
          setCronograma(novoCronograma);
        }
      } else if (result.isDenied) {
        setCronograma(cronograma.filter(b => b.id !== bloco.id));
      }
    });
  };

  // Drag & Drop handlers
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

  // Obter blocos de um dia específico
  const getBlocosPorDia = (dia) => {
    return cronograma
      .filter(b => b.dia === dia)
      .sort((a, b) => a.inicio.localeCompare(b.inicio));
  };

  return (
    <section id="cronogramaNovoSection">
      <div className="layout-container">
        <h1>Cronograma Inteligente</h1>

        {/* Formulário */}
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

        {/* Matérias */}
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

        {/* Grid dos dias */}
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
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './tarefas.css';

export default function Tarefas() {
  const [tarefas, setTarefas] = useState([]);
  const [filtroPrioridade, setFiltroPrioridade] = useState('todas');
  const [novaTarefa, setNovaTarefa] = useState({
    titulo: '',
    prioridade: 'alta',
    data: ''
  });

  // Carregar tarefas do localStorage ao iniciar
  useEffect(() => {
    const tarefasSalvas = localStorage.getItem('tarefas');
    if (tarefasSalvas) {
      try {
        setTarefas(JSON.parse(tarefasSalvas));
      } catch (e) {
        console.error('Erro ao carregar tarefas:', e);
        setTarefas([]);
      }
    }
  }, []);

  // Salvar tarefas no localStorage sempre que atualizar
  useEffect(() => {
    localStorage.setItem('tarefas', JSON.stringify(tarefas));
  }, [tarefas]);

  // Função para formatar data atual
  const hojeFormatado = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  // Adicionar nova tarefa
  const adicionarTarefa = () => {
    if (!novaTarefa.titulo.trim() || !novaTarefa.data) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Preencha todos os campos!'
      });
      return;
    }

    const nova = {
      id: Date.now(),
      titulo: novaTarefa.titulo,
      prioridade: novaTarefa.prioridade,
      data: novaTarefa.data,
      concluida: false
    };

    setTarefas([...tarefas, nova]);
    setNovaTarefa({
      titulo: '',
      prioridade: 'alta',
      data: ''
    });
  };

  // Alternar concluída
  const toggleConcluida = (id) => {
    setTarefas(tarefas.map(tarefa =>
      tarefa.id === id ? { ...tarefa, concluida: !tarefa.concluida } : tarefa
    ));
  };

  // Editar tarefa
  const editarTarefa = (tarefa) => {
    Swal.fire({
      title: 'Editar Tarefa',
      html: `
        <input type="text" id="editTitulo" class="swal2-input" value="${tarefa.titulo}">
        <select id="editPrioridade" class="swal2-input">
          <option value="alta" ${tarefa.prioridade === 'alta' ? 'selected' : ''}>Alta</option>
          <option value="media" ${tarefa.prioridade === 'media' ? 'selected' : ''}>Média</option>
          <option value="baixa" ${tarefa.prioridade === 'baixa' ? 'selected' : ''}>Baixa</option>
        </select>
        <input type="date" id="editData" class="swal2-input" value="${tarefa.data}">
      `,
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        const novoTitulo = document.getElementById('editTitulo').value.trim();
        const novaPrioridade = document.getElementById('editPrioridade').value;
        const novaData = document.getElementById('editData').value;

        if (!novoTitulo || !novaData) {
          Swal.fire({
            icon: 'error',
            title: 'Preencha todos os campos!'
          });
          return;
        }

        setTarefas(tarefas.map(t =>
          t.id === tarefa.id ? {
            ...t,
            titulo: novoTitulo,
            prioridade: novaPrioridade,
            data: novaData
          } : t
        ));
      }
    });
  };

  // Excluir tarefa
  const excluirTarefa = (id) => {
    setTarefas(tarefas.filter(tarefa => tarefa.id !== id));
  };

  // Renderizar cards de tarefas
  const renderizarTarefas = () => {
    const hoje = hojeFormatado();
    const prioridadeOrdem = { alta: 3, media: 2, baixa: 1 };

    // Aplicar filtro
    let tarefasFiltradas = [...tarefas];
    if (filtroPrioridade !== 'todas') {
      tarefasFiltradas = tarefasFiltradas.filter(t => t.prioridade === filtroPrioridade);
    }

    const tarefasHoje = tarefasFiltradas
      .filter(t => t.data === hoje && !t.concluida)
      .sort((a, b) => prioridadeOrdem[b.prioridade] - prioridadeOrdem[a.prioridade]);

    const tarefasFuturas = tarefasFiltradas
      .filter(t => t.data > hoje && !t.concluida)
      .sort((a, b) => prioridadeOrdem[b.prioridade] - prioridadeOrdem[a.prioridade]);

    const tarefasConcluidas = tarefasFiltradas
      .filter(t => t.concluida)
      .sort((a, b) => new Date(b.data) - new Date(a.data));

    return (
      <>
        {/* Tarefas de Hoje */}
        <h3><i className="bi bi-calendar-week mx-2"></i>Tarefas de Hoje</h3>
        <div className="tarefas-container">
          {tarefasHoje.length === 0 ? (
            <p>Nenhuma tarefa para hoje!</p>
          ) : (
            tarefasHoje.map(tarefa => criarCard(tarefa))
          )}
        </div>

        {/* Tarefas Futuras */}
        <h3><i className="bi bi-calendar-week mx-2"></i>Tarefas Futuras</h3>
        <div className="tarefas-container">
          {tarefasFuturas.length === 0 ? (
            <p>Nenhuma tarefa futura cadastrada!</p>
          ) : (
            tarefasFuturas.map(tarefa => criarCard(tarefa))
          )}
        </div>

        {/* Tarefas Concluídas */}
        {tarefasConcluidas.length > 0 && (
          <>
            <h3><i className="bi bi-check2-circle mx-2"></i>Tarefas Concluídas</h3>
            <div className="tarefas-container">
              {tarefasConcluidas.map(tarefa => criarCard(tarefa))}
            </div>
          </>
        )}
      </>
    );
  };

  // Criar card individual
  const criarCard = (tarefa) => (
    <div key={tarefa.id} className={`tarefa-card ${tarefa.concluida ? 'concluida' : ''}`}>
      <div className="tarefa-info">
        <span className="tarefa-titulo">{tarefa.titulo} ({tarefa.data})</span>
        <span className={`tarefa-prioridade tarefa-${tarefa.prioridade}`}>
          {tarefa.prioridade.toUpperCase()}
        </span>
      </div>
      <div className="tarefa-acoes">
        <button
          className="btn-concluir"
          onClick={() => toggleConcluida(tarefa.id)}
          title={tarefa.concluida ? "Desfazer" : "Concluir"}
        >
          {tarefa.concluida ? '↩' : '✓'}
        </button>
        <button
          className="btn-editar"
          onClick={() => editarTarefa(tarefa)}
          title="Editar"
        >
          ✏️
        </button>
        <button
          className="btn-excluir"
          onClick={() => excluirTarefa(tarefa.id)}
          title="Excluir"
        >
          ❌
        </button>
      </div>
    </div>
  );

  return (
    <section id="tarefasSection">
      <h1 className="mb-3">Minhas Tarefas</h1>

      {/* Filtros */}
      <div className="filtro-prioridade">
        <button
          className={`btn-filtro-prioridade ${filtroPrioridade === 'todas' ? 'active' : ''}`}
          onClick={() => setFiltroPrioridade('todas')}
        >
          <i className="bi bi-check2-square me-2"></i>
          Todas
        </button>
        <button
          className={`btn-filtro-prioridade ${filtroPrioridade === 'alta' ? 'active' : ''}`}
          onClick={() => setFiltroPrioridade('alta')}
        >
          🔴 Alta
        </button>
        <button
          className={`btn-filtro-prioridade ${filtroPrioridade === 'media' ? 'active' : ''}`}
          onClick={() => setFiltroPrioridade('media')}
        >
          🟡 Média
        </button>
        <button
          className={`btn-filtro-prioridade ${filtroPrioridade === 'baixa' ? 'active' : ''}`}
          onClick={() => setFiltroPrioridade('baixa')}
        >
          🟢 Baixa
        </button>
      </div>

      {/* Formulário */}
      <div className="tarefa-form">
        <input
          type="text"
          placeholder="Digite a tarefa"
          value={novaTarefa.titulo}
          onChange={(e) => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
        />
        <select
          value={novaTarefa.prioridade}
          onChange={(e) => setNovaTarefa({ ...novaTarefa, prioridade: e.target.value })}
        >
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
        <input
          type="date"
          value={novaTarefa.data}
          onChange={(e) => setNovaTarefa({ ...novaTarefa, data: e.target.value })}
        />
        <button onClick={adicionarTarefa}>Adicionar</button>
      </div>

      {/* Listas de tarefas */}
      {renderizarTarefas()}
    </section>
  );
}
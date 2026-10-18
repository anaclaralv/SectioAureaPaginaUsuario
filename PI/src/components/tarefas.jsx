import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './Tarefas.css';
import { apiFetch } from '../api'; // Importa a função de conectar na API

export default function Tarefas() {
  const [tarefas, setTarefas] = useState([]);
  const [filtroPrioridade, setFiltroPrioridade] = useState('todas');
  const [novaTarefa, setNovaTarefa] = useState({ titulo: '', prioridade: 'alta', data: '' });
  const [carregando, setCarregando] = useState(true);

  // 1. Carrega as tarefas da API quando a tela abre
  useEffect(() => {
    carregarTarefas();
  }, []);

  const carregarTarefas = async () => {
    try {
      setCarregando(true);
      const response = await apiFetch('tarefas');
      if (response.ok) {
        const data = await response.json();
        
        // Traduz os dados da API (nome_tarefa) para o padrão da tela (titulo)
        const tarefasFormatadas = data.map(t => ({
          id: t.id_tarefa,
          titulo: t.nome_tarefa,
          prioridade: t.dificuldade.replace('-concluida', ''), // limpa se estiver concluída
          data: t.prazo,
          concluida: t.dificuldade.includes('-concluida')
        }));
        
        setTarefas(tarefasFormatadas);
      }
    } catch (err) {
      Swal.fire('Erro', 'Não foi possível carregar as tarefas.', 'error');
    } finally {
      setCarregando(false);
    }
  };

  const hojeFormatado = () => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  };

  // 2. Adiciona a tarefa na API
  const adicionarTarefa = async () => {
    if (!novaTarefa.titulo.trim() || !novaTarefa.data) {
      Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Preencha todos os campos!' });
      return;
    }

    try {
      const response = await apiFetch('tarefas', {
        method: 'POST',
        body: JSON.stringify({
          nome_tarefa: novaTarefa.titulo,
          dificuldade: novaTarefa.prioridade,
          prazo: novaTarefa.data
        })
      });

      if (response.ok) {
        setNovaTarefa({ titulo: '', prioridade: 'alta', data: '' });
        carregarTarefas(); // Recarrega a lista
        Swal.fire({ icon: 'success', title: 'Tarefa adicionada!', timer: 1000, showConfirmButton: false });
      }
    } catch (err) {
      Swal.fire('Erro', 'Não foi possível salvar a tarefa.', 'error');
    }
  };

  // 3. Atualiza a API (marcar como concluída)
  const toggleConcluida = async (id, concluidaAtual, tarefaCompleta) => {
    try {
      const response = await apiFetch(`tarefas/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nome_tarefa: tarefaCompleta.titulo,
          dificuldade: concluidaAtual ? tarefaCompleta.prioridade : `${tarefaCompleta.prioridade}-concluida`,
          prazo: tarefaCompleta.data
        })
      });
      if (response.ok) carregarTarefas();
    } catch (err) {
      Swal.fire('Erro', 'Não foi possível atualizar.', 'error');
    }
  };

  // 4. Exclui da API
  const excluirTarefa = async (id) => {
    Swal.fire({
      title: 'Excluir tarefa?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sim', cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await apiFetch(`tarefas/${id}`, { method: 'DELETE' });
          if (response.ok) carregarTarefas();
        } catch (err) {
          Swal.fire('Erro', 'Não foi possível excluir.', 'error');
        }
      }
    });
  };

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
      confirmButtonText: 'Salvar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const novoTitulo = document.getElementById('editTitulo').value.trim();
        const novaPrioridade = document.getElementById('editPrioridade').value;
        const novaData = document.getElementById('editData').value;

        try {
          const response = await apiFetch(`tarefas/${tarefa.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              nome_tarefa: novoTitulo,
              dificuldade: novaPrioridade + (tarefa.concluida ? '-concluida' : ''),
              prazo: novaData
            })
          });
          if (response.ok) carregarTarefas();
        } catch (err) {
          Swal.fire('Erro', 'Não foi possível salvar.', 'error');
        }
      }
    });
  };

  // Função visual (mantida igual ao código original)
  const criarCard = (tarefa) => (
    <div key={tarefa.id} className={`tarefa-card ${tarefa.concluida ? 'concluida' : ''}`}>
      <div className="tarefa-info">
        <span className="tarefa-titulo">{tarefa.titulo} ({tarefa.data})</span>
        <span className={`tarefa-prioridade tarefa-${tarefa.prioridade}`}>{tarefa.prioridade.toUpperCase()}</span>
      </div>
      <div className="tarefa-acoes">
        <button className="btn-concluir" onClick={() => toggleConcluida(tarefa.id, tarefa.concluida, tarefa)}>
          {tarefa.concluida ? '↩' : '✓'}
        </button>
        <button className="btn-editar" onClick={() => editarTarefa(tarefa)}>✏️</button>
        <button className="btn-excluir" onClick={() => excluirTarefa(tarefa.id)}>❌</button>
      </div>
    </div>
  );

  const hoje = hojeFormatado();
  const tarefasFiltradas = filtroPrioridade === 'todas' ? tarefas : tarefas.filter(t => t.prioridade === filtroPrioridade);
  const tarefasHoje = tarefasFiltradas.filter(t => t.data === hoje && !t.concluida);
  const tarefasFuturas = tarefasFiltradas.filter(t => t.data > hoje && !t.concluida);
  const tarefasConcluidas = tarefasFiltradas.filter(t => t.concluida);

  if (carregando) return <div style={{ padding: 20 }}>Carregando tarefas...</div>;

  return (
    <section id="tarefasSection">
      <h1 className="mb-3">Minhas Tarefas</h1>

      <div className="filtro-prioridade">
        {['todas', 'alta', 'media', 'baixa'].map(f => (
          <button key={f} className={`btn-filtro-prioridade ${filtroPrioridade === f ? 'active' : ''}`} onClick={() => setFiltroPrioridade(f)}>
            {f === 'todas' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="tarefa-form">
        <input type="text" placeholder="Digite a tarefa" value={novaTarefa.titulo} onChange={(e) => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })} />
        <select value={novaTarefa.prioridade} onChange={(e) => setNovaTarefa({ ...novaTarefa, prioridade: e.target.value })}>
          <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
        </select>
        <input type="date" value={novaTarefa.data} onChange={(e) => setNovaTarefa({ ...novaTarefa, data: e.target.value })} />
        <button onClick={adicionarTarefa}>Adicionar</button>
      </div>

      <h3>Tarefas de Hoje</h3>
      <div className="tarefas-container">
        {tarefasHoje.length === 0 ? <p>Nenhuma tarefa para hoje!</p> : tarefasHoje.map(criarCard)}
      </div>

      <h3>Tarefas Futuras</h3>
      <div className="tarefas-container">
        {tarefasFuturas.length === 0 ? <p>Nenhuma tarefa futura!</p> : tarefasFuturas.map(criarCard)}
      </div>

      {tarefasConcluidas.length > 0 && (
        <>
          <h3>Tarefas Concluídas</h3>
          <div className="tarefas-container">{tarefasConcluidas.map(criarCard)}</div>
        </>
      )}
    </section>
  );
}
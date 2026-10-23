import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './tarefas.css';
import { apiFetch } from '../api';

export default function Tarefas() {
  const [tarefas, setTarefas] = useState([]);
  const [filtroPrioridade, setFiltroPrioridade] = useState('todas');
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  // Estado do Modal (Novo / Editar)
  const [modalAberto, setModalAberto] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState(null);
  const [formTarefa, setFormTarefa] = useState({
    titulo: '',
    prioridade: 'alta',
    data: ''
  });

  const hojeFormatado = () => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  };

  const formatarDataBr = (dataIso) => {
    if (!dataIso) return '';
    const partes = dataIso.split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return dataIso;
  };

  // Carregar tarefas da API
  const carregarTarefas = async () => {
    try {
      setCarregando(true);
      const response = await apiFetch('tarefas');
      if (response.ok) {
        const data = await response.json();
        const tarefasFormatadas = (Array.isArray(data) ? data : []).map(t => ({
          id: t.id_tarefa,
          titulo: t.nome_tarefa,
          prioridade: (t.dificuldade || 'media').replace('-concluida', ''),
          data: t.prazo,
          concluida: (t.dificuldade || '').includes('-concluida')
        }));
        setTarefas(tarefasFormatadas);
      }
    } catch (err) {
      console.error('Erro ao carregar tarefas:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarTarefas();
  }, []);

  // Abrir Modal de Nova Tarefa
  const abrirModalNovo = (dataDefault) => {
    setTarefaEditando(null);
    setFormTarefa({
      titulo: '',
      prioridade: 'alta',
      data: dataDefault || hojeFormatado()
    });
    setModalAberto(true);
  };

  // Abrir Modal de Edição
  const abrirModalEditar = (tarefa) => {
    setTarefaEditando(tarefa);
    setFormTarefa({
      titulo: tarefa.titulo,
      prioridade: tarefa.prioridade,
      data: tarefa.data
    });
    setModalAberto(true);
  };

  // Salvar Tarefa (Criar ou Editar via Modal)
  const salvarTarefaModal = async () => {
    if (!formTarefa.titulo.trim() || !formTarefa.data) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Preencha o título e a data da tarefa!',
        confirmButtonColor: 'var(--cor-primaria)'
      });
      return;
    }

    try {
      if (tarefaEditando) {
        // Atualização
        const response = await apiFetch(`tarefas/${tarefaEditando.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            nome_tarefa: formTarefa.titulo.trim(),
            dificuldade: formTarefa.prioridade + (tarefaEditando.concluida ? '-concluida' : ''),
            prazo: formTarefa.data
          })
        });
        if (response.ok) {
          setModalAberto(false);
          carregarTarefas();
          Swal.fire({
            icon: 'success',
            title: 'Tarefa atualizada!',
            timer: 1200,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
      } else {
        // Criação
        const response = await apiFetch('tarefas', {
          method: 'POST',
          body: JSON.stringify({
            nome_tarefa: formTarefa.titulo.trim(),
            dificuldade: formTarefa.prioridade,
            prazo: formTarefa.data
          })
        });
        if (response.ok) {
          setModalAberto(false);
          carregarTarefas();
          Swal.fire({
            icon: 'success',
            title: 'Tarefa criada!',
            timer: 1200,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
      }
    } catch (err) {
      Swal.fire('Erro', 'Não foi possível salvar a tarefa.', 'error');
    }
  };

  // Alternar Status de Conclusão
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
      Swal.fire('Erro', 'Não foi possível atualizar o status.', 'error');
    }
  };

  // Excluir Tarefa
  const excluirTarefa = (id) => {
    Swal.fire({
      title: 'Excluir tarefa?',
      text: 'Tem certeza que deseja remover esta tarefa?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await apiFetch(`tarefas/${id}`, { method: 'DELETE' });
          if (response.ok) {
            carregarTarefas();
            Swal.fire({
              icon: 'success',
              title: 'Tarefa excluída!',
              timer: 1000,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          }
        } catch (err) {
          Swal.fire('Erro', 'Não foi possível excluir.', 'error');
        }
      }
    });
  };

  const hoje = hojeFormatado();

  // Filtragem
  const tarefasFiltradas = tarefas.filter(t => {
    const matchPrioridade = filtroPrioridade === 'todas' || t.prioridade === filtroPrioridade;
    const matchBusca = !busca || (t.titulo || '').toLowerCase().includes(busca.toLowerCase());
    return matchPrioridade && matchBusca;
  });

  const tarefasHojeOuAtrasadas = tarefasFiltradas.filter(t => t.data <= hoje && !t.concluida);
  const tarefasFuturas = tarefasFiltradas.filter(t => t.data > hoje && !t.concluida);
  const tarefasConcluidas = tarefasFiltradas.filter(t => t.concluida);

  const totalHoje = tarefas.filter(t => t.data === hoje && !t.concluida).length;
  const totalFuturas = tarefas.filter(t => t.data > hoje && !t.concluida).length;
  const totalAlta = tarefas.filter(t => t.prioridade === 'alta' && !t.concluida).length;
  const totalConcluidas = tarefas.filter(t => t.concluida).length;

  // Render do Card Individual de Tarefa
  const renderCardItem = (tarefa) => {
    const isAtrasada = !tarefa.concluida && tarefa.data < hoje;
    return (
      <div
        key={tarefa.id}
        className={`tarefa-card-item ${tarefa.concluida ? 'concluida' : ''} ${isAtrasada ? 'atrasada' : ''}`}
      >
        <button
          className={`tarefa-checkbox-btn ${tarefa.concluida ? 'checked' : ''}`}
          onClick={() => toggleConcluida(tarefa.id, tarefa.concluida, tarefa)}
          title={tarefa.concluida ? 'Reabrir tarefa' : 'Concluir tarefa'}
        >
          {tarefa.concluida ? (
            <i className="bi bi-check-circle-fill"></i>
          ) : (
            <i className="bi bi-circle"></i>
          )}
        </button>

        <div className="tarefa-item-content">
          <span className="tarefa-item-title">{tarefa.titulo}</span>
          <div className="tarefa-item-meta">
            <span className="tarefa-meta-pill data">
              <i className="bi bi-calendar3 me-1"></i>
              {formatarDataBr(tarefa.data)}
            </span>
            <span className={`tarefa-meta-pill prioridade-${tarefa.prioridade}`}>
              <i className="bi bi-flag-fill me-1"></i>
              {tarefa.prioridade === 'alta' ? 'Alta' : tarefa.prioridade === 'media' ? 'Média' : 'Baixa'}
            </span>
            {isAtrasada && (
              <span className="tarefa-meta-pill urgente">
                <i className="bi bi-exclamation-triangle-fill me-1"></i> Atrasada
              </span>
            )}
            {tarefa.concluida && (
              <span className="tarefa-meta-pill concluida-status">
                <i className="bi bi-check2-all me-1"></i> Concluída
              </span>
            )}
          </div>
        </div>

        <div className="tarefa-item-actions">
          <button
            className="btn-tarefa-icon edit"
            onClick={() => abrirModalEditar(tarefa)}
            title="Editar tarefa"
          >
            <i className="bi bi-pencil-fill"></i>
          </button>
          <button
            className="btn-tarefa-icon delete"
            onClick={() => excluirTarefa(tarefa.id)}
            title="Excluir tarefa"
          >
            <i className="bi bi-trash3-fill"></i>
          </button>
        </div>
      </div>
    );
  };

  return (
    <section id="tarefasSection">
      <div className="tarefas-container-main">
        {/* Cabeçalho Superior Padronizado (estilo Calendário) */}
        <div className="tarefas-header-bar">
          <div className="tarefas-header-titles">
            <h1><i className="bi bi-check2-square"></i> Minhas Tarefas</h1>
            <p className="tarefas-subtitle">Organize sua rotina de estudos, prazos e prioridades diárias</p>
          </div>
          <button
            className="btn-novo-tarefa-main"
            onClick={() => abrirModalNovo()}
          >
            <i className="bi bi-plus-lg"></i> Nova Tarefa
          </button>
        </div>

        {/* Painel de Métricas Padronizado (estilo Calendário) */}
        <div className="tarefas-metricas-grid">
          <div className="tar-metric-card">
            <div className="tar-metric-icon hoje">
              <i className="bi bi-calendar2-day-fill"></i>
            </div>
            <div className="tar-metric-info">
              <span className="tar-metric-num">{totalHoje}</span>
              <span className="tar-metric-label">Pendentes Hoje</span>
            </div>
          </div>

          <div className="tar-metric-card">
            <div className="tar-metric-icon futuras">
              <i className="bi bi-hourglass-split"></i>
            </div>
            <div className="tar-metric-info">
              <span className="tar-metric-num">{totalFuturas}</span>
              <span className="tar-metric-label">Prazos Futuros</span>
            </div>
          </div>

          <div className="tar-metric-card">
            <div className="tar-metric-icon alta">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div className="tar-metric-info">
              <span className="tar-metric-num">{totalAlta}</span>
              <span className="tar-metric-label">Alta Prioridade</span>
            </div>
          </div>

          <div className="tar-metric-card">
            <div className="tar-metric-icon concluidas">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <div className="tar-metric-info">
              <span className="tar-metric-num">{totalConcluidas}</span>
              <span className="tar-metric-label">Concluídas</span>
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Busca Rápida */}
        <div className="tarefas-toolbar-bar mb-4">
          <div className="tarefas-filtros-nav">
            <button
              className={`btn-tar-filtro ${filtroPrioridade === 'todas' ? 'ativo' : ''}`}
              onClick={() => setFiltroPrioridade('todas')}
            >
              Todas ({tarefas.length})
            </button>
            <button
              className={`btn-tar-filtro ${filtroPrioridade === 'alta' ? 'ativo' : ''}`}
              onClick={() => setFiltroPrioridade('alta')}
            >
              Alta ({tarefas.filter(t => t.prioridade === 'alta').length})
            </button>
            <button
              className={`btn-tar-filtro ${filtroPrioridade === 'media' ? 'ativo' : ''}`}
              onClick={() => setFiltroPrioridade('media')}
            >
              Média ({tarefas.filter(t => t.prioridade === 'media').length})
            </button>
            <button
              className={`btn-tar-filtro ${filtroPrioridade === 'baixa' ? 'ativo' : ''}`}
              onClick={() => setFiltroPrioridade('baixa')}
            >
              Baixa ({tarefas.filter(t => t.prioridade === 'baixa').length})
            </button>
          </div>

          <div className="tarefas-search-box">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Buscar por tarefa..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            {busca && (
              <button className="btn-clear-tar-search" onClick={() => setBusca('')}>
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>
        </div>

        {/* Grid de Seções de Tarefas */}
        <div className="tarefas-secoes-grid">
          {/* Coluna 1: Tarefas de Hoje / Atrasadas */}
          <div className="tarefas-coluna-card">
            <div className="tarefas-coluna-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-calendar2-day-fill text-danger" style={{ fontSize: '1.2rem' }}></i>
                <h3>Tarefas de Hoje</h3>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="tarefas-count-badge danger">{tarefasHojeOuAtrasadas.length}</span>
                <button
                  className="btn-add-inline-tar"
                  onClick={() => abrirModalNovo(hoje)}
                  title="Nova tarefa para hoje"
                >
                  <i className="bi bi-plus"></i>
                </button>
              </div>
            </div>

            <div className="tarefas-lista-container">
              {tarefasHojeOuAtrasadas.length === 0 ? (
                <div className="tarefa-empty-state">
                  <i className="bi bi-check2-circle text-success" style={{ fontSize: '2rem' }}></i>
                  <p>Tudo em dia! Nenhuma tarefa pendente para hoje.</p>
                </div>
              ) : (
                tarefasHojeOuAtrasadas.map(renderCardItem)
              )}
            </div>
          </div>

          {/* Coluna 2: Tarefas Futuras */}
          <div className="tarefas-coluna-card">
            <div className="tarefas-coluna-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-hourglass-split text-primary" style={{ fontSize: '1.2rem' }}></i>
                <h3>Próximos Prazos</h3>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="tarefas-count-badge primary">{tarefasFuturas.length}</span>
                <button
                  className="btn-add-inline-tar"
                  onClick={() => abrirModalNovo()}
                  title="Agendar nova tarefa"
                >
                  <i className="bi bi-plus"></i>
                </button>
              </div>
            </div>

            <div className="tarefas-lista-container">
              {tarefasFuturas.length === 0 ? (
                <div className="tarefa-empty-state">
                  <i className="bi bi-calendar3" style={{ fontSize: '2rem', color: '#94a3b8' }}></i>
                  <p>Nenhuma tarefa futura agendada.</p>
                </div>
              ) : (
                tarefasFuturas.map(renderCardItem)
              )}
            </div>
          </div>
        </div>

        {/* Seção de Concluídas (Se houver) */}
        {tarefasConcluidas.length > 0 && (
          <div className="tarefas-coluna-card mt-4">
            <div className="tarefas-coluna-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-check2-all text-success" style={{ fontSize: '1.3rem' }}></i>
                <h3>Tarefas Concluídas</h3>
              </div>
              <span className="tarefas-count-badge success">{tarefasConcluidas.length}</span>
            </div>

            <div className="tarefas-lista-container">
              {tarefasConcluidas.map(renderCardItem)}
            </div>
          </div>
        )}
      </div>

      {/* Modal Moderno de Nova / Editar Tarefa (Estilo Calendário) */}
      {modalAberto && (
        <div className="tar-modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="tar-modal-card" onClick={e => e.stopPropagation()}>
            <div className="tar-modal-header">
              <h3>
                <i
                  className={`bi ${tarefaEditando ? 'bi-pencil-square' : 'bi-plus-circle-fill'}`}
                  style={{ color: 'var(--cor-primaria)' }}
                ></i>
                {tarefaEditando ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h3>
              <button className="btn-tar-modal-close" onClick={() => setModalAberto(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="tar-modal-body">
              <div className="tar-form-group">
                <label>Título ou Descrição da Tarefa *</label>
                <input
                  type="text"
                  className="tar-form-input"
                  placeholder="Ex: Ler capítulo 4 de Biologia, Entregar lista de Cálculo..."
                  value={formTarefa.titulo}
                  autoFocus
                  onChange={e => setFormTarefa({ ...formTarefa, titulo: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') salvarTarefaModal(); }}
                />
              </div>

              <div className="tar-form-row">
                <div className="tar-form-group">
                  <label>Data de Entrega / Prazo *</label>
                  <input
                    type="date"
                    className="tar-form-input"
                    value={formTarefa.data}
                    onChange={e => setFormTarefa({ ...formTarefa, data: e.target.value })}
                  />
                </div>

                <div className="tar-form-group">
                  <label>Prioridade</label>
                  <div className="tar-prioridade-selector">
                    {[
                      { id: 'alta', label: 'Alta', icon: 'bi-flag-fill' },
                      { id: 'media', label: 'Média', icon: 'bi-flag-fill' },
                      { id: 'baixa', label: 'Baixa', icon: 'bi-flag-fill' }
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className={`btn-prioridade-option ${p.id} ${formTarefa.prioridade === p.id ? 'ativo' : ''}`}
                        onClick={() => setFormTarefa({ ...formTarefa, prioridade: p.id })}
                      >
                        <i className={`bi ${p.icon} me-1`}></i> {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="tar-modal-footer">
              <button className="btn-tar-cancel" onClick={() => setModalAberto(false)}>
                Cancelar
              </button>
              <button className="btn-tar-save" onClick={salvarTarefaModal}>
                <i className="bi bi-check2"></i> {tarefaEditando ? 'Salvar Alterações' : 'Criar Tarefa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

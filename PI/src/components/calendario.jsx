import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import Swal from 'sweetalert2';
import { apiFetch } from '../api';
import './calendario.css';

const CORES_PALETA = [
  { cor: '#3b82f6', nome: 'Azul' },
  { cor: '#9f042c', nome: 'Bordô' },
  { cor: '#a855f7', nome: 'Roxo' },
  { cor: '#10b981', nome: 'Verde' },
  { cor: '#f59e0b', nome: 'Âmbar' },
  { cor: '#06b6d4', nome: 'Ciano' },
  { cor: '#ec4899', nome: 'Rosa' },
  { cor: '#64748b', nome: 'Cinza' }
];

export default function Calendario() {
  const [eventos, setEventos] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [carregando, setCarregando] = useState(false);
  const calendarRef = useRef(null);

  // Estado do Modal de Evento (Criar / Editar)
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formEvento, setFormEvento] = useState({
    titulo: '',
    data: '',
    cor: '#3b82f6',
    tipo: 'compromisso',
    recorrencia: 'nenhuma'
  });

  const hojeFormatado = () => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  };

  // Carregar eventos da API e sincronizar com localStorage
  const carregarDados = useCallback(async () => {
    // 1. Carrega dados do localStorage para renderização imediata
    const eventosSalvos = localStorage.getItem('eventosCalendario');
    if (eventosSalvos) {
      try {
        const parsed = JSON.parse(eventosSalvos);
        if (Array.isArray(parsed)) setEventos(parsed);
      } catch (e) {}
    }

    const tarefasSalvas = localStorage.getItem('tarefas');
    if (tarefasSalvas) {
      try {
        const parsed = JSON.parse(tarefasSalvas);
        if (Array.isArray(parsed)) setTarefas(parsed);
      } catch (e) {}
    }

    // 2. Busca eventos e tarefas atualizados do Backend via API
    try {
      setCarregando(true);
      const [resEventos, resTarefas] = await Promise.all([
        apiFetch('eventos').catch(() => null),
        apiFetch('tarefas').catch(() => null)
      ]);

      if (resEventos && resEventos.ok) {
        const dadosEventos = await resEventos.json();
        if (Array.isArray(dadosEventos)) {
          const formatados = dadosEventos.map(ev => {
            let titulo = 'Evento';
            let tipoEvento = 'compromisso';
            let recorrencia = 'nenhuma';

            if (ev.tipo && typeof ev.tipo === 'string' && ev.tipo.startsWith('{')) {
              try {
                const parsed = JSON.parse(ev.tipo);
                titulo = parsed.title || parsed.titulo || 'Evento';
                tipoEvento = parsed.extendedProps?.tipo || parsed.tipo || 'compromisso';
                recorrencia = parsed.extendedProps?.recorrencia || 'nenhuma';
              } catch (e) {
                titulo = ev.tipo;
              }
            } else if (ev.tipo) {
              titulo = ev.tipo;
            }

            return {
              id: String(ev.id_evento || ev.id),
              id_evento: ev.id_evento,
              title: titulo,
              data: ev.data,
              start: ev.data,
              cor: ev.cor || '#3b82f6',
              backgroundColor: ev.cor || '#3b82f6',
              borderColor: ev.cor || '#3b82f6',
              tipo: tipoEvento,
              recorrencia: recorrencia
            };
          });

          setEventos(formatados);
          localStorage.setItem('eventosCalendario', JSON.stringify(formatados));
        }
      }

      if (resTarefas && resTarefas.ok) {
        const dadosTarefas = await resTarefas.json();
        if (Array.isArray(dadosTarefas)) {
          const tarefasFormatadas = dadosTarefas.map(t => ({
            id: t.id_tarefa,
            titulo: t.nome_tarefa,
            prioridade: (t.dificuldade || 'media').replace('-concluida', ''),
            data: t.prazo,
            concluida: (t.dificuldade || '').includes('-concluida')
          }));

          setTarefas(tarefasFormatadas);
          localStorage.setItem('tarefas', JSON.stringify(tarefasFormatadas));
        }
      }
    } catch (err) {
      console.error('Erro ao sincronizar dados do calendário:', err);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Salvar no localStorage como backup
  useEffect(() => {
    if (eventos.length > 0) {
      localStorage.setItem('eventosCalendario', JSON.stringify(eventos));
    }
  }, [eventos]);

  const corPrioridade = (prioridade) => {
    switch (prioridade) {
      case 'alta': return '#ef4444';
      case 'media': return '#f59e0b';
      case 'baixa': return '#10b981';
      default: return '#64748b';
    }
  };

  // Montagem da lista final de eventos com filtros
  const eventosFiltrados = useMemo(() => {
    const listaEventos = eventos.map(ev => ({
      id: String(ev.id),
      title: `${ev.tipo === 'prova' ? '📝 ' : '🎯 '}${ev.title}`,
      start: ev.data || ev.start,
      backgroundColor: ev.cor || ev.backgroundColor || '#3b82f6',
      borderColor: ev.cor || ev.borderColor || '#3b82f6',
      extendedProps: {
        isTarefa: false,
        tipo: ev.tipo || 'compromisso',
        recorrencia: ev.recorrencia || 'nenhuma',
        tituloOriginal: ev.title
      }
    }));

    const listaTarefas = tarefas
      .filter(t => t.data && !t.concluida)
      .map(t => ({
        id: `tarefa_${t.id}`,
        title: `📋 ${t.titulo}`,
        start: t.data,
        backgroundColor: corPrioridade(t.prioridade),
        borderColor: corPrioridade(t.prioridade),
        extendedProps: {
          isTarefa: true,
          tarefaId: t.id,
          tipo: 'tarefa',
          prioridade: t.prioridade,
          tituloOriginal: t.titulo
        }
      }));

    const unificados = [...listaEventos, ...listaTarefas];

    if (filtroTipo === 'compromisso') {
      return unificados.filter(e => !e.extendedProps.isTarefa && e.extendedProps.tipo === 'compromisso');
    }
    if (filtroTipo === 'prova') {
      return unificados.filter(e => !e.extendedProps.isTarefa && e.extendedProps.tipo === 'prova');
    }
    if (filtroTipo === 'tarefa') {
      return unificados.filter(e => e.extendedProps.isTarefa);
    }
    return unificados;
  }, [eventos, tarefas, filtroTipo]);

  // Métricas de Resumo
  const totalCompromissos = useMemo(() => eventos.filter(e => e.tipo === 'compromisso').length, [eventos]);
  const totalProvas = useMemo(() => eventos.filter(e => e.tipo === 'prova').length, [eventos]);
  const totalTarefasPendentes = useMemo(() => tarefas.filter(t => t.data && !t.concluida).length, [tarefas]);
  const totalGeral = totalCompromissos + totalProvas + totalTarefasPendentes;

  // Abrir modal para novo evento
  const abrirModalNovo = (dataInicial = '') => {
    setEditandoId(null);
    setFormEvento({
      titulo: '',
      data: dataInicial || hojeFormatado(),
      cor: '#3b82f6',
      tipo: 'compromisso',
      recorrencia: 'nenhuma'
    });
    setModalAberto(true);
  };

  // Abrir modal para editar evento existente
  const abrirModalEditar = (evento) => {
    setEditandoId(String(evento.id));
    setFormEvento({
      titulo: evento.title || '',
      data: evento.data || evento.start || '',
      cor: evento.cor || evento.backgroundColor || '#3b82f6',
      tipo: evento.tipo || 'compromisso',
      recorrencia: evento.recorrencia || 'nenhuma'
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditandoId(null);
  };

  // Salvar Evento (Criar ou Atualizar) via API
  const salvarEvento = async () => {
    if (!formEvento.titulo.trim() || !formEvento.data) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Preencha o título e a data do evento!',
        confirmButtonColor: 'var(--cor-primaria)'
      });
      return;
    }

    const payloadBackend = {
      tipo: JSON.stringify({
        title: formEvento.titulo.trim(),
        extendedProps: {
          isTarefa: false,
          tipo: formEvento.tipo,
          recorrencia: formEvento.recorrencia
        }
      }),
      data: formEvento.data,
      cor: formEvento.cor
    };

    if (editandoId) {
      // Atualização
      try {
        await apiFetch(`eventos/${editandoId}`, {
          method: 'PUT',
          body: JSON.stringify(payloadBackend)
        });
      } catch (err) {
        console.error('Erro ao atualizar na API:', err);
      }

      setEventos(prev => prev.map(ev => {
        if (String(ev.id) === String(editandoId)) {
          return {
            ...ev,
            title: formEvento.titulo.trim(),
            data: formEvento.data,
            start: formEvento.data,
            cor: formEvento.cor,
            backgroundColor: formEvento.cor,
            borderColor: formEvento.cor,
            tipo: formEvento.tipo,
            recorrencia: formEvento.recorrencia
          };
        }
        return ev;
      }));

      fecharModal();
      Swal.fire({
        icon: 'success',
        title: 'Evento atualizado!',
        timer: 1200,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
      });
    } else {
      // Criação
      let novoId = Date.now().toString();
      try {
        const res = await apiFetch('eventos', {
          method: 'POST',
          body: JSON.stringify(payloadBackend)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.id_evento) novoId = String(data.id_evento);
        }
      } catch (err) {
        console.error('Erro ao criar na API:', err);
      }

      const eventoCriado = {
        id: novoId,
        id_evento: novoId,
        title: formEvento.titulo.trim(),
        data: formEvento.data,
        start: formEvento.data,
        cor: formEvento.cor,
        backgroundColor: formEvento.cor,
        borderColor: formEvento.cor,
        tipo: formEvento.tipo,
        recorrencia: formEvento.recorrencia
      };

      const novosEventos = [eventoCriado];

      // Geração de instâncias recorrentes (caso selecionado)
      if (formEvento.recorrencia !== 'nenhuma') {
        const dataInicio = new Date(formEvento.data + 'T12:00:00');
        let maxIteracoes = formEvento.recorrencia === 'diaria' ? 14 : formEvento.recorrencia === 'semanal' ? 8 : 4;

        for (let i = 1; i <= maxIteracoes; i++) {
          const novaData = new Date(dataInicio);
          if (formEvento.recorrencia === 'diaria') novaData.setDate(dataInicio.getDate() + i);
          else if (formEvento.recorrencia === 'semanal') novaData.setDate(dataInicio.getDate() + (i * 7));
          else if (formEvento.recorrencia === 'mensal') novaData.setMonth(dataInicio.getMonth() + i);

          const dataIso = novaData.toISOString().split('T')[0];
          const recId = `${novoId}_rec_${i}`;

          apiFetch('eventos', {
            method: 'POST',
            body: JSON.stringify({
              ...payloadBackend,
              data: dataIso
            })
          }).catch(() => {});

          novosEventos.push({
            id: recId,
            title: formEvento.titulo.trim(),
            data: dataIso,
            start: dataIso,
            cor: formEvento.cor,
            backgroundColor: formEvento.cor,
            borderColor: formEvento.cor,
            tipo: formEvento.tipo,
            recorrencia: formEvento.recorrencia
          });
        }
      }

      setEventos(prev => [...novosEventos, ...prev]);
      fecharModal();
      Swal.fire({
        icon: 'success',
        title: 'Evento agendado!',
        text: `"${formEvento.titulo}" foi adicionado com sucesso.`,
        timer: 1500,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
      });
    }
  };

  // Excluir Evento
  const excluirEvento = async (eventoId) => {
    try {
      await apiFetch(`eventos/${eventoId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Erro ao excluir evento da API:', err);
    }
    setEventos(prev => prev.filter(e => String(e.id) !== String(eventoId)));
  };

  // Excluir Tarefa
  const excluirTarefa = async (tarefaId) => {
    try {
      await apiFetch(`tarefas/${tarefaId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Erro ao excluir tarefa da API:', err);
    }
    setTarefas(prev => prev.filter(t => t.id !== tarefaId));
  };

  // Concluir Tarefa
  const concluirTarefa = async (tarefa) => {
    try {
      await apiFetch(`tarefas/${tarefa.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nome_tarefa: tarefa.titulo,
          dificuldade: `${tarefa.prioridade}-concluida`,
          prazo: tarefa.data
        })
      });
      setTarefas(prev => prev.map(t => t.id === tarefa.id ? { ...t, concluida: true } : t));
      Swal.fire({
        icon: 'success',
        title: 'Tarefa concluída!',
        timer: 1200,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
      });
    } catch (e) {
      console.error('Erro ao concluir tarefa:', e);
    }
  };

  // Ao clicar em uma data no calendário (dateClick)
  const handleDateClick = (info) => {
    abrirModalNovo(info.dateStr);
  };

  // Arrastar e soltar evento / tarefa (eventDrop)
  const handleEventDrop = async (info) => {
    const event = info.event;
    const novaData = event.startStr;
    const isTarefa = event.extendedProps.isTarefa;

    if (isTarefa) {
      const tarefaId = event.extendedProps.tarefaId;
      const tarefa = tarefas.find(t => t.id === tarefaId);
      if (tarefa) {
        setTarefas(prev => prev.map(t => t.id === tarefaId ? { ...t, data: novaData } : t));
        apiFetch(`tarefas/${tarefaId}`, {
          method: 'PUT',
          body: JSON.stringify({
            nome_tarefa: tarefa.titulo,
            dificuldade: tarefa.prioridade,
            prazo: novaData
          })
        }).catch(err => console.error('Erro ao atualizar tarefa:', err));
      }
    } else {
      const evId = event.id;
      setEventos(prev => prev.map(e => String(e.id) === String(evId) ? { ...e, data: novaData, start: novaData } : e));
      apiFetch(`eventos/${evId}`, {
        method: 'PUT',
        body: JSON.stringify({
          tipo: JSON.stringify({
            title: event.extendedProps.tituloOriginal || event.title,
            extendedProps: event.extendedProps
          }),
          data: novaData,
          cor: event.backgroundColor
        })
      }).catch(err => console.error('Erro ao mover evento:', err));
    }

    Swal.fire({
      icon: 'success',
      title: 'Reagendado!',
      text: `Data alterada para ${novaData.split('-').reverse().join('/')}`,
      timer: 1000,
      showConfirmButton: false,
      position: 'top-end',
      toast: true
    });
  };

  // Clique em um evento do calendário (eventClick)
  const handleEventClick = (info) => {
    const event = info.event;
    const isTarefa = event.extendedProps.isTarefa;
    const tituloLimpo = event.extendedProps.tituloOriginal || event.title;
    const dataFormatada = event.startStr ? event.startStr.split('-').reverse().join('/') : '';

    if (isTarefa) {
      const tarefaId = event.extendedProps.tarefaId;
      const tarefa = tarefas.find(t => t.id === tarefaId);

      Swal.fire({
        title: '📋 Detalhes da Tarefa',
        html: `
          <div style="text-align: left; padding: 10px 0;">
            <p><strong>Tarefa:</strong> ${tituloLimpo}</p>
            <p><strong>Prazo:</strong> ${dataFormatada}</p>
            <p><strong>Prioridade:</strong> <span style="text-transform: capitalize; color: ${corPrioridade(tarefa?.prioridade)}; font-weight: bold;">${tarefa?.prioridade || 'Média'}</span></p>
          </div>
        `,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: '<i class="bi bi-check2-circle"></i> Concluir Tarefa',
        denyButtonText: '<i class="bi bi-trash"></i> Excluir',
        cancelButtonText: 'Fechar',
        confirmButtonColor: '#10b981',
        denyButtonColor: '#ef4444'
      }).then(result => {
        if (result.isConfirmed && tarefa) {
          concluirTarefa(tarefa);
        } else if (result.isDenied) {
          excluirTarefa(tarefaId);
          Swal.fire({ icon: 'success', title: 'Tarefa excluída!', timer: 1000, showConfirmButton: false, toast: true, position: 'top-end' });
        }
      });
    } else {
      const tipo = event.extendedProps.tipo || 'compromisso';
      const evObj = eventos.find(e => String(e.id) === String(event.id));

      Swal.fire({
        title: tipo === 'prova' ? '📝 Prova / Exame' : '🎯 Compromisso',
        html: `
          <div style="text-align: left; padding: 10px 0;">
            <p style="font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-bottom: 8px;">${tituloLimpo}</p>
            <p style="margin: 4px 0;"><strong>Data:</strong> ${dataFormatada}</p>
            <p style="margin: 4px 0;"><strong>Tipo:</strong> <span style="text-transform: capitalize;">${tipo}</span></p>
            ${event.extendedProps.recorrencia && event.extendedProps.recorrencia !== 'nenhuma' ? `<p style="margin: 4px 0;"><strong>Recorrência:</strong> Repete ${event.extendedProps.recorrencia}</p>` : ''}
          </div>
        `,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: '<i class="bi bi-pencil-fill"></i> Editar',
        denyButtonText: '<i class="bi bi-trash-fill"></i> Excluir',
        cancelButtonText: 'Fechar',
        confirmButtonColor: 'var(--cor-primaria)',
        denyButtonColor: '#ef4444'
      }).then(result => {
        if (result.isConfirmed && evObj) {
          abrirModalEditar(evObj);
        } else if (result.isDenied) {
          Swal.fire({
            title: 'Excluir evento?',
            text: `Deseja remover "${tituloLimpo}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444'
          }).then(resDel => {
            if (resDel.isConfirmed) {
              excluirEvento(event.id);
              Swal.fire({ icon: 'success', title: 'Evento excluído!', timer: 1200, showConfirmButton: false, toast: true, position: 'top-end' });
            }
          });
        }
      });
    }
  };

  return (
    <section id="calendarioSection">
      <div className="calendario-container">
        
        {/* Cabeçalho Superior */}
        <div className="calendario-header-bar">
          <div className="calendario-header-titles">
            <h1><i className="bi bi-calendar-check-fill"></i> Calendário Acadêmico</h1>
            <p className="calendario-subtitle">Acompanhe compromissos, provas e datas limites das suas tarefas</p>
          </div>
          <button className="btn-novo-evento-main" onClick={() => abrirModalNovo()}>
            <i className="bi bi-plus-lg"></i> Novo Evento
          </button>
        </div>

        {/* Painel de Métricas */}
        <div className="calendario-metricas-grid">
          <div className="cal-metric-card">
            <div className="cal-metric-icon compromissos">
              <i className="bi bi-bookmark-check-fill"></i>
            </div>
            <div className="cal-metric-info">
              <span className="cal-metric-num">{totalCompromissos}</span>
              <span className="cal-metric-label">Compromissos</span>
            </div>
          </div>

          <div className="cal-metric-card">
            <div className="cal-metric-icon provas">
              <i className="bi bi-mortarboard-fill"></i>
            </div>
            <div className="cal-metric-info">
              <span className="cal-metric-num">{totalProvas}</span>
              <span className="cal-metric-label">Provas / Avaliações</span>
            </div>
          </div>

          <div className="cal-metric-card">
            <div className="cal-metric-icon tarefas">
              <i className="bi bi-check2-square"></i>
            </div>
            <div className="cal-metric-info">
              <span className="cal-metric-num">{totalTarefasPendentes}</span>
              <span className="cal-metric-label">Tarefas com Prazo</span>
            </div>
          </div>

          <div className="cal-metric-card">
            <div className="cal-metric-icon total">
              <i className="bi bi-calendar-event-fill"></i>
            </div>
            <div className="cal-metric-info">
              <span className="cal-metric-num">{totalGeral}</span>
              <span className="cal-metric-label">Total Agendado</span>
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Dica */}
        <div className="calendario-toolbar-bar">
          <div className="calendario-filtros-nav">
            <button
              className={`btn-cal-filtro ${filtroTipo === 'todos' ? 'ativo' : ''}`}
              onClick={() => setFiltroTipo('todos')}
            >
              <i className="bi bi-grid-fill"></i> Todos ({totalGeral})
            </button>
            <button
              className={`btn-cal-filtro ${filtroTipo === 'compromisso' ? 'ativo' : ''}`}
              onClick={() => setFiltroTipo('compromisso')}
            >
              <i className="bi bi-bookmark-fill"></i> Compromissos ({totalCompromissos})
            </button>
            <button
              className={`btn-cal-filtro ${filtroTipo === 'prova' ? 'ativo' : ''}`}
              onClick={() => setFiltroTipo('prova')}
            >
              <i className="bi bi-mortarboard-fill"></i> Provas ({totalProvas})
            </button>
            <button
              className={`btn-cal-filtro ${filtroTipo === 'tarefa' ? 'ativo' : ''}`}
              onClick={() => setFiltroTipo('tarefa')}
            >
              <i className="bi bi-check2-square"></i> Tarefas ({totalTarefasPendentes})
            </button>
          </div>

          <span className="calendario-dica-clique">
            <i className="bi bi-lightbulb-fill text-warning"></i> Dica: Clique em qualquer dia para adicionar um evento
          </span>
        </div>

        {/* Card do Calendário Interativo */}
        <div className="calendario-card-main">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            locale={ptBrLocale}
            initialView="dayGridMonth"
            editable={true}
            selectable={true}
            events={eventosFiltrados}
            dateClick={handleDateClick}
            eventDrop={handleEventDrop}
            eventClick={handleEventClick}
            height="auto"
            contentHeight="auto"
            dayMaxEvents={3}
            eventDisplay="block"
            displayEventTime={false}
            fixedWeekCount={false}
          />
        </div>

        {/* Modal de Adicionar / Editar Evento */}
        {modalAberto && (
          <div className="cal-modal-backdrop" onClick={fecharModal}>
            <div className="cal-modal-card" onClick={e => e.stopPropagation()}>
              <div className="cal-modal-header">
                <h3>
                  <i className={`bi ${editandoId ? 'bi-pencil-square' : 'bi-calendar-plus-fill'}`} style={{ color: 'var(--cor-primaria)' }}></i>
                  {editandoId ? 'Editar Evento' : 'Novo Evento no Calendário'}
                </h3>
                <button className="btn-cal-modal-close" onClick={fecharModal}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="cal-modal-body">
                <div className="cal-form-group">
                  <label>Título ou Descrição do Evento *</label>
                  <input
                    type="text"
                    className="cal-form-input"
                    placeholder="Ex: Prova de Matemática, Reunião do TCC..."
                    value={formEvento.titulo}
                    maxLength={70}
                    autoFocus
                    onChange={e => setFormEvento({ ...formEvento, titulo: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="cal-form-group">
                    <label>Data *</label>
                    <input
                      type="date"
                      className="cal-form-input"
                      value={formEvento.data}
                      onChange={e => setFormEvento({ ...formEvento, data: e.target.value })}
                    />
                  </div>

                  <div className="cal-form-group">
                    <label>Tipo de Evento</label>
                    <select
                      className="cal-form-select"
                      value={formEvento.tipo}
                      onChange={e => {
                        const novoTipo = e.target.value;
                        const novaCor = novoTipo === 'prova' ? '#a855f7' : formEvento.cor;
                        setFormEvento({ ...formEvento, tipo: novoTipo, cor: novaCor });
                      }}
                    >
                      <option value="compromisso">🎯 Compromisso</option>
                      <option value="prova">📝 Prova / Avaliação</option>
                    </select>
                  </div>
                </div>

                <div className="cal-form-group">
                  <label>Recorrência</label>
                  <select
                    className="cal-form-select"
                    value={formEvento.recorrencia}
                    onChange={e => setFormEvento({ ...formEvento, recorrencia: e.target.value })}
                  >
                    <option value="nenhuma">Não repetir (Evento único)</option>
                    <option value="diaria">Repetir diariamente (por 2 semanas)</option>
                    <option value="semanal">Repetir semanalmente (por 8 semanas)</option>
                    <option value="mensal">Repetir mensalmente (por 4 meses)</option>
                  </select>
                </div>

                <div className="cal-form-group">
                  <label>Cor de Identificação</label>
                  <div className="cal-cores-presets">
                    {CORES_PALETA.map(item => (
                      <div
                        key={item.cor}
                        className={`cal-color-bubble ${formEvento.cor === item.cor ? 'selecionada' : ''}`}
                        style={{ backgroundColor: item.cor }}
                        title={item.nome}
                        onClick={() => setFormEvento({ ...formEvento, cor: item.cor })}
                      />
                    ))}
                    <input
                      type="color"
                      value={formEvento.cor}
                      onChange={e => setFormEvento({ ...formEvento, cor: e.target.value })}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        padding: 0,
                        background: 'transparent'
                      }}
                      title="Escolher cor personalizada"
                    />
                  </div>
                </div>
              </div>

              <div className="cal-modal-footer">
                <button type="button" className="btn-cal-cancel" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="button" className="btn-cal-save" onClick={salvarEvento}>
                  <i className="bi bi-check-lg"></i> {editandoId ? 'Atualizar Evento' : 'Salvar Evento'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
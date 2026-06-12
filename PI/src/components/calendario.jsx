import React, { useState, useEffect, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import Swal from 'sweetalert2';
import './Calendario.css';

export default function Calendario() {
  const [eventos, setEventos] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const calendarRef = useRef(null);

  const [novoEvento, setNovoEvento] = useState({
    titulo: '',
    data: '',
    cor: '#3788d8',
    tipo: 'compromisso',
    recorrencia: 'nenhuma'
  });

  // Carregar dados do localStorage
  useEffect(() => {
    const eventosSalvos = localStorage.getItem('eventosCalendario');
    if (eventosSalvos) {
      try {
        setEventos(JSON.parse(eventosSalvos));
      } catch (e) {
        setEventos([]);
      }
    }

    const tarefasSalvas = localStorage.getItem('tarefas');
    if (tarefasSalvas) {
      try {
        setTarefas(JSON.parse(tarefasSalvas));
      } catch (e) {
        setTarefas([]);
      }
    }
  }, []);

  // Salvar eventos com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('eventosCalendario', JSON.stringify(eventos));
    }, 300);
    return () => clearTimeout(timer);
  }, [eventos]);

  // Salvar tarefas
  useEffect(() => {
    localStorage.setItem('tarefas', JSON.stringify(tarefas));
  }, [tarefas]);

  const corPrioridade = (prioridade) => {
    switch (prioridade) {
      case 'alta': return '#ef4444';
      case 'media': return '#f59e0b';
      case 'baixa': return '#22c55e';
      default: return '#6c757d';
    }
  };

  const carregarEventos = useCallback(() => {
    const eventosFormatados = eventos.map(ev => ({
      id: ev.id,
      title: ev.title,
      start: ev.start,
      backgroundColor: ev.backgroundColor,
      borderColor: ev.borderColor,
      extendedProps: {
        isTarefa: ev.extendedProps?.isTarefa || false,
        tipo: ev.extendedProps?.tipo || 'compromisso',
        recorrencia: ev.extendedProps?.recorrencia || 'nenhuma',
        tarefaId: ev.extendedProps?.tarefaId
      }
    }));

    const tarefasEventos = tarefas
      .filter(t => t.data && !t.concluida)
      .map(t => ({
        id: `tarefa_${t.id}`,
        title: t.titulo,
        start: t.data,
        backgroundColor: corPrioridade(t.prioridade),
        borderColor: corPrioridade(t.prioridade),
        extendedProps: {
          isTarefa: true,
          tarefaId: t.id,
          tipo: 'tarefa'
        }
      }));

    const todosEventos = [...eventosFormatados, ...tarefasEventos];
    const eventosUnicos = [];
    const ids = new Set();

    todosEventos.forEach(ev => {
      if (!ids.has(ev.id)) {
        ids.add(ev.id);
        eventosUnicos.push(ev);
      }
    });

    return eventosUnicos;
  }, [eventos, tarefas]);

  // ===================== ADICIONAR EVENTO =====================
  const adicionarEvento = useCallback(() => {
    // Verificar campos vazios
    if (!novoEvento.titulo.trim() || !novoEvento.data) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, preencha o título e a data do evento!'
      });
      return;
    }

    // Verificar título muito longo
    if (novoEvento.titulo.trim().length > 50) {
      Swal.fire({
        icon: 'warning',
        title: 'Título muito longo',
        text: 'O título deve ter no máximo 50 caracteres!'
      });
      return;
    }

    // Verificar data no passado
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataEvento = new Date(novoEvento.data + 'T00:00:00');

    if (dataEvento < hoje) {
      Swal.fire({
        icon: 'warning',
        title: 'Data inválida',
        text: 'Não é possível adicionar eventos no passado!'
      });
      return;
    }

    // Verificar evento duplicado
    const eventoDuplicado = eventos.some(ev =>
      ev.title.toLowerCase() === novoEvento.titulo.trim().toLowerCase() &&
      ev.start === novoEvento.data
    );

    if (eventoDuplicado) {
      Swal.fire({
        icon: 'warning',
        title: 'Evento duplicado',
        text: 'Já existe um evento com esse nome nesta data!',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    // Verificar recorrência sem data futura
    if (novoEvento.recorrencia !== 'nenhuma') {
      let textoRecorrencia = '';
      if (novoEvento.recorrencia === 'diaria') textoRecorrencia = '30 dias';
      else if (novoEvento.recorrencia === 'semanal') textoRecorrencia = '12 semanas';
      else if (novoEvento.recorrencia === 'mensal') textoRecorrencia = '6 meses';

      Swal.fire({
        icon: 'info',
        title: 'Evento recorrente',
        text: `Este evento será repetido por ${textoRecorrencia}.`,
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
      });
    }

    // Criar evento
    const novoId = Date.now().toString();
    const eventoPrincipal = {
      id: novoId,
      title: novoEvento.titulo.trim(),
      start: novoEvento.data,
      backgroundColor: novoEvento.cor,
      borderColor: novoEvento.cor,
      extendedProps: {
        isTarefa: false,
        tipo: novoEvento.tipo,
        recorrencia: novoEvento.recorrencia
      }
    };

    const novosEventos = [eventoPrincipal, ...eventos];

    // Eventos recorrentes
    if (novoEvento.recorrencia !== 'nenhuma') {
      const dataInicio = new Date(novoEvento.data + 'T12:00:00');
      let maxIteracoes = 0;

      if (novoEvento.recorrencia === 'diaria') maxIteracoes = 30;
      else if (novoEvento.recorrencia === 'semanal') maxIteracoes = 12;
      else if (novoEvento.recorrencia === 'mensal') maxIteracoes = 6;

      for (let i = 1; i <= maxIteracoes; i++) {
        const novaData = new Date(dataInicio);

        if (novoEvento.recorrencia === 'diaria') {
          novaData.setDate(dataInicio.getDate() + i);
        } else if (novoEvento.recorrencia === 'semanal') {
          novaData.setDate(dataInicio.getDate() + (i * 7));
        } else if (novoEvento.recorrencia === 'mensal') {
          novaData.setMonth(dataInicio.getMonth() + i);
        }

        novosEventos.push({
          id: `${novoId}_rec_${i}`,
          title: novoEvento.titulo.trim(),
          start: novaData.toISOString().split('T')[0],
          backgroundColor: novoEvento.cor,
          borderColor: novoEvento.cor,
          extendedProps: {
            isTarefa: false,
            tipo: novoEvento.tipo,
            recorrencia: novoEvento.recorrencia,
            isRecorrente: true
          }
        });
      }
    }

    setEventos(novosEventos);

    // Limpar formulário
    setNovoEvento({
      titulo: '',
      data: '',
      cor: '#3788d8',
      tipo: 'compromisso',
      recorrencia: 'nenhuma'
    });

    Swal.fire({
      icon: 'success',
      title: 'Evento adicionado!',
      text: `"${novoEvento.titulo}" foi agendado com sucesso!`,
      timer: 1500,
      showConfirmButton: false,
      position: 'top-end',
      toast: true
    });
  }, [novoEvento, eventos]);

  const atualizarTarefa = useCallback((tarefaId, novaData) => {
    setTarefas(prev => prev.map(t => t.id === tarefaId ? { ...t, data: novaData } : t));
  }, []);

  const excluirTarefa = useCallback((tarefaId) => {
    setTarefas(prev => prev.filter(t => t.id !== tarefaId));
  }, []);

  const excluirEvento = useCallback((eventoId) => {
    setEventos(prev => prev.filter(e => e.id !== eventoId));
  }, []);

  const atualizarEvento = useCallback((eventoId, novosDados) => {
    setEventos(prev => prev.map(e => e.id === eventoId ? { ...e, ...novosDados } : e));
  }, []);

  // ===================== HANDLERS DO FULLCALENDAR =====================
  const handleEventDrop = useCallback((info) => {
    const event = info.event;
    const novaData = event.startStr;
    const isTarefa = event.extendedProps.isTarefa;
    const tarefaId = event.extendedProps.tarefaId;

    if (isTarefa && tarefaId) {
      atualizarTarefa(tarefaId, novaData);
    } else {
      atualizarEvento(event.id, { start: novaData });
    }

    Swal.fire({
      icon: 'success',
      title: 'Movido!',
      text: `Nova data: ${novaData.split('-').reverse().join('/')}`,
      timer: 800,
      showConfirmButton: false,
      position: 'top-end',
      toast: true
    });
  }, [atualizarTarefa, atualizarEvento]);

  const handleEventClick = useCallback((info) => {
    const event = info.event;
    const isTarefa = event.extendedProps.isTarefa;
    const isRecorrente = event.extendedProps.recorrencia && event.extendedProps.recorrencia !== 'nenhuma';

    if (isTarefa) {
      const tarefaId = event.extendedProps.tarefaId;
      const tarefa = tarefas.find(t => t.id === tarefaId);

      if (!tarefa) {
        event.remove();
        return;
      }

      Swal.fire({
        title: 'Editar tarefa',
        html: `
          <input type="text" id="editTitulo" class="swal2-input" value="${tarefa.titulo.replace(/"/g, '&quot;')}">
          <input type="date" id="editData" class="swal2-input" value="${tarefa.data}">
        `,
        showCancelButton: true,
        confirmButtonText: 'Salvar',
        denyButtonText: 'Excluir',
        showDenyButton: true
      }).then(result => {
        if (result.isConfirmed) {
          const novoTitulo = document.getElementById('editTitulo').value.trim();
          const novaData = document.getElementById('editData').value;
          if (novoTitulo && novaData) {
            setTarefas(prev =>
              prev.map(t => t.id === tarefaId ? { ...t, titulo: novoTitulo, data: novaData } : t)
            );
            Swal.fire({ icon: 'success', title: 'Tarefa atualizada!', timer: 1000, showConfirmButton: false });
          }
        } else if (result.isDenied) {
          excluirTarefa(tarefaId);
          Swal.fire({ icon: 'success', title: 'Tarefa excluída!', timer: 1000, showConfirmButton: false });
        }
      });
    } else if (isRecorrente) {
      Swal.fire({
        title: 'Excluir evento recorrente',
        text: `"${event.title}" se repete ${event.extendedProps.recorrencia}`,
        icon: 'warning',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Apenas este dia',
        denyButtonText: 'Todas repetições',
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if (result.isConfirmed) {
          excluirEvento(event.id);
        } else if (result.isDenied) {
          const eventosParaRemover = eventos.filter(e =>
            e.title === event.title &&
            e.extendedProps?.recorrencia === event.extendedProps?.recorrencia
          );
          eventosParaRemover.forEach(e => excluirEvento(e.id));
        }
      });
    } else {
      Swal.fire({
        title: 'Editar evento',
        html: `
          <input type="text" id="editTitulo" class="swal2-input" value="${event.title.replace(/"/g, '&quot;')}" placeholder="Título">
          <input type="date" id="editData" class="swal2-input" value="${event.startStr}">
          <input type="color" id="editCor" class="swal2-input" value="${event.backgroundColor || '#3788d8'}" style="width: 100%; height: 45px; padding: 5px; border-radius: 8px; cursor: pointer;">
        `,
        showCancelButton: true,
        confirmButtonText: 'Salvar',
        denyButtonText: 'Excluir',
        showDenyButton: true
      }).then(result => {
        if (result.isConfirmed) {
          const novoTitulo = document.getElementById('editTitulo').value.trim();
          const novaData = document.getElementById('editData').value;
          const novaCor = document.getElementById('editCor').value;

          if (!novoTitulo || !novaData) {
            Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Por favor, preencha o título e a data!' });
            return;
          }

          atualizarEvento(event.id, {
            title: novoTitulo,
            start: novaData,
            backgroundColor: novaCor,
            borderColor: novaCor
          });

          Swal.fire({ icon: 'success', title: 'Evento atualizado!', timer: 1200, showConfirmButton: false, position: 'top-end', toast: true });
        } else if (result.isDenied) {
          Swal.fire({
            title: 'Confirmar exclusão',
            text: 'Tem certeza que deseja excluir este evento?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545'
          }).then(confirmResult => {
            if (confirmResult.isConfirmed) {
              excluirEvento(event.id);
              Swal.fire({ icon: 'success', title: 'Evento excluído!', timer: 1200, showConfirmButton: false, position: 'top-end', toast: true });
            }
          });
        }
      });
    }
  }, [tarefas, excluirTarefa, excluirEvento, atualizarEvento, eventos]);

  return (
    <section id="calendarioSection">
      <div className="calendario-container">
        <h1 className="mb-3">Calendário</h1>

        <div className="form-evento">
          <input
            type="text"
            placeholder="Nome do evento"
            value={novoEvento.titulo}
            maxLength={50}
            onChange={(e) => setNovoEvento({ ...novoEvento, titulo: e.target.value })}
          />
          <input
            type="date"
            value={novoEvento.data}
            onChange={(e) => setNovoEvento({ ...novoEvento, data: e.target.value })}
          />
          <input
            type="color"
            value={novoEvento.cor}
            onChange={(e) => setNovoEvento({ ...novoEvento, cor: e.target.value })}
          />
          <select value={novoEvento.tipo} onChange={(e) => setNovoEvento({ ...novoEvento, tipo: e.target.value })}>
            <option value="compromisso">Compromisso</option>
            <option value="prova">Prova</option>
          </select>
          <select value={novoEvento.recorrencia} onChange={(e) => setNovoEvento({ ...novoEvento, recorrencia: e.target.value })}>
            <option value="nenhuma">Não repetir</option>
            <option value="diaria">Repetir diariamente</option>
            <option value="semanal">Repetir semanalmente</option>
            <option value="mensal">Repetir mensalmente</option>
          </select>
          <button onClick={adicionarEvento}>Adicionar</button>
        </div>

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
          events={carregarEventos()}
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
    </section>
  );
}
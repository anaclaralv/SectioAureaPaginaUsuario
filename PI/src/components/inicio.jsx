import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { apiFetch } from '../api';
import './inicio.css';

const DIAS_SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

const CORES_INTELIGENCIA = {
  linguistica: '#9f042c',
  logico: '#ffbd59',
  musical: '#8a03d2',
  corporal: '#00bf63',
  espacial: '#d203a4',
  interpessoal: '#ff5f00',
  intrapessoal: '#5170ff'
};

const normalizarDia = (dia) => {
  if (!dia || typeof dia !== 'string') return '';
  return dia
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace('-feira', '')
    .trim();
};

const normalizarItemCronograma = (item, listaMaterias = []) => {
  const idMateria = item.id_materia || item.materia?.id || item.materia?.id_materia || null;
  const matEncontrada = listaMaterias.find(m => String(m.id_materia) === String(idMateria));
  const nomeMateria =
    item.nome_materia ||
    item.materia?.nome ||
    matEncontrada?.nome ||
    (typeof item.materia === 'string' ? item.materia : 'Matéria');
  const corMateria =
    item.cor_materia ||
    item.materia?.cor ||
    matEncontrada?.cor ||
    'var(--cor-primaria)';

  const inicio = String(item.hora_inicio || item.inicio || '').substring(0, 5);
  const fim = String(item.hora_final || item.fim || '').substring(0, 5);
  const dia = normalizarDia(item.dia_semana || item.dia || '');

  return {
    ...item,
    id: item.id_cronograma || item.id,
    id_cronograma: item.id_cronograma || item.id,
    id_materia: idMateria,
    dia,
    dia_semana: dia,
    inicio,
    fim,
    hora_inicio: inicio,
    hora_final: fim,
    nome_materia: nomeMateria,
    cor_materia: corMateria,
    materia: {
      id: idMateria,
      nome: nomeMateria,
      cor: corMateria
    }
  };
};

const converterHoraParaMinutos = (horaStr) => {
  if (!horaStr || !horaStr.includes(':')) return null;
  const [h, m] = horaStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

const obterCorInteligencia = () => {
  const tipo = (localStorage.getItem('inteligenciaUsuario') || sessionStorage.getItem('inteligenciaUsuario') || '').toLowerCase().trim();
  if (tipo && CORES_INTELIGENCIA[tipo]) {
    return CORES_INTELIGENCIA[tipo];
  }
  const corSalva = localStorage.getItem('corPrimaria') || sessionStorage.getItem('corPrimaria');
  if (corSalva) return corSalva;
  return 'var(--cor-primaria)';
};

const Inicio = () => {
  const [tarefas, setTarefas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [cronograma, setCronograma] = useState([]);
  const [materiaAtual, setMateriaAtual] = useState(null);
  const [proximaMateria, setProximaMateria] = useState(null);
  const [corInteligencia, setCorInteligencia] = useState(obterCorInteligencia);

  const carregarDados = useCallback(async () => {
    setCorInteligencia(obterCorInteligencia());

    const tarefasSalvas = localStorage.getItem('tarefas');
    if (tarefasSalvas) {
      try {
        const tarefasParseadas = JSON.parse(tarefasSalvas);
        if (Array.isArray(tarefasParseadas)) {
          setTarefas(
            tarefasParseadas.map((tarefa, index) => {
              const id = tarefa.id || tarefa.id_tarefa || tarefa._id || Date.now() + index;
              let texto = tarefa.texto || tarefa.titulo || tarefa.nome_tarefa || tarefa.nome || 'Sem título';
              if (texto.includes(' - ')) texto = texto.split(' - ')[0];
              return {
                id,
                texto,
                titulo: texto,
                concluida: Boolean(tarefa.concluida),
                prioridade: (tarefa.prioridade || tarefa.dificuldade || 'media').replace('-concluida', ''),
                data: tarefa.data || tarefa.prazo || null
              };
            })
          );
        }
      } catch (e) {}
    }

    const eventosSalvos = localStorage.getItem('eventosCalendario');
    if (eventosSalvos) {
      try {
        const parsed = JSON.parse(eventosSalvos);
        if (Array.isArray(parsed)) setEventos(parsed);
      } catch (e) {}
    }

    const cronogramaSalvo = localStorage.getItem('cronogramaNovo');
    if (cronogramaSalvo) {
      try {
        const parsed = JSON.parse(cronogramaSalvo);
        if (Array.isArray(parsed)) {
          setCronograma(parsed.map(item => normalizarItemCronograma(item)));
        }
      } catch (e) {}
    }

    try {
      const [resTarefas, resEventos, resMaterias, resCronogramas] = await Promise.all([
        apiFetch('tarefas').catch(() => null),
        apiFetch('eventos').catch(() => null),
        apiFetch('materias').catch(() => null),
        apiFetch('cronogramas').catch(() => null)
      ]);

      let listaMaterias = [];
      if (resMaterias && resMaterias.ok) {
        const dadosMat = await resMaterias.json();
        if (Array.isArray(dadosMat)) {
          listaMaterias = dadosMat;
        }
      }

      if (resCronogramas && resCronogramas.ok) {
        const dadosCron = await resCronogramas.json();
        if (Array.isArray(dadosCron)) {
          const cronFormatado = dadosCron.map(item => normalizarItemCronograma(item, listaMaterias));
          setCronograma(cronFormatado);
          localStorage.setItem('cronogramaNovo', JSON.stringify(cronFormatado));
        }
      }

      if (resTarefas && resTarefas.ok) {
        const dadosTarefas = await resTarefas.json();
        if (Array.isArray(dadosTarefas)) {
          const tarefasFormatadas = dadosTarefas.map(t => {
            const dif = t.dificuldade || 'media';
            const concluida = dif.includes('-concluida');
            const prioridade = dif.replace('-concluida', '');
            return {
              id: t.id_tarefa,
              texto: t.nome_tarefa,
              titulo: t.nome_tarefa,
              prioridade,
              data: t.prazo,
              concluida
            };
          });
          setTarefas(tarefasFormatadas);
          localStorage.setItem('tarefas', JSON.stringify(tarefasFormatadas));
        }
      }

      if (resEventos && resEventos.ok) {
        const dadosEventos = await resEventos.json();
        if (Array.isArray(dadosEventos)) {
          const eventosFormatados = dadosEventos.map(ev => {
            let titulo = 'Evento';
            if (ev.tipo && typeof ev.tipo === 'string' && ev.tipo.startsWith('{')) {
              try {
                const parsed = JSON.parse(ev.tipo);
                titulo = parsed.title || parsed.titulo || 'Evento';
              } catch (e) {
                titulo = ev.tipo;
              }
            } else if (ev.tipo) {
              titulo = ev.tipo;
            }
            return {
              id: String(ev.id_evento || ev.id),
              title: titulo,
              start: ev.data,
              data: ev.data,
              cor: ev.cor || '#3b82f6'
            };
          });
          setEventos(eventosFormatados);
          localStorage.setItem('eventosCalendario', JSON.stringify(eventosFormatados));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados na página inicial:', err);
    }
  }, []);

  useEffect(() => {
    carregarDados();

    const handleCronogramaAtualizado = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCronograma(e.detail.map(item => normalizarItemCronograma(item)));
      } else {
        carregarDados();
      }
    };

    window.addEventListener('cronogramaAtualizado', handleCronogramaAtualizado);
    return () => window.removeEventListener('cronogramaAtualizado', handleCronogramaAtualizado);
  }, [carregarDados]);

  const alternarTarefa = async (id) => {
    const tarefaAlvo = tarefas.find(t => t.id === id);
    const novasTarefas = tarefas.map(tarefa => {
      if (tarefa.id === id) {
        return { ...tarefa, concluida: !tarefa.concluida };
      }
      return tarefa;
    });

    setTarefas(novasTarefas);
    localStorage.setItem('tarefas', JSON.stringify(novasTarefas));

    if (tarefaAlvo) {
      try {
        const novaConcluida = !tarefaAlvo.concluida;
        await apiFetch(`tarefas/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            nome_tarefa: tarefaAlvo.texto || tarefaAlvo.titulo,
            dificuldade: novaConcluida ? `${tarefaAlvo.prioridade}-concluida` : tarefaAlvo.prioridade,
            prazo: tarefaAlvo.data
          })
        });
      } catch (err) {
        console.error('Erro ao atualizar tarefa na API:', err);
      }
    }
  };

  const verificarHorarioCronograma = useCallback(() => {
    if (!cronograma || cronograma.length === 0) {
      setMateriaAtual(null);
      setProximaMateria(null);
      return;
    }

    const agora = new Date();
    const diaHoje = DIAS_SEMANA[agora.getDay()];
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

    const materiasHoje = cronograma
      .filter(item => normalizarDia(item.dia || item.dia_semana) === diaHoje)
      .sort((a, b) => (a.inicio || '').localeCompare(b.inicio || ''));

    let atual = null;
    let proxima = null;

    for (let i = 0; i < materiasHoje.length; i++) {
      const item = materiasHoje[i];
      const inicioMin = converterHoraParaMinutos(item.inicio);
      const fimMin = converterHoraParaMinutos(item.fim);

      if (inicioMin !== null && fimMin !== null) {
        if (minutosAgora >= inicioMin && minutosAgora < fimMin) {
          atual = item;
          proxima = materiasHoje.slice(i + 1).find(m => converterHoraParaMinutos(m.inicio) > minutosAgora) || null;
          break;
        } else if (minutosAgora < inicioMin && !proxima) {
          proxima = item;
        }
      }
    }

    setMateriaAtual(atual);
    setProximaMateria(proxima);
  }, [cronograma]);

  useEffect(() => {
    verificarHorarioCronograma();
    const interval = setInterval(verificarHorarioCronograma, 10000);
    return () => clearInterval(interval);
  }, [verificarHorarioCronograma]);

  const abrirModalAmbiente = () => {
    const passos = [
      { titulo: "Escolha o local", texto: "Busque um lugar silencioso, bem iluminado e livre de distracoes.", icone: "bi bi-house-check-fill" },
      { titulo: "Celular longe", texto: "Deixe o celular no modo silencioso e fora do seu alcance.", icone: "bi bi-phone-vibrate" },
      { titulo: "Mantenha-se hidratado", texto: "Tenha sempre uma garrafa de agua por perto.", icone: "bi bi-cup-straw" },
      { titulo: "Organize o material", texto: "Separe todo o material antes de comecar.", icone: "bi bi-folder-check" },
      { titulo: "Metas e pausas", texto: "Defina quanto tempo vai estudar e quando vai fazer pausas.", icone: "bi bi-stopwatch" },
      { titulo: "Objetivos claros", texto: "Tenha em mente o que quer aprender nessa sessao.", icone: "bi bi-bullseye" }
    ];

    let passoAtual = 0;

    const mostrarPasso = () => {
      const passo = passos[passoAtual];
      const isUltimo = passoAtual === passos.length - 1;
      const isPrimeiro = passoAtual === 0;

      Swal.fire({
        title: passo.titulo,
        html: `<div style="text-align: center;"><i class="${passo.icone}" style="font-size: 3rem; color: var(--cor-primaria); display: block; margin-bottom: 15px;"></i><p class="modal-ambiente-texto" style="font-size: 0.95rem; line-height: 1.6;">${passo.texto}</p><p class="modal-ambiente-passos" style="font-size: 0.75rem; margin-top: 15px;">${passoAtual + 1} de ${passos.length}</p></div>`,
        showCancelButton: !isPrimeiro,
        showConfirmButton: true,
        confirmButtonText: isUltimo ? 'Pronto!' : 'Proximo',
        cancelButtonText: 'Voltar',
        confirmButtonColor: '#9f042c',
        customClass: { popup: 'rounded-4' }
      }).then((result) => {
        if (result.isConfirmed && !isUltimo) { passoAtual++; mostrarPasso(); }
        else if (result.isDismissed && !isPrimeiro) { passoAtual--; mostrarPasso(); }
      });
    };

    mostrarPasso();
  };

  const agora = new Date();
  const hojeIso = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
  const eventosFuturos = eventos
    .filter(e => e.start && String(e.start) >= hojeIso)
    .slice(0, 3);

  const diaSemanaHoje = DIAS_SEMANA[agora.getDay()];
  const materiasHoje = cronograma
    .filter(item => normalizarDia(item.dia || item.dia_semana) === diaSemanaHoje)
    .sort((a, b) => (a.inicio || '').localeCompare(b.inicio || ''));

  return (
    <section id="inicioSection">
      <h1 style={{ marginBottom: '20px' }}>Início</h1>

      {materiaAtual && (
        <div
          className="alerta-estudo-unico mb-4"
          style={{ backgroundColor: corInteligencia }}
        >
          <div className="alerta-estudo-conteudo">
            <i className="bi bi-exclamation-triangle-fill alerta-estudo-icone"></i>
            <div>
              <h4 className="alerta-estudo-titulo">Você deveria estar estudando!!!</h4>
              <p className="alerta-estudo-detalhe">
                {materiaAtual.materia?.nome || materiaAtual.nome_materia} ({materiaAtual.inicio} às {materiaAtual.fim})
              </p>
            </div>
          </div>
          <button
            className="btn-alerta-estudar"
            style={{ color: corInteligencia }}
            onClick={() => window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'relogio' }))}
          >
            Ir para o Relógio
          </button>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="row">
          <div className="col-12 col-md-4 mb-3">
            <div className="card p-3">
              <h5><i className="bi bi-card-checklist mx-2"></i> Tarefas</h5>
              <ul>
                {tarefas.length === 0 ? (
                  <li style={{ color: '#6c757d' }}>Nenhuma tarefa encontrada</li>
                ) : (
                  tarefas.map(tarefa => (
                    <li key={tarefa.id}>
                      <input
                        type="checkbox"
                        checked={tarefa.concluida === true}
                        onChange={() => alternarTarefa(tarefa.id)}
                        style={{ marginRight: '8px' }}
                      />
                      <span style={{ textDecoration: tarefa.concluida ? 'line-through' : 'none', opacity: tarefa.concluida ? 0.6 : 1, flex: 1 }}>
                        {tarefa.texto}
                        {tarefa.prioridade === 'alta' && <span className="badge" style={{ background: '#ef4444', color: 'white', fontSize: '0.65rem', marginLeft: '6px' }}>Alta</span>}
                        {tarefa.prioridade === 'media' && <span className="badge" style={{ background: '#f59e0b', color: 'white', fontSize: '0.65rem', marginLeft: '6px' }}>Média</span>}
                        {tarefa.prioridade === 'baixa' && <span className="badge" style={{ background: '#22c55e', color: 'white', fontSize: '0.65rem', marginLeft: '6px' }}>Baixa</span>}
                        {tarefa.data && ` ${tarefa.data}`}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="col-12 col-md-4 mb-3">
            <div className="card p-3">
              <h5><i className="bi bi-calendar-week mx-2"></i> Próximos Eventos</h5>
              <ul>
                {eventosFuturos.length === 0 ? (
                  <li>Nenhum evento próximo</li>
                ) : (
                  eventosFuturos.map((evento, idx) => (
                    <li key={idx}>{evento.title} - {evento.start}</li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="col-12 col-md-4 mb-3">
            <div className="card p-3">
              <h5><i className="bi bi-journal-bookmark mx-2"></i> Hoje você tem:</h5>
              <ul>
                {materiasHoje.length === 0 ? (
                  <li>Nenhuma matéria agendada para hoje</li>
                ) : (
                  materiasHoje.map((m, idx) => (
                    <li key={m.id || idx}>
                      {m.materia?.nome || m.nome_materia || m.materia} - {m.inicio} às {m.fim}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="painel-estudos">
            <div className="card p-3 mt-3">
              <h3><i className="bi bi-exclamation-circle mx-2"></i> Agora</h3>
              <p id="materiaAgoraInicio">
                {materiaAtual ? (materiaAtual.materia?.nome || materiaAtual.nome_materia || materiaAtual.materia) : 'Descanso'}
              </p>
              <p id="horarioAgoraInicio">
                {materiaAtual && `${materiaAtual.inicio} - ${materiaAtual.fim}`}
              </p>
              {materiaAtual && (
                <button
                  className="btn btn-sm mt-2"
                  style={{ background: 'var(--cor-primaria)', color: 'white', borderRadius: '20px', padding: '8px 16px', border: 'none', cursor: 'pointer', fontWeight: 600, width: '100%' }}
                  onClick={() => window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'relogio' }))}
                >
                  Ir para o Relógio
                </button>
              )}
              <hr />
              <h3>Proxima</h3>
              <p id="materiaProximaInicio">
                {proximaMateria ? (proximaMateria.materia?.nome || proximaMateria.nome_materia || proximaMateria.materia) : 'Nenhuma matéria agendada'}
              </p>
              <p id="horarioProximaInicio">
                {proximaMateria && `${proximaMateria.inicio} - ${proximaMateria.fim}`}
              </p>
            </div>

            <div className="col-12 mt-3">
              <div className="card card-dicas p-3 text-center" onClick={abrirModalAmbiente}>
                <i className="bi bi-lightbulb-fill" style={{ fontSize: '1.5rem', color: '#f59e0b', marginBottom: '8px', display: 'block' }}></i>
                <h5 style={{ marginBottom: '4px' }}>Como preparar o ambiente?</h5>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0 }}>Clique aqui para ver as dicas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Inicio;
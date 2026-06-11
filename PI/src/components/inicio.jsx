import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './Inicio.css';

const Inicio = () => {
  const [tarefas, setTarefas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [cronograma, setCronograma] = useState([]);
  const [materiaAtual, setMateriaAtual] = useState(null);
  const [proximaMateria, setProximaMateria] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    const tarefasSalvas = localStorage.getItem('tarefas');
    
    if (tarefasSalvas) {
      try {
        let tarefasParseadas = JSON.parse(tarefasSalvas);
        
        const tarefasComId = tarefasParseadas.map((tarefa, index) => {
          const id = tarefa.id || tarefa._id || Date.now() + index + Math.random();
          let texto = tarefa.texto || tarefa.titulo || tarefa.nome || "Sem título";
          
          if (texto.includes(" - ")) {
            texto = texto.split(" - ")[0];
          }
          
          return {
            id: id,
            texto: texto,
            concluida: tarefa.concluida || false,
            prioridade: tarefa.prioridade || "normal",
            data: tarefa.data || null,
          };
        });
        
        setTarefas(tarefasComId);
      } catch(e) {
        setTarefas([]);
      }
    } else {
      setTarefas([
        { id: 1, texto: "Revisar matemática", concluida: false },
        { id: 2, texto: "Fazer exercícios", concluida: false },
      ]);
    }

    const eventosSalvos = localStorage.getItem('eventosCalendario');
    if (eventosSalvos) {
      try {
        setEventos(JSON.parse(eventosSalvos));
      } catch(e) {
        setEventos([]);
      }
    }

    const cronogramaSalvo = localStorage.getItem('cronogramaNovo');
    if (cronogramaSalvo) {
      try {
        setCronograma(JSON.parse(cronogramaSalvo));
      } catch(e) {
        setCronograma([]);
      }
    }
  };

  const alternarTarefa = (id) => {
    const novasTarefas = tarefas.map(tarefa => {
      if (tarefa.id === id) {
        return { ...tarefa, concluida: !tarefa.concluida };
      }
      return tarefa;
    });
    
    setTarefas(novasTarefas);
    localStorage.setItem('tarefas', JSON.stringify(novasTarefas));
  };

  // Calcular matéria atual
  useEffect(() => {
    if (cronograma.length === 0) return;

    const hoje = new Date().toISOString().split('T')[0];
    const agora = new Date();
    const horaAtual = agora.getHours();
    const minutoAtual = agora.getMinutes();
    const tempoAtual = horaAtual + minutoAtual / 60;

    const materiasHoje = cronograma
      .filter(item => item.dia === ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"][new Date().getDay()])
      .sort((a, b) => a.inicio.localeCompare(b.inicio));

    let atual = null;
    let proxima = null;

    for (let i = 0; i < materiasHoje.length; i++) {
      if (materiasHoje[i].inicio && materiasHoje[i].fim) {
        const [hInicio, mInicio] = materiasHoje[i].inicio.split(':').map(Number);
        const [hFim, mFim] = materiasHoje[i].fim.split(':').map(Number);
        const inicio = hInicio + mInicio / 60;
        const fim = hFim + mFim / 60;

        if (tempoAtual >= inicio && tempoAtual <= fim) {
          atual = materiasHoje[i];
          proxima = materiasHoje[i + 1] || null;
          break;
        } else if (tempoAtual < inicio) {
          proxima = materiasHoje[i];
          break;
        }
      }
    }

    setMateriaAtual(atual);
    setProximaMateria(proxima);
  }, [cronograma]);

  // Atualizar a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      if (cronograma.length === 0) return;
      
      const agora = new Date();
      const horaAtual = agora.getHours();
      const minutoAtual = agora.getMinutes();
      const tempoAtual = horaAtual + minutoAtual / 60;

      const materiasHoje = cronograma
        .filter(item => item.dia === ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"][new Date().getDay()])
        .sort((a, b) => a.inicio.localeCompare(b.inicio));

      let atual = null;
      let proxima = null;

      for (let i = 0; i < materiasHoje.length; i++) {
        if (materiasHoje[i].inicio && materiasHoje[i].fim) {
          const [hInicio, mInicio] = materiasHoje[i].inicio.split(':').map(Number);
          const [hFim, mFim] = materiasHoje[i].fim.split(':').map(Number);
          const inicio = hInicio + mInicio / 60;
          const fim = hFim + mFim / 60;

          if (tempoAtual >= inicio && tempoAtual <= fim) {
            atual = materiasHoje[i];
            proxima = materiasHoje[i + 1] || null;
            break;
          } else if (tempoAtual < inicio) {
            proxima = materiasHoje[i];
            break;
          }
        }
      }

      setMateriaAtual(atual);
      setProximaMateria(proxima);
    }, 60000);

    return () => clearInterval(interval);
  }, [cronograma]);

  // ===================== MODAL DE DICAS =====================
  const abrirModalAmbiente = () => {
    const passos = [
      {
        titulo: "Escolha o local",
        texto: "Busque um lugar silencioso, bem iluminado e livre de distracoes. Um ambiente calmo faz toda a diferenca na concentracao.",
        icone: "bi bi-house-check-fill"
      },
      {
        titulo: "Celular longe",
        texto: "Deixe o celular no modo silencioso e fora do seu alcance. Notificacoes sao os maiores viloes do foco nos estudos.",
        icone: "bi bi-phone-vibrate"
      },
      {
        titulo: "Mantenha-se hidratado",
        texto: "Tenha sempre uma garrafa de agua por perto. A hidratacao ajuda o cerebro a funcionar melhor.",
        icone: "bi bi-cup-straw"
      },
      {
        titulo: "Organize o material",
        texto: "Separe todo o material antes de comecar: livros, cadernos, canetas. Assim voce nao perde tempo procurando depois.",
        icone: "bi bi-folder-check"
      },
      {
        titulo: "Metas e pausas",
        texto: "Defina quanto tempo vai estudar e quando vai fazer pausas. Use o timer ou pomodoro do seu Relogio de Estudos.",
        icone: "bi bi-stopwatch"
      },
      {
        titulo: "Objetivos claros",
        texto: "Tenha em mente o que quer aprender nessa sessao. Fica mais facil manter o foco quando voce sabe exatamente o que fazer.",
        icone: "bi bi-bullseye"
      }
    ];
    
    let passoAtual = 0;
    
    const mostrarPasso = () => {
      const passo = passos[passoAtual];
      const isUltimo = passoAtual === passos.length - 1;
      const isPrimeiro = passoAtual === 0;
      
      Swal.fire({
        title: passo.titulo,
        html: `
          <div style="text-align: center;">
            <i class="${passo.icone}" style="font-size: 3rem; color: var(--cor-primaria); display: block; margin-bottom: 15px;"></i>
            <p style="font-size: 0.95rem; color: #4b5563; line-height: 1.6;">${passo.texto}</p>
            <p style="font-size: 0.75rem; color: #9ca3af; margin-top: 15px;">${passoAtual + 1} de ${passos.length}</p>
          </div>
        `,
        showCancelButton: !isPrimeiro,
        showConfirmButton: true,
        confirmButtonText: isUltimo ? 'Pronto!' : 'Proximo',
        cancelButtonText: 'Voltar',
        confirmButtonColor: '#9f042c',
        customClass: {
          popup: 'rounded-4'
        }
      }).then((result) => {
        if (result.isConfirmed && !isUltimo) {
          passoAtual++;
          mostrarPasso();
        } else if (result.isDismissed && !isPrimeiro) {
          passoAtual--;
          mostrarPasso();
        }
      });
    };
    
    mostrarPasso();
  };

  const eventosFuturos = eventos.filter(e => {
    if (!e.start) return false;
    return new Date(e.start) >= new Date();
  }).slice(0, 3);

  const hoje = new Date().getDay();
  const materiasHoje = cronograma.filter(item => {
    const diaSemana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"][hoje];
    return item.dia === diaSemana;
  });

  return (
    <section id="inicioSection">
      <h1 style={{ marginBottom: '20px' }}>Início</h1>
      
      <div className="dashboard-grid">
        <div className="row">
          {/* TAREFAS */}
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
                      <span style={{ 
                        textDecoration: tarefa.concluida ? 'line-through' : 'none',
                        opacity: tarefa.concluida ? 0.6 : 1,
                        flex: 1
                      }}>
                        {tarefa.texto}
                        {tarefa.prioridade === 'alta' && ' 🔴'}
                        {tarefa.prioridade === 'media' && ' 🟡'}
                        {tarefa.prioridade === 'baixa' && ' 🟢'}
                        {tarefa.data && ` ${tarefa.data}`}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          {/* PRÓXIMOS EVENTOS */}
          <div className="col-12 col-md-4 mb-3">
            <div className="card p-3">
              <h5><i className="bi bi-calendar-week mx-2"></i> Próximos Eventos</h5>
              <ul>
                {eventosFuturos.length === 0 ? (
                  <li>Nenhum evento próximo</li>
                ) : (
                  eventosFuturos.map((evento, idx) => (
                    <li key={idx}>
                      {evento.title} - {evento.start}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          {/* HOJE VOCÊ TEM */}
          <div className="col-12 col-md-4 mb-3">
            <div className="card p-3">
              <h5><i className="bi bi-journal-bookmark mx-2"></i> Hoje você tem:</h5>
              <ul>
                {materiasHoje.length === 0 ? (
                  <li>Nenhuma matéria agendada para hoje</li>
                ) : (
                  materiasHoje.map((m, idx) => (
                    <li key={idx}>
                      {m.materia?.nome || m.materia} - {m.inicio} às {m.fim}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          {/* AGORA E PRÓXIMA */}
          <div className="painel-estudos">
            <div className="card p-3 mt-3">
              <h3><i className="bi bi-exclamation-circle mx-2"></i> Agora</h3>
              <p id="materiaAgoraInicio">
                {materiaAtual ? materiaAtual.materia?.nome || materiaAtual.materia : 'Descanso'}
              </p>
              <p id="horarioAgoraInicio">
                {materiaAtual && `${materiaAtual.inicio} - ${materiaAtual.fim}`}
              </p>
              
              <hr />
              
              <h3>Proxima</h3>
              <p id="materiaProximaInicio">
                {proximaMateria ? proximaMateria.materia?.nome || proximaMateria.materia : 'Nenhuma matéria agendada'}
              </p>
              <p id="horarioProximaInicio">
                {proximaMateria && `${proximaMateria.inicio} - ${proximaMateria.fim}`}
              </p>
            </div>

            {/* DICAS DE AMBIENTE */}
            <div className="col-12 mt-3">
              <div 
                className="card card-dicas p-3 text-center"
                onClick={abrirModalAmbiente}
                style={{ 
                  cursor: 'pointer', 
                  transition: '0.2s', 
                  border: '2px dashed var(--cor-primaria)', 
                  background: '#fefefe' 
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.15)';
                  e.currentTarget.style.background = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
                  e.currentTarget.style.background = '#fefefe';
                }}
              >
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
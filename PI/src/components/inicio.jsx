import React, { useState, useEffect } from 'react';
import './Inicio.css';

const Inicio = () => {
  const [tarefas, setTarefas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [cronograma, setCronograma] = useState([]);
  const [materiaAtual, setMateriaAtual] = useState(null);
  const [proximaMateria, setProximaMateria] = useState(null);

  // Carregar dados do localStorage
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    // TAREFAS - lê e corrige o formato automaticamente
    const tarefasSalvas = localStorage.getItem('tarefas');
    console.log("Tarefas salvas no localStorage:", tarefasSalvas);
    
    if (tarefasSalvas) {
      try {
        let tarefasParseadas = JSON.parse(tarefasSalvas);
        console.log("Tarefas parseadas:", tarefasParseadas);
        
        // Converter para o formato correto, garantindo que tenha ID
        const tarefasComId = tarefasParseadas.map((tarefa, index) => {
          // Se já tem ID, usa; se não, cria um
          const id = tarefa.id || tarefa._id || Date.now() + index + Math.random();
          
          // Pega o texto (pode estar em diferentes campos)
          let texto = tarefa.texto || tarefa.titulo || tarefa.nome || "Sem título";
          
          // Se o texto veio no formato "ppp - 2026-06-09 - prioridade alta"
          // extrai só a primeira parte como nome
          if (texto.includes(" - ")) {
            texto = texto.split(" - ")[0];
          }
          
          return {
            id: id,
            texto: texto,
            concluida: tarefa.concluida || false,
            prioridade: tarefa.prioridade || "normal",
            data: tarefa.data || null,
            textoOriginal: tarefa.texto || tarefa.titulo // guarda original se precisar
          };
        });
        
        setTarefas(tarefasComId);
        console.log("Tarefas processadas:", tarefasComId);
      } catch(e) {
        console.error("Erro ao ler tarefas:", e);
        setTarefas([]);
      }
    } else {
      // Dados de exemplo se não tiver nada
      setTarefas([
        { id: 1, texto: "Revisar matemática", concluida: false },
        { id: 2, texto: "Fazer exercícios", concluida: false },
      ]);
    }

    // EVENTOS
    const eventosSalvos = localStorage.getItem('eventos');
    if (eventosSalvos) {
      setEventos(JSON.parse(eventosSalvos));
    }

    // CRONOGRAMA
    const cronogramaSalvo = localStorage.getItem('cronograma');
    if (cronogramaSalvo) {
      setCronograma(JSON.parse(cronogramaSalvo));
    }
  };

  // Alternar tarefa - NUNCA faz sumir
  const alternarTarefa = (id) => {
    console.log("Alternando tarefa ID:", id);
    
    const novasTarefas = tarefas.map(tarefa => {
      if (tarefa.id === id) {
        return { ...tarefa, concluida: !tarefa.concluida };
      }
      return tarefa;
    });
    
    setTarefas(novasTarefas);
    localStorage.setItem('tarefas', JSON.stringify(novasTarefas));
    console.log("Novas tarefas:", novasTarefas);
  };

  // Calcular matéria atual
  useEffect(() => {
    const hoje = new Date().toISOString().split('T')[0];
    const agora = new Date();
    const horaAtual = agora.getHours();
    const minutoAtual = agora.getMinutes();
    const tempoAtual = horaAtual + minutoAtual / 60;

    const materiasHoje = cronograma
      .filter(item => item.data === hoje)
      .sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));

    let atual = null;
    let proxima = null;

    for (let i = 0; i < materiasHoje.length; i++) {
      if (materiasHoje[i].horarioInicio && materiasHoje[i].horarioFim) {
        const [hInicio, mInicio] = materiasHoje[i].horarioInicio.split(':').map(Number);
        const [hFim, mFim] = materiasHoje[i].horarioFim.split(':').map(Number);
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
      const hoje = new Date().toISOString().split('T')[0];
      const agora = new Date();
      const horaAtual = agora.getHours();
      const minutoAtual = agora.getMinutes();
      const tempoAtual = horaAtual + minutoAtual / 60;

      const materiasHoje = cronograma
        .filter(item => item.data === hoje)
        .sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));

      let atual = null;
      let proxima = null;

      for (let i = 0; i < materiasHoje.length; i++) {
        if (materiasHoje[i].horarioInicio && materiasHoje[i].horarioFim) {
          const [hInicio, mInicio] = materiasHoje[i].horarioInicio.split(':').map(Number);
          const [hFim, mFim] = materiasHoje[i].horarioFim.split(':').map(Number);
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

  // Mostrar TODAS as tarefas (as concluídas ficam riscadas, mas não somem)
  const eventosFuturos = eventos.filter(e => new Date(e.data) >= new Date()).slice(0, 3);
  const hoje = new Date().toISOString().split('T')[0];
  const materiasHoje = cronograma.filter(item => item.data === hoje);

  return (
    <section id="inicioSection">
      <h1 style={{ marginBottom: '20px' }}>Início</h1>
      
      
      <div className="dashboard-grid">
        <div className="row">
          {/* TAREFAS - TODAS aparecem, as concluídas ficam riscadas */}
          <div className="col-12 col-md-4 mb-3">
            <div className="card p-3">
              <h5><i className="bi bi-card-checklist mx-2"></i> Tarefas</h5>
              <ul>
                {tarefas.length === 0 ? (
                  <li style={{ color: '#6c757d' }}> Nenhuma tarefa encontrada</li>
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
                        {tarefa.data && `  ${tarefa.data}`}
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
                  <li> Nenhum evento próximo</li>
                ) : (
                  eventosFuturos.map((evento, idx) => (
                    <li key={idx}>
                      📌 {evento.titulo} - {evento.data}
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
                  <li>g Nenhuma matéria agendada para hoje</li>
                ) : (
                  materiasHoje.map((m, idx) => (
                    <li key={idx}>
                      {m.materia} - {m.horarioInicio} às {m.horarioFim}
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
                {materiaAtual ? materiaAtual.materia : 'Descanso'}
              </p>
              <p id="horarioAgoraInicio">
                {materiaAtual && `${materiaAtual.horarioInicio} - ${materiaAtual.horarioFim}`}
              </p>
              
              <hr />
              
              <h3>➡ Próxima</h3>
              <p id="materiaProximaInicio">
                {proximaMateria ? proximaMateria.materia : 'Nenhuma matéria agendada'}
              </p>
              <p id="horarioProximaInicio">
                {proximaMateria && `${proximaMateria.horarioInicio} - ${proximaMateria.horarioFim}`}
              </p>
            </div>

            {/* DICAS */}
            <div className="col-12 mt-3">
              <div className="card p-3 text-center" onClick={() => alert("Dicas de ambiente")}>
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
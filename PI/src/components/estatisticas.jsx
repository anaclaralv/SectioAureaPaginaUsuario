import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import Swal from 'sweetalert2';
import './estatisticas.css';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function Estatisticas() {
  const [materias, setMaterias] = useState([]);
  const [tempoEstudo, setTempoEstudo] = useState({});
  const [metas, setMetas] = useState({ diaria: 0.5, semanal: 3.5, mensal: 14 });
  const [periodoAtual, setPeriodoAtual] = useState('semana');
  const [dadosGrafico, setDadosGrafico] = useState({ labels: [], dados: [] });
  const [dadosMaterias, setDadosMaterias] = useState({ labels: [], dados: [], cores: [] });
  const [totais, setTotais] = useState({ totalHoras: 0, dias: 0, maiorStreak: 0, mediaDiaria: 0 });
  const [metasAtuais, setMetasAtuais] = useState({
    diaria: { atual: 0, meta: 0, progresso: 0 },
    semanal: { atual: 0, meta: 0, progresso: 0 },
    mensal: { atual: 0, meta: 0, progresso: 0 }
  });
  const [conquistas, setConquistas] = useState({ desbloqueadas: [], bloqueadas: [] });
  const [sugestoes, setSugestoes] = useState([]);
  
  const graficoMateriasRef = useRef();

  // Carregar dados do localStorage
 useEffect(() => {
  const plano = localStorage.getItem('planoUsuario') || 'gratuito';
  
  if (plano === 'gratuito') {
    Swal.fire({
      icon: 'info',
      title: 'Recurso Premium',
      html: 'As Estatísticas estão disponíveis nos planos <strong>Básico</strong> e <strong>Pro</strong>.',
      confirmButtonText: 'Ver Planos',
      confirmButtonColor: '#9f042c',
      showCancelButton: true,
      cancelButtonText: 'Fechar'
    }).then(result => {
      if (result.isConfirmed) {
        window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'planos' }));
      }
    });
    return; // Não carrega os dados
  }
    const materiasSalvas = localStorage.getItem('materias');
    if (materiasSalvas) {
      setMaterias(JSON.parse(materiasSalvas));
    }

    const tempoSalvo = localStorage.getItem('tempoEstudo');
    if (tempoSalvo) {
      setTempoEstudo(JSON.parse(tempoSalvo));
    }

    const metasSalvas = localStorage.getItem('metas');
    if (metasSalvas) {
      setMetas(JSON.parse(metasSalvas));
    }
  }, []);

  // Função para formatar meta
  const formatarMeta = (horasDecimais) => {
    const h = Math.floor(horasDecimais);
    const m = Math.round((horasDecimais - h) * 60);
    if (h === 0 && m === 0) return '0min';
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  };

  // Calcular totais
  const calcularTotais = useCallback(() => {
    let totalSegundos = 0;
    const diasEstudados = new Set();

    Object.values(tempoEstudo).forEach(materia => {
      if (typeof materia === 'number') {
        totalSegundos += materia;
        diasEstudados.add(new Date().toISOString().split('T')[0]);
      } else if (materia && materia.historico) {
        Object.entries(materia.historico).forEach(([data, segundos]) => {
          if (segundos > 0) {
            totalSegundos += segundos;
            diasEstudados.add(data);
          }
        });
      } else if (materia && materia.total) {
        totalSegundos += materia.total;
      }
    });

    const totalHoras = totalSegundos / 3600;
    const dias = diasEstudados.size;
    const maiorStreak = parseInt(localStorage.getItem('streak')) || 0;
    const mediaDiaria = dias > 0 ? totalHoras / dias : 0;

    setTotais({ totalHoras, dias, maiorStreak, mediaDiaria });
    return { totalHoras, dias, maiorStreak, mediaDiaria };
  }, [tempoEstudo]);

  // Calcular horas por matéria
  const calcularHorasPorMateria = useCallback(() => {
    const materiasEstudo = [];
    const cores = [
      '#9f042c', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
      '#ffeaa7', '#dfe6e9', '#6c5ce7', '#a29bfe', '#fd79a8',
      '#00b894', '#fdcb6e', '#e17055', '#74b9ff', '#55efc4'
    ];

    materias.forEach((m, index) => {
      const dados = tempoEstudo[m.id];
      let totalSegundos = 0;

      if (dados) {
        if (typeof dados === 'number') {
          totalSegundos = dados;
        } else if (dados.total) {
          totalSegundos = dados.total;
        }
      }
      
      if (totalSegundos > 0) {
        materiasEstudo.push({
          nome: m.nome,
          horas: totalSegundos / 3600,
          cor: m.cor || cores[index % cores.length]
        });
      }
    });

    const ordenadas = materiasEstudo.sort((a, b) => b.horas - a.horas);
    const totalHoras = ordenadas.reduce((sum, m) => sum + m.horas, 0);

    setDadosMaterias({
      labels: ordenadas.map(m => m.nome),
      dados: ordenadas.map(m => m.horas),
      cores: ordenadas.map(m => m.cor),
      total: totalHoras
    });
  }, [materias, tempoEstudo]);

  // Dados por dia da semana
  const getDadosPorDiaSemana = useCallback(() => {
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const horasPorDia = [0, 0, 0, 0, 0, 0, 0];

    Object.values(tempoEstudo).forEach(materia => {
      if (materia && materia.historico) {
        Object.entries(materia.historico).forEach(([dataStr, segundos]) => {
          if (segundos > 0) {
            const data = new Date(dataStr + 'T12:00:00');
            if (!isNaN(data.getTime())) {
              const diaSemana = data.getDay();
              horasPorDia[diaSemana] += segundos / 3600;
            }
          }
        });
      }
    });

    return { labels: diasSemana, dados: horasPorDia };
  }, [tempoEstudo]);

  // Dados de estudo de hoje
  const getDadosEstudoHoje = useCallback(() => {
    const hoje = new Date().toISOString().split('T')[0];
    const dadosPorMateria = [];

    materias.forEach(m => {
      const dados = tempoEstudo[m.id];
      let segundos = 0;
      if (dados && dados.historico && dados.historico[hoje]) {
        segundos = dados.historico[hoje];
      }
      if (segundos > 0) {
        dadosPorMateria.push({ nome: m.nome, horas: segundos / 3600 });
      }
    });

    if (dadosPorMateria.length === 0) {
      return { labels: ['Sem estudo hoje'], dados: [0] };
    }

    return {
      labels: dadosPorMateria.map(d => d.nome),
      dados: dadosPorMateria.map(d => d.horas)
    };
  }, [materias, tempoEstudo]);

  // Dados de estudo semanal
  const getDadosEstudoSemanal = useCallback(() => {
    const hoje = new Date();
    const labels = [];
    const dados = [];

    for (let i = 6; i >= 0; i--) {
      const data = new Date();
      data.setDate(hoje.getDate() - i);
      const dataStr = data.toISOString().split('T')[0];
      const diaNome = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][data.getDay()];
      labels.push(`${diaNome} ${data.getDate()}/${data.getMonth() + 1}`);
      
      let total = 0;
      Object.values(tempoEstudo).forEach(materia => {
        if (materia && materia.historico && materia.historico[dataStr]) {
          total += materia.historico[dataStr];
        }
      });
      dados.push(total / 3600);
    }

    return { labels, dados };
  }, [tempoEstudo]);

  // Dados de estudo mensal
  const getDadosEstudoMensal = useCallback(() => {
    const hoje = new Date();
    const labels = [];
    const dados = [];

    for (let i = 29; i >= 0; i--) {
      const data = new Date();
      data.setDate(hoje.getDate() - i);
      const dataStr = data.toISOString().split('T')[0];
      labels.push(`${data.getDate()}/${data.getMonth() + 1}`);
      
      let total = 0;
      Object.values(tempoEstudo).forEach(materia => {
        if (materia && materia.historico && materia.historico[dataStr]) {
          total += materia.historico[dataStr];
        }
      });
      dados.push(total / 3600);
    }

    return { labels, dados };
  }, [tempoEstudo]);

  // Atualizar gráfico principal
  const atualizarGraficoPrincipal = useCallback(() => {
    let dados;
    switch (periodoAtual) {
      case 'semana':
        dados = getDadosPorDiaSemana();
        break;
      case 'hoje':
        dados = getDadosEstudoHoje();
        break;
      case 'semanal':
        dados = getDadosEstudoSemanal();
        break;
      case 'mensal':
        dados = getDadosEstudoMensal();
        break;
      default:
        dados = getDadosPorDiaSemana();
    }
    setDadosGrafico(dados);
  }, [periodoAtual, getDadosPorDiaSemana, getDadosEstudoHoje, getDadosEstudoSemanal, getDadosEstudoMensal]);

  // Atualizar metas
  const atualizarMetas = useCallback(() => {
    const hoje = new Date().toISOString().split('T')[0];
    let totalHoje = 0;
    let totalSemana = 0;
    let totalMes = 0;

    Object.values(tempoEstudo).forEach(materia => {
      if (materia && materia.historico) {
        Object.entries(materia.historico).forEach(([dataStr, segundos]) => {
          const horas = segundos / 3600;
          if (dataStr === hoje) totalHoje += horas;
          
          const data = new Date(dataStr);
          const hojeRef = new Date();
          const diffDias = Math.floor((hojeRef - data) / (1000 * 60 * 60 * 24));
          
          if (diffDias <= 7) totalSemana += horas;
          if (diffDias <= 30) totalMes += horas;
        });
      }
    });

    setMetasAtuais({
      diaria: { atual: totalHoje, meta: metas.diaria, progresso: (totalHoje / metas.diaria) * 100 },
      semanal: { atual: totalSemana, meta: metas.semanal, progresso: (totalSemana / metas.semanal) * 100 },
      mensal: { atual: totalMes, meta: metas.mensal, progresso: (totalMes / metas.mensal) * 100 }
    });
  }, [tempoEstudo, metas]);

  // Atualizar conquistas
  const atualizarConquistas = useCallback(() => {
    const { totalHoras } = totais;
    const streak = parseInt(localStorage.getItem('streak')) || 0;
    const qtdMaterias = materias.length;

    const todasConquistas = [
      { id: 'primeiro-estudo', nome: 'Primeiro Estudo', icone: 'bi-star-fill', condicao: totalHoras > 0, cor: '#f59e0b' },
      { id: '7-dias', nome: '7 Dias Seguidos', icone: 'bi-fire', condicao: streak >= 7, cor: '#ef4444' },
      { id: '30-dias', nome: '30 Dias Seguidos', icone: 'bi-trophy-fill', condicao: streak >= 30, cor: '#f59e0b' },
      { id: '10-horas', nome: '10 Horas Totais', icone: 'bi-hourglass-split', condicao: totalHoras >= 10, cor: '#3b82f6' },
      { id: '50-horas', nome: '50 Horas Totais', icone: 'bi-lightning-charge-fill', condicao: totalHoras >= 50, cor: '#8b5cf6' },
      { id: '100-horas', nome: '100 Horas Totais', icone: 'bi-rocket-takeoff-fill', condicao: totalHoras >= 100, cor: '#ec4899' },
      { id: '5-materias', nome: '5 Matérias', icone: 'bi-book-fill', condicao: qtdMaterias >= 5, cor: '#10b981' },
      { id: '10-materias', nome: '10 Matérias', icone: 'bi-journal-bookmark-fill', condicao: qtdMaterias >= 10, cor: '#06b6d4' }
    ];

    setConquistas({
      desbloqueadas: todasConquistas.filter(c => c.condicao),
      bloqueadas: todasConquistas.filter(c => !c.condicao)
    });
  }, [totais, materias]);

  // Gerar sugestões
  const gerarSugestoes = useCallback(() => {
    const { totalHoras, dias, mediaDiaria } = totais;
    const streak = parseInt(localStorage.getItem('streak')) || 0;
    const materiasTop = dadosMaterias.labels.map((label, i) => ({ nome: label, horas: dadosMaterias.dados[i] }));
    const sugestoesLista = [];

    if (totalHoras === 0) {
      sugestoesLista.push('Comece seus estudos! Vá para o Relógio e clique em ▶ ao lado de uma matéria.');
      sugestoesLista.push('Monte seu cronograma semanal para organizar os estudos.');
    } else {
      if (streak === 0 && totalHoras > 0) {
        sugestoesLista.push('Estude hoje para começar um streak de dias consecutivos!');
      }
      if (streak > 0 && streak < 7) {
        const faltam = 7 - streak;
        sugestoesLista.push(`Você está com ${streak} dia(s) de streak! Faltam ${faltam} para a conquista "7 Dias"!`);
      } else if (streak >= 7 && streak < 30) {
        const faltam = 30 - streak;
        sugestoesLista.push(`Streak de ${streak} dias! Continue para alcançar 30 dias!`);
      }
      if (materiasTop.length > 0) {
        const maisEstudada = materiasTop[0];
        sugestoesLista.push(`Sua matéria mais estudada é "${maisEstudada.nome}" com ${maisEstudada.horas.toFixed(1)}h.`);
        if (materiasTop.length > 1) {
          const menosEstudada = materiasTop[materiasTop.length - 1];
          sugestoesLista.push(`Que tal dar mais atenção para "${menosEstudada.nome}"?`);
        }
      }
      if (dias > 0) {
        if (mediaDiaria < 0.5) {
          sugestoesLista.push(`Sua média é de ${mediaDiaria.toFixed(1)}h/dia. Tente aumentar para 1h por dia!`);
        } else if (mediaDiaria >= 2) {
          sugestoesLista.push(`Excelente! Sua média de ${mediaDiaria.toFixed(1)}h/dia está ótima!`);
        }
      }
    }

    if (sugestoesLista.length === 0) {
      sugestoesLista.push('Continue com o ótimo trabalho! Consistência é a chave!');
    }

    setSugestoes(sugestoesLista);
  }, [totais, dadosMaterias]);

  // Exportar dados
  const exportarDados = () => {
    try {
      const dados = {
        versao: '1.0',
        dataExportacao: new Date().toISOString(),
        tarefas: JSON.parse(localStorage.getItem('tarefas')) || [],
        notas: JSON.parse(localStorage.getItem('notas')) || [],
        tempoEstudo: tempoEstudo,
        metas: metas,
        cronograma: JSON.parse(localStorage.getItem('cronogramaNovo')) || [],
        streak: parseInt(localStorage.getItem('streak')) || 0,
        ultimoDiaEstudo: localStorage.getItem('ultimoDiaEstudo') || ''
      };

      const dataStr = JSON.stringify(dados, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sectio_aurea_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'Exportado!',
        text: 'Backup salvo com sucesso!',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      Swal.fire({ icon: 'error', title: 'Erro!', text: 'Não foi possível exportar os dados.' });
    }
  };

  // Opções do gráfico de barras
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 } } },
      tooltip: { callbacks: { label: (context) => `${context.raw.toFixed(2)} horas` } }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Horas' }, ticks: { callback: (value) => `${value.toFixed(1)}h` } }
    }
  };

  // Opções do gráfico de rosca
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 11 } } },
      tooltip: { callbacks: { label: (context) => `${context.raw.toFixed(2)} horas (${((context.raw / dadosMaterias.total) * 100).toFixed(1)}%)` } }
    }
  };

  // Atualizar tudo ao carregar
  useEffect(() => {
    calcularTotais();
    calcularHorasPorMateria();
  }, [calcularTotais, calcularHorasPorMateria]);

  useEffect(() => {
    atualizarGraficoPrincipal();
  }, [atualizarGraficoPrincipal]);

  useEffect(() => {
    atualizarMetas();
  }, [atualizarMetas]);

  useEffect(() => {
    atualizarConquistas();
    gerarSugestoes();
  }, [atualizarConquistas, gerarSugestoes]);

  // Configurar título do gráfico
  const getGraficoTitulo = () => {
    switch (periodoAtual) {
      case 'semana': return 'Estudos por Dia da Semana';
      case 'hoje': return 'Estudo de Hoje (por matéria)';
      case 'semanal': return 'Estudo Semanal (últimos 7 dias)';
      case 'mensal': return 'Estudo Mensal (últimos 30 dias)';
      default: return 'Estudos por Dia da Semana';
    }
  };

  return (
    <section id="estatisticaSection">
      <h1>Estatísticas</h1>

      {/* Cards de Resumo Rápido */}
      <div className="stats-cards">
        <div className="stat-card">
          <i className="bi bi-clock-history"></i>
          <span>Total Geral</span>
          <strong>{totais.totalHoras.toFixed(1)}h</strong>
        </div>
        <div className="stat-card">
          <i className="bi bi-calendar-check"></i>
          <span>Dias Estudados</span>
          <strong>{totais.dias}</strong>
        </div>
        <div className="stat-card">
          <i className="bi bi-fire"></i>
          <span>Maior Streak</span>
          <strong>{totais.maiorStreak}</strong>
        </div>
        <div className="stat-card">
          <i className="bi bi-graph-up"></i>
          <span>Média Diária</span>
          <strong>{totais.mediaDiaria.toFixed(1)}h</strong>
        </div>
      </div>

      {/* Seletor de Período */}
      <div className="periodo-selector">
        <button className={`periodo-btn ${periodoAtual === 'semana' ? 'active' : ''}`} onClick={() => setPeriodoAtual('semana')}>Por Dia da Semana</button>
        <button className={`periodo-btn ${periodoAtual === 'hoje' ? 'active' : ''}`} onClick={() => setPeriodoAtual('hoje')}>Estudo de Hoje</button>
        <button className={`periodo-btn ${periodoAtual === 'semanal' ? 'active' : ''}`} onClick={() => setPeriodoAtual('semanal')}>Estudo Semanal</button>
        <button className={`periodo-btn ${periodoAtual === 'mensal' ? 'active' : ''}`} onClick={() => setPeriodoAtual('mensal')}>Estudo Mensal</button>
      </div>

      {/* Gráficos Lado a Lado */}
      <div className="graficos-lado-a-lado">
        <div className="grafico-card">
          <h4>{getGraficoTitulo()}</h4>
          <div style={{ height: '300px' }}>
            <Bar data={{ labels: dadosGrafico.labels, datasets: [{ label: 'Horas Estudadas', data: dadosGrafico.dados, backgroundColor: '#9f042c', borderRadius: 8 }] }} options={barOptions} />
          </div>
        </div>
        <div className="grafico-card">
          <h4>Top Matérias</h4>
          <div style={{ height: '300px' }}>
            {dadosMaterias.dados.length > 0 && dadosMaterias.dados.some(v => v > 0) ? (
              <Doughnut
                ref={graficoMateriasRef}
                data={{ labels: dadosMaterias.labels, datasets: [{ data: dadosMaterias.dados, backgroundColor: dadosMaterias.cores, borderColor: '#ffffff', borderWidth: 3 }] }}
                options={doughnutOptions}
              />
            ) : (
               <p style={{ textAlign: 'center', padding: '50px', color: '#9ca3af' }}>Nenhum dado de estudo registrado</p>
)}
          </div>
        </div>
      </div>

      {/* Metas */}
      <div className="metas-container">
        <h4>Minhas Metas</h4>
        <div className="meta-item">
          <div className="meta-header"><span>Meta Diária</span><span>{formatarMeta(metas.diaria)}</span></div>
          <div className="meta-progresso-container"><div className={`meta-barra ${metasAtuais.diaria.progresso >= 100 ? 'alta' : metasAtuais.diaria.progresso >= 50 ? 'media' : 'baixa'}`} style={{ width: `${Math.min(metasAtuais.diaria.progresso, 100)}%` }}></div></div>
          <p className="meta-restante">{metasAtuais.diaria.atual.toFixed(1)}h de {formatarMeta(metas.diaria)} {metasAtuais.diaria.progresso >= 100 && '✅ Concluído!'}</p>
        </div>
        <div className="meta-item">
          <div className="meta-header"><span>Meta Semanal</span><span>{formatarMeta(metas.semanal)}</span></div>
          <div className="meta-progresso-container"><div className={`meta-barra ${metasAtuais.semanal.progresso >= 100 ? 'alta' : metasAtuais.semanal.progresso >= 50 ? 'media' : 'baixa'}`} style={{ width: `${Math.min(metasAtuais.semanal.progresso, 100)}%` }}></div></div>
          <p className="meta-restante">{metasAtuais.semanal.atual.toFixed(1)}h de {formatarMeta(metas.semanal)} {metasAtuais.semanal.progresso >= 100 && '✅ Concluído!'}</p>
        </div>
        <div className="meta-item">
          <div className="meta-header"><span>Meta Mensal</span><span>{formatarMeta(metas.mensal)}</span></div>
          <div className="meta-progresso-container"><div className={`meta-barra ${metasAtuais.mensal.progresso >= 100 ? 'alta' : metasAtuais.mensal.progresso >= 50 ? 'media' : 'baixa'}`} style={{ width: `${Math.min(metasAtuais.mensal.progresso, 100)}%` }}></div></div>
          <p className="meta-restante">{metasAtuais.mensal.atual.toFixed(1)}h de {formatarMeta(metas.mensal)} {metasAtuais.mensal.progresso >= 100 && '✅ Concluído!'}</p>
        </div>
      </div>

      {/* Conquistas */}
      <div className="conquistas-container">
        <h4>🏆 Conquistas</h4>
        <div className="conquistas-grupo">
          <h5>✅ Desbloqueadas</h5>
          <div className="badges-container">
            {conquistas.desbloqueadas.length > 0 ? conquistas.desbloqueadas.map(c => (
              <div key={c.id} className="badge desbloqueado" style={{ borderColor: c.cor, color: c.cor }}><i className={`bi ${c.icone}`}></i> {c.nome}</div>
            )) : <p className="text-muted">Nenhuma conquista ainda. Continue estudando!</p>}
          </div>
        </div>
        <div className="conquistas-grupo">
          <h5>🔒 A Desbloquear</h5>
          <div className="badges-container">
            {conquistas.bloqueadas.map(c => (
              <div key={c.id} className="badge"><i className="bi bi-lock-fill"></i> {c.nome}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Sugestões */}
      <div className="sugestoes-container">
        <h4>Sugestões Personalizadas</h4>
        <ul>
          {sugestoes.map((s, i) => <li key={i}><i className="bi bi-lightbulb"></i> {s}</li>)}
        </ul>
      </div>

      {/* Resumo Estatísticas */}
      <div className="resumo-container">
        <h4 id="resumoEstatisticas">
          {totais.totalHoras > 0 ? (
            <>
              <strong>{totais.totalHoras.toFixed(1)} horas</strong> estudadas no total<br />
              <strong>{totais.dias} dias</strong> de estudo registrados<br />
              Média de <strong>{totais.mediaDiaria.toFixed(1)}h/dia</strong>
            </>
          ) : 'Nenhum estudo registrado ainda. Comece agora!'}
        </h4>
      </div>

      {/* Botão Exportar */}
      <div className="exportar-container">
        <button className="btn-exportar" onClick={exportarDados}>
          <i className="bi bi-download"></i> Exportar Relatório (JSON)
        </button>
      </div>
    </section>
  );
}
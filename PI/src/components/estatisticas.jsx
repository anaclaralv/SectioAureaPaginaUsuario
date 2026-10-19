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
import { apiFetch } from '../api';
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
  const [sessoes, setSessoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [metas, setMetas] = useState({ diaria: 0.5, semanal: 3.5, mensal: 14 });
  const [periodoAtual, setPeriodoAtual] = useState('semana');
  const [dadosGrafico, setDadosGrafico] = useState({ labels: [], dados: [] });
  const [dadosMaterias, setDadosMaterias] = useState({ labels: [], dados: [], cores: [], total: 0 });
  const [totais, setTotais] = useState({ totalHoras: 0, dias: 0, maiorStreak: 0, mediaDiaria: 0 });
  const [metasAtuais, setMetasAtuais] = useState({
    diaria: { atual: 0, meta: 0, progresso: 0 },
    semanal: { atual: 0, meta: 0, progresso: 0 },
    mensal: { atual: 0, meta: 0, progresso: 0 }
  });
  const [conquistas, setConquistas] = useState({ desbloqueadas: [], bloqueadas: [] });
  const [sugestoes, setSugestoes] = useState([]);
  
  const graficoMateriasRef = useRef();

  // Função auxiliar para converter "HH:MM:SS" em segundos
  const converterParaSegundos = (tempoStr) => {
    if (!tempoStr) return 0;
    const partes = tempoStr.split(':').map(Number);
    if (partes.length === 3) {
      return (partes[0] || 0) * 3600 + (partes[1] || 0) * 60 + (partes[2] || 0);
    }
    if (partes.length === 2) {
      return (partes[0] || 0) * 60 + (partes[1] || 0);
    }
    return 0;
  };

  // Carregar dados reais da API
  const carregarDadosAPI = useCallback(async () => {
    const plano = (localStorage.getItem('planoUsuario') || 'gratuito').toLowerCase().trim();
    if (plano === 'gratuito') {
      Swal.fire({
        icon: 'info',
        title: 'Recurso Premium',
        html: 'As Estatísticas estão disponíveis nos planos <strong>Básico</strong> e <strong>Pro</strong>.',
        confirmButtonText: 'Ver Planos',
        confirmButtonColor: '#9f042c',
        showCancelButton: true,
        cancelButtonText: 'Fechar'
      }).then((result) => {
        if (result.isConfirmed) {
          window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'planos' }));
        }
      });
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      const metasSalvas = localStorage.getItem('metas');
      if (metasSalvas) {
        try {
          setMetas(JSON.parse(metasSalvas));
        } catch (e) {}
      }

      const [resMaterias, resSessoes] = await Promise.all([
        apiFetch('materias').catch(() => null),
        apiFetch('cronometros').catch(() => null)
      ]);

      if (resMaterias && resMaterias.ok) {
        const dataMats = await resMaterias.json().catch(() => []);
        setMaterias(Array.isArray(dataMats) ? dataMats : []);
      }

      if (resSessoes && resSessoes.ok) {
        const dataSess = await resSessoes.json().catch(() => []);
        setSessoes(Array.isArray(dataSess) ? dataSess : []);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDadosAPI();
  }, [carregarDadosAPI]);

  // Função para formatar meta
  const formatarMeta = (horasDecimais) => {
    const h = Math.floor(horasDecimais);
    const m = Math.round((horasDecimais - h) * 60);
    if (h === 0 && m === 0) return '0min';
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  };

  // Calcular totais e streak
  const calcularTotais = useCallback(() => {
    let totalSegundos = 0;
    const diasEstudados = new Set();

    sessoes.forEach((sessao) => {
      const segs = converterParaSegundos(sessao.tempo_cronometro);
      if (segs > 0) {
        totalSegundos += segs;
        if (sessao.created_at) {
          diasEstudados.add(sessao.created_at.split(' ')[0]);
        }
      }
    });

    const totalHoras = totalSegundos / 3600;
    const dias = diasEstudados.size;

    // Calcular maior streak de dias consecutivos
    const datas = Array.from(diasEstudados).sort();
    let maxStreak = datas.length > 0 ? 1 : 0;
    let streakCorrente = datas.length > 0 ? 1 : 0;

    for (let i = 1; i < datas.length; i++) {
      const prev = new Date(datas[i - 1] + 'T00:00:00');
      const curr = new Date(datas[i] + 'T00:00:00');
      const diffDias = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diffDias === 1) {
        streakCorrente++;
        if (streakCorrente > maxStreak) maxStreak = streakCorrente;
      } else if (diffDias > 1) {
        streakCorrente = 1;
      }
    }

    const mediaDiaria = dias > 0 ? totalHoras / dias : 0;

    const res = { totalHoras, dias, maiorStreak: maxStreak, mediaDiaria };
    setTotais(res);
    return res;
  }, [sessoes]);

  // Calcular horas por matéria (Top Matérias / Gráfico de Rosca)
  const calcularHorasPorMateria = useCallback(() => {
    const agrupado = {};
    const coresPadrao = [
      '#9f042c', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
      '#ffeaa7', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894',
      '#fdcb6e', '#e17055', '#74b9ff', '#55efc4'
    ];

    sessoes.forEach((sessao) => {
      const segs = converterParaSegundos(sessao.tempo_cronometro);
      if (segs <= 0) return;

      const nome = sessao.nome_materia || (sessao.id_materia ? `Matéria #${sessao.id_materia}` : 'Pomodoro / Geral');
      const cor = sessao.cor_materia || (sessao.nome_materia ? '#9f042c' : '#6b7280');

      if (!agrupado[nome]) {
        agrupado[nome] = { nome, segundos: 0, cor };
      }
      agrupado[nome].segundos += segs;
    });

    const ordenadas = Object.values(agrupado)
      .map((m, idx) => ({
        nome: m.nome,
        horas: m.segundos / 3600,
        cor: m.cor || coresPadrao[idx % coresPadrao.length]
      }))
      .sort((a, b) => b.horas - a.horas);

    const totalHoras = ordenadas.reduce((sum, m) => sum + m.horas, 0);

    setDadosMaterias({
      labels: ordenadas.map((m) => m.nome),
      dados: ordenadas.map((m) => m.horas),
      cores: ordenadas.map((m) => m.cor),
      total: totalHoras
    });
  }, [sessoes]);

  // Dados por dia da semana
  const getDadosPorDiaSemana = useCallback(() => {
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const horasPorDia = [0, 0, 0, 0, 0, 0, 0];

    sessoes.forEach((s) => {
      if (!s.created_at) return;
      const segs = converterParaSegundos(s.tempo_cronometro);
      if (segs <= 0) return;
      const data = new Date(s.created_at.replace(' ', 'T'));
      if (!isNaN(data.getTime())) {
        horasPorDia[data.getDay()] += segs / 3600;
      }
    });

    return { labels: diasSemana, dados: horasPorDia };
  }, [sessoes]);

  // Dados de estudo de hoje
  const getDadosEstudoHoje = useCallback(() => {
    const hoje = new Date();
    const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    const agrupadoHoje = {};

    sessoes.forEach((s) => {
      if (!s.created_at) return;
      const dataSessao = s.created_at.split(' ')[0];
      if (dataSessao < hojeStr) return;
      const segs = converterParaSegundos(s.tempo_cronometro);
      if (segs <= 0) return;
      const rotulo = s.nome_materia || s.descricao || 'Pomodoro / Geral';
      agrupadoHoje[rotulo] = (agrupadoHoje[rotulo] || 0) + segs / 3600;
    });

    const labels = Object.keys(agrupadoHoje);
    const dados = Object.values(agrupadoHoje);

    if (labels.length === 0) {
      return { labels: ['Sem estudo hoje'], dados: [0] };
    }

    return { labels, dados };
  }, [sessoes]);

  // Dados de estudo semanal (últimos 7 dias)
  const getDadosEstudoSemanal = useCallback(() => {
    const hoje = new Date();
    const labels = [];
    const dados = [];
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(hoje.getDate() - i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      labels.push(`${diasSemana[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`);

      let totalDia = 0;
      sessoes.forEach((s) => {
        if (s.created_at && s.created_at.split(' ')[0] === dStr) {
          totalDia += converterParaSegundos(s.tempo_cronometro);
        }
      });
      dados.push(totalDia / 3600);
    }

    return { labels, dados };
  }, [sessoes]);

  // Dados de estudo mensal (últimos 30 dias)
  const getDadosEstudoMensal = useCallback(() => {
    const hoje = new Date();
    const labels = [];
    const dados = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(hoje.getDate() - i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      labels.push(`${d.getDate()}/${d.getMonth() + 1}`);

      let totalDia = 0;
      sessoes.forEach((s) => {
        if (s.created_at && s.created_at.split(' ')[0] === dStr) {
          totalDia += converterParaSegundos(s.tempo_cronometro);
        }
      });
      dados.push(totalDia / 3600);
    }

    return { labels, dados };
  }, [sessoes]);

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
    const hoje = new Date();
    const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

    const data7Dias = new Date();
    data7Dias.setDate(hoje.getDate() - 7);
    const str7Dias = `${data7Dias.getFullYear()}-${String(data7Dias.getMonth() + 1).padStart(2, '0')}-${String(data7Dias.getDate()).padStart(2, '0')}`;

    const data30Dias = new Date();
    data30Dias.setDate(hoje.getDate() - 30);
    const str30Dias = `${data30Dias.getFullYear()}-${String(data30Dias.getMonth() + 1).padStart(2, '0')}-${String(data30Dias.getDate()).padStart(2, '0')}`;

    let totalHoje = 0;
    let totalSemana = 0;
    let totalMes = 0;

    sessoes.forEach((s) => {
      if (!s.created_at) return;
      const dStr = s.created_at.split(' ')[0];
      const segs = converterParaSegundos(s.tempo_cronometro);
      if (segs <= 0) return;
      const horas = segs / 3600;

      if (dStr >= hojeStr) totalHoje += horas;
      if (dStr >= str7Dias) totalSemana += horas;
      if (dStr >= str30Dias) totalMes += horas;
    });

    setMetasAtuais({
      diaria: { atual: totalHoje, meta: metas.diaria, progresso: metas.diaria > 0 ? (totalHoje / metas.diaria) * 100 : 0 },
      semanal: { atual: totalSemana, meta: metas.semanal, progresso: metas.semanal > 0 ? (totalSemana / metas.semanal) * 100 : 0 },
      mensal: { atual: totalMes, meta: metas.mensal, progresso: metas.mensal > 0 ? (totalMes / metas.mensal) * 100 : 0 }
    });
  }, [sessoes, metas]);

  // Atualizar conquistas
  const atualizarConquistas = useCallback(() => {
    const { totalHoras, maiorStreak } = totais;
    const streak = maiorStreak || 0;
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
      desbloqueadas: todasConquistas.filter((c) => c.condicao),
      bloqueadas: todasConquistas.filter((c) => !c.condicao)
    });
  }, [totais, materias]);

  // Gerar sugestões
  const gerarSugestoes = useCallback(() => {
    const { totalHoras, dias, mediaDiaria, maiorStreak } = totais;
    const streak = maiorStreak || 0;
    const materiasTop = dadosMaterias.labels.map((label, i) => ({ nome: label, horas: dadosMaterias.dados[i] }));
    const sugestoesLista = [];

    if (totalHoras === 0) {
      sugestoesLista.push('Comece seus estudos! Vá para o Relógio e clique em ▶ ao lado de uma matéria ou inicie um Pomodoro.');
      sugestoesLista.push('Monte seu cronograma semanal para organizar os estudos.');
    } else {
      if (streak === 0 && totalHoras > 0) {
        sugestoesLista.push('Estude hoje para começar um streak de dias consecutivos!');
      }
      if (streak > 0 && streak < 7) {
        const faltam = 7 - streak;
        sugestoesLista.push(`Você está com ${streak} dia(s) de streak! Faltam ${faltam} para a conquista "7 Dias Seguidos"!`);
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
        versao: '2.0',
        dataExportacao: new Date().toISOString(),
        totais: totais,
        metas: metas,
        sessoesEstudo: sessoes,
        materias: materias,
        tarefas: JSON.parse(localStorage.getItem('tarefas')) || [],
        notas: JSON.parse(localStorage.getItem('notas')) || [],
        cronograma: JSON.parse(localStorage.getItem('cronogramaNovo')) || []
      };

      const dataStr = JSON.stringify(dados, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sectio_aurea_relatorio_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'Exportado!',
        text: 'Relatório salvo com sucesso!',
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

  const plano = (localStorage.getItem('planoUsuario') || 'gratuito').toLowerCase().trim();
  if (plano === 'gratuito') {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', maxWidth: '600px', margin: '40px auto', background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 18px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '2rem' }}>
          <i className="bi bi-lock-fill"></i>
        </div>
        <h2 style={{ fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Recurso Premium</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
          As <strong>Estatísticas e Métricas de Desempenho</strong> são exclusivas dos planos <strong>Básico</strong> e <strong>Pro</strong>. Acompanhe gráficos detalhados do seu rendimento e tempo de foco!
        </p>
        <button
          className="btn"
          style={{ background: '#9f042c', color: '#fff', fontWeight: 'bold', padding: '12px 24px', borderRadius: '10px' }}
          onClick={() => window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'planos' }))}
        >
          <i className="bi bi-star-fill me-2"></i> Conhecer Planos
        </button>
      </div>
    );
  }

  return (
    <section id="estatisticaSection">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ margin: 0 }}>Estatísticas</h1>
        <button
          onClick={carregarDadosAPI}
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px 14px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '600',
            color: '#374151',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
          title="Recarregar dados do banco de dados"
        >
          <i className="bi bi-arrow-clockwise"></i> Atualizar
        </button>
      </div>

      {carregando && (
        <div style={{ textAlign: 'center', padding: '10px', color: '#9f042c', fontSize: '0.9rem' }}>
          <span className="spinner-border spinner-border-sm" role="status" style={{ marginRight: '8px' }}></span>
          <span>Sincronizando com o banco de dados...</span>
        </div>
      )}

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
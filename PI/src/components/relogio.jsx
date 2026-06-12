import React, { useState, useEffect, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';
import './Relogio.css';

export default function Relogio() {
  // ==================== ESTADOS PRINCIPAIS ====================
  const [materias, setMaterias] = useState([]);
  const [tempoEstudo, setTempoEstudo] = useState({});
  const [estudoAtual, setEstudoAtual] = useState(null);
  const [modoEstudo, setModoEstudo] = useState('auto');
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true);
  const [cronograma, setCronograma] = useState([]);
  
  // ==================== TIMER ====================
  const [timerTempo, setTimerTempo] = useState(0);
  const [timerRodando, setTimerRodando] = useState(false);
  const timerIntervalRef = useRef(null);
  
  // ==================== CRONÔMETRO ====================
  const [cronometro, setCronometro] = useState(0);
  const [cronometroRodando, setCronometroRodando] = useState(false);
  const [historicoCronometro, setHistoricoCronometro] = useState([]);
  const [acordeonAberto, setAcordeonAberto] = useState(false);
  const cronometroIntervalRef = useRef(null);
  
  // ==================== POMODORO ====================
  const [pomodoroTempo, setPomodoroTempo] = useState(1500);
  const [pomodoroRodando, setPomodoroRodando] = useState(false);
  const [modoPomodoro, setModoPomodoro] = useState('foco');
  const [estudoIdPomodoro, setEstudoIdPomodoro] = useState(null);
  const pomodoroIntervalRef = useRef(null);
  
  // ==================== ESTUDO ====================
  const estudoIntervalRef = useRef(null);
  
  // ==================== METAS ====================
  const [metas, setMetas] = useState({
    diaria: 0.5,
    semanal: 3.5,
    mensal: 14
  });
  const [metaAtiva, setMetaAtiva] = useState('semanal');
  
  // ==================== REFS PARA MODAIS ====================
  const modalPomodoroRef = useRef(null);
  const modalFocoRef = useRef(null);
  const modalMetaRef = useRef(null);
  const modalInstancePomodoro = useRef(null);
  const modalInstanceFoco = useRef(null);
  const modalInstanceMeta = useRef(null);

  // ==================== FUNÇÕES AUXILIARES ====================
  const formatarTempo = (segundos) => {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatarTempoCurto = (segundos) => {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatarMeta = (horasDecimais) => {
    const h = Math.floor(horasDecimais);
    const m = Math.round((horasDecimais - h) * 60);
    if (h === 0 && m === 0) return '0min';
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  };

  const converterParaHoras = (horas, minutos) => {
    return (parseInt(horas) || 0) + ((parseInt(minutos) || 0) / 60);
  };

  // ==================== CARREGAR DADOS DO LOCALSTORAGE ====================
  useEffect(() => {
  const plano = localStorage.getItem('planoUsuario') || 'gratuito';
  if (plano === 'gratuito') {
    // Bloquear funcionalidades premium
  }
    // Carregar matérias
    const materiasSalvas = localStorage.getItem('materias');
    if (materiasSalvas) {
      setMaterias(JSON.parse(materiasSalvas));
    } else {
      const materiasPadrao = [
        { id: 'm1', nome: 'Matemática', cor: '#ef4444' },
        { id: 'm2', nome: 'Português', cor: '#3b82f6' },
        { id: 'm3', nome: 'História', cor: '#22c55e' }
      ];
      setMaterias(materiasPadrao);
      localStorage.setItem('materias', JSON.stringify(materiasPadrao));
    }

    // Carregar tempo de estudo
    const tempoSalvo = localStorage.getItem('tempoEstudo');
    if (tempoSalvo) {
      setTempoEstudo(JSON.parse(tempoSalvo));
    }

    // Carregar histórico do cronômetro
    const historicoSalvo = localStorage.getItem('historicoCronometro');
    if (historicoSalvo) {
      setHistoricoCronometro(JSON.parse(historicoSalvo));
    }

    // Carregar notificações
    const notifSalvas = localStorage.getItem('notificacoesAtivas');
    if (notifSalvas !== null) {
      setNotificacoesAtivas(notifSalvas === 'true');
    }

    // Carregar metas
    const metasSalvas = localStorage.getItem('metas');
    if (metasSalvas) {
      setMetas(JSON.parse(metasSalvas));
    }
    const metaAtivaSalva = localStorage.getItem('metaAtiva');
    if (metaAtivaSalva) {
      setMetaAtiva(metaAtivaSalva);
    }

    // Carregar cronograma
    const cronogramaSalvo = localStorage.getItem('cronogramaNovo');
    if (cronogramaSalvo) {
      setCronograma(JSON.parse(cronogramaSalvo));
    }
  }, []);

  // Salvar dados no localStorage
  useEffect(() => {
    localStorage.setItem('materias', JSON.stringify(materias));
  }, [materias]);

  useEffect(() => {
    localStorage.setItem('tempoEstudo', JSON.stringify(tempoEstudo));
  }, [tempoEstudo]);

  useEffect(() => {
    localStorage.setItem('historicoCronometro', JSON.stringify(historicoCronometro));
  }, [historicoCronometro]);

  useEffect(() => {
    localStorage.setItem('notificacoesAtivas', notificacoesAtivas);
  }, [notificacoesAtivas]);

  useEffect(() => {
    localStorage.setItem('metas', JSON.stringify(metas));
  }, [metas]);

  // ==================== TIMER ====================
  const iniciarTimer = () => {
    const minutosInput = document.getElementById('timerMinutos')?.value;
    const segundosInput = document.getElementById('timerSegundos')?.value;
    const minutos = parseInt(minutosInput) || 0;
    const segundos = parseInt(segundosInput) || 0;
    const total = (minutos * 60) + segundos;

    if (total <= 0) {
      Swal.fire({ icon: 'warning', title: 'Valor inválido!', text: 'Digite pelo menos 1 segundo!', timer: 2000, showConfirmButton: false });
      return;
    }

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerTempo(total);
    setTimerRodando(true);

    timerIntervalRef.current = setInterval(() => {
      setTimerTempo(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          setTimerRodando(false);
          Swal.fire({ icon: 'info', title: 'Tempo acabou!', timer: 2000, showConfirmButton: false });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pararTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerRodando(false);
  };

  const resetarTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerRodando(false);
    setTimerTempo(0);
    const minutosInput = document.getElementById('timerMinutos');
    const segundosInput = document.getElementById('timerSegundos');
    if (minutosInput) minutosInput.value = '';
    if (segundosInput) segundosInput.value = '';
  };

  // ==================== CRONÔMETRO ====================
  const iniciarCronometro = () => {
    if (cronometroRodando) return;
    if (cronometroIntervalRef.current) clearInterval(cronometroIntervalRef.current);
    setCronometroRodando(true);

    cronometroIntervalRef.current = setInterval(() => {
      setCronometro(prev => prev + 1);
    }, 1000);
  };

  const pausarCronometro = () => {
    if (!cronometroRodando) return;
    if (cronometroIntervalRef.current) clearInterval(cronometroIntervalRef.current);
    setCronometroRodando(false);

    if (cronometro > 0) {
      const agora = new Date();
      const registro = {
        id: Date.now(),
        tempo: cronometro,
        tempoFormatado: formatarTempo(cronometro),
        data: agora.toLocaleDateString('pt-BR'),
        hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setHistoricoCronometro(prev => [registro, ...prev].slice(0, 50));
    }
  };

  const resetarCronometro = () => {
    if (cronometroIntervalRef.current) clearInterval(cronometroIntervalRef.current);
    setCronometroRodando(false);
    setCronometro(0);
  };

  const limparHistoricoCronometro = () => {
    if (historicoCronometro.length === 0) {
      Swal.fire({ icon: 'info', title: 'Histórico vazio', timer: 1500, showConfirmButton: false });
      return;
    }
    Swal.fire({
      title: 'Limpar histórico?',
      text: `Tem certeza que deseja excluir todos os ${historicoCronometro.length} registros?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, limpar tudo!',
      confirmButtonColor: '#ef4444'
    }).then(result => {
      if (result.isConfirmed) {
        setHistoricoCronometro([]);
        Swal.fire({ icon: 'success', title: 'Histórico limpo!', timer: 1500, showConfirmButton: false });
      }
    });
  };

  const excluirRegistroCronometro = (id) => {
    setHistoricoCronometro(prev => prev.filter(r => r.id !== id));
  };

  // ==================== POMODORO ====================
  const iniciarPomodoroPadrao = () => {
    if (pomodoroRodando) {
      Swal.fire({ icon: 'warning', title: 'Já rodando!', text: 'Pause ou resete primeiro.', timer: 1500, showConfirmButton: false });
      return;
    }

    setModoPomodoro('foco');
    setPomodoroTempo(1500);
    setPomodoroRodando(true);

    if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
    pomodoroIntervalRef.current = setInterval(() => {
      setPomodoroTempo(prev => {
        if (prev <= 1) {
          clearInterval(pomodoroIntervalRef.current);
          setPomodoroRodando(false);

          if (modoPomodoro === 'foco') {
            Swal.fire({ icon: 'success', title: 'Foco concluído!', text: 'Hora da pausa!', timer: 2000, showConfirmButton: false });
            setModoPomodoro('pausa');
            setPomodoroTempo(300);
            setTimeout(() => iniciarPomodoroPadrao(), 100);
          } else {
            Swal.fire({ icon: 'info', title: 'Pausa concluída!', text: 'Hora de estudar!', timer: 2000, showConfirmButton: false });
            setModoPomodoro('foco');
            setPomodoroTempo(1500);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pausarPomodoro = () => {
    if (!pomodoroRodando) return;
    setPomodoroRodando(false);
    if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
  };

  const resetarPomodoro = () => {
    if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
    setPomodoroRodando(false);
    setModoPomodoro('foco');
    setPomodoroTempo(1500);
    setEstudoIdPomodoro(null);
  };

  const abrirModalPomodoro = () => {
  const plano = localStorage.getItem('planoUsuario') || 'gratuito';
  
  if (plano === 'gratuito') {
    Swal.fire({
      icon: 'info',
      title: 'Recurso Premium',
      html: 'O <strong>Pomodoro Personalizado</strong> está disponível nos planos <strong>Básico</strong> e <strong>Pro</strong>.',
      confirmButtonText: 'Ver Planos',
      confirmButtonColor: '#9f042c',
      showCancelButton: true,
      cancelButtonText: 'Fechar'
    }).then(result => {
      if (result.isConfirmed) {
        window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'planos' }));
      }
    });
    return;
  }
  
  modalInstancePomodoro.current?.show();
};

  const iniciarPomodoroPersonalizado = () => {
    const materiaId = document.getElementById('pomodoroMateria')?.value;
    const tempoEstudo = parseInt(document.getElementById('pomodoroTempoEstudo')?.value || 25);
    const tempoPausa = parseInt(document.getElementById('pomodoroTempoPausa')?.value || 5);

    if (!materiaId) {
      Swal.fire({ icon: 'warning', title: 'Selecione uma matéria!', timer: 1500, showConfirmButton: false });
      return;
    }

    resetarPomodoro();
    setModoPomodoro('foco');
    setPomodoroTempo(tempoEstudo * 60);
    setPomodoroRodando(true);
    setEstudoIdPomodoro(materiaId);
    iniciarEstudo(materiaId);

    modalInstancePomodoro.current?.hide();

    if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
    let tempoAtual = tempoEstudo * 60;
    let ciclo = 'foco';

    pomodoroIntervalRef.current = setInterval(() => {
      if (!pomodoroRodando) return;

      if (tempoAtual <= 1) {
        clearInterval(pomodoroIntervalRef.current);
        setPomodoroRodando(false);

        if (ciclo === 'foco') {
          pausarEstudo();
          Swal.fire({ icon: 'success', title: 'Foco concluído!', text: `${tempoPausa} min de pausa`, timer: 2000, showConfirmButton: false });
          ciclo = 'pausa';
          tempoAtual = tempoPausa * 60;
          setPomodoroTempo(tempoAtual);
          setModoPomodoro('pausa');
          setPomodoroRodando(true);

          setTimeout(() => {
            if (pomodoroRodando) {
              pomodoroIntervalRef.current = setInterval(() => {
                if (!pomodoroRodando) return;
                if (tempoAtual <= 1) {
                  clearInterval(pomodoroIntervalRef.current);
                  setPomodoroRodando(false);
                  Swal.fire({ icon: 'info', title: 'Pausa concluída!', timer: 2000, showConfirmButton: false });
                  setEstudoIdPomodoro(null);
                } else {
                  tempoAtual--;
                  setPomodoroTempo(tempoAtual);
                }
              }, 1000);
            }
          }, 100);
        }
      } else {
        tempoAtual--;
        setPomodoroTempo(tempoAtual);
      }
    }, 1000);
  };

  // ==================== ESTUDO POR MATÉRIA ====================
  const iniciarEstudo = (id) => {
    const materia = materias.find(m => m.id === id);
    if (!materia) return;

    if (estudoAtual && estudoAtual !== id) {
      pausarEstudo();
    }

    setEstudoAtual(id);

    if (!tempoEstudo[id]) {
      setTempoEstudo(prev => ({ ...prev, [id]: { total: 0, historico: {} } }));
    }

    const hoje = new Date().toISOString().split('T')[0];
    setTempoEstudo(prev => {
      const novo = { ...prev };
      if (!novo[id]) novo[id] = { total: 0, historico: {} };
      if (!novo[id].historico) novo[id].historico = {};
      if (!novo[id].historico[hoje]) novo[id].historico[hoje] = 0;
      return novo;
    });

    if (estudoIntervalRef.current) clearInterval(estudoIntervalRef.current);
    estudoIntervalRef.current = setInterval(() => {
      setTempoEstudo(prev => {
        const novo = { ...prev };
        if (novo[id] && novo[id].historico) {
          novo[id].total = (novo[id].total || 0) + 1;
          novo[id].historico[hoje] = (novo[id].historico[hoje] || 0) + 1;
        }
        return novo;
      });
    }, 1000);

    if (notificacoesAtivas) {
      Swal.fire({
        icon: 'success',
        title: `Estudando: ${materia.nome}`,
        text: 'O tempo está sendo contado!',
        timer: 1500,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
      });
    }
  };

  const pausarEstudo = () => {
    if (estudoIntervalRef.current) {
      clearInterval(estudoIntervalRef.current);
      estudoIntervalRef.current = null;
    }
    if (estudoAtual) {
      const materia = materias.find(m => m.id === estudoAtual);
      if (notificacoesAtivas && materia) {
        Swal.fire({
          icon: 'info',
          title: 'Estudo pausado',
          text: `${materia.nome} - Tempo salvo!`,
          timer: 2000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true
        });
      }
    }
    setEstudoAtual(null);
  };

  const finalizarEstudo = () => {
    const materia = estudoAtual ? materias.find(m => m.id === estudoAtual) : null;
    const hoje = new Date().toISOString().split('T')[0];
    const tempoSessao = tempoEstudo[estudoAtual]?.historico?.[hoje] || 0;
    const horas = Math.floor(tempoSessao / 3600);
    const minutos = Math.floor((tempoSessao % 3600) / 60);

    Swal.fire({
      title: 'Finalizar estudo?',
      html: `
        <p>Matéria: <strong>${materia?.nome || 'Desconhecida'}</strong></p>
        <p>Tempo nesta sessão: <strong>${horas}h ${minutos}min</strong></p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, finalizar!',
      cancelButtonText: 'Continuar estudando',
      confirmButtonColor: '#22c55e'
    }).then(result => {
      if (result.isConfirmed) {
        if (estudoIntervalRef.current) {
          clearInterval(estudoIntervalRef.current);
          estudoIntervalRef.current = null;
        }
        setEstudoAtual(null);
        Swal.fire({
          icon: 'success',
          title: 'Estudo finalizado!',
          text: `${materia?.nome} - ${horas}h ${minutos}min registrados!`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  };

  const adicionarMateriaRelogio = () => {
    const nomeInput = document.getElementById('novaMateriaRelogio');
    const nome = nomeInput?.value.trim();
    if (!nome) return;

    const novaMateria = {
      id: 'm' + Date.now(),
      nome: nome,
      cor: '#9f042c'
    };
    setMaterias(prev => [...prev, novaMateria]);
    if (nomeInput) nomeInput.value = '';
    Swal.fire({ icon: 'success', title: 'Matéria adicionada!', timer: 1500, showConfirmButton: false });
  };

  // ==================== METAS ====================
  const calcularHorasEstudadas = (periodo) => {
    const hoje = new Date();
    let totalSegundos = 0;
    const formatarData = (data) => {
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const dia = String(data.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    };

    const hojeStr = formatarData(hoje);
    let dataInicioStr;

    if (periodo === 'diaria') {
      dataInicioStr = hojeStr;
    } else if (periodo === 'semanal') {
      const dataInicio = new Date();
      dataInicio.setDate(hoje.getDate() - 7);
      dataInicioStr = formatarData(dataInicio);
    } else {
      const dataInicio = new Date();
      dataInicio.setDate(hoje.getDate() - 30);
      dataInicioStr = formatarData(dataInicio);
    }

    Object.values(tempoEstudo).forEach(materia => {
      if (typeof materia === 'number') {
        totalSegundos += materia;
      } else if (materia.historico) {
        Object.entries(materia.historico).forEach(([dataStr, segundos]) => {
          if (dataStr >= dataInicioStr && dataStr <= hojeStr) {
            totalSegundos += segundos;
          }
        });
      } else if (materia.total) {
        totalSegundos += materia.total;
      }
    });

    return totalSegundos / 3600;
  };

  const atualizarMeta = () => {
    const metaValor = metas[metaAtiva];
    const totalHoras = calcularHorasEstudadas(metaAtiva);
    const progresso = Math.min((totalHoras / metaValor) * 100, 100);
    const faltam = Math.max(metaValor - totalHoras, 0);

    return { totalHoras, progresso, faltam, metaValor };
  };

  const abrirModalMeta = () => {
    const meta = metas;
    const diariaH = Math.floor(meta.diaria);
    const diariaM = Math.round((meta.diaria - diariaH) * 60);
    const semanalH = Math.floor(meta.semanal);
    const semanalM = Math.round((meta.semanal - semanalH) * 60);
    const mensalH = Math.floor(meta.mensal);
    const mensalM = Math.round((meta.mensal - mensalH) * 60);

    const diariaHorasInput = document.getElementById('metaDiariaHoras');
    const diariaMinutosInput = document.getElementById('metaDiariaMinutos');
    const semanalHorasInput = document.getElementById('metaSemanalHoras');
    const semanalMinutosInput = document.getElementById('metaSemanalMinutos');
    const mensalHorasInput = document.getElementById('metaMensalHoras');
    const mensalMinutosInput = document.getElementById('metaMensalMinutos');

    if (diariaHorasInput) diariaHorasInput.value = diariaH;
    if (diariaMinutosInput) diariaMinutosInput.value = diariaM;
    if (semanalHorasInput) semanalHorasInput.value = semanalH;
    if (semanalMinutosInput) semanalMinutosInput.value = semanalM;
    if (mensalHorasInput) mensalHorasInput.value = mensalH;
    if (mensalMinutosInput) mensalMinutosInput.value = mensalM;

     const plano = localStorage.getItem('planoUsuario') || 'gratuito';
  
  if (plano === 'gratuito') {
    Swal.fire({
      icon: 'info',
      title: 'Recurso Premium',
      html: 'A <strong>Meta de Estudo</strong> está disponível nos planos <strong>Básico</strong> e <strong>Pro</strong>.',
      confirmButtonText: 'Ver Planos',
      confirmButtonColor: '#9f042c',
      showCancelButton: true,
      cancelButtonText: 'Fechar'
    }).then(result => {
      if (result.isConfirmed) {
        window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'planos' }));
      }
    });
    return;
  }

    modalInstanceMeta.current?.show();
  };

  const salvarMeta = () => {
    const diariaHoras = parseInt(document.getElementById('metaDiariaHoras')?.value || 0);
    const diariaMinutos = parseInt(document.getElementById('metaDiariaMinutos')?.value || 0);
    const semanalHoras = parseInt(document.getElementById('metaSemanalHoras')?.value || 0);
    const semanalMinutos = parseInt(document.getElementById('metaSemanalMinutos')?.value || 0);
    const mensalHoras = parseInt(document.getElementById('metaMensalHoras')?.value || 0);
    const mensalMinutos = parseInt(document.getElementById('metaMensalMinutos')?.value || 0);

    const novasMetas = {
      diaria: converterParaHoras(diariaHoras, diariaMinutos),
      semanal: converterParaHoras(semanalHoras, semanalMinutos),
      mensal: converterParaHoras(mensalHoras, mensalMinutos)
    };

    if (novasMetas.diaria <= 0 && novasMetas.semanal <= 0 && novasMetas.mensal <= 0) {
      Swal.fire({ icon: 'warning', title: 'Meta inválida!', text: 'Defina pelo menos 1 minuto para uma das metas.', timer: 2000 });
      return;
    }

    setMetas(novasMetas);
    modalInstanceMeta.current?.hide();
    Swal.fire({
      icon: 'success',
      title: 'Metas atualizadas!',
      html: `
        Diária: ${formatarMeta(novasMetas.diaria)}<br>
        Semanal: ${formatarMeta(novasMetas.semanal)}<br>
        Mensal: ${formatarMeta(novasMetas.mensal)}
      `,
      timer: 2500,
      showConfirmButton: false
    });
  };

  // ==================== RELÓGIO INTELIGENTE ====================
  const obterMateriaAtual = () => {
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const hojeSemana = dias[new Date().getDay()];
    const agora = new Date();
    const horaAtual = String(agora.getHours()).padStart(2, '0') + ':' + String(agora.getMinutes()).padStart(2, '0');

    const blocoAtual = cronograma.find(b =>
      b.dia === hojeSemana &&
      horaAtual >= b.inicio &&
      horaAtual < b.fim
    );

    return blocoAtual || null;
  };

  // ==================== MODO FOCO PERSONALIZADO ====================
  const abrirModalModoFoco = () => {
  const plano = localStorage.getItem('planoUsuario') || 'gratuito';
  
  if (plano === 'gratuito') {
    Swal.fire({
      icon: 'info',
      title: 'Recurso Premium',
      html: 'O <strong>Modo Foco Personalizado</strong> está disponível nos planos <strong>Básico</strong> e <strong>Pro</strong>.',
      confirmButtonText: 'Ver Planos',
      confirmButtonColor: '#9f042c',
      showCancelButton: true,
      cancelButtonText: 'Fechar'
    }).then(result => {
      if (result.isConfirmed) {
        window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'planos' }));
      }
    });
    return;
  }
  
  modalInstanceFoco.current?.show();
};

  const iniciarModoFocoPersonalizado = () => {
    const materiaId = document.getElementById('focoMateriaSelect')?.value;
    const tempoFoco = parseInt(document.getElementById('focoTempoPersonalizado')?.value || 25);

    if (!materiaId) {
      Swal.fire({ icon: 'warning', title: 'Selecione uma matéria!', timer: 1500, showConfirmButton: false });
      return;
    }

    const materia = materias.find(m => m.id === materiaId);
    if (!materia) return;

    modalInstanceFoco.current?.hide();
    iniciarTimerFoco(materia, tempoFoco);
  };

  const iniciarTimerFoco = (materia, tempoMinutos) => {
  let tempoRestante = tempoMinutos * 60;
  let focoAtivo = true;
  let intervalId = null;
  let containerExistente = document.getElementById('modoFocoContainer');
  if (containerExistente) containerExistente.remove();

  const container = document.createElement('div');
  container.id = 'modoFocoContainer';
  container.className = 'modo-foco-overlay';
  container.innerHTML = `
    <div class="modo-foco-card">
      <div class="modo-foco-icon" style="background: ${materia.cor};">
        <i class="bi bi-brain"></i>
      </div>
      <h1 class="modo-foco-titulo">${materia.nome}</h1>
      <div id="focoTimer" class="modo-foco-timer">${String(tempoMinutos).padStart(2, '0')}:00</div>
      <div class="modo-foco-progresso-bg">
        <div id="focoProgresso" class="modo-foco-progresso-bar" style="background: ${materia.cor}; width: 100%;"></div>
      </div>
      <div class="modo-foco-botoes">
        <button id="focoPausarBtn" class="modo-foco-btn modo-foco-btn-pausar">⏸ Pausar</button>
        <button id="focoResetBtn" class="modo-foco-btn modo-foco-btn-reset">🔄 Reset</button>
        <button id="focoSairBtn" class="modo-foco-btn modo-foco-btn-sair">✕ Sair</button>
      </div>
      <p id="focoFrase" class="modo-foco-frase">🎯 Foco total em ${materia.nome}! Você consegue!</p>
    </div>
  `;

  document.body.appendChild(container);

  const timerEl = document.getElementById('focoTimer');
  const progressoEl = document.getElementById('focoProgresso');
  const fraseEl = document.getElementById('focoFrase');
  const pausarBtn = document.getElementById('focoPausarBtn');
  const resetBtn = document.getElementById('focoResetBtn');
  const sairBtn = document.getElementById('focoSairBtn');

  const atualizarDisplay = () => {
    if (timerEl) {
      const minutos = Math.floor(tempoRestante / 60);
      const segundos = tempoRestante % 60;
      timerEl.textContent = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
    }
    if (progressoEl) {
      const progressoPercent = (tempoRestante / (tempoMinutos * 60)) * 100;
      progressoEl.style.width = `${progressoPercent}%`;
    }
    if (fraseEl && focoAtivo) {
      if (tempoRestante > (tempoMinutos * 60) * 0.8) {
        fraseEl.textContent = `🚀 Começando com tudo! Mantenha o foco em ${materia.nome}!`;
      } else if (tempoRestante > (tempoMinutos * 60) * 0.5) {
        fraseEl.textContent = `💪 Continue assim! Você está indo bem!`;
      } else if (tempoRestante > 60) {
        fraseEl.textContent = `🎯 Quase lá! Mais um pouco!`;
      } else if (tempoRestante > 0) {
        fraseEl.textContent = `⚡ Último minuto! Dá pra finalizar com força!`;
      }
    }
  };

  intervalId = setInterval(() => {
    if (!focoAtivo) return;
    if (tempoRestante > 0) {
      tempoRestante--;
      atualizarDisplay();
    } else {
      clearInterval(intervalId);
      iniciarEstudo(materia.id);
      Swal.fire({
        icon: 'success',
        title: '🎉 Tempo concluído!',
        text: `Parabéns! Você focou ${tempoMinutos} minutos em ${materia.nome}!`,
        timer: 3000,
        showConfirmButton: false
      });
      setTimeout(() => container.remove(), 3000);
    }
  }, 1000);

  if (pausarBtn) {
    pausarBtn.onclick = () => {
      focoAtivo = !focoAtivo;
      pausarBtn.textContent = focoAtivo ? '⏸ Pausar' : '▶ Continuar';
      if (fraseEl) {
        fraseEl.textContent = focoAtivo 
          ? `🎯 Foco total em ${materia.nome}!` 
          : '⏸ Pausado. Respire fundo e volte quando estiver pronto!';
      }
    };
  }

  if (resetBtn) {
    resetBtn.onclick = () => {
      tempoRestante = tempoMinutos * 60;
      focoAtivo = true;
      atualizarDisplay();
      if (pausarBtn) pausarBtn.textContent = '⏸ Pausar';
      if (fraseEl) fraseEl.textContent = '🔄 Timer resetado! Vamos começar de novo!';
    };
  }

  if (sairBtn) {
    sairBtn.onclick = () => {
      if (intervalId) clearInterval(intervalId);
      container.remove();
    };
  }

  atualizarDisplay();
  iniciarEstudo(materia.id);
};
  // Inicializar modais Bootstrap
  useEffect(() => {
    if (window.bootstrap) {
      if (modalPomodoroRef.current) modalInstancePomodoro.current = new window.bootstrap.Modal(modalPomodoroRef.current);
      if (modalFocoRef.current) modalInstanceFoco.current = new window.bootstrap.Modal(modalFocoRef.current);
      if (modalMetaRef.current) modalInstanceMeta.current = new window.bootstrap.Modal(modalMetaRef.current);
    }
  }, []);

  // Renderização da tabela de matérias
  const renderTabelaMaterias = () => {
    const hoje = new Date().toISOString().split('T')[0];
    return (
      <table className="tabela-estudo">
        <thead>
          <tr><th>Matéria</th><th>Tempo Estudado</th><th>Ação</th></tr>
        </thead>
        <tbody>
          {materias.length === 0 ? (
            <tr><td colSpan="3" style={{ textAlign: 'center' }}>Nenhuma matéria cadastrada</td></tr>
          ) : (
            materias.map(m => {
              const dados = tempoEstudo[m.id];
              let tempoSegundos = 0;
              if (dados) {
                if (typeof dados === 'number') tempoSegundos = dados;
                else if (dados.historico && dados.historico[hoje]) tempoSegundos = dados.historico[hoje];
                else if (dados.total) tempoSegundos = dados.total;
              }
              const isEstudando = estudoAtual === m.id;
              return (
                <tr key={m.id} style={{ background: isEstudando ? '#fef2f2' : 'transparent' }}>
                  <td>{m.nome} {isEstudando && <span style={{ color: '#22c55e' }}> ● Estudando</span>}</td>
                  <td>{formatarTempo(tempoSegundos)}</td>
                  <td>
                    {isEstudando ? (
                      <>
                        <button onClick={pausarEstudo} style={{ background: '#f59e0b' }}>⏸</button>
                        <button onClick={finalizarEstudo} style={{ background: '#ef4444' }}>⏹ Finalizar</button>
                      </>
                    ) : (
                      <button onClick={() => iniciarEstudo(m.id)} style={{ background: '#22c55e' }}>▶ Iniciar</button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    );
  };

  const { totalHoras, progresso, faltam, metaValor } = atualizarMeta();

  return (
    <section id="relogioSection">
      <h1>Relógio de Estudos</h1>

      {/* Adicionar Matéria */}
      <div className="add-materia-relogio">
        <input type="text" id="novaMateriaRelogio" placeholder="Nova matéria" />
        <button onClick={adicionarMateriaRelogio}>Adicionar</button>
      </div>

      {/* Estudo por Matéria */}
      <h3 className="titulo-materia">Estudo por Matéria</h3>
      {renderTabelaMaterias()}

      {/* Cards: Timer, Cronômetro, Pomodoro, Modo Foco */}
      <div className="relogio-container">
        {/* TIMER */}
        <div className="relogio-card">
          <h3><i className="bi bi-hourglass-split"></i> Timer</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <input type="number" id="timerMinutos" placeholder="00" min="0" max="99" style={{ width: '55px', textAlign: 'center' }} />
              <small style={{ display: 'block', fontSize: '0.65rem' }}>Min</small>
            </div>
            <span style={{ fontSize: '1.2rem' }}>:</span>
            <div style={{ textAlign: 'center' }}>
              <input type="number" id="timerSegundos" placeholder="00" min="0" max="59" style={{ width: '55px', textAlign: 'center' }} />
              <small style={{ display: 'block', fontSize: '0.65rem' }}>Seg</small>
            </div>
          </div>
          <div className="relogio-botoes">
            <button onClick={iniciarTimer}>Iniciar</button>
            <button onClick={pararTimer}>Parar</button>
            <button onClick={resetarTimer}>Reset</button>
          </div>
          <p id="timerDisplay">{formatarTempoCurto(timerTempo)}</p>
        </div>

        {/* CRONÔMETRO */}
        <div className="relogio-card">
          <h3><i className="bi bi-stopwatch"></i> Cronômetro</h3>
          <p id="cronometroDisplay">{formatarTempo(cronometro)}</p>
          <div className="relogio-botoes">
            <button onClick={iniciarCronometro}>Iniciar</button>
            <button onClick={pausarCronometro}>Pausar</button>
            <button onClick={resetarCronometro}>Reset</button>
          </div>

          {/* Acordeão do Histórico */}
          <div style={{ width: '100%', marginTop: '10px', textAlign: 'left' }}>
            <div onClick={() => setAcordeonAberto(!acordeonAberto)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                Histórico <span style={{ color: 'var(--cor-primaria)' }}>({historicoCronometro.length})</span>
              </span>
              <span style={{ fontSize: '0.7rem' }}>{acordeonAberto ? '▼' : '▶'}</span>
            </div>
            {acordeonAberto && (
              <div style={{ maxHeight: '150px', overflowY: 'auto', marginTop: '5px' }}>
                <div style={{ fontSize: '0.75rem' }}>
                  {historicoCronometro.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '10px' }}>Nenhum tempo registrado</p>
                  ) : (
                    historicoCronometro.map(reg => (
                      <div key={reg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #f3f4f6' }}>
                        <div>
                          <div style={{ fontWeight: '600' }}>{reg.tempoFormatado}</div>
                          <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{reg.data} às {reg.hora}</div>
                        </div>
                        <button onClick={() => excluirRegistroCronometro(reg.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))
                  )}
                </div>
                <button onClick={limparHistoricoCronometro} style={{ width: '100%', marginTop: '6px', padding: '5px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem' }}>
                  Limpar histórico
                </button>
              </div>
            )}
          </div>
        </div>

        {/* POMODORO */}
        <div className="relogio-card">
          <h3><i className="bi bi-circle-fill" style={{ color: '#ef4444', fontSize: '0.8rem' }}></i> Pomodoro</h3>
          <p id="pomodoroDisplay">{formatarTempoCurto(pomodoroTempo)}</p>
          <div className="relogio-botoes">
            <button onClick={abrirModalPomodoro}>Iniciar</button>
            <button onClick={pausarPomodoro}>Pausar</button>
            <button onClick={resetarPomodoro}>Reset</button>
          </div>
        </div>

        {/* MODO FOCO */}
        <div className="relogio-card">
          <h3><i className="bi bi-lightbulb"></i> Modo Foco</h3>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '15px 0' }}>Foco total em uma matéria com tempo personalizado</p>
          <div className="relogio-botoes">
            <button onClick={abrirModalModoFoco}>Iniciar Foco</button>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '10px' }}>25 min padrão</p>
        </div>
      </div>

      {/* Relógio Inteligente + Meta */}
      <div className="relogio-duas-colunas">
        {/* Relógio Inteligente */}
        <div id="relogioInfo" className="relogio-info-card">
          <div className="relogio-topo">
            <h2 id="materiaRelogio">{obterMateriaAtual()?.materia?.nome || 'Nenhuma matéria'}</h2>
            <p id="horarioRelogio">{obterMateriaAtual() ? `${obterMateriaAtual().inicio} - ${obterMateriaAtual().fim}` : '--:-- - --:--'}</p>
          </div>
          <div className="relogio-meio">
            <p id="tempoRestante">aguardando...</p>
          </div>
          <div className="relogio-stats">
            <div className="stat">
              <span>Hoje</span>
              <strong id="tempoHoje">{formatarTempo(totalHoras * 3600)}</strong>
            </div>
            <div className="stat">
              <span>Streak</span>
              <strong id="streakRelogio">{localStorage.getItem('streak') || 0} dias</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '15px', width: '100%' }}>
            <button onClick={() => setModoEstudo('auto')} style={{ flex: 1, padding: '10px', borderRadius: '40px', border: 'none', background: 'var(--cor-primaria)', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
              Modo Automático
            </button>
            <button onClick={() => setModoEstudo('manual')} style={{ flex: 1, padding: '10px', borderRadius: '40px', border: '2px solid var(--cor-primaria)', background: 'white', color: 'var(--cor-primaria)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
              Pausar Automático
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '12px', padding: '8px 12px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '0.75rem', color: '#374151' }}>Notificar ao iniciar matéria</span>
            <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px', cursor: 'pointer' }}>
              <input type="checkbox" checked={notificacoesAtivas} onChange={(e) => setNotificacoesAtivas(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: notificacoesAtivas ? '#22c55e' : '#d1d5db', borderRadius: '22px', transition: '0.3s' }}>
                <span style={{ position: 'absolute', height: '18px', width: '18px', left: notificacoesAtivas ? '19px' : '3px', bottom: '2px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s' }}></span>
              </span>
            </label>
          </div>

          <p id="statusModoAuto" style={{ fontSize: '0.75rem', marginTop: '10px', textAlign: 'center', color: modoEstudo === 'auto' ? '#22c55e' : '#f59e0b' }}>
            {modoEstudo === 'auto' ? 'Modo automático ativo - Seguindo o cronograma' : 'Modo automático pausado - Controle manual ativo'}
          </p>

          <div style={{ marginTop: '12px', padding: '10px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', width: '100%' }}>
            <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0, textAlign: 'left' }}>
              <strong>Conectado ao Cronograma:</strong> Este relógio identifica automaticamente qual matéria você deveria estar estudando agora, baseado no dia da semana e horário.
            </p>
          </div>
        </div>

        {/* Meta de Estudo */}
        <div id="metaCard" className="meta-card-escuro">
          <div className="meta-header-escuro">
            <h3>Meta de Estudo</h3>
            <button className="btn-editar-meta-escuro" onClick={abrirModalMeta}>
              <i className="bi bi-pencil-fill"></i>
            </button>
          </div>
          <div className="meta-tipo-selector">
            {['diaria', 'semanal', 'mensal'].map(tipo => (
              <button key={tipo} className={`meta-tipo-btn ${metaAtiva === tipo ? 'active' : ''}`} onClick={() => setMetaAtiva(tipo)}>
                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </button>
            ))}
          </div>
          <div className="meta-conteudo">
            <p id="metaTextoResumo" className="meta-texto-resumo">
              {progresso >= 100 ? `✅ Meta batida! ${totalHoras.toFixed(1)}h de ${formatarMeta(metaValor)}` :
               progresso >= 75 ? `🎯 Quase lá! ${totalHoras.toFixed(1)}h de ${formatarMeta(metaValor)}` :
               progresso >= 50 ? `📚 Na metade! ${totalHoras.toFixed(1)}h de ${formatarMeta(metaValor)}` :
               progresso > 0 ? `🚀 Começando! ${totalHoras.toFixed(1)}h de ${formatarMeta(metaValor)}` :
               `📖 Nenhum estudo ainda. Meta: ${formatarMeta(metaValor)}`}
            </p>
            <div className="meta-progresso-escuro">
              <div id="metaBarraResumo" className={`meta-barra-escuro ${progresso >= 100 ? 'alta' : progresso >= 50 ? 'media' : 'baixa'}`} style={{ width: `${progresso}%` }}></div>
            </div>
            <p id="metaRestanteResumo" className="meta-restante-escuro">
              {faltam <= 0 ? '✅ Concluído!' : `⏳ Faltam ${formatarMeta(faltam)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Modal Pomodoro */}
      <div className="modal fade" id="modalPomodoro" ref={modalPomodoroRef} tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Personalizar Pomodoro</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-bold">Matéria</label>
                <select id="pomodoroMateria" className="form-select">
                  <option value="">Selecione uma matéria</option>
                  {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">⏱ Tempo de Estudo (minutos)</label>
                <input type="number" id="pomodoroTempoEstudo" className="form-control" defaultValue="25" min="1" max="120" />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">☕ Tempo de Pausa (minutos)</label>
                <input type="number" id="pomodoroTempoPausa" className="form-control" defaultValue="5" min="1" max="30" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={iniciarPomodoroPersonalizado}>Iniciar Pomodoro</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Modo Foco */}
      <div className="modal fade" id="modalModoFoco" ref={modalFocoRef} tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">🧠 Personalizar Modo Foco</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-bold">📚 Matéria</label>
                <select id="focoMateriaSelect" className="form-select">
                  <option value="">Selecione uma matéria</option>
                  {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">⏱ Tempo de Foco (minutos)</label>
                <input type="number" id="focoTempoPersonalizado" className="form-control" defaultValue="25" min="1" max="120" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={iniciarModoFocoPersonalizado}>Iniciar Foco</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Meta */}
      <div className="modal fade" id="modalMeta" ref={modalMetaRef} tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Definir Metas de Estudo</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-bold">Meta Diária</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <input type="number" id="metaDiariaHoras" className="form-control" defaultValue="0" min="0" max="24" style={{ width: '80px' }} />
                    <small>Horas</small>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <input type="number" id="metaDiariaMinutos" className="form-control" defaultValue="30" min="0" max="59" style={{ width: '80px' }} />
                    <small>Minutos</small>
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Meta Semanal</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <input type="number" id="metaSemanalHoras" className="form-control" defaultValue="3" min="0" max="168" style={{ width: '80px' }} />
                    <small>Horas</small>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <input type="number" id="metaSemanalMinutos" className="form-control" defaultValue="30" min="0" max="59" style={{ width: '80px' }} />
                    <small>Minutos</small>
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Meta Mensal</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <input type="number" id="metaMensalHoras" className="form-control" defaultValue="14" min="0" max="720" style={{ width: '80px' }} />
                    <small>Horas</small>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <input type="number" id="metaMensalMinutos" className="form-control" defaultValue="0" min="0" max="59" style={{ width: '80px' }} />
                    <small>Minutos</small>
                  </div>
                </div>
              </div>
              <div className="alert alert-info mt-3">
                <i className="bi bi-lightbulb"></i> Dica: Comece com metas realistas e aumente aos poucos!
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={salvarMeta}>Salvar Metas</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}